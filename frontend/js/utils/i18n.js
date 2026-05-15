// ─── Sistema de idiomas MindEV ────────────────────────────────────────────────
// Soporta: 'es' (Español), 'pt' (Português Brasileiro), 'en' (English)

const I18N = {
  _lang: localStorage.getItem('mindev_lang') || 'es',

  get lang() { return this._lang; },

  set(l) {
    this._lang = l;
    localStorage.setItem('mindev_lang', l);
    // Actualizar meta tags del documento con el nuevo idioma
    if (typeof _updatePageMeta === 'function') _updatePageMeta();
    // Re-renderiza la página actual en el mismo DOM (sin recarga = sin parpadeo de banderas).
    // App._lastArg preserva el argumento del último App.go() (ej: datos de resultados).
    if (typeof App !== 'undefined' && App.current) {
      App.go(App.current, App._lastArg);
    } else {
      location.reload(); // fallback solo si App aún no existe
    }
  },

  isPT() { return this._lang === 'pt'; },
  isEN() { return this._lang === 'en'; },

  // Helper: returns the string for the current language (en/es/pt)
  t(en, es, pt) {
    if (this._lang === 'en') return en;
    if (this._lang === 'pt') return pt;
    return es;
  },

  // Devuelve las categorías mentales en el idioma actual
  cats() {
    if (this._lang === 'en' && typeof EVHAPO_CATEGORIES_EN !== 'undefined')
      return EVHAPO_CATEGORIES_EN;
    if (this._lang === 'pt' && typeof EVHAPO_CATEGORIES_PT !== 'undefined')
      return EVHAPO_CATEGORIES_PT;
    return EVHAPO_CATEGORIES;
  },

  // Devuelve las categorías técnicas en el idioma actual
  techCats() {
    if (this._lang === 'en' && typeof TECHNICAL_CATEGORIES_EN !== 'undefined')
      return TECHNICAL_CATEGORIES_EN;
    if (this._lang === 'pt' && typeof TECHNICAL_CATEGORIES_PT !== 'undefined')
      return TECHNICAL_CATEGORIES_PT;
    return TECHNICAL_CATEGORIES;
  },

  // Retorna las categorías según el tipo de test
  catsForType(testType) {
    return testType === 'technical' ? this.techCats() : this.cats();
  },
};
