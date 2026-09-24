(function () {
  'use strict';

  // Display-only conversions. All products and PayPal plans remain priced in USD.
  const choices = ['USD', 'INR', 'NZD', 'AUD'];
  const selectors = [
    '.pkg-price', '.t-price', '.ot.dark .ot-price', '.nr-option-price',
    '.package-price', '.pricing-card .pricing-price',
    '.hero-pricing .hp-amount', '.bundle-buy strong',
    '.price-card .pc-price', '.plans .price', '.pricing-grid .pc-price',
    '.store-price'
  ].join(',');
  const key = 'twinstance-display-currency';
  const cacheKey = 'twinstance-usd-rates-v2';
  const root = document.querySelector('#packages, #pricing, #plans, .packages-grid, .pricing-card, .store-main');
  if (!root) return;

  let selected = 'USD';
  try {
    const saved = localStorage.getItem(key);
    if (choices.includes(saved)) selected = saved;
  } catch (_) { /* Private browsing can disable storage. */ }

  const widget = document.createElement('div');
  widget.className = 'fx-widget';
  const label = document.createElement('label');
  label.textContent = 'Show prices in ';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Display currency');
  choices.forEach(code => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = code;
    select.append(option);
  });
  select.value = selected;
  label.append(select);
  const note = document.createElement('div');
  note.className = 'fx-note';
  note.setAttribute('role', 'status');
  widget.append(label, note);
  const style = document.createElement('style');
  style.textContent = '.fx-widget{box-sizing:border-box;max-width:600px;margin:24px auto;padding:14px 18px;border:1px solid #cbd5e1;border-radius:14px;background:#fff;color:#17233b;text-align:center;font:500 14px/1.5 system-ui,sans-serif;box-shadow:0 3px 16px #0000000d}.fx-widget label{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap}.fx-widget select{font:600 14px system-ui,sans-serif;border:1px solid #94a3b8;border-radius:8px;padding:7px 12px;background:#fff;color:#17233b;cursor:pointer}.fx-widget select:focus-visible{outline:3px solid #2563eb;outline-offset:2px}.fx-note{font-size:12px;color:#526079;margin-top:6px}.fx-estimate{display:block;font:600 13px/1.4 system-ui,sans-serif;letter-spacing:0;color:#3571a3;margin-top:4px;white-space:normal}.fx-estimate[hidden]{display:none}.ot.dark .fx-estimate,.nr-option .fx-estimate,.price-card.whitelabel .fx-estimate{color:#ffd166}.t-price .fx-estimate{font-size:12px}.fx-widget+.fx-widget{display:none}';
  document.head.append(style);
  if (root.classList.contains('packages-grid') || root.classList.contains('pricing-card') || root.id === 'plans') root.before(widget);
  else root.prepend(widget);

  let rates = null;
  let loading = null;
  function usdValue(element) {
    const source = element.classList.contains('store-price')
      ? element.querySelector('strong')?.textContent || ''
      : element.textContent;
    const matches = [...source.matchAll(/(?:US)?\$\s*([\d,]+)(?:\.\d+)?/g)];
    const last = matches.at(-1);
    return last ? Number(last[1].replaceAll(',', '')) : null;
  }
  function format(value, currency) {
    const locale = currency === 'INR' ? 'en-IN' : currency === 'NZD' ? 'en-NZ' : 'en-AU';
    const symbol = { INR: '₹', NZD: 'NZ$', AUD: 'A$' }[currency];
    return symbol + new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(value));
  }
  function decorate() {
    document.querySelectorAll(selectors).forEach(element => {
      const amount = usdValue(element);
      if (!Number.isFinite(amount) || amount <= 0) return;
      let estimate = element.querySelector(':scope > .fx-estimate');
      if (!estimate && element.nextElementSibling?.classList.contains('fx-estimate')) estimate = element.nextElementSibling;
      if (!estimate) {
        estimate = document.createElement('span');
        estimate.className = 'fx-estimate';
        if (element.tagName === 'TD' || element.classList.contains('store-price')) element.append(estimate);
        else element.after(estimate);
      }
      estimate.hidden = selected === 'USD' || !rates;
      if (!estimate.hidden) estimate.textContent = '≈ ' + format(amount * rates[selected], selected);
    });
  }
  async function fetchRates() {
    if (rates) return rates;
    if (loading) return loading;
    loading = (async () => {
      let data;
      try {
        const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
        if (cached && Date.now() - cached.savedAt < 24 * 60 * 60 * 1000) data = cached.data;
      } catch (_) { /* Fetch fresh rates below. */ }
      if (!data) {
        const response = await fetch('https://api.frankfurter.dev/v2/rates?base=USD&quotes=INR,NZD,AUD');
        if (!response.ok) throw new Error('FX service unavailable');
        data = await response.json();
        try { localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), data })); } catch (_) { /* Optional cache. */ }
      }
      const rows = Array.isArray(data) ? data : data.rates;
      if (Array.isArray(rows)) {
        rates = { USD: 1 };
        rows.forEach(row => { if (choices.includes(row.quote) && Number.isFinite(Number(row.rate))) rates[row.quote] = Number(row.rate); });
        rates.date = rows[0]?.date || '';
      } else if (rows && typeof rows === 'object') {
        rates = { USD: 1, ...rows };
        rates.date = data.date || '';
      }
      if (!rates || !['INR', 'NZD', 'AUD'].every(code => Number.isFinite(rates[code]) && rates[code] > 0)) throw new Error('FX rates missing');
      return rates;
    })();
    try { return await loading; } finally { loading = null; }
  }
  async function refresh() {
    if (selected === 'USD') {
      note.textContent = 'USD is the checkout currency. Tax and provider charges may be extra.';
      decorate();
      return;
    }
    note.textContent = 'Loading indicative exchange rates…';
    try {
      await fetchRates();
      if (select.value !== selected) return;
      note.textContent = 'Approximate conversion' + (rates.date ? ' using ' + rates.date + ' rates' : '') + '. Checkout charges USD; your payment provider sets the final exchange rate and tax.';
    } catch (_) {
      rates = null;
      note.textContent = 'Live conversion is unavailable. USD prices remain the checkout amounts.';
    }
    decorate();
  }
  select.addEventListener('change', () => {
    selected = select.value;
    try { localStorage.setItem(key, selected); } catch (_) { /* Preference is optional. */ }
    refresh();
  });
  const dynamic = document.querySelector('#cart-items, #checkout-product');
  if (dynamic) new MutationObserver(() => { window.requestAnimationFrame(decorate); }).observe(dynamic, { childList: true });
  refresh();
})();

