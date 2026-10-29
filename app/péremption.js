/**
 * Détermine si une date est plus ancienne que le seuil donné (en jours calendaires).
 * @param {Date} date - La date à vérifier.
 * @param {number} seuilJours - Le seuil en jours.
 * @returns {boolean} true si la date dépasse le seuil, false sinon (ou si date est falsy).
 */
function estPérimé(date, seuilJours) {
  if (!date) return false;
  const maintenant = new Date();
  const référenceMaintenant = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  const référenceDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffJours = Math.round((référenceMaintenant - référenceDate) / (1000 * 60 * 60 * 24));
  return diffJours > seuilJours;
}

export { estPérimé };
