/**
 * Détermine si une date est plus ancienne que le seuil donné (en jours).
 * @param {Date} date - La date à vérifier.
 * @param {number} seuilJours - Le seuil en jours.
 * @returns {boolean} true si la date dépasse le seuil, false sinon (ou si date est falsy).
 */
function estPérimé(date, seuilJours) {
  if (!date) return false;
  const maintenant = new Date();
  const msParJour = 1000 * 60 * 60 * 24;
  const diffJours = (maintenant - date) / msParJour;
  return diffJours > seuilJours;
}

export { estPérimé };
