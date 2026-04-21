export interface GlobalEstimationInfoData {
    totalEstimation : number,
    totalEstimationCurrency : string,
    contribuableRegime? : string,
    VariableEnter: VariableEnter[] | Record<string, VariableEnter[]>,
    impotDetailCalcule: ImpotDetailCalcule[] | Record<string, ImpotDetailCalcule[]>,
    obligationEcheance: ObligationEcheance[] | Record<string, ObligationEcheance[]>,
    infosSupplementaires: InfosSupplementaires[] | Record<string, InfosSupplementaires[]>,
    impotConfig: ImpotConfig | Record<string, ImpotConfig>,
}

export interface VariableEnter {
    label: string,
    description : string,
    value: string | number ,
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

export interface InfosSupplementaires {
    infosTitle: string,
    infosDescription: string | string[],
}


export interface ImpotConfig {
    impotTitle: string;
    label: string;
    description: string;
    competentCenter: string;
    paymentSchedule?: PaymentScheduleItem[];
}

export interface PaymentScheduleItem {
  date: string;
  description: string;
}






















// export interface GlobalEstimationInfoData {
//     totalEstimation : number,
//     totalEstimationCurrency : string,
//     contribuableRegime : string,
//     VariableEnter: VariableEnter[],
//     impotDetailCalcule: ImpotDetailCalcule[],
//     obligationEcheance: ObligationEcheance[],
//     infosSupplementaires: InfosSupplementaires[],
//     impotConfig: ImpotConfig
// }

// export interface VariableEnter {
//     label: string,
//     description : string,
//     value: number
//     currency : string
// }

// export interface ImpotDetailCalcule {
//     impotTitle: string,
//     impotDescription: string,
//     impotValue: number,
//     impotValueCurrency: string,
//     impotTaux?: string,
//     importCalculeDescription: string,
// }

// export interface ObligationEcheance {
//     impotTitle: string,
//     echeancePaiement: EcheancePaiement | EcheancePaiement[],
//     obligationDescription: string | string[],
// }


// export interface EcheancePaiement {
//     echeancePeriodeLimite : string,
//     echeanceDescription : string,
// }

// export interface InfosSupplementaires {
//     infosTitle: string,
//     infosDescription: string | string[],
// }


// export interface ImpotConfig {
//     impotTitle: string;
//   label: string;
//   description: string;

//   competentCenter: string;
// }

// export interface PaymentScheduleItem {
//   date: string;
//   description: string;
// }