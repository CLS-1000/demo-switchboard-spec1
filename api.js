// SWITCHBOARD — shared API client for the SPEC-1 engine.
// All pages include this file; it centralises the base URL, fetch, and
// the endpoint helpers the desks call. No build step, no dependencies.

const SPEC1 = {
  base: (localStorage.getItem('spec1_base') || 'http://localhost:8000/api/v1').replace(/\/$/, ''),

  setBase(b) {
    this.base = b.replace(/\/$/, '');
    localStorage.setItem('spec1_base', this.base);
  },

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
    return this.get('/nodes/' + encodeURIComponent(id) + '/signal');
  },
  // Legislative desk (always on, no political-web flag needed)
  async legStatus() { return this.get('/desk/legislative/status'); },
  async legRecords(kind, q) {
    const p = '?limit=200' + (kind ? '&kind=' + kind : '') + (q ? '&q=' + encodeURIComponent(q) : '');
    return this.get('/desk/legislative/records' + p);
  },
  async legBrief(date) {
    return this.get('/desk/legislative/brief' + (date ? '?date=' + date : ''));
  },
  // Narrative / brief store
  async briefLatest() { return this.get('/brief/latest'); },
  async briefHistory() { return this.get('/brief/history'); },
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function status(el, msg, cls) {
  el.textContent = msg;
  el.className = 'note' + (cls ? ' ' + cls : '');
}
function mountChrome(active, prefix = '') {
  const nav = [
    ['index.html', 'Board'],
    ['triage.html', 'Triage Desk'],
    ['legislative.html', 'Legislative'],
    ['narrative.html', 'Narrative'],
    ['briefs/index.html', 'Briefs'],
    ['citizen.html', 'Citizen Cognisance'],
    ['mcp.html', 'MCP'],
  ];
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.innerHTML =
    '<span class="brand">SWITCHBOARD</span>' +
    nav.map(([h, l]) => '<a href="' + prefix + h + '"' + (h === active ? ' class="on"' : '') + '>' + l + '</a>').join('') +
    '<input id="base" value="' + SPEC1.base + '" spellcheck="false">' +
    '<button id="setbase">SET</button>';
  document.body.insertBefore(bar, document.body.firstChild);
  document.getElementById('setbase').addEventListener('click', () => {
    SPEC1.setBase(document.getElementById('base').value);
    location.reload();
  });
}
// Render a flat dict as key/value rows.
function kvRows(obj) {
  let h = '';
  for (const [k, v] of Object.entries(obj || {})) {
    if (v == null) continue;
    if (typeof v === 'object') { h += '<div class="kv"><span class="k">' + esc(k) + ':</span></div>' + kvRows(v); continue; }
    h += '<div class="kv"><span class="k">' + esc(k) + ':</span> <span class="v">' + esc(v) + '</span></div>';
  }
  return h;
}
