// Un catalogue ...
class Catalogue {
  /** stockage internes des fiches du catalogue
   * @type {Map.<string,{nom:string}>}
   */
  _fiches = new Map();
  /** @type {{nom:string}[]} Liste complète des fiches du catalogue. */
  get fiches() { return [...this._fiches.values()]; }
  /** @type {string[]} index de tous les noms de fiche inscrite au catalogue. */
  get index() { return [...this._fiches.keys()]; }
  /** Recherche d'une fiche par son nom (correspondance exacte)
   * @param {string} entrée nom de la fiche à rechercher. 
   * @returns {{nom:string}|undefined} la fiche portant le nom demandée... si elle existe !
   */
  rechercher(entrée) { return Object.freeze(this._fiches.get(entrée)); }
  /** Inscription d'une fiche au catalogue.
   * Contrôle de l'unicité d'une fiche (par rapport à son nom) au sein du catalogue.
   * @param {{nom:string}} entrée Fiche à entrer au catalogue
   * @returns {void} pas de retour en cas de réussite. Exception en cas d'échec.
   */
  inscrire(entrée) {
    if (!entrée?.nom)
      throw new Error("Entrée à inscrire obligatoire");
    if (this._fiches.has(entrée.nom))
      throw new Error(`Une entrée portant le même nom existe déjà : ${entrée.nom}`);
    this._fiches.set(entrée.nom, entrée);
  }
  /** Retrait d'une fiche du catalogue (principalement dans le but de la mettre à jour ?)
   * @param {string} entrée nom de la fiche à retirer.
   * @returns {{nom:string}|undefined} la fiche retirée si elle existe
   */
  retirer(entrée) {
    if (!entrée)
      throw new Error("Entrée à retirer obligatoire");
    let entrée_retirée = this._fiches.get(entrée);
    if (entrée_retirée) {
      this._fiches.delete(entrée);
      return entrée_retirée;
    }
  }
}

// Objet immutable représentant le tarif d'un objet.
class Tarif {
  /** @type {string} Stockage interne du nom */
  _nom;
  /** @type {string} Nom de l'objet évalué. */
  get nom() { return this._nom; };
  /** @type {number} Stockage interne du prix */
  _prix;
  /** @type {number} Prix de l'objet évalué */
  get prix() { return this._prix; };
  /** @type {Date} Sockage interne de la date d'effet */
  _date_effet;
  /** @type {Date} Date de l'évaluation. */
  get date_effet() { return new Date(this._date_effet); };
  /** 
   * @param {string} nom Nom de l'objet évalué.
   * @param {number} prix Prix de l'objet évalué.
   * @param {Date} date_effet Date de l'évaluation (date du jour par défaut).
   */
  constructor(nom, prix, date_effet = new Date()) {
    if (!nom || nom.trim().length === 0)
      throw new Error("Nom de l'objet obligatoire.")
    if (isNaN(prix) || prix < 0)
      throw new Error(`Valeur positive attendue. valeur fournie : prix=${prix}`)
    this._nom = nom;
    this._prix = prix;
    // Stockage d'une copie de la date pour immutabilité
    this._date_effet = new Date(date_effet); // date_effet; //
  }

  /** Formatage de l'objet sous forme de chaîne de caractère compréhensible. */
  toString() {
    return `{"nom":"${this._nom}","prix":"${this._prix}","date_effet":"${this._date_effet.toLocaleDateString()}"}`
  }
}

class Tarification {
  _tarifs = new Map();
  /** @type {Tarif[]} */
  get tarifs() { return [...this._tarifs.values()]; }
  /** 
   * Mettre à jour le tarif d'un objet
   * @return {void} Pas de retour en cas de réussite. Exception en cas d'échec.
   * @param {string} objet nom de l'objet évalué
   * @param {number} prix nouveau prix de l'objet
   * @param {Date} date date de l'évaluation
   */
  mise_a_jour(objet, prix, date = new Date()) {
    if (!objet || objet.trim().length === 0)
      throw new Error(`Objet à mettre à jour obligatoire. Fournis : objet=${objet}`);
    let tarif = this._tarifs.get(objet)
    if (tarif && tarif.date_effet > date)
      throw new Error(`Un tarif plus recent existe déjà. Date de tarif existant : ${tarif.date_effet.toLocaleDateString()}, date de mise à jour souhaitée : ${date.toLocaleDateString()}`);
    this._tarifs.set(objet, new Tarif(objet, prix, date));
  }

  /**
   * @return {Tarif}
   * @param {string} objet nom de l'objet pour lequel on souhaite obtenir un tarif
   */
  tarif(objet) {
    return this._tarifs.get(objet);
  }
}

// Recette de fabrication d'un objet.
class Recette {
  /** @type {string} Stockage interne du nom de la recette */
  _nom;
  /** @type {string} nom de recette, doit correspondre au nom de l'objet fabriqué. */
  get nom() { return this._nom; }
  /** @type {number} stockage interne des frais de fabrication. */
  _frais;
  /** @type {number} frais de fabrication, hors prix des ingrédients */
  get frais() { return this._frais; }
  /** @type {Map.<string,number>} stockage interne des ingrédients nécessaires (quantités par nom). */
  _ingrédients = new Map();
  /** @type {[nom:string,quantité:number][]} Liste immutable des ingrédients de la recette. */
  get ingrédients() { return new Map(this._ingrédients); }
  /** @type {number} Quantité d'objets produits par un un cycle de fabrication. */
  _quantité_produite;
  get quantité_produite() { return this._quantité_produite; }
  /** @type {number} Pourcentage de chance de succès. ]0,1] */
  _chance_succès;
  get chance_succès() { return this._chance_succès; }

  /** 
   * Création d'une recette cohérente (validité des inputs + dédoublonnage des ingrédients)
   * @param {string} nom nom de la recette (doit correspondre au nom de l'objet créé).
   * @param {number} frais frais de fabrication, hors prix des ingrédients.
   * @param {{nom:string,quantité:number}[]} ingrédients Liste des ingrédients nécessaire pour la fabrication.
   * @param {number} [quantité_produite=1] Quantité d'objets produits par un un cycle de fabrication.
   */
  constructor(nom, frais, ingrédients, quantité_produite = 1, chance_succès = 1) {
    if (!frais || frais < 0 || !Number.isInteger(frais))
      throw new Error(`Nombre entier positif attendu. fournis : frais=${frais}`);
    if (!nom || nom.trim().length === 0)
      throw new Error(`Nom de recette obligatoire`);
    if (!ingrédients || ingrédients.length === 0)
      throw new Error(`Au moins un ingrédient attendu pour former une recette`);
    if (!quantité_produite || quantité_produite <= 0 || !Number.isInteger(quantité_produite))
      throw new Error(`Quantité produite devrait être un entier positif. Valeur fournie quantité_produite=${quantité_produite}`);
    if (!chance_succès || chance_succès <= 0 || chance_succès > 1)
      throw new Error(`Les chances de succès devraient être comprises entre ]0,1]. Valeur fournie quantité_produite=${chance_succès}`);
    this._nom = nom;
    this._frais = frais;
    this._quantité_produite = quantité_produite;
    this._chance_succès = chance_succès;
    for (const ingrédient of ingrédients) {
      this._ingrédients.set(ingrédient.nom,
        (this._ingrédients.get(ingrédient.nom) ?? 0) + ingrédient.quantité)
    }
  }
}

// Gestion de stock
class Inventaire {
  // nombre d'objets, classé par nom
  _objets = new Map();
  get stock() { return [...this._objets.entries()]; }

  getStock(objet) {
    return this._objets.get(objet) ?? 0;
  }

  // ajoute une quantité d'objets au stock. renvoi la quantité totale d'objets de ce type en stock après ajout.
  ajoute(objet, quantité) {
    if (!quantité || quantité < 0 || (quantité % 0) !== quantité)
      throw new Error(`Nombre entier positif attendu. fournis : quantité=${quantité}`)
    let nouveau_stock = this.getStock(objet) + quantité;
    this._objets.set(objet, nouveau_stock);
    return nouveau_stock;
  }

  // retirer un objet du stock
  retire(objet, quantité) {
    let stock = this.getStock(objet);
    if (stock < quantité) {
      throw new Error(`Impossible de retirer ${quantité} ${objet}. Seuls ${stock} disponibles`)
    }
    let nouveau_stock = stock - quantité;
    this._objets.set(objet, nouveau_stock);
    return nouveau_stock;
  }
}

// représentation la partie opérationnelle associée à une recette
class Produit {
  _nom;
  get nom() { return this._nom; }
  _rentabilité;
  get rentabilité() { return this._rentabilité };
  _prix_estimé;
  _coût_reviens;
  get coût_reviens() { return this._coût_reviens };
  _statut;
  get statut() { return this._statut; }
  _date_effet = new Date();
  // Obtention d'une nouvelle version de la date d'effet (garantie l'immutabilité du produit)
  get date_effet() { return new Date(this._date_effet); };
  _updateDateEffet(date) { this._date_effet = (date < this._date_effet) ? new Date(date) : this._date_effet; }
  _commentaire = '';
  get commentaire() { return this._commentaire; }

  // Initialisation d'un produit à partir du livre de recette et du catalogue de produits de l'usine.
  constructor(nom, livre_recettes, catalogue_produits, marché) {
    this._statut = "INIT";

    if (!nom?.trim())
      throw new Error(`Nom de produit obligatoire`);
    this._nom = nom;
    this._prix_estimé = marché.tarif(nom)?.prix;

    // Vérifier l'absence de produit déjà au catalogue portant le même nom.
    if (catalogue_produits.rechercher(nom))
      throw new Error(`Produit ${nom} déjà inscrit au catalogue, création impossible.`);

    // Trouver la recette correspondant au produit
    const recette = livre_recettes.rechercher(nom);
    if (!recette)
      throw new Error(`Recette introuvable pour la fabrication du produit ${nom}`);

    // Pour chaque ingrédient de la recette, trouver le prix des objets au marché et vérifier la présence d'un produit
    this._coût_reviens = recette.frais;
    for (const [ingrédient, quantité] of recette.ingrédients) {

      // Récupération du tarif de l'ingrédient au marché s'il existe
      let prix_ingrédient;
      let tarif_ingrédient = marché.tarif(ingrédient);
      if (tarif_ingrédient) {
        prix_ingrédient = tarif_ingrédient.prix;
        this._updateDateEffet(tarif_ingrédient.date_effet);
      }

      // Récupération du coût de reviens au catalogue si le produit existe
      let ingrédient_produit = catalogue_produits.rechercher(ingrédient);
      if (ingrédient_produit?.coût_reviens && prix_ingrédient > ingrédient_produit.coût_reviens) {
        prix_ingrédient = ingrédient_produit.coût_reviens;
        this._updateDateEffet(ingrédient_produit.date_effet);
      }
      if (prix_ingrédient && this._coût_reviens) {
        this._coût_reviens += prix_ingrédient * quantité;
      } else { // coût incalculable tarif manquant sur l'ingrédient en cours ou un précédent
        this._coût_reviens = undefined;
      }
    }

    // a la fin du process de calcul du coût de reviens, mise à jour du statut + calcul des indicateurs
    if (!this._prix_estimé) this._commentaire = `Rentabilité incalculable : prix estimé inconnu`
    else if (!this._coût_reviens) this._commentaire = `Rentabilité incalculable : coût de reviens inconnu`
    else {
      // Si les données d'entrées sont complète, on bascule en phase industrialisée et on calcule la rentabilité.
      this._statut = "INDUS";
      this._rentabilité = ((this._prix_estimé * recette.quantité_produite) / (this._coût_reviens / recette.chance_succès)) - 1;
      if (this._rentabilité > 0.15) this._commentaire = `Commercialisable`;
      else if (this._rentabilité > 0) this._commentaire = "Pour consommation interne";
      else this._commentaire = "Ne pas produire, il vaut mieux l'acheter";
    }

  }

}

export { Tarification, Recette, Inventaire, Produit, Catalogue, Tarif }
