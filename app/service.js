import { Catalogue, Tarification, Inventaire, Produit, Recette, Tarif } from './domain.js';

/**
 * Usine de production avec gestion des recettes, tarifs, stock et produits.
 * Coordonne l'étude de marché et le calcul de rentabilité des produits.
 */
class Usine {
    #nom;
    #gestionnaire_evenements;
    #inventaire = new Inventaire();
    /** @type {[nom:string,quantité:number][]} Stock courant de l'usine */
    get stock() { return this.#inventaire.stock; }
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
    constructor(nom, gestionnaire_evenements = new GestionnaireEvenements(), recettes = [], tarifs = [], stock = []) {
        this.#nom = nom;
        this.#gestionnaire_evenements = gestionnaire_evenements;
        for (const tarif of tarifs) {
            try {
                this.évaluer(tarif.nom, tarif.montant, tarif.date_effet);
            } catch (error) {
                console.log(`Tarif non inscrit au marché : ${JSON.stringify(tarif)}. Cause : ${error.message}.`);
            }
        }
        for (const stack of stock) {
            try {
                this.#inventaire.ajoute(stack.nom, stack.quantité);
            } catch (error) {
                console.log(`Stack non inscrite à l'inventaire : ${JSON.stringify(stack)}. Cause : ${error.message}.`);
            }
        }
        for (const recette of recettes) {
            try {
                this.ajouteRecette(recette);
            } catch (error) {
                console.log(`Recette non inscrite au livre de recette : ${recette?.nom}. Cause : ${error.message}.`);
            }
        }
        gestionnaire_evenements.consomme("maj_produit", this.maj_ingrédient_produit.bind(this));
    }


    maj_ingrédient_produit(nom_ingrédient) {
        console.log(`Ingrédient mis à jour : ${nom_ingrédient}`);
        let produit = this.produit(nom_ingrédient);
        if (!produit) throw new Error(`Impossible de mettre à jour l'ingrédient ${nom_ingrédient} car le produit n'existe pas.`);
    }
    /**
     * Ajoute une recette au livre de recettes et initialise le produit correspondant.
     * @param {Recette} recette Recette à ajouter
     * @throws {Error} Si une recette avec le même nom existe déjà
     */
    ajouteRecette(recette) {
        if (!recette || !(recette instanceof Recette)) throw new Error(`Recette nécessaire pour l'initialisation d'un produit`);
        if (this.produit(recette.nom)) {
            throw new Error(`Produit ${recette.nom} déjà inscrit au catalogue, création impossible.`);
        }
        let produit = new Produit(recette, this.#marché.tarif(recette.nom));
        this.#catalogue_produits.inscrire(produit);
        this.#gestionnaire_evenements.produit("maj_produit", recette.nom);
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
        let tarif = this.#marché.mise_a_jour(objet, Number.parseFloat(prix), new Date(date));
        this.#gestionnaire_evenements.produit("maj_tarif", tarif);
    }

    /**
     * Réinitialise le catalogue des produits en étudiant le marché.
     * Crée les produits en gérant les dépendances entre recettes.
     * @throws {Error} Si les recettes forment une boucle infinie
     * @deprecated Cette méthode devrait être implémentée via retour d'évènements lors de la création/modification de produit.
     */
    // étudeDeMarché() {
    //     if (this.#catalogue_produits?.index?.length)
    //         console.log(`Réinitialisation du catalogue précédent contenant ${this.#catalogue_produits.index.length} produits`)
    //     this.#catalogue_produits = new Catalogue();
    //     // tentative de création de produit pour chaque recette du livre
    //     let produits_potentiels = this.#livre_recettes.index;
    //     let fusible = 0;
    //     while (produits_potentiels.length > 1) {
    //         produits_potentiels = this.#initProduit(produits_potentiels.shift() ?? '', ...produits_potentiels);
    //         if (++fusible > 999) {
    //             throw new Error(`Erreur à l'étude du marché, les recettes formes probablement une boucle infinie : ${produits_potentiels}`);
    //         }
    //     }
    // }

}

class GestionnaireEvenements {
    constructor() {
        this.#listeners = {};
    }

    #listeners;

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
