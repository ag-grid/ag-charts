import { PointerEvents } from '../../../scene/node';
import type { Path } from '../../../scene/shape/path';
import type { SegmentedPath } from '../../../scene/shape/segmentedPath';
import { mergeDefaults } from '../../../util/object';
import { InterpolationProperties } from '../cartesian/interpolationProperties';
import type { LinePathSpan, LineSeriesNodeDataContext } from '../cartesian/lineUtil';
import { interpolatePoints, plotLinePathStroke } from '../cartesian/lineUtil';
import { updateClipPath } from '../cartesian/pathUtil';
import type { RenderStrategy } from './interfaces';

const CROSS_FILTER_LINE_STROKE_OPACITY_FACTOR = 0.25;

/**
 * Abstract base render strategy for common rendering functionality
 */
export abstract class BaseRenderStrategy<TNode, TContext> implements RenderStrategy<TNode, TContext> {
    abstract createNodes(context: TContext): TNode[];
    abstract updateNodes(nodes: TNode[], context: TContext, visible: boolean): void;
    abstract animateNodes(nodes: TNode[], context: TContext, animationEnabled: boolean): void;
}

/**
 * Line-specific render strategy implementing interpolation and path rendering
 */
export class LineRenderStrategy extends BaseRenderStrategy<Path, LineSeriesNodeDataContext> {
    createNodes(_context: LineSeriesNodeDataContext): Path[] {
        // Path nodes are typically created by the series, this just returns them
        return [];
    }

    updateNodes(paths: Path[], context: LineSeriesNodeDataContext, _visible: boolean): void {
        if (!paths.length) return;

        const [lineNode] = paths;
        this.updateLinePaths([lineNode], context);
    }

    animateNodes(paths: Path[], _context: LineSeriesNodeDataContext, animationEnabled: boolean): void {
        if (!animationEnabled || !paths.length) return;

        // Animation logic would be handled by the series animation system
        // This is a placeholder for future animation strategy implementation
    }

    private updateLinePaths(paths: Path[], contextData: LineSeriesNodeDataContext): void {
        const spans = contextData.strokeData.spans;
        const [lineNode] = paths;

        lineNode.path.clear();
        plotLinePathStroke(lineNode, spans);
        lineNode.markDirty('LineSeries');
    }

    /**
     * Updates path node properties with line styling
     */
    updatePathNodes(opts: {
        paths: SegmentedPath[];
        visible: boolean;
        animationEnabled: boolean;
        contextData?: LineSeriesNodeDataContext;
        getHighlightStyle: () => any;
        getStyle: (highlight: boolean) => any;
        series: any; // Would be the actual series instance
    }): void {
        const {
            paths: [lineNode],
            visible,
            animationEnabled,
            contextData,
            getHighlightStyle,
            getStyle,
            series,
        } = opts;

        if (!contextData) return;

        const crossFiltering = contextData.crossFiltering === true;
        const merged = mergeDefaults(getHighlightStyle(), getStyle(false));
        const { strokeWidth, stroke, strokeOpacity, lineDash, lineDashOffset, opacity } = merged;
        const segments = contextData.segments;

        // @todo(AG-8108): move to theme
        const lineStyle = {
            fill: undefined,
            stroke,
            strokeWidth,
            strokeOpacity: strokeOpacity * (crossFiltering ? CROSS_FILTER_LINE_STROKE_OPACITY_FACTOR : 1),
            lineDash,
            lineDashOffset,
        };

        const lineSegments = segments?.map(({ clipRect, ...segmentStyle }) => ({
            clipRect,
            ...mergeDefaults(segmentStyle, lineStyle),
        }));

        lineNode.setProperties({
            segments: lineSegments,
            fill: undefined,
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            opacity,
            stroke,
            strokeWidth,
            strokeOpacity: strokeOpacity * (crossFiltering ? CROSS_FILTER_LINE_STROKE_OPACITY_FACTOR : 1),
            lineDash,
            lineDashOffset,
        });

        lineNode.datum = lineSegments;

        if (!animationEnabled) {
            lineNode.visible = visible;
        }

        updateClipPath(series, lineNode);
    }
}

/**
 * Interpolation strategy enum for different line interpolation types
 */
export enum InterpolationType {
    LINEAR = 'linear',
    SMOOTH = 'smooth',
    STEP = 'step',
}

/**
 * Interpolation strategy interface
 */
export interface InterpolationStrategy {
    interpolatePoints(points: any[], interpolationConfig: any): LinePathSpan[];
}

/**
 * Linear interpolation strategy
 */
export class LinearInterpolationStrategy implements InterpolationStrategy {
    interpolatePoints(points: any[], _interpolationConfig: any): LinePathSpan[] {
        const config = new InterpolationProperties();
        config.type = 'linear';
        return interpolatePoints(points, config);
    }
}

/**
 * Smooth interpolation strategy
 */
export class SmoothInterpolationStrategy implements InterpolationStrategy {
    interpolatePoints(points: any[], interpolationConfig: any): LinePathSpan[] {
        const tension = interpolationConfig?.tension ?? 0.5;
        const config = new InterpolationProperties();
        config.type = 'smooth';
        config.tension = tension;
        return interpolatePoints(points, config);
    }
}

/**
 * Step interpolation strategy
 */
export class StepInterpolationStrategy implements InterpolationStrategy {
    interpolatePoints(points: any[], interpolationConfig: any): LinePathSpan[] {
        const position = interpolationConfig?.position ?? 'end';
        const config = new InterpolationProperties();
        config.type = 'step';
        config.position = position;
        return interpolatePoints(points, config);
    }
}

/**
 * Factory for creating interpolation strategies
 */
export class InterpolationStrategyFactory {
    static create(type: InterpolationType): InterpolationStrategy {
        switch (type) {
            case InterpolationType.LINEAR:
                return new LinearInterpolationStrategy();
            case InterpolationType.SMOOTH:
                return new SmoothInterpolationStrategy();
            case InterpolationType.STEP:
                return new StepInterpolationStrategy();
            default:
                return new LinearInterpolationStrategy();
        }
    }
}
