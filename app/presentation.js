
/**
 * Décode une liste d'objets exportée par le jeu pour en extraire les données associées.
 * Analyse le format tabulé avec index, nom, quantité et valeur.
 * @param {string} value Une liste d'objets au format exportée par le jeu
 * @returns {{ index:string, nom:string, quantité:number, valeur:number }[]} la liste d'entrée décodée sous forme d'objet.
 * @throws {Error} Si le format ne peut être analysé correctement
 */
function decodeEchoesListe(value) {
  let liste = []
  value.split("\n").forEach(element => {
    let ligne = /^(\d+)\t(.+)\t(\d+)\t(.+)$/.exec(element);
    if (ligne) {
      let [, index, nom, quantité_brut, valeur_brut] = ligne;
      let quantité = Number.parseFloat(quantité_brut);
      let valeur = Number.parseFloat(valeur_brut);
      liste.push({ index, nom, quantité, valeur })
    }
  });
  return liste;
}


export { decodeEchoesListe }