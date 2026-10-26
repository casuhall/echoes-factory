import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { Usine } from '../app/service.js';
import { decodeEchoesListe, initialiserElement } from '../app/presentation.js';

describe('Presentation', () => {

    const localStorage = {
        _store: {},
        getItem: function (key) {
            return this._store[key];
        },
        setItem: function (key, value) {
            this._store[key] = value;
        },
        clear: function () {
            for (let key in this._store) {
                delete this._store[key];
            }
        }

    };

    beforeEach(() => {
        localStorage.clear();
        global.document = (new JSDOM()).window.document;
    });

    describe('decodeEchoesListe', () => {
        it('Devrait décoder une liste d objets correctement formatée', () => {
            const input = "1\tObjetA\t2\t10.5\n2\tObjetB\t3\t20.0";
            const expected = [
                { index: "1", nom: "ObjetA", quantité: 2, valeur: 10.5 },
                { index: "2", nom: "ObjetB", quantité: 3, valeur: 20.0 }
            ];
            const result = decodeEchoesListe(input);
            expect(result).to.deep.equal(expected);
        });

        it('Devrait ignorer les lignes mal formatées', () => {
            const input = "1\tObjetA\t2\t10.5\nLigneMalFormattée\n2\tObjetB\t3\t20.0";
            const expected = [
                { index: "1", nom: "ObjetA", quantité: 2, valeur: 10.5 },
                { index: "2", nom: "ObjetB", quantité: 3, valeur: 20.0 }
            ];
            const result = decodeEchoesListe(input);
            expect(result).to.deep.equal(expected);
        });

        it('Devrait décoder le format alternatif TSV sans index', () => {
            const input = `Material\tQuantity\tISK
Tritanium\t568800000\t568800000
Pyerite\t189600000\t379200000
  Reactive Gas\t75171\t15922721
Structure Construction Parts\t3\t299250000`;
            const expected = [
                { index: undefined, nom: "Tritanium", quantité: 568800000, valeur: 568800000 },
                { index: undefined, nom: "Pyerite", quantité: 189600000, valeur: 379200000 },
                { index: undefined, nom: "Structure Construction Parts", quantité: 3, valeur: 299250000 }
            ];
            const result = decodeEchoesListe(input);
            expect(result).to.deep.equal(expected);
        });

        it('Devrait ignorer les sous-sections et les totaux dans le format alternatif', () => {
            const input = `Material\tQuantity\tISK
Blueprints\t\t
Bounty Management Module III Blueprint\t1\t5400000000
Job fees\t\t5400000000
Build cost\t\t44707645253`;
            const expected = [
                { index: undefined, nom: "Bounty Management Module III Blueprint", quantité: 1, valeur: 5400000000 }
            ];
            const result = decodeEchoesListe(input);
            expect(result).to.deep.equal(expected);
        });
    });

    describe(`Outils de générationd d'objets HTML`, () => {
        it('Devrait créer un élément HTML avec les classes et le contenu spécifiés', () => {
            const typeElement = "div";
            const classes = ["class1", "class2"];
            const contenu = "Contenu de test";
            const evenements = [
                { trigger: "click", listener: () => { } }
            ];

            const element = initialiserElement(typeElement, classes, contenu, evenements);

            expect(element.tagName.toLowerCase()).to.equal(typeElement);
            expect(element.classList.contains("class1")).to.be.true;
            expect(element.classList.contains("class2")).to.be.true;
            expect(element.textContent).to.equal(contenu);
        });
    });

    describe.skip('Stockage et récupération de l usine', () => {
        it('Devrait stocker et récupérer une usine correctement', () => {
            const usine = new Usine("Usine Test");
            usine.évaluer("ProduitTest", 100);
            putUsine(usine);
            const retrievedUsine = getUsine();
            expect(retrievedUsine).to.exist;
            expect(retrievedUsine.nom).to.equal("Usine Test");
            expect(retrievedUsine.tarifs).to.deep.equal(usine.tarifs);
        });
    });

});