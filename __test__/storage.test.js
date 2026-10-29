import { expect } from 'chai';
import { Usine } from '../app/service.js';
import { Stockage, associerPantry, StockagePantry } from '../app/storage.js';

describe('Stockage', () => {

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
        global.localStorage = localStorage;
    });

    it('Devrait stocker et récupérer une usine correctement', async () => {
        const usine = new Usine("Usine Test");
        usine.évaluer("ProduitTest", 100);
        const stockage = new Stockage();
        await stockage.sauvegarderUsine(usine);
        const retrievedUsine = Usine.parse(await stockage.lireUsine());
        expect(retrievedUsine).to.exist;
        expect(retrievedUsine.nom).to.equal("Usine Test");
        expect(retrievedUsine.tarifs).to.deep.equal(usine.tarifs);
    });

});

describe('StockagePantry', () => {

    let originalFetch;

    beforeEach(() => {
        originalFetch = global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('Devrait lire les données du Pantry (200)', async () => {
        global.fetch = async (url, options) => {
            return {
                status: 200,
                ok: true,
                json: async () => ({ usine: '{"nom":"Pantry Usine"}' })
            };
        };
        const pantry = new StockagePantry('test-id');
        const résultat = await pantry.lire('usine');
        expect(résultat).to.equal('{"nom":"Pantry Usine"}');
    });

    it('Devrait retourner null si le Pantry est vide (404)', async () => {
        global.fetch = async (url, options) => {
            return {
                status: 404,
                ok: false
            };
        };
        const pantry = new StockagePantry('test-id');
        const résultat = await pantry.lire('usine');
        expect(résultat).to.be.null;
    });

    it('Devrait lancer une erreur en cas d erreur réseau', async () => {
        global.fetch = async (url, options) => {
            throw new Error('Network error');
        };
        const pantry = new StockagePantry('test-id');
        try {
            await pantry.lire('usine');
            expect.fail('Devrait lancer une erreur');
        } catch (e) {
            expect(e.message).to.include('Network error');
        }
    });

    it('Devrait sauvegarder les données dans le Pantry (POST)', async () => {
        let capturedBody = null;
        global.fetch = async (url, options) => {
            capturedBody = JSON.parse(options.body);
            return {
                status: 200,
                ok: true
            };
        };
        const pantry = new StockagePantry('test-id');
        await pantry.sauvegarder('usine', '{"nom":"Test"}');
        expect(capturedBody).to.deep.equal({ usine: '{"nom":"Test"}' });
    });

    it('Devrait supprimer les données du Pantry (DELETE)', async () => {
        let capturedMethod = null;
        global.fetch = async (url, options) => {
            capturedMethod = options.method;
            return {
                status: 204,
                ok: true
            };
        };
        const pantry = new StockagePantry('test-id');
        await pantry.supprimer('usine');
        expect(capturedMethod).to.equal('DELETE');
    });

});
