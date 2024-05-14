import { Chart } from './chart';

export class SankeyChart extends Chart {
    static readonly className = 'SankeyChart';
    static readonly type = 'sankey' as const;
}
