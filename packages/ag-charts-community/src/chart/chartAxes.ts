import { every, isObject } from 'ag-charts-core';

import type { CartesianAxis } from './axis/cartesianAxis';
import type { PolarAxis } from './axis/polarAxis';
import type { ChartAxis } from './chartAxis';
import { ChartAxisDirection } from './chartAxisDirection';

export class ChartAxes<T extends ChartAxis = ChartAxis> extends Array<T> {
    destroy() {
        for (const axis of this) {
            axis.destroy();
        }
        this.length = 0;
    }

    findById(id: string): T | undefined {
        return this.find((a) => a.id === id);
    }

    matches(comparison: Record<string, unknown>) {
        return (
            this.length === Object.keys(comparison).length &&
            every(
                comparison,
                (id, object) => isObject(object) && 'type' in object && this.findById(id)?.type === object.type
            )
        );
    }

    protected getById(id: string): T {
        const axis = this.findById(id);
        if (!axis) throw new Error(`Could not find axis by id [${id}].`);
        return axis;
    }
}

export class CartesianChartAxes extends ChartAxes<CartesianAxis> {
    get [ChartAxisDirection.X](): CartesianAxis {
        return this.getById(ChartAxisDirection.X);
    }

    get [ChartAxisDirection.Y](): CartesianAxis {
        return this.getById(ChartAxisDirection.Y);
    }

    perpendicular(to: CartesianAxis): CartesianAxis {
        const direction = to.direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;
        return this[direction];
    }
}

export class PolarChartAxes extends ChartAxes<PolarAxis> {
    get [ChartAxisDirection.Angle](): PolarAxis {
        return this.getById(ChartAxisDirection.Angle);
    }

    get [ChartAxisDirection.Radius](): PolarAxis {
        return this.getById(ChartAxisDirection.Radius);
    }
}
