export type AgLineStyle = AgLineLinearStyle | AgLineSmoothStyle | AgLineStepStyle;

interface AgLineLinearStyle {
    style: 'linear';
}

interface AgLineSmoothStyle {
    style: 'smooth';
    tension?: number;
}

interface AgLineStepStyle {
    style: 'step';
    alignment?: 'leading' | 'center' | 'trailing';
}
