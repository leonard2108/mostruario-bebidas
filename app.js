/* app.js — REN MASTER FINAL */

console.log("App iniciado — Ren Master Final");

/* =======================================================
   ESTADO GLOBAL
   ======================================================= */
const state = {
  lang: localStorage.getItem("lang") || "pt",
  products: [],
  dict: {},
  t: (k) => k,
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

/* =======================================================
   ADMIN — HASH DA SENHA (dc-21-08)
   ======================================================= */
const ADMIN_HASH =
  "8ae080239c616ab3d2c399da3ae6550ccc78a83fb0f1c3eab08bfb41bf164e70";

async function sha256(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function adminLogin() {
  const pwd = prompt("Senha de administrador:");
  if (!pwd) return false;

  try {
    const h = await sha256(pwd);
    return h === ADMIN_HASH;
  } catch (e) {
    console.error("Erro ao calcular hash:", e);
    return false;
  }
}

/* =======================================================
   POPUP DE IDIOMAS (com bandeiras)
   ======================================================= */
function openLanguagePopup() {
  const existing = $("#lang-popup");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "lang-popup";
  modal.innerHTML = `
    <div class="popup-card">
      <div class="close-popup">✖</div>
      <h2>Selecione seu idioma</h2>
      <div class="flag-grid"></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".close-popup").onclick = () => modal.remove();

  const FLAGS = {
    pt: "https://flagcdn.com/w80/br.png",
    en: "https://flagcdn.com/w80/us.png",
    es: "https://flagcdn.com/w80/es.png",
    fr: "https://flagcdn.com/w80/fr.png",
    jp: "https://flagcdn.com/w80/jp.png",
    kr: "https://flagcdn.com/w80/kr.png",
    cn: "https://flagcdn.com/w80/cn.png",
    de: "https://flagcdn.com/w80/de.png",
    it: "https://flagcdn.com/w80/it.png",
    nl: "https://flagcdn.com/w80/nl.png",
    ru: "https://flagcdn.com/w80/ru.png",
    tr: "https://flagcdn.com/w80/tr.png",
    bg: "https://flagcdn.com/w80/bg.png",
    pl: "https://flagcdn.com/w80/pl.png",
    ar: "https://flagcdn.com/w80/ae.png"
  };

  const grid = modal.querySelector(".flag-grid");

  Object.entries(FLAGS).forEach(([code, flag]) => {
    const btn = document.createElement("button");
    btn.className = "flag-btn";
    btn.innerHTML = `
      <img src="${flag}" class="flag-icon">
      <span class="flag-label">${code.toUpperCase()}</span>
    `;

    btn.onclick = async () => {
      state.lang = code;
      localStorage.setItem("lang", code);

      await loadI18n(code);
      applyTranslation();
      loadProducts();

      $("#language").value = code;
      modal.remove();
    };

    grid.appendChild(btn);
  });
}

/* =======================================================
   I18N — carregar arquivos
   ======================================================= */
async function loadI18n(lang) {
  try {
    const res = await fetch(`i18n/${lang}.json`);
    if (!res.ok) throw new Error("i18n not found");

    state.dict = await res.json();
    state.t = (k) => state.dict[k] || k;

    document.documentElement.lang = lang;
  } catch (e) {
    console.warn("Erro i18n:", e);

    if (lang !== "pt") {
      state.lang = "pt";
      localStorage.setItem("lang", "pt");
      return loadI18n("pt");
    }
  }
}

function applyTranslation() {
  $$("[data-i18n]").forEach((el) => {
    el.textContent = state.t(el.dataset.i18n);
  });

  $$("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = state.t(el.dataset.i18nPlaceholder);
  });

  document.title = state.t("title") || "Catálogo de Produtos";
}

/* =======================================================
   PRODUTOS
   ======================================================= */
async function loadProducts() {
  try {
    const lang = state.lang;
    const file = `products-${lang}.json`;

    const res = await fetch(file);
    if (!res.ok) throw new Error("products not found");

    state.products = await res.json();
    renderProducts(state.products);
  } catch {
    if (state.lang !== "pt") {
      state.lang = "pt";
      return loadProducts();
    }
  }
}

function renderProducts(list) {
  const c = $("#products-container");
  if (!c) return;
  c.innerHTML = "";

  list.forEach((p) => {
    const img =
      Array.isArray(p.images) && p.images.length
        ? p.images[p.currentImageIndex || 0]
        : p.image || "";

    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image-container">
        <img src="${img}" alt="${p.name}" loading="lazy">
      </div>
      <div class="content">
        <h3>${p.name}</h3>
        <p class="desc">${p.description}</p>
      </div>
    `;

    c.appendChild(card);
  });
}

/* =======================================================
   BUSCA
   ======================================================= */
function initSearch() {
  const input = $("#search");
  if (!input) return;

  input.addEventListener("input", () => {
    const term = input.value.toLowerCase();
    const filtered = state.products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
    renderProducts(filtered);
  });
}

/* =======================================================
   SELECT DO TOPO
   ======================================================= */
function initLangSelect() {
  const sel = $("#language");
  if (!sel) return;

  sel.value = state.lang;

  sel.addEventListener("change", async (e) => {
    const lang = e.target.value;

    state.lang = lang;
    localStorage.setItem("lang", lang);

    await loadI18n(lang);
    applyTranslation();
    loadProducts();
  });
}

/* =======================================================
   ADMIN — fundo (Ctrl+Alt+A)
   ======================================================= */
document.addEventListener("keydown", async (e) => {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "a") {
    const ok = await adminLogin();
    if (!ok) return alert("Senha incorreta!");

    const modal = $("#admin-bg-modal");
    modal.style.display = "flex";

    $("#admin-bg-url").value = localStorage.getItem("bg-url") || "";
    $("#admin-bg-fit").value = localStorage.getItem("bg-fit") || "cover";
    $("#admin-bg-position").value =
      localStorage.getItem("bg-position") || "center center";
    $("#admin-bg-opacity").value = localStorage.getItem("bg-opacity") || "0.15";
  }
});

function initAdminButtons() {
  $("#admin-bg-save").onclick = () => {
    const url = $("#admin-bg-url").value.trim();
    const fit = $("#admin-bg-fit").value;
    const pos = $("#admin-bg-position").value.trim();
    const op = $("#admin-bg-opacity").value;

    if (url) document.documentElement.style.setProperty("--bg-image", `url('${url}')`);
    else document.documentElement.style.setProperty("--bg-image", "none");

    document.documentElement.style.setProperty("--bg-fit", fit);
    document.documentElement.style.setProperty("--bg-position", pos);
    document.documentElement.style.setProperty("--bg-opacity", op);

    localStorage.setItem("bg-url", url);
    localStorage.setItem("bg-fit", fit);
    localStorage.setItem("bg-position", pos);
    localStorage.setItem("bg-opacity", op);

    alert("Salvo!");
    $("#admin-bg-modal").style.display = "none";
  };

  $("#admin-bg-cancel").onclick = () =>
    ($("#admin-bg-modal").style.display = "none");
}

/* =======================================================
   STARTUP
   ======================================================= */
function initBackgroundFromStorage() {
  const url = localStorage.getItem("bg-url");
  if (url) document.documentElement.style.setProperty("--bg-image", `url('${url}')`);

  document.documentElement.style.setProperty(
    "--bg-fit",
    localStorage.getItem("bg-fit") || "cover"
  );
  document.documentElement.style.setProperty(
    "--bg-position",
    localStorage.getItem("bg-position") || "center center"
  );
  document.documentElement.style.setProperty(
    "--bg-opacity",
    localStorage.getItem("bg-opacity") || "0.15"
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  initBackgroundFromStorage();
  initAdminButtons();
  initLangSelect();
  initSearch();
  openLanguagePopup(); // abre sempre (como você pediu)
  await loadI18n(state.lang);
  applyTranslation();
  loadProducts();
});
