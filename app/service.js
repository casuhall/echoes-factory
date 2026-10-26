import { Catalogue, Tarification, Inventaire, Produit, Recette, Tarif, Ingrédient } from './domain.js';
import { ÉtapePlan, PlanProduction } from './planification.js';

/**
 * Usine de production avec gestion des recettes, tarifs, stock et produits.
 * Coordonne l'étude de marché et le calcul de rentabilité des produits.
 */
class Usine {
    #nom;
    /** @type {string} Nom de l'usine */
    get nom() { return this.#nom; }
    set nom(nom) {
        if (!nom)
            throw Error("Nom d'usine Obligatoire");
        this.#nom = nom
    }
    #gestionnaire_evenements;
    /** @type {Inventaire} Inventaire de l'usine */
    #inventaire = new Inventaire();
    /** @type {{nom:string,quantité:number}[]} Stock courant de l'usine */
    get stock() { return this.#inventaire.stock; }
    /** @type {{nom:string,quantité:number}[]} Stock disponible (non réservé) de l'usine */
    get stock_disponible() { return this.#inventaire.stock_disponible; }
    /** @type {Number} Liquidités disponibles. */
    #liquidités = 0;
    /** @type {Number} Liquidités disponibles. */
    get liquidités() { return this.#liquidités; }
    set liquidités(montant) {
        let _montant = Number.parseFloat(montant);
        if (Number.isNaN(_montant) || !Number.isInteger(_montant) || _montant < 0)
            throw new Error(`Le montant doit être un entier positif. Montant reçu : ${montant}`);
        this.#liquidités = _montant;
    }
    /** catalogue des objets pouvant être produits dans l'usine */
    #catalogue_produits = new Catalogue();
    /** @type {Produit[]} Ensemble des produits étudiés */
    get produits() { return this.#catalogue_produits.fiches; }
    /** @type {Recette[]} Ensemble des recettes connues de l'usine. */
    get recettes() { return this.produits.map(produit => produit.recette); }
    #marché = new Tarification();
    /** @type {Tarif[]} Ensemble des tarifs du marché */
    get tarifs() { return this.#marché.tarifs; }

    /**
     * Initialisation de l'usine avec ses recettes, tarifs et stock initiaux.
     * @param {string} nom Nom de l'usine
     * @param {Recette[]} [recettes] Liste des recettes à inscrire au livre de recettes
     * @param {Tarif[]} [tarifs] Liste des tarifs initiaux du marché
     * @param {{nom:string,quantité:number}[]} [stock] Stock initial de l'usine
     * @param {Number} [liquidités] Liquidités initiales de l'usine
     */
    constructor(nom, gestionnaire_evenements = new GestionnaireEvenements(), recettes = [], tarifs = [], stock = [], liquidités = 0) {
        this.#nom = nom || "Jhon Doe";
        this.#gestionnaire_evenements = gestionnaire_evenements;
        gestionnaire_evenements.consomme("maj_produit", this.maj_ingrédient_produit.bind(this));
        gestionnaire_evenements.consomme("maj_tarif", this.maj_ingrédient_produit.bind(this));
        for (const tarif of tarifs) {
            try {
                this.évaluer(tarif.nom, Number.parseFloat(tarif.montant), tarif.date_effet);
            } catch (error) {
                console.warn(`Tarif non inscrit au marché : ${JSON.stringify(tarif)}. Cause : ${error.message}.`);
            }
        }
        for (const stack of stock) {
            try {
                this.stocker(stack.nom, Number.parseFloat(stack.quantité));
            } catch (error) {
                console.warn(`Stack non inscrite à l'inventaire : ${JSON.stringify(stack)}. Cause : ${error.message}.`);
            }
        }
        for (const recette of recettes) {
            try {
                this.ajouteProduit(recette);
            } catch (error) {
                console.warn(`Recette non inscrite au livre de recette : ${recette?.nom}. Cause : ${error.message}.`);
            }
        }
        try {
            this.liquidités = Number.parseFloat(liquidités);
        } catch (error) {
            console.warn(`Liquidités non initialisées : ${liquidités}. Cause : ${error.message}.`);
        }
    }

    maj_ingrédient_produit(nom_ingrédient) {
        let tarif = this.#marché.tarif(nom_ingrédient);
        let produit = this.produit(nom_ingrédient);
        if (tarif) {
            // Mise a jour du tarif et des indicateus pour le produits lui-même s'il existe
            if (produit) produit.évaluer(tarif);
            // Mise a jour du tarif et des indicateus pour les produits dépendants de cet ingrédient
            this.#catalogue_produits.fiches.filter(produit_impacté => {
                return (produit_impacté.recette.ingrédients.find(ingrédient => {
                    if (ingrédient.nom === nom_ingrédient) {
                        // tout en rechercheant les ingrédients, on en profite pour mettre à jour le produit au cas où il serait novueau
                        ingrédient.produit = produit;
                        return true;
                    }
                    else
                        return false;
                })) !== undefined;
            }).forEach(produit_dépendant => {
                produit_dépendant.évaluer(tarif);
            });
        }
    }

    /**
     * Ajoute une recette au livre de recettes et initialise le produit correspondant.
     * @param {Recette} recette Recette à ajouter
     * @throws {Error} Si une recette avec le même nom existe déjà
     */
    ajouteProduit(recette) {
        if (!recette) throw new Error(`Recette nécessaire pour l'initialisation d'un produit`);
        if (!(recette instanceof Recette)) {
            // Fiabilisation de la recette
            const quantité_produite = Number.parseInt(recette.quantité_produite);
            const chances_de_succès = Number.parseFloat(recette.chances_de_succès);
            recette = new Recette(recette.nom, Number.parseFloat(recette.frais),
                recette.ingrédients?.map(ingrédient => new Ingrédient(ingrédient.nom, Number.parseFloat(ingrédient.quantité))),
                Number.isNaN(quantité_produite) ? undefined : quantité_produite,
                Number.isNaN(chances_de_succès) ? undefined : chances_de_succès);
        }
        if (this.produit(recette.nom)) {
            throw new Error(`Produit ${recette.nom} déjà inscrit au catalogue, création impossible.`);
        }
        // Estimation du prix des ingrédients de la recette + association du produit correspondant s'il existe.
        for (const ingrédient of recette.ingrédients) {
            let tarif_ingrédient = this.#marché.tarif(ingrédient.nom);
            if (tarif_ingrédient) {
                ingrédient.estimé_unitaire = tarif_ingrédient;
            }
            let produit_ingrédient = this.produit(ingrédient.nom)
            if (produit_ingrédient) {
                ingrédient.produit = produit_ingrédient;
            }
        }
        // Création du produit en fonction de la recette et de son prix sur le marché
        let produit = new Produit(recette, this.#marché.tarif(recette.nom));
        this.#catalogue_produits.inscrire(produit);
        this.#gestionnaire_evenements.produit("maj_produit", recette.nom);
    }

    /**
     * Modifie un produit préalablement inscrit au catalogue de l'usine.
     * @param {Recette} recette Recette à ajouter
     * @throws {Error} Si la recette nouvelle recette ne corresponds à aucun produit existant.
     */
    modifieProduit(recette) {
        if (!recette) throw new Error(`Recette nécessaire pour la mise à jour d'un produit`);
        // retrait temporaire du produit au catalogue
        let old_produit = this.#catalogue_produits.retirer(recette.nom);
        if (!old_produit) throw new Error(`La recette ne semble correspondre à aucun produit au catalogue : ${recette}`);
        try {
            this.ajouteProduit(recette);
        } catch (error) { // en cas d'erreur à la création de la nouvelle version du produit
            // Réinscription de l'ancien produit au catalogue
            this.#catalogue_produits.inscrire(old_produit);
            // Propagation de l'erreur initiale
            throw error;
        }
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
        this.#marché.mise_a_jour(objet, Number.parseFloat(prix), new Date(date));
        this.#gestionnaire_evenements.produit("maj_tarif", objet);
    }

    /**
     * Suppression d'un produit du catalogue de l'usine.
     * Ne devrait pas être utilisé en temps normal.
     *
     * @param {string} nomProduit
     */
    supprimeProduit(nomProduit) {
        if (!this.#catalogue_produits.retirer(nomProduit))
            throw new Error("Aucun produit correspondant à supprimer");
        this.#gestionnaire_evenements.produit("maj_produit", nomProduit);
    }

    /** Fonction pour déstocker un nombre d'objet, un objet entièrement, ou tout le stock.
     * @param {string} objet Nom de l'objet à retirer du stock
     * @param {number} quantité Quantité de l'objet à retirer du stock
     * @returns {number|undefined} Nouvelle quantité de l'objet dans le stock après retrait (undefined en cas de réinitialisation totale)
     * @throws {Error} Si la quantité n'est pas un nombre valide ou le nom est vide
     */
    déstocker(objet, quantité) {
        if (!objet) {
            // Si aucun objet n'est précisé, on vide tout le stock
            this.#inventaire = new Inventaire();
        } else {
            let _quantité = (quantité) ? Number.parseFloat(quantité)
                : this.#inventaire.quantité_en_stock(objet);
            return this.#inventaire.retire(objet, _quantité);
        }
    }

    /** Fonction d'ajout d'objets au stock.
     * @param {string} nom Nom de l'objet à ajouter au stock
     * @param {number} quantité Quantité de l'objet à ajouter au stock
     * @returns {number} Nouvelle quantité de l'objet dans le stock après ajout
     * @throws {Error} Si la quantité n'est pas un nombre valide ou le nom est vide
     */
    stocker(nom, quantité) {
        return this.#inventaire.ajoute(nom, Number.parseFloat(quantité));
    }

    toString() {
        return `{"nom": "${this.#nom}", "recettes": [${this.recettes.map(recette => recette.toString()).join(",")}], "stock": [${this.stock.map(stack => `{"nom": "${stack.nom}", "quantité": ${stack.quantité}}`)}], "tarifs": [${this.tarifs.map(tarif => tarif.toString())}], "liquidités": ${this.liquidités}}`;
    }

    static parse(string) {
        try {
            let objet = JSON.parse(string);
            return new Usine(objet.nom, undefined, objet.recettes, objet.tarifs, objet.stock, objet.liquidités);
        } catch (error) {
            console.warn(`Erreur lors de l'interprétation de la représentation de l'usine :
    ${string}`)
            throw error
        }
    }
}

class GestionnaireEvenements {
    #listeners;

    constructor() {
        this.#listeners = {};
    }

    /**
     * Enregistre un écouteur pour un type d'événement donné.
     * @param {string} type Type d'événement à écouter
     * @param {Function} consommateur Fonction de rappel à exécuter lors de l'événement
     */
    consomme(type, consommateur) {
        if (!this.#listeners[type]) this.#listeners[type] = [];
        this.#listeners[type].push(consommateur);
    }

    /**
     * Déclenche un événement de type donné avec des données associées.
     * @param {string} type Type d'événement à déclencher
     * @param {any} données Données associées à l'événement
     */
    produit(type, données) {
        const listeners = this.#listeners[type];
        if (listeners) {
            for (const listener of listeners) {
                listener(données);
            }
        }
    }
}

class Planificateur {
  /**
   * @param {Usine} usine
   */
  constructor(usine) {
    if (!(usine instanceof Usine)) {
      throw new Error(`Usine invalide. Fournis : ${usine}`);
    }
    this.#usine = usine;
  }

  /** @type {Usine} */
  #usine;

  /** @type {Map<string, Produit>} */
  #catalogue() {
    const map = new Map();
    for (const produit of this.#usine.produits) {
      map.set(produit.nom, produit);
    }
    return map;
  }

  /** @type {Map<string, number>} */
  #stock() {
    const map = new Map();
    for (const ligne of this.#usine.stock) {
      map.set(ligne.nom, ligne.quantité);
    }
    return map;
  }

  /** @type {Map<string, number>} */
  #tarifs() {
    const map = new Map();
    for (const tarif of this.#usine.tarifs) {
      map.set(tarif.nom, tarif.montant);
    }
    return map;
  }

  /**
   * Détermine la décision par défaut pour un produit donné.
   * @param {Produit} produit
   * @returns {'BUY'|'BUILD'}
   */
  #décision_par_défaut(produit) {
    if (produit.statut === 'BUY') return 'BUY';
    return 'BUILD';
  }

  /**
   * Construit les étapes récursives pour un produit donné.
   * @param {string} nom_produit
   * @param {number} quantité
   * @param {Map<string, number>} stock
   * @param {Set<string>} visités
   * @param {boolean} racine
   * @param {Map<string, 'BUY'|'BUILD'>} surcharges
   * @returns {ÉtapePlan[]}
   */
  #explorer(nom_produit, quantité, stock, visités = new Set(), racine = false, surcharges = new Map()) {
    if (visités.has(nom_produit)) return [];
    visités.add(nom_produit);

    const catalogue = this.#catalogue();
    const produit = catalogue.get(nom_produit);
    const décision_par_défaut = produit ? this.#décision_par_défaut(produit) : 'BUY';
    const décision = surcharges.has(nom_produit) ? surcharges.get(nom_produit) : décision_par_défaut;
    const quantité_stock = stock.get(nom_produit) ?? 0;
    const quantité_manquante = Math.max(0, quantité - quantité_stock);
    const étapes = [];

    if (produit && décision === 'BUILD' && quantité_manquante > 0) {
      const recette = produit.recette;
      const facteur = quantité_manquante / recette.quantité_produite;
      for (const ingrédient of recette.ingrédients) {
        const sous_nom = ingrédient.nom;
        const sous_quantité = Math.ceil(ingrédient.quantité * facteur);
        const sous_étapes = this.#explorer(sous_nom, sous_quantité, stock, visités, false, surcharges);
        étapes.push(...sous_étapes);
      }
    }

    const surcharge = surcharges.has(nom_produit);
    étapes.push(new ÉtapePlan(nom_produit, quantité, décision, quantité_stock, surcharge));

    if (racine && !produit) return [];

    return étapes;
  }

  /**
   * Calcule le coût total estimé d'un plan à partir d'une liste d'étapes.
   * @param {ÉtapePlan[]} étapes
   * @returns {number}
   */
  #calculer_coût(étapes) {
    const tarifs = this.#tarifs();
    let coût = 0;

    for (const étape of étapes) {
      if (étape.décision === 'BUY') {
        const prix = tarifs.get(étape.nom) ?? 0;
        coût += prix * étape.quantité;
      }
    }

    return Math.round(coût);
  }

  /**
   * Génère un plan de production pour un produit cible.
   * @param {string} produit_cible
   * @param {number} quantité_cible
   * @returns {PlanProduction}
   */
  planifier(produit_cible, quantité_cible) {
    const stock = this.#stock();
    const étapes = this.#explorer(produit_cible, quantité_cible, stock, new Set(), true, new Map());
    const coût_total = this.#calculer_coût(étapes);
    return new PlanProduction(produit_cible, quantité_cible, étapes, coût_total);
  }

  /**
   * Applique une surcharge manuelle sur un plan existant et recalcule les étapes.
   * @param {PlanProduction} plan
   * @param {string} nom_étape
   * @param {'BUY'|'BUILD'} décision
   * @returns {PlanProduction}
   */
  surcharger(plan, nom_étape, décision) {
    if (!plan || !(plan instanceof PlanProduction)) {
      throw new Error(`Plan invalide. Fournis : ${plan}`);
    }

    const surcharges = new Map();
    for (const étape of plan.étapes) {
      if (étape.surcharge) surcharges.set(étape.nom, étape.décision);
    }

    const catalogue = this.#catalogue();
    const produit = catalogue.get(nom_étape);
    const décision_par_défaut = produit ? this.#décision_par_défaut(produit) : 'BUY';
    if (décision === décision_par_défaut) {
      surcharges.delete(nom_étape);
    } else {
      surcharges.set(nom_étape, décision);
    }

    const stock = this.#stock();
    const nouvelles_étapes = this.#explorer(plan.produit_cible, plan.quantité_cible, stock, new Set(), true, surcharges);
    const coût_total = this.#calculer_coût(nouvelles_étapes);
    return new PlanProduction(plan.produit_cible, plan.quantité_cible, nouvelles_étapes, coût_total);
  }
}

export { Usine, GestionnaireEvenements, Planificateur };

