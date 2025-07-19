export interface GlobalEstimationInfoData {
    totalEstimation : number,
    totalEstimationCurrency : string,
    contribuableRegime : string,
    VariableEnter: VariableEnter[],
    impotDetailCalcule: ImpotDetailCalcule[],
    obligationEcheance: ObligationEcheance[],
    infosSupplementaires: InfosSupplementaires[],
    impotConfig: ImpotConfig
}

interface VariableEnter {
    label: string,
    description : string,
    value: number
    currency : string
}

export interface ImpotDetailCalcule {
    impotTitle: string,
    impotDescription: string,
    impotValue: number,
    impotValueCurrency: string,
    impotTaux?: string,
    importCalculeDescription: string,
}

export interface ObligationEcheance {
    impotTitle: string,
    echeancePaiement: EcheancePaiement | EcheancePaiement[],
    obligationDescription: string | string[],
}


export interface EcheancePaiement {
    echeancePeriodeLimite : string,
    echeanceDescription : string,
}

interface InfosSupplementaires {
    infosTitle: string,
    infosDescription: string | string[],
}


export interface ImpotConfig {
  label: string;
  description: string;
  paymentSchedule: PaymentScheduleItem[];
  obligations: string[];
  competentCenter: string;
}

export interface PaymentScheduleItem {
  date: string;
  description: string;
}