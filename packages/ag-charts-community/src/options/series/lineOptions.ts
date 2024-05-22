export type AgLineStyle =
    | { style: 'linear' }
    | { style: 'smooth'; tension?: number }
    | { style: 'step'; alignment?: 'leading' | 'center' | 'trailing' };
