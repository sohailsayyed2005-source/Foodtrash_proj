/* ============================================================
   FoodRush — Main App JS
   Handles: API, Cart, Search, Animations, Interactions
   ============================================================ */

'use strict';

// ── Config ──────────────────────────────────────────────────
const API_BASE = 'php/api.php';
const DELIVERY_FEE = 40;
const COUPONS = {
  FIRST50:   { type: 'percent', value: 50, minOrder: 200 },
  FLAT100:   { type: 'flat',    value: 100, minOrder: 500 },
  WELCOME30: { type: 'percent', value: 30, minOrder: 0 },
};

// ── State ────────────────────────────────────────────────────
const state = {
  cart:       [],
  favorites:  new Set(),
  coupon:     null,
  menuItems:  [],
  currentCat: 'all',
};

// ── Selectors ────────────────────────────────────────────────
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

// ── Loader ───────────────────────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    $('#loader').classList.add('hidden');
    triggerHeroAnimations();
  }, 1800);
});

// ── Custom Cursor ────────────────────────────────────────────
const cursor      = $('#cursor');
const cursorTrail = $('#cursorTrail');
let mouseX = 0, mouseY = 0, trailX = 0, trailY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});

(function animateTrail() {
  trailX += (mouseX - trailX) * 0.15;
  trailY += (mouseY - trailY) * 0.15;
  cursorTrail.style.left = trailX + 'px';
  cursorTrail.style.top  = trailY + 'px';
  requestAnimationFrame(animateTrail);
})();

// ── Smooth Nav ───────────────────────────────────────────────
const nav = $('#nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 60);
  // hide nav on scroll down, show on scroll up
  if (y > lastScroll + 5 && y > 200) nav.style.transform = 'translateY(-100%)';
  else if (y < lastScroll - 5) nav.style.transform = 'translateY(0)';
  lastScroll = y;
  revealOnScroll();
});
nav.style.transition = 'transform 0.3s ease, background 0.3s, box-shadow 0.3s';

// ── Scroll Reveal ────────────────────────────────────────────
function revealOnScroll() {
  $$('.reveal').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) el.classList.add('visible');
  });
}

// ── Count-Up Animation ───────────────────────────────────────
function triggerHeroAnimations() {
  $$('.count-up').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const isDecimal = target % 1 !== 0;
    const duration = 1600;
    const step = 16;
    const increment = target / (duration / step);
    let current = 0;

    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      el.textContent = isDecimal
        ? current.toFixed(1)
        : Math.floor(current).toLocaleString();
      if (current >= target) clearInterval(timer);
    }, step);
  });
}

// ── API Fetch ────────────────────────────────────────────────
async function apiFetch(params) {
  const url = API_BASE + '?' + new URLSearchParams(params);
  try {
    const res = await fetch(url);
    return await res.json();
  } catch {
    // Return mock data if PHP server is not running
    return getMockFallback(params.action);
  }
}

async function apiPost(action, body) {
  try {
    const res = await fetch(`${API_BASE}?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch {
    return getMockFallback(action);
  }
}

function getMockFallback(action) {
  // Inline mock data when no PHP server is running
  const items = [
    {id:1,name:"Margherita Pizza",category:"pizza",price:299,rating:4.8,image:"https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=300&fit=crop",description:"Fresh tomatoes, mozzarella, basil",prep_time:20,badge:"Bestseller"},
    {id:2,name:"Smoky BBQ Burger",category:"burger",price:199,rating:4.7,image:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",description:"Smoked beef, cheddar, caramelized onions",prep_time:15,badge:"Hot"},
    {id:3,name:"Dragon Roll Sushi",category:"sushi",price:349,rating:4.9,image:"https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&h=300&fit=crop",description:"Avocado, shrimp, cucumber, spicy mayo",prep_time:25,badge:"Chef's Pick"},
    {id:4,name:"Penne Arrabbiata",category:"pasta",price:249,rating:4.6,image:"https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&h=300&fit=crop",description:"Spicy tomato, garlic, fresh chilli",prep_time:18,badge:"Spicy"},
    {id:5,name:"Pad Thai Noodles",category:"asian",price:229,rating:4.7,image:"https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop",description:"Rice noodles, prawns, peanuts, lime",prep_time:20,badge:"Popular"},
    {id:6,name:"Chicken Shawarma",category:"wraps",price:179,rating:4.5,image:"https://images.unsplash.com/photo-1633321702518-7feccafb94d5?w=400&h=300&fit=crop",description:"Marinated chicken, garlic sauce, veggies",prep_time:12,badge:"Quick"},
    {id:7,name:"Truffle Mac & Cheese",category:"comfort",price:279,rating:4.8,image:"https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&h=300&fit=crop",description:"Four cheese blend, black truffle oil",prep_time:22,badge:"Trending"},
    {id:8,name:"Mango Tango Salad",category:"salads",price:159,rating:4.4,image:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",description:"Mixed greens, mango, feta, lime dressing",prep_time:10,badge:"Healthy"},
    {id:9,name:"Butter Chicken",category:"indian",price:269,rating:4.9,image:"https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop",description:"Tender chicken in creamy tomato gravy",prep_time:25,badge:"Bestseller"},
    {id:10,name:"Chocolate Lava Cake",category:"desserts",price:149,rating:4.9,image:"https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop",description:"Warm molten centre, vanilla ice cream",prep_time:15,badge:"Must Try"},
    {id:11,name:"Veggie Supreme Pizza",category:"pizza",price:269,rating:4.5,image:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",description:"Bell peppers, olives, mushrooms, onions",prep_time:20,badge:"Veg"},
    {id:12,name:"Korean Fried Chicken",category:"asian",price:319,rating:4.8,image:"https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&h=300&fit=crop",description:"Double-fried, gochujang glaze, pickled daikon",prep_time:30,badge:"New"},
  ];
  const restaurants = [
    {id:1,name:"The Pizza Republic",rating:4.8,delivery_time:"20-30",min_order:199,cuisine:"Italian",image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",offers:"30% OFF"},
    {id:2,name:"Burger District",rating:4.7,delivery_time:"15-25",min_order:149,cuisine:"American",image:"https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&h=400&fit=crop",offers:"Free Fries"},
    {id:3,name:"Tokyo Garden",rating:4.9,delivery_time:"25-35",min_order:299,cuisine:"Japanese",image:"https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop",offers:"15% OFF"},
    {id:4,name:"Spice Route",rating:4.8,delivery_time:"20-30",min_order:249,cuisine:"Indian",image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop",offers:"Free Delivery"},
  ];
  const reviews = [
    {name:"Priya S.",rating:5,comment:"Best delivery in town! Food was piping hot and absolutely delicious.",time:"2 hours ago",avatar:"PS"},
    {name:"Arjun M.",rating:5,comment:"Ordered the Butter Chicken — absolutely phenomenal. 10/10!",time:"Yesterday",avatar:"AM"},
    {name:"Sneha K.",rating:4,comment:"Great variety, quick delivery. Will definitely order again!",time:"3 days ago",avatar:"SK"},
  ];
  if (action === 'menu')        return {success:true,data:items};
  if (action === 'restaurants') return {success:true,data:restaurants};
  if (action === 'reviews')     return {success:true,data:reviews};
  if (action === 'place_order') return {success:true,order_id:'FR'+Math.random().toString(36).substr(2,6).toUpperCase(),eta:Math.floor(Math.random()*20)+20};
  if (action === 'search')      return {success:true,data:items};
  return {success:false};
}

// ── Menu Rendering ───────────────────────────────────────────
async function loadMenu() {
  const data = await apiFetch({ action: 'menu' });
  state.menuItems = data.data || [];
  renderMenu(state.menuItems);
}

function renderMenu(items) {
  const grid = $('#menuGrid');
  grid.innerHTML = '';

  if (!items.length) {
    grid.innerHTML = '<div class="menu-loading"><span>😔 No items found</span></div>';
    return;
  }

  items.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'menu-card reveal';
    card.style.animationDelay = (i * 0.07) + 's';
    card.dataset.cat = item.category;
    card.innerHTML = `
      <div class="card-img">
        <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.parentElement.style.background='var(--card2)';this.style.display='none'">
        ${item.badge ? `<span class="card-badge">${item.badge}</span>` : ''}
        <button class="card-fav" onclick="toggleFav(${item.id}, this)" title="Add to favourites">♡</button>
      </div>
      <div class="card-body">
        <div class="card-name">${item.name}</div>
        <div class="card-desc">${item.description}</div>
        <div class="card-meta">
          <span class="card-rating">★ ${item.rating}</span>
          <span>·</span>
          <span>⏱ ${item.prep_time} mins</span>
        </div>
        <div class="card-footer">
          <div class="card-price">₹${item.price} <span>per serving</span></div>
          <button class="btn-add" onclick="addToCart(${JSON.stringify(item).replace(/"/g,"'")})">
            + Add
          </button>
        </div>
      </div>`;
    grid.appendChild(card);
  });

  revealOnScroll();
}

// ── Category Filter ──────────────────────────────────────────
$$('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    state.currentCat = cat;
    const filtered = cat === 'all'
      ? state.menuItems
      : state.menuItems.filter(i => i.category === cat);
    renderMenu(filtered);
  });
});

// ── Favourites ───────────────────────────────────────────────
function toggleFav(id, btn) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    btn.classList.remove('active');
    btn.textContent = '♡';
    showToast('Removed from favourites', 'ℹ️');
  } else {
    state.favorites.add(id);
    btn.classList.add('active');
    btn.textContent = '♥';
    showToast('Added to favourites! ❤️', '✓', 'success');
  }
}

// ── Cart ─────────────────────────────────────────────────────
function addToCart(item) {
  // item may come as object from JS or as string from onclick
  if (typeof item === 'string') {
    item = JSON.parse(item.replace(/'/g, '"'));
  }
  const existing = state.cart.find(c => c.id === item.id);
  if (existing) {
    existing.qty++;
    showToast(`${item.name} qty updated`, '🛒');
  } else {
    state.cart.push({ ...item, qty: 1 });
    showToast(`${item.name} added to cart`, '✓', 'success');
  }
  updateCartBadge();
  renderCart();
  animateCartBtn();
}

function updateCartBadge() {
  const count = state.cart.reduce((s, i) => s + i.qty, 0);
  const badge = $('#cartCount');
  badge.textContent = count;
  badge.classList.toggle('show', count > 0);
}

function animateCartBtn() {
  const btn = $('#cartToggle');
  btn.style.transform = 'scale(1.3)';
  setTimeout(() => btn.style.transform = 'scale(1)', 200);
}

function renderCart() {
  const body   = $('#cartBody');
  const footer = $('#cartFooter');

  if (!state.cart.length) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="ce-icon">🍽️</div>
        <p>Your cart is empty</p>
        <small>Add items to get started</small>
      </div>`;
    footer.style.display = 'none';
    return;
  }

  body.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <div class="ci-icon"><img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;"></div>
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        <div class="ci-price">₹${item.price * item.qty}</div>
      </div>
      <div class="ci-qty">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
    </div>`).join('');

  footer.style.display = 'block';
  updateTotals();
}

function changeQty(id, delta) {
  const item = state.cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter(c => c.id !== id);
    showToast('Item removed from cart', '🗑️');
  }
  updateCartBadge();
  renderCart();
}

function updateTotals() {
  const subtotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = 0;

  if (state.coupon) {
    const c = state.coupon;
    if (subtotal >= c.minOrder) {
      discount = c.type === 'percent'
        ? Math.floor(subtotal * c.value / 100)
        : c.value;
      discount = Math.min(discount, subtotal);
    }
  }

  const total = subtotal + DELIVERY_FEE - discount;
  $('#cartSubtotal').textContent = '₹' + subtotal;
  $('#cartDelivery').textContent  = '₹' + DELIVERY_FEE;
  $('#cartTotal').textContent     = '₹' + total;

  const dr = $('#discountRow');
  if (discount > 0) {
    dr.style.display = 'flex';
    $('#cartDiscount').textContent = '-₹' + discount;
  } else {
    dr.style.display = 'none';
  }
}

// Cart Sidebar Toggle
$('#cartToggle').addEventListener('click', () => openCart());
$('#cartClose').addEventListener('click',  () => closeCart());
$('#cartOverlay').addEventListener('click',() => closeCart());

function openCart() {
  $('#cartSidebar').classList.add('open');
  $('#cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  $('#cartSidebar').classList.remove('open');
  $('#cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Coupon ───────────────────────────────────────────────────
$('#applyCoupon').addEventListener('click', () => {
  const code = $('#couponInput').value.trim().toUpperCase();
  if (COUPONS[code]) {
    state.coupon = COUPONS[code];
    showToast(`Coupon ${code} applied! 🎉`, '✓', 'success');
    updateTotals();
  } else {
    showToast('Invalid coupon code', '✕', 'error');
  }
});

window.applyOffer = function(code) {
  $('#couponInput').value = code;
  openCart();
  setTimeout(() => $('#applyCoupon').click(), 300);
};

// ── Checkout — opens delivery form modal ─────────────────────
$('#checkoutBtn').addEventListener('click', () => {
  if (!state.cart.length) return;
  closeCart();
  openCheckoutForm();
});

function openCheckoutForm() {
  // Update order summary inside the form modal
  const subtotal  = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount  = calcDiscount(subtotal);
  const total     = subtotal + DELIVERY_FEE - discount;

  $('#formSummaryItems').innerHTML = state.cart.map(i =>
    `<div class="form-sum-row"><span>${i.image} ${i.name} ×${i.qty}</span><span>₹${i.price * i.qty}</span></div>`
  ).join('');
  $('#formSummaryTotal').textContent = '₹' + total;
  $('#checkoutFormOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutForm() {
  $('#checkoutFormOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function calcDiscount(subtotal) {
  if (!state.coupon) return 0;
  const c = state.coupon;
  if (subtotal < c.minOrder) return 0;
  const d = c.type === 'percent' ? Math.floor(subtotal * c.value / 100) : c.value;
  return Math.min(d, subtotal);
}

// Close form modal
$('#checkoutFormOverlay').addEventListener('click', e => {
  if (e.target === $('#checkoutFormOverlay')) closeCheckoutForm();
});
$('#closeCheckoutForm').addEventListener('click', closeCheckoutForm);

// Submit checkout form → send to PHP → save to MySQL
$('#deliveryForm').addEventListener('submit', async e => {
  e.preventDefault();

  // Validate
  const fields = ['cf_name','cf_phone','cf_email','cf_address','cf_city','cf_pincode'];
  let valid = true;
  fields.forEach(id => {
    const el = $('#' + id);
    el.classList.remove('field-error');
    if (!el.value.trim()) { el.classList.add('field-error'); valid = false; }
  });
  if (!valid) { showToast('Please fill all required fields', '✕', 'error'); return; }

  const phone = $('#cf_phone').value.trim();
  if (!/^[0-9]{10}$/.test(phone)) {
    $('#cf_phone').classList.add('field-error');
    showToast('Enter a valid 10-digit phone number', '✕', 'error'); return;
  }

  const email = $('#cf_email').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $('#cf_email').classList.add('field-error');
    showToast('Enter a valid email address', '✕', 'error'); return;
  }

  const subtotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = calcDiscount(subtotal);

  const submitBtn = $('#submitOrderBtn');
  submitBtn.textContent = '⏳ Placing Order...';
  submitBtn.disabled = true;

  const data = await apiPost('place_order', {
    customer_name:  $('#cf_name').value.trim(),
    phone:          phone,
    email:          email,
    address:        $('#cf_address').value.trim(),
    city:           $('#cf_city').value.trim(),
    pincode:        $('#cf_pincode').value.trim(),
    payment_method: $('input[name="cf_payment"]:checked')?.value || 'Cash on Delivery',
    note:           $('#cf_note').value.trim(),
    items:          state.cart,
    total:          subtotal,
    discount:       discount,
    coupon:         state.coupon?.code || null,
  });

  submitBtn.textContent = 'Place Order 🚀';
  submitBtn.disabled = false;

  if (data.success) {
    closeCheckoutForm();
    showOrderModal(data);
    state.cart = [];
    state.coupon = null;
    updateCartBadge();
    renderCart();
  } else {
    showToast(data.message || 'Something went wrong. Please try again.', '✕', 'error');
  }
});

// ════════════════════════════════════════════════════════════
// LIVE TRACKING MAP — Zomato-style animated delivery tracker
// ════════════════════════════════════════════════════════════

let trackMap       = null;   // Leaflet map instance
let riderMarker    = null;   // animated rider marker
let routeLine      = null;   // polyline route
let etaTimer       = null;   // countdown interval
let trackInterval  = null;   // rider movement interval
let riderStepIdx   = 0;      // current position along route

// Status stages config
const TRACK_STAGES = [
  { id: 'op1', label: 'Confirmed',   icon: '✅', msg: 'Your order has been confirmed and sent to the kitchen!',       delay: 0    },
  { id: 'op2', label: 'Preparing',   icon: '👨‍🍳', msg: 'The chef is preparing your order with fresh ingredients.',    delay: 6000 },
  { id: 'op3', label: 'On the way',  icon: '🛵', msg: 'Your delivery partner is on the way — hold tight!',           delay: 14000},
  { id: 'op4', label: 'Delivered',   icon: '🎉', msg: 'Order delivered! Enjoy your meal. Rate us below ⭐',          delay: 28000},
];

function showOrderModal(data) {
  $('#modalOrderId').textContent = data.order_id || '#FRXXXXXX';
  const etaMins = parseInt(data.eta) || 30;
  $('#modalEta').textContent = etaMins;

  // Reset step states
  TRACK_STAGES.forEach(s => {
    const el = $('#' + s.id);
    el.classList.remove('active','done');
  });
  $('#op1').classList.add('active');
  $('#trackStatusMsg .tsm-icon').textContent = '✅';
  $('#trackStatusText').textContent = TRACK_STAGES[0].msg;

  // Open modal
  $('#modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Init map after modal is visible
  setTimeout(() => initTrackMap(etaMins), 300);

  // Animate status stages
  clearAllTrackTimers();
  TRACK_STAGES.forEach((stage, idx) => {
    if (idx === 0) return; // already active
    const t = setTimeout(() => advanceTrackStage(idx), stage.delay);
    trackTimers.push(t);
  });

  // ETA countdown
  startEtaCountdown(etaMins * 60);
}

const trackTimers = [];
function clearAllTrackTimers() {
  trackTimers.forEach(t => clearTimeout(t));
  trackTimers.length = 0;
  clearInterval(etaTimer);
  clearInterval(trackInterval);
}

function advanceTrackStage(idx) {
  // Mark previous stages as done
  for (let i = 0; i < idx; i++) {
    const el = $('#' + TRACK_STAGES[i].id);
    el.classList.remove('active');
    el.classList.add('done');
  }
  // Mark current as active
  const current = $('#' + TRACK_STAGES[idx].id);
  current.classList.add('active');

  // Update status message
  $('#trackStatusMsg .tsm-icon').textContent = TRACK_STAGES[idx].icon;
  $('#trackStatusText').textContent          = TRACK_STAGES[idx].msg;

  // When rider is "on the way", start moving the marker
  if (idx === 2 && riderMarker) startRiderMovement();

  // When delivered, stop movement and show final position
  if (idx === 3) {
    clearInterval(trackInterval);
    if (riderMarker && homeLatLng) riderMarker.setLatLng(homeLatLng);
    stopEtaCountdown();
    if (trackMap && homeLatLng) trackMap.panTo(homeLatLng, { animate: true, duration: 1.5 });
  }
}

// ── ETA Countdown ─────────────────────────────────────────
function startEtaCountdown(totalSeconds) {
  clearInterval(etaTimer);
  let remaining = totalSeconds;
  updateEtaDisplay(remaining);
  etaTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) { clearInterval(etaTimer); remaining = 0; }
    updateEtaDisplay(remaining);
  }, 1000);
}
function stopEtaCountdown() { clearInterval(etaTimer); }
function updateEtaDisplay(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  const el = $('#etaCountdown');
  if (el) el.textContent = m + ':' + s;
}

// ── Leaflet Map & Rider Animation ─────────────────────────
// Restaurant and home coordinates (Pune, India — realistic defaults)
// These shift slightly each order so the route looks unique
let restaurantLatLng = null;
let homeLatLng       = null;
let routeWaypoints   = [];

function initTrackMap(etaMins) {
  // Destroy previous map if exists
  if (trackMap) { trackMap.remove(); trackMap = null; }

  // Generate realistic coordinates around Pune
  const baseLat = 18.5204 + (Math.random() - 0.5) * 0.04;
  const baseLng = 73.8567 + (Math.random() - 0.5) * 0.04;
  restaurantLatLng = [baseLat, baseLng];
  homeLatLng       = [baseLat + 0.018 + Math.random() * 0.01,
                      baseLng + 0.012 + (Math.random() - 0.5) * 0.015];

  // Build curved waypoints between restaurant and home
  routeWaypoints = buildRoute(restaurantLatLng, homeLatLng);

  // Init Leaflet map
  trackMap = L.map('trackMap', {
    center:          restaurantLatLng,
    zoom:            14,
    zoomControl:     false,
    attributionControl: false,
    dragging:        true,
    scrollWheelZoom: false,
  });

  // Dark tile layer (CartoDB dark matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(trackMap);

  // Attribution (small, bottom right)
  L.control.attribution({ position: 'bottomright', prefix: false })
    .addTo(trackMap)
    .setPrefix('<span style="color:#444">© OpenStreetMap</span>');

  // Draw dashed route line
  routeLine = L.polyline(routeWaypoints, {
    color:     '#ff4d00',
    weight:    3,
    dashArray: '8 6',
    opacity:   0.7,
  }).addTo(trackMap);

  // Restaurant marker
  const restIcon = L.divIcon({
    className: '',
    html: '<div class="restaurant-marker"><div class="restaurant-marker-inner">🍕</div></div>',
    iconSize: [32, 32], iconAnchor: [16, 32],
  });
  L.marker(restaurantLatLng, { icon: restIcon })
    .addTo(trackMap)
    .bindPopup('<b>🍕 FoodRush Kitchen</b><br>Your order is here!');

  // Home marker
  const homeIcon = L.divIcon({
    className: '',
    html: '<div class="home-marker"><div class="home-marker-inner">🏠</div></div>',
    iconSize: [32, 32], iconAnchor: [16, 32],
  });
  L.marker(homeLatLng, { icon: homeIcon })
    .addTo(trackMap)
    .bindPopup('<b>📍 Your Location</b><br>Delivery here!');

  // Rider marker (starts at restaurant)
  const riderIcon = L.divIcon({
    className: '',
    html: '<div class="rider-marker-div" style="font-size:28px;filter:drop-shadow(0 2px 6px rgba(255,77,0,.7))">🛵</div>',
    iconSize: [36, 36], iconAnchor: [18, 18],
  });
  riderMarker = L.marker(restaurantLatLng, { icon: riderIcon }).addTo(trackMap);

  // Fit map to show both markers
  trackMap.fitBounds(L.latLngBounds([restaurantLatLng, homeLatLng]).pad(0.25));

  riderStepIdx = 0;
}

// Build a smooth curved route with intermediate points
function buildRoute(start, end) {
  const pts = [start];
  const steps = 60; // smoothness
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    // Bezier curve via a control point offset
    const cpLat = (start[0] + end[0]) / 2 + (end[1] - start[1]) * 0.3;
    const cpLng = (start[1] + end[1]) / 2 - (end[0] - start[0]) * 0.3;
    const lat = (1-t)*(1-t)*start[0] + 2*(1-t)*t*cpLat + t*t*end[0];
    const lng = (1-t)*(1-t)*start[1] + 2*(1-t)*t*cpLng + t*t*end[1];
    pts.push([lat, lng]);
  }
  pts.push(end);
  return pts;
}

function startRiderMovement() {
  clearInterval(trackInterval);
  riderStepIdx = 0;
  // Move rider along waypoints; total journey ~12s (matches stage delay gap)
  const totalSteps = routeWaypoints.length;
  const intervalMs = 200; // step every 200ms → 60 pts × 200ms = 12s
  trackInterval = setInterval(() => {
    if (!riderMarker || !trackMap) { clearInterval(trackInterval); return; }
    if (riderStepIdx >= totalSteps - 1) { clearInterval(trackInterval); return; }
    riderStepIdx++;
    const pos = routeWaypoints[riderStepIdx];
    riderMarker.setLatLng(pos);
    // Keep map centered on rider smoothly
    if (riderStepIdx % 5 === 0) trackMap.panTo(pos, { animate: true, duration: 0.8 });
  }, intervalMs);
}

// ── Close tracking modal ──────────────────────────────────
$('#modalClose').addEventListener('click', closeTrackModal);
$('#modalOverlay').addEventListener('click', e => {
  if (e.target === $('#modalOverlay')) closeTrackModal();
});
function closeTrackModal() {
  $('#modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
  clearAllTrackTimers();
  if (trackMap) { trackMap.remove(); trackMap = null; }
}

// ── Search ───────────────────────────────────────────────────
$('#searchToggle').addEventListener('click', openSearch);
$('#searchClose').addEventListener('click',  closeSearch);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeSearch(); closeMobileMenu(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
});

function openSearch() {
  $('#searchOverlay').classList.add('open');
  setTimeout(() => $('#searchInput').focus(), 100);
}
function closeSearch() {
  $('#searchOverlay').classList.remove('open');
  $('#searchInput').value = '';
  $('#searchResults').innerHTML = '';
}

let searchTimer;
$('#searchInput').addEventListener('input', e => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  if (!q) { $('#searchResults').innerHTML = ''; return; }
  searchTimer = setTimeout(() => doSearch(q), 280);
});

async function doSearch(q) {
  const results = $('#searchResults');
  results.innerHTML = '<div class="menu-loading" style="padding:1rem"><div class="spinner"></div></div>';

  const data = await apiFetch({ action: 'search', q });
  const items = (data.data || []).filter(i =>
    i.name.toLowerCase().includes(q.toLowerCase()) ||
    i.description.toLowerCase().includes(q.toLowerCase()) ||
    i.category.toLowerCase().includes(q.toLowerCase())
  );

  if (!items.length) {
    results.innerHTML = `<div class="sr-item"><span class="sr-icon">😔</span><div class="sr-info"><strong>No results for "${q}"</strong><small>Try a different term</small></div></div>`;
    return;
  }

  results.innerHTML = items.map((item, i) => `
    <div class="sr-item" style="animation-delay:${i*0.06}s" onclick="handleSearchClick(${item.id})">
      <img class="sr-icon" src="${item.image}" alt="${item.name}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;">
      <div class="sr-info">
        <strong>${item.name}</strong>
        <small>₹${item.price} · ${item.prep_time} mins</small>
      </div>
      <button class="btn-add" style="font-size:0.75rem;padding:0.4rem 0.75rem"
        onclick="event.stopPropagation();addToCart(${JSON.stringify(item).replace(/"/g,"'")});closeSearch()">
        + Add
      </button>
    </div>`).join('');
}

window.handleSearchClick = function(id) {
  closeSearch();
  const el = document.querySelector(`.menu-card[data-id="${id}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// Hero search
$('#heroSearchBtn').addEventListener('click', () => {
  const q = $('#heroSearch').value.trim();
  if (q) { openSearch(); $('#searchInput').value = q; doSearch(q); }
  else document.querySelector('#menu').scrollIntoView({ behavior: 'smooth' });
});
$('#heroSearch').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('#heroSearchBtn').click();
});

// ── Restaurants ──────────────────────────────────────────────
async function loadRestaurants() {
  const data = await apiFetch({ action: 'restaurants' });
  const grid = $('#restaurantGrid');
  grid.innerHTML = '';

  (data.data || []).forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'rest-card reveal';
    card.style.animationDelay = (i * 0.1) + 's';
    card.innerHTML = `
      <div class="rest-img">
        <img src="${r.image}" alt="${r.name}" loading="lazy" onerror="this.parentElement.style.background='linear-gradient(135deg,var(--card2),var(--dark))';this.style.display='none'">
        ${r.offers ? `<span class="rest-offer">${r.offers}</span>` : ''}
      </div>
      <div class="rest-body">
        <div class="rest-name">${r.name}</div>
        <div class="rest-meta">
          <span class="rest-rating">★ ${r.rating}</span>
          <span>·</span>
          <span>⏱ ${r.delivery_time} mins</span>
          <span>·</span>
          <span>Min ₹${r.min_order}</span>
        </div>
        <div style="margin-top:0.4rem;font-size:0.75rem;color:var(--muted)">${r.cuisine} Cuisine</div>
      </div>`;
    grid.appendChild(card);
  });

  revealOnScroll();
}

// ── Reviews ──────────────────────────────────────────────────
async function loadReviews() {
  const data = await apiFetch({ action: 'reviews' });
  const grid = $('#reviewsGrid');
  grid.innerHTML = '';

  (data.data || []).forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'review-card reveal';
    card.style.animationDelay = (i * 0.1) + 's';
    card.innerHTML = `
      <div class="rv-header">
        <div class="rv-avatar">${r.avatar}</div>
        <div>
          <div class="rv-name">${r.name}</div>
          <div class="rv-time">${r.time}</div>
        </div>
      </div>
      <div class="rv-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <div class="rv-comment">"${r.comment}"</div>`;
    grid.appendChild(card);
  });

  revealOnScroll();
}

// ── Mobile Menu ──────────────────────────────────────────────
$('#hamburger').addEventListener('click', () => {
  $('#mobileMenu').classList.add('open');
  document.body.style.overflow = 'hidden';
});
$('#mobileMenuClose').addEventListener('click', closeMobileMenu);

function closeMobileMenu() {
  $('#mobileMenu').classList.remove('open');
  document.body.style.overflow = '';
}
$$('#mobileMenu a').forEach(a => a.addEventListener('click', closeMobileMenu));

// ── Offer Timer ──────────────────────────────────────────────
function startOfferTimer() {
  let seconds = 3 * 3600 + 47 * 60 + 23;
  const el = $('#obTimer');

  const update = () => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    el.textContent = `⏰ ${h}:${m}:${s}`;
    if (seconds > 0) seconds--;
  };
  update();
  setInterval(update, 1000);
}

// ── Toast ────────────────────────────────────────────────────
function showToast(msg, icon = 'ℹ️', type = '') {
  const container = $('#toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.4s ease forwards';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ── Add Reveal Classes ───────────────────────────────────────
function addRevealClasses() {
  $$('.how-step, .rest-card, .review-card, .menu-card, .section-header').forEach(el => {
    if (!el.classList.contains('reveal')) el.classList.add('reveal');
  });
}

// ── Parallax on Hero ─────────────────────────────────────────
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  $$('.blob').forEach((b, i) => {
    b.style.transform = `translateY(${y * (0.05 + i * 0.02)}px)`;
  });
  $$('.fe').forEach((e, i) => {
    e.style.transform = `translateY(${y * (0.03 + (i % 3) * 0.02)}px)`;
  });
});

// ── Smooth Anchor Links ──────────────────────────────────────
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ── Login Button ─────────────────────────────────────────────
$('#loginBtn').addEventListener('click', () => {
  showToast('Sign-in coming soon! 🔐', '🚀');
});

// ── Hover Ripple on Cards ────────────────────────────────────
document.addEventListener('click', e => {
  const card = e.target.closest('.menu-card, .rest-card');
  if (!card) return;
  const ripple = document.createElement('div');
  const rect = card.getBoundingClientRect();
  ripple.style.cssText = `
    position:absolute;
    width:20px;height:20px;
    background:rgba(255,77,0,0.2);
    border-radius:50%;
    top:${e.clientY - rect.top - 10}px;
    left:${e.clientX - rect.left - 10}px;
    animation:rippleAnim 0.6s ease-out forwards;
    pointer-events:none;z-index:10;
  `;
  if (!document.querySelector('#rippleStyle')) {
    const s = document.createElement('style');
    s.id = 'rippleStyle';
    s.textContent = '@keyframes rippleAnim{to{transform:scale(10);opacity:0}}';
    document.head.appendChild(s);
  }
  card.style.position = 'relative';
  card.style.overflow = 'hidden';
  card.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

// ── Init ─────────────────────────────────────────────────────
async function init() {
  await Promise.all([loadMenu(), loadRestaurants(), loadReviews()]);
  startOfferTimer();
  addRevealClasses();
  revealOnScroll();
}

init();
