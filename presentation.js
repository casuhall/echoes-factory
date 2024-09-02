

/** Décode une liste d'objet exportée par le jeu pour en extraire les données associées.
 * @param {string} value Une liste d'objets au format exportée par le jeu
 * @returns {{ index:string, nom:string, quantité:number, valeur:number }[]} la liste d'entrée décodée sous forme d'objet.
 */
function decodeEchoesListe(value) {
  let liste = []
  value.split("\n").forEach(element => {
    let ligne = /^(\d+)\t(.+)\t(\d+)\t(.+)$/.exec(element);
    if (ligne) {
      let [, index, nom, quantité_brut, valeur_brut] = ligne;
      let quantité = Number.parseInt(quantité_brut);
      let valeur = Number.parseFloat(valeur_brut);
      liste.push({ index, nom, quantité, valeur })
    }
  });
  return liste;
}

export { decodeEchoesListe }