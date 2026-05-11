const API_BASE = '';  // same origin (Flask serves frontend)

const Api = {
  _token: () => localStorage.getItem('evhapo_token'),

  _headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = this._token();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },

  async _req(method, path, body) {
    const opts = { method, headers: this._headers() };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(API_BASE + path, opts);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const err = new Error(data.error || `HTTP ${r.status}`);
      err.status = r.status;
      throw err;
    }
    return data;
  },

  get: (p) => Api._req('GET', p),
  post: (p, b) => Api._req('POST', p, b),

  async register(payload) {
    const d = await this.post('/api/register', payload);
    localStorage.setItem('evhapo_token', d.token);
    localStorage.setItem('evhapo_user', JSON.stringify({ nombre: d.nombre, email: d.email }));
    return d;
  },

  async login(email, password) {
    const d = await this.post('/api/login', { email, password });
    localStorage.setItem('evhapo_token', d.token);
    localStorage.setItem('evhapo_user', JSON.stringify(d));
    return d;
  },

  logout() {
    this.post('/api/logout').catch(() => {});
    localStorage.removeItem('evhapo_token');
    localStorage.removeItem('evhapo_user');
    localStorage.removeItem('evhapo_session');
    localStorage.removeItem('evhapo_coupon');
  },

  isLoggedIn: () => !!localStorage.getItem('evhapo_token'),
  currentUser: () => JSON.parse(localStorage.getItem('evhapo_user') || 'null'),

  me: async () => {
    const d = await Api.get('/api/me');
    // Guardar has_payment y coupon en localStorage para acceso rápido
    if (d && d.user) {
      const u = JSON.parse(localStorage.getItem('evhapo_user') || '{}');
      u.has_payment = d.has_payment;
      u.pais = u.pais || d.user.pais;
      localStorage.setItem('evhapo_user', JSON.stringify(u));
    }
    // Guardar estado del cupón
    localStorage.setItem('evhapo_coupon', JSON.stringify(d.coupon || null));
    return d;
  },

  createPayment: (method, pais, test_type = 'mental') => Api.post('/api/payment/create', { method, pais, test_type }),
  confirmPayment: (payment_id) => Api.post('/api/payment/confirm', { payment_id }),

  startTest: (session_id) => Api.post('/api/test/start', { session_id }),
  submitTest: (session_id, answers) => Api.post('/api/test/submit', { session_id, answers }),
  getResults: (session_id) => Api.get(`/api/test/results/${session_id}`),

  dashboard: () => Api.get('/api/dashboard'),
};
