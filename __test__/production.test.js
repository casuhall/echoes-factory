import { expect } from 'chai';
import { Recette, Ingrédient, Tarif } from '../app/domain.js';
import { Usine } from '../app/service.js';
import { Planificateur } from '../app/planificateur.js';

/**
 * Construit une usine standard pour les tests de suivi de production :
 * - Produit "Épée" (frais=50, 1 unité produite) avec 3 Acier par cycle
 * - Tarif Acier=100, Tarif Épée=500
 * - 10 unités d'Acier en stock
 */
function créerContexte() {
    const recetteÉpée = new Recette('Épée', 50, [new Ingrédient('Acier', 3)]);
    const usine = new Usine(
        'Usine de test',
        undefined,
        [recetteÉpée],
        [new Tarif('Acier', 100), new Tarif('Épée', 500)]
    );
    usine.stocker('Acier', 10);
    const planificateur = new Planificateur(usine);
    return { usine, planificateur };
}

describe("Suivi de production — tests d'intégration", () => {

    // ─────────────────────────────────────────────────────────────────────────
    // Scénario 1 — Validation d'un plan
    // ─────────────────────────────────────────────────────────────────────────
    describe('Scénario 1 — Validation d\'un plan', () => {
        /** @type {import('../app/service.js').Usine} */
        let usine;
        /** @type {Planificateur} */
        let planificateur;

        beforeEach(() => {
            ({ usine, planificateur } = créerContexte());
        });

        it('usine.fabrications contient 1 fabrication après validerPlan', () => {
            const plan = planificateur.planifier('Épée', 2);
            usine.validerPlan(plan, 'Épée', 2);

            expect(usine.fabrications).to.have.length(1);
        });

        it('la fabrication a les bonnes propriétés (nomProduit, quantité, statut)', () => {
            const plan = planificateur.planifier('Épée', 2);
            const fabrication = usine.validerPlan(plan, 'Épée', 2);

            expect(fabrication.nomProduit).to.equal('Épée');
            expect(fabrication.quantité).to.equal(2);
            expect(fabrication.statut).to.equal('en_cours');
        });

        it('les composants BUY (Acier) sont réservés : stock disponible réduit à 4', () => {
            const plan = planificateur.planifier('Épée', 2);
            usine.validerPlan(plan, 'Épée', 2);

            // 3 Acier × 2 Épées = 6 réservés → disponible = 10 − 6 = 4
            const disponible = usine.stock_disponible.find(s => s.nom === 'Acier');
            expect(disponible).to.exist;
            expect(disponible.quantité).to.equal(4);
        });

        it('le stock total (non engagé) reste à 10 malgré la réservation', () => {
            const plan = planificateur.planifier('Épée', 2);
            usine.validerPlan(plan, 'Épée', 2);

            const total = usine.stock.find(s => s.nom === 'Acier');
            expect(total).to.exist;
            expect(total.quantité).to.equal(10);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scénario 2 — Progression et finalisation
    // ─────────────────────────────────────────────────────────────────────────
    describe('Scénario 2 — Finalisation d\'une fabrication', () => {
        /** @type {import('../app/service.js').Usine} */
        let usine;
        /** @type {Planificateur} */
        let planificateur;
        /** @type {import('../app/service.js').FabricationEnCours} */
        let fabrication;

        beforeEach(() => {
            ({ usine, planificateur } = créerContexte());
            const plan = planificateur.planifier('Épée', 2);
            fabrication = usine.validerPlan(plan, 'Épée', 2);
        });

        it('usine.fabrications est vide après terminerFabrication', () => {
            usine.terminerFabrication(fabrication.id);

            expect(usine.fabrications).to.have.length(0);
        });

        it('le stock disponible d\'Acier revient à 10 après terminerFabrication', () => {
            usine.terminerFabrication(fabrication.id);

            const disponible = usine.stock_disponible.find(s => s.nom === 'Acier');
            expect(disponible).to.exist;
            expect(disponible.quantité).to.equal(10);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scénario 3 — Cas d'erreur
    // ─────────────────────────────────────────────────────────────────────────
    describe("Scénario 3 — Cas d'erreur", () => {
        /** @type {import('../app/service.js').Usine} */
        let usine;
        /** @type {Planificateur} */
        let planificateur;

        beforeEach(() => {
            ({ usine, planificateur } = créerContexte());
        });

        it('terminerFabrication avec un id inexistant lève une erreur', () => {
            expect(() => usine.terminerFabrication(999)).to.throw();
        });

        it('terminerFabrication sur une fabrication déjà terminée lève une erreur', () => {
            const plan = planificateur.planifier('Épée', 2);
            const fabrication = usine.validerPlan(plan, 'Épée', 2);
            usine.terminerFabrication(fabrication.id);

            expect(() => usine.terminerFabrication(fabrication.id)).to.throw();
        });

        it('validerPlan avec un plan invalide (null) lève une erreur', () => {
            expect(() => usine.validerPlan(null, 'Épée', 2)).to.throw();
        });

        it('validerPlan avec un objet quelconque (non PlanProduction) lève une erreur', () => {
            expect(() => usine.validerPlan({ étapes: [] }, 'Épée', 2)).to.throw();
        });

        it('validerPlan avec un nomProduit vide lève une erreur', () => {
            const plan = planificateur.planifier('Épée', 2);

            expect(() => usine.validerPlan(plan, '', 2)).to.throw();
        });

        it('validerPlan avec une quantité invalide (0) lève une erreur', () => {
            const plan = planificateur.planifier('Épée', 2);

            expect(() => usine.validerPlan(plan, 'Épée', 0)).to.throw();
        });
    });
});
