// The deal finder: hash routes, live search and filters. The deals live in
// deals.js, so the site needs no network to show them; each deal links out to
// its store with a plain <a href>.
//
//   #/            the board, with search, filters and sorting
//   #/deal/<id>   one deal, with a store comparison where one exists
//   #/about       how prices were checked
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { deals } from './deals.js';
import { listPage, dealPage, aboutPage, missingPage } from './views.js';

const app = document.getElementById('app');

const state = { query: '', category: '', store: '', minOff: 0, sort: 'score' };

function render() {
  window.__shotReady = false;
  const hash = location.hash || '#/';
  const dealMatch = hash.match(/^#\/deal\/([^/?]+)/);
  if (dealMatch) {
    const found = deals.find((d) => d.id === decodeURIComponent(dealMatch[1]));
    document.title = `${found ? found.title : 'Not found'} | Bargain Board`;
    app.innerHTML = found ? dealPage(found) : missingPage();
  } else if (hash === '#/about') {
    document.title = 'How prices were checked | Bargain Board';
    app.innerHTML = aboutPage();
  } else {
    document.title = 'Bargain Board — Black Friday 2026 deals, checked today';
    app.innerHTML = listPage(state);
    wireControls();
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function wireControls() {
  const form = document.getElementById('controls');
  if (!form) return;
  const read = () => {
    state.query = document.getElementById('q').value;
    state.category = document.getElementById('category').value;
    state.store = document.getElementById('store').value;
    state.minOff = Number(document.getElementById('minOff').value);
    state.sort = document.getElementById('sort').value;
  };
  // Search and the selects re-render the board in place, keeping the focus
  // where the shopper left it.
  form.addEventListener('input', (event) => {
    const active = document.activeElement;
    const activeId = active && active.id;
    const selectionStart = active && typeof active.selectionStart === 'number' ? active.selectionStart : null;
    read();
    const scroll = window.scrollY;
    render();
    window.scrollTo(0, scroll);
    if (activeId) {
      const next = document.getElementById(activeId);
      if (next) {
        next.focus();
        if (selectionStart !== null && typeof next.setSelectionRange === 'function') {
          try {
            next.setSelectionRange(selectionStart, selectionStart);
          } catch {
            // Some inputs do not support a selection range; focus is enough.
          }
        }
      }
    }
  });
  form.addEventListener('submit', (event) => event.preventDefault());
}

window.addEventListener('hashchange', render);
render();
