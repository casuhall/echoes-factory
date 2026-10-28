/**
 * Modèles de planification de production.
 *
 * - ÉtapePlan : une ligne de plan (composant, quantité, décision BUILD/BUY, quantité déjà en stock).
 * - PlanProduction : le plan complet pour un produit cible, avec récursion, recommandations par défaut
 *   et possibilité de surcharge manuelle.
 */

/**
 * Représente une étape du plan de production.
 * @typedef {Object} ÉtapePlan
 * @property {string} nom - Nom de l'objet concerné.
 * @property {number} quantité - Quantité requise pour atteindre l'objectif.
 * @property {'BUY'|'BUILD'} décision - Recommandation par défaut.
 * @property {number} quantité_stock - Quantité déjà disponible en stock.
 * @property {boolean} [surcharge] - true si l'utilisateur a forcé la décision manuellement.
 */

class ÉtapePlan {
  #nom;
  #quantité;
  #décision;
  #quantité_stock;
  #surcharge = false;
  #frais_fabrication = 0;
  #coût_achat = 0;

  /**
   * @param {string} nom
   * @param {number} quantité
   * @param {'BUY'|'BUILD'} décision
   * @param {number} quantité_stock
   * @param {boolean} [surcharge=false]
   */
  constructor(nom, quantité, décision, quantité_stock, surcharge = false, frais_fabrication = 0, coût_achat = 0) {
    if (!nom || String(nom).trim().length === 0) {
      throw new Error(`Nom d'étape obligatoire. Fournis : ${nom}`);
    }
    if (!quantité || quantité <= 0 || Number.isInteger(quantité) === false) {
      throw new Error(`Quantité d'étape invalide. Fournis : quantité=${quantité}`);
    }
    if (décision !== 'BUY' && décision !== 'BUILD') {
      throw new Error(`Décision invalide. Fournis : décision=${décision}`);
    }
    if (!Number.isInteger(quantité_stock) || quantité_stock < 0) {
      throw new Error(`Quantité en stock invalide. Fournis : quantité_stock=${quantité_stock}`);
    }
    this.#nom = nom;
    this.#quantité = quantité;
    this.#décision = décision;
    this.#quantité_stock = quantité_stock;
    this.#surcharge = surcharge;
    this.#frais_fabrication = frais_fabrication;
    this.#coût_achat = coût_achat;
  }

  /** @type {string} Nom de l'étape. */
  get nom() { return this.#nom; }
  /** @type {number} Quantité requise. */
  get quantité() { return this.#quantité; }
  /** @type {'BUY'|'BUILD'} Décision recommandée ou forcée. */
  get décision() { return this.#décision; }
  /** @type {number} Quantité déjà en stock. */
  get quantité_stock() { return this.#quantité_stock; }
  /** @type {boolean} true si l'utilisateur a surchargé la recommandation. */
  get surcharge() { return this.#surcharge; }
  /** @type {number} Quantité manquante après prise en compte du stock. */
  get quantité_manquante() { return Math.max(0, this.#quantité - this.#quantité_stock); }
  /** @type {number} Frais de fabrication pour cette étape (BUILD uniquement). */
  get frais_fabrication() { return this.#frais_fabrication; }
  /** @type {number} Coût d'achat pour cette étape (BUY uniquement). */
  get coût_achat() { return this.#coût_achat; }

  /** @returns {{nom:string,quantité:number,décision:string,quantité_stock:number,surcharge:boolean}} */
  toObject() {
    return {
      nom: this.#nom,
      quantité: this.#quantité,
      décision: this.#décision,
      quantité_stock: this.#quantité_stock,
      surcharge: this.#surcharge,
      quantité_manquante: this.quantité_manquante,
      frais_fabrication: this.#frais_fabrication,
      coût_achat: this.#coût_achat
    };
  }
}

/**
 * Plan de production pour un produit cible.
 *
 * Le plan expose :
 * - la liste plate des étapes nécessaires (récursion aplatie) ;
 * - le coût total estimé en fonction des décisions ;
 * - la possibilité de surcharger manuellement chaque étape.
 */
class PlanProduction {
  #produit_cible;
  #quantité_cible;
  #étapes = [];
  #coût_total = 0;

  /**
   * @param {string} produit_cible
   * @param {number} quantité_cible
   * @param {ÉtapePlan[]} [étapes=[]]
   * @param {number} [coût_total=0]
   */
  constructor(produit_cible, quantité_cible, étapes = [], coût_total = 0) {
    if (!produit_cible || String(produit_cible).trim().length === 0) {
      throw new Error(`Produit cible obligatoire. Fournis : ${produit_cible}`);
    }
    if (!quantité_cible || quantité_cible <= 0 || Number.isInteger(quantité_cible) === false) {
      throw new Error(`Quantité cible invalide. Fournis : quantité_cible=${quantité_cible}`);
    }
    if (!Array.isArray(étapes)) {
      throw new Error(`Étapes invalides. Fournis : ${étapes}`);
    }
    this.#produit_cible = produit_cible;
    this.#quantité_cible = quantité_cible;
    this.#étapes = [...étapes];
    this.#coût_total = coût_total;
  }

  /** @type {string} Produit cible du plan. */
  get produit_cible() { return this.#produit_cible; }
  /** @type {number} Quantité cible du produit final. */
  get quantité_cible() { return this.#quantité_cible; }
  /** @type {ÉtapePlan[]} Liste des étapes du plan. */
  get étapes() { return [...this.#étapes]; }
  /** @type {number} Coût total estimé du plan. */
  get coût_total() { return this.#coût_total; }
  /** @type {number} Total des frais de fabrication (BUILD). */
  get frais_fabrication_total() {
    return this.#étapes.reduce((sum, étape) => sum + étape.frais_fabrication, 0);
  }
  /** @type {number} Total des coûts d'achat (BUY). */
  get coûts_achat_total() {
    return this.#étapes.reduce((sum, étape) => sum + étape.coût_achat, 0);
  }
  /** @type {number} Total requis (frais + achats). */
  get total_requis() {
    return this.frais_fabrication_total + this.coûts_achat_total;
  }


  /** @returns {{produit_cible:string,quantité_cible:number,étapes:Array,durée:number}} */
  toObject() {
    return {
      produit_cible: this.#produit_cible,
      quantité_cible: this.#quantité_cible,
      étapes: this.#étapes.map(étape => étape.toObject()),
      coût_total: this.#coût_total,
      frais_fabrication_total: this.frais_fabrication_total,
      coûts_achat_total: this.coûts_achat_total,
      total_requis: this.total_requis
    };
  }
}

export { ÉtapePlan, PlanProduction };
