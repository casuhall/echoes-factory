import { expect } from 'chai';
import { filtrerProduits, trierProduits } from '../app/produitsSortFilter.js';

describe('produitsSortFilter', () => {

    // Jeu de données représentatif :
    //   - Argent         : BUILD, rentabilité 0.25, gain positif
    //   - Bronze         : BUY,   rentabilité -0.10, gain négatif
    //   - Cuivre         : BUILD, rentabilité 0.05, gain faible
    //   - Destrier (NA)  : NA,    rentabilité undefined (pas de prix estimé)
    const produits = [
        { nom: "Argent",  rentabilité: 0.25, prix_estimé: 500,  coût_reviens: 400,  statut: "BUILD", commentaire: "Commercialisable" },
        { nom: "Bronze",  rentabilité: -0.10, prix_estimé: 180, coût_reviens: 200,  statut: "BUY",   commentaire: "Ne pas produire" },
        { nom: "Cuivre",  rentabilité: 0.05, prix_estimé: 210,  coût_reviens: 200,  statut: "BUILD", commentaire: "Pour consommation interne" },
        { nom: "Destrier", rentabilité: undefined, prix_estimé: undefined, coût_reviens: 300, statut: "NA", commentaire: "Rentabilité incalculable : prix estimé inconnu." },
    ];

    // ─── filtrerProduits ────────────────────────────────────────────────────────

    describe('filtrerProduits', () => {
        it('Devrait retourner tous les produits pour une recherche vide', () => {
            const résultat = filtrerProduits(produits, '');
            expect(résultat).to.have.lengthOf(produits.length);
        });

        it('Devrait filtrer par correspondance partielle insensible à la casse', () => {
            const résultat = filtrerProduits(produits, 'br');
            expect(résultat).to.have.lengthOf(1);
            expect(résultat[0].nom).to.equal('Bronze');
        });

        it('Devrait être insensible à la casse (majuscules)', () => {
            const résultat = filtrerProduits(produits, 'ARG');
            expect(résultat).to.have.lengthOf(1);
            expect(résultat[0].nom).to.equal('Argent');
        });

        it('Devrait retourner un tableau vide si aucun produit ne correspond', () => {
            const résultat = filtrerProduits(produits, 'zéolite');
            expect(résultat).to.have.lengthOf(0);
        });

        it('Ne devrait pas modifier le tableau original', () => {
            const copie = [...produits];
            filtrerProduits(produits, 'bronze');
            expect(produits).to.deep.equal(copie);
        });
    });

    // ─── trierProduits ──────────────────────────────────────────────────────────

    describe('trierProduits — colonne "nom"', () => {
        it('Devrait trier par nom croissant (asc)', () => {
            const résultat = trierProduits(produits, 'nom', 'asc');
            const noms = résultat.map(p => p.nom);
            expect(noms).to.deep.equal(['Argent', 'Bronze', 'Cuivre', 'Destrier']);
        });

        it('Devrait trier par nom décroissant (desc)', () => {
            const résultat = trierProduits(produits, 'nom', 'desc');
            const noms = résultat.map(p => p.nom);
            expect(noms).to.deep.equal(['Destrier', 'Cuivre', 'Bronze', 'Argent']);
        });

        it('Devrait alterner entre croissant et décroissant sur deux appels successifs', () => {
            const asc  = trierProduits(produits, 'nom', 'asc').map(p => p.nom);
            const desc = trierProduits(produits, 'nom', 'desc').map(p => p.nom);
            expect(asc).to.deep.equal([...desc].reverse());
        });

        it('Ne devrait pas modifier le tableau original', () => {
            const nomAvant = produits[0].nom;
            trierProduits(produits, 'nom', 'asc');
            expect(produits[0].nom).to.equal(nomAvant);
        });
    });

    describe('trierProduits — colonne "rentabilité"', () => {
        it('Devrait trier par rentabilité croissante (asc) — NA en dernier', () => {
            const résultat = trierProduits(produits, 'rentabilité', 'asc');
            const noms = résultat.map(p => p.nom);
            // Bronze (-0.10) < Cuivre (0.05) < Argent (0.25) < Destrier (NA = -Infinity → bottom)
            expect(noms[0]).to.equal('Bronze');
            expect(noms[1]).to.equal('Cuivre');
            expect(noms[2]).to.equal('Argent');
            expect(noms[3]).to.equal('Destrier');
        });

        it('Devrait trier par rentabilité décroissante (desc) — NA en dernier', () => {
            const résultat = trierProduits(produits, 'rentabilité', 'desc');
            const noms = résultat.map(p => p.nom);
            // Argent (0.25) > Cuivre (0.05) > Bronze (-0.10) > Destrier (NA)
            expect(noms[0]).to.equal('Argent');
            expect(noms[1]).to.equal('Cuivre');
            expect(noms[2]).to.equal('Bronze');
            expect(noms[3]).to.equal('Destrier');
        });

        it('Devrait toujours placer les produits NA (rentabilité undefined) en dernier, quelle que soit la direction', () => {
            const asc  = trierProduits(produits, 'rentabilité', 'asc');
            const desc = trierProduits(produits, 'rentabilité', 'desc');
            expect(asc.at(-1).statut).to.equal('NA');
            expect(desc.at(-1).statut).to.equal('NA');
        });
    });

    describe('trierProduits — colonne "gain"', () => {
        it('Devrait trier par gain (prix_estimé - coût_reviens) croissant', () => {
            // gains : Bronze 180-200=-20, Destrier 0-300=-300, Cuivre 210-200=10, Argent 500-400=100
            const résultat = trierProduits(produits, 'gain', 'asc');
            const noms = résultat.map(p => p.nom);
            expect(noms).to.deep.equal(['Destrier', 'Bronze', 'Cuivre', 'Argent']);
        });

        it('Devrait trier par gain décroissant', () => {
            const résultat = trierProduits(produits, 'gain', 'desc');
            const noms = résultat.map(p => p.nom);
            expect(noms).to.deep.equal(['Argent', 'Cuivre', 'Bronze', 'Destrier']);
        });
    });

    describe('trierProduits — alternance croissant / décroissant', () => {
        it('Un deuxième clic sur "nom" doit inverser l ordre', () => {
            // Simule deux clics : état initial asc, second clic → desc
            const premierTri  = trierProduits(produits, 'nom', 'asc').map(p => p.nom);
            const deuxièmeTri = trierProduits(produits, 'nom', 'desc').map(p => p.nom);
            expect(premierTri).to.deep.equal([...deuxièmeTri].reverse());
        });

        it('Un deuxième clic sur "rentabilité" doit inverser l ordre (hors NA)', () => {
            const asc  = trierProduits(produits, 'rentabilité', 'asc').slice(0, -1).map(p => p.nom);
            const desc = trierProduits(produits, 'rentabilité', 'desc').slice(0, -1).map(p => p.nom);
            expect(asc).to.deep.equal([...desc].reverse());
        });

        it('Un deuxième clic sur "gain" doit inverser l ordre', () => {
            const asc  = trierProduits(produits, 'gain', 'asc').map(p => p.nom);
            const desc = trierProduits(produits, 'gain', 'desc').map(p => p.nom);
            expect(asc).to.deep.equal([...desc].reverse());
        });
    });

    describe('trierProduits — cas limites', () => {
        it('Devrait retourner un tableau vide inchangé', () => {
            expect(trierProduits([], 'nom', 'asc')).to.deep.equal([]);
        });

        it('Devrait retourner un tableau d un seul élément inchangé', () => {
            const résultat = trierProduits([produits[0]], 'rentabilité', 'asc');
            expect(résultat).to.deep.equal([produits[0]]);
        });
    });

});
