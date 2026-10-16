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
            expect(produit.commentaire).to.equal('Rentabilité incalculable : prix estimé inconnu.');
            // Rentabilité incalculable : coût de reviens inconnu.
            produit = new Produit(recette_non_tarifée, new Tarif("NonTarifée", 1));
            expect(produit.recette).to.deep.equal(recette_non_tarifée);
            expect(produit.prix_estimé).to.equal(1);
            expect(produit.coût_reviens).to.be.undefined;
            expect(produit.rentabilité).to.be.undefined;
            expect(produit.statut).to.equal('NA');
            expect(produit.commentaire).to.equal('Rentabilité incalculable : coût de reviens inconnu.');
        });

        it('Un produit créé avec une recette simple est rentable (à produire) si son coût de reviens est inférieur à son prix estimé', () => {
            let produit = new Produit(recette_simple, new Tarif("Simple", 180));
            expect(produit.recette).to.deep.equal(recette_simple);
            expect(produit.coût_reviens).to.equal(130); // 50+(2*10)+(3*20)
            expect(produit.prix_estimé).to.equal(180);
            expect(produit.rentabilité).to.equal(0.38); // (180-130)/130 = 50/130 = 0.3846... => 0.38
            expect(produit.statut).to.equal('BUILD');
            expect(produit.commentaire).to.equal('Commercialisable');
            produit = new Produit(recette_simple, new Tarif("Simple", 140));
            expect(produit.recette).to.deep.equal(recette_simple);
            expect(produit.coût_reviens).to.equal(130); // 50+(2*10)+(3*20)
            expect(produit.prix_estimé).to.equal(140);
            expect(produit.rentabilité).to.equal(0.08); // (140-130)/130 = 10/130 = 0.0769...
            expect(produit.statut).to.equal('BUILD');
            expect(produit.commentaire).to.equal('Pour consommation interne');
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

        describe('date_référence_estimations', () => {
            it("retourne undefined pour un produit sans tarif (statut NA)", () => {
                let produit = new Produit(recette_non_tarifée);
                expect(produit.statut).to.equal('NA');
                expect(produit.date_référence_estimations).to.be.undefined;
            });

            it("retourne undefined pour un produit avec prix estimé mais sans tarifs d'ingrédients (statut NA)", () => {
                let produit = new Produit(recette_non_tarifée, new Tarif("NonTarifée", 1));
                expect(produit.statut).to.equal('NA');
                expect(produit.date_référence_estimations).to.be.undefined;
            });

            it("retourne la date du tarif produit quand tous les tarifs ont la même date", () => {
                const dateRef = new Date('2024-01-15');
                const recette = new Recette('Produit', 50, [
                    new Ingrédient('Ingredient1', 2, new Tarif('Ingredient1', 10, dateRef)),
                ]);
                const produit = new Produit(recette, new Tarif('Produit', 200, dateRef));
                expect(produit.statut).not.to.equal('NA');
                const dateRéf = produit.date_référence_estimations;
                expect(dateRéf).to.be.instanceOf(Date);
                expect(dateRéf.toDateString()).to.equal(dateRef.toDateString());
            });

            it("retourne la date la plus ancienne parmi les tarifs des ingrédients", () => {
                const dateAncienne = new Date('2023-06-01');
                const dateRécente = new Date('2024-01-15');
                const recette = new Recette('Produit', 50, [
                    new Ingrédient('Ingredient1', 2, new Tarif('Ingredient1', 10, dateRécente)),
                    new Ingrédient('Ingredient2', 3, new Tarif('Ingredient2', 20, dateAncienne)),
                ]);
                const produit = new Produit(recette, new Tarif('Produit', 500, dateRécente));
                expect(produit.statut).not.to.equal('NA');
                const dateRéf = produit.date_référence_estimations;
                expect(dateRéf.toDateString()).to.equal(dateAncienne.toDateString());
            });

            it("prend en compte la date du tarif du produit lui-même si elle est la plus ancienne", () => {
                const dateTarif = new Date('2022-03-10');
                const dateIngrédient = new Date('2024-01-15');
                const recette = new Recette('Produit', 50, [
                    new Ingrédient('Ingredient1', 2, new Tarif('Ingredient1', 10, dateIngrédient)),
                ]);
                const produit = new Produit(recette, new Tarif('Produit', 500, dateTarif));
                expect(produit.statut).not.to.equal('NA');
                const dateRéf = produit.date_référence_estimations;
                expect(dateRéf.toDateString()).to.equal(dateTarif.toDateString());
            });
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
            // contrôle de cohérence avec l'état du stock
            expect(inventaire.stock).to.deep.equal([{ nom: 'Objet1', quantité: 8 }]);
        });

        it("l'ajout d'un objet sans nom provoque une erreur", () => {
            expect(() => inventaire.ajoute('', 5)).to.throw(Error, /Nom d'objet obligatoire\./);
            expect(() => inventaire.ajoute('   ', 5)).to.throw(Error, /Nom d'objet obligatoire\./);
            expect(() => inventaire.ajoute(null, 5)).to.throw(Error, /Nom d'objet obligatoire\./);
            expect(() => inventaire.ajoute(undefined, 5)).to.throw(Error, /Nom d'objet obligatoire\./);
        });

        it("On peut retirer des objets de l'inventaire", () => {
            expect(inventaire.ajoute('Objet1', 5)).to.equal(5);
            expect(inventaire.retire('Objet1', 2)).to.equal(3);
            expect(inventaire.quantité_en_stock('Objet1')).to.equal(3);
            // contrôle de cohérence avec l'état du stock
            expect(inventaire.stock).to.deep.equal([{ nom: 'Objet1', quantité: 3 }]);
        });

        it("Retirer tous les objets d'un même type fait disparaître cet objet de l'inventaire", () => {
            expect(inventaire.ajoute('Objet1', 5)).to.equal(5);
            expect(inventaire.quantité_en_stock('Objet1')).to.equal(5);
            expect(inventaire.retire('Objet1', 5)).to.equal(0);
            expect(inventaire.quantité_en_stock('Objet1')).to.equal(0);
            // contrôle de cohérence avec l'état du stock
            expect(inventaire.stock).to.deep.equal([]);
        });

        it("On ne peut pas retirer plus de objets que ce qui est disponible dans l'inventaire", () => {
            expect(inventaire.ajoute('Objet1', 5)).to.equal(5);
            expect(() => inventaire.retire('Objet1', 6)).to.throw(Error, /Impossible de retirer 6 Objet1. Seuls 5 disponibles/);
            expect(inventaire.quantité_en_stock('Objet1')).to.equal(5);
        });

        it("On ne peut pas ajouter ou retirer une quantité nulle, négative ou fractionnée de objets", () => {
            expect(() => inventaire.ajoute('Objet1', 0)).to.throw(Error, /Nombre entier strictement positif attendu\. Fournis : quantité=0/);
            expect(() => inventaire.retire('Objet1', 0)).to.throw(Error, /Nombre entier strictement positif attendu\. Fournis : quantité=0/);
            expect(() => inventaire.ajoute('Objet1', -1)).to.throw(Error, /Nombre entier strictement positif attendu\. Fournis : quantité=-1/);
            expect(() => inventaire.retire('Objet1', -1)).to.throw(Error, /Nombre entier strictement positif attendu\. Fournis : quantité=-1/);
            expect(() => inventaire.ajoute('Objet1', 1.5)).to.throw(Error, /Nombre entier strictement positif attendu\. Fournis : quantité=1\.5/);
            expect(() => inventaire.retire('Objet1', 1.5)).to.throw(Error, /Nombre entier strictement positif attendu\. Fournis : quantité=1\.5/);
        });

        describe("Gestion du stock engagé (réservations)", () => {
            beforeEach(() => {
                inventaire.ajoute('Objet1', 10);
            });

            it("quantité_engagée retourne 0 pour un objet non réservé", () => {
                expect(inventaire.quantité_engagée('Objet1')).to.equal(0);
                expect(inventaire.quantité_engagée('InexistantPouet')).to.equal(0);
            });

            it("quantité_disponible retourne le stock total quand rien n'est engagé", () => {
                expect(inventaire.quantité_disponible('Objet1')).to.equal(10);
            });

            it("réserver incrémente le stock engagé et réduit le stock disponible", () => {
                inventaire.réserver('Objet1', 3);
                expect(inventaire.quantité_engagée('Objet1')).to.equal(3);
                expect(inventaire.quantité_disponible('Objet1')).to.equal(7);
                expect(inventaire.quantité_en_stock('Objet1')).to.equal(10); // stock total inchangé
            });

            it("réserver plusieurs fois cumule les engagements", () => {
                inventaire.réserver('Objet1', 3);
                inventaire.réserver('Objet1', 4);
                expect(inventaire.quantité_engagée('Objet1')).to.equal(7);
                expect(inventaire.quantité_disponible('Objet1')).to.equal(3);
            });

            it("libérer décrémente le stock engagé", () => {
                inventaire.réserver('Objet1', 6);
                inventaire.libérer('Objet1', 4);
                expect(inventaire.quantité_engagée('Objet1')).to.equal(2);
                expect(inventaire.quantité_disponible('Objet1')).to.equal(8);
            });

            it("libérer tout le stock engagé remet l'engagement à 0", () => {
                inventaire.réserver('Objet1', 5);
                inventaire.libérer('Objet1', 5);
                expect(inventaire.quantité_engagée('Objet1')).to.equal(0);
                expect(inventaire.quantité_disponible('Objet1')).to.equal(10);
            });

            it("réserver plus que le stock disponible lance une erreur", () => {
                inventaire.réserver('Objet1', 8);
                expect(() => inventaire.réserver('Objet1', 3)).to.throw(Error);
            });

            it("libérer plus que le stock engagé lance une erreur", () => {
                inventaire.réserver('Objet1', 3);
                expect(() => inventaire.libérer('Objet1', 5)).to.throw(Error);
            });

            it("réserver avec un nom vide lance une erreur", () => {
                expect(() => inventaire.réserver('', 3)).to.throw(Error, /Nom d'objet obligatoire\./);
                expect(() => inventaire.réserver(null, 3)).to.throw(Error, /Nom d'objet obligatoire\./);
            });

            it("réserver ou libérer une quantité invalide lance une erreur", () => {
                expect(() => inventaire.réserver('Objet1', 0)).to.throw(Error, /Nombre entier strictement positif attendu/);
                expect(() => inventaire.réserver('Objet1', -1)).to.throw(Error, /Nombre entier strictement positif attendu/);
                expect(() => inventaire.réserver('Objet1', 1.5)).to.throw(Error, /Nombre entier strictement positif attendu/);
                inventaire.réserver('Objet1', 2);
                expect(() => inventaire.libérer('Objet1', 0)).to.throw(Error, /Nombre entier strictement positif attendu/);
                expect(() => inventaire.libérer('Objet1', -1)).to.throw(Error, /Nombre entier strictement positif attendu/);
                expect(() => inventaire.libérer('Objet1', 1.5)).to.throw(Error, /Nombre entier strictement positif attendu/);
            });

            it("stock_disponible ne retourne que les objets avec quantité disponible > 0", () => {
                inventaire.ajoute('Objet2', 3);
                inventaire.réserver('Objet2', 3); // tout engagé, plus rien de dispo
                const dispo = inventaire.stock_disponible;
                expect(dispo).to.deep.include({ nom: 'Objet1', quantité: 10 });
                expect(dispo.find(e => e.nom === 'Objet2')).to.be.undefined;
            });

            it("retire vérifie toujours le stock total (pas le disponible)", () => {
                inventaire.réserver('Objet1', 8);
                // stock total = 10, mais disponible = 2 ; retire 5 doit quand même passer
                expect(inventaire.retire('Objet1', 5)).to.equal(5);
                expect(inventaire.quantité_en_stock('Objet1')).to.equal(5);
            });
        });
    });
});