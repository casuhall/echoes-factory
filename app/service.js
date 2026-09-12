import { Catalogue, Tarification, Inventaire, Produit, Recette, Tarif, Ingrédient } from './domain.js';

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
    #inventaire = new Inventaire();
    /** @type {[nom:string,quantité:number][]} Stock courant de l'usine */
    get stock() { return this.#inventaire.stock; }
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
     */
    constructor(nom, gestionnaire_evenements = new GestionnaireEvenements(), recettes = [], tarifs = [], stock = []) {
        this.#nom = nom || "Jhon Doe";
        this.#gestionnaire_evenements = gestionnaire_evenements;
        gestionnaire_evenements.consomme("maj_produit", this.maj_ingrédient_produit.bind(this));
        gestionnaire_evenements.consomme("maj_tarif", this.maj_ingrédient_produit.bind(this));
        for (const tarif of tarifs) {
            try {
                this.évaluer(tarif.nom, Number.parseFloat(tarif.montant), tarif.date_effet);
            } catch (error) {
                console.log(`Tarif non inscrit au marché : ${JSON.stringify(tarif)}. Cause : ${error.message}.`);
            }
        }
        for (const stack of stock) {
            try {
                this.#inventaire.ajoute(stack.nom, Number.parseFloat(stack.quantité));
            } catch (error) {
                console.log(`Stack non inscrite à l'inventaire : ${JSON.stringify(stack)}. Cause : ${error.message}.`);
            }
        }
        for (const recette of recettes) {
            try {
                this.ajouteProduit(recette);
            } catch (error) {
                console.log(`Recette non inscrite au livre de recette : ${recette?.nom}. Cause : ${error.message}.`);
            }
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
            recette = new Recette(recette.nom, Number.parseFloat(recette.frais),
                recette.ingrédients?.map(ingrédient => new Ingrédient(ingrédient.nom, Number.parseFloat(ingrédient.quantité))));
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
        if(!old_produit) throw new Error(`La recette ne semble correspondre à aucun produit au catalogue : ${recette}`);
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

    toString() {
        return `{"nom": "${this.#nom}", "recettes": [${this.recettes.map(recette => recette.toString()).join(",")}], "stock": [${this.stock.map(stack => `{"nom": "${stack.nom}", "quantité": ${stack.quantité}}`)}], "tarifs": [${this.tarifs.map(tarif => tarif.toString())}]}`;
    }

    static parse(string) {
        try {
            let objet = JSON.parse(string);
            return new Usine(objet.nom, undefined, objet.recettes, objet.tarifs, objet.stock);
        } catch (error) {
            console.info(`Erreur lors de l'interprétation de la représentation de l'usine :
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

export { Usine, GestionnaireEvenements }
