import { expect } from 'chai';
import { estPérimé } from '../app/péremption.js';

describe('estPérimé', () => {

  // ─── Cas de base ──────────────────────────────────────────────────────────

  it('Devrait retourner false pour une date récente (hier)', () => {
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    expect(estPérimé(hier, 7)).to.equal(false);
  });

  it('Devrait retourner false pour une date d aujourd hui', () => {
    expect(estPérimé(new Date(), 7)).to.equal(false);
  });

  it('Devrait retourner true pour une date dépassant le seuil (8 jours avec seuil 7)', () => {
    const vieille = new Date();
    vieille.setDate(vieille.getDate() - 8);
    expect(estPérimé(vieille, 7)).to.equal(true);
  });

  it('Devrait retourner false pour une date exactement au seuil (7 jours)', () => {
    // Exactement 7 jours = non périmé (diffJours > seuilJours est strict)
    const exact = new Date();
    exact.setDate(exact.getDate() - 7);
    expect(estPérimé(exact, 7)).to.equal(false);
  });

  // ─── Cas limites ──────────────────────────────────────────────────────────

  it('Devrait retourner false si la date est undefined', () => {
    expect(estPérimé(undefined, 7)).to.equal(false);
  });

  it('Devrait retourner false si la date est null', () => {
    expect(estPérimé(null, 7)).to.equal(false);
  });

  // ─── Seuil personnalisé ───────────────────────────────────────────────────

  it('Devrait respecter un seuil de 30 jours — date de 31 jours → périmé', () => {
    const vieille = new Date();
    vieille.setDate(vieille.getDate() - 31);
    expect(estPérimé(vieille, 30)).to.equal(true);
  });

  it('Devrait respecter un seuil de 30 jours — date de 29 jours → non périmé', () => {
    const récente = new Date();
    récente.setDate(récente.getDate() - 29);
    expect(estPérimé(récente, 30)).to.equal(false);
  });

  it('Devrait respecter un seuil de 1 jour — date de 2 jours → périmé', () => {
    const vieille = new Date();
    vieille.setDate(vieille.getDate() - 2);
    expect(estPérimé(vieille, 1)).to.equal(true);
  });

  it('Devrait retourner true pour une date très ancienne', () => {
    const trèsVieille = new Date('2020-01-01');
    expect(estPérimé(trèsVieille, 7)).to.equal(true);
  });

});
