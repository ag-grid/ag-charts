export interface Size {
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface SizedPoint extends Point {
    size: number;
    focusSize?: number;
}

export interface Bounds4 {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

/**
 * Properties every node contributes to its serialised state. The transform properties are contributed
 * by the Translatable/Scalable/Rotatable mixins when applied, so they are optional on every node kind.
 */
export interface SerializedNodeProps {
    visible: boolean;
    translationX?: number;
    translationY?: number;
    scalingX?: number;
    scalingY?: number;
    rotation?: number;
}

export interface SerializedGroupProps extends SerializedNodeProps {
    opacity: number;
}

export interface SerializedShapeProps extends SerializedNodeProps {
    opacity: number;
    drawingMode: 'overlay' | 'cutout';
    hasFill: boolean;
    hasStroke: boolean;
}

export interface SerializedPathProps extends SerializedShapeProps {
    x: number;
    y: number;
    width: number;
    height: number;
    clip: boolean;
    clipX: number;
    clipY: number;
}

export interface SerializedSectorProps extends SerializedPathProps {
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
}

export interface SerializedLineProps extends SerializedShapeProps {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface SerializedTextProps extends SerializedShapeProps {
    x: number;
    y: number;
    text?: string;
}

/**
 * Plain-data snapshot of a node's rendered state, discriminated by node kind independently of
 * subclassing (e.g. a specialised bar shape still reads as `'rect'`); `svgPath` carries the drawn path
 * commands in SVG form for path-painting nodes. This union is closed: a new node kind must add its
 * variant here, which forces every exhaustive consumer to decide how to handle it.
 */
export type SerializedNodeState =
    | { type: 'node'; props: SerializedNodeProps }
    | { type: 'group'; props: SerializedGroupProps }
    | { type: 'path'; props: SerializedPathProps; svgPath?: string }
    | { type: 'marker'; props: SerializedPathProps; svgPath?: string }
    | { type: 'rect'; props: SerializedPathProps; svgPath?: string }
    | { type: 'sector'; props: SerializedSectorProps; svgPath?: string }
    | { type: 'line'; props: SerializedLineProps }
    | { type: 'range'; props: SerializedLineProps }
    | { type: 'text'; props: SerializedTextProps };
