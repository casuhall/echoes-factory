import { expect } from 'chai';
import { filtrerStock, trierStock } from '../app/stockSortFilter.js';

describe('Stock — filtrage et tri', () => {

    const articles = [
        { nom: 'Tritanium', quantité: 500 },
        { nom: 'Pyerite', quantité: 200 },
        { nom: 'Mexallon', quantité: 350 },
        { nom: 'tritanium raffiné', quantité: 50 },
    ];

    // ── filtrerStock ──────────────────────────────────────────────────────────

    describe('filtrerStock', () => {

        it('Devrait retourner tous les articles si la recherche est vide', () => {
            const résultat = filtrerStock(articles, '');
            expect(résultat).to.deep.equal(articles);
        });

        it('Devrait retourner les articles dont le nom contient la saisie (correspondance partielle)', () => {
            const résultat = filtrerStock(articles, 'ite');
            expect(résultat).to.deep.equal([{ nom: 'Pyerite', quantité: 200 }]);
        });

        it('Devrait être insensible à la casse', () => {
            const résultat = filtrerStock(articles, 'TRIT');
            expect(résultat).to.have.lengthOf(2);
            expect(résultat.map(a => a.nom)).to.include.members(['Tritanium', 'tritanium raffiné']);
        });

        it('Devrait retourner un tableau vide si aucun article ne correspond', () => {
            const résultat = filtrerStock(articles, 'zzzinexistant');
            expect(résultat).to.be.an('array').that.is.empty;
        });

        it('Ne devrait pas modifier le tableau d\'origine', () => {
            const copie = [...articles];
            filtrerStock(articles, 'Tri');
            expect(articles).to.deep.equal(copie);
        });
    });

    // ── trierStock ────────────────────────────────────────────────────────────

    describe('trierStock', () => {

        it('Devrait trier par nom en ordre croissant', () => {
            const résultat = trierStock(articles, 'nom', 'asc');
            const noms = résultat.map(a => a.nom);
            expect(noms).to.deep.equal([...noms].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
        });

        it('Devrait trier par nom en ordre décroissant', () => {
            const résultat = trierStock(articles, 'nom', 'desc');
            const noms = résultat.map(a => a.nom);
            const triCroissant = trierStock(articles, 'nom', 'asc').map(a => a.nom);
            expect(noms).to.deep.equal([...triCroissant].reverse());
        });

        it('Devrait trier par quantité en ordre croissant', () => {
            const résultat = trierStock(articles, 'quantité', 'asc');
            const quantités = résultat.map(a => a.quantité);
            expect(quantités).to.deep.equal([...quantités].sort((a, b) => a - b));
        });

        it('Devrait trier par quantité en ordre décroissant', () => {
            const résultat = trierStock(articles, 'quantité', 'desc');
            const quantités = résultat.map(a => a.quantité);
            const triCroissant = trierStock(articles, 'quantité', 'asc').map(a => a.quantité);
            expect(quantités).to.deep.equal([...triCroissant].reverse());
        });

        it('Devrait alterner correctement entre croissant et décroissant (simulation de double clic)', () => {
            const triAsc = trierStock(articles, 'nom', 'asc').map(a => a.nom);
            const triDesc = trierStock(articles, 'nom', 'desc').map(a => a.nom);
            expect(triAsc).to.deep.equal([...triDesc].reverse());
        });

        it('Ne devrait pas modifier le tableau d\'origine', () => {
            const copie = [...articles];
            trierStock(articles, 'nom', 'asc');
            expect(articles).to.deep.equal(copie);
        });
    });

});
