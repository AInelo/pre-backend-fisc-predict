interface impotCalculationState {
    impotCode: string;
    state : "available" | "not_available",
    isJustInformative? : boolean
}

export const impotGeneralCalculationState: impotCalculationState[] = [
    {
        impotCode: 'AIB',
        state: 'available',
        isJustInformative : false
    },
    {
        impotCode: 'IS',
        state: 'available'
    },
    {
        impotCode: 'TFU',
        state: 'available'
    },
    {
        impotCode: 'IRF',
        state: 'not_available'
    },
    {
        impotCode: 'ITS',
        state: 'available'
    },   
    {
        impotCode: 'IBA',
        state: 'available'
    },
    {
        impotCode: 'PATENTE',
        state: 'available'
    },
    {
        impotCode: 'TVM',
        state: 'available'
    },
    {
        impotCode: 'TPS',
        state: 'available'
    },
    {
        impotCode: 'TVA',
        state: 'not_available'
    },
    {
        impotCode: 'VPS',
        state: 'not_available'
    }, {
        impotCode: 'IRCM',
        state: 'not_available'
    },
    
]
