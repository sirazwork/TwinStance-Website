(function () {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const products = {
    'nexreach-starter': { name: 'NexReach Starter', price: 60, period: '/ month', group: 'crm', plan: 'P-17L1821667003311HNKSTKVY', description: 'Email outreach essentials for your business.', terms: 'Monthly subscription. Email provider charges are separate. Contact us after payment for account setup.' },
    'nexreach-growth': { name: 'NexReach Growth', price: 150, period: '/ month', group: 'crm', plan: 'P-56S306891G633150MNKSTLIY', description: 'Email, SMS and automation in one workspace.', terms: 'Monthly subscription. Email, SMS, AI and other provider charges are separate. Contact us after payment for account setup.' },
    'nexreach-bundle': { name: 'NexReach + Website Bundle', price: 1299, old: 1899, period: 'one-time', group: 'crm', hosted: 'SQJZ7UZRGHFJL', description: 'Lifetime WhiteLabel CRM access. Business website free for year one.', terms: 'Website hosting, maintenance and support renew at US$599/year from year two. CRM access remains included. Provider usage is separate. Website renewal is not automatically set up by this checkout.' },
    'website-starter': { name: 'Website Starter', price: 399, period: '/ year', group: 'website', hosted: 'LWUA6M6TDKV78', description: 'A professional starting point for your business online.', terms: 'Pays for the first year. Annual renewal is arranged separately, not an automatic PayPal subscription. Confirm any one-time setup fee with us before paying.' },
    'website-business': { name: 'Website Business', price: 599, period: '/ year', group: 'website', hosted: '6YU68FW7P92SQ', description: 'A custom business website built around your brand.', terms: 'Pays for the first year. Annual renewal is arranged separately, not an automatic PayPal subscription. Confirm any one-time setup fee with us before paying.' },
    'website-premium': { name: 'Website Premium', price: 899, period: '/ year', group: 'website', hosted: 'N4GJZAD52XBSG', description: 'A full-featured website for a bigger online presence.', terms: 'Pays for the first year. Annual renewal is arranged separately, not an automatic PayPal subscription. Confirm any one-time setup fee with us before paying.' },
    'seo-basic': { name: 'Basic SEO', price: 149, period: '/ month', group: 'seo', plan: 'P-71E70869GM8629117NKSTHUA', description: 'The basic starting package for improving search visibility.', terms: 'Monthly subscription at the basic starting price. Additional scope and setup fees are quoted separately; confirm them before paying. Ad spend is not included: you choose your platforms and budget and pay them separately. Cancellation requires 30 days notice.' }
  };
  const money = value => 'US$' + value.toLocaleString('en-US');
  const link = path => new URL(path, root).href;
  const key = 'twinstance-cart-v1';
  let cart = [];
  let storageOK = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    cart = Array.isArray(saved) ? [...new Set(saved.filter(id => Object.hasOwn(products, id)))] : [];
  } catch (_) { storageOK = false; }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(cart)); return true; }
    catch (_) { storageOK = false; return false; }
  }
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }
  function anchor(text, path, cls) {
    const a = el('a', cls, text); a.href = link(path); return a;
  }
  function price(product) {
    const row = el('div', 'store-price');
    if (product.old) row.append(el('s', '', money(product.old)));
    row.append(el('strong', '', money(product.price)), el('span', '', product.period));
    return row;
  }
  function updateBadge() {
    document.querySelectorAll('[data-cart-link]').forEach(a => { a.textContent = 'Cart (' + cart.length + ')'; });
  }
  document.querySelectorAll('[data-add-product]').forEach(button => {
    button.addEventListener('click', event => {
      const id = button.dataset.addProduct, product = products[id];
      if (!product) return;
      event.preventDefault();
      const conflicts = cart.filter(other => other !== id && products[other].group === product.group);
      if (conflicts.length && !window.confirm('Replace ' + products[conflicts[0]].name + ' with ' + product.name + ' in your cart?')) return;
      cart = cart.filter(other => !conflicts.includes(other));
      if (!cart.includes(id)) cart.push(id);
      if (save()) window.location.href = link('cart.html');
      else window.location.href = link('checkout.html?item=' + encodeURIComponent(id));
    });
  });
  updateBadge();
  const list = document.getElementById('cart-items');
  if (list) {
    function showCart() {
      list.replaceChildren();
      updateBadge();
      if (!cart.length) {
        list.append(el('h2', '', 'Your cart is empty'), el('p', 'store-muted', 'Choose a package to get started.'));
        list.append(anchor('Explore NexReach', 'services/email-marketing.html#pricing', 'store-button'));
        return;
      }
      cart.forEach(id => {
        const product = products[id], card = el('article', 'store-item');
        card.append(el('div', 'store-eyebrow', product.plan ? 'MONTHLY SUBSCRIPTION' : 'ONE-TIME CHECKOUT'), el('h2', '', product.name), price(product), el('p', 'store-muted', product.description), el('p', 'store-terms', product.terms));
        const actions = el('div', 'store-actions');
        actions.append(anchor('Checkout this item →', 'checkout.html?item=' + id, 'store-button'));
        const remove = el('button', 'store-remove', 'Remove');
        remove.type = 'button'; remove.setAttribute('aria-label', 'Remove ' + product.name);
        remove.onclick = () => { cart = cart.filter(value => value !== id); save(); showCart(); };
        actions.append(remove); card.append(actions); list.append(card);
      });
      if (cart.includes('nexreach-bundle') && cart.some(id => products[id].group === 'website')) {
        list.prepend(el('p', 'store-notice', 'Your bundle already includes a Business website for year one. Remove the separate website unless you need an additional site.'));
      }
    }
    showCart();
  }
  const checkout = document.getElementById('checkout-product');
  if (!checkout) return;
  const id = new URLSearchParams(window.location.search).get('item');
  if (!Object.hasOwn(products, id)) {
    checkout.append(el('h2', '', 'Choose a product first'), anchor('Return to cart', 'cart.html', 'store-button'));
    return;
  }
  const product = products[id];
  document.title = 'Checkout · ' + product.name + ' | TwinStance';
  checkout.append(el('div', 'store-eyebrow', product.plan ? 'MONTHLY SUBSCRIPTION' : 'ONE-TIME CHECKOUT'), el('h2', '', product.name), price(product), el('p', 'store-muted', product.description), el('p', 'store-terms', product.terms));
  const payment = el('div', 'store-payment');
  const container = el('div'); container.id = 'payment-button';
  const status = el('p', 'store-status', 'Loading secure PayPal checkout…'); status.setAttribute('role', 'status');
  payment.append(el('h3', '', 'Payment'), el('p', 'store-muted', 'Review the final amount, applicable tax and billing terms in PayPal before approving.'), container, status);
  checkout.append(payment);
  function fail() { status.textContent = 'PayPal could not load or complete checkout. Refresh to retry, or contact us. If you already approved payment, check PayPal before trying again.'; }
  const sdk = document.createElement('script');
  sdk.src = product.plan
    ? 'https://www.paypal.com/sdk/js?client-id=BAAKbUhsUdNlNLoaKKKhQRui-sOmxWpBMfYR8bZywYDcJZ3wVKImgicCqW4NkPgT57l1LyNeUGLjLP0GiA&components=buttons&vault=true&intent=subscription'
    : 'https://www.paypal.com/sdk/js?client-id=BAAfRhztmnf6iCIs6D_Ye6ovjpL8ozQTcxxXAM9GcN_ndM6nxNcTYgRcXDZlsA8e6XtKIV4zp38hfqxr3E&components=hosted-buttons&disable-funding=venmo&currency=USD';
  sdk.onerror = fail;
  sdk.onload = function () {
    try {
      let rendered;
      if (product.plan) {
        rendered = window.paypal.Buttons({
          style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'subscribe' },
          createSubscription: function (_, actions) {
            const options = { plan_id: product.plan };
            // Opaque NexReach payment reference only; PayPal's verified server event confirms payment.
            const paymentReference = new URLSearchParams(window.location.search).get('nr_payment');
            if (/^nr_[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(paymentReference || '')) options.custom_id = paymentReference;
            if (id === 'nexreach-starter') options.quantity = 1;
            return actions.subscription.create(options);
          },
          onApprove: function (data) {
            status.textContent = 'PayPal approval received. Reference: ' + data.subscriptionID + '. Contact us with this reference for verification and onboarding. Account access is not activated automatically.';
          },
          onCancel: function () { status.textContent = 'Checkout cancelled. You can retry when ready.'; },
          onError: fail
        }).render('#payment-button');
      } else rendered = window.paypal.HostedButtons({ hostedButtonId: product.hosted }).render('#payment-button');
      Promise.resolve(rendered).then(() => { status.textContent = 'Payment is handled by PayPal. After payment, contact us with your receipt for verification and onboarding.'; }).catch(fail);
    } catch (_) { fail(); }
  };
  document.head.append(sdk);
})();
