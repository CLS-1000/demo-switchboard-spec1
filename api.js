// SWITCHBOARD — shared API client for the SPEC-1 engine.
// All pages include this file; it centralises the base URL, fetch, and
// the endpoint helpers the desks call. No build step, no dependencies.

const SPEC1 = {
  base: (localStorage.getItem('spec1_base') || 'http://localhost:8000/api/v1').replace(/\/$/, ''),

  setBase(b) {
    this.base = b.replace(/\/$/, '');
    localStorage.setItem('spec1_base', this.base);
  },

  // Generic JSON GET with consistent error handling.
  async get(path) {
    let r;
    try {
      r = await fetch(this.base + path, { headers: { Accept: 'application/json' } });
    } catch (e) {
      throw new Error('network: ' + e.message);
    }
    if (!r.ok) throw new Error('HTTP ' + r.status + ' @ ' + path);
    return r.json();
  },

  // --- endpoint helpers (match the FastAPI routers on /api/v1) ---
  async runs(limit = 20) {
    const j = await this.get('/runs?limit=' + limit);
    return Array.isArray(j) ? j : (j.runs || []);
  },
  async run(id, params = '') {
    const j = await this.get('/runs/' + encodeURIComponent(id) + (params || ''));
    return j;
  },
  async runRecords(id, params = '') {
    const j = await this.get('/runs/' + encodeURIComponent(id) + '/records' + params);
    return j.records || [];
  },
  async metrics() {
    // served at root, NOT under /api/v1
    const root = this.base.replace(/\/api\/v1\/?$/, '');
    let r;
    try {
      r = await fetch(root + '/metrics/json', { headers: { Accept: 'application/json' } });
    } catch (e) {
      throw new Error('network: ' + e.message);
    }
    if (!r.ok) throw new Error('HTTP ' + r.status + ' @ /metrics/json');
    return r.json();
  },
  async nodeSignal(id) {
    // requires SPEC1_POLITICAL_WEB=true on the server
    return this.get('/nodes/' + encodeURIComponent(id) + '/signal');
  },
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function status(el, msg, cls) {
  el.textContent = msg;
  el.className = 'note' + (cls ? ' ' + cls : '');
}
// Shared nav + base bar injected into every page.
function mountChrome(active) {
  const nav = [
    ['index.html', 'Board'],
    ['triage.html', 'Triage Desk'],
    ['citizen.html', 'Citizen Cognisance'],
  ];
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.innerHTML =
    '<span class="brand">SWITCHBOARD</span>' +
    nav.map(([h, l]) => '<a href="' + h + '"' + (h === active ? ' class="on"' : '') + '>' + l + '</a>').join('') +
    '<input id="base" value="' + SPEC1.base + '" spellcheck="false">' +
    '<button id="setbase">SET</button>';
  document.body.insertBefore(bar, document.body.firstChild);
  document.getElementById('setbase').addEventListener('click', () => {
    SPEC1.setBase(document.getElementById('base').value);
    location.reload();
  });
}
