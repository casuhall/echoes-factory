/**
 * Bug condition exploration test + Preservation tests — stylesheet-not-applied-index
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3
 *
 * Bug condition tests:
 *   Encodent le comportement ATTENDU (P1 + P2 du design).
 *   Ils DOIVENT ÉCHOUER sur le code non corrigé : l'échec prouve que le bug existe.
 *   Ils passeront une fois le correctif appliqué (tâche 3).
 *
 * Preservation tests:
 *   Vérifient que tous les autres éléments de index.html restent inchangés.
 *   Ils DOIVENT PASSER sur le code non corrigé (confirment le baseline à préserver).
 *
 * Bug condition: isBugCondition(file) — tag <link> avec href fragmenté sur plusieurs lignes.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import { expect } from 'chai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(__dirname, '..', 'index.html');

describe('Bug condition — stylesheet-not-applied-index', () => {
    let dom;
    let linkEl;

    before(() => {
        const html = readFileSync(indexPath, 'utf-8');
        dom = new JSDOM(html);
        // Sélectionne le tag <link rel="stylesheet">
        linkEl = dom.window.document.querySelector('link[rel="stylesheet"]');
    });

    /**
     * P1 — Le tag <link rel="stylesheet"> possède un attribut href valide (non vide, non nul).
     * Validates: Requirements 1.1
     */
    it('P1 — Le tag <link rel="stylesheet"> possède un attribut href valide sur une seule ligne', () => {
        expect(linkEl, 'Aucun tag <link rel="stylesheet"> trouvé dans index.html').to.not.be.null;
        const href = linkEl.getAttribute('href');
        expect(href, 'L\'attribut href est absent ou nul sur le tag <link>').to.not.be.null;
        expect(href, 'L\'attribut href est vide sur le tag <link>').to.not.equal('');
    });

    /**
     * P2 — La valeur de href est exactement "./style/style.css".
     * Validates: Requirements 1.2, 1.3
     */
    it('P2 — La valeur de href est exactement "./style/style.css"', () => {
        expect(linkEl, 'Aucun tag <link rel="stylesheet"> trouvé dans index.html').to.not.be.null;
        const href = linkEl.getAttribute('href');
        expect(href).to.equal('./style/style.css');
    });
});

describe('Preservation — stylesheet-not-applied-index', () => {
    let dom;
    let document;
    let rawHtml;

    before(() => {
        rawHtml = readFileSync(indexPath, 'utf-8');
        dom = new JSDOM(rawHtml);
        document = dom.window.document;
    });

    /**
     * PR1 — Tous les autres tags du <head> restent inchangés.
     * Validates: Requirements 2.1
     */
    it('PR1a — <title>Gestion de l\'usine</title> est présent et inchangé', () => {
        const title = document.querySelector('title');
        expect(title, 'Le tag <title> est absent').to.not.be.null;
        expect(title.textContent).to.equal("Gestion de l'usine");
    });

    it('PR1b — <meta charset="utf-8" /> est présent', () => {
        const metaCharset = document.querySelector('meta[charset]');
        expect(metaCharset, 'Le tag <meta charset> est absent').to.not.be.null;
        expect(metaCharset.getAttribute('charset')).to.equal('utf-8');
    });

    it('PR1c — <meta name="viewport"> est présent avec le bon contenu', () => {
        const metaViewport = document.querySelector('meta[name="viewport"]');
        expect(metaViewport, 'Le tag <meta name="viewport"> est absent').to.not.be.null;
        expect(metaViewport.getAttribute('content')).to.equal('width=device-width,initial-scale=1');
    });

    /**
     * PR2 — Le <body> (nav, main, footer, scripts) reste intact.
     * Validates: Requirements 2.2
     */
    it('PR2a — La barre de navigation <nav> est présente avec ses liens', () => {
        const nav = document.querySelector('nav');
        expect(nav, 'Le tag <nav> est absent').to.not.be.null;
        expect(document.querySelector('#nav-nomUsine'), '#nav-nomUsine absent').to.not.be.null;
        expect(document.querySelector('#nav-accueil'), '#nav-accueil absent').to.not.be.null;
        expect(document.querySelector('#nav-marché'), '#nav-marché absent').to.not.be.null;
        expect(document.querySelector('#nav-produits'), '#nav-produits absent').to.not.be.null;
        expect(document.querySelector('#nav-stock'), '#nav-stock absent').to.not.be.null;
    });

    it('PR2b — Le <main> est présent avec ses champs de saisie', () => {
        const main = document.querySelector('main');
        expect(main, 'Le tag <main> est absent').to.not.be.null;
        expect(document.querySelector('#input-nomUsine'), '#input-nomUsine absent').to.not.be.null;
        expect(document.querySelector('#input-nbProduits'), '#input-nbProduits absent').to.not.be.null;
        expect(document.querySelector('#input-nbMarché'), '#input-nbMarché absent').to.not.be.null;
        expect(document.querySelector('#input-nbStock'), '#input-nbStock absent').to.not.be.null;
        expect(document.querySelector('#input-liquidités'), '#input-liquidités absent').to.not.be.null;
    });

    it('PR2c — Le <footer> est présent avec le bouton reset', () => {
        const footer = document.querySelector('footer');
        expect(footer, 'Le tag <footer> est absent').to.not.be.null;
        expect(document.querySelector('#button-reset'), '#button-reset absent').to.not.be.null;
    });

    it('PR2d — Le <script type="module"> est présent dans le body', () => {
        const script = document.querySelector('body script[type="module"]');
        expect(script, 'Le tag <script type="module"> est absent du body').to.not.be.null;
    });
});
