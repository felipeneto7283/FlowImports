/* ═══════════════════════════════════════════════════════════════
   FLOW IMPORTS — app.js
   Loja de camisetas importadas · Anime & Streetwear
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── KEYS (localStorage) ────────────────────────────────────── */
const KEY_STATE = 'flowimports_state';
const KEY_CART  = 'flowimports_cart';   // ← carrinho separado para persistir

/* ── STATE ───────────────────────────────────────────────────── */
let state = loadState();
let cart  = loadCart();      // persiste entre recarregamentos
let currentProduct  = null;
let selectedSize    = '';
let editingId       = null;

/* ─── Default products ───────────────────────────────────────── */
function defaultState() {
  return {
    products: [
      {
        id: 'p1', category: 'Anime',
        name: 'Camiseta Naruto Akatsuki',
        price: 89.90, priceOld: 119.90, installments: 3,
        img: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80',
        shipping: 'Frete grátis acima de R$ 150',
        sizes: ['P','M','G','GG','XGG'],
        badge: 'NOVO', embroidery: false,
        tags: ['Unissex','100% Algodão']
      },
      {
        id: 'p2', category: 'Streetwear',
        name: 'Camiseta Oversized Urban Black',
        price: 129.90, priceOld: null, installments: 4,
        img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
        shipping: 'Frete grátis',
        sizes: ['P','M','G','GG'],
        badge: 'EXCLUSIVO', embroidery: true,
        tags: ['Oversized','Streetwear']
      },
      {
        id: 'p3', category: 'Anime',
        name: 'Camiseta Dragon Ball Vintage',
        price: 99.90, priceOld: 139.90, installments: 3,
        img: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&q=80',
        shipping: 'Frete grátis acima de R$ 150',
        sizes: ['PP','P','M','G','GG','XGG'],
        badge: 'PROMOÇÃO', embroidery: false,
        tags: ['Unissex','Vintage']
      },
      {
        id: 'p4', category: 'Streetwear',
        name: 'Camiseta Flow Signature',
        price: 149.90, priceOld: null, installments: 5,
        img: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&q=80',
        shipping: 'Frete grátis',
        sizes: ['P','M','G','GG'],
        badge: 'LIMITADO', embroidery: true,
        tags: ['Edição Limitada','Premium']
      },
      {
        id: 'p5', category: 'Anime',
        name: 'Camiseta Attack on Titan',
        price: 94.90, priceOld: null, installments: 3,
        img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80',
        shipping: 'Frete grátis acima de R$ 150',
        sizes: ['P','M','G','GG','XGG'],
        badge: '', embroidery: false,
        tags: ['Unissex','Algodão Premium']
      },
      {
        id: 'p6', category: 'Streetwear',
        name: 'Camiseta Tokyo Grunge',
        price: 119.90, priceOld: 159.90, installments: 4,
        img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=80',
        shipping: 'Frete grátis',
        sizes: ['P','M','G','GG'],
        badge: 'OFERTA', embroidery: true,
        tags: ['Japonês','Streetwear']
      }
    ],
    orders: [],
    settings: {
      storeName: 'Flow Imports',
      whatsapp:  '5582967711718',
      adminPass: 'admin123'
    }
  };
}

/* ── PERSISTENCE ─────────────────────────────────────────────── */
function loadState() {
  try {
    const raw = localStorage.getItem(KEY_STATE);
    if (raw) {
      const saved = JSON.parse(raw);
      // Garante que campos novos do defaultState existam caso o schema evolua
      const def = defaultState();
      return {
        products: saved.products ?? def.products,
        orders:   saved.orders   ?? def.orders,
        settings: { ...def.settings, ...saved.settings }
      };
    }
    // Primeira vez: salva o estado padrão imediatamente
    const initial = defaultState();
    localStorage.setItem(KEY_STATE, JSON.stringify(initial));
    return initial;
  } catch {
    return defaultState();
  }
}
function saveState() {
  localStorage.setItem(KEY_STATE, JSON.stringify(state));
}
function loadCart() {
  try {
    const raw = localStorage.getItem(KEY_CART);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveCart() {
  // carrinho salvo separadamente → sobrevive a recarregamentos
  localStorage.setItem(KEY_CART, JSON.stringify(cart));
}

/* ── HELPERS ─────────────────────────────────────────────────── */
const fmt = v => 'R$ ' + v.toFixed(2).replace('.', ',');
const uid = ()  => Date.now().toString(36).toUpperCase();
const el  = id  => document.getElementById(id);

/* ── INIT ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  applyStoreName();
  renderProducts();
  updateCartBadge();

  // Close modals on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) closeAllModals(); });
  });

  // Admin pass enter key
  el('adminPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') loginAdmin();
  });

  // Populate settings tab when opened
  // (done in switchTab)
});

/* ── STORE NAME ──────────────────────────────────────────────── */
function applyStoreName() {
  const name = state.settings.storeName || 'Flow Imports';
  const parts = name.split(' ');
  const first = parts[0];
  const rest  = parts.slice(1).join(' ');
  el('logoText').innerHTML = rest
    ? `${first} <span>${rest}</span>`
    : `<span>${first}</span>`;
  document.title = name + ' — Do básico ao épico: seu estilo em qualquer lugar';
}

/* ══════════════════════════════════════════════════════════════
   PRODUCTS
══════════════════════════════════════════════════════════════ */
function renderProducts() {
  const grid = el('productsGrid');
  el('productCount').textContent = state.products.length + ' produtos';

  if (!state.products.length) {
    grid.innerHTML = '<p class="no-data" style="grid-column:1/-1">Nenhum produto cadastrado ainda.</p>';
    return;
  }

  grid.innerHTML = state.products.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.06}s" onclick="openProduct('${p.id}')">
      <div class="card-img-wrap">
        <img src="${p.img}" alt="${p.name}"
          onerror="this.src='https://via.placeholder.com/300x200/0f0f0f/d4191a?text=IMG'">
        ${p.badge ? `<div class="card-badge${p.badge==='EXCLUSIVO'?' silver':p.badge==='NOVO'?' new':''}">${p.badge}</div>` : ''}
        <button class="card-wishlist" onclick="event.stopPropagation()" title="Favoritar">♡</button>
      </div>
      <div class="card-body">
        <div class="card-category">${p.category}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-tags">
          ${(p.tags||[]).map(t => `<span class="card-tag">${t}</span>`).join('')}
          ${p.embroidery ? '<span class="card-tag">✂ bordado</span>' : ''}
        </div>
        <div class="card-price-row">
          <div class="card-price">${fmt(p.price)}</div>
          ${p.priceOld ? `<div class="card-price-old">${fmt(p.priceOld)}</div>` : ''}
        </div>
        ${p.installments > 0
          ? `<div class="card-installment">${p.installments}x de ${fmt(p.price / p.installments)} sem juros*</div>`
          : `<div class="card-installment pix-tag">💠 Somente via PIX</div>`}
        <div class="card-shipping">${p.shipping || ''}</div>
        <button class="card-cta" onclick="event.stopPropagation(); openProduct('${p.id}')">
          🛒 Comprar
        </button>
      </div>
    </div>
  `).join('');
}

/* ── PRODUCT DETAIL MODAL ────────────────────────────────────── */
function openProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  currentProduct = p;
  selectedSize   = '';

  el('modalBrand').textContent      = p.category;
  el('modalName').textContent       = p.name;
  el('modalImg').src                = p.img;
  el('modalImg').alt                = p.name;
  el('modalPrice').textContent      = fmt(p.price);
  el('modalSub').textContent        = p.installments > 0
    ? `${p.installments}x de ${fmt(p.price / p.installments)} sem juros*`
    : '💠 Somente via PIX';
  el('modalShipping').textContent   = p.shipping || '';
  el('modalObs').value              = '';
  el('embGroup').style.display      = p.embroidery ? 'block' : 'none';
  el('embColorGroup').style.display = p.embroidery ? 'block' : 'none';
  el('embText').value               = '';
  el('embColor').value              = '';

  // Sizes
  el('sizesWrap').innerHTML = (p.sizes || []).map(s =>
    `<button class="size-chip" onclick="pickSize(this,'${s}')">${s}</button>`
  ).join('');

  openModal('productModal');
}

function pickSize(btn, s) {
  document.querySelectorAll('.size-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedSize = s;
}

function addToCart() {
  if (!selectedSize) { alert('Selecione um tamanho!'); return; }
  const item = {
    uid:      uid(),
    pid:      currentProduct.id,
    name:     currentProduct.name,
    img:      currentProduct.img,
    price:    currentProduct.price,
    size:     selectedSize,
    emb:      el('embText').value.trim(),
    embColor: el('embColor').value.trim(),
    obs:      el('modalObs').value.trim()
  };
  cart.push(item);
  saveCart();
  updateCartBadge();
  closeAllModals();
  openModal('cartModal');
  renderCart();
}

/* ══════════════════════════════════════════════════════════════
   COMPRA DIRETA PELO WHATSAPP
══════════════════════════════════════════════════════════════ */
function buyOnWhatsApp() {
  if (!selectedSize) { alert('Selecione um tamanho!'); return; }
  
  const embText = el('embText').value.trim();
  const embColor = el('embColor').value.trim();
  const obs = el('modalObs').value.trim();
  
  // Monta a mensagem automática
  let msg = `🛍 *Novo Pedido - Flow Imports*\n\n`;
  msg += `📦 *Produto:* ${currentProduct.name}\n`;
  msg += `📏 *Tamanho:* ${selectedSize}\n`;
  
  // Adiciona texto do bordado apenas se preenchido
  if (embText) {
    msg += `✂️ *Texto do Bordado:* ${embText}\n`;
  }
  
  // Adiciona cor do bordado apenas se preenchida
  if (embColor) {
    msg += `🎨 *Cor do Bordado:* ${embColor}\n`;
  }
  
  // Adiciona observação apenas se preenchida
  if (obs) {
    msg += `📝 *Observação:* ${obs}\n`;
  }
  
  msg += `\n💰 *Preço:* ${fmt(currentProduct.price)}\n`;
  msg += `📦 *Frete:* ${currentProduct.shipping || 'Consultar'}\n\n`;
  msg += `Olá! Gostaria de comprar este produto. Podemos prosseguir com o pedido?`;
  
  // Número do WhatsApp da loja
  const waNum = state.settings.whatsapp || '5582967711718';
  
  // Fecha o modal antes de redirecionar
  closeAllModals();
  
  // Redireciona para o WhatsApp
  window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ══════════════════════════════════════════════════════════════
   CART
══════════════════════════════════════════════════════════════ */
function updateCartBadge() {
  el('cartCount').textContent = cart.length;
}

function openCart() {
  renderCart();
  openModal('cartModal');
}

function renderCart() {
  const wrap  = el('cartItemsWrap');
  const total = cart.reduce((a, b) => a + b.price, 0);

  if (!cart.length) {
    wrap.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        Seu carrinho está vazio
      </div>`;
    el('cartTotal').textContent = fmt(0);
    el('cartNote').textContent  = '0 itens';
    el('checkoutBtn').disabled  = true;
    return;
  }

  wrap.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img class="cart-item-thumb" src="${item.img}"
        onerror="this.src='https://via.placeholder.com/68/0f0f0f/d4191a?text=+'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">
          Tamanho: <b>${item.size}</b>
          ${item.emb      ? ` &nbsp;·&nbsp; Bordado: <b>${item.emb}</b>` : ''}
          ${item.embColor ? ` (${item.embColor})` : ''}
          ${item.obs      ? `<br>Obs: ${item.obs}` : ''}
        </div>
      </div>
      <div class="cart-item-price">${fmt(item.price)}</div>
      <button class="cart-item-del" onclick="removeCartItem('${item.uid}')" title="Remover">🗑</button>
    </div>
  `).join('');

  el('cartTotal').textContent = fmt(total);
  el('cartNote').textContent  = `${cart.length} ${cart.length === 1 ? 'item' : 'itens'}`;
  el('checkoutBtn').disabled  = false;
}

function removeCartItem(uid) {
  cart = cart.filter(x => x.uid !== uid);
  saveCart();
  updateCartBadge();
  renderCart();
}

/* ══════════════════════════════════════════════════════════════
   CHECKOUT — PagarM + Mercado Pago
══════════════════════════════════════════════════════════════ */
function openCheckout() {
  if (!cart.length) return;
  closeAllModals();

  const total = cart.reduce((a, b) => a + b.price, 0);
  const rows  = cart.map(i =>
    `<div class="order-sum-row"><span>${i.name} (${i.size})</span><span>${fmt(i.price)}</span></div>`
  ).join('');
  el('orderSummary').innerHTML = rows +
    `<div class="order-sum-total"><span>TOTAL</span><span class="val">${fmt(total)}</span></div>`;

  // Reset PagarM — nenhuma opção selecionada, botão MP desabilitado
  document.querySelectorAll('.pagarm-opt').forEach(b => b.classList.remove('selected'));
  el('mpBtn').disabled = true;

  openModal('checkoutModal');
}

/* ── PagarM: seleciona UM método, habilita botão MP ── */
function selectPay(btn) {
  // Remove seleção de todos
  document.querySelectorAll('.pagarm-opt').forEach(b => b.classList.remove('selected'));
  // Seleciona apenas o clicado
  btn.classList.add('selected');
  // Habilita botão MP
  el('mpBtn').disabled = false;
}

/* ── Abre Mercado Pago ── */
function goToMercadoPago() {
  const mpLink = state.settings.mpLink || 'https://www.mercadopago.com.br/';
  // Limpa carrinho
  cart = [];
  saveCart();
  updateCartBadge();
  closeAllModals();
  window.open(mpLink, '_blank');
}

/* ══════════════════════════════════════════════════════════════
   ADMIN
══════════════════════════════════════════════════════════════ */
function openAdminLogin() {
  el('adminPass').value = '';
  el('loginError').style.display = 'none';
  openModal('adminLoginModal');
}

function loginAdmin() {
  const pass = el('adminPass').value;
  if (pass === (state.settings.adminPass || 'admin123')) {
    closeAllModals();
    loadAdminPanel();
    openModal('adminModal');
  } else {
    el('loginError').style.display = 'block';
  }
}

function loadAdminPanel() {
  editingId = null;
  el('editingId').value = '';
  clearProductForm();
  renderAdminProducts();
  switchTab('products');
}

function switchTab(name) {
  ['products','add','settings'].forEach(t => {
    el('tab-' + t).style.display = t === name ? 'block' : 'none';
  });
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', ['products','add','settings'][i] === name);
  });
  if (name === 'settings') loadSettings();
}

/* ── Admin: Products ─────────────────────────────────────────── */
function renderAdminProducts() {
  const list = el('adminProdList');
  if (!state.products.length) {
    list.innerHTML = '<p class="no-data">Nenhum produto ainda.</p>';
    return;
  }
  list.innerHTML = state.products.map(p => `
    <div class="admin-prod-item">
      <img class="admin-prod-thumb" src="${p.img}"
        onerror="this.src='https://via.placeholder.com/58/0f0f0f/d4191a?text=+'">
      <div class="admin-prod-info">
        <div class="admin-prod-name">${p.name}</div>
        <div class="admin-prod-price">${fmt(p.price)} &nbsp;·&nbsp; ${p.category}</div>
      </div>
      <div class="admin-prod-actions">
        <button class="btn-edit" onclick="editProduct('${p.id}')">✏ Editar</button>
        <button class="btn-del"  onclick="deleteProduct('${p.id}')">🗑</button>
      </div>
    </div>
  `).join('');
}

function editProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  uploadedImgData = null;
  el('imgPreviewWrap').style.display = 'none';
  el('imgPreview').src = '';
  el('pImgFile').value = '';
  el('pImg').placeholder = 'Cole uma URL de imagem (https://...)';
  el('editingId').value   = id;
  el('pCategory').value   = p.category  || '';
  el('pName').value       = p.name      || '';
  el('pPrice').value      = p.price     || '';
  el('pPriceOld').value   = p.priceOld  || '';
  el('pInstallments').value = p.installments != null ? String(p.installments) : '0';
  el('pImg').value        = p.img       || '';
  el('pShipping').value   = p.shipping  || '';
  el('pSizes').value      = (p.sizes || []).join(', ');
  el('pTags').value       = (p.tags  || []).join(', ');
  el('pBadge').value      = p.badge     || '';
  el('pEmbroidery').value = p.embroidery ? '1' : '0';
  el('saveProductBtn').textContent = '💾 Salvar Alterações';
  switchTab('add');
}

function deleteProduct(id) {
  if (!confirm('Remover este produto?')) return;
  state.products = state.products.filter(x => x.id !== id);
  saveState();
  renderProducts();
  renderAdminProducts();
}

function clearProductForm() {
  ['pCategory','pName','pPrice','pPriceOld','pImg','pShipping','pSizes','pTags','pBadge'].forEach(id => {
    el(id).value = '';
  });
  el('pInstallments').value = '0';
  el('pEmbroidery').value   = '0';
  el('editingId').value     = '';
  el('saveProductBtn').textContent = '💾 Salvar Produto';
  editingId = null;
}

function saveProduct() {
  const category    = el('pCategory').value.trim();
  const name        = el('pName').value.trim();
  const price       = parseFloat(el('pPrice').value);
  const priceOldRaw = el('pPriceOld').value.trim();
  const priceOld    = priceOldRaw ? parseFloat(priceOldRaw) : null;
  const installments= parseInt(el('pInstallments').value) || 0;
  const img         = uploadedImgData || el('pImg').value.trim();
  const shipping    = el('pShipping').value.trim();
  const sizesRaw    = el('pSizes').value.trim();
  const tagsRaw     = el('pTags').value.trim();
  const badge       = el('pBadge').value.trim();
  const embroidery  = el('pEmbroidery').value === '1';

  if (!category || !name || isNaN(price) || !img) {
    alert('Preencha categoria, nome, preço e adicione uma imagem!');
    return;
  }

  const sizes = sizesRaw ? sizesRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const tags  = tagsRaw  ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  const eid = el('editingId').value;
  if (eid) {
    const idx = state.products.findIndex(x => x.id === eid);
    if (idx > -1) {
      state.products[idx] = { ...state.products[idx], category, name, price, priceOld, installments, img, shipping, sizes, tags, badge, embroidery };
    }
  } else {
    state.products.push({ id: 'p' + Date.now(), category, name, price, priceOld, installments, img, shipping, sizes, tags, badge, embroidery });
  }

  saveState();
  renderProducts();
  renderAdminProducts();
  clearProductForm();
  clearImgUpload();
  switchTab('products');
}

/* ── Admin: Image Upload ─────────────────────────────────────── */
let uploadedImgData = null; // base64 da imagem enviada pelo usuário

function handleImgUpload(input) {
  const file = input.files[0];
  if (!file) return;

  // Valida tipo
  if (!['image/jpeg','image/jpg','image/png'].includes(file.type)) {
    alert('Apenas arquivos JPG ou PNG são aceitos!');
    input.value = '';
    return;
  }
  // Valida tamanho (máx 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('A imagem deve ter no máximo 2MB!');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    uploadedImgData = e.target.result; // data:image/...;base64,...
    el('pImg').value = '';             // limpa campo URL ao usar arquivo
    el('imgPreview').src = uploadedImgData;
    el('imgPreviewWrap').style.display = 'flex';
    el('pImg').placeholder = '(usando arquivo enviado)';
  };
  reader.readAsDataURL(file);
}

function clearImgUpload() {
  uploadedImgData = null;
  el('pImgFile').value = '';
  el('imgPreviewWrap').style.display = 'none';
  el('imgPreview').src = '';
  el('pImg').placeholder = 'Cole uma URL de imagem (https://...)';
  el('pImg').value = '';
}

/* ── Admin: Settings ─────────────────────────────────────────── */
function loadSettings() {
  el('sStoreName').value = state.settings.storeName || 'Flow Imports';
  el('sWhatsApp').value  = state.settings.whatsapp  || '';
  el('sMpLink').value    = state.settings.mpLink    || '';
  el('sNewPass').value   = '';
}

function saveSettings() {
  const name   = el('sStoreName').value.trim();
  const wa     = el('sWhatsApp').value.trim();
  const mpLink = el('sMpLink').value.trim();
  const pass   = el('sNewPass').value.trim();

  if (name)   state.settings.storeName = name;
  if (wa)     state.settings.whatsapp  = wa;
  if (mpLink) state.settings.mpLink    = mpLink;
  if (pass)   state.settings.adminPass = pass;

  saveState();
  applyStoreName();
  alert('Configurações salvas com sucesso!');
}

/* ══════════════════════════════════════════════════════════════
   MODAL HELPERS
══════════════════════════════════════════════════════════════ */
function openModal(id) {
  el(id).classList.add('open');
}
function closeModal(id) {
  el(id).classList.remove('open');
}
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}
