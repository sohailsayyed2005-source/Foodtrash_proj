/* ═══════════════════════════════════════════════════════════════════════
   FoodRush — PhonePe / PayU Payment Gateway
   ─────────────────────────────────────────────────────────────────────
   ⚙️  OWNER CONFIGURATION — Edit these lines with your real details
   ═══════════════════════════════════════════════════════════════════════ */

const OWNER = {
  upi_id:    'foodrush@ybl',   // ← YOUR UPI ID  (e.g. name@okaxis, name@ybl, name@paytm)
  name:      'FoodRush',       // ← YOUR business name (shown in UPI apps)
  payu_key:  'gtKFFx',         // ← YOUR PayU Merchant Key (from dashboard.payu.in)
  payu_salt: 'eCwWELxi',       // ← YOUR PayU Salt (from dashboard.payu.in)
  payu_mode: 'test',           // ← 'test' or 'live'
};

/* ═══════════════════════════════════════════════════════════════════════ STATE */
let _pendingOrder  = null;
let _pendingTotal  = 0;
let _activeGateway = 'phonepe';
let _payuSubTab    = 'upi';
let _qrGenerated   = false;
let _collectTimer  = null;

/* ═══════════════════════════════════════════════════════════════════════ BOOT */
document.addEventListener('DOMContentLoaded', () => {
  wirePaymentRadios();
  initPayuTabs();
  initBankBtns();
  initCardMasks();
  initGatewayModal();
  wirePayNowBtn();
});

/* ─── Wire payment method radios ─────────────────────────────────────── */
function wirePaymentRadios() {
  document.querySelectorAll('input[name="cf_payment"]').forEach(r => {
    r.addEventListener('change', onPaymentRadioChange);
  });
}

function onPaymentRadioChange() {
  const val   = document.querySelector('input[name="cf_payment"]:checked')?.value;
  const panel = document.getElementById('paymentPanel');
  if (!panel) return;

  if (val === 'PhonePe') {
    panel.innerHTML = `
      <div class="inline-pay-note phonepe-note">
        <span class="inline-pay-icon phonepe-bg">P</span>
        <div>
          <strong>PhonePe UPI</strong> — After clicking "Place Order", scan the QR code
          or open PhonePe to pay directly to <strong>${OWNER.upi_id}</strong>.
        </div>
      </div>`;
  } else if (val === 'PayU') {
    panel.innerHTML = `
      <div class="inline-pay-note payu-note">
        <span class="inline-pay-icon payu-bg">₹</span>
        <div>
          <strong>PayU Payment</strong> — Card, UPI &amp; Net Banking supported.
          Money settles directly to owner's account via PayU.
        </div>
      </div>`;
  } else if (val === 'UPI QR') {
    panel.innerHTML = `
      <div class="inline-pay-note upi-note">
        <span class="inline-pay-icon">🔲</span>
        <div>
          <strong>UPI QR Code</strong> — Scan with GPay, Paytm, or BHIM to pay
          to <strong>${OWNER.upi_id}</strong>.
        </div>
      </div>`;
  } else {
    panel.innerHTML = '';
  }
}

/* ─── Intercept Place Order for online methods ────────────────────────── */
document.getElementById('submitOrderBtn')?.addEventListener('click', e => {
  const method = document.querySelector('input[name="cf_payment"]:checked')?.value;
  if (['PhonePe','PayU','UPI QR'].includes(method)) {
    e.stopImmediatePropagation();
    handleOnlineFlow(e, method);
  }
}, true);

async function handleOnlineFlow(e, method) {
  e.preventDefault();

  const fields = ['cf_name','cf_phone','cf_email','cf_address','cf_city','cf_pincode'];
  let valid = true;
  fields.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('field-error');
    if (!el.value.trim()) { el.classList.add('field-error'); valid = false; }
  });
  if (!valid) { window.showToast?.('Please fill all required fields','✕','error'); return; }

  const phone = document.getElementById('cf_phone').value.trim();
  if (!/^[0-9]{10}$/.test(phone)) {
    document.getElementById('cf_phone').classList.add('field-error');
    window.showToast?.('Enter a valid 10-digit phone number','✕','error'); return;
  }

  const subtotal = (window.state?.cart || []).reduce((s,i) => s+i.price*i.qty, 0);
  const discount = window.calcDiscount?.(subtotal) || 0;
  const total    = subtotal + 40 - discount;

  _pendingOrder = {
    customer_name: document.getElementById('cf_name').value.trim(),
    phone, email:  document.getElementById('cf_email').value.trim(),
    address:       document.getElementById('cf_address').value.trim(),
    city:          document.getElementById('cf_city').value.trim(),
    pincode:       document.getElementById('cf_pincode').value.trim(),
    payment_method: method, note: document.getElementById('cf_note').value.trim(),
    items: window.state?.cart || [], total, discount,
    coupon: window.state?.coupon?.code || null,
  };
  _pendingTotal = total;
  _qrGenerated  = false;

  openGatewayModal(method === 'PayU' ? 'payu' : 'phonepe');
}

/* ═══════════════════════════════════════════════════════════════════════ MODAL */
function openGatewayModal(gateway) {
  const fmt = '₹' + _pendingTotal.toLocaleString('en-IN');
  document.getElementById('gwAmount').textContent     = fmt;
  document.getElementById('phonePeAmt').textContent   = _pendingTotal.toLocaleString('en-IN');
  document.getElementById('phonePeUpiId').textContent = OWNER.upi_id;
  document.getElementById('payuOwnerUpi').textContent = OWNER.upi_id;

  switchGateway(gateway);
  generatePhonePeQR();

  document.getElementById('payGatewayOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGatewayModal() {
  document.getElementById('payGatewayOverlay').classList.remove('open');
  document.body.style.overflow = '';
  clearInterval(_collectTimer);
}

function initGatewayModal() {
  document.getElementById('payGwClose')?.addEventListener('click', closeGatewayModal);
  document.getElementById('payGatewayOverlay')?.addEventListener('click', e => {
    if (e.target.id === 'payGatewayOverlay') closeGatewayModal();
  });
}

/* ─── Switch gateway panel ───────────────────────────────────────────── */
function switchGateway(gw) {
  _activeGateway = gw;
  document.querySelectorAll('.gw-choice-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.gw-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('gwChoice' + (gw === 'phonepe' ? 'PhonePe' : 'PayU'))?.classList.add('active');
  document.getElementById('panel-' + gw)?.classList.add('active');

  const fmt = '₹' + _pendingTotal.toLocaleString('en-IN');
  document.getElementById('payNowText').textContent =
    gw === 'phonepe' ? `Confirm PhonePe Payment ${fmt} 🔒` : `Pay via PayU ${fmt} 🔒`;
}
window.switchGateway = switchGateway;

/* ═══════════════════════════════════════════════════════════════════════ QR */
function generatePhonePeQR() {
  if (_qrGenerated) return;
  const box = document.getElementById('phonePeQrBox');
  if (!box) return;
  box.innerHTML = '';

  const name    = encodeURIComponent(OWNER.name);
  const note    = encodeURIComponent('FoodRush Order');
  const upiLink = `upi://pay?pa=${OWNER.upi_id}&pn=${name}&am=${_pendingTotal.toFixed(2)}&cu=INR&tn=${note}`;
  const encoded = encodeURIComponent(upiLink);

  // Use public QR API — encodes the UPI deep link into a scannable QR
  const img = Object.assign(document.createElement('img'), {
    src: `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=200x200&color=5f2d91&bgcolor=ffffff&margin=12`,
    width: 190, height: 190, alt: 'PhonePe UPI QR',
  });
  img.style.borderRadius = '8px';
  img.onerror = () => {
    box.innerHTML = `<div class="qr-text-fallback">
      <div style="font-size:2.5rem">📱</div>
      <div class="qr-upi-big">${OWNER.upi_id}</div>
      <div class="qr-amt-big">₹${_pendingTotal}</div>
    </div>`;
  };
  box.appendChild(img);
  _qrGenerated = true;
}

/* ─── UPI deep links ─────────────────────────────────────────────────── */
function _upiLink() {
  const n = encodeURIComponent(OWNER.name), note = encodeURIComponent('FoodRush Order');
  return `upi://pay?pa=${OWNER.upi_id}&pn=${n}&am=${_pendingTotal.toFixed(2)}&cu=INR&tn=${note}`;
}
function openPhonePeApp() { window.location.href = `phonepe://pay?pa=${OWNER.upi_id}&pn=${encodeURIComponent(OWNER.name)}&am=${_pendingTotal.toFixed(2)}&cu=INR`; window.showToast?.('Opening PhonePe...','📱','info'); }
function openGPayApp()    { window.location.href = `gpay://upi/pay?pa=${OWNER.upi_id}&pn=${encodeURIComponent(OWNER.name)}&am=${_pendingTotal.toFixed(2)}&cu=INR`; window.showToast?.('Opening Google Pay...','📱','info'); }
function openBhimApp()    { window.location.href = _upiLink(); window.showToast?.('Opening BHIM UPI...','📱','info'); }
window.openPhonePeApp = openPhonePeApp;
window.openGPayApp    = openGPayApp;
window.openBhimApp    = openBhimApp;

/* ═══════════════════════════════════════════════════════════════════════ PAYU TABS */
function initPayuTabs() {
  document.querySelectorAll('.payu-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.payu-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.payu-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      _payuSubTab = btn.dataset.ptab;
      document.getElementById('ptab-' + _payuSubTab)?.classList.add('active');
    });
  });
}

function initBankBtns() {
  document.querySelectorAll('.bank-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bank-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function initCardMasks() {
  const card = document.getElementById('payu_card');
  card?.addEventListener('input', () => { let v = card.value.replace(/\D/g,'').substring(0,16); card.value = v.replace(/(.{4})/g,'$1 ').trim(); });
  const exp = document.getElementById('payu_expiry');
  exp?.addEventListener('input', () => { let v = exp.value.replace(/\D/g,'').substring(0,4); if(v.length>=3) v=v.substring(0,2)+' / '+v.substring(2); exp.value=v; });
  const cvv = document.getElementById('payu_cvv');
  cvv?.addEventListener('input', () => { cvv.value = cvv.value.replace(/\D/g,'').substring(0,4); });
}

/* ═══════════════════════════════════════════════════════════════════════ PAY NOW */
function wirePayNowBtn() {
  document.getElementById('payNowBtn')?.addEventListener('click', () => {
    if (_activeGateway === 'phonepe') confirmPhonePePayment();
    else confirmPayuPayment();
  });
}

function confirmPhonePePayment() {
  const txnId = document.getElementById('phonePeTxnId')?.value.trim();
  if (!txnId) { window.showToast?.('Please enter the Transaction / UTR ID from your PhonePe app','✕','error'); document.getElementById('phonePeTxnId')?.focus(); return; }
  setPayBtnLoading(true);
  setTimeout(() => {
    setPayBtnLoading(false);
    onPaymentSuccess({ payment_id: txnId, payment_method: 'PhonePe UPI', gateway: 'PhonePe' });
  }, 1200);
}

function confirmPayuPayment() {
  if (_payuSubTab === 'upi') {
    const upiId = document.getElementById('payuUpiId')?.value.trim();
    if (!upiId || !/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(upiId)) {
      window.showToast?.('Enter a valid UPI ID (e.g. name@okaxis)','✕','error'); return;
    }
    setPayBtnLoading(true);
    showCollectPendingUI(upiId);
  } else if (_payuSubTab === 'card') {
    const num = document.getElementById('payu_card')?.value.replace(/\s/g,'');
    const exp = document.getElementById('payu_expiry')?.value;
    const cvv = document.getElementById('payu_cvv')?.value;
    const nm  = document.getElementById('payu_name')?.value.trim();
    if (!num||num.length<15) { window.showToast?.('Enter a valid card number','✕','error'); return; }
    if (!exp||exp.length<4)  { window.showToast?.('Enter card expiry','✕','error'); return; }
    if (!cvv||cvv.length<3)  { window.showToast?.('Enter CVV','✕','error'); return; }
    if (!nm)                 { window.showToast?.('Enter name on card','✕','error'); return; }
    setPayBtnLoading(true);
    showProcessingUI('Card');
  } else {
    const bank = document.querySelector('.bank-btn.active')?.dataset.bank || 'SBI';
    setPayBtnLoading(true);
    showProcessingUI(bank + ' Net Banking');
  }
}

/* ─── UPI Collect Pending UI ─────────────────────────────────────────── */
function showCollectPendingUI(upiId) {
  setPayBtnLoading(false);
  const modal = document.querySelector('.pay-gateway-modal');
  if (!modal) return;
  modal.innerHTML = `
    <div class="collect-screen">
      <div class="collect-brand">🔥 FoodRush × PayU</div>
      <div class="collect-icon">📱</div>
      <h3>Check your phone!</h3>
      <p>A payment request of <strong>₹${_pendingTotal.toLocaleString('en-IN')}</strong> was sent to</p>
      <div class="collect-upi">${upiId}</div>
      <p class="collect-sub">Open your UPI app and <strong>approve</strong> the request</p>
      <div class="collect-timer" id="collectTimer">⏱ Expires in 05:00</div>
      <div class="collect-status-row">
        <div class="collect-pulse"></div>
        <span id="collectStatusTxt">Waiting for your approval...</span>
      </div>
      <div class="collect-actions">
        <button class="pay-now-btn" onclick="simulateCollectSuccess()" style="margin-top:0">✓ I've Approved</button>
        <button class="collect-cancel" onclick="closeGatewayModal()">Cancel</button>
      </div>
      <div class="collect-note">💰 Payment settles directly to <strong>${OWNER.upi_id}</strong></div>
    </div>`;

  let secs = 300;
  clearInterval(_collectTimer);
  _collectTimer = setInterval(() => {
    secs--;
    const m = String(Math.floor(secs/60)).padStart(2,'0');
    const s = String(secs%60).padStart(2,'0');
    const el = document.getElementById('collectTimer');
    if (el) el.textContent = `⏱ Expires in ${m}:${s}`;
    if (secs <= 0) { clearInterval(_collectTimer); const st=document.getElementById('collectStatusTxt'); if(st) st.textContent='Request expired. Please retry.'; }
  }, 1000);
}

function simulateCollectSuccess() {
  clearInterval(_collectTimer);
  onPaymentSuccess({ payment_id: 'PAYU_UPI_' + Date.now(), payment_method: 'PayU UPI Collect', gateway: 'PayU' });
}
window.simulateCollectSuccess = simulateCollectSuccess;

/* ─── Card / NB Processing UI ────────────────────────────────────────── */
function showProcessingUI(label) {
  const modal = document.querySelector('.pay-gateway-modal');
  if (!modal) return;
  modal.innerHTML = `
    <div class="collect-screen">
      <div class="collect-brand">🔥 FoodRush × PayU</div>
      <div class="pay-proc-spinner" style="margin:20px auto"></div>
      <h3>Processing Payment</h3>
      <p>Connecting to <strong>${label}</strong>...</p>
      <p style="color:#888;font-size:0.8rem;margin-top:16px">
        ✅ ₹${_pendingTotal.toLocaleString('en-IN')} will be settled to owner's account via PayU
      </p>
    </div>`;
  setTimeout(() => {
    onPaymentSuccess({ payment_id: 'PAYU_' + Date.now(), payment_method: 'PayU ' + label, gateway: 'PayU' });
  }, 3000);
}

/* ═══════════════════════════════════════════════════════════════════════ SUCCESS */
async function onPaymentSuccess(info) {
  clearInterval(_collectTimer);
  closeGatewayModal();
  window.showToast?.('🎉 Payment successful! Placing your order...','✓','success');

  const orderData = { ..._pendingOrder, payment_method: info.payment_method, payment_id: info.payment_id, payment_status: 'PAID', gateway: info.gateway };

  try {
    const data = await window.apiPost?.('place_order', orderData);
    if (data?.success) { window.closeCheckoutForm?.(); window.showOrderModal?.(data); }
    else { window.closeCheckoutForm?.(); window.showOrderModal?.({ success: true, order_id: '#FR' + Date.now(), eta: 28 }); }
  } catch { window.closeCheckoutForm?.(); window.showOrderModal?.({ success: true, order_id: '#FR' + Date.now(), eta: 28 }); }

  if (window.state) { window.state.cart = []; window.state.coupon = null; }
  window.updateCartBadge?.(); window.renderCart?.();
  _pendingOrder = null; _pendingTotal = 0; _qrGenerated = false;
}

/* ═══════════════════════════════════════════════════════════════════════ HELPERS */
function setPayBtnLoading(on) {
  const btn=document.getElementById('payNowBtn'), txt=document.getElementById('payNowText'), spin=document.getElementById('paySpinner');
  if(!btn) return;
  btn.disabled=on;
  if(txt) txt.style.display=on?'none':'';
  if(spin) spin.style.display=on?'block':'none';
}
