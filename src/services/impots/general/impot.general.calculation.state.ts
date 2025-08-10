interface impotCalculationState {
    impotCode: string;
    state : "available" | "not_available"
}

export const impotGeneralCalculationState: impotCalculationState[] = [
    {
        impotCode: 'AIB',
        state: 'available'
    },
    {
        impotCode: 'IRCM',
        state: 'not_available'
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
        impotCode: 'TVA',
        state: 'not_available'
    },
    {
        impotCode: 'VPS',
        state: 'not_available'
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
        state: 'available'
    },
    {
        impotCode: 'ITS',
        state: 'available'
    }
]
