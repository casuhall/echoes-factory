/**
 * Gestion de l'internationalisation.
 *
 * Charge les fichiers de traduction JSON depuis le dossier `locales/`
 * et fournit une fonction `t(clé, params)` pour récupérer les traductions.
 */

const LOCALES_PATH = './locales';
const CLÉ_LOCALE = 'locale';
const LOCALE_PAR_DÉFAUT = 'fr';

class I18n {
  #locale = LOCALE_PAR_DÉFAUT;
  #traductions = {};
  #localesDisponibles = ['fr', 'en', 'de', 'es'];

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const sauvegardée = localStorage.getItem(CLÉ_LOCALE);
      if (sauvegardée && this.#localesDisponibles.includes(sauvegardée)) {
        this.#locale = sauvegardée;
        return;
      }
    }
    // Détecter la langue du navigateur
    if (typeof navigator !== 'undefined') {
      const languesNavigateur = navigator.languages || [navigator.language];
      for (const langue of languesNavigateur) {
        const code = langue.split('-')[0].toLowerCase();
        if (this.#localesDisponibles.includes(code)) {
          this.#locale = code;
          return;
        }
      }
    }
    // Fallback sur le français
    this.#locale = LOCALE_PAR_DÉFAUT;
  }

  /** @type {string} */
  get locale() { return this.#locale; }

  /** @type {string[]} */
  get localesDisponibles() { return [...this.#localesDisponibles]; }

  /**
   * Charge les traductions pour la locale donnée.
   * @param {string} [locale] Locale à charger (par défaut : locale courante)
   * @returns {Promise<void>}
   */
  async charger(locale = this.#locale) {
    if (!this.#localesDisponibles.includes(locale)) {
      locale = LOCALE_PAR_DÉFAUT;
    }
    this.#locale = locale;
    try {
      const réponse = await fetch(`${LOCALES_PATH}/${locale}.json`);
      if (!réponse.ok) {
        throw new Error(`Fichier de traduction introuvable : ${locale}.json`);
      }
      this.#traductions = await réponse.json();
    } catch (erreur) {
      console.error(`Erreur de chargement des traductions (${locale}) :`, erreur);
      // Fallback sur le français
      if (locale !== LOCALE_PAR_DÉFAUT) {
        await this.charger(LOCALE_PAR_DÉFAUT);
      }
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CLÉ_LOCALE, this.#locale);
    }
  }

  /**
   * Retourne la traduction pour la clé donnée.
   * @param {string} clé Clé de traduction (dot-notation)
   * @param {Object} [params] Paramètres d'interpolation
   * @returns {string}
   */
  t(clé, params = {}) {
    let valeur = this.#traductions[clé];
    if (valeur === undefined) {
      // Fallback : essayer le français si ce n'est pas déjà la locale courante
      if (this.#locale !== LOCALE_PAR_DÉFAUT) {
        // On ne peut pas charger de façon synchrone, on retourne la clé
      }
      return clé;
    }
    // Interpolation des paramètres {param}
    if (params && typeof params === 'object') {
      for (const [param, val] of Object.entries(params)) {
        valeur = valeur.replace(new RegExp(`\\{${param}\\}`, 'g'), val);
      }
    }
    return valeur;
  }

  /**
   * Change la locale courante et recharge les traductions.
   * @param {string} locale
   * @returns {Promise<void>}
   */
  async changerLocale(locale) {
    await this.charger(locale);
  }
}

// Singleton
const i18n = new I18n();

export { i18n, I18n };
