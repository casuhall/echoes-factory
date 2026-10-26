
/**
 * Décode une liste d'objets exportée par le jeu pour en extraire les données associées.
 * Analyse le format tabulé avec index, nom, quantité et valeur, ou le format alternatif
 * sans index où seules les lignes racines (non indentées) sont retenues.
 * @param {string} value Une liste d'objets au format exportée par le jeu
 * @returns {{ index:string|undefined, nom:string, quantité:number, valeur:number }[]} la liste d'entrée décodée sous forme d'objet.
 * @throws {Error} Si le format ne peut être analysé correctement
 */
function decodeEchoesListe(value) {
  let liste = []
  const lignes = value.split("\n");
  let formatAlternatif = false;

  for (const element of lignes) {
    if (!formatAlternatif && /^Material\tQuantity\tISK$/i.test(element.trim())) {
      formatAlternatif = true;
      continue;
    }

    if (formatAlternatif) {
      const nom = element.trim();
      if (!nom || /^\s/.test(element)) continue;
      const ligne = /^(.+)\t(\d+)\t(\d+)$/.exec(element);
      if (ligne) {
        const [, nom, quantité_brut, valeur_brut] = ligne;
        const quantité = Number.parseFloat(quantité_brut);
        const valeur = Number.parseFloat(valeur_brut);
        liste.push({ index: undefined, nom, quantité, valeur });
      }
      continue;
    }

    let ligne = /^(\d+)\t(.+)\t(\d+)\t(.+)$/.exec(element);
    if (ligne) {
      let [, index, nom, quantité_brut, valeur_brut] = ligne;
      let quantité = Number.parseFloat(quantité_brut);
      let valeur = Number.parseFloat(valeur_brut);
      liste.push({ index, nom, quantité, valeur })
    }
  };

  if (liste.length === 0 && !formatAlternatif) {
    throw new Error("Format non reconnu : attendu TSV à 4 colonnes (index, nom, quantité, valeur) ou à 3 colonnes (Material, Quantity, ISK).");
  }

  return liste;
}


class NUMBER_FORMAT {
  static floatFormat = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  static integerFormat = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  static format(value, type = "float") {
    switch (type) {
      case "integer":
        return this.integerFormat.format(value);
      case "float":
        return this.floatFormat.format(value);
      default:
        throw new Error(`Type de formatage non supporté: ${type}`);
    }
  }
}

const UNICODE_DATE_FORMAT = new Intl.DateTimeFormat("fr-FR"); // pour formatage YYYY-MM-DD

/**
 * Initialise un élément HTML en utilisant le type, les classes CSS, le contenu textuel et les événements fournis.
 *
 * @param {string} typeElement Type HTML, par exemple "button" ou "td".
 * @param {string[]} classes Classes CSS à appliquer.
 * @param {string} contenu Contenu textuel de l'élément.
 * @param {{trigger: string, listener: EventListener}[]} evenements Couples [événement, callback].
 * @returns {HTMLElement} Élément HTML initialisé.
 */
function initialiserElement(typeElement, classes = [], contenu = "", evenements = []) {
  // 1. Création de l'élément.
  const element = document.createElement(typeElement);

  // 2. Application des classes CSS.
  element.classList.add(...classes);

  // 3. Définition du contenu textuel.
  element.textContent = contenu;

  // 4. Association des événements.
  for (const { trigger, listener } of evenements) {
    element.addEventListener(trigger, listener);
  }

  return element;
}

function prépareNotification() {
  let notification = initialiserElement("dialog");
  notification.setAttribute("open", "true");
  notification.id = 'notification';
  // à décommenter pour vérifier le rendu des messages
  // notification.innerHTML = `  <dialog id="notification" open>
  //   <p class="info">Une super info</p>
  //   <p class="warn">Attention !</p>
  //   <p class="error">Trop tard 😑</p>
  // </dialog>`
  document.body.prepend(notification)
  return notification;
}

function notifier(message, level) {
  let notification = document.getElementById("notification") ?? prépareNotification();
  let p_message = initialiserElement("p", [level], message);
  notification.append(p_message);
  setTimeout(() => { p_message.remove() }, 5000);
}

export {
  decodeEchoesListe, NUMBER_FORMAT, UNICODE_DATE_FORMAT,
  initialiserElement, prépareNotification, notifier
};
