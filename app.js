/* app.js — REN MASTER EDITION */

console.log("App iniciado — Ren Master Edition");

/* -------------------------
   Estado global
   ------------------------- */
const state = {
  lang: localStorage.getItem("lang") || "pt",
  products: [],
  dict: {},
  t: (k) => k
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

/* -------------------------
   Admin: hash da senha (senha = dc-21-08)
   ------------------------- */
const ADMIN_HASH = "8ae080239c616ab3d2c399da3ae6550ccc78a83fb0f1c3eab08bfb41bf164e70";

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
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

/* -------------------------
   POPUP PREMIUM — bandeiras redondas (FlagCDN)
   ------------------------- */
function openLanguagePopup() {
  // remove se já existir (evita duplicação)
  const existing = $("#lang-popup");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "lang-popup";
  modal.innerHTML = `
    <div class="popup-card">
      <div class="close-popup" aria-label="Fechar">✖</div>
      <h2>Selecione seu idioma</h2>
      <div class="flag-grid" role="list"></div>
    </div>
  `;
  document.body.appendChild(modal);

  // fechar X
  modal.querySelector(".close-popup").onclick = () => modal.remove();

  // flags (usando FlagCDN imagens leves)
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
    ar: "https://flagcdn.com/w80/ae.png" // Emirados Árabes (neutro)
  };

  const grid = modal.querySelector(".flag-grid");
  Object.entries(FLAGS).forEach(([code, url]) => {
    const btn = document.createElement("button");
    btn.className = "flag-btn";
    btn.type = "button";
    btn.innerHTML = `<img src="${url}" class="flag-icon" alt="${code}"><span class="flag-label">${code.toUpperCase()}</span>`;

    btn.onclick = async () => {
      state.lang = code;
      localStorage.setItem("lang", code);

      await loadI18n(code);
      applyTranslation();
      loadProducts();

      modal.remove();
      // sincroniza select do topo
      const sel = $("#language");
      if (sel) sel.value = code;
    };

    grid.appendChild(btn);
  });
}

/* -------------------------
   I18N — carregar dicionário
   ------------------------- */
async function loadI18n(lang) {
  try {
    console.log("Carregando i18n:", lang);
    const res = await fetch(`i18n/${lang}.json`);
    if (!res.ok) throw new Error("i18n not found");
    state.dict = await res.json();
    state.t = (k) => state.dict[k] || k;
    document.documentElement.lang = lang;
  } catch (e) {
    console.warn("Erro i18n:", e);
    if (lang !== "pt") {
      // tenta pt como fallback
      state.lang = "pt";
      localStorage.setItem("lang", "pt");
      return loadI18n("pt");
    }
  }
}

function applyTranslation() {
  // textos
  $$("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    try {
      el.textContent = state.t(key);
    } catch {
      el.textContent = key;
    }
  });

  // placeholders
  $$("[data-i18n-placeholder]").forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    try {
      el.placeholder = state.t(key);
    } catch {
      el.placeholder = key;
    }
  });

  // título
  try {
    document.title = state.t("title") || document.title;
  } catch {}
}

/* -------------------------
   Produtos: load + render
   ------------------------- */
async function loadProducts() {
  try {
    const lang = state.lang || "pt";
    const filename = `products-${lang}.json`;
    console.log("Buscando produtos:", filename);
    const res = await fetch(filename);
    if (!res.ok) throw new Error("products not found");
    state.products = await res.json();
    renderProducts(state.products);
  } catch (e) {
    console.warn("Erro ao carregar produtos:", e);
    if (state.lang !== "pt") {
      state.lang = "pt";
      localStorage.setItem("lang", "pt");
      return loadProducts();
    } else {
      // nada a fazer
      state.products = [];
      renderProducts([]);
    }
  }
}

function renderProducts(list) {
  const container = $("#products-container");
  if (!container) return;
  container.innerHTML = "";

  // grid: cada produto
  list.forEach(p => {
    const currentImage = Array.isArray(p.images) && p.images.length ? (p.images[p.currentImageIndex || 0] || p.images[0]) : (p.image || "");

    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image-container">
        <img src="${currentImage}" alt="${escapeHtml(p.name)}" loading="lazy">
      </div>
      <div class="content">
        <h3>${escapeHtml(p.name)}</h3>
        <p class="desc">${escapeHtml(p.description)}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[m]));
}

/* -------------------------
   Busca
   ------------------------- */
function initSearch() {
  const input = $("#search");
  if (!input) return;
  input.addEventListener("input", () => {
    const term = input.value.trim().toLowerCase();
    if (!term) return renderProducts(state.products);
    const filtered = state.products.filter(p =>
      (p.name || "").toLowerCase().includes(term) ||
      (p.description || "").toLowerCase().includes(term)
    );
    renderProducts(filtered);
  });
}

/* -------------------------
   Admin panel (Ctrl+Alt+A)
   ------------------------- */
document.addEventListener("keydown", async (e) => {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "a") {
    const ok = await adminLogin();
    if (!ok) return alert("Senha incorreta!");
    const modal = $("#admin-bg-modal");
    if (!modal) return alert("Painel admin não encontrado no HTML.");
    modal.style.display = "flex";

    // carregar valores
    $("#admin-bg-url").value = localStorage.getItem("bg-url") || "";
    $("#admin-bg-fit").value = localStorage.getItem("bg-fit") || "cover";
    $("#admin-bg-position").value = localStorage.getItem("bg-position") || "center center";
    $("#admin-bg-opacity").value = localStorage.getItem("bg-opacity") || "0.15";
  }
});

// salvar admin
function initAdminButtons() {
  const save = $("#admin-bg-save");
  const cancel = $("#admin-bg-cancel");
  if (!save || !cancel) return;

  save.addEventListener("click", () => {
    const url = $("#admin-bg-url").value.trim();
    const fit = $("#admin-bg-fit").value;
    const pos = $("#admin-bg-position").value.trim();
    const op = $("#admin-bg-opacity").value;

    if (url) document.documentElement.style.setProperty("--bg-image", `url('${url}')`);
    else document.documentElement.style.setProperty("--bg-image", "none");

    document.documentElement.style.setProperty("--bg-fit", fit || "cover");
    document.documentElement.style.setProperty("--bg-position", pos || "center center");
    document.documentElement.style.setProperty("--bg-opacity", op || "0.15");

    localStorage.setItem("bg-url", url);
    localStorage.setItem("bg-fit", fit);
    localStorage.setItem("bg-position", pos);
    localStorage.setItem("bg-opacity", op);

    alert("Configurações salvas!");
    $("#admin-bg-modal").style.display = "none";
  });

  cancel.addEventListener("click", () => {
    const modal = $("#admin-bg-modal");
    if (modal) modal.style.display = "none";
  });
}

/* -------------------------
   Select do topo (troca de idioma)
   ------------------------- */
function initLangSelect() {
  const sel = $("#language");
  if (!sel) return;
  // set current value
  sel.value = state.lang || "pt";

  sel.addEventListener("change", async (e) => {
    const newLang = e.target.value;
    state.lang = newLang;
    localStorage.setItem("lang", newLang);

    await loadI18n(newLang);
    applyTranslation();
    loadProducts();
  });
}

/* -------------------------
   Inicialização do background (aplica settings salvos)
   ------------------------- */
function initBackgroundFromStorage() {
  const url = localStorage.getItem("bg-url");
  const fit = localStorage.getItem("bg-fit") || "cover";
  const pos = localStorage.getItem("bg-position") || "center center";
  const op = localStorage.getItem("bg-opacity") || "0.15";

  if (url) document.documentElement.style.setProperty("--bg-image", `url('${url}')`);
  else document.documentElement.style.setProperty("--bg-image", "none");

  document.documentElement.style.setProperty("--bg-fit", fit);
  document.documentElement.style.setProperty("--bg-position", pos);
  document.documentElement.style.setProperty("--bg-opacity", op);
}

/* -------------------------
   Utils & startup
   ------------------------- */
function showFirstVisitLanguagePopup() {
  // requirement: open every visit (you asked that)
  openLanguagePopup();
}

function initAll() {
  initBackgroundFromStorage();
  initAdminButtons();
  initLangSelect();
  initSearch();
}

/* -------------------------
   DOMContentLoaded
   ------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    initAll();
    showFirstVisitLanguagePopup(); // abre sempre
    await loadI18n(state.lang);
    applyTranslation();
    await loadProducts();
  } catch (e) {
    console.error("Erro na inicialização:", e);
  }
});



