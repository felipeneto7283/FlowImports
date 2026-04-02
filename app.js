/* ═══════════════════════════════════════════════════════════════
   FLOW IMPORTS — app.js
   Loja de camisetas importadas · Anime & Streetwear
═══════════════════════════════════════════════════════════════ */
'use strict';

const KEY_STATE = 'flowimports_state';
const KEY_CART  = 'flowimports_cart';

let state          = loadState();
let cart           = loadCart();
let currentProduct = null;
let selectedSize   = '';
let selectedQty    = 1;
let editingId      = null;
let uploadedImgData = null;

/* ── Filtros ativos ── */
let filters = { sizes:[], colors:[], priceMin:'', priceMax:'' };

/* ── Default products (com stock por tamanho) ── */
function defaultState() {
  return {
    products: [
      {
        id:'p1', category:'Anime', name:'Camiseta Naruto Akatsuki',
        price:89.90, priceOld:119.90, installments:3,
        img:'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80',
        shipping:'Frete grátis acima de R$ 150',
        sizes:['P','M','G','GG','XGG'],
        stock:{ P:5, M:8, G:3, GG:10, XGG:2 },
        colors:['Preto','Vermelho'],
        badge:'NOVO', embroidery:false, tags:['Unissex','100% Algodão']
      },
      {
        id:'p2', category:'Streetwear', name:'Camiseta Oversized Urban Black',
        price:129.90, priceOld:null, installments:4,
        img:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
        shipping:'Frete grátis', sizes:['P','M','G','GG'],
        stock:{ P:0, M:4, G:6, GG:1 },
        colors:['Preto'],
        badge:'EXCLUSIVO', embroidery:true, tags:['Oversized','Streetwear']
      },
      {
        id:'p3', category:'Anime', name:'Camiseta Dragon Ball Vintage',
        price:99.90, priceOld:139.90, installments:3,
        img:'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&q=80',
        shipping:'Frete grátis acima de R$ 150',
        sizes:['PP','P','M','G','GG','XGG'],
        stock:{ PP:2, P:5, M:7, G:5, GG:3, XGG:0 },
        colors:['Laranja','Amarelo'],
        badge:'PROMOÇÃO', embroidery:false, tags:['Unissex','Vintage']
      },
      {
        id:'p4', category:'Streetwear', name:'Camiseta Flow Signature',
        price:149.90, priceOld:null, installments:5,
        img:'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&q=80',
        shipping:'Frete grátis', sizes:['P','M','G','GG'],
        stock:{ P:3, M:3, G:3, GG:3 },
        colors:['Branco','Cinza'],
        badge:'LIMITADO', embroidery:true, tags:['Edição Limitada','Premium']
      },
      {
        id:'p5', category:'Anime', name:'Camiseta Attack on Titan',
        price:94.90, priceOld:null, installments:3,
        img:'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80',
        shipping:'Frete grátis acima de R$ 150', sizes:['P','M','G','GG','XGG'],
        stock:{ P:6, M:10, G:8, GG:4, XGG:1 },
        colors:['Preto','Verde'],
        badge:'', embroidery:false, tags:['Unissex','Algodão Premium']
      },
      {
        id:'p6', category:'Streetwear', name:'Camiseta Tokyo Grunge',
        price:119.90, priceOld:159.90, installments:4,
        img:'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=80',
        shipping:'Frete grátis', sizes:['P','M','G','GG'],
        stock:{ P:2, M:0, G:5, GG:3 },
        colors:['Azul','Preto'],
        badge:'OFERTA', embroidery:true, tags:['Japonês','Streetwear']
      }
    ],
    orders: [],
    settings:{ storeName:'Flow Imports', whatsapp:'5582967711718', adminPass:'admin123', mpLink:'' }
  };
}

/* ── PERSISTENCE ── */
function loadState() {
  try {
    const raw=localStorage.getItem(KEY_STATE);
    if(raw){
      const s=JSON.parse(raw), d=defaultState();
      return{ products:s.products??d.products, orders:s.orders??[], settings:{...d.settings,...s.settings} };
    }
    const init=defaultState();
    localStorage.setItem(KEY_STATE,JSON.stringify(init));
    return init;
  } catch{ return defaultState(); }
}
function saveState(){ localStorage.setItem(KEY_STATE,JSON.stringify(state)); }
function loadCart(){
  try{ const r=localStorage.getItem(KEY_CART); return r?JSON.parse(r):[]; }
  catch{ return[]; }
}
function saveCart(){ localStorage.setItem(KEY_CART,JSON.stringify(cart)); }

/* ── HELPERS ── */
const fmt = v=>'R$ '+v.toFixed(2).replace('.',',');
const uid = ()=>Date.now().toString(36).toUpperCase();
const el  = id=>document.getElementById(id);

/* ── INIT ── */
document.addEventListener('DOMContentLoaded',()=>{
  applyStoreName(); renderProducts(); updateCartBadge();
  document.querySelectorAll('.modal-overlay').forEach(o=>
    o.addEventListener('click',e=>{ if(e.target===o) closeAllModals(); })
  );
  el('adminPass').addEventListener('keydown',e=>{ if(e.key==='Enter') loginAdmin(); });
});

function applyStoreName(){
  const name=state.settings.storeName||'Flow Imports';
  const p=name.split(' '),f=p[0],r=p.slice(1).join(' ');
  el('logoText').innerHTML=r?`${f} <span>${r}</span>`:`<span>${f}</span>`;
  document.title=name+' — Do básico ao épico: seu estilo em qualquer lugar';
}

/* ══════════════════════════════════════════════════════════════
   FILTROS
══════════════════════════════════════════════════════════════ */

/* Coleta todos os tamanhos e cores únicos dos produtos */
function getAllSizes(){
  const s=new Set();
  state.products.forEach(p=>(p.sizes||[]).forEach(sz=>s.add(sz)));
  const order=['PP','P','M','G','GG','XGG','U'];
  return [...s].sort((a,b)=>{
    const ia=order.indexOf(a), ib=order.indexOf(b);
    if(ia!==-1&&ib!==-1) return ia-ib;
    if(ia!==-1) return -1; if(ib!==-1) return 1;
    return a.localeCompare(b);
  });
}
function getAllColors(){
  const s=new Set();
  state.products.forEach(p=>(p.colors||[]).forEach(c=>s.add(c)));
  return [...s].sort();
}

/* Aplica os filtros ativos e retorna produtos filtrados */
function applyFilters(products){
  return products.filter(p=>{
    // Tamanho: produto precisa ter pelo menos um dos tamanhos filtrados COM estoque > 0
    if(filters.sizes.length){
      const hasSizeInStock = filters.sizes.some(sz=>{
        if(!(p.sizes||[]).includes(sz)) return false;
        if(!p.stock) return true;
        return (p.stock[sz]||0)>0;
      });
      if(!hasSizeInStock) return false;
    }
    // Cor
    if(filters.colors.length){
      const hasColor=filters.colors.some(c=>(p.colors||[]).includes(c));
      if(!hasColor) return false;
    }
    // Preço mínimo
    if(filters.priceMin!==''&&p.price<parseFloat(filters.priceMin)) return false;
    // Preço máximo
    if(filters.priceMax!==''&&p.price>parseFloat(filters.priceMax)) return false;
    return true;
  });
}

/* Constrói o painel de filtros */
function buildFilters(){
  const sizes  = getAllSizes();
  const colors = getAllColors();

  el('filterSizes').innerHTML = sizes.map(s=>`
    <button class="filter-chip${filters.sizes.includes(s)?' active':''}"
            onclick="toggleFilter('sizes','${s}')">${s}</button>`
  ).join('');

  el('filterColors').innerHTML = colors.map(c=>`
    <button class="filter-chip${filters.colors.includes(c)?' active':''}"
            onclick="toggleFilter('colors','${c}')">${c}</button>`
  ).join('');

  el('filterPriceMin').value = filters.priceMin;
  el('filterPriceMax').value = filters.priceMax;

  updateFilterBadge();
}

function toggleFilter(type, value){
  const arr=filters[type];
  const idx=arr.indexOf(value);
  if(idx===-1) arr.push(value); else arr.splice(idx,1);
  buildFilters();
  renderProducts();
}

function applyPriceFilter(){
  filters.priceMin = el('filterPriceMin').value;
  filters.priceMax = el('filterPriceMax').value;
  updateFilterBadge();
  renderProducts();
}

function clearAllFilters(){
  filters={sizes:[],colors:[],priceMin:'',priceMax:''};
  buildFilters(); renderProducts();
}

function updateFilterBadge(){
  const count=filters.sizes.length+filters.colors.length+
    (filters.priceMin!==''?1:0)+(filters.priceMax!==''?1:0);
  const badge=el('filterBadge');
  if(count>0){
    badge.textContent=count;
    badge.style.display='flex';
  } else {
    badge.style.display='none';
  }
  // Atualiza texto do botão limpar
  el('clearFiltersBtn').style.display=count>0?'inline-flex':'none';
}

function openFilters(){
  buildFilters();
  el('filterPanel').classList.add('open');
}
function closeFilters(){
  el('filterPanel').classList.remove('open');
}

/* ══════════════════════════════════════════════════════════════
   ESTOQUE helpers
══════════════════════════════════════════════════════════════ */

/* Qtd de pid+size já no carrinho */
function qtyInCart(pid,size){
  return cart.filter(i=>i.pid===pid&&i.size===size).reduce((a,i)=>a+i.qty,0);
}

/* Estoque disponível de um tamanho específico */
function availForSize(p,size){
  if(!p.stock||p.stock[size]==null) return 999;
  return Math.max(0,p.stock[size]-qtyInCart(p.id,size));
}

/* Status geral para o card (soma todos tamanhos) */
function cardStockInfo(p){
  if(!p.stock) return{cls:'in-stock',text:'Disponível'};
  const total=Object.values(p.stock).reduce((a,v)=>a+v,0);
  if(total===0) return{cls:'out-of-stock',text:'Esgotado'};
  if(total<=5)  return{cls:'low-stock',   text:`Últimas ${total} unidades`};
  return           {cls:'in-stock',   text:`${total} em estoque`};
}

/* Produto completamente esgotado? */
function isFullyOutOfStock(p){
  if(!p.stock) return false;
  return Object.values(p.stock).every(v=>v===0);
}

/* ══════════════════════════════════════════════════════════════
   PRODUCTS
══════════════════════════════════════════════════════════════ */
function renderProducts(){
  const grid=el('productsGrid');

  if(!state.products.length){
    el('productCount').textContent='0 produtos';
    grid.innerHTML='<p class="no-data" style="grid-column:1/-1">Nenhum produto cadastrado ainda.</p>';
    return;
  }

  const filtered=applyFilters(state.products);
  const total=state.products.length, showing=filtered.length;
  el('productCount').textContent=showing===total?`${total} produtos`:`${showing} de ${total} produtos`;

  if(!filtered.length){
    grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:60px 20px">
      <div style="font-size:2rem;margin-bottom:12px">🔍</div>
      <div style="font-weight:600;margin-bottom:6px">Nenhum produto encontrado</div>
      <div style="font-size:0.85rem;color:var(--muted)">Tente outros filtros</div>
      <button onclick="clearAllFilters()" style="margin-top:14px;background:var(--red);border:none;color:white;padding:8px 18px;border-radius:6px;cursor:pointer;font-family:var(--font-head);font-weight:700;letter-spacing:1px">Limpar Filtros</button>
    </div>`;
    return;
  }

  grid.innerHTML=filtered.map((p,i)=>{
    const si=cardStockInfo(p);
    const esgotado=isFullyOutOfStock(p);
    return `
    <div class="product-card${esgotado?' esgotado':''}" style="animation-delay:${i*0.06}s"
         onclick="${esgotado?'':  `openProduct('${p.id}')`}">
      <div class="card-img-wrap">
        <img src="${p.img}" alt="${p.name}"
             onerror="this.src='https://via.placeholder.com/300x200/0f0f0f/d4191a?text=IMG'">
        ${p.badge?`<div class="card-badge${p.badge==='EXCLUSIVO'?' silver':p.badge==='NOVO'?' new':''}">${p.badge}</div>`:''}
        <button class="card-wishlist" onclick="event.stopPropagation()" title="Favoritar">♡</button>
      </div>
      <div class="card-body">
        <div class="card-category">${p.category}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-tags">
          ${(p.tags||[]).map(t=>`<span class="card-tag">${t}</span>`).join('')}
          ${p.embroidery?'<span class="card-tag">✂ bordado</span>':''}
        </div>
        <div class="card-stock ${si.cls}">● ${si.text}</div>
        <div class="card-price-row">
          <div class="card-price">${fmt(p.price)}</div>
          ${p.priceOld?`<div class="card-price-old">${fmt(p.priceOld)}</div>`:''}
        </div>
        ${p.installments>0
          ?`<div class="card-installment">${p.installments}x de ${fmt(p.price/p.installments)} sem juros*</div>`
          :`<div class="card-installment pix-tag">💠 Somente via PIX</div>`}
        <div class="card-shipping">${p.shipping||''}</div>
        <button class="card-cta" ${esgotado?'disabled':''}
          onclick="event.stopPropagation();${esgotado?'':` openProduct('${p.id}')`}">
          ${esgotado?'😞 Esgotado':'🛒 Comprar'}
        </button>
      </div>
    </div>`;
  }).join('');
}

/* ── PRODUCT MODAL ── */
function openProduct(id){
  const p=state.products.find(x=>x.id===id);
  if(!p||isFullyOutOfStock(p)) return;
  currentProduct=p; selectedSize=''; selectedQty=1;

  el('modalBrand').textContent    =p.category;
  el('modalName').textContent     =p.name;
  el('modalImg').src              =p.img;
  el('modalImg').alt              =p.name;
  el('modalPrice').textContent    =fmt(p.price);
  el('modalSub').textContent      =p.installments>0
    ?`${p.installments}x de ${fmt(p.price/p.installments)} sem juros*`:'💠 Somente via PIX';
  el('modalShipping').textContent =p.shipping||'';
  el('modalObs').value            ='';
  el('embGroup').style.display    =p.embroidery?'block':'none';
  el('embColorGroup').style.display=p.embroidery?'block':'none';
  el('embText').value=''; el('embColor').value='';

  /* Chips de tamanho com estoque individual */
  el('sizesWrap').innerHTML=(p.sizes||[]).map(s=>{
    const avail=availForSize(p,s);
    const out=avail===0;
    const hint=p.stock?(out?'Esgotado':avail<=3?`${avail} disp.`:''):'';
    return `<button class="size-chip${out?' size-out':''}"
              onclick="${out?'':` pickSize(this,'${s}')`}"
              ${out?'disabled':''}
              title="${hint}">${s}${p.stock&&!out&&avail<=3?` <small>(${avail})</small>`:''}</button>`;
  }).join('');

  /* Quantidade */
  el('modalQty').textContent='1';
  el('modalQtyTotal').textContent='';
  el('qtyMinus').disabled=true;
  el('qtyPlus').disabled=false;
  el('addToCartBtn').disabled=true;

  openModal('productModal');
}

function pickSize(btn,s){
  document.querySelectorAll('.size-chip').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  selectedSize=s; selectedQty=1;
  el('modalQty').textContent='1';
  el('modalQtyTotal').textContent='';
  updateQtyButtons();
  el('addToCartBtn').disabled=false;
}

function updateQtyButtons(){
  if(!currentProduct||!selectedSize) return;
  const avail=availForSize(currentProduct,selectedSize);
  el('qtyMinus').disabled=selectedQty<=1;
  el('qtyPlus').disabled =selectedQty>=avail;
  el('modalQtyTotal').textContent=selectedQty>1?`= ${fmt(currentProduct.price*selectedQty)}`:'';
}

function changeQty(delta){
  if(!currentProduct||!selectedSize) return;
  const avail=availForSize(currentProduct,selectedSize);
  selectedQty=Math.min(Math.max(1,selectedQty+delta),avail);
  el('modalQty').textContent=selectedQty;
  updateQtyButtons();
}

/* ── ADICIONAR AO CARRINHO ── */
function addToCart(){
  if(!selectedSize){alert('Selecione um tamanho!');return;}
  const avail=availForSize(currentProduct,selectedSize);
  if(selectedQty>avail){alert('Estoque insuficiente!');return;}

  const emb=el('embText').value.trim(), embColor=el('embColor').value.trim();
  const existing=cart.find(i=>i.pid===currentProduct.id&&i.size===selectedSize&&i.emb===emb&&i.embColor===embColor);

  if(existing){
    const newQty=existing.qty+selectedQty;
    const maxQty=currentProduct.stock?currentProduct.stock[selectedSize]:999;
    if(newQty>maxQty){alert(`Só há ${maxQty} unidades no tamanho ${selectedSize}.`);return;}
    existing.qty=newQty;
    existing.price=existing.unitPrice*newQty;
  } else {
    cart.push({
      uid:uid(), pid:currentProduct.id,
      name:currentProduct.name, img:currentProduct.img,
      unitPrice:currentProduct.price,
      price:currentProduct.price*selectedQty,
      size:selectedSize, qty:selectedQty,
      emb, embColor, obs:el('modalObs').value.trim()
    });
  }
  saveCart(); updateCartBadge();
  closeAllModals(); renderCart(); openModal('cartModal');
}

/* ══════════════════════════════════════════════════════════════
   CART
══════════════════════════════════════════════════════════════ */
function updateCartBadge(){
  el('cartCount').textContent=cart.reduce((a,i)=>a+i.qty,0);
}
function openCart(){ renderCart(); openModal('cartModal'); }

function renderCart(){
  const wrap=el('cartItemsWrap');
  const total=cart.reduce((a,i)=>a+i.price,0);
  const items=cart.reduce((a,i)=>a+i.qty,0);

  if(!cart.length){
    wrap.innerHTML=`<div class="cart-empty"><div class="empty-icon">🛒</div>Seu carrinho está vazio</div>`;
    el('cartTotal').textContent=fmt(0);
    el('cartNote').textContent='0 itens';
    el('checkoutBtn').disabled=true;
    return;
  }

  wrap.innerHTML=cart.map(item=>{
    const p=state.products.find(x=>x.id===item.pid);
    const maxQty=p&&p.stock?( p.stock[item.size]??999):999;
    return `
    <div class="cart-item">
      <img class="cart-item-thumb" src="${item.img}"
           onerror="this.src='https://via.placeholder.com/68/0f0f0f/d4191a?text=+'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">
          Tamanho: <b>${item.size}</b>
          ${item.emb      ?` · Bordado: <b>${item.emb}</b>`:''}
          ${item.embColor ?` (${item.embColor})`:''}
          ${item.obs      ?`<br>Obs: ${item.obs}`:''}
        </div>
        <div class="cart-item-qty">
          <button class="cqty-btn" onclick="cartChangeQty('${item.uid}',-1)" ${item.qty<=1?'disabled':''}>−</button>
          <span class="cqty-num">${item.qty}</span>
          <button class="cqty-btn" onclick="cartChangeQty('${item.uid}',1)"  ${item.qty>=maxQty?'disabled':''}>+</button>
          <span class="cqty-label">${item.unitPrice?fmt(item.unitPrice)+' / un.':''}</span>
        </div>
      </div>
      <div class="cart-item-price">${fmt(item.price)}</div>
      <button class="cart-item-del" onclick="removeCartItem('${item.uid}')" title="Remover">🗑</button>
    </div>`;
  }).join('');

  el('cartTotal').textContent=fmt(total);
  el('cartNote').textContent=`${items} ${items===1?'item':'itens'}`;
  el('checkoutBtn').disabled=false;
}

function cartChangeQty(id,delta){
  const item=cart.find(i=>i.uid===id);
  if(!item) return;
  const p=state.products.find(x=>x.id===item.pid);
  const maxQty=p&&p.stock?(p.stock[item.size]??999):999;
  const newQty=Math.min(Math.max(1,item.qty+delta),maxQty);
  if(newQty===item.qty) return;
  item.qty=newQty; item.price=item.unitPrice*newQty;
  saveCart(); updateCartBadge(); renderCart();
}

function removeCartItem(id){
  cart=cart.filter(x=>x.uid!==id);
  saveCart(); updateCartBadge(); renderCart();
}

/* ══════════════════════════════════════════════════════════════
   CHECKOUT — PagarM + Mercado Pago
══════════════════════════════════════════════════════════════ */

/* Calcula máximo de parcelas: 1 parcela a cada R$50, máx 4 */
function maxParcelas(total){
  return Math.min(4, Math.max(1, Math.floor(total / 50)));
}

function openCheckout(){
  if(!cart.length) return;
  closeAllModals();

  const total=cart.reduce((a,b)=>a+b.price,0);

  // Resumo do pedido
  const rows=cart.map(i=>`<div class="order-sum-row"><span>${i.name} (${i.size}) x${i.qty}</span><span>${fmt(i.price)}</span></div>`).join('');
  el('orderSummary').innerHTML=rows+`<div class="order-sum-total"><span>TOTAL</span><span class="val">${fmt(total)}</span></div>`;

  // Gera opções de pagamento dinamicamente
  const maxP=maxParcelas(total);
  const opts=[];

  // PIX sempre disponível
  opts.push({
    pay:'PIX', icon:'💠',
    label:'PIX',
    desc:'Aprovação imediata',
    installments: 1,
  });

  // Parcelado: só aparece se total >= R$100 (mínimo 2 parcelas)
  if(maxP>=2){
    for(let p=2;p<=maxP;p++){
      opts.push({
        pay:`Parcelado ${p}x`,
        icon:'💳',
        label:`${p}x de ${fmt(total/p)}`,
        desc:`Cartão de crédito · ${p} parcelas sem juros`,
        installments: p,
      });
    }
  }

  // Boleto sempre disponível
  opts.push({
    pay:'Boleto', icon:'📄',
    label:'Boleto',
    desc:'Vence em 3 dias úteis',
    installments: 1,
  });

  el('pagarmWrap').innerHTML=opts.map(o=>`
    <button type="button" class="pagarm-opt"
            data-pay="${o.pay}"
            data-installments="${o.installments}"
            onclick="selectPay(this)">
      <span class="pagarm-icon">${o.icon}</span>
      <div class="pagarm-text">
        <span class="pagarm-label">${o.label}</span>
        <span class="pagarm-desc">${o.desc}</span>
      </div>
      <span class="pagarm-check">✓</span>
    </button>`).join('');

  // Reset docs e botão
  el('docCpf').value=''; el('docCnpj').value='';
  el('docError').style.display='none'; el('mpBtn').disabled=true;

  openModal('checkoutModal');
}

function selectPay(btn){
  document.querySelectorAll('.pagarm-opt').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected'); checkDocs();
}

function fmtCpf(input){
  let v=input.value.replace(/\D/g,'').slice(0,11);
  if(v.length>9) v=v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/,'$1.$2.$3-$4');
  else if(v.length>6) v=v.replace(/(\d{3})(\d{3})(\d{0,3})/,'$1.$2.$3');
  else if(v.length>3) v=v.replace(/(\d{3})(\d{0,3})/,'$1.$2');
  input.value=v;
}
function fmtCnpj(input){
  let v=input.value.replace(/\D/g,'').slice(0,14);
  if(v.length>12) v=v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,'$1.$2.$3/$4-$5');
  else if(v.length>8) v=v.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/,'$1.$2.$3/$4');
  else if(v.length>5) v=v.replace(/(\d{2})(\d{3})(\d{0,3})/,'$1.$2.$3');
  else if(v.length>2) v=v.replace(/(\d{2})(\d{0,3})/,'$1.$2');
  input.value=v;
}
function checkDocs(){
  const cpf=el('docCpf').value.replace(/\D/g,'');
  const cnpj=el('docCnpj').value.replace(/\D/g,'');
  const docOk=cpf.length===11||cnpj.length===14;
  const payOk=!!document.querySelector('.pagarm-opt.selected');
  el('docError').style.display='none';
  el('mpBtn').disabled=!(docOk&&payOk);
}
/* ══════════════════════════════════════════════════════════════
   CHECKOUT → BACKEND
   O frontend envia apenas IDs, tamanhos e quantidades.
   O preço real é calculado no servidor.
══════════════════════════════════════════════════════════════ */

/* URL do backend — em produção troque pelo domínio real */
const BACKEND_URL    = 'http://localhost:4000';
const INTERNAL_KEY   = 'troque-por-uma-chave-secreta-longa-aqui'; // mesma do .env

function goToMercadoPago() {
  const cpf  = el('docCpf').value.replace(/\D/g, '');
  const cnpj = el('docCnpj').value.replace(/\D/g, '');

  if (cpf.length !== 11 && cnpj.length !== 14) {
    el('docError').style.display = 'block';
    return;
  }

  const payBtn = document.querySelector('.pagarm-opt.selected');
  if (!payBtn) return;

  const paymentMethod = payBtn.dataset.pay; // ex: "PIX", "Parcelado 2x", "Boleto"
  const installments  = parseInt(payBtn.dataset.installments ?? '1', 10);

  /* Monta payload com IDs + tamanhos + quantidades — SEM preços */
  const items = cart.map(i => ({
    productId: i.pid,
    size:      i.size,
    qty:       i.qty,
  }));

  const payerDoc = cpf.length === 11
    ? { type: 'CPF',  number: cpf  }
    : { type: 'CNPJ', number: cnpj };

  /* Desabilita botão e mostra loading */
  const btn = el('mpBtn');
  btn.disabled = true;
  btn.textContent = 'Processando...';

  fetch(`${BACKEND_URL}/api/checkout`, {
    method:  'POST',
    headers: {
      'Content-Type':   'application/json',
      'x-internal-key': INTERNAL_KEY,
    },
    body: JSON.stringify({ items, payerDoc, paymentMethod, installments }),
  })
  .then(r => r.json())
  .then(data => {
    if (!data.ok || !data.checkoutUrl) {
      throw new Error(data.error || 'Erro desconhecido.');
    }
    /* Limpa carrinho e redireciona para o Mercado Pago */
    cart = []; saveCart(); updateCartBadge(); closeAllModals();
    window.open(data.checkoutUrl, '_blank');
  })
  .catch(err => {
    alert('Erro ao criar pagamento: ' + err.message);
  })
  .finally(() => {
    btn.disabled    = false;
    btn.textContent = 'Pagar com Mercado Pago';
  });
}

/* ══════════════════════════════════════════════════════════════
   ADMIN
══════════════════════════════════════════════════════════════ */
function openAdminLogin(){
  el('adminPass').value=''; el('loginError').style.display='none';
  openModal('adminLoginModal');
}
function loginAdmin(){
  if(el('adminPass').value===(state.settings.adminPass||'admin123')){
    closeAllModals(); loadAdminPanel(); openModal('adminModal');
  } else { el('loginError').style.display='block'; }
}
function loadAdminPanel(){
  editingId=null; el('editingId').value='';
  clearProductForm(); renderAdminProducts(); switchTab('products');
}
function switchTab(name){
  ['products','add','settings'].forEach(t=>{
    el('tab-'+t).style.display=t===name?'block':'none';
  });
  document.querySelectorAll('.tab-btn').forEach((b,i)=>{
    b.classList.toggle('active',['products','add','settings'][i]===name);
  });
  if(name==='settings') loadSettings();
}

function renderAdminProducts(){
  const list=el('adminProdList');
  if(!state.products.length){list.innerHTML='<p class="no-data">Nenhum produto ainda.</p>';return;}
  list.innerHTML=state.products.map(p=>{
    const si=cardStockInfo(p);
    return `
    <div class="admin-prod-item">
      <img class="admin-prod-thumb" src="${p.img}" onerror="this.src='https://via.placeholder.com/58/0f0f0f/d4191a?text=+'">
      <div class="admin-prod-info">
        <div class="admin-prod-name">${p.name}</div>
        <div class="admin-prod-price">${fmt(p.price)} · ${p.category}</div>
        <div class="admin-prod-stock ${si.cls}" style="font-size:0.75rem;margin-top:3px">● ${si.text}</div>
      </div>
      <div class="admin-prod-actions">
        <button class="btn-edit" onclick="editProduct('${p.id}')">✏ Editar</button>
        <button class="btn-del"  onclick="deleteProduct('${p.id}')">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function editProduct(id){
  const p=state.products.find(x=>x.id===id);
  if(!p) return;
  editingId=id; uploadedImgData=null;
  el('imgPreviewWrap').style.display='none';
  el('imgPreview').src=''; el('pImgFile').value='';
  el('pImg').placeholder='Cole uma URL de imagem (https://...)';
  el('editingId').value=id;
  el('pCategory').value=p.category||'';
  el('pName').value=p.name||'';
  el('pPrice').value=p.price||'';
  el('pPriceOld').value=p.priceOld||'';
  el('pInstallments').value=p.installments!=null?String(p.installments):'0';
  el('pImg').value=p.img||'';
  el('pShipping').value=p.shipping||'';
  el('pSizes').value=(p.sizes||[]).join(', ');
  el('pTags').value=(p.tags||[]).join(', ');
  el('pBadge').value=p.badge||'';
  el('pEmbroidery').value=p.embroidery?'1':'0';
  el('pColors').value=(p.colors||[]).join(', ');
  buildStockFields(p.sizes||[], p.stock||{});
  el('saveProductBtn').textContent='💾 Salvar Alterações';
  switchTab('add');
}

function deleteProduct(id){
  if(!confirm('Remover este produto?')) return;
  state.products=state.products.filter(x=>x.id!==id);
  saveState(); renderProducts(); renderAdminProducts();
}

function clearProductForm(){
  ['pCategory','pName','pPrice','pPriceOld','pImg','pShipping','pSizes','pTags','pBadge','pColors'].forEach(id=>el(id).value='');
  el('pInstallments').value='0'; el('pEmbroidery').value='0';
  el('editingId').value='';
  el('saveProductBtn').textContent='💾 Salvar Produto';
  el('stockFieldsWrap').innerHTML='<p style="color:var(--muted);font-size:0.85rem">Preencha os tamanhos acima para definir o estoque.</p>';
  editingId=null;
}

/* Constrói campos de qtd por tamanho */
function buildStockFields(sizes,existingStock){
  const wrap=el('stockFieldsWrap');
  if(!sizes.length){
    wrap.innerHTML='<p style="color:var(--muted);font-size:0.85rem">Preencha os tamanhos acima para definir o estoque.</p>';
    return;
  }
  wrap.innerHTML=sizes.map(s=>`
    <div class="stock-field">
      <label class="stock-size-label">${s}</label>
      <input class="form-input stock-qty-input" type="number" min="0"
             id="stock_${s}" placeholder="0" value="${existingStock[s]??''}">
    </div>`).join('');
}

/* Atualiza campos quando o admin digita tamanhos */
function onSizesChange(){
  const raw=el('pSizes').value.trim();
  const sizes=raw?raw.split(',').map(s=>s.trim()).filter(Boolean):[];
  const existing={};
  sizes.forEach(s=>{ const i=el('stock_'+s); if(i) existing[s]=parseInt(i.value)||0; });
  buildStockFields(sizes,existing);
}

function saveProduct(){
  const category=el('pCategory').value.trim();
  const name=el('pName').value.trim();
  const price=parseFloat(el('pPrice').value);
  const priceOldRaw=el('pPriceOld').value.trim();
  const priceOld=priceOldRaw?parseFloat(priceOldRaw):null;
  const installments=parseInt(el('pInstallments').value)||0;
  const img=uploadedImgData||el('pImg').value.trim();
  const shipping=el('pShipping').value.trim();
  const sizesRaw=el('pSizes').value.trim();
  const tagsRaw=el('pTags').value.trim();
  const badge=el('pBadge').value.trim();
  const embroidery=el('pEmbroidery').value==='1';

  if(!category||!name||isNaN(price)||!img){
    alert('Preencha categoria, nome, preço e imagem!'); return;
  }

  const sizes=sizesRaw?sizesRaw.split(',').map(s=>s.trim()).filter(Boolean):[];
  const tags =tagsRaw ?tagsRaw.split(',').map(t=>t.trim()).filter(Boolean):[];
  const colorsRaw=el('pColors').value.trim();
  const colors=colorsRaw?colorsRaw.split(',').map(c=>c.trim()).filter(Boolean):[];

  /* Lê estoque de cada campo dinâmico */
  const stock={};
  sizes.forEach(s=>{
    const inp=el('stock_'+s);
    stock[s]=inp?(parseInt(inp.value)||0):0;
  });

  const eid=el('editingId').value;
  if(eid){
    const idx=state.products.findIndex(x=>x.id===eid);
    if(idx>-1) state.products[idx]={...state.products[idx],category,name,price,priceOld,installments,img,shipping,sizes,tags,badge,embroidery,stock,colors};
  } else {
    state.products.push({id:'p'+Date.now(),category,name,price,priceOld,installments,img,shipping,sizes,tags,badge,embroidery,stock,colors});
  }
  saveState(); renderProducts(); renderAdminProducts();
  clearProductForm(); clearImgUpload(); switchTab('products');
}

/* ── Image Upload ── */
function handleImgUpload(input){
  const file=input.files[0]; if(!file) return;
  if(!['image/jpeg','image/jpg','image/png'].includes(file.type)){alert('Apenas JPG ou PNG!');input.value='';return;}
  if(file.size>2*1024*1024){alert('Máximo 2MB!');input.value='';return;}
  const r=new FileReader();
  r.onload=e=>{
    uploadedImgData=e.target.result;
    el('pImg').value=''; el('imgPreview').src=uploadedImgData;
    el('imgPreviewWrap').style.display='flex';
    el('pImg').placeholder='(usando arquivo enviado)';
  };
  r.readAsDataURL(file);
}
function clearImgUpload(){
  uploadedImgData=null; el('pImgFile').value='';
  el('imgPreviewWrap').style.display='none'; el('imgPreview').src='';
  el('pImg').value=''; el('pImg').placeholder='Cole uma URL de imagem (https://...)';
}

/* ── Settings ── */
function loadSettings(){
  el('sStoreName').value=state.settings.storeName||'Flow Imports';
  el('sWhatsApp').value =state.settings.whatsapp ||'';
  el('sMpLink').value   =state.settings.mpLink   ||'';
  el('sNewPass').value  ='';
}
function saveSettings(){
  const n=el('sStoreName').value.trim(),w=el('sWhatsApp').value.trim(),
        m=el('sMpLink').value.trim(),p=el('sNewPass').value.trim();
  if(n) state.settings.storeName=n;
  if(w) state.settings.whatsapp=w;
  if(m) state.settings.mpLink=m;
  if(p) state.settings.adminPass=p;
  saveState(); applyStoreName(); alert('Configurações salvas com sucesso!');
}

/* ── Modal helpers ── */
function openModal(id) { el(id).classList.add('open'); }
function closeModal(id){ el(id).classList.remove('open'); }
function closeAllModals(){ document.querySelectorAll('.modal-overlay').forEach(m=>m.classList.remove('open')); }
