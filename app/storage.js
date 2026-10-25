/**
 * Couche d'abstraction du stockage de l'usine.
 *
 * - Mode local uniquement pour l'instant : la donnée est stockée dans
 *   `localStorage` sous la clé `usine`.
 * - Le mode Pantry est prévu mais désactivé par défaut. L'intégration
 *   future pourra se faire sans modifier les pages HTML qui utilisent
 *   cette abstraction.
 */

const CLÉ_USINE = 'usine';

/**
 * Stratégie de stockage local basée sur `localStorage`.
 */
class StockageLocal {
  /** @param {string} clé @returns {string|null} */
  lire(clé) {
    return localStorage.getItem(clé);
  }

  /** @param {string} clé @param {string} valeur */
  sauvegarder(clé, valeur) {
    localStorage.setItem(clé, valeur);
  }

  /** @param {string} clé */
  supprimer(clé) {
    localStorage.removeItem(clé);
  }
}

/**
 * Point d'accès unique au stockage de l'usine.
 *
 * Pour l'instant, seul le mode local est disponible.
 */
export class Stockage {
  #strategie;

  /**
   * @param {boolean} [modePantry=false] Réservé pour une intégration future.
   */
  constructor(modePantry = false) {
    if (modePantry) {
      throw new Error('Le mode Pantry n est pas encore disponible.');
    }
    this.#strategie = new StockageLocal();
  }

  /**
   * Lit la représentation sérialisée de l'usine.
   * @returns {string|null}
   */
  lireUsine() {
    return this.#strategie.lire(CLÉ_USINE);
  }

  /**
   * Sauvegarde l'usine fournie.
   * @param {import('./service.js').Usine} usine
   */
  sauvegarderUsine(usine) {
    this.#strategie.sauvegarder(CLÉ_USINE, usine.toString());
  }

  /**
   * Supprime l'usine persistée.
   */
  supprimerUsine() {
    this.#strategie.supprimer(CLÉ_USINE);
  }

  /**
   * Lit une valeur arbitraire par clé.
   * @param {string} clé
   * @returns {string|null}
   */
  lire(clé) {
    return this.#strategie.lire(clé);
  }

  /**
   * Sauvegarde une valeur arbitraire par clé.
   * @param {string} clé
   * @param {string} valeur
   */
  sauvegarder(clé, valeur) {
    this.#strategie.sauvegarder(clé, valeur);
  }

  /**
   * Supprime une valeur arbitraire par clé.
   * @param {string} clé
   */
  supprimer(clé) {
    this.#strategie.supprimer(clé);
  }
}
