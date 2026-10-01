/**
 * Fonctions pures de filtrage et de tri du stock.
 * Extraites de stock.html pour permettre les tests unitaires.
 */

/**
 * Filtre une liste d'articles par correspondance partielle et insensible à la casse sur le nom.
 * @param {{nom: string, quantité: number}[]} articles Liste des articles à filtrer
 * @param {string} recherche Texte de recherche (chaîne vide = tous les articles)
 * @returns {{nom: string, quantité: number}[]} Articles dont le nom contient la recherche
 */
function filtrerStock(articles, recherche) {
    const terme = recherche.toLowerCase();
    if (!terme) return articles;
    return articles.filter(a => a.nom.toLowerCase().includes(terme));
}

/**
 * Trie une liste d'articles par colonne et direction.
 * Ne modifie pas le tableau d'origine.
 * @param {{nom: string, quantité: number}[]} articles Liste des articles à trier
 * @param {"nom"|"quantité"} colonne Colonne de tri
 * @param {"asc"|"desc"} direction Direction de tri
 * @returns {{nom: string, quantité: number}[]} Nouveau tableau trié
 */
function trierStock(articles, colonne, direction) {
    return [...articles].sort((a, b) => {
        let valA, valB;
        if (colonne === "nom") {
            valA = a.nom.toLowerCase();
            valB = b.nom.toLowerCase();
        } else {
            valA = a.quantité;
            valB = b.quantité;
        }
        if (valA < valB) return direction === "asc" ? -1 : 1;
        if (valA > valB) return direction === "asc" ? 1 : -1;
        return 0;
    });
}

export { filtrerStock, trierStock };
