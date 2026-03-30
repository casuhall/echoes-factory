import { expect } from 'chai';
import { Recette, Tarif, Inventaire, Catalogue, Produit, Tarification, Ingrédient } from '../app/domain.js';

describe('Fonctionnement des objets du domaine.', () => {

    describe('Fonctionnement des Ingrédients', () => {

        it('Un ingrédient est créé avec un nom et une quantité', () => {
            let ingredient = new Ingrédient('Ingredient1', 2);
            expect(ingredient.nom).to.equal('Ingredient1');
            expect(ingredient.quantité).to.equal(2);
        });

        it('Un ingrédient ne peut être créé sans nom', () => {
            expect(() => new Ingrédient(null, 2)).to.throw(Error);
        });

        it('Un ingrédient ne peut être créé avec une quantité négative ou nulle', () => {
            expect(() => new Ingrédient('Ingredient1', -1)).to.throw(Error);
            expect(() => new Ingrédient('Ingredient1', 0)).to.throw(Error);
        });

        it('Un ingrédient ne peut être créé avec une quantité non entière', () => {
            expect(() => new Ingrédient('Ingredient1', 2.5)).to.throw(Error);
        });

        it(`le prix unitaire d'un ingrédient (s'il est renseigné) doit être strictement positif.
        Il son prix estimé doit refléter sa valeur au regard de sa quantité.`, () => {
            let ingrédient = new Ingrédient('Ingredient1', 10, new Tarif('Ingredient1', 15));
            expect(ingrédient.prix).to.equal(150);
            ingrédient = new Ingrédient('Ingredient1', 10, new Tarif('Ingredient1', 0.5));
            expect(ingrédient.prix).to.equal(5);
        })

        it('Un ingrédient ne peut être créé avec un produit inconsistant', () => {
            expect(() => new Ingrédient('Ingredient1', 1, undefined, { nom: 'ProduitInconsistant', prix: 10 })).to.throw(Error);
            let produitInconsistant = new Produit(new Recette('ProduitInconsistant', 10, [new Ingrédient('SousIngredient1', 1)]));
            expect(() => new Ingrédient('Ingredient1', 1, undefined, produitInconsistant)).to.throw(Error);
        });
    });

    describe('Fonctionnement du Produit', () => {
        let recette_simple, recette_multiple, recette_non_tarifée;

        beforeEach(() => {
            recette_non_tarifée = new Recette('NonTarifée', 50, [
                new Ingrédient('Ingredient1', 2),
                new Ingrédient('Ingredient2', 3)
            ]);
            recette_simple = new Recette('Simple', 50, [
                new Ingrédient('Ingredient1', 2, new Tarif('Ingredient1', 10)),
                new Ingrédient('Ingredient2', 3, new Tarif('Ingredient2', 20))
            ]);
            recette_multiple = new Recette('Multiple', 50, [
                new Ingrédient('Ingredient1', 2, new Tarif('Ingredient1', 10)),
                new Ingrédient('Ingredient2', 3, new Tarif('Ingredient2', 20))
            ], 10);
        });

        it('Un produit ne peutpas être créé sans recette valide', () => {
            expect(() => new Produit(null)).to.throw(Error);
            expect(() => new Produit({ nom: 'RecetteInvalide', ingrédients: [] })).to.throw(Error);
        });

        it('Un produit créé avec une recette non tarifée, ne pourra pas être tarrrifé', () => {
            let produit = new Produit(recette_non_tarifée);
            expect(produit.recette).to.deep.equal(recette_non_tarifée);
            expect(produit.prix_estimé).to.be.undefined;
            expect(produit.coût_reviens).to.be.undefined;
            expect(produit.rentabilité).to.be.undefined;
            expect(produit.statut).to.equal('NA');
        });

        it('Un produit créé avec une recette simple est rentable (à produire) si son coût de reviens est inférieur à son prix estimé', () => {
            let produit = new Produit(recette_simple, new Tarif("Simple", 180));
            expect(produit.recette).to.deep.equal(recette_simple);
            expect(produit.coût_reviens).to.equal(130); // 50+(2*10)+(3*20)
            expect(produit.prix_estimé).to.equal(180);
            expect(produit.rentabilité).to.equal(0.38); // (180-130)/130 = 50/130 = 0.3846... => 0.38
            expect(produit.statut).to.equal('BUILD');
        });

        it('Un produit créé avec une recette simple n est pas rentable (à acheter) si son coût de reviens est supérieur à son prix estimé', () => {
            let produit = new Produit(recette_simple, new Tarif("Simple", 100));
            expect(produit.recette).to.deep.equal(recette_simple);
            expect(produit.coût_reviens).to.equal(130); // 50+(2*10)+(3*20) = 130
            expect(produit.prix_estimé).to.equal(100);
            expect(produit.rentabilité).to.equal(-0.23); // (100-130)/130 = -30/130 = -0.2307... => -0.23
            expect(produit.statut).to.equal('BUY');
        });

        it("Un produit dont le coût de revient est égal au prix estimé ne provoque pas d'erreur", () => {
            let produit = new Produit(recette_simple, new Tarif("Simple", 130));
            expect(produit.recette).to.deep.equal(recette_simple);
            expect(produit.coût_reviens).to.equal(130); // 50+(2*10)+(3*20)
            expect(produit.prix_estimé).to.equal(130);
            expect(produit.rentabilité).to.equal(0);
            expect(produit.statut).to.equal('BUY');
        });

        it('En cas de sous produit, si celui-ci est plus rentable à produire, c est le cout de reviens qui sera utilisé dans le calcul du cout de reviens du produit englobant', () => {
            let produit_simple = new Produit(recette_simple, new Tarif("Simple", 180));
            let recette_imbriquée = new Recette('imbriquée', 50, [
                new Ingrédient('Simple', 2, new Tarif('Simple', 180), produit_simple),
                new Ingrédient('Ingredient2', 3, new Tarif('Ingredient2', 20))
            ], 10);
            let produit = new Produit(recette_imbriquée);
            expect(produit.coût_reviens).to.equal(370); // 50+(2*130)+(3*20) = 370
        });
        it('En cas de sous produit, si celui-ci est plus rentable à acheter, c est le prix estimé qui sera utilisé dans le calcul du cout de reviens du produit englobant', () => {
            let produit_simple = new Produit(recette_simple, new Tarif("Simple", 100));
            let recette_imbriquée = new Recette('imbriquée', 50, [
                new Ingrédient('Simple', 2, new Tarif('Simple', 100), produit_simple),
                new Ingrédient('Ingredient2', 3, new Tarif('Ingredient2', 20))
            ], 10);
            let produit = new Produit(recette_imbriquée);
            expect(produit.coût_reviens).to.equal(310); // 50+(2*100)+(3*20) = 310
        });
    });

    describe("Fonctionnement du catalogue des produits", () => {
        let catalogue;

        beforeEach(() => {
            catalogue = new Catalogue();
        });

        it("Le catalogue peut inscrire une fiche produit", () => {
            let recette = new Recette('Produit1', 50, [new Ingrédient('Ingredient1', 2, new Tarif('Ingredient1', 10))]);
            let produit = new Produit(recette, new Tarif('Produit1', 100));
            catalogue.inscrire(produit);
            expect(catalogue.rechercher('Produit1')).to.deep.equal(produit);
        });

        it("Le catalogue refuse d'inscrire une fiche produit en double", () => {
            let recette = new Recette('Produit1', 50, [new Ingrédient('Ingredient1', 2, new Tarif('Ingredient1', 10))]);
            let produit = new Produit(recette, new Tarif('Produit1', 100));
            catalogue.inscrire(produit);
            expect(() => catalogue.inscrire(produit)).to.throw(Error, /Une entrée portant le même nom existe déjà/);
        });

        it("On peut retirer une fiche produit du catalogue", () => {
            let recette = new Recette('Produit1', 50, [new Ingrédient('Ingredient1', 2, new Tarif('Ingredient1', 10))]);
            let produit = new Produit(recette, new Tarif('Produit1', 100));
            catalogue.inscrire(produit);
            let retiré = catalogue.retirer('Produit1');
            expect(retiré).to.deep.equal(produit);
            expect(catalogue.rechercher('Produit1')).to.be.undefined;
        });
    });

    describe("Fonctionnement de l'inventaire", () => {
        /** @type {Inventaire} */
        let inventaire;

        beforeEach(() => {
            inventaire = new Inventaire();
        });

        it("On peut ajouter des objets à l'inventaire", () => {
            expect(inventaire.ajoute('Objet1', 5)).to.equal(5);
            expect(inventaire.quantité_en_stock('Objet1')).to.equal(5);
            expect(inventaire.ajoute('Objet1', 3)).to.equal(8);
            expect(inventaire.quantité_en_stock('Objet1')).to.equal(8);
        });

        it("On peut retirer des objets de l'inventaire", () => {
            expect(inventaire.ajoute('Objet1', 5)).to.equal(5);
            expect(inventaire.retire('Objet1', 2)).to.equal(3);
            expect(inventaire.quantité_en_stock('Objet1')).to.equal(3);
        });

        it("On ne peut pas retirer plus de objets que ce qui est disponible dans l'inventaire", () => {
            expect(inventaire.ajoute('Objet1', 5)).to.equal(5);
            expect(() => inventaire.retire('Objet1', 6)).to.throw(Error, /Impossible de retirer 6 Objet1. Seuls 5 disponibles/);
            expect(inventaire.quantité_en_stock('Objet1')).to.equal(5);
        });

        it("On ne peut pas ajouter ou retirer une quantité négative ou fractionnée de objets", () => {
            expect(() => inventaire.ajoute('Objet1', -1)).to.throw(Error, /Nombre entier positif attendu. fournis : quantité=-1/);
            expect(() => inventaire.retire('Objet1', -1)).to.throw(Error, /Nombre entier positif attendu. fournis : quantité=-1/);
            expect(() => inventaire.ajoute('Objet1', 1.5)).to.throw(Error, /Nombre entier positif attendu. fournis : quantité=1.5/);
            expect(() => inventaire.retire('Objet1', 1.5)).to.throw(Error, /Nombre entier positif attendu. fournis : quantité=1.5/);
        });
    });
});