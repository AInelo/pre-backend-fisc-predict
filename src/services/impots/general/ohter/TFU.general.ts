import * as fs from 'fs';
import * as path from 'path';

// Interface pour une catégorie de tarif avec slug
interface Categorie {
  nom_categorie: string;
  slug_categorie: string; // Nouveau champ slug
  description: string;
  slug_description: string; // Nouveau champ slug pour la description
  tfu_par_m2: number;
  tfu_minimum: number;
}

// Interface pour les tarifs d'un arrondissement
interface Tarifs {
  [key: string]: Categorie;
}

// Interface pour un arrondissement avec slug
interface Arrondissement {
  nom: string;
  slug: string; // Nouveau champ slug
  tarifs: Tarifs;
}

// Interface pour une commune avec slug
interface Commune {
  nom: string;
  slug: string; // Nouveau champ slug
  arrondissements: Arrondissement[];
}

// Interface pour un département avec slug
interface Departement {
  nom: string;
  slug: string; // Nouveau champ slug
  communes: Commune[];
}

// Interface racine pour la structure complète
interface StructureTarification {
  departements: Departement[];
}











































// // Représente les tarifs d’une catégorie
// interface TarifCategorie {
//   nom_categorie: string;
//   description: string;
//   tfu_par_m2: number;
//   tfu_minimum: number;
// }

// // Représente les tarifs de toutes les catégories pour un arrondissement
// interface TarifsParCategorie {
//   [categorieId: string]: TarifCategorie;
// }

// // Représente un arrondissement
// interface Arrondissement {
//   nom: string;
//   tarifs: TarifsParCategorie;
// }

// // Représente une commune
// interface Commune {
//   nom: string;
//   arrondissements: Arrondissement[];
// }

// // Représente un département
// interface Departement {
//   nom: string;
//   communes: Commune[];
// }

// // Représente la racine de la structure demandée (hors metadata)
// interface GrilleTFU {
//   departements: Departement[];
// }
