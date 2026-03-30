import { expect } from 'chai';
import { Recette, Ingrédient, Tarification, Tarif } from '../app/domain.js';
import { Usine } from '../app/service.js';


describe('Usine - Gestion complète', () => {

    describe('Comportement attendu d une nouvelle usine', () => {
        /** @type {Usine} */
        let usine;
        beforeEach(() => {
            usine = new Usine("Usine Vide");
        });

        it('Sur une usine vide, Les catalogues, stocks et marchés sont initialisés à vide', () => {
            expect(usine.produits).to.exist;
            expect(usine.produits.length).to.be.equal(0);
            expect(usine.stock).to.exist;
            expect(usine.stock.length).to.be.equal(0);
            expect(usine.tarifs).to.exist;
            expect(usine.tarifs.length).to.be.equal(0);
        });

        it('Evaluer un objet mets à disposition son tarif', () => {
            usine.évaluer("ObjetTest", 1500);
            const tarif = usine.tarifs.find(t => t.nom === "ObjetTest");
            expect(tarif).to.exist;
            expect(tarif.montant).to.be.equal(1500);
        });

        it('L ajout d une recette initialise le produit correspondant', () => {
            try { // catch des exceptions innatendu pour faire échouer le test
                const recette = new Recette("Épée", 100, [
                    new Ingrédient("Bois", 2),
                    new Ingrédient("Cuir", 1)
                ]);
                usine.ajouteProduit(recette);
            } catch (e) { console.error(e); expect.fail(`Une exception inattendue a été levée lors de l'ajout de la recette : ${e.message}`); }
            const produit_épée = usine.produit("Épée");
            expect(produit_épée).to.exist;
            expect(produit_épée.nom).to.be.equal("Épée");
        });
    });

    describe('Comportement attendu d une usine préexistante', () => {

        /** @type {Usine} */
        let usine;
        /** @type {Recette} */
        let recette_simple, recette_non_tarifée, recette_complexe;

        beforeEach(() => {
            recette_simple = new Recette('Simple', 50, [
                new Ingrédient('Ingredient1', 2),
                new Ingrédient('Ingredient2', 3)
            ]);
            recette_complexe = new Recette('Complexe', 50, [
                new Ingrédient('Simple', 2)
            ]);
            recette_non_tarifée = new Recette('NonTarifée', 50, [
                new Ingrédient('IngredientInconnu1', 2),
                new Ingrédient('IngredientInconnu2', 3)
            ]);
            usine = new Usine("Une usine toute neuve", undefined,
                [recette_simple, recette_non_tarifée, recette_complexe],
                [new Tarif('Ingredient1', 10), new Tarif('Ingredient2', 20), new Tarif('Simple', 180), new Tarif("Complexe", 300)],);
        });

        it('Les produits créés à l initialisation sont tarifés correctement', () => {
            const produit_simple = usine.produit("Simple");
            expect(produit_simple).to.exist;
            expect(produit_simple.prix_estimé).to.equal(180);
            expect(produit_simple.coût_reviens).to.equal(130); // 50 + 2*10 + 3*20 = 130
            expect(produit_simple.rentabilité).to.equal(0.38); // (180-130)/130 = 50/130 = 0.3846... => 0.38
            const produit_complexe = usine.produit("Complexe");
            expect(produit_complexe).to.exist;
            expect(produit_complexe.prix_estimé).to.equal(300);
            expect(produit_complexe.coût_reviens).to.equal(310); // 50 + 2*130 = 310
            expect(produit_complexe.rentabilité).to.equal(-0.03); // (300-310)/310 = -10/310 = -0,032258... => -0.03
        });

        it('Les produits non tarifés à l initialisation n ont pas de coût de revient calculé', () => {
            const produit_non_tarifée = usine.produit("NonTarifée");
            expect(produit_non_tarifée).to.exist;
            expect(produit_non_tarifée.coût_reviens).to.be.undefined;
        });

        it('Mettre à jour le tarif d un ingrédient recalcule le coût de revient des produits qui en dépendent', () => {
            usine.évaluer("Ingredient1", 15);
            const produit_simple = usine.produit("Simple");
            expect(produit_simple.coût_reviens).to.equal(140); // 50 + 2*15 + 3*20 = 140        
        });

        it('Il est possible de sérialiser et désérialiser une usine sans perdre d information', () => {
            const usine_sérialisée = usine.toString();
            const usine_désérialisée = Usine.parse(usine_sérialisée);
            expect(usine_désérialisée).to.exist;
            expect(usine_désérialisée.nom).to.equal(usine.nom);
            expect(usine_désérialisée.produits.length).to.equal(usine.produits.length);
            expect(usine_désérialisée.tarifs.length).to.equal(usine.tarifs.length);
            expect(usine_désérialisée.stock.length).to.equal(usine.stock.length);
            for (let i = 0; i < usine.produits.length; i++) {
                const produit_original = usine.produits[i];
                const produit_désérialisé = usine_désérialisée.produits[i];
                expect(produit_désérialisé.nom).to.equal(produit_original.nom);
                expect(produit_désérialisé.coût_reviens).to.equal(produit_original.coût_reviens);
                expect(produit_désérialisé.prix_estimé).to.equal(produit_original.prix_estimé);
            }
            for (let i = 0; i < usine.tarifs.length; i++) {
                const tarif_original = usine.tarifs[i];
                const tarif_désérialisé = usine_désérialisée.tarifs[i];
                expect(tarif_désérialisé.nom).to.equal(tarif_original.nom);
                expect(tarif_désérialisé.montant).to.equal(tarif_original.montant);
            }
            for (let i = 0; i < usine.stock.length; i++) {
                const stock_original = usine.stock[i];
                const stock_désérialisé = usine_désérialisée.stock[i];
                expect(stock_désérialisé.nom).to.equal(stock_original.nom);
                expect(stock_désérialisé.quantité).to.equal(stock_original.quantité);
            }
        });

        it("Un produit existant doit pouvoir être supprimer. La suppréssion doit se répercuter sur les autres produits si nécessaires", () => {
            // Aucune erreur ne devrait être produite à la supression d'un produit existant
            usine.supprimerProduit("Simple");
            // Le produit restant composé à partir du produit supprimé doit être mis à jour suite à cette supression
            const produit_complexe = usine.produit("Complexe");
            expect(produit_complexe).to.exist;
            expect(produit_complexe.prix_estimé).to.equal(300);
            expect(produit_complexe.coût_reviens).to.equal(410); // 50 + 2*180 = 410
            expect(produit_complexe.rentabilité).to.equal(-0.27); // (300-410)/410 = -110/410 = -0,2682926... => -0,27
        });

        it("La modification d'une recette permet la réévaluation des produits associés", () => {
            usine.modifieProduit(new Recette('Simple', 50, [
                new Ingrédient('Ingredient1', 1),
                new Ingrédient('Ingredient2', 2)
            ]));
            const produit_simple = usine.produit("Simple");
            expect(produit_simple).to.exist;
            expect(produit_simple.prix_estimé).to.equal(180);
            expect(produit_simple.coût_reviens).to.equal(100); // 50 + 1*10 + 2*20 = 100
            expect(produit_simple.rentabilité).to.equal(0.8); // (180-100)/100 = 80/100 = 0.8
            const produit_complexe = usine.produit("Complexe");
            expect(produit_complexe).to.exist;
            expect(produit_complexe.prix_estimé).to.equal(300);
            expect(produit_complexe.coût_reviens).to.equal(250); // 50 + 2*100 = 250
            expect(produit_complexe.rentabilité).to.equal(0.2); // (300-250)/250 = -50/250 = 0,2
         });
    });

    describe("Fiabilisation de l'initialisation d'une usine existante", () => {
        it('L initialisation d une usine avec des recettes dont les ingrédients ne sont pas tarifés ne doit pas échouer', () => {
            try {
                const recette_non_tarifée = new Recette('NonTarifée', 50, [
                    new Ingrédient('IngredientInconnu1', 2),
                    new Ingrédient('IngredientInconnu2', 3)
                ]);
                const usine = new Usine("Usine avec recette non tarifée", undefined,
                    [recette_non_tarifée],
                    [new Tarif('IngredientInconnu1', 10)],);
                expect(usine).to.exist;
                const produit_non_tarifée = usine.produit("NonTarifée");
                expect(produit_non_tarifée).to.exist;
                expect(produit_non_tarifée.coût_reviens).to.be.undefined;
            } catch (e) {
                console.error(e);
                expect.fail(`Une exception inattendue a été levée lors de l'initialisation de l'usine : ${e.message}`);
            }
        });

        it("L'initialisation d'une usinene devrait pas dépendre des types des données mais bien de leur valeur", () => {
            try {
                const recette_non_tarifée = {
                    nom: 'RecetteAvecQuantitéInvalide', frais: "200", ingrédients: [
                        { nom: 'IngredientConnu1', quantité: "2" },
                        { nom: 'IngredientConnu2', quantité: "3" }
                    ]
                };
                const usine = new Usine("Usine avec recette non standard", undefined,
                    [recette_non_tarifée],
                    [{ nom: 'IngredientConnu1', montant: "10" }, { nom: 'IngredientConnu2', montant: "20" }],);
                expect(usine).to.exist;
                const produit_non_tarifée = usine.produit("RecetteAvecQuantitéInvalide");
                expect(produit_non_tarifée).to.exist;
                expect(produit_non_tarifée.coût_reviens).to.be.equal(200 + 2 * 10 + 3 * 20); // 200 + 2*10 + 3*20 = 260
            } catch (e) {
                console.error(e);
                expect.fail(`Une exception inattendue a été levée lors de l'initialisation de l'usine : ${e.message}`);
            }
        });
    });

});