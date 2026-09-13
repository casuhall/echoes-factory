
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


class NUMBER_FORMAT {
  static floatFormat = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  static integerFormat = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  static format(value, type = "float") {
    switch (type) {
      case "integer":
        return this.integerFormat.format(value);
      case "float":
        return this.floatFormat.format(value);
      default:
        throw new Error(`Type de formatage non supporté: ${type}`);
    }
  }
}
const UNICODE_DATE_FORMAT = new Intl.DateTimeFormat("fr-FR"); // pour formatage YYYY-MM-DD


export { decodeEchoesListe, NUMBER_FORMAT, UNICODE_DATE_FORMAT }