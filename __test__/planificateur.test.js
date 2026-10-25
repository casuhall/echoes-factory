import { expect } from 'chai';
import { Recette, Ingrédient, Tarif } from '../app/domain.js';
import { Usine } from '../app/service.js';
import { Planificateur } from '../app/planificateur.js';

describe('Planificateur', () => {

    // ─────────────────────────────────────────────────────────────────────────
    // Cas 1 : Composant absent du catalogue → décision BUY
    // ─────────────────────────────────────────────────────────────────────────
    describe('Cas 1 — Composant absent du catalogue (BUY)', () => {
        /** @type {Usine} */
        let usine;
        /** @type {Planificateur} */
        let planificateur;

        beforeEach(() => {
            // Épée (frais=50, quantité_produite=1) contient Acier×3
            // Acier n'est PAS dans le catalogue mais a un tarif de 100
            const recetteÉpée = new Recette('Épée', 50, [
                new Ingrédient('Acier', 3)
            ]);
            usine = new Usine('Usine Test BUY', undefined,
                [recetteÉpée],
                [new Tarif('Acier', 100), new Tarif('Épée', 500)]
            );
            planificateur = new Planificateur(usine);
        });

        it('planifier("Épée", 2) retourne 1 étape BUY pour Acier avec quantité=6 et coût=600', () => {
            const plan = planificateur.planifier('Épée', 2);

            expect(plan.étapes).to.have.length(1);
            const étape = plan.étapes[0];
            expect(étape.nom).to.equal('Acier');
            expect(étape.quantité).to.equal(6);       // 3 × 2
            expect(étape.décision).to.equal('BUY');
            expect(étape.coût).to.equal(600);          // 100 × 6
        });

        it('planifier("Épée", 2) retourne un coût_total = coût_acier + frais × cycles', () => {
            const plan = planificateur.planifier('Épée', 2);

            // cycles = ceil(2/1) = 2 ; frais = 50 ; coût_acier = 600
            const coût_attendu = 600 + 50 * 2;
            expect(plan.coût_total).to.equal(coût_attendu);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Cas 2 : Composant avec statut BUILD → décision BUILD
    // ─────────────────────────────────────────────────────────────────────────
    describe('Cas 2 — Composant avec statut BUILD', () => {
        /** @type {Usine} */
        let usine;
        /** @type {Planificateur} */
        let planificateur;

        beforeEach(() => {
            // Corde (frais=50, Chanvre×5, tarif Corde=200, tarif Chanvre=10)
            //   coût_reviens = 50 + 5×10 = 100
            //   rentabilité  = (200/100) - 1 = 1.0 → statut BUILD
            // Arc (frais=100, Corde×2, tarif Arc=600)
            const recetteCorde = new Recette('Corde', 50, [
                new Ingrédient('Chanvre', 5)
            ]);
            const recetteArc = new Recette('Arc', 100, [
                new Ingrédient('Corde', 2)
            ]);
            usine = new Usine('Usine Test BUILD', undefined,
                [recetteCorde, recetteArc],
                [new Tarif('Chanvre', 10), new Tarif('Corde', 200), new Tarif('Arc', 600)]
            );
            planificateur = new Planificateur(usine);
        });

        it('planifier("Arc", 1) retourne 1 étape BUILD pour Corde', () => {
            const plan = planificateur.planifier('Arc', 1);

            expect(plan.étapes).to.have.length(1);
            const étape = plan.étapes[0];
            expect(étape.nom).to.equal('Corde');
            expect(étape.décision).to.equal('BUILD');
        });

        it('le coût de l\'étape Corde utilise son coût_reviens (100) et non son tarif marché (200)', () => {
            const produitCorde = usine.produit('Corde');
            expect(produitCorde.statut).to.equal('BUILD');
            expect(produitCorde.coût_reviens).to.equal(100); // 50 + 5×10

            const plan = planificateur.planifier('Arc', 1);
            const étape = plan.étapes[0];

            // quantité = 2 cordes, coût_unitaire = coût_reviens = 100 → coût = 200
            expect(étape.quantité).to.equal(2);
            expect(étape.coût).to.equal(2 * produitCorde.coût_reviens);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Cas 3 : Composant sans tarif → coût et coût_total undefined
    // ─────────────────────────────────────────────────────────────────────────
    describe('Cas 3 — Composant sans tarif (coût inconnu)', () => {
        /** @type {Planificateur} */
        let planificateur;

        beforeEach(() => {
            // "Pierre" n'a aucun tarif dans le marché
            const recetteMarteau = new Recette('Marteau', 30, [
                new Ingrédient('Pierre', 4)
            ]);
            const usine = new Usine('Usine sans tarif', undefined,
                [recetteMarteau],
                [new Tarif('Marteau', 150)]
                // pas de tarif pour 'Pierre'
            );
            planificateur = new Planificateur(usine);
        });

        it('planifier retourne une étape avec coût=undefined et ne lève pas d\'exception', () => {
            let plan;
            expect(() => { plan = planificateur.planifier('Marteau', 1); }).to.not.throw();

            expect(plan.étapes).to.have.length(1);
            expect(plan.étapes[0].coût).to.be.undefined;
        });

        it('planifier retourne coût_total=undefined quand un coût d\'étape est inconnu', () => {
            const plan = planificateur.planifier('Marteau', 1);
            expect(plan.coût_total).to.be.undefined;
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Cas 4 : Produit absent du catalogue → exception
    // ─────────────────────────────────────────────────────────────────────────
    describe('Cas 4 — Produit absent du catalogue', () => {
        it('planifier("ProduitInexistant", 1) lève une erreur', () => {
            const usine = new Usine('Usine vide');
            const planificateur = new Planificateur(usine);

            expect(() => planificateur.planifier('ProduitInexistant', 1)).to.throw();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Cas 5 : Arborescence imbriquée (Simple → Complexe)
    // ─────────────────────────────────────────────────────────────────────────
    describe('Cas 5 — Arborescence imbriquée', () => {
        /** @type {Usine} */
        let usine;
        /** @type {Planificateur} */
        let planificateur;

        beforeEach(() => {
            // Reprend la structure de service.test.js :
            //   Simple (frais=50, Ingredient1×2, Ingredient2×3)
            //     coût_reviens = 50 + 2×10 + 3×20 = 130
            //     tarif Simple = 180 → rentabilité = (180/130)-1 ≈ 0.38 → BUILD
            //   Complexe (frais=50, Simple×2)
            const recetteSimple = new Recette('Simple', 50, [
                new Ingrédient('Ingredient1', 2),
                new Ingrédient('Ingredient2', 3)
            ]);
            const recetteComplexe = new Recette('Complexe', 50, [
                new Ingrédient('Simple', 2)
            ]);
            usine = new Usine('Usine imbriquée', undefined,
                [recetteSimple, recetteComplexe],
                [
                    new Tarif('Ingredient1', 10),
                    new Tarif('Ingredient2', 20),
                    new Tarif('Simple', 180),
                    new Tarif('Complexe', 300)
                ]
            );
            planificateur = new Planificateur(usine);
        });

        it('le produit Simple a bien le statut BUILD', () => {
            expect(usine.produit('Simple').statut).to.equal('BUILD');
        });

        it('planifier("Complexe", 1) retourne une décision BUILD pour Simple', () => {
            const plan = planificateur.planifier('Complexe', 1);

            expect(plan.étapes).to.have.length(1);
            expect(plan.étapes[0].nom).to.equal('Simple');
            expect(plan.étapes[0].décision).to.equal('BUILD');
        });

        it('le coût de l\'étape Simple utilise coût_reviens (130) et non le tarif marché (180)', () => {
            const coûtReviens = usine.produit('Simple').coût_reviens; // 130
            expect(coûtReviens).to.equal(130);

            const plan = planificateur.planifier('Complexe', 1);
            const étape = plan.étapes[0];

            // quantité = 2 × Simple, coût = 2 × 130 = 260
            expect(étape.quantité).to.equal(2);
            expect(étape.coût).to.equal(2 * coûtReviens);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Cas 6 : Quantité > quantité_produite → plusieurs cycles de fabrication
    // ─────────────────────────────────────────────────────────────────────────
    describe('Cas 6 — Plusieurs cycles de fabrication', () => {
        /** @type {Planificateur} */
        let planificateur;
        const FRAIS = 40;
        const QTÉ_PRODUITE = 3;

        beforeEach(() => {
            // Bouclier (frais=40, quantité_produite=3, Fer×2)
            // tarif Fer=10 → coût_reviens = 40 + 2×10 = 60
            // tarif Bouclier=100 → rentabilité = (100/60)-1 ≈ 0.67 → BUILD (pour lui-même)
            // On teste planifier("Bouclier", 7) → cycles = ceil(7/3) = 3
            const recetteBouclier = new Recette('Bouclier', FRAIS, [
                new Ingrédient('Fer', 2)
            ], QTÉ_PRODUITE);
            const usine = new Usine('Usine cycles', undefined,
                [recetteBouclier],
                [new Tarif('Fer', 10), new Tarif('Bouclier', 100)]
            );
            planificateur = new Planificateur(usine);
        });

        it('planifier("Bouclier", 7) produit ceil(7/3)=3 cycles et intègre frais×3 dans le coût_total', () => {
            const plan = planificateur.planifier('Bouclier', 7);

            expect(plan.étapes).to.have.length(1);

            const étapeFer = plan.étapes[0];
            // quantité requise : 2 × 7 = 14 unités de Fer
            expect(étapeFer.nom).to.equal('Fer');
            expect(étapeFer.quantité).to.equal(14);
            expect(étapeFer.décision).to.equal('BUY'); // Fer non dans catalogue
            expect(étapeFer.coût).to.equal(140); // 14 × 10

            // coût_total = 140 (Fer) + 40 × 3 (frais × cycles)
            const cycles = Math.ceil(7 / QTÉ_PRODUITE); // 3
            expect(plan.coût_total).to.equal(140 + FRAIS * cycles);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Tests unitaires — Coût hors catalogue
    // ─────────────────────────────────────────────────────────────────────────
    describe('Coût hors catalogue', () => {
        it('coût_hors_catalogue est 0 quand tous les composants sont des sous-produits', () => {
            // Arc : Corde×2 ; Corde est dans le catalogue
            const recetteCorde = new Recette('Corde', 50, [new Ingrédient('Chanvre', 5)]);
            const recetteArc = new Recette('Arc', 100, [new Ingrédient('Corde', 2)]);
            const usine = new Usine('Usine coût hors catalogue', undefined,
                [recetteCorde, recetteArc],
                [new Tarif('Chanvre', 10), new Tarif('Corde', 200), new Tarif('Arc', 600)]
            );
            const plan = new Planificateur(usine).planifier('Arc', 1);
            expect(plan.coût_hors_catalogue).to.equal(0);
        });

        it('coût_hors_catalogue retourne le coût du composant absent du catalogue', () => {
            // Épée : Acier×3 ; Acier n est pas dans le catalogue, coût = 600
            const recetteÉpée = new Recette('Épée', 50, [new Ingrédient('Acier', 3)]);
            const usine = new Usine('Usine coût hors catalogue', undefined,
                [recetteÉpée],
                [new Tarif('Acier', 100), new Tarif('Épée', 500)]
            );
            const plan = new Planificateur(usine).planifier('Épée', 2);
            expect(plan.coût_hors_catalogue).to.equal(600);
        });

        it('coût_hors_catalogue est undefined quand un composant hors catalogue a un coût inconnu', () => {
            // Marteau : Pierre×4 ; Pierre n est pas dans le catalogue et sans tarif
            const recetteMarteau = new Recette('Marteau', 30, [new Ingrédient('Pierre', 4)]);
            const usine = new Usine('Usine coût hors catalogue', undefined,
                [recetteMarteau],
                [new Tarif('Marteau', 200)]
            );
            const plan = new Planificateur(usine).planifier('Marteau', 1);
            expect(plan.coût_hors_catalogue).to.be.undefined;
        });
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Tests unitaires — Détection des déficits (Exigences 9.7, 9.8, 9.9)
// ─────────────────────────────────────────────────────────────────────────────
describe('Détection des déficits (Exigences 9.7, 9.8, 9.9)', () => {

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers partagés
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Crée une usine minimale avec un produit nécessitant un composant BUY.
     * @param {number} stockComposant Quantité initiale du composant en stock
     * @param {number} liquidités Liquidités disponibles
     * @param {number} [tarifComposant=100] Tarif du composant BUY
     * @returns {{ usine: Usine, planificateur: Planificateur }}
     */
    function créerSetup({ stockComposant = 0, liquidités = 0, tarifComposant = 100 } = {}) {
        const recetteÉpée = new Recette('Épée', 50, [new Ingrédient('Acier', 10)]);
        const stock = stockComposant > 0 ? [{ nom: 'Acier', quantité: stockComposant }] : [];
        const usine = new Usine('Usine déficit', undefined,
            [recetteÉpée],
            [new Tarif('Acier', tarifComposant), new Tarif('Épée', 2000)],
            stock,
            liquidités
        );
        return { usine, planificateur: new Planificateur(usine) };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Exigence 9.7 — Plan produit malgré stock insuffisant
    // ─────────────────────────────────────────────────────────────────────────
    describe('Exigence 9.7 — Plan produit malgré stock insuffisant', () => {

        it('plan produit malgré stock insuffisant', () => {
            const { planificateur } = créerSetup({ stockComposant: 0 });

            let plan;
            expect(() => { plan = planificateur.planifier('Épée', 1); }).to.not.throw();
            expect(plan.étapes.length).to.be.greaterThan(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Exigence 9.8 — Déficit par composant
    // ─────────────────────────────────────────────────────────────────────────
    describe('Exigence 9.8 — Déficit par composant', () => {

        it('déficit par composant : aucun stock', () => {
            // Acier requis : 10, stock : 0 → déficit = 10
            const { planificateur } = créerSetup({ stockComposant: 0 });
            const plan = planificateur.planifier('Épée', 1);

            const étapeAcier = plan.étapes.find(e => e.nom === 'Acier');
            expect(étapeAcier.décision).to.equal('BUY');
            expect(étapeAcier.déficit).to.equal(10);
        });

        it('déficit par composant : stock partiel', () => {
            // Acier requis : 10, stock : 3 → déficit = 7
            const { planificateur } = créerSetup({ stockComposant: 3 });
            const plan = planificateur.planifier('Épée', 1);

            const étapeAcier = plan.étapes.find(e => e.nom === 'Acier');
            expect(étapeAcier.décision).to.equal('BUY');
            expect(étapeAcier.déficit).to.equal(7);
        });

        it('pas de déficit si stock suffisant', () => {
            // Recette nécessite 5 Fer, stock = 10 → déficit = 0
            const recetteBouclier = new Recette('Bouclier', 30, [new Ingrédient('Fer', 5)]);
            const usine = new Usine('Usine stock suffisant', undefined,
                [recetteBouclier],
                [new Tarif('Fer', 20), new Tarif('Bouclier', 500)],
                [{ nom: 'Fer', quantité: 10 }],
                0
            );
            const plan = new Planificateur(usine).planifier('Bouclier', 1);

            const étapeFer = plan.étapes.find(e => e.nom === 'Fer');
            expect(étapeFer.décision).to.equal('BUY');
            expect(étapeFer.déficit).to.equal(0);
        });

        it('déficit est undefined pour une étape BUILD (non applicable)', () => {
            // Corde (BUILD) : Chanvre×4, tarif Corde=500 → rentabilité positive → BUILD
            const recetteCorde = new Recette('Corde', 20, [new Ingrédient('Chanvre', 4)]);
            const recetteArc = new Recette('Arc', 50, [new Ingrédient('Corde', 2)]);
            const usine = new Usine('Usine BUILD déficit', undefined,
                [recetteCorde, recetteArc],
                [new Tarif('Chanvre', 5), new Tarif('Corde', 500), new Tarif('Arc', 2000)]
            );
            const plan = new Planificateur(usine).planifier('Arc', 1);

            const étapeCorde = plan.étapes.find(e => e.nom === 'Corde');
            expect(étapeCorde.décision).to.equal('BUILD');
            expect(étapeCorde.déficit).to.be.undefined;
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Exigence 9.9 — Déficit de liquidités
    // ─────────────────────────────────────────────────────────────────────────
    describe('Exigence 9.9 — Déficit de liquidités', () => {

        it('déficit de liquidités', () => {
            // Acier requis : 10, tarif : 100 → coût_achats = 1000
            // liquidités = 300 → déficit_liquidités = 700
            const { planificateur } = créerSetup({ stockComposant: 0, liquidités: 300, tarifComposant: 100 });
            const plan = planificateur.planifier('Épée', 1);

            expect(plan.coût_achats).to.equal(1000);
            expect(plan.déficit_liquidités).to.equal(700);
        });

        it('pas de déficit de liquidités si suffisant', () => {
            // coût_achats = 500 (Acier×10 à 50), liquidités = 1000 → déficit = 0
            const { planificateur } = créerSetup({ stockComposant: 0, liquidités: 1000, tarifComposant: 50 });
            const plan = planificateur.planifier('Épée', 1);

            expect(plan.coût_achats).to.equal(500);
            expect(plan.déficit_liquidités).to.equal(0);
        });

        it('coût_achats undefined si tarif BUY manquant', () => {
            // Pierre sans tarif → coût_achats = undefined, déficit_liquidités = undefined
            const recetteMarteau = new Recette('Marteau', 30, [new Ingrédient('Pierre', 4)]);
            const usine = new Usine('Usine sans tarif déficit', undefined,
                [recetteMarteau],
                [new Tarif('Marteau', 200)],
                [],
                500
            );
            const plan = new Planificateur(usine).planifier('Marteau', 1);

            expect(plan.coût_achats).to.be.undefined;
            expect(plan.déficit_liquidités).to.be.undefined;
        });
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Tests unitaires — Surcharge achat/fabrication (Exigence 9.5)
// ─────────────────────────────────────────────────────────────────────────────
import { coûtUnitaireEffectif } from '../app/planificationSurcharge.js';

describe('Surcharge achat/fabrication — coûtUnitaireEffectif (Exigence 9.5)', () => {

    // ─────────────────────────────────────────────────────────────────────────
    // Scénario A — Forcer BUILD sur un composant BUY
    //   Chanvre : pas de recette → rentabilité incalculable → statut NA
    //   Acier   : recette(frais=200, Chanvre×4), tarif Acier=80
    //             coût_reviens = 200 + 4×10 = 240
    //             rentabilité  = (80/240) - 1 < 0 → statut BUY
    // ─────────────────────────────────────────────────────────────────────────
    describe('Scénario A — Forcer BUILD sur un composant BUY', () => {
        /** @type {import('../app/service.js').Usine} */
        let usine;

        beforeEach(async () => {
            const { Recette, Ingrédient, Tarif } = await import('../app/domain.js');
            const { Usine } = await import('../app/service.js');

            // Acier a un coût_reviens élevé (240) mais un tarif marché bas (80) → BUY
            const recetteAcier = new Recette('Acier', 200, [new Ingrédient('Chanvre', 4)]);
            usine = new Usine('Usine test surcharge A', undefined,
                [recetteAcier],
                [new Tarif('Chanvre', 10), new Tarif('Acier', 80)]
            );
        });

        it('le planificateur recommande BUY pour Acier par défaut (rentabilité négative)', async () => {
            const { Planificateur } = await import('../app/planificateur.js');
            const plan = new Planificateur(usine).planifier('Acier', 1);
            // Acier est le produit cible, pas un ingrédient — vérifier son statut
            expect(usine.produit('Acier').statut).to.equal('BUY');
        });

        it('forcer BUILD sur Acier retourne son coût_reviens (240) comme coût unitaire', () => {
            // On simule une étape qui aurait la décision par défaut BUY
            const étapeBidon = { nom: 'Acier', quantité: 1, décision: 'BUY', coût: 80 };

            const coût = coûtUnitaireEffectif(usine, étapeBidon, 'BUILD');

            // coût_reviens = 200 (frais) + 4 × 10 (Chanvre) = 240
            expect(coût).to.equal(240);
        });

        it('forcer BUILD donne un coût unitaire différent du tarif marché (80)', () => {
            const étapeBidon = { nom: 'Acier', quantité: 1, décision: 'BUY', coût: 80 };

            const coûtSurchargé = coûtUnitaireEffectif(usine, étapeBidon, 'BUILD');
            const coûtMarché = usine.tarifs.find(t => t.nom === 'Acier').montant;

            expect(coûtSurchargé).to.not.equal(coûtMarché);
            expect(coûtSurchargé).to.equal(usine.produit('Acier').coût_reviens);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scénario B — Forcer BUY sur un composant BUILD
    //   Soie   : pas de recette → tarif 5 ISK
    //   Tissu  : recette(frais=50, Soie×4), tarif Tissu=500
    //            coût_reviens = 50 + 4×5 = 70
    //            rentabilité  = (500/70) - 1 ≈ 6.14 → statut BUILD
    // ─────────────────────────────────────────────────────────────────────────
    describe('Scénario B — Forcer BUY sur un composant BUILD', () => {
        /** @type {import('../app/service.js').Usine} */
        let usine;

        beforeEach(async () => {
            const { Recette, Ingrédient, Tarif } = await import('../app/domain.js');
            const { Usine } = await import('../app/service.js');

            const recetteTissu = new Recette('Tissu', 50, [new Ingrédient('Soie', 4)]);
            usine = new Usine('Usine test surcharge B', undefined,
                [recetteTissu],
                [new Tarif('Soie', 5), new Tarif('Tissu', 500)]
            );
        });

        it('le produit Tissu a bien le statut BUILD (rentabilité positive)', () => {
            expect(usine.produit('Tissu').statut).to.equal('BUILD');
        });

        it('par défaut, coûtUnitaireEffectif avec décision BUILD retourne le coût_reviens (70)', () => {
            const étapeBidon = { nom: 'Tissu', quantité: 1, décision: 'BUILD', coût: 70 };

            const coût = coûtUnitaireEffectif(usine, étapeBidon, 'BUILD');

            // coût_reviens = 50 + 4×5 = 70
            expect(coût).to.equal(70);
        });

        it('forcer BUY sur Tissu retourne le tarif marché (500) au lieu du coût_reviens (70)', () => {
            const étapeBidon = { nom: 'Tissu', quantité: 1, décision: 'BUILD', coût: 70 };

            const coûtSurchargé = coûtUnitaireEffectif(usine, étapeBidon, 'BUY');

            expect(coûtSurchargé).to.equal(500);
            expect(coûtSurchargé).to.not.equal(usine.produit('Tissu').coût_reviens);
        });

        it('forcer BUY multiplie bien le coût au tarif marché pour une quantité de 3', () => {
            // Simule 3 unités de Tissu à acheter
            const étapeBidon = { nom: 'Tissu', quantité: 3, décision: 'BUILD', coût: 210 };

            const coûtUnitaire = coûtUnitaireEffectif(usine, étapeBidon, 'BUY');
            const coûtTotal = coûtUnitaire * étapeBidon.quantité;

            // 3 × 500 = 1500
            expect(coûtTotal).to.equal(1500);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scénario C — Composant absent du catalogue (BUY implicite)
    // ─────────────────────────────────────────────────────────────────────────
    describe('Scénario C — Composant absent du catalogue', () => {
        it('retourne le tarif marché quel que soit la décision forcée, si absent du catalogue', async () => {
            const { Tarif } = await import('../app/domain.js');
            const { Usine } = await import('../app/service.js');

            const usine = new Usine('Usine sans catalogue', undefined, [],
                [new Tarif('Pierre', 15)]
            );
            const étape = { nom: 'Pierre', quantité: 5, décision: 'BUY', coût: 75 };

            const coût = coûtUnitaireEffectif(usine, étape, 'BUILD');

            // Pierre n'est pas dans le catalogue → tarif marché = 15
            expect(coût).to.equal(15);
        });

        it('retourne undefined si le composant est absent du catalogue ET sans tarif marché', async () => {
            const { Usine } = await import('../app/service.js');

            const usine = new Usine('Usine vide', undefined, [], []);
            const étape = { nom: 'Fantôme', quantité: 1, décision: 'BUY', coût: undefined };

            const coût = coûtUnitaireEffectif(usine, étape, 'BUILD');

            expect(coût).to.be.undefined;
        });
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Tests unitaires — Priorisation des étapes réalisables (Exigence 9.10)
// ─────────────────────────────────────────────────────────────────────────────
describe('Priorisation des étapes réalisables (Exigence 9.10)', () => {

    /**
     * Crée une usine avec un produit (Potion) ayant deux ingrédients BUY :
     * - HerbeCouverteParStock : stock suffisant (réalisable)
     * - HerbeSansStock        : aucun stock (non réalisable)
     */
    function créerUsineDeuxIngrédients({ stockHerbeCouverteParStock = 5 } = {}) {
        // Potion (frais=10, HerbeCouverteParStock×5, HerbeSansStock×3)
        // stockHerbeCouverteParStock couvre exactement la quantité requise (5×1)
        const recettePotion = new Recette('Potion', 10, [
            new Ingrédient('HerbeCouverteParStock', 5),
            new Ingrédient('HerbeSansStock', 3)
        ]);
        const stock = stockHerbeCouverteParStock > 0
            ? [{ nom: 'HerbeCouverteParStock', quantité: stockHerbeCouverteParStock }]
            : [];
        const usine = new Usine('Usine priorisation', undefined,
            [recettePotion],
            [
                new Tarif('HerbeCouverteParStock', 20),
                new Tarif('HerbeSansStock', 15),
                new Tarif('Potion', 500)
            ],
            stock,
            0
        );
        return { usine, planificateur: new Planificateur(usine) };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1 — L'étape couverte apparaît avant l'étape avec déficit
    // ─────────────────────────────────────────────────────────────────────────
    it('Étape avec stock suffisant apparaît avant étape avec déficit', () => {
        const { planificateur } = créerUsineDeuxIngrédients();
        const plan = planificateur.planifier('Potion', 1);

        expect(plan.étapes).to.have.length(2);
        // La première étape doit être celle couverte par le stock (réalisable=true)
        expect(plan.étapes[0].nom).to.equal('HerbeCouverteParStock');
        // La seconde étape est celle avec un déficit (réalisable=false)
        expect(plan.étapes[1].nom).to.equal('HerbeSansStock');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2 — L'étape réalisable a réalisable=true
    // ─────────────────────────────────────────────────────────────────────────
    it('Étape réalisable a réalisable=true', () => {
        const { planificateur } = créerUsineDeuxIngrédients();
        const plan = planificateur.planifier('Potion', 1);

        const étapeCouverteParStock = plan.étapes.find(e => e.nom === 'HerbeCouverteParStock');
        expect(étapeCouverteParStock.réalisable).to.be.true;
        expect(étapeCouverteParStock.déficit).to.equal(0);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3 — L'étape non réalisable a réalisable=false
    // ─────────────────────────────────────────────────────────────────────────
    it('Étape non réalisable a réalisable=false', () => {
        const { planificateur } = créerUsineDeuxIngrédients();
        const plan = planificateur.planifier('Potion', 1);

        const étapeSansStock = plan.étapes.find(e => e.nom === 'HerbeSansStock');
        expect(étapeSansStock.réalisable).to.be.false;
        expect(étapeSansStock.déficit).to.be.greaterThan(0);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4 — Aucune étape réalisable si stock vide
    // ─────────────────────────────────────────────────────────────────────────
    it('Aucune étape réalisable si stock vide', () => {
        // Aucun stock pour aucun ingrédient → toutes les étapes ont réalisable=false
        const { planificateur } = créerUsineDeuxIngrédients({ stockHerbeCouverteParStock: 0 });
        const plan = planificateur.planifier('Potion', 1);

        expect(plan.étapes).to.have.length(2);
        for (const étape of plan.étapes) {
            expect(étape.réalisable, `étape ${étape.nom} devrait avoir réalisable=false`).to.be.false;
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 5 — Les étapes BUILD ont réalisable=false (non applicable)
    // ─────────────────────────────────────────────────────────────────────────
    it('BUILD étapes ont réalisable=false (non applicable)', () => {
        // Soie (pas de recette, BUY) → Tissu (BUILD), tarif Tissu élevé → Tissu statut BUILD
        // Veste (frais=30, Tissu×2) → l'étape Tissu sera BUILD
        const recetteTissu = new Recette('Tissu', 50, [new Ingrédient('Soie', 4)]);
        const recetteVeste = new Recette('Veste', 30, [new Ingrédient('Tissu', 2)]);
        const usine = new Usine('Usine BUILD réalisable', undefined,
            [recetteTissu, recetteVeste],
            [
                new Tarif('Soie', 5),
                new Tarif('Tissu', 500),  // tarif élevé → Tissu statut BUILD
                new Tarif('Veste', 2000)
            ],
            [],
            0
        );
        const planificateur = new Planificateur(usine);
        const plan = planificateur.planifier('Veste', 1);

        const étapeTissu = plan.étapes.find(e => e.nom === 'Tissu');
        expect(étapeTissu.décision).to.equal('BUILD');
        expect(étapeTissu.réalisable).to.be.false;
    });

});
