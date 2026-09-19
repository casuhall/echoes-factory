import { expect } from 'chai';
import { Usine } from '../app/service.js';
import { decodeEchoesListe } from '../app/presentation.js';

describe('Presentation', () => {

    const localStorage = {
        _store: {},
         getItem: function(key) {
            return this._store[key];
        },
        setItem: function(key, value) {
            this._store[key] = value;
        },
        clear: function() {
            for (let key in this._store) {
                delete this._store[key];
            }
        }

    };

    beforeEach(() => {
        localStorage.clear();
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