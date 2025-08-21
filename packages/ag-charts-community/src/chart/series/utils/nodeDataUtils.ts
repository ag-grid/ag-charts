import type { LinearScale } from '../../../scale/linearScale';
import { toRadians } from '../../../util/angle';
import type { DataModel, ProcessedData } from '../../data/dataModel';
import type { DataModelSeriesNodeDatum } from '../dataModelSeries';
import { DataPipelineManager } from './enhancedDataUtils';
import type { NodeDataResult, ProcessedDataValues } from './interfaces';

/**
 * Node data creation context
 */
export interface NodeDataContext {
    id: string;
    processedData?: ProcessedData<any>;
    dataModel?: DataModel<any>;
    angleScale: LinearScale;
    radiusScale: LinearScale;
    visible: boolean;
    properties: {
        rotation: number;
        innerRadiusRatio?: number;
        radiusMin?: number;
        radiusMax?: number;
    };
    ctx: {
        legendManager: {
            getItemEnabled(params: { seriesId: string; itemId: number }): boolean;
        };
    };
}

/**
 * Label creation context
 */
export interface LabelContext {
    properties: {
        calloutLabel: {
            enabled: boolean;
            minAngle: number;
        };
        sectorLabel: {
            enabled: boolean;
        };
        legendItemKey?: string;
    };
    getLabels(datumIndex: number, datum: any, midAngle: number, span: number, values: ProcessedDataValues): any;
    getItemStyle(itemData: { datum: any; datumIndex: number }, isHighlight: boolean): any;
}

/**
 * Comprehensive node data factory for polar series
 */
export class PolarNodeDataFactory<TDatum extends DataModelSeriesNodeDatum> {
    constructor(
        private readonly context: NodeDataContext,
        private readonly labelContext: LabelContext
    ) {}

    /**
     * Create complete node data with all patterns from DonutSeries
     */
    createNodeData(): NodeDataResult<TDatum> | undefined {
        const { processedData, dataModel, angleScale } = this.context;

        if (!dataModel || processedData?.type !== 'ungrouped') {
            return undefined;
        }

        const processedDataValues = this.getProcessedDataValues(dataModel, processedData);
        const {
            angleValues,
            angleRawValues,
            angleFilterValues,
            angleFilterRawValues,
            radiusValues,
            radiusRawValues,
            legendItemValues,
        } = processedDataValues;

        const useFilterAngles = DataPipelineManager.shouldUseFilterAngles(angleFilterRawValues, angleRawValues);

        const nodeCreationResult = this.createNodes(processedData, processedDataValues, useFilterAngles);

        const { nodes, phantomNodes, sum } = nodeCreationResult;

        // Handle zero-sum visualization
        this.updateZerosumRings(sum);

        return {
            itemId: this.context.id,
            nodeData: nodes as TDatum[],
            labelData: nodes as TDatum[],
            phantomNodeData: phantomNodes as TDatum[] | undefined,
        };
    }

    /**
     * Create nodes with comprehensive processing
     */
    private createNodes(
        processedData: ProcessedData<any>,
        processedDataValues: ProcessedDataValues,
        useFilterAngles: boolean
    ): { nodes: any[]; phantomNodes: any[] | undefined; sum: number } {
        const {
            angleValues,
            angleRawValues,
            angleFilterValues,
            angleFilterRawValues,
            radiusValues,
            radiusRawValues,
            legendItemValues,
        } = processedDataValues;

        let currentStart = 0;
        let sum = 0;
        const nodes: any[] = [];
        const phantomNodes: any[] | undefined = angleFilterRawValues != null ? [] : undefined;
        const rawData = processedData.dataSources.get(this.context.id) ?? [];
        const invalidData = processedData.invalidData?.get(this.context.id);

        rawData.forEach((datum, datumIndex) => {
            if (invalidData?.[datumIndex] === true) return;

            const nodeData = this.createSingleNodeData(
                datum,
                datumIndex,
                processedDataValues,
                useFilterAngles,
                currentStart,
                sum
            );

            if (nodeData) {
                const { node, newCurrentStart, newSum } = nodeData;
                currentStart = newCurrentStart;
                sum = newSum;
                nodes.push(node);

                // Create phantom node if needed
                if (phantomNodes != null) {
                    phantomNodes.push(this.createPhantomNode(node));
                }
            }
        });

        return { nodes, phantomNodes, sum };
    }

    /**
     * Create a single node data item
     */
    private createSingleNodeData(
        datum: any,
        datumIndex: number,
        processedDataValues: ProcessedDataValues,
        useFilterAngles: boolean,
        currentStart: number,
        currentSum: number
    ): { node: any; newCurrentStart: number; newSum: number } | undefined {
        const {
            angleValues,
            angleRawValues,
            angleFilterValues,
            angleFilterRawValues,
            radiusValues,
            radiusRawValues,
            legendItemValues,
        } = processedDataValues;

        const currentValue = useFilterAngles ? angleFilterValues![datumIndex] : angleValues[datumIndex];
        const crossFilterScale = DataPipelineManager.calculateCrossFilterScale(
            angleFilterRawValues,
            angleRawValues,
            datumIndex,
            useFilterAngles
        );

        const angleCalcs = DataPipelineManager.processAngleCalculations(
            this.context.angleScale,
            currentStart,
            currentValue,
            this.context.properties.rotation
        );

        const angleValue = angleRawValues[datumIndex];
        const radiusRaw = radiusValues?.[datumIndex] ?? 1;
        const radius = radiusRaw * crossFilterScale;
        const radiusValue = radiusRawValues?.[datumIndex];
        const legendItemValue = legendItemValues?.[datumIndex];

        const nodeLabels = this.labelContext.getLabels(
            datumIndex,
            datum,
            angleCalcs.midAngle,
            angleCalcs.span,
            processedDataValues
        );
        const sectorFormat = this.labelContext.getItemStyle({ datum, datumIndex }, false);

        const node = {
            itemId: datumIndex,
            series: this.context,
            datum,
            datumIndex,
            angleValue,
            midAngle: angleCalcs.midAngle,
            midCos: Math.cos(angleCalcs.midAngle),
            midSin: Math.sin(angleCalcs.midAngle),
            startAngle: angleCalcs.startAngle,
            endAngle: angleCalcs.endAngle,
            radius,
            innerRadius: Math.max(this.context.radiusScale.convert(0), 0),
            outerRadius: Math.max(this.context.radiusScale.convert(radius), 0),
            sectorFormat,
            radiusValue,
            legendItemValue,
            enabled:
                this.context.visible &&
                this.context.ctx.legendManager.getItemEnabled({
                    seriesId: this.context.id,
                    itemId: datumIndex,
                }),
            focusable: true,
            ...nodeLabels,
        };

        return {
            node,
            newCurrentStart: currentStart + currentValue,
            newSum: currentSum + currentValue,
        };
    }

    /**
     * Create phantom node for animation purposes
     */
    private createPhantomNode(originalNode: any): any {
        return {
            ...originalNode,
            radius: 1,
            innerRadius: Math.max(this.context.radiusScale.convert(0), 0),
            outerRadius: Math.max(this.context.radiusScale.convert(1), 0),
            focusable: false,
        };
    }

    /**
     * Update zero-sum rings visibility
     */
    private updateZerosumRings(sum: number): void {
        const { innerRadiusRatio } = this.context.properties;

        // Assuming we have access to the rings through context
        // This would need to be properly connected in the actual implementation
        const zerosumOuterRingVisible = sum === 0;
        const zerosumInnerRingVisible =
            sum === 0 && innerRadiusRatio != null && innerRadiusRatio !== 1 && innerRadiusRatio > 0;

        // These would be updated on the actual ring elements
        // For now, we'll store the visibility state in a way that can be accessed
        (this.context as any).zerosumOuterRingVisible = zerosumOuterRingVisible;
        (this.context as any).zerosumInnerRingVisible = zerosumInnerRingVisible;
    }

    /**
     * Get processed data values - delegation method
     */
    private getProcessedDataValues(dataModel: DataModel<any>, processedData: ProcessedData<any>): ProcessedDataValues {
        // This would typically delegate to the enhanced data processor
        // For now, implement a simplified version
        const angleValues = dataModel.resolveColumnById(this.context, `angleValue`, processedData) ?? [];
        const angleRawValues = dataModel.resolveColumnById(this.context, `angleRaw`, processedData) ?? [];

        return {
            angleValues,
            angleRawValues,
            angleFilterValues: undefined,
            angleFilterRawValues: undefined,
            radiusValues: undefined,
            radiusRawValues: undefined,
            calloutLabelValues: undefined,
            sectorLabelValues: undefined,
            legendItemValues: undefined,
        };
    }
}

/**
 * Node data transformation utilities
 */
export class NodeDataTransformUtils {
    /**
     * Update node radii after radius scale changes
     */
    static updateNodeRadii<T extends { radius: number; innerRadius: number; outerRadius: number }>(
        nodeData: T[],
        radiusScale: LinearScale
    ): T[] {
        const setRadii = (d: T): T => ({
            ...d,
            innerRadius: Math.max(radiusScale.convert(0), 0),
            outerRadius: Math.max(radiusScale.convert(d.radius), 0),
        });

        return nodeData.map(setRadii);
    }

    /**
     * Calculate node mid points for positioning
     */
    static calculateMidPoints<
        T extends {
            innerRadius: number;
            outerRadius: number;
            midCos: number;
            midSin: number;
            midPoint?: { x: number; y: number };
        },
    >(nodeData: T[]): void {
        const setMidPoint = (d: T) => {
            const radius = d.innerRadius + (d.outerRadius - d.innerRadius) / 2;
            d.midPoint = {
                x: d.midCos * Math.max(0, radius),
                y: d.midSin * Math.max(0, radius),
            };
        };
        nodeData.forEach(setMidPoint);
    }

    /**
     * Filter enabled nodes
     */
    static filterEnabledNodes<T extends { enabled: boolean }>(nodeData: T[]): T[] {
        return nodeData.filter((node) => node.enabled);
    }
}

/**
 * Node data validation utilities
 */
export class NodeDataValidator {
    /**
     * Validate node data integrity
     */
    static validateNodeData<T extends DataModelSeriesNodeDatum>(nodeData: T[]): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        nodeData.forEach((node, index) => {
            if (typeof node.datumIndex !== 'number') {
                errors.push(`Node ${index}: Missing or invalid datumIndex`);
            }
            if (!node.datum) {
                errors.push(`Node ${index}: Missing datum`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate polar-specific node properties
     */
    static validatePolarNodeData<
        T extends {
            startAngle: number;
            endAngle: number;
            innerRadius: number;
            outerRadius: number;
        },
    >(nodeData: T[]): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        nodeData.forEach((node, index) => {
            if (!isFinite(node.startAngle) || !isFinite(node.endAngle)) {
                errors.push(`Node ${index}: Invalid angle values`);
            }
            if (node.innerRadius < 0 || node.outerRadius < 0) {
                errors.push(`Node ${index}: Negative radius values`);
            }
            if (node.innerRadius > node.outerRadius) {
                errors.push(`Node ${index}: Inner radius greater than outer radius`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
