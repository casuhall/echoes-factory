import { expect } from 'chai';
import { Usine, Recette, Tarif, Inventaire, Catalogue, Produit, Tarification } from '../app/domain.js';

describe('Usine - Gestion complète', () => {

    beforeEach(() => {
    });

    describe('Comportement attendu d\'une nouvelle usine', () => {
        /**
         * @type {Usine}
         */
        let usine;

        beforeEach(() => { usine = new Usine("Une usine toute neuve"); });

        it('Les catalogues, recettes et stocks sont initialisés à vide', () => {
            expect(usine.recettes).to.exist;
            expect(usine.recettes.length).to.be.equal(0);
            expect(usine.produits).to.exist;
            expect(usine.produits.length).to.be.equal(0);
            expect(usine.stock).to.exist;
            expect(usine.stock.length).to.be.equal(0);
        });

        it('L\'ajout d\'une recette initialise le produit correspondant', () => {
            const recette = new Recette("Épée", 100, [
                { nom: "Fer", quantité: 3 },
                { nom: "Cuir", quantité: 1 }
            ]);
            usine.ajouteRecette(recette);
            expect(usine.produits.length).to.be.equal(1);
            expect(usine.produit("Épée")).to.exist;
            expect(usine.produit("Épée").nom).to.be.equal("Épée");
            expect(usine.produit("Épée").).to.exist;
        });


    });

});