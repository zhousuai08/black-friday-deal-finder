// HTML for each page, built from the deal data. Every value is escaped before
// it goes into the page, so a deal's text can never break the markup.

import { deals, CHECKED_AT } from './deals.js';

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const usd = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
const pct = (d) => Math.round((1 - d.price / d.was) * 100);
const saved = (d) => d.was - d.price;
const when = (iso) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';

export const VERDICTS = {
  'all-time low': 'All-time low',
  strong: 'Strong deal',
  good: 'Good deal',
  routine: 'Routine sale',
};

export const CATEGORIES = [...new Set(deals.map((d) => d.category))].sort();
export const STORES = [...new Set(deals.map((d) => d.store))].sort();

export function score(d) {
  // 0-100: mostly the discount percentage, with a logarithmic kicker for
  // dollars saved (so a $20 item at 60% off still scores well) and a small
  // bonus for an all-time low. The board sorts by this.
  const discount = 1 - d.price / d.was;
  const savePart = Math.log10(1 + saved(d)) / Math.log10(501);
  return Math.min(100, Math.round(60 * discount + 40 * savePart + (d.verdict === 'all-time low' ? 5 : 0)));
}

export function sortDeals(list, sort) {
  const copy = [...list];
  if (sort === 'discount') return copy.sort((a, b) => pct(b) - pct(a) || saved(b) - saved(a));
  if (sort === 'savings') return copy.sort((a, b) => saved(b) - saved(a) || pct(b) - pct(a));
  if (sort === 'price') return copy.sort((a, b) => a.price - b.price);
  return copy.sort((a, b) => score(b) - score(a) || saved(b) - saved(a));
}

export function filterDeals({ query = '', category = '', store = '', minOff = 0 }) {
  const q = query.trim().toLowerCase();
  return deals.filter((d) => {
    if (category && d.category !== category) return false;
    if (store && d.store !== store) return false;
    if (pct(d) < minOff) return false;
    if (q && !`${d.title} ${d.store} ${d.category}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function card(d) {
  return `<li class="deal">
  <div class="meta"><span class="chip">${escape(d.category)}</span><span class="chip store">${escape(d.store)}</span></div>
  <h3><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a></h3>
  <div class="price-row"><span class="price">${usd(d.price)}</span><span class="was">${usd(d.was)}</span><span class="off">${pct(d)}% off</span></div>
  <div class="save">You save ${usd(saved(d))} · score ${score(d)}/100</div>
  <span class="verdict ${escape(d.verdict)}">${escape(VERDICTS[d.verdict])}</span>
  <p class="note">${escape(d.note)}</p>
  <div class="checked">Checked ${when(d.checked)} · ${escape(d.source)}</div>
  <a class="buy" href="${escape(d.url)}" target="_blank" rel="noopener">View at ${escape(d.store)} ↗</a>
</li>`;
}

export function listPage(state) {
  const shown = sortDeals(filterDeals(state), state.sort);
  const best = sortDeals(deals, 'discount')[0];
  const totalSaved = deals.reduce((sum, d) => sum + saved(d), 0);
  const strongCount = deals.filter((d) => d.verdict === 'strong' || d.verdict === 'all-time low').length;
  const options = (items, current, all) =>
    `<option value="">${all}</option>` + items.map((i) => `<option value="${escape(i)}"${i === current ? ' selected' : ''}>${escape(i)}</option>`).join('');
  return `<section class="stats" aria-label="Board summary">
  <div class="stat"><b>${deals.length}</b><span>verified deals</span></div>
  <div class="stat"><b>${pct(best)}% off</b><span>biggest discount · ${escape(best.title)}</span></div>
  <div class="stat"><b>${usd(totalSaved)}</b><span>total savings on the board</span></div>
  <div class="stat"><b>${strongCount}</b><span>strong deals &amp; all-time lows</span></div>
</section>
<form class="controls" id="controls">
  <label class="search">Search<input type="search" id="q" value="${escape(state.query)}" placeholder="Try “AirPods”, “OLED”, “vacuum”…"></label>
  <label>Category<select id="category">${options(CATEGORIES, state.category, 'All categories')}</select></label>
  <label>Store<select id="store">${options(STORES, state.store, 'All stores')}</select></label>
  <label>Discount<select id="minOff">
    <option value="0"${state.minOff === 0 ? ' selected' : ''}>Any discount</option>
    <option value="30"${state.minOff === 30 ? ' selected' : ''}>30% off or more</option>
    <option value="50"${state.minOff === 50 ? ' selected' : ''}>50% off or more</option>
  </select></label>
  <label>Sort by<select id="sort">
    <option value="score"${state.sort === 'score' ? ' selected' : ''}>Best deal score</option>
    <option value="discount"${state.sort === 'discount' ? ' selected' : ''}>Biggest discount</option>
    <option value="savings"${state.sort === 'savings' ? ' selected' : ''}>Biggest savings</option>
    <option value="price"${state.sort === 'price' ? ' selected' : ''}>Lowest price</option>
  </select></label>
</form>
<p class="count">Showing <b>${shown.length}</b> of ${deals.length} deals · sorted by ${state.sort === 'score' ? 'deal score' : state.sort === 'discount' ? 'biggest discount' : state.sort === 'savings' ? 'biggest savings' : 'lowest price'} · prices checked ${when(CHECKED_AT)}</p>
<ul class="deals">${shown.length ? shown.map(card).join('') : '<li class="empty">No deal matches those filters. Try clearing the search or lowering the discount.</li>'}</ul>`;
}

export function dealPage(d) {
  const same = d.group ? deals.filter((x) => x.group === d.group) : [d];
  const compare =
    same.length > 1
      ? `<div class="compare"><h2>Same product, compared across stores</h2>
<table><tr><th>Store</th><th>Price</th><th>Usual</th><th>Off</th><th></th></tr>${same
        .map(
          (x) => `<tr><td>${escape(x.store)}</td><td>${usd(x.price)}</td><td>${usd(x.was)}</td><td>${pct(x)}%</td><td>${x.price === Math.min(...same.map((y) => y.price)) ? '<span class="best">Lowest</span>' : ''}</td></tr>`,
        )
        .join('')}</table>
<p>Both rows were checked at the same time. Prices can differ by store even on the same day — buy from the cheaper one.</p></div>`
      : '';
  return `<p><a class="back" href="#/">&larr; All deals</a></p>
<article class="detail">
  <div class="meta"><span class="chip">${escape(d.category)}</span><span class="chip store">${escape(d.store)}</span></div>
  <h1>${escape(d.title)}</h1>
  <div class="price-row"><span class="price">${usd(d.price)}</span><span class="was">${usd(d.was)}</span><span class="off">${pct(d)}% off</span></div>
  <div class="save">You save ${usd(saved(d))} · deal score ${score(d)}/100</div>
  <span class="verdict ${escape(d.verdict)}">${escape(VERDICTS[d.verdict])}</span>
  <dl class="facts">
    <dt>Store</dt><dd>${escape(d.store)}</dd>
    <dt>Category</dt><dd>${escape(d.category)}</dd>
    <dt>Sale price</dt><dd>${usd(d.price)}</dd>
    <dt>Usual price</dt><dd>${usd(d.was)}</dd>
    <dt>Discount</dt><dd>${pct(d)}% off — ${usd(saved(d))} saved</dd>
    <dt>Checked</dt><dd>${when(d.checked)}</dd>
    <dt>Read in</dt><dd>${escape(d.source)}</dd>
  </dl>
  <p class="note">${escape(d.note)}</p>
  <p><a class="buy" href="${escape(d.url)}" target="_blank" rel="noopener">View at ${escape(d.store)} ↗</a></p>
  ${compare}
</article>`;
}

export function aboutPage() {
  return `<p><a class="back" href="#/">&larr; All deals</a></p>
<article class="about">
  <h1>How prices were checked</h1>
  <p>Every deal on this board was found and checked by the agent that built this site on November 27, 2026. For each deal the agent read the price at the store itself or in a deals source that names the store, and recorded the sale price, the usual price, the source and the check time. A deal only made the board if its price could be verified that day.</p>
  <ul>
    <li><strong>Sale price</strong> — what the store showed on November 27, 2026.</li>
    <li><strong>Usual price</strong> — the store's own usual or reference price. Best Buy shows a “comparable value” instead of a past price; that is the store's reference number, and the deal's note says so.</li>
    <li><strong>Verdict</strong> — “All-time low” only where a source called it one; “Strong deal” at 50% off or more; “Good deal” at 30–49% off; “Routine sale” below that.</li>
    <li><strong>Deal score</strong> — mostly the discount percentage, with a logarithmic kicker for dollars saved (so a cheap item at 60% off still scores well), and a small bonus for an all-time low.</li>
  </ul>
  <p>Prices move during Black Friday week and stock runs out. Check the store listing before you pay.</p>
</article>`;
}

export function missingPage() {
  return `<h1>Not found</h1><p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}
