import { Recette } from "../domain.js";
import { Usine } from "../services.js";

describe("Vérification du fonctionnement de l'usine", () => {
  let usine;
  beforeEach(() => {

  });

  it(`Cas nominal : Montage d'une usine à partir de 0`, () => {
    usine = new Usine("Nouvelle");
    usine.ajouteRecette(new Recette("Un premier objet", 10, [
      { nom: "Objet 1", quantité: 10 }
    ]))
  });

  it.todo(`Cas nominal : Évolution d'une usine existante`);

  it.todo(`Cas d'erreur : étude de marché avec deux recettes qui font référence l'une à l'autre`);

});
