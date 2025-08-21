import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { SegmentedPath } from '../../../scene/shape/segmentedPath';
import type { Text } from '../../../scene/shape/text';
import type { Marker } from '../../marker/marker';
import { seriesLabelFadeInAnimation } from '../seriesLabelUtil';

/**
 * Animation context for Cartesian series
 */
export interface CartesianAnimationContext {
    id: string;
    visible: boolean;
    ctx: {
        animationManager: {
            isSkipped(): boolean;
            skipCurrentBatch(): void;
            stopByAnimationGroupId(id: string): void;
            animate(params: any): void;
        };
    };
    getOpacity(): number;
}

/**
 * Cartesian animation data interface
 */
export interface CartesianAnimationData<TDatum> {
    datumSelection: Selection<Marker, TDatum>;
    labelSelection: Selection<Text, TDatum>;
    annotationSelections: Selection<Text, any>[];
    contextData: any;
    previousContextData?: any;
    paths: Path[];
}

/**
 * Marker animation utilities for Cartesian series
 */
export class CartesianMarkerAnimationManager {
    /**
     * Scale-in animation for markers (swipe effect)
     */
    static markerSwipeScaleInAnimation<TDatum>(
        series: CartesianAnimationContext,
        animationManager: any,
        datumSelection: Selection<Marker, TDatum>
    ): void {
        const { id } = series;

        fromToMotion(
            id,
            'marker_scale_in',
            animationManager,
            [datumSelection],
            { scalingX: 0, scalingY: 0 },
            { scalingX: 1, scalingY: 1 },
            { phase: 'trailing' }
        );
    }

    /**
     * Fade-in animation for markers
     */
    static markerFadeInAnimation<TDatum>(
        series: CartesianAnimationContext,
        animationManager: any,
        type: string | undefined,
        datumSelection: Selection<Marker, TDatum>
    ): void {
        const { id } = series;

        const animationId = type ? `marker_${type}_fade_in` : 'marker_fade_in';

        fromToMotion(
            id,
            animationId,
            animationManager,
            [datumSelection],
            { opacity: 0 },
            { opacity: 1 },
            { phase: 'trailing' }
        );
    }

    /**
     * Reset marker position for animation
     */
    static resetMarkerPositionFn<TDatum>(marker: Marker, datum: TDatum & { point?: { x: number; y: number } }): any {
        if (datum.point) {
            return {
                translationX: datum.point.x,
                translationY: datum.point.y,
            };
        }
        return {};
    }

    /**
     * Reset marker styling for animation
     */
    static resetMarkerFn(marker: Marker): any {
        return {
            scalingX: 1,
            scalingY: 1,
            opacity: marker.opacity,
        };
    }
}

/**
 * Path animation utilities for Cartesian series
 */
export class CartesianPathAnimationManager {
    /**
     * Swipe-in animation for paths
     */
    static pathSwipeInAnimation(series: CartesianAnimationContext, animationManager: any, ...paths: Path[]): void {
        const { id } = series;

        fromToMotion(
            id,
            'path_swipe_in',
            animationManager,
            paths,
            { strokeOpacity: 0 },
            { strokeOpacity: 1 },
            { phase: 'trailing' }
        );
    }

    /**
     * Fade-in animation for paths
     */
    static pathFadeInAnimation(
        series: CartesianAnimationContext,
        property: string,
        animationManager: any,
        type: string,
        path: Path
    ): void {
        const { id } = series;

        fromToMotion(
            id,
            `${property}_${type}`,
            animationManager,
            [path],
            { strokeOpacity: 0 },
            { strokeOpacity: 1 },
            { phase: 'trailing' }
        );
    }

    /**
     * Path morphing animation
     */
    static pathMorphAnimation(
        series: CartesianAnimationContext,
        property: string,
        animationManager: any,
        paths: Path[],
        morphFunctions: any
    ): void {
        const { id } = series;

        pathMotion(id, property, animationManager, paths, morphFunctions);
    }

    /**
     * Build path reset function for animations
     */
    static buildResetPathFn(options: { getVisible: () => boolean; getOpacity: () => number }) {
        return (path: SegmentedPath) => {
            const opacity = options.getVisible() ? options.getOpacity() : 0;
            return {
                strokeOpacity: opacity,
                fillOpacity: opacity,
            };
        };
    }
}

/**
 * Label animation utilities for Cartesian series
 */
export class CartesianLabelAnimationManager {
    /**
     * Fade-in animation for labels
     */
    static labelFadeInAnimation<TDatum>(
        series: CartesianAnimationContext,
        property: string,
        animationManager: any,
        ...labelSelections: Selection<Text, TDatum>[]
    ): void {
        for (const labelSelection of labelSelections) {
            seriesLabelFadeInAnimation(series, property, animationManager, labelSelection);
        }
    }

    /**
     * Reset function for labels
     */
    static resetLabelFn(text: Text): any {
        return {
            opacity: text.opacity,
        };
    }
}

/**
 * Composite animation manager for Cartesian series
 */
export class CartesianAnimationManager<TDatum> {
    constructor(private readonly series: CartesianAnimationContext) {}

    /**
     * Handle empty update ready animation (initial load)
     */
    animateEmptyUpdateReady(animationData: CartesianAnimationData<TDatum>): void {
        const { datumSelection, labelSelection, annotationSelections, contextData, paths } = animationData;
        const { animationManager } = this.series.ctx;

        // Update paths first
        this.updatePaths(paths, contextData);

        // Animate paths with swipe effect
        CartesianPathAnimationManager.pathSwipeInAnimation(this.series, animationManager, ...paths);

        // Reset markers and animate with scale effect
        resetMotion([datumSelection], CartesianMarkerAnimationManager.resetMarkerPositionFn);
        CartesianMarkerAnimationManager.markerSwipeScaleInAnimation(this.series, animationManager, datumSelection);

        // Animate labels
        CartesianLabelAnimationManager.labelFadeInAnimation(this.series, 'labels', animationManager, labelSelection);
        CartesianLabelAnimationManager.labelFadeInAnimation(
            this.series,
            'annotations',
            animationManager,
            ...annotationSelections
        );
    }

    /**
     * Handle waiting update ready animation (data updates)
     */
    animateWaitingUpdateReady(
        animationData: CartesianAnimationData<TDatum>,
        animationFunctions?: any,
        dataDiff?: any
    ): void {
        const { datumSelection, labelSelection, annotationSelections, contextData, previousContextData, paths } =
            animationData;
        const { animationManager } = this.series.ctx;
        const [path] = paths;

        if (contextData?.visible === false && previousContextData?.visible === false) return;

        // Reset animations first
        this.resetAnimations(animationData);

        const update = () => {
            this.updatePaths(paths, contextData);
        };

        const skip = () => {
            animationManager.skipCurrentBatch();
            update();
        };

        if (contextData == null || previousContextData == null) {
            // Added series to existing chart case - fade in
            update();

            CartesianMarkerAnimationManager.markerFadeInAnimation(
                this.series,
                animationManager,
                'added',
                datumSelection
            );
            CartesianPathAnimationManager.pathFadeInAnimation(
                this.series,
                'path_properties',
                animationManager,
                'add',
                path
            );
            CartesianLabelAnimationManager.labelFadeInAnimation(
                this.series,
                'labels',
                animationManager,
                labelSelection
            );
            CartesianLabelAnimationManager.labelFadeInAnimation(
                this.series,
                'annotations',
                animationManager,
                ...annotationSelections
            );
            return;
        }

        if (animationFunctions === undefined) {
            skip();
            return;
        }

        if (animationFunctions.status === 'no-op') {
            return;
        }

        // Handle path animations based on status
        if (animationFunctions.status === 'added') {
            update();
        } else if (animationFunctions.status === 'removed') {
            this.updatePaths(paths, previousContextData);
        } else {
            CartesianPathAnimationManager.pathMorphAnimation(
                this.series,
                'path_update',
                animationManager,
                [path],
                animationFunctions.stroke?.path
            );
        }

        // Animate markers and labels if needed
        if (animationFunctions.hasMotion) {
            CartesianMarkerAnimationManager.markerFadeInAnimation(
                this.series,
                animationManager,
                undefined,
                datumSelection
            );
            CartesianLabelAnimationManager.labelFadeInAnimation(
                this.series,
                'labels',
                animationManager,
                labelSelection
            );
            CartesianLabelAnimationManager.labelFadeInAnimation(
                this.series,
                'annotations',
                animationManager,
                ...annotationSelections
            );
        }

        // Final cleanup animation
        this.series.ctx.animationManager.animate({
            id: this.series.id,
            groupId: 'reset_after_animation',
            phase: 'trailing',
            from: {},
            to: {},
            onComplete: () => this.updatePaths(paths, contextData),
        });
    }

    /**
     * Reset all animations
     */
    private resetAnimations(animationData: CartesianAnimationData<TDatum>): void {
        const { datumSelection, labelSelection } = animationData;

        resetMotion([datumSelection], CartesianMarkerAnimationManager.resetMarkerFn);
        resetMotion([datumSelection], CartesianMarkerAnimationManager.resetMarkerPositionFn);
        resetMotion([labelSelection], CartesianLabelAnimationManager.resetLabelFn);
    }

    /**
     * Update path nodes - to be implemented by specific series
     */
    private updatePaths(paths: Path[], contextData: any): void {
        // This would be implemented by the specific series or passed as a callback
        // For now, it's a placeholder for the path update logic
    }
}

/**
 * Animation utilities for data transitions
 */
export class CartesianDataTransitionManager {
    /**
     * Prepare data transition animations
     */
    static prepareDataTransition<TDatum>(currentData: any, previousData: any, dataDiff?: any): any {
        if (!currentData || !previousData) {
            return undefined;
        }

        // Basic transition preparation logic
        return {
            status: 'update',
            hasMotion: true,
            stroke: {
                path: {}, // Path morphing functions would go here
                pathProperties: {}, // Path property animations
            },
        };
    }

    /**
     * Check if data is animatable
     */
    static isDataAnimatable(currentData: any, previousData: any): boolean {
        return currentData != null && previousData != null;
    }
}
