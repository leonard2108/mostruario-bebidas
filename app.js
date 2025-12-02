console.log('App started');
// catalogo com i18n, modal de idioma na primeira visita, tema e busca
const state = {
    lang: localStorage.getItem('lang') || null,
    products: [],
    t: (k) => k,
    dict: {},
};

  // funções auxiliares
const query = (selector) => document.querySelector(selector);
const queryAll = (selector) => Array.from(document.querySelectorAll(selector));

async function loadI18n(lang) {
  console.log('Carregando idioma:', lang);
  try {
    const res = await fetch(`I18n/${lang}.json`);
    if (!res.ok) throw new Error('lang not found');
    state.dict = await res.json();
    console.log('Dicionário carregado:', state.dict); // debug
    state.t = (k) => state.dict[k] || k;
    document.documentElement.lang = lang;
  } catch (error) {
    console.warn('Falling back to pt for i18n', error);
    if (lang !== 'pt') return loadI18n('pt');
  }
}

async function loadProducts() {
  console.log('Carregando produtos...');
    try {
    const filename = `products-${state.lang || 'pt'}.json`;
    console.log('Buscando arquivo:', filename);
    const res = await fetch(filename);
    console.log('Resposta recebida:', res.status, res.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.products = await res.json();
    console.log('Produtos carregados:', state.products);
    renderProducts(state.products);
     } catch (error) {
    console.error('Erro ao carregar produtos', error); 
     try {
       state.lang = 'pt';
       await loadProducts();
     } catch (error) {
       console.error('Erro ao carregar produtos em português', error);
     }
   }
}

function formatPriceBRL(v) {
    try {
        let locale;
        switch (state.lang) {
            case 'en': locale = 'en-US'; break;
            case 'es': locale = 'es-ES'; break;
            case 'fr': locale = 'fr-FR'; break;
            case 'de': locale = 'de-DE'; break;
            case 'jp': locale = 'ja-JP'; break;
            case 'kr': locale = 'ko-KR'; break;
            case 'cn': locale = 'zh-CN'; break;
            case 'it': locale = 'it-IT'; break;
            case 'ru': locale = 'ru-RU'; break;
            case 'ar': locale = 'ar-SA'; break;
            case 'nl': locale = 'nl-NL'; break;
            case 'pl': locale = 'pl-PL'; break;
            case 'bg': locale = 'bg-BG'; break;
            case 'tr': locale = 'tr-TR'; break;
            default: locale = 'pt-BR'; //padrão
             } 
             return new Intl.NumberFormat(locale, {
                 style: 'currency',
                 currency: 'BRL',
                }).format(v); 
             } catch (error) {
                console.warn("erro ao formatar preço", error)
                return `R$ ${v}`;
             }
  }

// Função para trocar a imagem do produto
function changeProductImage(productId, direction) {
  // Encontrar o produto no array de produtos
  const product = state.products.find(p => p.id === productId);
  if (!product || !product.images || product.images.length <= 1) return;
  
  // Calcular o novo índice
  const currentIndex = product.currentImageIndex || 0;
  let newIndex = currentIndex + direction;
  
  // Garantir que o índice esteja dentro dos limites
  if (newIndex < 0) newIndex = product.images.length - 1;
  if (newIndex >= product.images.length) newIndex = 0;
  
  // Atualizar o índice no produto
  product.currentImageIndex = newIndex;
  
  // Atualizar a imagem no DOM
  const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
  if (card) {
    const img = card.querySelector('img');
    if (img) {
      img.src = product.images[newIndex];
    }
  }
}
  // aplicar traduçoes na interface
  function applyTranslation() {
    queryAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translatedText = state.t(key);
      console.log(`Translating key: ${key} -> ${translatedText}`); 
      el.textContent = translatedText;
  });
  //atualizar placeholders
queryAll('[data-i18n-placeholder]').forEach(el => {
  const key = el.dataset.i18nPlaceholder;
  el.placeholder = state.t(key);
});

//atualizar titulo da pagina
document.title = state.t('title') || 'Catálogo de Produtos';
  }

// renderizar produtos
function renderProducts(products) {
    console.log('Renderizando produtos...');
    const container = query('#products-container');
    console.log('Container:', container);
    if (!container) {
      console.error('Elemento #products-container não encontrado');
      return;
    }
    container.innerHTML = '';
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = product.id;
        
        // Usar a primeira imagem ou fallback para compatibilidade
        const currentImage =
    Array.isArray(product.images) && product.images.length > 0
        ? product.images[product.currentImageIndex] || product.images[0]
        : product.image || "";
        
        card.innerHTML = `
        <div class="product-image-container">
          <img src="${currentImage}" alt="${product.name}">
          ${product.images && product.images.length > 1 ? `
            <div class="image-controls">
              <button class="prev-image" aria-label="Imagem anterior">&#10094;</button>
              <button class="next-image" aria-label="Próxima imagem">&#10095;</button>
            </div>
          ` : ''}
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <p class="price">${formatPriceBRL(product.price)}</p>
        </div>
      `;
      container.appendChild(card);
      
      // Adicionar event listeners para os botões de troca de imagem
      if (product.images && product.images.length > 1) {
        const prevButton = card.querySelector('.prev-image');
        const nextButton = card.querySelector('.next-image');
        
        prevButton.addEventListener('click', (e) => {
          e.stopPropagation();
          changeProductImage(product.id, -1);
        });
        
        nextButton.addEventListener('click', (e) => {
          e.stopPropagation();
          changeProductImage(product.id, 1);
        });
      }
    });
}

//buscar produtos
function searchProducts() {
    const searchTerm = query('#search').value.toLowerCase();
    const filtered = state.products.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm)
    );
    renderProducts(filtered);
}



//eventos
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado');
    // carregar idioma
    const lang = state.lang || navigator.language.split('-')[0];
    loadI18n(lang).then(() => {
        applyTranslation();
        loadProducts();
    })
  });
    
    // Inicializa as configurações de fundo
    initBackgroundSettings();
// evento de mudança de idioma
query('#language').addEventListener('change', (e) => {
  const newLang = e.target.value;
  state.lang = newLang;
  localStorage.setItem('lang', newLang);
  loadI18n(newLang).then(() => {
    applyTranslation();
    loadProducts();
  });
});

// Função para inicializar as configurações de fundo
function initBackgroundSettings() {
  // Elementos do DOM
  const bgSettingsBtn = query('#bg-settings');
  const bgModal = query('#bg-modal');
  const closeBgModalBtn = query('#close-bg-modal');
  const bgOptions = queryAll('.bg-option');
  const bgFitOptions = queryAll('.bg-fit-option');
  const overlayOpacity = query('#overlay-opacity');
  
  // Carregar configurações salvas
  const savedBg = localStorage.getItem('bg-image') || 'url(\'assets/backgrounds/bg1.svg\')';
  const savedFit = localStorage.getItem('bg-fit') || 'height';
  const savedOpacity = localStorage.getItem('overlay-opacity') || '35';
  
  // Aplicar configurações salvas
  if (savedBg !== 'none') {
    document.documentElement.style.setProperty('--bg-image', savedBg);
    const activeBgOption = queryAll('.bg-option').find(opt => opt.dataset.bg === savedBg);
    if (activeBgOption) activeBgOption.classList.add('active');
  } else {
    document.documentElement.style.setProperty('--bg-image', 'none');
    const noneOption = queryAll('.bg-option').find(opt => opt.dataset.bg === 'none');
    if (noneOption) noneOption.classList.add('active');
  }
  
  document.documentElement.style.setProperty('--bg-fit', savedFit);
  const activeFitOption = queryAll('.bg-fit-option').find(opt => opt.dataset.fit === savedFit);
  if (activeFitOption) activeFitOption.classList.add('active');
  
  overlayOpacity.value = savedOpacity;
  updateOverlayOpacity(savedOpacity);
  
  // Abrir modal de configurações
  bgSettingsBtn.addEventListener('click', () => {
    bgModal.removeAttribute('hidden');
  });
  
  // Fechar modal de configurações
  closeBgModalBtn.addEventListener('click', () => {
    bgModal.setAttribute('hidden', true);
  });
  
  // Fechar modal ao clicar fora
  bgModal.addEventListener('click', (e) => {
    if (e.target === bgModal) {
      bgModal.setAttribute('hidden', true);
    }
  });
  
  // Selecionar imagem de fundo
  bgOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remover classe ativa de todas as opções
      bgOptions.forEach(opt => opt.classList.remove('active'));
      // Adicionar classe ativa à opção selecionada
      option.classList.add('active');
      
      const bgValue = option.dataset.bg;
      if (bgValue !== 'none') {
        document.documentElement.style.setProperty('--bg-image', bgValue);
      } else {
        document.documentElement.style.setProperty('--bg-image', 'none');
      }
      
      localStorage.setItem('bg-image', bgValue);
    });
  });
  
  // Selecionar ajuste de imagem
  bgFitOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remover classe ativa de todas as opções
      bgFitOptions.forEach(opt => opt.classList.remove('active'));
      // Adicionar classe ativa à opção selecionada
      option.classList.add('active');
      
      const fitValue = option.dataset.fit;
      document.documentElement.style.setProperty('--bg-fit', fitValue);
      localStorage.setItem('bg-fit', fitValue);
    });
  });
  
  // Ajustar opacidade do overlay
  overlayOpacity.addEventListener('input', () => {
    updateOverlayOpacity(overlayOpacity.value);
  });
  
  overlayOpacity.addEventListener('change', () => {
    localStorage.setItem('overlay-opacity', overlayOpacity.value);
  });
}

// Função para atualizar a opacidade do overlay
function updateOverlayOpacity(value) {
  const opacity = value / 100;
  const overlayLight = `linear-gradient(to bottom, rgba(0, 0, 0, ${opacity}), rgba(0, 0, 0, ${opacity}))`;
  const overlayDark = `linear-gradient(to bottom, rgba(0, 0, 0, ${opacity + 0.13}), rgba(0, 0, 0, ${opacity + 0.13}))`;
  
  document.documentElement.style.setProperty('--bg-overlay', overlayLight);
  document.documentElement.style.setProperty('--bg-overlay-dark', overlayDark);
}
// evento de busca
query('#search').addEventListener('input', searchProducts);