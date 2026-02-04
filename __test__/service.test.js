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
                usine.ajouteRecette(recette);
            } catch (e) { console.error(e); expect.fail(`Une exception inattendue a été levée lors de l'ajout de la recette : ${e.message}`); }
            const produit_épée = usine.produit("Épée");
            expect(produit_épée).to.exist;
            expect(produit_épée.nom).to.be.equal("Épée");
        });
    });

    describe('Comportement attendu d une usine préexistante', () => {

        /** @type {Usine} */
        let usine;
        /** @type {Tarification} */
        let marché;
        /** @type {Recette} */
        let recette_simple, recette_non_tarifée;

        beforeEach(() => {
            recette_simple = new Recette('Simple', 50, [
                new Ingrédient('Ingredient1', 2),
                new Ingrédient('Ingredient2', 3)
            ]);
            recette_non_tarifée = new Recette('NonTarifée', 50, [
                new Ingrédient('IngredientInconnu1', 2),
                new Ingrédient('IngredientInconnu2', 3)
            ]);
            usine = new Usine("Une usine toute neuve", undefined,
                [recette_simple, recette_non_tarifée],
                [new Tarif('Ingredient1', 10), new Tarif('Ingredient2', 20), new Tarif('Simple', 180)],);
        });

        it('Les produits créés à l initialisation sont tarifés correctement', () => {
            const produit_simple = usine.produit("Simple");
            expect(produit_simple).to.exist;
            expect(produit_simple.prix_estimé).to.equal(180); // 180
            expect(produit_simple.coût_reviens).to.equal(130); // 50 + 2*10 + 3*20 = 130
            expect(produit_simple.rentabilité).to.equal(0.38); // (180-130)/130 = 50/130 = 0.3846... => 0.38
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
    });

});