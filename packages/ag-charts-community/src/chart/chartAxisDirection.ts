export enum ChartAxisDirection {
    X = 'x',
    Y = 'y',
    Angle = 'angle',
    Radius = 'radius',
}

export function isChartAxisDirection(d: string): d is ChartAxisDirection {
    switch (d) {
        case 'x':
        case 'y':
        case 'angle':
        case 'radius':
            return true;
        default:
            return false;
    }
}

export type CartesianAxisDirection = ChartAxisDirection.X | ChartAxisDirection.Y;
