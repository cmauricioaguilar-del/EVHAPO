// ─── Sistema de idiomas MindEV ────────────────────────────────────────────────
// Soporta: 'es' (Español) y 'pt' (Português Brasileiro)

const I18N = {
  _lang: localStorage.getItem('mindev_lang') || 'es',

  get lang() { return this._lang; },

  set(l) {
    this._lang = l;
    localStorage.setItem('mindev_lang', l);
    location.reload();
  },

  isPT() { return this._lang === 'pt'; },

  // Devuelve las categorías mentales en el idioma actual
  cats() {
    if (this._lang === 'pt' && typeof EVHAPO_CATEGORIES_PT !== 'undefined')
      return EVHAPO_CATEGORIES_PT;
    return EVHAPO_CATEGORIES;
  },

  // Devuelve las categorías técnicas en el idioma actual
  techCats() {
    if (this._lang === 'pt' && typeof TECHNICAL_CATEGORIES_PT !== 'undefined')
      return TECHNICAL_CATEGORIES_PT;
    return TECHNICAL_CATEGORIES;
  },

  // Retorna las categorías según el tipo de test
  catsForType(testType) {
    return testType === 'technical' ? this.techCats() : this.cats();
  },
};
