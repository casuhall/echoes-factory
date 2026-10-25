import { expect } from 'chai';
import { Recette, Ingrédient, Tarification, Tarif, Inventaire } from '../app/domain.js';
import { Usine, Planificateur } from '../app/service.js';
import { ÉtapePlan, PlanProduction } from '../app/planification.js';

describe('Planificateur', () => {
  /** @type {Usine} */
  let usine;

  beforeEach(() => {
    usine = new Usine("Usine Test", undefined, [], [], [], 0);
  });

  describe('ÉtapePlan', () => {
    it('crée une étape valide', () => {
      const étape = new ÉtapePlan('Bois', 10, 'BUY', 5);
      expect(étape.nom).to.equal('Bois');
      expect(étape.quantité).to.equal(10);
      expect(étape.décision).to.equal('BUY');
      expect(étape.quantité_stock).to.equal(5);
      expect(étape.surcharge).to.equal(false);
    });

    it('refuse un nom vide', () => {
      expect(() => new ÉtapePlan('', 10, 'BUY', 0)).to.throw(/Nom d'étape obligatoire/);
    });

    it('refuse une quantité invalide', () => {
      expect(() => new ÉtapePlan('Bois', 0, 'BUY', 0)).to.throw(/Quantité d'étape invalide/);
      expect(() => new ÉtapePlan('Bois', -1, 'BUY', 0)).to.throw(/Quantité d'étape invalide/);
      expect(() => new ÉtapePlan('Bois', 1.5, 'BUY', 0)).to.throw(/Quantité d'étape invalide/);
    });

    it('refuse une décision invalide', () => {
      expect(() => new ÉtapePlan('Bois', 10, 'MAYBE', 0)).to.throw(/Décision invalide/);
    });

    it('refuse une quantité en stock négative', () => {
      expect(() => new ÉtapePlan('Bois', 10, 'BUY', -1)).to.throw(/Quantité en stock invalide/);
    });

    it('applique une surcharge manuelle', () => {
      const étape = new ÉtapePlan('Bois', 10, 'BUY', 0, true);
      expect(étape.surcharge).to.equal(true);
    });

    it('sérialise en objet', () => {
      const étape = new ÉtapePlan('Bois', 10, 'BUY', 5, true);
      expect(étape.toObject()).to.deep.equal({
        nom: 'Bois',
        quantité: 10,
        décision: 'BUY',
        quantité_stock: 5,
        surcharge: true
      });
    });
  });

  describe('PlanProduction', () => {
    it('crée un plan valide', () => {
      const étapes = [new ÉtapePlan('Bois', 10, 'BUY', 5)];
      const plan = new PlanProduction('Épée', 1, étapes, 1000);
      expect(plan.produit_cible).to.equal('Épée');
      expect(plan.quantité_cible).to.equal(1);
      expect(plan.étapes).to.have.length(1);
      expect(plan.coût_total).to.equal(1000);
    });

    it('refuse un produit cible vide', () => {
      expect(() => new PlanProduction('', 1)).to.throw(/Produit cible obligatoire/);
    });

    it('refuse une quantité cible invalide', () => {
      expect(() => new PlanProduction('Épée', 0)).to.throw(/Quantité cible invalide/);
    });

    it('applique une surcharge manuelle', () => {
      const étapes = [new ÉtapePlan('Bois', 10, 'BUY', 5)];
      const plan = new PlanProduction('Épée', 1, étapes);
      const planModifié = plan.avec_surcharge('Bois', 'BUILD');
      expect(planModifié.étapes[0].décision).to.equal('BUILD');
      expect(planModifié.étapes[0].surcharge).to.equal(true);
      expect(plan.étapes[0].décision).to.equal('BUY'); // original inchangé
    });

    it('sérialise en objet', () => {
      const étapes = [new ÉtapePlan('Bois', 10, 'BUY', 5)];
      const plan = new PlanProduction('Épée', 1, étapes, 1000);
      expect(plan.toObject()).to.deep.include({
        produit_cible: 'Épée',
        quantité_cible: 1,
        coût_total: 1000
      });
    });
  });

  describe('Planificateur', () => {
    it('génère un plan pour un produit simple', () => {
      const recette = new Recette('Épée', 100, [
        new Ingrédient('Bois', 2),
        new Ingrédient('Fer', 1)
      ]);
      usine.ajouteProduit(recette);
      usine.évaluer('Bois', 10);
      usine.évaluer('Fer', 50);

      const planificateur = new Planificateur(usine);
      const plan = planificateur.planifier('Épée', 1);

      expect(plan.produit_cible).to.equal('Épée');
      expect(plan.quantité_cible).to.equal(1);
      expect(plan.étapes).to.have.length(3); // Épée + Bois + Fer
    });

    it('inclut les sous-produits récursivement', () => {
      const recetteBois = new Recette('Bois', 10, [
        new Ingrédient('Arbre', 1)
      ]);
      const recetteÉpée = new Recette('Épée', 100, [
        new Ingrédient('Bois', 2)
      ]);
      usine.ajouteProduit(recetteBois);
      usine.ajouteProduit(recetteÉpée);
      usine.évaluer('Arbre', 5);

      const planificateur = new Planificateur(usine);
      const plan = planificateur.planifier('Épée', 1);

      const noms = plan.étapes.map(étape => étape.nom);
      expect(noms).to.include('Épée');
      expect(noms).to.include('Bois');
      expect(noms).to.include('Arbre');
    });

    it('calcule le coût total du plan', () => {
      const recette = new Recette('Épée', 100, [
        new Ingrédient('Bois', 2),
        new Ingrédient('Fer', 1)
      ]);
      usine.ajouteProduit(recette);
      usine.évaluer('Bois', 10);
      usine.évaluer('Fer', 50);

      const planificateur = new Planificateur(usine);
      const plan = planificateur.planifier('Épée', 1);

      expect(plan.coût_total).to.equal(70); // 2*10 + 1*50
    });

    it('ne planifie pas un produit inexistant', () => {
      const planificateur = new Planificateur(usine);
      const plan = planificateur.planifier('Inexistant', 1);
      expect(plan.étapes).to.have.length(0);
    });

    it('refuse une usine invalide', () => {
      expect(() => new Planificateur({})).to.throw(/Usine invalide/);
    });

    it('tient compte du stock disponible', () => {
      const recette = new Recette('Épée', 100, [
        new Ingrédient('Bois', 2)
      ]);
      usine.ajouteProduit(recette);
      usine.évaluer('Bois', 10);
      usine.stocker('Bois', 2);

      const planificateur = new Planificateur(usine);
      const plan = planificateur.planifier('Épée', 1);

      const boisÉtape = plan.étapes.find(étape => étape.nom === 'Bois');
      expect(boisÉtape).to.exist;
      expect(boisÉtape.quantité_stock).to.equal(2);
    });

    it('arrête la récursion sur les cycles', () => {
      const recetteA = new Recette('A', 10, [new Ingrédient('B', 1)]);
      const recetteB = new Recette('B', 10, [new Ingrédient('A', 1)]);
      usine.ajouteProduit(recetteA);
      usine.ajouteProduit(recetteB);

      const planificateur = new Planificateur(usine);
      const plan = planificateur.planifier('A', 1);

      const noms = plan.étapes.map(étape => étape.nom);
      expect(noms).to.have.length(2); // A + B, pas de boucle infinie
    });
  });
});
