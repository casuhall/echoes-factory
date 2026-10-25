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
      expect(plan.étapes).to.have.length(3); // Bois + Fer + Épée
      expect(plan.étapes.map(e => e.nom)).to.deep.equal(['Bois', 'Fer', 'Épée']);
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
      expect(noms).to.deep.equal(['Arbre', 'Bois', 'Épée']);
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
      expect(noms).to.deep.equal(['B', 'A']); // pas de boucle infinie
    });

    it('affiche les sous-produits BUILD dans les étapes', () => {
      const recetteBois = new Recette('Bois', 10, [new Ingrédient('Arbre', 1)]);
      const recetteÉpée = new Recette('Épée', 100, [new Ingrédient('Bois', 2)]);
      usine.ajouteProduit(recetteBois);
      usine.ajouteProduit(recetteÉpée);
      usine.évaluer('Arbre', 5);
      usine.évaluer('Bois', 20); // prix > coût_reviens => BUILD

      const planificateur = new Planificateur(usine);
      const plan = planificateur.planifier('Épée', 1);
      const noms = plan.étapes.map(e => e.nom);
      expect(noms).to.deep.equal(['Arbre', 'Bois', 'Épée']);
    });

    it('ajoute les sous-composants lors d\'une surcharge BUY vers BUILD', () => {
      const recetteBois = new Recette('Bois', 10, [
        new Ingrédient('Arbre', 1)
      ]);
      const recetteÉpée = new Recette('Épée', 100, [
        new Ingrédient('Bois', 2)
      ]);
      usine.ajouteProduit(recetteBois);
      usine.ajouteProduit(recetteÉpée);
      usine.évaluer('Arbre', 1);
      usine.évaluer('Bois', 10); // prix < coût_reviens (11) => statut BUY

      const planificateur = new Planificateur(usine);
      let plan = planificateur.planifier('Épée', 1);
      expect(plan.étapes.map(e => e.nom)).to.deep.equal(['Bois', 'Épée']);
      expect(plan.étapes.find(e => e.nom === 'Bois').décision).to.equal('BUY');

      plan = planificateur.surcharger(plan, 'Bois', 'BUILD');
      expect(plan.étapes.map(e => e.nom)).to.deep.equal(['Arbre', 'Bois', 'Épée']);
      expect(plan.étapes.find(e => e.nom === 'Bois').décision).to.equal('BUILD');
      expect(plan.étapes.find(e => e.nom === 'Bois').surcharge).to.equal(true);
    });

    it('supprime les sous-composants lors d\'une réinitialisation BUILD vers BUY', () => {
      const recetteBois = new Recette('Bois', 10, [
        new Ingrédient('Arbre', 1)
      ]);
      const recetteÉpée = new Recette('Épée', 100, [
        new Ingrédient('Bois', 2)
      ]);
      usine.ajouteProduit(recetteBois);
      usine.ajouteProduit(recetteÉpée);
      usine.évaluer('Arbre', 1);
      usine.évaluer('Bois', 10); // prix < coût_reviens (11) => statut BUY

      const planificateur = new Planificateur(usine);
      let plan = planificateur.planifier('Épée', 1);
      expect(plan.étapes.map(e => e.nom)).to.deep.equal(['Bois', 'Épée']);

      plan = planificateur.surcharger(plan, 'Bois', 'BUILD');
      expect(plan.étapes.map(e => e.nom)).to.deep.equal(['Arbre', 'Bois', 'Épée']);
      expect(plan.étapes.find(e => e.nom === 'Bois').surcharge).to.equal(true);

      plan = planificateur.surcharger(plan, 'Bois', 'BUY');
      expect(plan.étapes.map(e => e.nom)).to.deep.equal(['Bois', 'Épée']);
      expect(plan.étapes.find(e => e.nom === 'Bois').décision).to.equal('BUY');
      expect(plan.étapes.find(e => e.nom === 'Bois').surcharge).to.equal(false);
    });
  });
});
