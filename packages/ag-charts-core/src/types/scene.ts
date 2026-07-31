export interface Size {
    width: number;
    height: number;
}

// General-purpose XY coordinates.
export interface Point {
    x: number;
    y: number;
}

// XY coordinates relative the client (user-agent / browser) viewport.
export interface ClientPoint {
    clientX: number;
    clientY: number;
}

// XY coordinates relative to the AG Charts Canvas HTML Element.
export interface CanvasPoint {
    canvasX: number;
    canvasY: number;
}

// XY coordinates relative the target HTML element that is currently being listened with.
export interface CurrentPoint {
    currentX: number;
    currentY: number;
}

// XY coordinates relative the deepest target HTML element that is currently being interacted with.
export interface OffsetPoint {
    offsetX: number;
    offsetY: number;
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

/**
 * A rect additionally exposes its clip window (the reveal mask used by e.g. the gauge bar sweep) as
 * an axis-aligned box, so trajectory tests can read the reveal directly. Emitted only when a clipBBox
 * is set, so static rects' serialised state is unchanged (see {@link Rect.serializeProps}).
 */
export interface SerializedRectProps extends SerializedPathProps {
    clipX0?: number;
    clipY0?: number;
    clipX1?: number;
    clipY1?: number;
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
    | { type: 'rect'; props: SerializedRectProps; svgPath?: string }
    | { type: 'sector'; props: SerializedSectorProps; svgPath?: string }
    | { type: 'line'; props: SerializedLineProps }
    | { type: 'range'; props: SerializedLineProps }
    | { type: 'text'; props: SerializedTextProps };
