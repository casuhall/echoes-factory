interface Entité {
  nom: string;
}

// Un catalogue ...
class Catalogue<T extends Entité> {
  private _fiches: Map<string, T> = new Map();
  get index(): string[] { return [...this._fiches.keys()] }
  rechercher(entrée: string): T | undefined { return this._fiches.get(entrée); }
  inscrire(entrée: T): void {
    if (!entrée)
      throw new Error("Entrée à inscrire obligatoire");
    if (this._fiches.has(entrée.nom))
      throw new Error(`Une entrée portant le même nom existe déjà : ${entrée.nom}`);
    this._fiches.set(entrée.nom, entrée);
  }
  retirer(entrée: string): T | undefined {
    if (!entrée)
      throw new Error("Entrée à retirer obligatoire");
    let entrée_retirée = this._fiches.get(entrée);
    if (!this._fiches.delete(entrée))
      console.log(`Aucune entrée à retirer sous le nom : ${entrée}`)
    return entrée_retirée;
  }
}

enum StatutProduit {
  INIT = "INIT", // Produit toujours en cours d'initialisation.
  INDUS = "INDUS", // Produit industrialisable, toutes les données nécessaires sont connues.
}

// Objet immutable représentant le tarif d'un objet.
class Tarif implements Entité {
  private _nom: string;
  get nom(): string { return this._nom; };
  private _prix: number;
  get prix(): number { return this._prix; };
  private _date_effet: Date;
  // retourne une copie de la date pour éviter les mises à jour
  get date_effet(): Date { return new Date(this._date_effet); };

  constructor(nom: string, prix: number, date_effet: Date = new Date()) {
    if (!nom || nom.trim().length === 0)
      throw new Error("Nom de recette obligatoire.")
    if (!prix || prix < 0)
      throw new Error(`Valeur positive attendue. valeur fournie : prix=${prix}`)
    this._nom = nom;
    this._prix = prix;
    // Stockage d'une copie de la date pour immutabilité
    this._date_effet = new Date(date_effet); // date_effet; //

  }
}

class Tarification {
  private _tarifs: Map<string, Tarif> = new Map<string, Tarif>();

  // Mettre à jour le tarif d'un objet
  mise_a_jour(objet: string, prix: number, date: Date = new Date()): void {
    if (!objet || objet.trim().length === 0)
      throw new Error(`Objet à mettre à jour obligatoire. Fournis : objet=${objet}`);
    if (!prix || prix < 0)
      throw new Error(`Nombre positif attendu. Fournis : prix=${prix}`);
    let tarif = this._tarifs.get(objet)
    if (tarif && tarif.date_effet > date)
      throw new Error(`Un tarif plus recent existe déjà. Date de tarif existant : ${tarif.date_effet.toLocaleDateString()}, date de mise à jour souhaitée : ${date.toLocaleDateString()}`);
    this._tarifs.set(objet, new Tarif(objet, prix, date));
  }

  tarif(objet: string): Tarif | undefined {
    return this._tarifs.get(objet);
  }
}

class Recette implements Entité {
  private _nom: string;
  get nom(): string { return this._nom; }

  private _frais: number;
  // frais de fabrication, hors prix des ingrédients
  get frais(): number { return this._frais; }

  private _ingrédients: Map<string, number> = new Map();
  // obtention d'une copie de la liste des ingrédients pour éviter toute modification en dehors de la recette
  get ingrédients(): Map<string, number> { return new Map(this._ingrédients) }

  constructor(nom: string, frais: number, ingrédients: { nom: string, quantité: number }[]) {
    if (!frais || frais < 0 || !Number.isInteger(frais))
      throw new Error(`Nombre entier positif attendu. fournis : frais=${frais}`);
    if (!nom || nom.trim().length === 0)
      throw new Error(`Nom de recette obligatoire`);
    if (!ingrédients || ingrédients.length === 0)
      throw new Error(`Au moins un ingrédient attendu pour former une recette`);
    this._nom = nom;
    this._frais = frais;
    ingrédients.forEach(ingrédient =>
      this._ingrédients.set(ingrédient.nom,
        (this._ingrédients.get(ingrédient.nom) ?? 0) + ingrédient.quantité)
    )
  }
}

// Gestion de stock
class Inventaire {
  // nombre d'objets, classé par nom
  private _objets: Map<string, number> = new Map();

  getStock(objet: string): number {
    return this._objets.get(objet) ?? 0;
  }

  // ajoute une quantité d'objets au stock. renvoi la quantité totale d'objets de ce type en stock après ajout.
  ajoute(objet: string, quantité: number): number {
    if (!quantité || quantité < 0 || (quantité % 0) !== quantité)
      throw new Error(`Nombre entier positif attendu. fournis : quantité=${quantité}`)
    let nouveau_stock = this.getStock(objet) + quantité;
    this._objets.set(objet, nouveau_stock);
    return nouveau_stock;
  }

  // retirer un objet du stock
  retire(objet: string, quantité: number): void {
    let stock = this.getStock(objet);
    if (stock < quantité) {
      throw new Error(`Impossible de retirer ${quantité} ${objet}. Seuls ${stock} disponibles`)
    }
  }
}

interface IProduit {
  nom: string;
  date_effet: Date;
  statut: StatutProduit;
  coût_reviens: number | undefined;
  rentabilité: number | undefined;
}

// représentation la partie opérationnelle associée à une recette
class Produit implements IProduit {
  private _nom: string;
  get nom() { return this._nom; }
  private _rentabilité: number | undefined;
  get rentabilité(): number | undefined { return this._rentabilité };
  private _prix_estimé: number | undefined;
  private _coût_reviens: number | undefined;
  get coût_reviens(): number | undefined { return this._coût_reviens };
  private _statut: StatutProduit;
  get statut(): StatutProduit { return this._statut; }
  private _date_effet: Date = new Date();
  // Obtention d'une nouvelle version de la date d'effet (garantie l'immutabilité du produit)
  get date_effet(): Date { return new Date(this._date_effet); };
  private _updateDateEffet(date: Date): void { this._date_effet = (date < this._date_effet) ? new Date(date) : this._date_effet; }
  private _commentaire: string = '';
  get commentaire(): string { return this._commentaire; }

  // Initialisation d'un produit à partir du livre de recette et du catalogue de produits de l'usine.
  constructor(nom: string, livre_recettes: Catalogue<Recette>, catalogue_produits: Catalogue<IProduit>, marché: Tarification) {
    this._statut = StatutProduit.INIT;

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
      let prix_ingrédient: number | undefined;
      let tarif_ingrédient = marché.tarif(ingrédient);
      if (tarif_ingrédient) {
        prix_ingrédient = tarif_ingrédient.prix;
        this._updateDateEffet(tarif_ingrédient.date_effet);
      }

      // Récupération du coût de reviens au catalogue si le produit existe
      let ingrédient_produit = catalogue_produits.rechercher(ingrédient);
      if (ingrédient_produit?.coût_reviens) {
        if (prix_ingrédient && prix_ingrédient < ingrédient_produit.coût_reviens) {
          console.log(`Ingrédient ${ingrédient} plus coûteux à produire qu'à acheter, considéré comme matière brut.`);
        } else {
          prix_ingrédient = ingrédient_produit.coût_reviens;
          this._updateDateEffet(ingrédient_produit.date_effet);
        }
      }
      if (prix_ingrédient && this._coût_reviens) {
        this._coût_reviens += prix_ingrédient * quantité;
      } else { // coût incalculable tarif manquant sur l'ingrédient en cours ou un précédent
        this._coût_reviens = undefined;
        console.log(`Calcul de coût impossible : pas de prix disponible pour l'ingrédient : ${ingrédient}`)
      }
    }

    // a la fin du process de calcul du coût de reviens, mise à jour du statut + calcul des indicateurs
    if (!this._prix_estimé) this._commentaire = `Rentabilité incalculable : prix estimé inconnu`
    else if (!this._coût_reviens) this._commentaire = `Rentabilité incalculable : coût de reviens inconnu`
    else {
      // Si les données d'entrées sont complète, on bascule en phase industrialisée et on calcule la rentabilité.
      this._statut = StatutProduit.INDUS;
      this._rentabilité = (this._prix_estimé / this._coût_reviens) - 1;
      if (this._rentabilité > 0.15) this._commentaire = `Commercialisable`;
      else if (this._rentabilité > 0) this._commentaire = "Pour consommation interne";
      else this._commentaire = "Ne pas produire, il vaut mieux l'acheter";
    }

  }

}

export { Entité, Tarification, Recette, Inventaire, Produit, IProduit, Catalogue, StatutProduit, Tarif }
