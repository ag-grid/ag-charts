export enum ChartAxisDirection {
    X = 'x',
    Y = 'y',
    Angle = 'angle',
    Radius = 'radius',
}

export function toChartAxisDirection(d: 'x' | 'y' | 'angle' | 'radius'): ChartAxisDirection {
    switch (d) {
        case 'x':
            return ChartAxisDirection.X;
        case 'y':
            return ChartAxisDirection.Y;
        case 'angle':
            return ChartAxisDirection.Angle;
        case 'radius':
            return ChartAxisDirection.Radius;
        default:
            throw new Error(`Invalid axis direction: ${d as unknown as string}`);
    }
}

export type CartesianAxisDirection = ChartAxisDirection.X | ChartAxisDirection.Y;
