import { Inventaire, Recette, Produit, Tarif, Catalogue, Tarification } from "./domain.js";

class Usine {
  _nom;
  _inventaire = new Inventaire();
  get stock() { return this._inventaire.stock; }
  _livre_recettes = new Catalogue();
  /** @type {Recette[]} */
  get recettes() { return this._livre_recettes.fiches };
  _catalogue_produits = new Catalogue();
  /** @type {Produit[]} */
  get produits() { return this._catalogue_produits.fiches; }
  _marché = new Tarification();
  /** @type {Tarif[]} */
  get tarifs() { return this._marché.tarifs; }

  constructor(nom, recettes, tarifs, stock) {
    this._nom = nom;
    if (stock) for (const stack of stock) {
      try {
        this._inventaire.ajoute(stack.nom, stack.quantité);
      } catch (error) {
        console.log(`Stack non inscrite à l'inventaire : ${JSON.stringify(stack)}. Cause : ${error.message}.`);
      }
    }
    if (recettes) for (const recette of recettes) {
      try {
        this._livre_recettes.inscrire(recette);
      } catch (error) {
        console.log(`Recette non inscrite au livre de recette : ${recette?.nom}. Cause : ${error.message}.`);
      }
    }
    if (tarifs) for (const tarif of tarifs) {
      try {
        this._marché.mise_a_jour(tarif.nom, tarif.prix, tarif.date_effet);
      } catch (error) {
        console.log(`Tarif non inscrit au marché : ${JSON.stringify(tarif)}. Cause : ${error.message}.`);
      }
    }

    // Initialisation du catalogue correspondant
    this.étudeDeMarché();

  }

  ajouteRecette(recette) {
    this._livre_recettes.inscrire(recette);
    this._initProduit(recette.nom);
  }

  /**
   * @type {void}
   * @param {string} objet
   * @param {number} prix 
   * @param {Date} date
   */
  évaluer(objet, prix, date = new Date()) {
    this._marché.mise_a_jour(objet, Number.parseFloat(prix), new Date(date))
  }

  étudeDeMarché() {
    if (this._catalogue_produits?.index?.length)
      console.log(`Réinitialisation du catalogue précédent contenant ${this._catalogue_produits.index.length} produits`)
    this._catalogue_produits = new Catalogue();
    // tentative de création de produit pour chaque recette du livre
    let produits_potentiels = this._livre_recettes.index;
    let fusible = 0;
    while (produits_potentiels.length > 1) {
      produits_potentiels = this._initProduit(produits_potentiels.shift() ?? '', ...produits_potentiels);
      if (++fusible > 999) {
        throw new Error(`Erreur à l'étude du marché, les recettes formes probablement une boucle infinie : ${produits_potentiels}`);
      }
    }
  }

  // déclaration d'une fonction uniquement pour travail récursif
  _initProduit(nom_produit, ...produits_potentiels) {
    // constitution d'une liste de produits à recalculé lors d'une itération ultérieur
    let produits_retardés = [];
    let recette = this._livre_recettes.rechercher(nom_produit);
    if (recette) {
      let ingrédient_produit_potentiel = false;
      for (const [nom_ingrédient] of recette.ingrédients.entries()) {
        ingrédient_produit_potentiel ||= (produits_potentiels.includes(nom_ingrédient));
      }
      if (ingrédient_produit_potentiel)
        // si la recette du produit en cours contient un potentiel autre produit, mettre de côté le produit en cours pour calcul ultérieur
        produits_retardés.push(nom_produit);
      else
        this._catalogue_produits.inscrire(new Produit(nom_produit, this._livre_recettes, this._catalogue_produits, this._marché));
    }

    if (produits_potentiels.length) // s'il reste des produits potentiels, traitons le suivant !
      produits_retardés.push(...this._initProduit(produits_potentiels.shift() ?? '', ...produits_potentiels));
    return produits_retardés;
  }

}

export { Usine }