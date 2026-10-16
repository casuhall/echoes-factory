/**
 * Module de gestion des surcharges du plan de production.
 * Fournit le calcul du coût unitaire effectif en tenant compte
 * d'une décision explicite (BUY ou BUILD) pouvant remplacer la décision par défaut.
 */

/**
 * Calcule le coût unitaire d'une étape selon la décision effective.
 *
 * - Si le composant est absent du catalogue → on prend le tarif marché (BUY forcé).
 * - Si décision = "BUILD" → on utilise le coût de revient du produit.
 * - Si décision = "BUY"   → on utilise le tarif marché du composant.
 *
 * @param {import('./service.js').Usine} usine Instance de l'usine
 * @param {import('./planificateur.js').ÉtapePlan} étape Étape du plan de production
 * @param {"BUY"|"BUILD"} décisionEffective Décision à appliquer (par défaut ou surchargée)
 * @returns {number|undefined} Coût unitaire, ou undefined si le tarif est inconnu
 */
export function coûtUnitaireEffectif(usine, étape, décisionEffective) {
    const produitComposant = usine.produit(étape.nom);

    if (!produitComposant) {
        // Pas de produit catalogue → coût BUY depuis les tarifs marché
        const tarif = usine.tarifs.find(t => t.nom === étape.nom);
        return tarif?.montant;
    }

    if (décisionEffective === 'BUILD') {
        return produitComposant.coût_reviens;
    } else {
        // BUY : on utilise le prix estimé du produit (son tarif marché)
        const tarif = usine.tarifs.find(t => t.nom === étape.nom);
        return tarif?.montant;
    }
}
