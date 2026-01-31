/**
 * Catalogue de gestion d'une collection d'objets nommés.
 * Assure l'unicité des noms et permet la recherche, l'inscription et le retrait d'entrées.
 */
class Catalogue {
  /** stockage internes des fiches du catalogue
   * @type {Map.<string,{nom:string}>}
   */
  #fiches = new Map();
  /** @type {{nom:string}[]} Liste complète des fiches du catalogue. */
  get fiches() { return [...this.#fiches.values()]; }
  /** @type {string[]} index de tous les noms de fiche inscrite au catalogue. */
  get index() { return [...this.#fiches.keys()]; }
  /** Recherche d'une fiche par son nom (correspondance exacte)
   * @param {string} entrée nom de la fiche à rechercher. 
   * @returns {{nom:string}|undefined} la fiche portant le nom demandée... si elle existe !
   */
  rechercher(entrée) { return Object.freeze(this.#fiches.get(entrée)); }
  /** Inscription d'une fiche au catalogue.
   * Contrôle de l'unicité d'une fiche (par rapport à son nom) au sein du catalogue.
   * @param {{nom:string}} entrée Fiche à entrer au catalogue
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
   * @returns {{nom:string}|undefined} la fiche retirée si elle existe
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
  #prix;
  /** @type {number} Prix de l'objet évalué */
  get prix() { return this.#prix; };
  /** @type {Date} Sockage interne de la date d'effet */
  #date_effet;
  /** @type {Date} Date de l'évaluation. */
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
    if (isNaN(prix) || prix < 0)
      throw new Error(`Valeur positive attendue. valeur fournie : prix=${prix}`)
    this.#nom = nom;
    this.#prix = prix;
    // Stockage d'une copie de la date pour immutabilité
    this.#date_effet = new Date(date_effet); // date_effet; //
  }

  /** Formatage de l'objet sous forme de chaîne de caractère compréhensible. */
  toString() {
    return `{"nom":"${this.#nom}","prix":"${this.#prix}","date_effet":"${this.#date_effet.toLocaleDateString()}"}`
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
    this.#tarifs.set(objet, new Tarif(objet, prix, date));
  }

  /**
   * @return {Tarif} Le tarif de l'objet demandé, ou undefined s'il n'existe pas.
   * @param {string} objet nom de l'objet pour lequel on souhaite obtenir un tarif
   */
  tarif(objet) {
    return this.#tarifs.get(objet);
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
  /** @type {Map.<string,number>} stockage interne des ingrédients nécessaires (quantités par nom). */
  #ingrédients = new Map();
  /** @type {[nom:string,quantité:number][]} Liste immutable des ingrédients de la recette. */
  get ingrédients() { return new Map(this.#ingrédients); }
  /** @type {number} Quantité d'objets produits par un un cycle de fabrication. */
  #quantité_produite;
  get quantité_produite() { return this.#quantité_produite; }
  /** @type {number} Pourcentage de chance de succès. ]0,1] */
  #chance_de_succès;
  get chances_de_succès() { return this.#chance_de_succès; }

  /** 
   * Création d'une recette cohérente (validité des inputs + dédoublonnage des ingrédients)
   * @param {string} nom nom de la recette (doit correspondre au nom de l'objet créé).
   * @param {number} frais frais de fabrication, hors prix des ingrédients.
   * @param {{nom:string,quantité:number}[]} ingrédients Liste des ingrédients nécessaire pour la fabrication.
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
    for (const ingrédient of ingrédients) {
      this.#ingrédients.set(ingrédient.nom,
        (this.#ingrédients.get(ingrédient.nom) ?? 0) + ingrédient.quantité)
    }
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
  getStock(objet) {
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
    if (!quantité || quantité < 0 || (quantité % 0) !== quantité)
      throw new Error(`Nombre entier positif attendu. fournis : quantité=${quantité}`)
    let nouveau_stock = this.getStock(objet) + quantité;
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
    let stock = this.getStock(objet);
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
  /** @type {number} Rentabilité calculée du produit */
  get rentabilité() { return this.#rentabilité };
  #prix_estimé;
  #coût_reviens;
  /** @type {number} Coût de reviens du produit */
  get coût_reviens() { return this.#coût_reviens };
  #statut;
  /** @type {string} Statut du produit (INIT ou INDUS) */
  get statut() { return this.#statut; }
  #date_effet = new Date();
  /** @type {Date} Date de l'évaluation la plus ancienne */
  get date_effet() { return new Date(this.#date_effet); };
  #updateDateEffet(date) { this.#date_effet = (date < this.#date_effet) ? new Date(date) : this.#date_effet; }
  #commentaire = '';
  /** @type {string} Commentaire sur la rentabilité du produit */
  get commentaire() { return this.#commentaire; }

  /**
   * Initialisation d'un produit à partir du livre de recette et du catalogue de produits de l'usine.
   * @param {string} nom Nom du produit (doit correspondre au nom d'une recette)
   * @param {Catalogue} livre_recettes Catalogue des recettes disponibles
   * @param {Catalogue} catalogue_produits Catalogue des produits déjà créés
   * @param {Tarification} marché Tarification du marché
   * @throws {Error} Si le nom est vide, la recette inexistante, ou le produit existe déjà
   */
  constructor(nom, livre_recettes, catalogue_produits, marché) {
    this.#statut = "INIT";

    if (!nom?.trim())
      throw new Error(`Nom de produit obligatoire`);
    this.#nom = nom;
    this.#prix_estimé = marché.tarif(nom)?.prix;

    // Vérifier l'absence de produit déjà au catalogue portant le même nom.
    if (catalogue_produits.rechercher(nom))
      throw new Error(`Produit ${nom} déjà inscrit au catalogue, création impossible.`);

    // Trouver la recette correspondant au produit
    const recette = livre_recettes.rechercher(nom);
    if (!recette)
      throw new Error(`Recette introuvable pour la fabrication du produit ${nom}`);

    // Pour chaque ingrédient de la recette, trouver le prix des objets au marché et vérifier la présence d'un produit
    this.#coût_reviens = recette.frais;
    for (const [ingrédient, quantité] of recette.ingrédients) {

      // Récupération du tarif de l'ingrédient au marché s'il existe
      let prix_ingrédient;
      let tarif_ingrédient = marché.tarif(ingrédient);
      if (tarif_ingrédient) {
        prix_ingrédient = tarif_ingrédient.prix;
        this.#updateDateEffet(tarif_ingrédient.date_effet);
      }

      // Récupération du coût de reviens au catalogue si le produit existe
      let ingrédient_produit = catalogue_produits.rechercher(ingrédient);
      if (ingrédient_produit?.coût_reviens && prix_ingrédient > ingrédient_produit.coût_reviens) {
        prix_ingrédient = ingrédient_produit.coût_reviens;
        this.#updateDateEffet(ingrédient_produit.date_effet);
      }
      if (prix_ingrédient && this.#coût_reviens) {
        this.#coût_reviens += prix_ingrédient * quantité;
      } else { // coût incalculable tarif manquant sur l'ingrédient en cours ou un précédent
        this.#coût_reviens = undefined;
      }
    }

    // a la fin du process de calcul du coût de reviens, mise à jour du statut + calcul des indicateurs
    if (!this.#prix_estimé) this.#commentaire = `Rentabilité incalculable : prix estimé inconnu`
    else if (!this.#coût_reviens) this.#commentaire = `Rentabilité incalculable : coût de reviens inconnu`
    else {
      // Si les données d'entrées sont complète, on bascule en phase industrialisée et on calcule la rentabilité.
      this.#statut = "INDUS";
      this.#rentabilité = ((this.#prix_estimé * recette.quantité_produite) / (this.#coût_reviens / recette.chance_succès)) - 1;
      if (this.#rentabilité > 0.15) this.#commentaire = `Commercialisable`;
      else if (this.#rentabilité > 0) this.#commentaire = "Pour consommation interne";
      else this.#commentaire = "Ne pas produire, il vaut mieux l'acheter";
    }

  }

}


/**
 * Usine de production avec gestion des recettes, tarifs, stock et produits.
 * Coordonne l'étude de marché et le calcul de rentabilité des produits.
 */
class Usine {
  #nom;
  #inventaire = new Inventaire();
  /** @type {[nom:string,quantité:number][]} Stock courant de l'usine */
  get stock() { return this.#inventaire.stock; }
  /** catalogue des recettes connues de l'usine */
  #livre_recettes = new Catalogue();
  /** @type {Recette[]} Ensemble des recettes disponibles */
  get recettes() { return this.#livre_recettes.fiches };
  /** catalogue des objets pouvant être produits dans l'usine */
  #catalogue_produits = new Catalogue();
  /** @type {Produit[]} Ensemble des produits étudiés */
  get produits() { return this.#catalogue_produits.fiches; }
  #marché = new Tarification();
  /** @type {Tarif[]} Ensemble des tarifs du marché */
  get tarifs() { return this.#marché.tarifs; }

  /**
   * Initialisation de l'usine avec ses recettes, tarifs et stock initiaux.
   * @param {string} nom Nom de l'usine
   * @param {Recette[]} [recettes] Liste des recettes à inscrire au livre de recettes
   * @param {Tarif[]} [tarifs] Liste des tarifs initiaux du marché
   * @param {{nom:string,quantité:number}[]} [stock] Stock initial de l'usine
   */
  constructor(nom, recettes, tarifs, stock) {
    this.#nom = nom;
    if (stock) for (const stack of stock) {
      try {
        this.#inventaire.ajoute(stack.nom, stack.quantité);
      } catch (error) {
        console.log(`Stack non inscrite à l'inventaire : ${JSON.stringify(stack)}. Cause : ${error.message}.`);
      }
    }
    if (recettes) for (const recette of recettes) {
      try {
        this.#livre_recettes.inscrire(recette);
      } catch (error) {
        console.log(`Recette non inscrite au livre de recette : ${recette?.nom}. Cause : ${error.message}.`);
      }
    }
    if (tarifs) for (const tarif of tarifs) {
      try {
        this.#marché.mise_a_jour(tarif.nom, tarif.prix, tarif.date_effet);
      } catch (error) {
        console.log(`Tarif non inscrit au marché : ${JSON.stringify(tarif)}. Cause : ${error.message}.`);
      }
    }

    // Initialisation du catalogue correspondant
    this.étudeDeMarché();

  }

  /**
   * Ajoute une recette au livre de recettes et initialise le produit correspondant.
   * @param {Recette} recette Recette à ajouter
   * @throws {Error} Si une recette avec le même nom existe déjà
   */
  ajouteRecette(recette) {
    this.#livre_recettes.inscrire(recette);
    this.#initProduit(recette.nom);
  }

  /**
   * Recherche d'un produit par son nom.
   * @param {string} nom Nom du produit à rechercher
   * @returns {Produit|undefined} Le produit correspondant s'il existe, sinon undefined
   */
  produit(nom) {
    return this.#catalogue_produits.rechercher(nom);
  }

  /**
   * Évalue un objet au marché en mettant à jour son tarif.
   * @param {string} objet Nom de l'objet à évaluer
   * @param {number} prix Nouveau prix de l'objet
   * @param {Date} [date=new Date()] Date de l'évaluation
   * @throws {Error} Si un tarif plus récent existe déjà
   */
  évaluer(objet, prix, date = new Date()) {
    this.#marché.mise_a_jour(objet, Number.parseFloat(prix), new Date(date))
  }

  /**
   * Réinitialise le catalogue des produits en étudiant le marché.
   * Crée les produits en gérant les dépendances entre recettes.
   * @throws {Error} Si les recettes forment une boucle infinie
   */
  étudeDeMarché() {
    if (this.#catalogue_produits?.index?.length)
      console.log(`Réinitialisation du catalogue précédent contenant ${this.#catalogue_produits.index.length} produits`)
    this.#catalogue_produits = new Catalogue();
    // tentative de création de produit pour chaque recette du livre
    let produits_potentiels = this.#livre_recettes.index;
    let fusible = 0;
    while (produits_potentiels.length > 1) {
      produits_potentiels = this.#initProduit(produits_potentiels.shift() ?? '', ...produits_potentiels);
      if (++fusible > 999) {
        throw new Error(`Erreur à l'étude du marché, les recettes formes probablement une boucle infinie : ${produits_potentiels}`);
      }
    }
  }

  /**
   * Initialise un produit et traite ses dépendances de manière récursive.
   * Retarde l'initialisation des produits dont la recette contient d'autres produits potentiels.
   * @param {string} nom_produit Nom du produit à initialiser
   * @param {...string} produits_potentiels Noms des produits restants à traiter
   * @returns {string[]} Liste des produits retardés pour traitement ultérieur
   * @private
   */
  #initProduit(nom_produit, ...produits_potentiels) {
    // constitution d'une liste de produits à recalculé lors d'une itération ultérieur
    let produits_retardés = [];
    let recette = this.#livre_recettes.rechercher(nom_produit);
    if (recette) {
      let ingrédient_produit_potentiel = false;
      for (const [nom_ingrédient] of recette.ingrédients.entries()) {
        ingrédient_produit_potentiel ||= (produits_potentiels.includes(nom_ingrédient));
      }
      if (ingrédient_produit_potentiel)
        // si la recette du produit en cours contient un potentiel autre produit, mettre de côté le produit en cours pour calcul ultérieur
        produits_retardés.push(nom_produit);
      else
        this.#catalogue_produits.inscrire(new Produit(nom_produit, this.#livre_recettes, this.#catalogue_produits, this.#marché));
    }

    if (produits_potentiels.length) // s'il reste des produits potentiels, traitons le suivant !
      produits_retardés.push(...this.#initProduit(produits_potentiels.shift() ?? '', ...produits_potentiels));
    return produits_retardés;
  }

}

export { Tarification, Recette, Inventaire, Produit, Catalogue, Tarif, Usine }
