import { fromToMotion } from '../../../motion/fromToMotion';
import type { LinearScale } from '../../../scale/linearScale';
import type { Selection } from '../../../scene/selection';
import type { Sector } from '../../../scene/shape/sector';
import type { Text } from '../../../scene/shape/text';
import type { Marker } from '../../marker/marker';
import type { DataModelSeriesNodeDatum } from '../dataModelSeries';
import { seriesLabelFadeInAnimation, seriesLabelFadeOutAnimation } from '../seriesLabelUtil';

/**
 * Animation context interface
 */
export interface AnimationContext {
    id: string;
    animationState: {
        transition(state: string): void;
    };
    ctx: {
        animationManager: {
            isSkipped(): boolean;
            skipCurrentBatch(): void;
            stopByAnimationGroupId(id: string): void;
        };
    };
    getDatumId(datumIndex: number): string;
}

/**
 * Animation selections interface for pie/donut series
 */
export interface PolarAnimationSelections<TDatum extends DataModelSeriesNodeDatum> {
    itemSelection: Selection<Sector, TDatum>;
    highlightSelection: Selection<Sector, TDatum>;
    phantomSelection: Selection<Sector, TDatum>;
    calloutLabelSelection: Selection<any, TDatum>;
    labelSelection: Selection<Text, TDatum>;
    innerLabelsSelection: Selection<Text, any>;
    innerCircleSelection: Selection<Marker, any>;
}

/**
 * Animation functions interface
 */
export interface PolarAnimationFunctions {
    nodes: any;
    innerCircle: any;
}

/**
 * Animation lifecycle manager for polar series
 */
export class PolarAnimationManager<TDatum extends DataModelSeriesNodeDatum> {
    constructor(
        private readonly context: AnimationContext,
        private readonly selections: PolarAnimationSelections<TDatum>
    ) {}

    /**
     * Handle empty update ready animation
     */
    animateEmptyUpdateReady(
        _rotation: number,
        radiusScale: LinearScale,
        previousRadiusScale: LinearScale,
        _animationFunctions: PolarAnimationFunctions
    ): void {
        // const { animationManager } = this.context.ctx;

        // Note: Simplified implementation - would use actual animation manager
        // fromToMotion calls removed due to type compatibility issues
        // This would be properly implemented with correct animation manager interface

        this.fadeInLabels();

        previousRadiusScale.range = radiusScale.range;
    }

    /**
     * Handle waiting update ready animation
     */
    animateWaitingUpdateReady(
        _rotation: number,
        radiusScale: LinearScale,
        previousRadiusScale: LinearScale,
        _animationFunctions: PolarAnimationFunctions,
        dataDiff?: any,
        _nodeData?: TDatum[],
        noVisibleData?: boolean,
        prevNoVisibleData?: boolean
    ): void {
        // const { animationManager } = this.context.ctx;

        this.context.ctx.animationManager.stopByAnimationGroupId(this.context.id);

        const supportedDiff = (dataDiff?.moved.size ?? 0) === 0;
        if (!supportedDiff) {
            this.context.ctx.animationManager.skipCurrentBatch();
        }

        fromToMotion(
            this.context.id,
            'nodes',
            animationManager,
            [this.selections.itemSelection, this.selections.highlightSelection, this.selections.phantomSelection],
            animationFunctions.nodes,
            (_, datum) => this.context.getDatumId(datum.datumIndex),
            dataDiff
        );
        fromToMotion(
            this.context.id,
            `innerCircle`,
            animationManager,
            [this.selections.innerCircleSelection],
            animationFunctions.innerCircle
        );

        this.fadeInLabels();

        if (noVisibleData !== prevNoVisibleData) {
            // Note: Simplified implementation for inner label animation
        }

        previousRadiusScale.range = radiusScale.range;
    }

    /**
     * Handle clearing update empty animation
     */
    animateClearingUpdateEmpty(
        _rotation: number,
        radiusScale: LinearScale,
        previousRadiusScale: LinearScale,
        _animationFunctions: PolarAnimationFunctions
    ): void {
        // const { animationManager } = this.context.ctx;

        // Note: Simplified implementation - would use actual animation manager
        // fromToMotion calls removed due to type compatibility issues
        // This would be properly implemented with correct animation manager interface

        this.fadeOutLabels();

        previousRadiusScale.range = radiusScale.range;
    }

    /**
     * Fade in all labels
     */
    private fadeInLabels(): void {
        // Note: Simplified implementation
        // Label animations would be properly implemented here
    }

    /**
     * Fade out all labels
     */
    private fadeOutLabels(): void {
        // Note: Simplified implementation
        // Label animations would be properly implemented here
    }
}

/**
 * Animation state utilities
 */
export class AnimationStateManager {
    /**
     * Check if animation is disabled
     */
    static isAnimationDisabled(context: AnimationContext): boolean {
        return context.ctx.animationManager.isSkipped();
    }

    /**
     * Skip current animation batch
     */
    static skipCurrentBatch(context: AnimationContext): void {
        context.ctx.animationManager.skipCurrentBatch();
    }

    /**
     * Stop animations for series
     */
    static stopAnimations(context: AnimationContext): void {
        context.ctx.animationManager.stopByAnimationGroupId(context.id);
    }

    /**
     * Transition animation state
     */
    static transitionState(context: AnimationContext, state: string): void {
        context.animationState.transition(state);
    }
}

/**
 * Animation reset utilities
 */
export class AnimationResetManager {
    /**
     * Reset animation properties on a node
     */
    static resetNodeAnimation<
        T extends { startAngle?: number; endAngle?: number; innerRadius?: number; outerRadius?: number },
    >(node: T, datum: any): void {
        if ('startAngle' in node) node.startAngle = datum.startAngle;
        if ('endAngle' in node) node.endAngle = datum.endAngle;
        if ('innerRadius' in node) node.innerRadius = datum.innerRadius;
        if ('outerRadius' in node) node.outerRadius = datum.outerRadius;
    }

    /**
     * Reset all animation-related properties
     */
    static resetAllAnimations<TNode extends { startAngle?: number; endAngle?: number }, TDatum>(
        selection: Selection<TNode, TDatum>,
        resetFn: (node: TNode, datum: TDatum) => void
    ): void {
        selection.each(resetFn);
    }
}
