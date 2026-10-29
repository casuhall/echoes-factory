import { expect } from 'chai';
import { I18n } from '../app/i18n.js';

describe('I18n', () => {

    let originalFetch;

    beforeEach(() => {
        originalFetch = global.fetch;
        global.localStorage = {
            _store: {},
            getItem: function (key) { return this._store[key]; },
            setItem: function (key, value) { this._store[key] = value; },
            clear: function () { for (let key in this._store) delete this._store[key]; }
        };
    });

    afterEach(() => {
        global.fetch = originalFetch;
        localStorage.clear();
    });

    it('Devrait utiliser le français par défaut', () => {
        const i18n = new I18n();
        expect(i18n.locale).to.equal('fr');
    });

    it('Devrait charger les traductions', async () => {
        global.fetch = async (url) => {
            return {
                ok: true,
                json: async () => ({ "test.clé": "Valeur test" })
            };
        };
        const i18n = new I18n();
        await i18n.charger('fr');
        expect(i18n.t('test.clé')).to.equal('Valeur test');
    });

    it('Devrait retourner la clé si la traduction n\'existe pas', async () => {
        global.fetch = async (url) => {
            return {
                ok: true,
                json: async () => ({})
            };
        };
        const i18n = new I18n();
        await i18n.charger('fr');
        expect(i18n.t('clé.inexistante')).to.equal('clé.inexistante');
    });

    it('Devrait interpoler les paramètres', async () => {
        global.fetch = async (url) => {
            return {
                ok: true,
                json: async () => ({ "msg": "Bonjour {nom}" })
            };
        };
        const i18n = new I18n();
        await i18n.charger('fr');
        expect(i18n.t('msg', { nom: 'Benjamin' })).to.equal('Bonjour Benjamin');
    });

    it('Devrait lister les locales disponibles', () => {
        const i18n = new I18n();
        expect(i18n.localesDisponibles).to.include('fr');
        expect(i18n.localesDisponibles).to.include('en');
        expect(i18n.localesDisponibles).to.include('de');
        expect(i18n.localesDisponibles).to.include('es');
    });

});
