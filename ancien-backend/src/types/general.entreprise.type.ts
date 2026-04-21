export const ListTypesContribuableEntreprise : TypeContribuableEntreprise[] = [
  {
    sigle: 'EI',
    description : 'Personne Physique / Entreprise Individuelle'
  },
  {
    sigle: 'SI',
    description : 'Societe'
  }
]


export const ListTypesRegime : TypeRegime[] = [
  {
    sigle: 'REEL',
    description : 'Regime du reel'
  },
  {
    sigle: 'TPS',
    description : 'Regime de la TPS'
  }
]


export interface TypeContribuableEntreprise {
  sigle : string,
  description : string
}

export interface TypeRegime {
  sigle : string,
  description : string
}
