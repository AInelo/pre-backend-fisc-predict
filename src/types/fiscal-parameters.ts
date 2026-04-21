export type FiscalTaxCode =
  | 'AIB'
  | 'IBA'
  | 'IRF'
  | 'IS'
  | 'ITS'
  | 'PATENTE'
  | 'TFU'
  | 'TPS'
  | 'TVM';

export type FiscalContributorType = 'ENTREPRISE' | 'PARTICULIER';

export interface CciRateBracket {
  maxRevenue: number | null;
  amount: number;
}

export interface TpsFiscalParams {
  taux_tps: number;
  montant_minimum: number;
  redevance_rtb: number;
  seuil_regime_reel: number;
  cci_rates: CciRateBracket[];
  title: string;
  label: string;
  description: string;
  competent_center: string;
}

export interface IsFiscalParams {
  redevance_srtb: number;
  impot_minimum_absolu_entreprise: number;
  taux_taxe_station_par_litre: number;
  cci_rates: CciRateBracket[];
  taux_principal_par_secteur: Record<string, number>;
  taux_minimum_par_secteur: Record<string, number>;
  title: string;
  label: string;
  description: string;
  competent_center: string;
}

export interface IbaSectorRule {
  taux?: number;
  min?: number;
  minPourcent?: number;
  tauxParLitre?: number;
  reductionArtisanale?: number;
}

export interface IbaFiscalParams {
  taux_general: number;
  minimum_general_pourcent: number;
  minimum_absolu_general: number;
  redevance_srtb: number;
  facteur_reduction_artisanale: number;
  regles_secteur: Record<string, IbaSectorRule>;
  title: string;
  label: string;
  description: string;
  competent_center: string;
}

export interface AibFiscalParams {
  redevance_srtb: number;
  title: string;
  label: string;
  description: string;
  competent_center: string;
}

export interface IrfFiscalParams {
  redevance_srtb: number;
  taux_standard: number;
  taux_reduit: number;
  title: string;
  label: string;
  description: string;
  competent_center: string;
}

export interface ItsBracket {
  borneInf: number;
  borneSup: number | null;
  taux: number;
  montantFixe: number;
}

export interface ItsFiscalParams {
  seuil_exoneration: number;
  redevance_srtb_mars: number;
  redevance_srtb_juin: number;
  redevance_srtb_cumulee: number;
  bareme: ItsBracket[];
  title: string;
  label: string;
  description: string;
  competent_center: string;
}

export interface PatenteFiscalParams {
  fixed_rate_zone1: number;
  fixed_rate_zone2: number;
  add_per_billion_ca: number;
  proportional_rates: Record<string, number>;
  first_zone_locations: string[];
  import_export_fixed_rates: Array<{ maxAmount: number | null; amount: number }>;
  /** Supplément par milliard entier au-delà du dernier seuil d'import/export (>10Mds) */
  import_export_over_max_increment_per_billion: number;
  title: string;
  label: string;
  description: string;
  competent_center: string;
}

export interface TfuEntrepriseFiscalParams {
  taux_standard: number;
  taux_par_ville: Array<{ ville: string; taux: number }>;
  title: string;
  label: string;
  description: string;
  competent_center: string;
}

export interface TfuTarifCategorie {
  description: string;
  slug_description: string;
  tfu_par_m2: number;
  tfu_minimum: number;
}

export interface TfuArrondissement {
  nom: string;
  slug: string;
  tarifs: Record<string, TfuTarifCategorie>;
}

export interface TfuCommune {
  nom: string;
  slug: string;
  arrondissements: TfuArrondissement[];
}

export interface TfuDepartement {
  nom: string;
  slug: string;
  communes: TfuCommune[];
}

export interface TfuParticulierFiscalParams {
  montant_piscine: number;
  departements: TfuDepartement[];
  title: string;
  label: string;
  description: string;
  competent_center: string;
}

export interface TvmTarifs {
  tricycle: number;
  company: Array<{ maxPower: number | null; amount: number }>;
  private: Array<{ maxPower: number | null; amount: number }>;
  public_persons: Array<{ maxCapacity: number | null; amount: number }>;
  public_goods: Array<{ maxCapacity: number | null; amount: number }>;
}

export interface TvmFiscalParams {
  tarifs: TvmTarifs;
  title: string;
  label: string;
  description: string;
  competent_center: string;
}

export type FiscalParametersByTaxCode = {
  AIB: AibFiscalParams;
  IBA: IbaFiscalParams;
  IRF: IrfFiscalParams;
  IS: IsFiscalParams;
  ITS: ItsFiscalParams;
  PATENTE: PatenteFiscalParams;
  TFU: TfuEntrepriseFiscalParams;
  TPS: TpsFiscalParams;
  TVM: TvmFiscalParams;
};

export type FiscalParamsFor<TCode extends FiscalTaxCode> = TCode extends keyof FiscalParametersByTaxCode
  ? FiscalParametersByTaxCode[TCode]
  : never;
