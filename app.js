const BOT_USERNAME = "farshikistore";
const STORE_EMAIL = "farsh.inc@hotmail.com";
const INSTAGRAM_URL = "https://www.instagram.com/farsh.prod/";
const TELEGRAM_URL = "https://t.me/farshikistore";
const TELEGRAM_HANDLE = "@farshikistore";
const API_BASE_URL = "https://farshiki.onrender.com";

const products = [
	{
		slug: "hoodie-base-black",
		title: "Худи BASE Black",
		price: 4990,
		collection: "staple",
		tags: ["apparel", "popular"],
		options: { size: ["S", "M", "L", "XL"] },
		description:
			"Плотное черное худи BASE Black для города, дороги и холодных вечеров. Мягкий микроначес с пич-эффектом дает приятную посадку к телу, а состав с высоким содержанием хлопка держит форму и ощущается уверенно каждый день.",
		details: [
			"Плотность ткани: 380 г/м2",
			"Состав: 88% хлопок, 12% полиэстер",
			"Микроначес с пич-эффектом",
			"Свободная посадка",
			"Принт спереди и на спине",
		],
		cardImages: [
			{
				src: "./assets/products/base-black-card-1.jpg",
				label: "Худи BASE Black",
			},
			{
				src: "./assets/products/base-black-card-2.jpg",
				label: "Худи BASE Black",
			},
		],
		images: [
			{ src: "./assets/products/base-black-1.JPG", label: "Худи BASE Black" },
			{ src: "./assets/products/base-black-2.JPG", label: "ВИД СЗАДИ" },
			{ src: "./assets/products/base-black-3.JPG", label: "НА ДОРОГЕ" },
			{ src: "./assets/products/base-black-4.JPG", label: "ДЕТАЛЬ" },
			{ src: "./assets/products/hoodie-size-chart.png", label: "РАЗМЕРНАЯ СЕТКА" },
		],
	},
	{
		slug: "hoodie-base-pink",
		title: "Худи BASE Pink",
		price: 4990,
		collection: "staple",
		tags: ["apparel", "popular"],
		options: { size: ["S", "M", "L", "XL"] },
		description:
			"Плотное розовое худи BASE Pink для города, дороги и холодных вечеров. Мягкий микроначес с пич-эффектом дает приятную посадку к телу, а состав с высоким содержанием хлопка держит форму и ощущается уверенно каждый день.",
		details: [
			"Плотность ткани: 380 г/м2",
			"Состав: 88% хлопок, 12% полиэстер",
			"Микроначес с пич-эффектом",
			"Свободная посадка",
			"Принт спереди и на спине",
		],
		cardImages: [
			{
				src: "./assets/products/base-pink-card-1.jpg",
				label: "Худи BASE Pink",
			},
			{
				src: "./assets/products/base-pink-card-2.jpg",
				label: "Худи BASE Pink",
			},
		],
		images: [
			{ src: "./assets/products/base-pink-1.jpg", label: "Худи BASE Pink" },
			{ src: "./assets/products/base-pink-2.jpg", label: "ДЕТАЛЬ" },
			{ src: "./assets/products/base-pink-3.jpg", label: "ОБРАЗ" },
			{ src: "./assets/products/hoodie-size-chart.png", label: "РАЗМЕРНАЯ СЕТКА" },
		],
	},
	{
		slug: "black-keychain",
		title: "Брелок черный",
		price: 550,
		collection: "accessories",
		tags: ["accessories"],
		options: {},
		description:
			"Черный тканевый брелок FARSHIKI для ключей, сумки или экипировки. Небольшая деталь, которая добавляет образу характер и остается заметной каждый день.",
		details: [
			"Плотная тканевая основа",
			"Контрастная вышивка",
			"Металлическое кольцо",
			"Легкий вес",
			"Подходит для ключей, сумки или рюкзака",
		],
		cardImages: [
			{ src: "./assets/products/jet-tags.jpg", label: "Брелок черный" },
		],
		images: [{ src: "./assets/products/jet-tags.jpg", label: "Брелок черный" }],
	},
	{
		slug: "white-keychain",
		title: "Брелок белый",
		price: 550,
		collection: "accessories",
		tags: ["accessories"],
		options: {},
		description:
			"Белый тканевый брелок FARSHIKI с чистым контрастным акцентом. Легко цепляется к ключам, сумке или рюкзаку и спокойно собирает комплект в одну историю.",
		details: [
			"Плотная тканевая основа",
			"Контрастная вышивка",
			"Металлическое кольцо",
			"Легкий вес",
			"Подходит для ключей, сумки или рюкзака",
		],
		cardImages: [
			{ src: "./assets/products/jet-tags.jpg", label: "Брелок белый" },
		],
		images: [{ src: "./assets/products/jet-tags.jpg", label: "Брелок белый" }],
	},
];

const collections = [
	{ slug: "store", title: "МАГАЗИН", filter: () => true },
	{ slug: "staple", title: "МЕРЧ", filter: (p) => p.collection === "staple" },
	{
		slug: "accessories",
		title: "АКСЕССУАРЫ",
		filter: (p) => p.tags.includes("accessories"),
	},
	{
		slug: "apparel",
		title: "ОДЕЖДА",
		filter: (p) => p.tags.includes("apparel"),
	},
	{
		slug: "popular-picks",
		title: "ПОПУЛЯРНОЕ",
		filter: (p) => p.tags.includes("popular"),
	},
	{ slug: "sale", title: "SALE", filter: () => false },
];

const instagramMedia = [
	{ type: "video", src: "./assets/media/insta-ride-01.mov", label: "FARSHIKI ride" },
	{ type: "image", src: "./assets/media/insta-helmet-pink.jpg", label: "Розовый мерч FARSHIKI" },
	{ type: "video", src: "./assets/media/insta-ride-02.mp4", label: "FARSHIKI video" },
	{ type: "image", src: "./assets/media/insta-night-portrait.jpg", label: "Черный мерч FARSHIKI" },
	{ type: "image", src: "./assets/media/insta-gas-station.jpg", label: "FARSHIKI на заправке" },
	{ type: "image", src: "./assets/media/insta-ride-dark.png", label: "FARSHIKI dark ride" },
	{ type: "video", src: "./assets/media/insta-ride-03.mp4", label: "FARSHIKI ночной заезд" },
	{ type: "image", src: "./assets/media/insta-night-back.jpg", label: "Ride hard or stay home" },
	{ type: "image", src: "./assets/media/insta-helmet-close.jpg", label: "FARSHIKI helmet close" },
	{ type: "image", src: "./assets/media/insta-night-street.jpg", label: "FARSHIKI night street" },
];

const state = {
	cart: JSON.parse(localStorage.getItem("farshiki-cart") || "[]"),
	selectedOptions: {},
	qty: 1,
	checkout: false,
	productSlides: {},
};

let instagramCarouselTimer = null;

const app = document.querySelector("#app");
const overlay = document.querySelector("[data-overlay]");
const drawer = document.querySelector("[data-cart-drawer]");
const searchPanel = document.querySelector("[data-search-panel]");
const searchInput = document.querySelector("#search-input");
const searchResults = document.querySelector("[data-search-results]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

const money = (value) => new Intl.NumberFormat("ru-RU").format(value) + " ₽";
const productBySlug = (slug) => products.find((p) => p.slug === slug);
const collectionBySlug = (slug) => collections.find((c) => c.slug === slug);
const shortTitle = (title) =>
	title.replace("SINNER ", "").replace("MOBILE ", "");
const apiUrl = (path) => `${API_BASE_URL.replace(/\/$/, "")}${path}`;
function telegramOrderUrl(orderId) {
	const text = encodeURIComponent(
		`Здравствуйте! Я оформил заказ ${orderId}. Хочу продолжить оформление.`,
	);
	return `${TELEGRAM_URL}?text=${text}`;
}
function warmOrderApi() {
	if (!API_BASE_URL) return;
	setTimeout(() => {
		fetch(apiUrl("/api/health"), { mode: "cors" }).catch(() => {});
	}, 900);
}
const normalizeText = (value) =>
	String(value || "")
		.toLowerCase()
		.replaceAll("ё", "е");
const productSearchText = (product) =>
	normalizeText(
		[
			product.title,
			product.description,
			product.collection === "staple"
				? "мерч merch hoodie толстовка одежда base"
				: "брелок брелки keychain jet tag аксессуары",
			...(product.tags || []),
			...(product.details || []),
		].join(" "),
	);
const productThumb = (product) =>
	product.cardImages?.[0] || product.images?.[0] || {};

state.cart = state.cart.filter((item) => productBySlug(item.slug));
localStorage.setItem("farshiki-cart", JSON.stringify(state.cart));

function persistCart() {
	localStorage.setItem("farshiki-cart", JSON.stringify(state.cart));
	renderCart();
}

function getHashPath() {
	const hash = window.location.hash.replace(/^#/, "");
	return hash || "/";
}

function media(label, src = "", hoverSrc = "") {
	const backdrop = src
		? `<span class="media-backdrop" style="background-image: url('${escapeAttr(src)}')"></span>`
		: "";
	const hoverBackdrop = hoverSrc
		? `<span class="media-backdrop media-backdrop-hover" style="background-image: url('${escapeAttr(hoverSrc)}')"></span>`
		: "";
	const image = src
		? `<img src="${escapeAttr(src)}" alt="${escapeAttr(label)}" loading="lazy">`
		: "";
	const hoverImage = hoverSrc
		? `<img class="media-hover" src="${escapeAttr(hoverSrc)}" alt="" aria-hidden="true" loading="lazy">`
		: "";
	return `<div class="product-media ${src ? "has-image" : ""} ${hoverSrc ? "has-hover-image" : ""}" data-label="${escapeAttr(shortTitle(label))}">${backdrop}${hoverBackdrop}${image}${hoverImage}</div>`;
}

function escapeAttr(value) {
	return String(value).replaceAll('"', "&quot;");
}

function productCard(product) {
	const cardImages = product.cardImages?.length
		? product.cardImages
		: product.images;
	const cover = cardImages?.[0] || {};
	const hover = cardImages?.[1] || {};
	return `
    <article class="product-card">
      <a href="#/products/${product.slug}" aria-label="${product.title}">
        ${media(cover.label || product.title, cover.src, hover.src)}
      </a>
      <div class="product-info">
        <a href="#/products/${product.slug}">${product.title}</a>
        <span class="price">${money(product.price)}</span>
      </div>
    </article>
  `;
}

function instagramMediaCard(item) {
	const media =
		item.type === "video"
			? `<video src="${escapeAttr(item.src)}" autoplay muted loop playsinline preload="metadata" aria-label="${escapeAttr(item.label)}"></video>`
			: `<img src="${escapeAttr(item.src)}" alt="${escapeAttr(item.label)}" loading="lazy">`;
	return `
    <a class="instagram-media-card" href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer" aria-label="Открыть Instagram">
      <span class="instagram-media-slot">${media}</span>
    </a>
  `;
}

function stopInstagramCarousel() {
	if (instagramCarouselTimer) {
		clearInterval(instagramCarouselTimer);
		instagramCarouselTimer = null;
	}
}

function initInstagramCarousel() {
	stopInstagramCarousel();
	const carousel = document.querySelector("[data-instagram-carousel]");
	const track = document.querySelector("[data-instagram-track]");
	if (!carousel || !track) return;

	let index = 0;
	const getVisibleCount = () => {
		if (window.matchMedia("(max-width: 760px)").matches) return 1;
		if (window.matchMedia("(max-width: 1100px)").matches) return 3;
		return 5;
	};
	const getMaxIndex = () =>
		Math.max(0, track.querySelectorAll(".instagram-media-card").length - getVisibleCount());
	const applySlide = () => {
		const card = track.querySelector(".instagram-media-card");
		if (!card) return;
		const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
		const step = card.getBoundingClientRect().width + gap;
		index = Math.min(index, getMaxIndex());
		track.style.transform = `translateX(-${index * step}px)`;
	};

	applySlide();
	instagramCarouselTimer = setInterval(() => {
		const maxIndex = getMaxIndex();
		index = maxIndex ? (index + 1) % (maxIndex + 1) : 0;
		applySlide();
	}, 7000);
	window.addEventListener("resize", applySlide, { passive: true });
}

function renderHome() {
	const staple = products.filter((p) => p.collection === "staple");
	const accessories = products.filter((p) => p.collection === "accessories");
	app.innerHTML = `
    <section class="hero">
      <video class="hero-video" src="./assets/video/main.mov" autoplay muted loop playsinline></video>
    </section>
    <section class="gif-band" aria-label="Место для GIF">
      <video class="home-gif" src="./assets/media/video-gif.mp4" autoplay muted loop playsinline preload="metadata"></video>
    </section>
    <section class="section home-section-title">
      <h1 class="page-title">МЕРЧ</h1>
    </section>
    <section class="hero-grid home-product-grid">${staple.map(productCard).join("")}</section>
    <section class="section section-gap home-section-title">
      <h2 class="small-title">АКСЕССУАРЫ</h2>
    </section>
    <section class="hero-grid home-product-grid">${accessories.map(productCard).join("")}</section>
    <section class="instagram-cta">
      <span>ПОДПИШИСЬ НА НАШ ИНСТ</span>
      <a class="instagram-handle" href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer">@farsh.prod</a>
      <div class="instagram-media-carousel" data-instagram-carousel aria-label="Медиа из Instagram">
        <div class="instagram-media-track" data-instagram-track>
          ${instagramMedia.map(instagramMediaCard).join("")}
        </div>
      </div>
    </section>
  `;
	setTimeout(initInstagramCarousel, 0);
}

function renderCollection(slug) {
	const collection = collectionBySlug(slug) || collectionBySlug("store");
	const items = products.filter(collection.filter);
	const isStore = collection.slug === "store";
	app.innerHTML = `
    <section class="section">
      <h1 class="page-title">${collection.title}</h1>
    </section>
    ${
			isStore
				? `<section class="collection-gif-band" aria-label="Место для GIF на странице магазина">
            <video class="collection-gif" src="./assets/media/video-gif.mp4" autoplay muted loop playsinline preload="metadata"></video>
          </section>`
				: ""
		}
    <div class="toolbar">
      <span>${items.length} товаров</span>
      <span>Сортировка: по умолчанию</span>
    </div>
    ${
			items.length
				? `<section class="product-grid ${isStore ? "store-product-grid" : ""} ${items.length <= 2 ? "product-grid-two" : ""}">${items.map(productCard).join("")}</section>`
				: `<section class="empty-state">Сейчас здесь нет активных товаров.</section>`
		}
  `;
}

function defaultOptions(product) {
	return Object.fromEntries(
		Object.entries(product.options).map(([key, values]) => [key, values[0]]),
	);
}

function renderProduct(slug) {
	const product = productBySlug(slug);
	if (!product) return renderNotFound();
	state.selectedOptions = defaultOptions(product);
	state.qty = 1;

	app.innerHTML = `
    <section class="product-page">
      ${renderProductCarousel(product)}
      <aside class="product-detail">
        <h1>${product.title}</h1>
        <p class="price">${money(product.price)}</p>
        ${renderOptions(product)}
        <div class="option-group">
          <div class="option-label"><span>Количество</span></div>
          <div class="qty-row">
            <button type="button" data-qty="-1">-</button>
            <output data-qty-value>1</output>
            <button type="button" data-qty="1">+</button>
          </div>
        </div>
        <button class="primary-button" type="button" data-add-detail="${product.slug}">ДОБАВИТЬ В КОРЗИНУ</button>
        <div class="product-copy">${product.description}</div>
        <div class="accordion">
          <details open>
            <summary>Детали</summary>
            <ul>${product.details.map((d) => `<li>${d}</li>`).join("")}</ul>
          </details>
          <details>
            <summary>Доставка</summary>
            <p>Доставка по России рассчитывается после оформления заказа. Бесплатная доставка от 10 000 ₽.</p>
          </details>
          <details>
            <summary>Заказ</summary>
            <p>После отправки формы заявка уйдет команде в Telegram. Мы свяжемся с тобой и подтвердим заказ.</p>
          </details>
        </div>
      </aside>
    </section>
  `;
}

function renderProductCarousel(product) {
	const items = product.images?.length
		? product.images
		: [
				{ src: "", label: product.title },
				{ src: "", label: "ДЕТАЛЬ" },
				{ src: "", label: "ПОСАДКА" },
				{ src: "", label: "ДРОП" },
			];
	const active = state.productSlides[product.slug] || 0;
	return `
    <div class="product-carousel" data-carousel="${product.slug}">
      <div class="carousel-viewport">
        <div class="carousel-track" style="transform: translateX(-${active * 100}%);">
          ${items.map((item) => `<div class="carousel-slide">${media(item.label, item.src)}</div>`).join("")}
        </div>
      </div>
      ${
				items.length > 1
					? `
            <button class="carousel-arrow carousel-prev" type="button" data-slide-prev="${product.slug}" aria-label="Предыдущее фото">‹</button>
            <button class="carousel-arrow carousel-next" type="button" data-slide-next="${product.slug}" aria-label="Следующее фото">›</button>
          `
					: ""
			}
    </div>
  `;
}

function renderOptions(product) {
	const entries = Object.entries(product.options);
	if (!entries.length) return "";
	return entries
		.map(([key, values]) => {
			const label =
				key === "size"
					? "Размер"
					: key === "color"
						? "Цвет"
						: key === "value"
							? "Номинал"
							: key;
			return `
        <div class="option-group" data-option-group="${key}">
          <div class="option-label">
            <span>${label}</span>
            ${key.includes("size") || key === "size" ? `<a href="#/pages/${product.slug.includes("tee") ? "t-shirt" : "hoodie"}-size-chart">Таблица размеров</a>` : ""}
          </div>
          <div class="swatches">
            ${values
							.map(
								(value, index) =>
									`<button class="swatch ${index === 0 ? "active" : ""}" type="button" data-option="${key}" data-value="${value}">${value}</button>`,
							)
							.join("")}
          </div>
        </div>
      `;
		})
		.join("");
}

function renderPage(slug) {
	const pages = {
		contact: `
      <div class="page-body support-page">
        <h1>ПОМОЩЬ</h1>
        <p>Чтобы связаться с нами, нажми на кнопку ниже.</p>
        <a class="primary-button support-telegram-button" href="${TELEGRAM_URL}" target="_blank" rel="noopener noreferrer">${TELEGRAM_HANDLE}</a>
      </div>
    `,
		"t-shirt-size-chart": sizeChart(
			"Футболка",
			["XS", "S", "M", "L", "XL", "XXL"],
			[48, 51, 54, 57, 60, 63],
		),
		"hoodie-size-chart": sizeChart(
			"Худи",
			["S", "M", "L", "XL"],
			[56, 59, 62, 65],
		),
		"gift-card-store-credit-policy": policy(
			"Подарочные карты",
			"Подарочная карта работает как внутренний баланс магазина и применяется к будущим заказам.",
		),
		"mobile-terms-of-service": policy(
			"Мобильные условия",
			"Telegram используется для уведомлений и подтверждения заказа.",
		),
	};
	app.innerHTML =
		pages[slug] || policy("Страница", "Контент будет добавлен позже.");
}

function sizeChart(title, sizes, widths) {
	return `
    <div class="page-body">
      <h1>Размер ${title}</h1>
      <p>Замеры указаны в сантиметрах. Сравните с вещью, которая уже хорошо сидит.</p>
      <table class="table">
        <thead><tr><th>Размер</th><th>Ширина</th><th>Длина</th></tr></thead>
        <tbody>
          ${sizes.map((s, i) => `<tr><td>${s}</td><td>${widths[i]}</td><td>${66 + i * 2}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderPolicy(slug) {
	const map = {
		"shipping-policy": [
			"Доставка",
			[
				"Заказ передается в обработку после подтверждения оплаты. Сроки отправки и доставки зависят от города получателя, выбранной службы доставки и режима работы перевозчика.",
				"Стоимость доставки не входит в стоимость товаров и оплачивается покупателем отдельно. Итоговая сумма доставки согласуется после оформления заказа, когда магазин получает адрес, индекс, город и выбранный способ отправки.",
				"Покупатель несет ответственность за корректность указанных данных доставки. Если адрес, телефон или индекс указаны неверно, срок отправки может увеличиться.",
				"После передачи заказа в службу доставки магазин направляет покупателю доступную информацию для отслеживания отправления.",
			],
		],
		"refund-policy": [
			"Возврат",
			[
				"Возврат возможен, если товар не был в использовании, сохранены товарный вид, потребительские свойства, упаковка и комплектность.",
				"Товары со следами носки, загрязнениями, повреждениями, запахами или измененным внешним видом к возврату не принимаются.",
				"Для оформления возврата покупатель должен связаться с магазином и указать номер заказа, причину обращения и контактные данные.",
				"Расходы на обратную пересылку оплачиваются покупателем, если возврат не связан с ошибкой магазина или производственным дефектом.",
				"Возврат денежных средств производится после получения и проверки товара магазином тем же или согласованным способом.",
			],
		],
		"privacy-policy": [
			"Конфиденциальность",
			[
				"Персональные данные используются только для оформления заказа, связи с покупателем, доставки, подтверждения оплаты и обработки обращений.",
				"К таким данным относятся имя, фамилия, телефон, email, адрес доставки и информация о заказе.",
				"Магазин не передает данные третьим лицам, кроме случаев, когда это необходимо для доставки заказа, обработки оплаты или выполнения требований закона.",
				"Оформляя заказ, покупатель подтверждает согласие на обработку данных для выполнения заказа и связи по нему.",
			],
		],
		"terms-of-service": [
			"Условия сервиса",
			[
				"Оформляя заказ, покупатель подтверждает выбранные товары, размер, количество, стоимость товаров и корректность контактных данных.",
				"Заказ считается принятым в работу после подтверждения оплаты магазином.",
				"Доставка оплачивается отдельно и не входит в стоимость товаров, если иное прямо не указано на странице заказа или в переписке с магазином.",
				"Магазин вправе уточнить детали заказа, доставки или оплаты перед отправкой.",
			],
		],
		"contact-information": [
			"Информация о продавце",
			"Реквизиты продавца будут добавлены после выбора юридической формы и платежного контура.",
		],
	};
	const item = map[slug] || ["Политика", "Текст будет добавлен позже."];
	app.innerHTML = policy(item[0], item[1]);
}

function policy(title, content) {
	const body = Array.isArray(content)
		? content.map((text) => `<p>${text}</p>`).join("")
		: `<p>${content}</p>`;
	return `<div class="page-body"><h1>${title}</h1>${body}</div>`;
}

function renderNotFound() {
	app.innerHTML = `<section class="empty-state">Страница не найдена.</section>`;
}

function route() {
	const path = getHashPath();
	stopInstagramCarousel();
	closeSurfaces();
	window.scrollTo({ top: 0 });
	document.body.classList.toggle("home-route", path === "/");
	updateActiveNav(path);

	if (path === "/") renderHome();
	else if (path.startsWith("/collections/"))
		renderCollection(path.split("/")[2]);
	else if (path.startsWith("/products/")) renderProduct(path.split("/")[2]);
	else if (path.startsWith("/pages/")) renderPage(path.split("/")[2]);
	else if (path.startsWith("/policies/")) renderPolicy(path.split("/")[2]);
	else if (path.startsWith("/social/instagram"))
		window.location.href = INSTAGRAM_URL;
	else if (path.startsWith("/social/telegram"))
		window.location.href = TELEGRAM_URL;
	else renderNotFound();

	app.focus({ preventScroll: true });
}

function updateActiveNav(path) {
	document.querySelectorAll(".nav-left a").forEach((link) => {
		const href = link.getAttribute("href").replace("#", "");
		const active =
			(href === "/collections/store" &&
				path.startsWith("/collections/store")) ||
			(href === "/collections/staple" &&
				path.startsWith("/collections/staple")) ||
			(href === "/pages/contact" && path.startsWith("/pages/contact"));
		if (active) link.setAttribute("aria-current", "page");
		else link.removeAttribute("aria-current");
	});
}

function addToCart(slug, qty = 1, options = {}) {
	const product = productBySlug(slug);
	if (!product) return;
	const selected = Object.keys(options).length
		? options
		: defaultOptions(product);
	const key = slug + JSON.stringify(selected);
	const line = state.cart.find((item) => item.key === key);
	if (line) line.qty += qty;
	else state.cart.push({ key, slug, qty, options: selected });
	state.checkout = false;
	persistCart();
	setTimeout(openCart, 0);
}

function cartTotal() {
	return state.cart.reduce(
		(sum, item) => sum + productBySlug(item.slug).price * item.qty,
		0,
	);
}

function changeCartQty(key, delta) {
	const line = state.cart.find((item) => item.key === key);
	if (!line) return;
	line.qty += delta;
	if (line.qty <= 0) state.cart = state.cart.filter((item) => item.key !== key);
	state.checkout = false;
	persistCart();
}

function renderCart() {
	document.querySelectorAll("[data-cart-count]").forEach((el) => {
		const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
		el.textContent = count ? `(${count})` : "";
	});

	const body = document.querySelector("[data-cart-body]");
	if (!state.cart.length) {
		state.checkout = false;
		body.innerHTML = `
      <div class="empty-cart">
        <div class="bag-icon"></div>
        <h3>КОРЗИНА ПУСТА</h3>
        <a class="primary-button" href="#/collections/store" data-action="close-cart">ПРОДОЛЖИТЬ ПОКУПКИ</a>
      </div>
    `;
		return;
	}

	if (state.checkout) {
		body.innerHTML = renderCheckout();
		return;
	}

	body.innerHTML = `
    ${state.cart
			.map((item) => {
				const product = productBySlug(item.slug);
				const thumb = product.cardImages?.[0] || product.images?.[0] || {};
				return `
          <article class="cart-line">
            <div class="cart-thumb ${thumb.src ? "has-image" : ""}">${thumb.src ? `<img src="${escapeAttr(thumb.src)}" alt="${escapeAttr(product.title)}" loading="lazy">` : product.title}</div>
            <div>
              <h3>${product.title}</h3>
              <div class="price">${Object.values(item.options).join(" / ") || "Без параметров"}</div>
              <div class="cart-qty" aria-label="Количество">
                <button type="button" data-cart-dec="${escapeAttr(item.key)}" aria-label="Уменьшить">-</button>
                <span>${item.qty}</span>
                <button type="button" data-cart-inc="${escapeAttr(item.key)}" aria-label="Увеличить">+</button>
              </div>
            </div>
          </article>
        `;
			})
			.join("")}
    <div class="cart-actions">
      <p>Итого: <strong>${money(cartTotal())}</strong></p>
      <button class="primary-button" type="button" data-open-checkout>ЗАКАЗАТЬ</button>
      <a class="secondary-button" href="#/collections/store" data-action="close-cart">ПРОДОЛЖИТЬ ПОКУПКИ</a>
    </div>
  `;
}

function renderCheckout() {
	const orderPreview = state.cart
		.map((item) => {
			const product = productBySlug(item.slug);
			return `${product.title} x ${item.qty} - ${money(product.price * item.qty)}`;
		})
		.join("\n");

	return `
    <form class="checkout-form" data-checkout-form>
      <button class="checkout-back" type="button" data-back-to-cart aria-label="Назад в корзину">←</button>
      <h3>Оформление заказа</h3>
      <p class="checkout-summary">${orderPreview.replaceAll("\n", "<br>")}</p>
      <div class="checkout-grid">
        <label>Имя
          <input name="firstName" autocomplete="given-name" required>
        </label>
        <label>Фамилия
          <input name="lastName" autocomplete="family-name" required>
        </label>
        <label>Телефон
          <input name="phone" type="tel" autocomplete="tel" required>
        </label>
        <label>Email
          <input name="email" type="email" autocomplete="email" required>
        </label>
        <label>Город
          <input name="city" autocomplete="address-level2" required>
        </label>
        <label>Индекс
          <input name="postalCode" inputmode="numeric" autocomplete="postal-code" required>
        </label>
        <label>Улица
          <input name="street" autocomplete="street-address" required>
        </label>
        <label>Дом
          <input name="house" required>
        </label>
        <label>Квартира / офис
          <input name="apartment">
        </label>
        <label>Корпус / подъезд
          <input name="building">
        </label>
        <label class="wide">Способ доставки
          <select name="delivery" required>
            <option value="Почта России">Почта России</option>
            <option value="СДЭК">СДЭК</option>
            <option value="Boxberry / ПВЗ">Boxberry / ПВЗ</option>
            <option value="Яндекс Доставка">Яндекс Доставка</option>
            <option value="ОЗОН">ОЗОН</option>
            <option value="По договоренности">По договоренности</option>
          </select>
        </label>
        <label class="wide">Комментарий
          <textarea name="comment" placeholder="Размеры, город, удобный способ связи"></textarea>
        </label>
      </div>
      <p class="delivery-note">Доставка не входит в стоимость товаров и оплачивается покупателем отдельно после согласования способа отправки.</p>
      <label class="consent-row">
        <input type="checkbox" name="consent" required>
        <span>Я согласен на обработку данных для оформления заказа и связи по доставке.</span>
      </label>
      <button class="primary-button" type="submit">ЗАКАЗАТЬ</button>
    </form>
  `;
}

function openCart() {
	drawer.classList.add("open");
	drawer.setAttribute("aria-hidden", "false");
	overlay.hidden = false;
	document.body.classList.add("no-scroll");
}

function openSearch() {
	searchPanel.classList.add("open");
	searchPanel.setAttribute("aria-hidden", "false");
	overlay.hidden = false;
	document.body.classList.add("no-scroll");
	searchInput.focus();
	renderSearch("");
}

function openMenu() {
	mobileMenu.classList.add("open");
	mobileMenu.setAttribute("aria-hidden", "false");
	overlay.hidden = false;
	document.body.classList.add("no-scroll");
}

function closeSurfaces(hideOverlay = true) {
	state.checkout = false;
	drawer.classList.remove("open");
	searchPanel.classList.remove("open");
	mobileMenu.classList.remove("open");
	drawer.setAttribute("aria-hidden", "true");
	searchPanel.setAttribute("aria-hidden", "true");
	mobileMenu.setAttribute("aria-hidden", "true");
	if (hideOverlay) overlay.hidden = true;
	document.body.classList.remove("no-scroll");
}

function renderSearch(query) {
	const q = normalizeText(query.trim());
	const recommended = [
		"hoodie-base-black",
		"hoodie-base-pink",
		"black-keychain",
		"white-keychain",
	]
		.map(productBySlug)
		.filter(Boolean);
	const result = (
		q ? products.filter((p) => productSearchText(p).includes(q)) : recommended
	).slice(0, 8);
	const title = q ? "НАЙДЕНО" : "РЕКОМЕНДАЦИИ";
	searchResults.innerHTML = `
    <h3 class="trend-title">ПОПУЛЯРНЫЕ ЗАПРОСЫ</h3>
    <div class="trend-tags">
      <span>↗</span>
      <button type="button" data-search-query="худи">Худи</button>
      <button type="button" data-search-query="аксессуары">Аксессуары</button>
      <button type="button" data-search-query="black">Black</button>
      <button type="button" data-search-query="pink">Pink</button>
    </div>
    <h3 class="recommend-title">${title}</h3>
    <div class="search-results">
      ${
				result.length
					? result
							.map((p) => {
								const thumb = productThumb(p);
								return `
          <a class="search-result" href="#/products/${p.slug}">
            <span class="cart-thumb ${thumb.src ? "has-image" : ""}">${thumb.src ? `<img src="${escapeAttr(thumb.src)}" alt="${escapeAttr(p.title)}" loading="lazy">` : p.title}</span>
            <span>${p.title}</span>
            <span class="price">${money(p.price)}</span>
          </a>
        `;
							})
							.join("")
					: `<p class="search-empty">Ничего не найдено. Попробуй: худи, аксессуары, black или pink.</p>`
			}
    </div>
  `;
}

async function completeCheckout(form) {
	if (!state.cart.length) return;
	const submitButton = form.querySelector('button[type="submit"]');
	if (submitButton) {
		submitButton.disabled = true;
		submitButton.textContent = "ОТПРАВЛЯЕМ";
	}
	const orderId = "FS-" + Date.now().toString().slice(-7);
	const customer = Object.fromEntries(new FormData(form).entries());
	const items = state.cart.map((item) => {
		const product = productBySlug(item.slug);
		return {
			title: product.title,
			qty: item.qty,
			options: item.options,
			price: product.price,
			total: product.price * item.qty,
		};
	});
	const order = {
		orderId,
		createdAt: new Date().toISOString(),
		customer,
		items,
		total: cartTotal(),
		deliveryIncluded: false,
		status: "created",
	};
	localStorage.setItem("farshiki-order-" + orderId, JSON.stringify(order));

	const orderText = [
		`Заказ: ${orderId}`,
		`Клиент: ${customer.firstName} ${customer.lastName}`,
		`Телефон: ${customer.phone}`,
		`Email: ${customer.email}`,
		`Город: ${customer.city}`,
		`Индекс: ${customer.postalCode}`,
		`Улица: ${customer.street}`,
		`Дом: ${customer.house}`,
		`Квартира/офис: ${customer.apartment || "-"}`,
		`Корпус/подъезд: ${customer.building || "-"}`,
		`Доставка: ${customer.delivery}`,
		`Комментарий: ${customer.comment || "-"}`,
		"",
		"Товары:",
		...items.map((item) => {
			const options =
				Object.values(item.options).filter(Boolean).join(" / ") ||
				"без параметров";
			return `- ${item.title}, ${options}, x${item.qty}, ${money(item.total)}`;
		}),
		"",
		`Итого по товарам: ${money(order.total)}`,
		"Доставка: оплачивается покупателем отдельно",
	].join("\n");

	localStorage.setItem("farshiki-last-order-text", orderText);
	try {
		const response = await fetch(apiUrl("/api/orders"), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(order),
		});
		if (!response.ok) throw new Error("Order request failed");
	} catch (error) {
		console.warn("Order API is unavailable.", error);
		if (submitButton) {
			submitButton.disabled = false;
			submitButton.textContent = "ЗАКАЗАТЬ";
		}
		const note = form.querySelector(".checkout-error") || document.createElement("p");
		note.className = "checkout-error";
		note.textContent = "Не получилось отправить заказ. Проверь связь и попробуй еще раз.";
		form.append(note);
		return;
	}
	state.cart = [];
	state.checkout = false;
	persistCart();
	const telegramUrl = telegramOrderUrl(orderId);
	document.querySelector("[data-cart-body]").innerHTML = `
    <div class="order-success">
      <h3>ЗАКАЗ ОТПРАВЛЕН</h3>
      <p>Номер заказа: ${orderId}. Сейчас откроем Telegram, чтобы продолжить диалог.</p>
      <a class="primary-button" href="${telegramUrl}" target="_blank" rel="noopener noreferrer">НАПИСАТЬ В TELEGRAM</a>
    </div>
  `;
	window.location.assign(telegramUrl);
}

function setProductSlide(slug, index) {
	const carousel = document.querySelector(`[data-carousel="${slug}"]`);
	if (!carousel) return;
	const count = carousel.querySelectorAll(".carousel-slide").length;
	const next = (index + count) % count;
	state.productSlides[slug] = next;
	const track = carousel.querySelector(".carousel-track");
	track.style.transform = `translateX(-${next * 100}%)`;
}

document.addEventListener("click", (event) => {
	const target = event.target.closest("button, a");
	if (!target) return;

	const action = target.dataset.action;
	if (action === "search") openSearch();
	if (action === "cart") openCart();
	if (
		action === "close-cart" ||
		action === "close-search" ||
		action === "close-menu"
	)
		closeSurfaces();
	if (action === "menu") openMenu();

	const add = target.dataset.add;
	if (add) addToCart(add);

	const addDetail = target.dataset.addDetail;
	if (addDetail) addToCart(addDetail, state.qty, state.selectedOptions);

	const cartInc = target.dataset.cartInc;
	if (cartInc) changeCartQty(cartInc, 1);

	const cartDec = target.dataset.cartDec;
	if (cartDec) changeCartQty(cartDec, -1);

	const searchQuery = target.dataset.searchQuery;
	if (searchQuery !== undefined) {
		searchInput.value = searchQuery;
		renderSearch(searchQuery);
		searchInput.focus();
	}

	if (target.dataset.openCheckout !== undefined) {
		state.checkout = true;
		renderCart();
	}

	if (target.dataset.backToCart !== undefined) {
		state.checkout = false;
		renderCart();
	}

	const prevSlide = target.dataset.slidePrev;
	if (prevSlide)
		setProductSlide(prevSlide, (state.productSlides[prevSlide] || 0) - 1);

	const nextSlide = target.dataset.slideNext;
	if (nextSlide)
		setProductSlide(nextSlide, (state.productSlides[nextSlide] || 0) + 1);

	const dotSlide = target.dataset.slideDot;
	if (dotSlide) setProductSlide(dotSlide, Number(target.dataset.slideIndex));

	const qty = Number(target.dataset.qty);
	if (qty) {
		state.qty = Math.max(1, state.qty + qty);
		const output = document.querySelector("[data-qty-value]");
		if (output) output.textContent = state.qty;
	}

	const option = target.dataset.option;
	if (option) {
		state.selectedOptions[option] = target.dataset.value;
		target
			.closest(".swatches")
			.querySelectorAll(".swatch")
			.forEach((btn) => {
				btn.classList.remove("active");
			});
		target.classList.add("active");
	}
});

overlay.addEventListener("click", () => closeSurfaces());
searchInput.addEventListener("input", (event) =>
	renderSearch(event.target.value),
);
window.addEventListener("hashchange", route);

document.addEventListener("submit", (event) => {
	event.preventDefault();
	const form = event.target;
	if (form.matches("[data-checkout-form]")) {
		completeCheckout(form);
		return;
	}
	form.reset();
});

let swipeStart = null;
document.addEventListener("pointerdown", (event) => {
	const carousel = event.target.closest("[data-carousel]");
	if (!carousel) return;
	swipeStart = {
		slug: carousel.dataset.carousel,
		x: event.clientX,
	};
});

document.addEventListener("pointerup", (event) => {
	if (!swipeStart) return;
	const delta = event.clientX - swipeStart.x;
	if (Math.abs(delta) > 45) {
		const current = state.productSlides[swipeStart.slug] || 0;
		setProductSlide(swipeStart.slug, current + (delta < 0 ? 1 : -1));
	}
	swipeStart = null;
});

renderCart();
warmOrderApi();
route();
