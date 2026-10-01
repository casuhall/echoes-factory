/**
 * Utilitaires de filtrage et de tri des produits — extrait de produits.html
 * Exigences : 8.7, 8.8
 */

/**
 * Filtre une liste de produits par correspondance partielle insensible à la casse sur le nom.
 *
 * @param {Array<{nom: string}>} produits  - liste complète des produits
 * @param {string} recherche              - saisie de l'utilisateur (peut contenir des espaces)
 * @returns {Array} produits dont le nom contient la recherche (après trim + lowercase)
 */
export function filtrerProduits(produits, recherche) {
    const filtre = (recherche ?? '').trim().toLowerCase();
    if (filtre === '') return produits;
    return produits.filter(p => p.nom.toLowerCase().includes(filtre));
}

/**
 * Trie une liste de produits selon une colonne et une direction données.
 * Ne modifie pas le tableau d'origine (retourne une copie).
 *
 * @param {Array} produits   - liste de produits à trier
 * @param {string|null} colonne    - 'nom' | 'rentabilité' | 'gain' | null (pas de tri)
 * @param {'asc'|'desc'} direction - ordre de tri
 * @returns {Array} nouvelle liste triée
 */
export function trierProduits(produits, colonne, direction) {
    if (colonne === null || colonne === undefined) return [...produits];

    const extracteurs = {
        nom:          { valeur: p => p.nom,          naLast: false },
        rentabilité:  { valeur: p => p.rentabilité,  naLast: true  },
        gain:         { valeur: p => (p.prix_estimé ?? 0) - (p.coût_reviens ?? 0), naLast: false },
    };

    const config = extracteurs[colonne];
    if (!config) return [...produits];

    return [...produits].sort((a, b) => {
        const va = config.valeur(a);
        const vb = config.valeur(b);

        // Produits NA (valeur undefined) toujours en dernier si naLast est activé
        if (config.naLast) {
            const aNa = va === undefined || va === null;
            const bNa = vb === undefined || vb === null;
            if (aNa && bNa) return 0;
            if (aNa) return 1;   // a est NA → après b
            if (bNa) return -1;  // b est NA → après a
        }

        const vaNorm = va ?? -Infinity;
        const vbNorm = vb ?? -Infinity;
        if (vaNorm < vbNorm) return direction === 'asc' ? -1 : 1;
        if (vaNorm > vbNorm) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}
