const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENV_FILE = path.join(__dirname, ".env");
const ORDERS_FILE = path.join(__dirname, "data", "orders.json");

loadEnv(ENV_FILE);
ensureOrdersFile();

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!BOT_TOKEN) {
	console.error("BOT_TOKEN is required. Create bot/.env from bot/.env.example");
	process.exit(1);
}

let offset = 0;

console.log("Farshiki bot started.");
poll();

async function poll() {
	while (true) {
		try {
			const updates = await api("getUpdates", {
				offset,
				timeout: 25,
				allowed_updates: ["message", "callback_query"],
			});

			for (const update of updates.result || []) {
				offset = update.update_id + 1;
				if (update.message) await onMessage(update.message);
				if (update.callback_query) await onCallback(update.callback_query);
			}
		} catch (error) {
			console.error("Polling error:", error.message);
			await delay(2000);
		}
	}
}

async function onMessage(message) {
	const text = (message.text || "").trim();
	const chatId = message.chat.id;

	if (text.startsWith("/start")) {
		const payload = text.split(/\s+/)[1] || "";
		const orderId = payload.replace(/^order_/, "");
		if (!orderId)
			return sendMessage(
				chatId,
				"Привет. Оформи заказ на сайте, и я покажу здесь оплату.",
			);
		return showOrder(chatId, orderId);
	}

	if (text.startsWith("/paid") && isAdmin(chatId)) {
		const orderId = text.split(/\s+/)[1];
		return markPaid(orderId, chatId);
	}

	if (text === "/orders" && isAdmin(chatId)) {
		const orders = Object.values(readOrders())
			.filter((order) => order.status !== "paid")
			.slice(-10)
			.map(
				(order) =>
					`${order.orderId} - ${order.status || "created"} - ${formatMoney(order.total)}`,
			)
			.join("\n");
		return sendMessage(chatId, orders || "Активных заказов нет.");
	}

	if (message.photo || message.document) {
		return sendMessage(
			chatId,
			"Чек получил. Менеджер проверит оплату и подтвердит заказ.",
		);
	}

	return sendMessage(
		chatId,
		"Напиши /start с номером заказа или пришли чек после оплаты.",
	);
}

async function onCallback(query) {
	const chatId = query.message.chat.id;
	const [action, orderId] = String(query.data || "").split(":");
	await api("answerCallbackQuery", { callback_query_id: query.id });

	if (action === "paid") {
		const orders = readOrders();
		const order = orders[orderId];
		if (!order) return sendMessage(chatId, "Заказ не найден.");
		order.status = "awaiting_check";
		order.telegramChatId = chatId;
		order.updatedAt = new Date().toISOString();
		writeOrders(orders);
		await sendMessage(
			chatId,
			"Ок, отметил. Пришли сюда чек или скрин оплаты, менеджер проверит и подтвердит заказ.",
		);
		return notifyAdmin(
			`Клиент отметил оплату\n${formatOrder(order)}\n\nПодтвердить: /paid ${order.orderId}`,
		);
	}

	if (action === "admin_paid" && isAdmin(chatId)) {
		return markPaid(orderId, chatId);
	}
}

async function showOrder(chatId, orderId) {
	const orders = readOrders();
	const order = orders[orderId];
	if (!order) {
		return sendMessage(
			chatId,
			"Заказ пока не найден. Запусти сайт через `npm start`, оформи заказ еще раз и перейди сюда по кнопке оплаты.",
			{ parse_mode: "Markdown" },
		);
	}

	order.telegramChatId = chatId;
	order.status = order.status === "paid" ? "paid" : "waiting_payment";
	order.updatedAt = new Date().toISOString();
	writeOrders(orders);

	const keyboard = [];
	const paymentUrl = buildPaymentUrl(order);
	if (paymentUrl) keyboard.push([{ text: "Оплатить", url: paymentUrl }]);
	keyboard.push([
		{ text: "Я оплатил", callback_data: `paid:${order.orderId}` },
	]);

	await sendMessage(chatId, formatOrder(order), {
		reply_markup: { inline_keyboard: keyboard },
	});
}

async function markPaid(orderId, adminChatId) {
	if (!orderId)
		return sendMessage(adminChatId, "Укажи номер: /paid FS-1234567");
	const orders = readOrders();
	const order = orders[orderId];
	if (!order) return sendMessage(adminChatId, "Заказ не найден.");

	order.status = "paid";
	order.paidAt = new Date().toISOString();
	order.updatedAt = order.paidAt;
	writeOrders(orders);

	await sendMessage(adminChatId, `Оплата подтверждена: ${order.orderId}`);
	if (order.telegramChatId) {
		await sendMessage(
			order.telegramChatId,
			`Оплата подтверждена.\nЗаказ ${order.orderId} принят в работу.`,
		);
	}
	await sendOrderEmails(order);
}

function buildPaymentUrl(order) {
	const template = process.env.PAYMENT_URL_TEMPLATE;
	if (!template) return "";
	return template
		.replaceAll("{orderId}", encodeURIComponent(order.orderId))
		.replaceAll("{amount}", encodeURIComponent(String(order.total)))
		.replaceAll("{amountRub}", encodeURIComponent(formatMoney(order.total)))
		.replaceAll(
			"{phone}",
			encodeURIComponent(process.env.RECIPIENT_PHONE || ""),
		);
}

function formatOrder(order) {
	const customer = order.customer || {};
	const items = (order.items || [])
		.map((item) => {
			const options =
				Object.values(item.options || {})
					.filter(Boolean)
					.join(" / ") || "без параметров";
			return `- ${item.title}, ${options}, x${item.qty}: ${formatMoney(item.total)}`;
		})
		.join("\n");

	const recipient = [
		process.env.RECIPIENT_NAME
			? `Получатель: ${process.env.RECIPIENT_NAME}`
			: "",
		process.env.RECIPIENT_BANK ? `Банк: ${process.env.RECIPIENT_BANK}` : "",
		process.env.RECIPIENT_PHONE
			? `Телефон СБП: ${process.env.RECIPIENT_PHONE}`
			: "",
	]
		.filter(Boolean)
		.join("\n");

	return [
		`Заказ ${order.orderId}`,
		"",
		"Состав:",
		items,
		"",
		`Итого за товары: ${formatMoney(order.total)}`,
		"Доставка оплачивается отдельно после согласования.",
		recipient ? `\nОплата:\n${recipient}` : "",
	]
		.filter(Boolean)
		.join("\n");
}

async function notifyAdmin(text) {
	if (!ADMIN_CHAT_ID) return;
	await sendMessage(ADMIN_CHAT_ID, text);
}

async function sendOrderEmails(order) {
	if (!process.env.SMTP_HOST) return;
	let nodemailer;
	try {
		nodemailer = require("nodemailer");
	} catch {
		console.warn("Install dependencies first: npm install");
		return;
	}

	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT || 587),
		secure: process.env.SMTP_SECURE === "true",
		auth: process.env.SMTP_USER
			? {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASS,
				}
			: undefined,
	});

	const customerEmail = order.customer?.email;
	const subject = `Заказ ${order.orderId} оплачен`;
	const text = `${formatOrder(order)}\n\nСтатус: оплата подтверждена.`;
	const from = process.env.MAIL_FROM || process.env.SMTP_USER;

	if (customerEmail)
		await transporter.sendMail({ from, to: customerEmail, subject, text });
	if (process.env.STORE_EMAIL)
		await transporter.sendMail({
			from,
			to: process.env.STORE_EMAIL,
			subject,
			text,
		});
}

async function sendMessage(chatId, text, extra = {}) {
	return api("sendMessage", {
		chat_id: chatId,
		text,
		...extra,
	});
}

async function api(method, payload = {}) {
	const response = await fetch(
		`https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		},
	);
	const data = await response.json();
	if (!data.ok) throw new Error(data.description || method);
	return data;
}

function isAdmin(chatId) {
	return ADMIN_CHAT_ID && String(chatId) === String(ADMIN_CHAT_ID);
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

function formatMoney(value) {
	return new Intl.NumberFormat("ru-RU").format(Number(value || 0)) + " ₽";
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

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
