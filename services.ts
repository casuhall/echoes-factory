import { Inventaire, Recette, Produit, Tarification, Catalogue } from "./domain";

class Usine {
  private _nom: string;
  private _inventaire: Inventaire = new Inventaire();
  private _livre_recettes: Catalogue<Recette> = new Catalogue<Recette>();
  private _catalogue_produits: Catalogue<Produit>;

  constructor(nom: string, stock: { nom: string, quantité: number }[] = [], recettes: Recette[] = [], marché: Tarification = new Tarification()) {
    this._nom = nom;
    stock.forEach(stack => {
      try {
        this._inventaire.ajoute(stack.nom, stack.quantité);
      } catch (error) {
        console.log(`Stack non inscrit à l'inventaire : ${JSON.stringify(stack)}. Cause : ${error.message}.`);
      }
    });
    recettes.forEach(recette => {
      try {
        this._livre_recettes.inscrire(recette);
      } catch (error) {
        console.log(`Recette non inscrite au livre de recette : ${recette?.nom}. Cause : ${error.message}.`);
      }
    });

    // on repart d'un catalogue tout neuf
    this.étudeDeMarché(marché);

  }

  étudeDeMarché(marché: Tarification) {
    if (this._catalogue_produits?.index?.length)
      console.log(`Réinitialisation du catalogue précédent contenant ${this._catalogue_produits.index.length} produits`)
    this._catalogue_produits = new Catalogue<Produit>();
    // tentative de création de produit pour chaque recette du livre
    let produits_potentiels: string[] = this._livre_recettes.index;
    let fusible = 0;
    while (produits_potentiels.length > 1) {
      produits_potentiels = this._initProduit(marché, produits_potentiels.shift() ?? '', ...produits_potentiels);
      if (++fusible > 999) {
        throw new Error(`Erreur à l'étude du marché, les recettes formes probablement une boucle infinie : ${produits_potentiels}`);
      }
    }
    console.log(`Nouveau catalogue imprimé, celui-ci contient ${this._catalogue_produits.index.length} produits`)


  }

  // déclaration d'une fonction uniquement pour travail récursif
  private _initProduit(marché: Tarification, nom_produit: string, ...produits_potentiels: string[]): string[] {
    // constitution d'une liste de produits à recalculé lors d'une itération ultérieur
    let produits_retardés: string[] = [];
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
        this._catalogue_produits.inscrire(new Produit(nom_produit, this._livre_recettes, this._catalogue_produits, marché));
    }

    if (produits_potentiels.length) // s'il reste des produits potentiels, traitons le suivant !
      produits_retardés.push(...this._initProduit(marché, produits_potentiels.shift() ?? '', ...produits_potentiels));
    return produits_retardés;
  }


}

export { Usine }