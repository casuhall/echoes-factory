
/**
 * Catalogue de gestion d'une collection d'objets nommés.
 * Assure l'unicité des noms et permet la recherche, l'inscription et le retrait d'entrées.
 */
class Catalogue {
  /** stockage internes des fiches du catalogue
   * @type {Map.<string,Produit>}
   */
  #fiches = new Map();
  /** @type {Produit[]} Liste complète des fiches du catalogue. */
  get fiches() { return [...this.#fiches.values()]; }
  /** @type {string[]} index de tous les noms de fiche inscrite au catalogue. */
  get index() { return [...this.#fiches.keys()]; }
  /** Recherche d'une fiche par son nom (correspondance exacte)
   * @param {string} entrée nom de la fiche à rechercher. 
   * @returns {Produit|undefined} la fiche portant le nom demandée... si elle existe !
   */
  rechercher(entrée) { return Object.freeze(this.#fiches.get(entrée)); }
  /** Inscription d'une fiche au catalogue.
   * Contrôle de l'unicité d'une fiche (par rapport à son nom) au sein du catalogue.
   * @param {Produit} entrée Fiche à entrer au catalogue
   * @returns {void} pas de retour en cas de réussite. Exception en cas d'échec.
   */
  inscrire(entrée) {
    if (!entrée?.nom)
      throw new Error("Entrée à inscrire obligatoire");
    if (this.#fiches.has(entrée.nom))
      throw new Error(`Une entrée portant le même nom existe déjà : ${entrée.nom}`);
    this.#fiches.set(entrée.nom, entrée);
  }
  /** Retrait d'une fiche du catalogue (principalement dans le but de la mettre à jour ?)
   * @param {string} entrée nom de la fiche à retirer.
   * @returns {Produit|undefined} la fiche retirée si elle existe
   */
  retirer(entrée) {
    if (!entrée)
      throw new Error("Entrée à retirer obligatoire");
    let entrée_retirée = this.#fiches.get(entrée);
    if (entrée_retirée) {
      this.#fiches.delete(entrée);
      return entrée_retirée;
    }
  }
}

/**
 * Représente le tarif d'un objet sous forme immutable.
 * Encapsule le nom, le prix et la date d'effet d'une évaluation tarifaire.
 */
class Tarif {
  /** @type {string} Stockage interne du nom */
  #nom;
  /** @type {string} Nom de l'objet évalué. */
  get nom() { return this.#nom; };

  /** @type {number} Stockage interne du prix */
  #montant;
  /** @type {number} Prix de l'objet évalué */
  get montant() { return this.#montant; };

  /** @type {Date} Sockage interne de la date d'effet */
  #date_effet;
  /** @type {Date} Date de l'évaluation. réplicat pour maintenir l'immutabilité du tarif */
  get date_effet() { return new Date(this.#date_effet); };

  /** 
   * @param {string} nom Nom de l'objet évalué.
   * @param {number} prix Prix de l'objet évalué.
   * @param {Date} date_effet Date de l'évaluation (date du jour par défaut).
   * @throws {Error} Si le nom est vide ou le prix invalide
   */
  constructor(nom, prix, date_effet = new Date()) {
    if (!nom || nom.trim().length === 0)
      throw new Error("Nom de l'objet obligatoire.")
    if (isNaN(prix) || prix <= 0)
      throw new Error(`Valeur positive attendue. valeur fournie : prix=${prix}`)
    this.#nom = nom;
    this.#montant = prix;
    // Stockage d'une copie de la date pour immutabilité
    this.#date_effet = new Date(date_effet); // date_effet; //
  }

  /** Formatage de l'objet sous forme de chaîne de caractère compréhensible. */
  toString() {
    return `{"nom":"${this.#nom}","montant":"${this.#montant}","date_effet":"${this.#date_effet.toLocaleDateString()}"}`
  }
}

/**
 * Gestion des tarifications d'objets avec contrôle de cohérence temporelle.
 * Permet la mise à jour des tarifs avec vérification qu'aucun tarif plus récent n'existe.
 */
class Tarification {
  #tarifs = new Map();
  /** @type {Tarif[]} Liste des tarifs actuels */
  get tarifs() { return [...this.#tarifs.values()]; }
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
    let tarif = this.#tarifs.get(objet)
    if (tarif && tarif.date_effet > date)
      throw new Error(`Un tarif plus recent existe déjà. Date de tarif existant : ${tarif.date_effet.toLocaleDateString()}, date de mise à jour souhaitée : ${date.toLocaleDateString()}`);
    let nouveau_tarif = new Tarif(objet, prix, date);
    this.#tarifs.set(objet, nouveau_tarif);
    return nouveau_tarif;
  }

  /**
   * @return {Tarif} Le tarif de l'objet demandé, ou undefined s'il n'existe pas.
   * @param {string} objet nom de l'objet pour lequel on souhaite obtenir un tarif
   */
  tarif(objet) {
    return this.#tarifs.get(objet);
  }
}

/** Définition d'un ingrédient utilisé pour une recette.
 * @typedef {Object} Ingrédient
 * @property {string} nom Nom de l'ingrédient
 * @property {number} quantité Quantité nécessaire de l'ingrédient 
 * @property {Produit} [produit] Produit correspondant à l'ingrédient (optionnel)
 * @property {number} [prix] Prix des ingrédients (calculé sur la quantité nécessaire et l'éventuel coût de production du produit correspondant)
 */
class Ingrédient {
  /** @type {string} Stockage interne du nom de l'ingrédient */
  #nom;
  /** @type {string} Nom de l'ingrédient */
  get nom() { return this.#nom; }

  /** @type {number} Stockage interne de la quantité */
  #quantité;
  /** @type {number} Quantité nécessaire de l'ingrédient */
  get quantité() { return this.#quantité; }

  /** @type {Produit} Stockage interne du produit correspondant */
  #produit;
  /** @type {Produit} Produit correspondant à l'ingrédient (optionnel) */
  get produit() { return this.#produit; }
  /** @type {Produit} produit Produit correspondant à l'ingrédient (optionnel) */
  set produit(produit) {
    if (produit && (!(produit instanceof Produit) || produit.nom !== this.#nom))
      throw new Error(`Produit non cohérent avec l'ingrédient '${this.#nom}'. Produit fourni : ${produit?.toString()}`);
    this.#produit = produit;
  }

  /** @type {Tarif} Stockage interne du tarif unitaire estimé */
  #estimé_unitaire;
  /** @param {Tarif} tarif Tarif unitaire estimé de l'ingrédient */
  set estimé_unitaire(tarif) {
    if (tarif && (!(tarif instanceof Tarif) || tarif.nom !== this.#nom))
      throw new Error(`Tarif non cohérent avec l'ingrédient '${this.#nom}'. Tarif fourni : ${tarif?.toString()}`);
    this.#estimé_unitaire = tarif;
  }
  /** @type {number} Prix des ingrédients (calculé sur la quantité nécessaire et l'éventuel coût de production du produit correspondant) */
  get prix() {
    let prix_unitaire = this.#estimé_unitaire?.montant ?? undefined;
    if (this.#produit?.statut === 'BUILD') {
      prix_unitaire = this.#produit.coût_reviens;
    }
    return prix_unitaire * this.#quantité;
  };

  toString() {
    return `{"nom":"${this.#nom}","quantité":${this.#quantité}}`;
  }

  /**
   * Création d'un ingrédient cohérent.
   * @param {string} nom Nom de l'ingrédient
   * @param {number} quantité Quantité nécessaire de l'ingrédient
   * @param {Tarif} [tarif_unitaire] Tarif unitaire de l'ingrédient (optionnel)
   * @param {Produit} [produit] Produit correspondant à l'ingrédient (optionnel)
   * @throws {Error} Si les inputs sont incohérents.
   */
  constructor(nom, quantité, tarif_unitaire = undefined, produit = undefined) {
    if (!nom || nom.trim().length === 0)
      throw new Error(`Nom d'ingrédient obligatoire`);
    if (!quantité || quantité <= 0 || !Number.isInteger(quantité))
      throw new Error(`Quantité devrait être un entier positif. Valeur fournie quantité=${quantité}`);
    this.#nom = nom;
    this.#quantité = quantité;
    if (tarif_unitaire) {
      if (!(tarif_unitaire instanceof Tarif) || tarif_unitaire.nom !== nom)
        throw new Error(`Un tarif unitaire valide et cohérent devrait être fourni pour l'ingrédeint ${nom}. Valeur fournie tarif_unitaire=${tarif_unitaire}`);
      this.#estimé_unitaire = tarif_unitaire;
    }
    if (produit) this.produit = produit;
  }
}

/**
 * Recette de fabrication d'un objet.
 * Définit les ingrédients nécessaires, les frais de fabrication, la quantité produite et la chance de succès.
 */
class Recette {
  /** @type {string} Stockage interne du nom de la recette */
  #nom;
  /** @type {string} nom de recette, doit correspondre au nom de l'objet fabriqué. */
  get nom() { return this.#nom; }
  /** @type {number} stockage interne des frais de fabrication. */
  #frais;
  /** @type {number} frais de fabrication, hors prix des ingrédients */
  get frais() { return this.#frais; }
  /** @type {Ingrédient[]} stockage interne des ingrédients nécessaires. */
  #ingrédients = [];
  /** @type {Ingrédient[]} Liste immutable des ingrédients de la recette. */
  get ingrédients() { return [...this.#ingrédients]; }
  #quantité_produite;
  /** @type {number} Quantité d'objets produits par un un cycle de fabrication. */
  get quantité_produite() { return this.#quantité_produite; }
  #chance_de_succès;
  /** @type {number} Pourcentage de chance de succès. ]0,1] */
  get chances_de_succès() { return this.#chance_de_succès; }

  /** 
   * Création d'une recette cohérente.
   * @param {string} nom nom de la recette (doit correspondre au nom de l'objet créé).
   * @param {number} frais frais de fabrication, hors prix des ingrédients.
   * @param {Ingrédient[]} ingrédients Liste des ingrédients nécessaire pour la fabrication.
   * @param {number} [quantité_produite=1] Quantité d'objets produits par un un cycle de fabrication.
   * @throws {Error} Si les inputs sont incohérents.
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
    this.#nom = nom;
    this.#frais = frais;
    this.#quantité_produite = quantité_produite;
    this.#chance_de_succès = chance_succès;
    let synthyse_ingrédient = [];
    for (const ingrédient of ingrédients) {
      if (!ingrédient || !(ingrédient instanceof Ingrédient))
        throw new Error(`Ingrédient non cohérent. Fournis : ${JSON.stringify(ingrédient)}`);
      if (synthyse_ingrédient.includes(ingrédient.nom))
        throw new Error(`Ingrédient dupliqué dans la recette : ${ingrédient.nom}`);
      synthyse_ingrédient.push(ingrédient.nom);
      this.#ingrédients.push(ingrédient);
    }
  }

  toString() {
    return `{"nom":"${this.#nom}","frais":${this.#frais},"quantité_produite":${this.#quantité_produite},"chance_succès":${this.#chance_de_succès},"ingrédients":[${this.#ingrédients.map(ingrédient => ingrédient.toString()).join(",")}]}`;
  }
}

/**
 * Gestion du stock d'objets.
 * Permet l'ajout et le retrait d'objets avec contrôle des quantités disponibles.
 */
class Inventaire {
  // nombre d'objets, classé par nom
  #objets = new Map();
  /** @type {[nom:string,quantité:number][]} Stock courant avec les noms et quantités des objets */
  get stock() { return [...this.#objets.entries()]; }

  /**
   * Récupère la quantité en stock d'un objet donné.
   * @param {string} objet Nom de l'objet à vérifier
   * @returns {number} Quantité en stock (0 si absent)
   */
  quantité_en_stock(objet) {
    return this.#objets.get(objet) ?? 0;
  }

  /**
   * Ajoute une quantité d'objets au stock.
   * @param {string} objet Nom de l'objet à ajouter
   * @param {number} quantité Quantité positive à ajouter
   * @returns {number} Quantité totale en stock après ajout
   * @throws {Error} Si la quantité n'est pas un entier positif
   */
  ajoute(objet, quantité) {
    if (!quantité || quantité < 0 || Number.isInteger(quantité) === false)
      throw new Error(`Nombre entier positif attendu. fournis : quantité=${quantité}`)
    let nouveau_stock = this.quantité_en_stock(objet) + quantité;
    this.#objets.set(objet, nouveau_stock);
    return nouveau_stock;
  }

  /**
   * Retire une quantité d'objets du stock.
   * @param {string} objet Nom de l'objet à retirer
   * @param {number} quantité Quantité à retirer
   * @returns {number} Quantité restante en stock après retrait
   * @throws {Error} Si la quantité demandée dépasse le stock disponible
   */
  retire(objet, quantité) {
    if (!quantité || quantité < 0 || Number.isInteger(quantité) === false)
      throw new Error(`Nombre entier positif attendu. fournis : quantité=${quantité}`)
    let stock = this.quantité_en_stock(objet);
    if (stock < quantité) {
      throw new Error(`Impossible de retirer ${quantité} ${objet}. Seuls ${stock} disponibles`)
    }
    let nouveau_stock = stock - quantité;
    this.#objets.set(objet, nouveau_stock);
    return nouveau_stock;
  }
}

/**
 * Représentation opérationnelle d'une recette.
 * Encapsule le calcul du coût de reviens, de la rentabilité et du statut d'un produit.
 */
class Produit {
  #nom;
  /** @type {string} Nom du produit */
  get nom() { return this.#nom; }

  #rentabilité;
  /** @type {number} Rentabilité calculée du produit ]-1,1[ (arrondi à deux chiffres après la virgule) */
  get rentabilité() { return (this.#rentabilité === 0 || this.#rentabilité) ? Math.round(this.#rentabilité * 100) / 100 : undefined };

  /** @type {number} */
  #prix_estimé;
  /** @type {number} Prix estimé du produit */
  get prix_estimé() { return this.#prix_estimé };
  #coût_reviens;
  /** @type {number} Coût de reviens du produit */
  get coût_reviens() { return this.#coût_reviens };

  #recette;
  /** @type {Recette} Recette du produit */
  get recette() { return this.#recette };

  #statut;
  /** @type {string} Statut du produit (NA/BUY/BUILD) */
  get statut() { return this.#statut; }

  #date_effet = new Date();
  /** @type {Date} Date de l'évaluation la plus ancienne */
  get date_effet() { return new Date(this.#date_effet); };
  #updateDateEffet(date) { this.#date_effet = (date < this.#date_effet) ? new Date(date) : this.#date_effet; }

  #commentaire = '';
  /** @type {string} Commentaire sur la rentabilité du produit */
  get commentaire() { return this.#commentaire; }

  /**
   * Initialisation d'un produit à partir de sa recette.
   * @param {Recette} recette Recette du produit à initialiser
   * @param {Tarif} [tarif] Tarif du produit
   * @throws {Error} Si la recette est invalide, ou le produit existe déjà
   */
  constructor(recette, tarif = undefined) {
    this.#statut = "NA";
    if (!(recette instanceof Recette))
      throw new Error(`Recette invalide : ${recette}`);
    this.#recette = recette;
    this.#nom = recette.nom;
    this.évaluer(tarif);
  }

  /** 
   * Réévalue les indicateurs du produit à partir d'un nouveau tarif
   * @param {Tarif} tarif 
   */
  évaluer(tarif) {
    if (tarif && !(tarif instanceof Tarif))
      throw new Error(`Tarif invalide : ${tarif}`);
    if (tarif?.nom === this.#nom) {
      this.#prix_estimé = tarif?.montant;
      this.#date_effet = tarif?.date_effet;
    } else {
      // mise à jour des ingrédients
      let ingrédient_impacté = this.#recette.ingrédients.find(ingrédient => ingrédient.nom === tarif?.nom);
      if (ingrédient_impacté) {
        ingrédient_impacté.estimé_unitaire = tarif;
      }
    }

    this.#coût_reviens = this.#recette.frais;
    for (const ingrédient of this.#recette.ingrédients) {
      let prix_ingrédient = ingrédient.prix
      if (prix_ingrédient && this.#coût_reviens) {
        this.#coût_reviens += prix_ingrédient;
      } else { // coût incalculable tarif manquant sur l'ingrédient en cours ou un précédent
        this.#coût_reviens = undefined;
      }
    }
    // Calcul des indicateurs de rentabilité
    if (!this.#prix_estimé) this.#commentaire = `Rentabilité incalculable : prix estimé inconnu.`
    else if (!this.#coût_reviens) this.#commentaire = `Rentabilité incalculable : coût de reviens inconnu.`
    else {
      // Si les données d'entrées sont complète, on bascule en phase industrialisée et on calcule la rentabilité.
      this.#rentabilité = ((this.#prix_estimé * this.#recette.quantité_produite) / (this.#coût_reviens / this.#recette.chances_de_succès)) - 1;
      if (this.#rentabilité > 0.15) {
        this.#statut = "BUILD";
        this.#commentaire = `Commercialisable`;
      } else if (this.#rentabilité > 0) {
        this.#statut = "BUILD";
        this.#commentaire = "Pour consommation interne";
      }
      else {
        this.#statut = "BUY";
        this.#commentaire = "Ne pas produire, il vaut mieux l'acheter";
      }
    }
  }

  toString() {
    return `{"nom":"${this.#nom}","statut":"${this.#statut}","prix_estimé":${this.#prix_estimé},"coût_reviens":${this.#coût_reviens},"rentabilité":${this.#rentabilité},"date_effet":"${this.#date_effet.toLocaleDateString()}","commentaire":"${this.#commentaire}","recette":${this.#recette}}`;
  }
}

export { Tarification, Recette, Inventaire, Produit, Catalogue, Tarif, Ingrédient };
