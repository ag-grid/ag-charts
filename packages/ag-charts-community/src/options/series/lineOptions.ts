export interface AgLineStyleLinear {
    style: 'linear';
}

export interface AgLineStyleSmooth {
    style: 'smooth';
    tension?: number;
}

export interface AgLineStyleStep {
    style: 'step';
    alignment?: 'leading' | 'center' | 'trailing';
}

export type AgLineStyle = AgLineStyleLinear | AgLineStyleSmooth | AgLineStyleStep;
