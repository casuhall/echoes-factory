/**
 * Couche d'abstraction du stockage de l'usine.
 *
 * - Mode local par défaut : la donnée est stockée dans `localStorage`
 *   sous la clé `usine`.
 * - Mode Pantry optionnel : la donnée est stockée dans un basket Pantry
 *   nommé `echoes-factory`. L'identifiant Pantry est mémorisé dans
 *   `localStorage` sous la clé `pantry_id`.
 */

const CLÉ_USINE = 'usine';
const CLÉ_PANTRY_ID = 'pantry_id';
const BASKET_NAME = 'echoes-factory';
const URL_PANTRY = 'https://getpantry.cloud/apiv1/pantry';

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
 * Stratégie de stockage distante basée sur Pantry.
 */
export class StockagePantry {
  #pantryId;

  /** @param {string} pantryId */
  constructor(pantryId) {
    this.#pantryId = pantryId;
  }

  /** @param {string} clé @returns {Promise<string|null>} */
  async lire(clé) {
    const réponse = await fetch(`${URL_PANTRY}/${this.#pantryId}/basket/${BASKET_NAME}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (réponse.status === 404) {
      return null;
    }
    if (!réponse.ok) {
      throw new Error(`Erreur de lecture Pantry : ${réponse.status} ${réponse.statusText}`);
    }
    const données = await réponse.json();
    return données.usine ?? null;
  }

  /** @param {string} clé @param {string} valeur */
  async sauvegarder(clé, valeur) {
    const réponse = await fetch(`${URL_PANTRY}/${this.#pantryId}/basket/${BASKET_NAME}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usine: valeur })
    });
    if (!réponse.ok) {
      throw new Error(`Erreur de sauvegarde Pantry : ${réponse.status} ${réponse.statusText}`);
    }
  }

  /** @param {string} clé */
  async supprimer(clé) {
    const réponse = await fetch(`${URL_PANTRY}/${this.#pantryId}/basket/${BASKET_NAME}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!réponse.ok && réponse.status !== 204) {
      throw new Error(`Erreur de suppression Pantry : ${réponse.status} ${réponse.statusText}`);
    }
  }
}

/**
 * Point d'accès unique au stockage de l'usine.
 */
export class Stockage {
  #strategie;
  #modePantry = false;
  #pantryId = null;

  /**
   * @param {string|null} [pantryId=null] Identifiant Pantry optionnel.
   */
  constructor(pantryId = null) {
    if (pantryId) {
      this.#modePantry = true;
      this.#pantryId = pantryId;
      this.#strategie = new StockagePantry(pantryId);
    } else {
      this.#strategie = new StockageLocal();
    }
  }

  /** @type {boolean} */
  get modePantry() { return this.#modePantry; }

  /** @type {string|null} */
  get pantryId() { return this.#pantryId; }

  /**
   * Lit la représentation sérialisée de l'usine.
   * @returns {Promise<string|null>}
   */
  async lireUsine() {
    return await this.#strategie.lire(CLÉ_USINE);
  }

  /**
   * Sauvegarde l'usine fournie.
   * @param {import('./service.js').Usine} usine
   */
  async sauvegarderUsine(usine) {
    await this.#strategie.sauvegarder(CLÉ_USINE, usine.toString());
  }

  /**
   * Supprime l'usine persistée.
   */
  async supprimerUsine() {
    await this.#strategie.supprimer(CLÉ_USINE);
  }

  /**
   * Lit une valeur arbitraire par clé.
   * @param {string} clé
   * @returns {Promise<string|null>|string|null}
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

  /**
   * Lit l'identifiant Pantry mémorisé.
   * @returns {string|null}
   */
  static lirePantryId() {
    return localStorage.getItem(CLÉ_PANTRY_ID);
  }

  /**
   * Mémorise l'identifiant Pantry.
   * @param {string} id
   */
  static mémoriserPantryId(id) {
    localStorage.setItem(CLÉ_PANTRY_ID, id);
  }

  /**
   * Supprime l'identifiant Pantry mémorisé.
   */
  static oublierPantryId() {
    localStorage.removeItem(CLÉ_PANTRY_ID);
  }
}

/**
 * Gère la transition lors de la première saisie d'un identifiant Pantry.
 *
 * @param {string} identifiant
 * @returns {Promise<{ conflit: boolean, donnéesPantry: string|null, donnéesLocales: string|null }>}
 */
export async function associerPantry(identifiant) {
  const stockageLocal = new StockageLocal();
  const stockagePantry = new StockagePantry(identifiant);

  let donnéesPantry = null;
  try {
    donnéesPantry = await stockagePantry.lire(CLÉ_USINE);
  } catch (erreur) {
    throw erreur; // L'UI gère l'affichage de l'erreur
  }

  const donnéesLocales = stockageLocal.lire(CLÉ_USINE);

  // Règle 2 : Pantry vide et données locales présentes → transfert silencieux
  if (!donnéesPantry && donnéesLocales) {
    await stockagePantry.sauvegarder(CLÉ_USINE, donnéesLocales);
    Stockage.mémoriserPantryId(identifiant);
    return { conflit: false, donnéesPantry: null, donnéesLocales };
  }

  // Règle 3 : Pantry vide et locales absentes → utilisation silencieuse
  if (!donnéesPantry && !donnéesLocales) {
    Stockage.mémoriserPantryId(identifiant);
    return { conflit: false, donnéesPantry: null, donnéesLocales: null };
  }

  // Règle 4 : locales absentes et Pantry plein → utilisation silencieuse
  if (donnéesPantry && !donnéesLocales) {
    Stockage.mémoriserPantryId(identifiant);
    return { conflit: false, donnéesPantry, donnéesLocales: null };
  }

  // Règle 5 : les deux contiennent des données valides → conflit
  if (donnéesPantry && donnéesLocales) {
    return { conflit: true, donnéesPantry, donnéesLocales };
  }

  return { conflit: false, donnéesPantry, donnéesLocales };
}
