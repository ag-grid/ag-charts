import type { Scale } from '../scale/scale';
import { Group } from '../scene/group';
import type { Node } from '../scene/node';
import type { Point } from '../scene/point';
import { Selection } from '../scene/selection';
import { Path } from '../scene/shape/path';
import { OPT_STRING, Validate } from '../util/validation';
import type { ProcessedData } from './data/dataModel';

export interface ErrorBarPoints {
    readonly yLowerPoint: Point;
    readonly yUpperPoint: Point;
}

export class ErrorBarConfig {
    @Validate(OPT_STRING)
    yLowerKey: string = '';

    @Validate(OPT_STRING)
    yLowerName?: string = undefined;

    @Validate(OPT_STRING)
    yUpperKey: string = '';

    @Validate(OPT_STRING)
    yUpperName?: string = undefined;

    constructor(yLowerKey: string, yUpperKey: string) {
        this.yLowerKey = yLowerKey;
        this.yUpperKey = yUpperKey;
    }
}

export class ErrorBarNode extends Path {
    public points: ErrorBarPoints = { yLowerPoint: { x: 0, y: 0 }, yUpperPoint: { x: 0, y: 0 } };

    updatePath() {
        // TODO(olegat) implement, this is just placeholder draw code
        const { path } = this;
        this.fill = 'black';
        this.stroke = 'black';
        this.strokeWidth = 1;
        this.fillOpacity = 1;
        this.strokeOpacity = 1;

        const { yLowerPoint, yUpperPoint } = this.points;

        path.clear();
        path.moveTo(yLowerPoint.x, yLowerPoint.y);
        path.lineTo(yUpperPoint.x, yUpperPoint.y);
        path.closePath();
    }
}

export class ErrorBars {
    public groupNode: Group;
    private selection: Selection<ErrorBarNode>;
    private nodeData: (ErrorBarPoints | undefined)[] = [];

    constructor(parent: Node) {
        this.groupNode = new Group({ name: `${parent.id}-series-errorBars` });
        parent.appendChild(this.groupNode);
        this.selection = Selection.select(this.groupNode, () => this.errorBarFactory());
    }

    createNodeData(
        processedData: ProcessedData<any>,
        xIndex?: number,
        _yIndex?: number, // This is will be used when the scatterplot errorbars are implemented
        xScale?: Scale<any, any, any>,
        yScale?: Scale<any, any, any>,
        config?: ErrorBarConfig
    ) {
        const { nodeData } = this;
        const { yLowerKey, yUpperKey } = config ?? {};
        if (!xScale || !yScale || !yLowerKey || !yUpperKey || xIndex === undefined || _yIndex === undefined) {
            return;
        }

        const convert = (scale: Scale<any, any, any>, value: any) => {
            const offset = (scale.bandwidth ?? 0) / 2;
            return scale.convert(value) + offset;
        };

        nodeData.length = processedData.data.length;

        for (let i = 0; i < processedData.data.length; i++) {
            const { datum, values } = processedData.data[i];
            const xDatum = values[xIndex];

            if (yLowerKey in datum && yUpperKey in datum) {
                nodeData[i] = {
                    yLowerPoint: { x: convert(xScale, xDatum), y: convert(yScale, datum[yLowerKey]) },
                    yUpperPoint: { x: convert(xScale, xDatum), y: convert(yScale, datum[yUpperKey]) },
                };
            } else {
                nodeData[i] = undefined;
            }
        }
    }

    update() {
        this.selection.update(this.nodeData, undefined, undefined);
        this.selection.each((node, datum, i) => this.updateNode(node, datum, i));
    }

    private updateNode(node: ErrorBarNode, _datum: any, index: number) {
        const { nodeData } = this;
        const points = nodeData[index];
        if (points) {
            node.points = points;
            node.updatePath();
        }
    }

    private errorBarFactory(): ErrorBarNode {
        return new ErrorBarNode();
    }
}
