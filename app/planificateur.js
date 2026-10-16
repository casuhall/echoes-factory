/**
 * Module de planification de production.
 * Fournit les classes ÉtapePlan, PlanProduction et Planificateur.
 */

/**
 * Représente une étape du plan de production, c'est-à-dire la décision
 * prise pour un composant donné (acheter ou fabriquer).
 */
export class ÉtapePlan {
    /** @type {string} Nom du composant */
    nom;
    /** @type {number} Quantité totale nécessaire */
    quantité;
    /** @type {"BUILD"|"BUY"} Décision recommandée */
    décision;
    /** @type {number|undefined} Coût total de l'étape (quantité × prix unitaire), ou undefined si inconnu */
    coût;
    /** @type {number|undefined} Quantité manquante en stock pour cette étape (0 si le stock couvre le besoin), ou undefined si non applicable */
    déficit;
    /** @type {boolean} Vrai si l'étape est immédiatement réalisable avec le stock actuel (BUY avec déficit === 0), faux sinon */
    réalisable;

    /**
     * @param {string} nom
     * @param {number} quantité
     * @param {"BUILD"|"BUY"} décision
     * @param {number|undefined} coût
     * @param {number|undefined} déficit
     */
    constructor(nom, quantité, décision, coût, déficit) {
        this.nom = nom;
        this.quantité = quantité;
        this.décision = décision;
        this.coût = coût;
        this.déficit = déficit;
        this.réalisable = décision === 'BUY' && déficit === 0;
    }
}

/**
 * Représente le plan de production complet pour un produit cible.
 */
export class PlanProduction {
    /** @type {ÉtapePlan[]} Liste des composants avec leur décision */
    étapes;
    /** @type {number|undefined} Somme des coûts de toutes les étapes, ou undefined si un coût est manquant */
    coût_total;
    /** @type {number|undefined} Coût total des étapes BUY, ou undefined si un coût BUY est inconnu */
    coût_achats;
    /** @type {number|undefined} Déficit de liquidités (Math.max(0, coût_achats - liquidités)), ou undefined si coût_achats inconnu */
    déficit_liquidités;

    /**
     * @param {ÉtapePlan[]} étapes
     * @param {number|undefined} coût_total
     * @param {number|undefined} coût_achats
     * @param {number|undefined} déficit_liquidités
     */
    constructor(étapes, coût_total, coût_achats, déficit_liquidités) {
        this.étapes = étapes;
        this.coût_total = coût_total;
        this.coût_achats = coût_achats;
        this.déficit_liquidités = déficit_liquidités;
    }
}

/**
 * Planifie la production d'un produit cible en comparant les coûts
 * de fabrication et d'achat pour chaque composant nécessaire.
 */
export class Planificateur {
    /** @type {import('./service.js').Usine} */
    #usine;

    /**
     * @param {import('./service.js').Usine} usine Instance de l'usine avec catalogue, marché et inventaire
     */
    constructor(usine) {
        this.#usine = usine;
    }

    /**
     * Calcule le plan de production pour un produit cible et une quantité donnée.
     *
     * @param {string} nomProduit Nom du produit à fabriquer
     * @param {number} quantité Quantité souhaitée
     * @returns {PlanProduction} Le plan de production calculé
     * @throws {Error} Si le produit est absent du catalogue
     */
    planifier(nomProduit, quantité) {
        const produit = this.#usine.produit(nomProduit);
        if (!produit) {
            throw new Error(`Produit introuvable dans le catalogue : ${nomProduit}`);
        }

        const recette = produit.recette;
        const étapes = [];
        let coût_total_défini = true;

        for (const ingrédient of recette.ingrédients) {
            const quantité_requise = ingrédient.quantité * quantité;
            const produitComposant = this.#usine.produit(ingrédient.nom);

            let décision;
            let coût_unitaire;

            if (produitComposant && produitComposant.statut === 'BUILD') {
                // Le composant est fabriqué : on utilise son coût de revient
                décision = 'BUILD';
                coût_unitaire = produitComposant.coût_reviens;
            } else {
                // Le composant est acheté (statut BUY, NA, ou absent du catalogue)
                décision = 'BUY';
                const tarif = this.#usine.tarifs.find(t => t.nom === ingrédient.nom);
                coût_unitaire = tarif?.montant;
            }

            const coût_étape = (coût_unitaire !== undefined)
                ? coût_unitaire * quantité_requise
                : undefined;

            if (coût_étape === undefined) {
                coût_total_défini = false;
            }

            // Calcul du déficit pour les étapes BUY : quantité manquante en stock
            let déficit;
            if (décision === 'BUY') {
                const entrée_stock = this.#usine.stock_disponible.find(s => s.nom === ingrédient.nom);
                const quantité_disponible = entrée_stock ? entrée_stock.quantité : 0;
                déficit = Math.max(0, quantité_requise - quantité_disponible);
            }

            étapes.push(new ÉtapePlan(ingrédient.nom, quantité_requise, décision, coût_étape, déficit));
        }

        // Trier les étapes : d'abord celles immédiatement réalisables (BUY avec déficit === 0),
        // ensuite les autres (BUY avec déficit > 0 ou BUILD), en conservant l'ordre relatif
        // au sein de chaque groupe (Exigence 9.10)
        étapes.sort((a, b) => {
            const aRéalisable = a.réalisable ? 0 : 1;
            const bRéalisable = b.réalisable ? 0 : 1;
            return aRéalisable - bRéalisable;
        });

        // Frais de fabrication du produit cible (frais × nombre de cycles)
        const cycles = Math.ceil(quantité / recette.quantité_produite);
        const frais_fabrication = recette.frais * cycles;

        let coût_total;
        if (coût_total_défini) {
            const somme_étapes = étapes.reduce((acc, e) => acc + (e.coût ?? 0), 0);
            coût_total = somme_étapes + frais_fabrication;
        } else {
            coût_total = undefined;
        }

        // Coût des achats : somme des coûts des étapes BUY uniquement
        const étapes_buy = étapes.filter(e => e.décision === 'BUY');
        let coût_achats;
        if (étapes_buy.every(e => e.coût !== undefined)) {
            coût_achats = étapes_buy.reduce((acc, e) => acc + e.coût, 0);
        } else {
            coût_achats = undefined;
        }

        // Déficit de liquidités : différence entre coût des achats et liquidités disponibles
        const déficit_liquidités = (coût_achats !== undefined)
            ? Math.max(0, coût_achats - this.#usine.liquidités)
            : undefined;

        return new PlanProduction(étapes, coût_total, coût_achats, déficit_liquidités);
    }
}
