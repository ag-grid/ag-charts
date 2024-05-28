import type { Ratio } from '../chart/types';

export type AgLineStyle = AgLineLinearStyle | AgLineSmoothStyle | AgLineStepStyle;

interface AgLineLinearStyle {
    style: 'linear';
}

interface AgLineSmoothStyle {
    style: 'smooth';
    tension?: Ratio;
}

interface AgLineStepStyle {
    style: 'step';
    alignment?: 'leading' | 'center' | 'trailing';
}
