const http = require("http");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 5174);
const ORDERS_FILE = path.join(ROOT, "bot", "data", "orders.json");

loadEnv(path.join(ROOT, "bot", ".env"));
ensureOrdersFile();

const MIME = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".mov": "video/quicktime",
	".mp4": "video/mp4",
	".woff": "font/woff",
	".woff2": "font/woff2",
};

const server = http.createServer(async (req, res) => {
	const url = new URL(req.url, `http://${req.headers.host}`);

	if (req.method === "OPTIONS") {
		res.writeHead(204, corsHeaders());
		return res.end();
	}

	if (req.method === "GET" && url.pathname === "/api/health") {
		return json(res, 200, { ok: true });
	}

	if (req.method === "POST" && url.pathname === "/api/orders") {
		try {
			const order = JSON.parse(await readBody(req));
			if (!order.orderId || !Array.isArray(order.items)) {
				return json(res, 400, { ok: false, error: "Bad order payload" });
			}

			const orders = readOrders();
			orders[order.orderId] = {
				...order,
				status: order.status || "created",
				updatedAt: new Date().toISOString(),
			};
			writeOrders(orders);
			const orderText = `Новый заказ ${order.orderId}\n\n${formatOrder(order)}`;
			dispatchOrderNotifications(order, orderText);
			return json(res, 200, { ok: true, orderId: order.orderId });
		} catch (error) {
			return json(res, 500, { ok: false, error: error.message });
		}
	}

	if (req.method === "GET" && url.pathname.startsWith("/api/orders/")) {
		const orderId = decodeURIComponent(
			url.pathname.replace("/api/orders/", ""),
		);
		const order = readOrders()[orderId];
		return order
			? json(res, 200, { ok: true, order })
			: json(res, 404, { ok: false });
	}

	if (req.method !== "GET" && req.method !== "HEAD") {
		res.writeHead(405);
		return res.end();
	}

	serveStatic(url.pathname, res);
});

server.listen(PORT, () => {
	console.log(`Farshiki store: http://127.0.0.1:${PORT}/`);
	console.log("Orders API: POST /api/orders");
	if (process.env.BOT_TOKEN && process.env.RUN_BOT !== "false") {
		require("./bot/farshiki-bot");
	}
});

function serveStatic(pathname, res) {
	const clean = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
	const filePath = safePath(clean);
	if (!filePath) {
		res.writeHead(403);
		return res.end("Forbidden");
	}

	fs.readFile(filePath, (error, data) => {
		if (error) {
			fs.readFile(
				path.join(ROOT, "index.html"),
				(fallbackError, fallbackData) => {
					if (fallbackError) {
						res.writeHead(404);
						return res.end("Not found");
					}
					res.writeHead(200, { "Content-Type": MIME[".html"] });
					res.end(fallbackData);
				},
			);
			return;
		}

		const ext = path.extname(filePath).toLowerCase();
		res.writeHead(200, {
			"Content-Type": MIME[ext] || "application/octet-stream",
		});
		res.end(data);
	});
}

function safePath(requestPath) {
	const resolved = path.resolve(ROOT, "." + requestPath);
	return resolved.startsWith(ROOT) ? resolved : null;
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		let body = "";
		req.on("data", (chunk) => {
			body += chunk;
			if (body.length > 1_000_000) {
				req.destroy();
				reject(new Error("Request body too large"));
			}
		});
		req.on("end", () => resolve(body));
		req.on("error", reject);
	});
}

function ensureOrdersFile() {
	fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true });
	if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "{}\n");
}

function readOrders() {
	ensureOrdersFile();
	return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8") || "{}");
}

function writeOrders(orders) {
	fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2) + "\n");
}

function json(res, status, payload) {
	res.writeHead(status, {
		"Content-Type": "application/json; charset=utf-8",
		...corsHeaders(),
	});
	res.end(JSON.stringify(payload));
}

function corsHeaders() {
	return {
		"Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	};
}

function formatOrder(order) {
	const customer = order.customer || {};
	const items = (order.items || [])
		.map((item) => {
			const options = Object.values(item.options || {})
				.filter(Boolean)
				.join(" / ");
			return `- ${item.title}${options ? `, ${options}` : ""} x${item.qty}: ${formatMoney(item.total)}`;
		})
		.join("\n");
	return [
		`Клиент: ${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
		`Телефон: ${customer.phone || "-"}`,
		`Email: ${customer.email || "-"}`,
		`Город: ${customer.city || "-"}`,
		`Индекс: ${customer.postalCode || "-"}`,
		`Адрес: ${customer.street || "-"}, дом ${customer.house || "-"}, кв/офис ${customer.apartment || "-"}`,
		`Корпус/подъезд: ${customer.building || "-"}`,
		`Доставка: ${customer.delivery || "-"}`,
		`Комментарий: ${customer.comment || "-"}`,
		"",
		items,
		"",
		`Итого: ${formatMoney(order.total)}`,
		"Доставка оплачивается отдельно.",
	].join("\n");
}

function formatMoney(value) {
	return new Intl.NumberFormat("ru-RU").format(Number(value || 0)) + " ₽";
}

async function notifyAdmin(text) {
	const chatIds = (process.env.TELEGRAM_CHAT_ID || process.env.ADMIN_CHAT_ID || "")
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);
	if (!process.env.BOT_TOKEN || !chatIds.length) return;
	await Promise.all(
		chatIds.map((chatId) =>
			fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: chatId,
					text,
				}),
			}).catch(() => {}),
		),
	);
}

function dispatchOrderNotifications(order, orderText) {
	Promise.all([notifyAdmin(orderText), notifyCustomer(order, orderText)]).catch(
		(error) => {
			console.error("Order notification failed:", error.message);
		},
	);
}

async function notifyCustomer(order, orderText) {
	const customer = order.customer || {};
	if (!customer.email || !process.env.SMTP_HOST) return;
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT || 587),
		secure: process.env.SMTP_SECURE === "true",
		auth:
			process.env.SMTP_USER && process.env.SMTP_PASS
				? {
						user: process.env.SMTP_USER,
						pass: process.env.SMTP_PASS,
					}
				: undefined,
	});
	await transporter
		.sendMail({
			from: process.env.MAIL_FROM || process.env.SMTP_USER || "farshiki store",
			to: customer.email,
			replyTo: process.env.MAIL_REPLY_TO || process.env.MAIL_FROM || undefined,
			subject: `Заказ ${order.orderId} принят`,
			text: [
				"Спасибо за заказ. Мы получили заявку и скоро свяжемся с тобой.",
				"",
				orderText,
			].join("\n"),
		})
		.catch(() => {});
}

function loadEnv(filePath) {
	if (!fs.existsSync(filePath)) return;
	const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const index = trimmed.indexOf("=");
		if (index === -1) continue;
		const key = trimmed.slice(0, index).trim();
		const value = trimmed
			.slice(index + 1)
			.trim()
			.replace(/^["']|["']$/g, "");
		if (!process.env[key]) process.env[key] = value;
	}
}
