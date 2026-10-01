/**
 * Fonctions pures de filtrage et de tri des tarifs du marché.
 * Extraites de marché.html pour permettre les tests unitaires.
 */

/**
 * Filtre une liste de tarifs par correspondance partielle et insensible à la casse sur le nom.
 * @param {{nom: string, montant: number, date_effet: Date}[]} tarifs Liste des tarifs à filtrer
 * @param {string} recherche Texte de recherche (chaîne vide = tous les tarifs)
 * @returns {{nom: string, montant: number, date_effet: Date}[]} Tarifs dont le nom contient la recherche
 */
function filtrerTarifs(tarifs, recherche) {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return tarifs;
    return tarifs.filter(t => t.nom.toLowerCase().includes(terme));
}

/**
 * Trie une liste de tarifs par colonne et direction.
 * Ne modifie pas le tableau d'origine.
 * @param {{nom: string, montant: number, date_effet: Date}[]} tarifs Liste des tarifs à trier
 * @param {"nom"|"prix"|"date"} colonne Colonne de tri
 * @param {"asc"|"desc"} direction Direction de tri
 * @returns {{nom: string, montant: number, date_effet: Date}[]} Nouveau tableau trié
 */
function trierTarifs(tarifs, colonne, direction) {
    return [...tarifs].sort((a, b) => {
        let cmp;
        if (colonne === "nom") {
            cmp = a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });
        } else if (colonne === "prix") {
            cmp = a.montant - b.montant;
        } else { // date
            cmp = a.date_effet - b.date_effet;
        }
        return direction === "asc" ? cmp : -cmp;
    });
}

export { filtrerTarifs, trierTarifs };
