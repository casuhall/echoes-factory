import { expect } from 'chai';
import { Recette, Ingrédient } from '../app/domain.js';
import { Usine } from '../app/service.js';


describe('Usine - Gestion complète', () => {

    beforeEach(() => {
    });

    describe('Comportement attendu d\'une nouvelle usine', () => {
        /**
         * @type {Usine}
         */
        let usine;

        beforeEach(() => { usine = new Usine("Une usine toute neuve"); });

        it('Les catalogues, stocks et marchés sont initialisés à vide', () => {
            expect(usine.produits).to.exist;
            expect(usine.produits.length).to.be.equal(0);
            expect(usine.stock).to.exist;
            expect(usine.stock.length).to.be.equal(0);
            expect(usine.tarifs).to.exist;
            expect(usine.tarifs.length).to.be.equal(0);
        });

        it('L\'ajout d\'une recette initialise le produit correspondant', () => {
            try { // catch des exceptions innatendu pour faire échouer le test
                const recette = new Recette("Épée", 100, [
                    new Ingrédient("Bois", 2),
                    new Ingrédient("Cuir", 1)
                ]);
                usine.ajouteRecette(recette);
            } catch (e) { console.error(e); expect.fail(`Une exception inattendue a été levée lors de l'ajout de la recette : ${e.message}`); }
            expect(usine.produits.length).to.be.equal(1);
            expect(usine.produit("Épée")).to.exist;
            expect(usine.produit("Épée").nom).to.be.equal("Épée");
            // TODO: vérifier que les ingrédients de la recette sont bien transformés en therme de matériaux dans le produit
        });



    });

});