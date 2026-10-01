import { expect } from 'chai';
import { filtrerTarifs, trierTarifs } from '../app/marchéSortFilter.js';

describe('Marché — tri et filtre', () => {

    // Jeu de données de référence
    const tarifA = { nom: "Acier", montant: 100, date_effet: new Date("2024-01-15") };
    const tarifB = { nom: "Bronze", montant: 50, date_effet: new Date("2024-03-01") };
    const tarifC = { nom: "Cuivre", montant: 200, date_effet: new Date("2024-02-10") };
    const tarifD = { nom: "acier raffiné", montant: 150, date_effet: new Date("2024-01-20") };
    const tarifs = [tarifA, tarifB, tarifC, tarifD];

    // ─── filtrerTarifs ───────────────────────────────────────────────────────

    describe('filtrerTarifs', () => {

        it('Devrait retourner tous les tarifs pour une recherche vide', () => {
            expect(filtrerTarifs(tarifs, "")).to.deep.equal(tarifs);
        });

        it('Devrait retourner tous les tarifs pour une recherche composée uniquement d espaces', () => {
            expect(filtrerTarifs(tarifs, "   ")).to.deep.equal(tarifs);
        });

        it('Devrait filtrer par correspondance partielle sur le nom', () => {
            const résultat = filtrerTarifs(tarifs, "cier");
            expect(résultat).to.deep.include(tarifA);
            expect(résultat).to.deep.include(tarifD);
            expect(résultat).to.have.lengthOf(2);
        });

        it('Devrait être insensible à la casse', () => {
            const résultatMinuscules = filtrerTarifs(tarifs, "acier");
            const résultatMajuscules = filtrerTarifs(tarifs, "ACIER");
            expect(résultatMinuscules).to.deep.equal(résultatMajuscules);
            expect(résultatMinuscules).to.have.lengthOf(2);
        });

        it('Devrait retourner un tableau vide si aucun tarif ne correspond', () => {
            expect(filtrerTarifs(tarifs, "Platine")).to.deep.equal([]);
        });

        it('Devrait retourner un tableau vide pour un tableau d entrée vide', () => {
            expect(filtrerTarifs([], "Acier")).to.deep.equal([]);
        });

        it('Ne devrait pas modifier le tableau d origine', () => {
            const copie = [...tarifs];
            filtrerTarifs(tarifs, "cier");
            expect(tarifs).to.deep.equal(copie);
        });

    });

    // ─── trierTarifs ─────────────────────────────────────────────────────────

    describe('trierTarifs', () => {

        describe('par nom', () => {

            it('Devrait trier par nom en ordre croissant', () => {
                const résultat = trierTarifs(tarifs, "nom", "asc");
                // "Acier" et "acier raffiné" viennent avant "Bronze" et "Cuivre"
                // localeCompare fr insensible à la casse : Acier < acier raffiné < Bronze < Cuivre
                expect(résultat[0].nom.toLowerCase()).to.include("acier");
                expect(résultat[résultat.length - 1].nom).to.equal("Cuivre");
            });

            it('Devrait trier par nom en ordre décroissant', () => {
                const résultat = trierTarifs(tarifs, "nom", "desc");
                expect(résultat[0].nom).to.equal("Cuivre");
                expect(résultat[résultat.length - 1].nom.toLowerCase()).to.include("acier");
            });

            it('Devrait alterner entre croissant et décroissant sur la même colonne', () => {
                const asc = trierTarifs(tarifs, "nom", "asc");
                const desc = trierTarifs(tarifs, "nom", "desc");
                expect(asc[0]).to.deep.equal(desc[desc.length - 1]);
                expect(asc[asc.length - 1]).to.deep.equal(desc[0]);
            });

        });

        describe('par prix', () => {

            it('Devrait trier par montant en ordre croissant', () => {
                const résultat = trierTarifs(tarifs, "prix", "asc");
                expect(résultat[0].montant).to.equal(50);
                expect(résultat[résultat.length - 1].montant).to.equal(200);
            });

            it('Devrait trier par montant en ordre décroissant', () => {
                const résultat = trierTarifs(tarifs, "prix", "desc");
                expect(résultat[0].montant).to.equal(200);
                expect(résultat[résultat.length - 1].montant).to.equal(50);
            });

            it('Devrait alterner entre croissant et décroissant sur la colonne prix', () => {
                const asc = trierTarifs(tarifs, "prix", "asc");
                const desc = trierTarifs(tarifs, "prix", "desc");
                expect(asc[0]).to.deep.equal(desc[desc.length - 1]);
            });

        });

        describe('par date', () => {

            it('Devrait trier par date d effet en ordre croissant (du plus ancien au plus récent)', () => {
                const résultat = trierTarifs(tarifs, "date", "asc");
                expect(résultat[0].date_effet).to.deep.equal(new Date("2024-01-15"));
                expect(résultat[résultat.length - 1].date_effet).to.deep.equal(new Date("2024-03-01"));
            });

            it('Devrait trier par date d effet en ordre décroissant (du plus récent au plus ancien)', () => {
                const résultat = trierTarifs(tarifs, "date", "desc");
                expect(résultat[0].date_effet).to.deep.equal(new Date("2024-03-01"));
                expect(résultat[résultat.length - 1].date_effet).to.deep.equal(new Date("2024-01-15"));
            });

            it('Devrait alterner entre croissant et décroissant sur la colonne date', () => {
                const asc = trierTarifs(tarifs, "date", "asc");
                const desc = trierTarifs(tarifs, "date", "desc");
                expect(asc[0]).to.deep.equal(desc[desc.length - 1]);
                expect(asc[asc.length - 1]).to.deep.equal(desc[0]);
            });

        });

        it('Ne devrait pas modifier le tableau d origine', () => {
            const copie = [...tarifs];
            trierTarifs(tarifs, "nom", "asc");
            expect(tarifs).to.deep.equal(copie);
        });

        it('Devrait retourner un tableau vide pour un tableau d entrée vide', () => {
            expect(trierTarifs([], "nom", "asc")).to.deep.equal([]);
        });

    });

});
