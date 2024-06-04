import { Entité } from "./domain"

interface IRepository<Type extends Entité> {

  // upsert d'objet
  put(entité: Type): void;
  // lecture d'objet, undefined si non trouvé
  get(nom: string): Type | undefined;
}

export { IRepository }
