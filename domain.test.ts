import { Catalogue, IProduit, Produit, Recette, StatutProduit, Tarif, Tarification } from "./domain";

describe("Vérification du fonctionnement du marché", () => {
  let marché: Tarification;
  let date_effet_existante = new Date("01/01/2010");
  let date_effet_antérieure = new Date("01/01/2000");
  let date_effet_postérieure = new Date("01/01/2020");

  beforeEach(() => {
    marché = new Tarification();
    marché.mise_a_jour("Un objet connu", 100, date_effet_existante)
  });

  it(`Cas nominal d'obtention d'un tarif`, () => {
    vérifier(marché.tarif("Un objet connu"), "Un objet connu", 100, date_effet_existante);
  });

  it(`Obtention d'un tarif pour un objet inconnu`, () => {
    expect(marché.tarif("Un objet inconnu")).toBeUndefined();
  });

  it(`Cas nominal de mise à jour d'un tarif`, () => {
    // mise à jour d'un tarif pour un objet existant en fournissant la date
    marché.mise_a_jour("Un objet connu", 200, date_effet_postérieure);
    vérifier(marché.tarif("Un objet connu"), "Un objet connu", 200, date_effet_postérieure);

    // mise à jour d'un tarif pour un objet existant, pas de date
    marché.mise_a_jour("Un objet connu", 300);
    vérifier(marché.tarif("Un objet connu"), "Un objet connu", 300, new Date());

    // Enregistrement du tarif pour un nouvel objet
    marché.mise_a_jour("Un nouvel objet", 1);
    vérifier(marché.tarif("Un nouvel objet"), "Un nouvel objet", 1, new Date());
  });

  it(`La mise à jour d'un tarif pour un objet existant à une date antérieur à la date précédente doit être impossible`, () => {
    // erreur lors de la tentative de mise à jour.
    expect(() => marché.mise_a_jour("Un objet connu", 1000, date_effet_antérieure)).toThrow()
    // vérifier que l'objet existant n'a pas été modifié par l'opération
    vérifier(marché.tarif("Un objet connu"), "Un objet connu", 100, date_effet_existante);
  });

  it(`Immutabilité de la date d'effet d'un tarif`, () => {
    // modifier la date d'effet d'un tarif après obtention n'a aucun impact dans la tarification
    let tarif = marché.tarif("Un objet connu");
    let date = tarif?.date_effet;
    date?.setFullYear(1900);
    expect(tarif?.date_effet.toLocaleDateString())
      .toStrictEqual(date_effet_existante.toLocaleDateString());
    // modifier la date d'entrée après mise à jour d'un tarif n'a aucun impact dans la tarification
    date = new Date();
    marché.mise_a_jour("Un objet connu", 666, date);
    
    date.setFullYear(1900);
    vérifier(marché.tarif("Un objet connu"), "Un objet connu", 666, new Date());
  });

  function vérifier(tarif: Tarif | undefined, nom: string, prix: number, date_effet: Date) {
    expect(tarif?.nom).toBe(nom);
    expect(tarif?.prix).toBe(prix);
    expect(tarif?.date_effet?.toLocaleDateString())
      .toStrictEqual(date_effet.toLocaleDateString());
  }
});

describe("Vérification du fonctionnement du produit", () => {
  let livre_recettes: Catalogue<Recette>;
  let catalogue_produits: Catalogue<IProduit>;
  let marché: Tarification;

  beforeEach(() => {
    livre_recettes = new Catalogue<Recette>();
    catalogue_produits = new Catalogue<Produit>();
    marché = new Tarification();

    livre_recettes.inscrire(new Recette("Objet nominal simple", 5,
      [{ nom: "Ingrédient nominal 1", quantité: 1 }
        , { nom: "Ingrédient nominal 2", quantité: 2 }]))
    marché.mise_a_jour("Ingrédient nominal 1", 1);
    marché.mise_a_jour("Ingrédient nominal 2", 2);
    marché.mise_a_jour("Objet nominal simple", 13);

    livre_recettes.inscrire(new Recette("Objet composite simple", 5,
      [{ nom: "Ingrédient nominal 1", quantité: 5 }
        , { nom: "Ingrédient Produit 1", quantité: 1 }]))
    catalogue_produits.inscrire({ nom: "Ingrédient Produit 1", coût_reviens: 10, date_effet: new Date(), rentabilité: 0.5, statut: StatutProduit.INDUS });
    marché.mise_a_jour("Ingrédient Produit 1", 15);
    marché.mise_a_jour("Objet composite simple", 18);

    livre_recettes.inscrire(new Recette("Objet sans prix", 5,
      [{ nom: "Ingrédient nominal 1", quantité: 1 }
        , { nom: "Ingrédient nominal 2", quantité: 2 }]));

    livre_recettes.inscrire(new Recette("Objet ingrédients partiellement sans prix", 5,
      [{ nom: "Ingrédient nominal 1", quantité: 1 }
        , { nom: "Ingrédient sans prix 1", quantité: 200 }]));
    marché.mise_a_jour("Objet ingrédients partiellement sans prix", 18);

    livre_recettes.inscrire(new Recette("Objet ingrédients totalement sans prix", 5,
      [{ nom: "Ingrédient sans prix 2", quantité: 200 }
        , { nom: "Ingrédient sans prix 1", quantité: 100 }]));
    marché.mise_a_jour("Objet ingrédients totalement sans prix", 18);
  });

  test(`Cas nominal d'un produit industrialisable 'simple'`, () => {
    let produit = new Produit("Objet composite simple", livre_recettes, catalogue_produits, marché);
    expect(produit.coût_reviens).toBe(20);
    // pour cause de problème de précision sur les opérations de division entre nombre, troncature
    expect(Math.floor((produit.rentabilité ?? 0) * 100)).toBe(-10);
    expect(produit.commentaire).toBe("Ne pas produire, il vaut mieux l'acheter");
    expect(produit.statut).toBe(StatutProduit.INDUS);
  });

  test(`Cas nominal d'un produit industrialisable contenant des ingrédients qui sont eux même des produits`, () => {
    let produit = new Produit("Objet nominal simple", livre_recettes, catalogue_produits, marché);
    expect(produit.coût_reviens).toBe(10);
    // pour cause de problème de précision sur les opérations de division entre nombre, troncature
    expect(Math.floor((produit.rentabilité ?? 0) * 100)).toBe(30);
    expect(produit.commentaire).toBe("Commercialisable");
    expect(produit.statut).toBe(StatutProduit.INDUS);
  });

  test(`On ne peux pas créer de produit sans nom`, () => {
    expect(() => new Produit("", livre_recettes, catalogue_produits, marché)).toThrow("Nom de produit obligatoire");
    expect(() => new Produit("   ", livre_recettes, catalogue_produits, marché)).toThrow("Nom de produit obligatoire");
  });

  test(`Impossible de créer un produit sans recette connue au préalable`, () => {
    expect(() => new Produit("nawak", livre_recettes, catalogue_produits, marché)).toThrow(`Recette introuvable pour la fabrication du produit nawak`);
  });

  test(`Un produit qui n'a pas de prix connu restera à l'état d'initialisation`, () => {
    let produit = new Produit("Objet sans prix", livre_recettes, catalogue_produits, marché);
    expect(produit.coût_reviens).toBe(10);
    expect(produit.rentabilité).toBe(undefined);
    expect(produit.commentaire).toBe("Rentabilité incalculable : prix estimé inconnu");
    expect(produit.statut).toBe(StatutProduit.INIT);
  });

  test(`Un produit pour lequel aucun ingrédient n'a de prix restera à l'état d'initialisation`, () => {
    let produit = new Produit("Objet ingrédients totalement sans prix", livre_recettes, catalogue_produits, marché);
    expect(produit.coût_reviens).toBe(undefined);
    expect(produit.rentabilité).toBe(undefined);
    expect(produit.commentaire).toBe("Rentabilité incalculable : coût de reviens inconnu");
    expect(produit.statut).toBe(StatutProduit.INIT);
  });

  test(`Un produit pour lequel au moins un ingrédient n'a pas de prix restera à l'état d'initialisation`, () => {
    let produit = new Produit("Objet ingrédients partiellement sans prix", livre_recettes, catalogue_produits, marché);
    expect(produit.coût_reviens).toBe(undefined);
    expect(produit.rentabilité).toBe(undefined);
    expect(produit.commentaire).toBe("Rentabilité incalculable : coût de reviens inconnu");
    expect(produit.statut).toBe(StatutProduit.INIT);
  });

});

// test.each`
// a    | b    | expected
// ${1} | ${1} | ${2}
// ${1} | ${2} | ${3}
// ${2} | ${1} | ${3}
// `('returns $expected when $a is added $b', ({ a, b, expected }) => {
//   expect(a + b).toBe(expected);
// });