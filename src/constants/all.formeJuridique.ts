// import { FormeJuridique } from "../types/general.entreprise.type";



// export const FORMES_JURIDIQUES: FormeJuridique[] = [
export const FORMES_JURIDIQUES = [

  {
    sigle: 'EI',
    description: 'Entreprise Individuelle - Gérée par une seule personne. Imposée par défaut à l’IBA.'
  },
  {
    sigle: 'EURL',
    description: 'Entreprise Unipersonnelle à Responsabilité Limitée - SARL à associé unique. IBA par défaut, option IS possible.'
  },
  {
    sigle: 'SARL',
    description: 'Société à Responsabilité Limitée - Société commerciale à plusieurs associés. Régime IS par défaut.'
  },
  {
    sigle: 'SELARL',
    description: 'Société d’Exercice Libéral à Responsabilité Limitée - Variante de SARL pour professions libérales. Régime IS par défaut.'
  },
  {
    sigle: 'SA',
    description: 'Société Anonyme - Forme avancée avec capital social élevé. Imposée à l’IS.'
  },
  {
    sigle: 'SAS',
    description: 'Société par Actions Simplifiée - Très flexible. Régime IS par défaut.'
  },
  {
    sigle: 'SASU',
    description: 'Société par Actions Simplifiée Unipersonnelle - Variante de SAS à associé unique. Régime IS par défaut.'
  },
  {
    sigle: 'SNC',
    description: 'Société en Nom Collectif - Société de personnes à responsabilité solidaire. IBA par défaut, option IS possible.'
  },
  {
    sigle: 'SCP',
    description: 'Société Civile Professionnelle - Pour professions libérales. Imposée sur le revenu des associés (IBA).'
  },
  {
    sigle: 'AUTRE',
    description: 'Autre forme juridique ou non renseignée.'
  }
];


export default FORMES_JURIDIQUES;