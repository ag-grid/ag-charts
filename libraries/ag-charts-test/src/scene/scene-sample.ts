import type { SerializedNodeState } from 'ag-charts-core';

// Inlined (mirrors ag-charts-core's evaluateBezier) so this module has no runtime cross-package
// dependency: it is consumed both by community's vitest sampler and, from source, by the website's
// Playwright specs, where resolving ag-charts-core's runtime entry is unreliable.
function evaluateBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;
}

/**
 * A node's serialised subtree in a form that survives structured-clone (browser → Node): its own
 * serialised {@link SerializedNodeState}, its resolved datum identity, and its serialised children.
 * `name` and `datumId` are read from the live node before serialisation because {@link SerializedNodeState}
 * carries neither.
 */
export interface SerializedSceneNode {
    name?: string;
    datumId?: string;
    state: SerializedNodeState;
    children: SerializedSceneNode[];
}

/** One serialised subtree per sampler root, mirroring the live chart roots {@link sampleSerializedRoots} walks. */
export interface SerializedSceneRoots {
    series: Array<{ content: SerializedSceneNode; labels: SerializedSceneNode; background?: SerializedSceneNode }>;
    axes: Array<{ position: string; axisGroup: SerializedSceneNode; grid: SerializedSceneNode }>;
    captions?: SerializedSceneNode;
    legends: Array<{ legendType: string; group: SerializedSceneNode }>;
    clipRect?: { x: number; y: number; width: number; height: number };
}

export type SceneNodeGeometry = Record<string, number>;
export type SceneGeometrySample = Map<string, SceneNodeGeometry>;

const PATH_STATION_COUNT = 5;
const CURVE_FLATTEN_STEPS = 8;

type PolylinePoint = { x: number; y: number };

function polylineBounds(polylines: PolylinePoint[][]) {
    let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const line of polylines) {
        for (const p of line) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
    }
    return { minX, minY, maxX, maxY };
}

/** Flatten a node's serialised drawn path (SVG form) into one polyline per subpath. */
export function flattenPathPolylines(svgPath: string | undefined): PolylinePoint[][] {
    if (svgPath == null) return [];
    const tokens = svgPath.split(' ').filter((t) => t.length > 0);
    const polylines: PolylinePoint[][] = [];
    let current: PolylinePoint[] | undefined;
    let i = 0;
    const num = () => {
        const token = tokens[i++];
        const value = Number(token);
        // A literal 'NaN' coordinate is a legitimate rendered gap (series skip missing/invalid points
        // by emitting NaN segments) and is handled by the callers below as a polyline break. Any other
        // non-numeric token means the parser desynchronised from the command stream, which would
        // silently poison every downstream geometry assertion — fail loudly at the source instead.
        if (!Number.isFinite(value) && token !== 'NaN') {
            throw new Error(`flattenPathPolylines: non-finite coordinate at token ${i - 1} in '${svgPath}'`);
        }
        return value;
    };
    while (i < tokens.length) {
        const token = tokens[i++];
        switch (token) {
            case 'M': {
                const [x, y] = [num(), num()];
                if (Number.isFinite(x) && Number.isFinite(y)) {
                    current = [{ x, y }];
                    polylines.push(current);
                } else {
                    current = undefined;
                }
                break;
            }
            case 'L': {
                const [x, y] = [num(), num()];
                if (Number.isFinite(x) && Number.isFinite(y)) {
                    if (current == null) {
                        // Finite geometry resuming after a NaN gap begins a fresh subpath rather than
                        // being discarded until the next explicit `M`.
                        current = [{ x, y }];
                        polylines.push(current);
                    } else {
                        current.push({ x, y });
                    }
                } else {
                    current = undefined;
                }
                break;
            }
            case 'C': {
                const [x1, y1, x2, y2, x3, y3] = [num(), num(), num(), num(), num(), num()];
                if (![x1, y1, x2, y2, x3, y3].every(Number.isFinite)) {
                    current = undefined;
                    break;
                }
                const from = current?.at(-1);
                if (from == null) break;
                for (let step = 1; step <= CURVE_FLATTEN_STEPS; step++) {
                    const t = step / CURVE_FLATTEN_STEPS;
                    current!.push({
                        x: evaluateBezier(from.x, x1, x2, x3, t),
                        y: evaluateBezier(from.y, y1, y2, y3, t),
                    });
                }
                break;
            }
            case 'Z':
                if (current != null && current.length > 0) current.push({ ...current[0] });
                break;
            default:
                // A command this parser does not consume would desynchronise the token stream and
                // silently corrupt every downstream geometry assertion — fail loudly instead.
                throw new Error(`flattenPathPolylines: unsupported SVG path command '${token}' in '${svgPath}'`);
        }
    }
    return polylines.filter((p) => p.length > 1);
}

/**
 * The topmost (minimum) y where the drawn path crosses each of {@link PATH_STATION_COUNT} x-stations
 * spread evenly across the path's own x-extent. For a line stroke this traces the line itself; for an
 * area fill it traces the animated top edge (the baseline below has a larger y). A station with no
 * crossing (a gap in the drawn path) yields NaN, which trajectory checks reject as non-finite.
 */
function pathStationTopYs(polylines: PolylinePoint[][]): number[] {
    const { minX, maxX } = polylineBounds(polylines);
    const tops: number[] = new Array(PATH_STATION_COUNT).fill(Number.NaN);
    if (!Number.isFinite(minX) || maxX <= minX) return tops;
    for (let station = 0; station < PATH_STATION_COUNT; station++) {
        const x = minX + ((maxX - minX) * station) / (PATH_STATION_COUNT - 1);
        let top = Infinity;
        for (const line of polylines) {
            for (let i = 1; i < line.length; i++) {
                const a = line[i - 1];
                const b = line[i];
                if ((a.x - x) * (b.x - x) > 0) continue;
                const y = a.x === b.x ? Math.min(a.y, b.y) : a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
                top = Math.min(top, y);
            }
        }
        tops[station] = Number.isFinite(top) ? top : Number.NaN;
    }
    return tops;
}

/**
 * Paths get interior geometry on top of the bbox: `subpaths` (drawn-gap detector — a stroke that
 * should be continuous must keep `subpaths` at 1) and `top@<i>` per x-station (see
 * {@link pathStationTopYs}), so path-based series (line/area) can assert per-point trajectories
 * rather than extent-level bbox movement only. Paths with nothing drawn get the bbox props only.
 */
function readPathGeometry(s: Extract<SerializedNodeState, { type: 'path' }>): SceneNodeGeometry {
    const polylines = flattenPathPolylines(s.svgPath);
    // An empty drawn path has no meaningful geometry (its bbox is ±Infinity): emit paint props only,
    // so geometry checks span just the frames where something is actually drawn.
    if (polylines.length === 0) return { opacity: s.props.opacity };
    const { x, y, width, height, opacity } = s.props;
    const props: SceneNodeGeometry = { x, y, width, height, opacity };
    // The reveal (swipe-in) animation masks the fully-drawn path behind a growing clip window, so
    // the clip fields are the only per-frame signal of the sweep.
    props['clip'] = s.props.clip ? 1 : 0;
    if (s.props.clip) {
        props['clip:x'] = s.props.clipX;
        props['clip:y'] = s.props.clipY;
    }
    props['subpaths'] = polylines.length;
    for (const [i, topY] of pathStationTopYs(polylines).entries()) {
        props[`top@${i}`] = topY;
    }
    return props;
}

/**
 * Map a node's serialised state to the property set trajectory specs assert over; `null` marks node
 * kinds deliberately not sampled (groups are handled separately by the scene walk). The switch is
 * exhaustive over {@link SerializedNodeState}: adding a scene node kind fails compilation here until
 * its sampling is decided.
 */
function buildGeometry(state: SerializedNodeState): SceneNodeGeometry | null {
    switch (state.type) {
        case 'node':
        case 'group':
        case 'range':
            return null;
        case 'sector': {
            const { startAngle, endAngle, innerRadius, outerRadius, opacity } = state.props;
            return { startAngle, endAngle, innerRadius, outerRadius, opacity };
        }
        // Specialised rects (e.g. stacked BarShape) keep nominal extents in the fields and derive
        // the painted segment in updatePath — only the drawn path reflects the screen.
        case 'rect': {
            const { x, y, width, height, opacity } = state.props;
            const drawn = flattenPathPolylines(state.svgPath);
            if (drawn.length === 0) return { x, y, width, height, opacity };
            const { minX, minY, maxX, maxY } = polylineBounds(drawn);
            return { x: minX, y: minY, width: maxX - minX, height: maxY - minY, opacity };
        }
        case 'text': {
            const { x, y, opacity, rotation } = state.props;
            const props: SceneNodeGeometry = { x, y, opacity };
            // Rotation only exists on the Rotatable mixin variants (e.g. axis labels).
            if (typeof rotation === 'number') props['rotation'] = rotation;
            return props;
        }
        case 'line': {
            const { x1, y1, x2, y2, opacity } = state.props;
            return { x1, y1, x2, y2, opacity };
        }
        case 'marker': {
            const { x, y, width, height, opacity } = state.props;
            return { x, y, width, height, opacity };
        }
        case 'path':
            return readPathGeometry(state);
        default:
            return state satisfies never;
    }
}

function readNodeGeometry(state: SerializedNodeState): { label: string; props: SceneNodeGeometry } | undefined {
    const props = buildGeometry(state);
    if (props == null) return undefined;
    // Translation-positioned shapes (e.g. markers) move via translationX/Y, not their local geometry.
    const { translationX, translationY } = state.props;
    if (typeof translationX === 'number' && typeof translationY === 'number') {
        props['translationX'] = translationX;
        props['translationY'] = translationY;
    }
    // Cutout compositing (destination-out) punches holes through siblings — a marker left in cutout
    // mode while translucent erases the series stroke underneath it, which no geometry check can see.
    if (state.type !== 'node' && state.type !== 'group') {
        props['cutout'] = state.props.drawingMode === 'cutout' ? 1 : 0;
    }
    props['visible'] = state.props.visible ? 1 : 0;
    return { label: state.type, props };
}

/**
 * Best-effort human-readable identity for a scene node. `datumId` is resolved from the live node's
 * datum before serialisation (see {@link SceneNodeAccessor}); the remaining branches read only the
 * serialised state, so they run Node-side from a serialised tree.
 */
function datumKeyOf(datumId: string | undefined, state: SerializedNodeState): string | undefined {
    if (datumId != null) return datumId;
    if (state.type === 'text' && state.props.text != null) return state.props.text;
    // Series paint one Path per role (e.g. area fill vs stroke), distinguishable by which paint is set.
    if (state.type === 'path') {
        const { hasFill, hasStroke } = state.props;
        if (hasFill && !hasStroke) return 'fill';
        if (hasStroke && !hasFill) return 'stroke';
    }
    return undefined;
}

/**
 * How the shared walk reads a scene node, abstracting over a live scene {@link import('ag-charts-community').Node}
 * (sampled per frame by the trajectory sampler) and a {@link SerializedSceneNode} (captured once, in-browser,
 * for scene-snapshot capture). `N` is the identity key pinned in the walk's WeakMap.
 */
export interface SceneNodeAccessor<N extends object> {
    state(node: N): SerializedNodeState;
    children(node: N): Iterable<N>;
    name(node: N): string | undefined;
    datumId(node: N): string | undefined;
}

/**
 * The shared scene walk. Reads the animatable properties of each shape node into a map keyed by a
 * stable, human-readable node path such as `series[0]/rect[B]` or `axis[left]/text[100]`. Keys are
 * assigned on first sight and pinned to the node identity `N` (via WeakMap), so a node keeps its key
 * across repeated samples even if its datum mutates; colliding names get a `#n` suffix.
 *
 * The returned `sampleInto` carries the WeakMap, so a live sampler that reuses one instance across
 * frames keeps keys stable, while a single-shot capture uses a fresh instance per call.
 */
export function createSceneWalk<N extends object>(accessor: SceneNodeAccessor<N>) {
    const nodeKeys = new WeakMap<N, string>();
    const keyCounts = new Map<string, number>();

    const assignKey = (node: N, baseKey: string): string => {
        let key = nodeKeys.get(node);
        if (key != null) return key;
        const count = keyCounts.get(baseKey) ?? 0;
        keyCounts.set(baseKey, count + 1);
        // Disambiguate inside the trailing bracket so `label[*]` globs still match: `text[A#2]`.
        key = count === 0 ? baseKey : baseKey.replace(/\]$/, `#${count + 1}]`);
        if (key === baseKey && count > 0) key = `${baseKey}#${count + 1}`;
        nodeKeys.set(node, key);
        return key;
    };

    const sampleInto = (sample: SceneGeometrySample, rootPath: string, root: N) => {
        const visit = (node: N) => {
            const state = accessor.state(node);
            const geometry = readNodeGeometry(state);
            if (geometry != null) {
                const identity = datumKeyOf(accessor.datumId(node), state);
                const baseKey = `${rootPath}/${geometry.label}[${identity ?? ''}]`;
                sample.set(assignKey(node, baseKey), geometry.props);
            } else if (state.type === 'group') {
                const props: SceneNodeGeometry = { opacity: state.props.opacity };
                for (const name of ['translationX', 'translationY', 'scalingX', 'scalingY', 'rotation'] as const) {
                    const value = state.props[name];
                    if (typeof value === 'number') props[name] = value;
                }
                props['visible'] = state.props.visible ? 1 : 0;
                sample.set(
                    assignKey(node, node === root ? rootPath : `${rootPath}/group[${accessor.name(node) ?? ''}]`),
                    props
                );
                for (const child of accessor.children(node)) {
                    visit(child);
                }
            }
        };
        visit(root);
    };

    return sampleInto;
}

const serializedAccessor: SceneNodeAccessor<SerializedSceneNode> = {
    state: (node) => node.state,
    children: (node) => node.children,
    name: (node) => node.name,
    datumId: (node) => node.datumId,
};

/**
 * Sample a serialised scene (captured in-browser) into the same {@link SceneGeometrySample} shape the
 * live trajectory sampler produces, so unit and e2e scene snapshots share one keying/geometry path.
 */
export function sampleSerializedRoots(
    roots: SerializedSceneRoots,
    { includeChrome = false }: { includeChrome?: boolean } = {}
): SceneGeometrySample {
    const sampleInto = createSceneWalk(serializedAccessor);
    const sample: SceneGeometrySample = new Map();
    for (const [i, series] of roots.series.entries()) {
        sampleInto(sample, `series[${i}]`, series.content);
        sampleInto(sample, `series[${i}]/labels`, series.labels);
        if (series.background != null) {
            sampleInto(sample, `series[${i}]/background`, series.background);
        }
    }
    for (const axis of roots.axes) {
        sampleInto(sample, `axis[${axis.position}]`, axis.axisGroup);
        sampleInto(sample, `axis[${axis.position}]/grid`, axis.grid);
    }
    if (includeChrome) {
        if (roots.captions != null) {
            sampleInto(sample, 'captions', roots.captions);
        }
        for (const { legendType, group } of roots.legends) {
            sampleInto(sample, `legend[${legendType}]`, group);
        }
    }
    if (roots.clipRect != null) {
        const { x, y, width, height } = roots.clipRect;
        sample.set('chart/clipRect', { x, y, width, height });
    }
    return sample;
}

/**
 * Deterministic plain-object form of a {@link SceneGeometrySample}: traversal-ordered keys, values
 * rounded to 3dp, non-finite values mapped to `null` (JSON cannot represent them).
 */
export function sceneSampleToJSON(sample: SceneGeometrySample): Record<string, Record<string, number | null>> {
    const result: Record<string, Record<string, number | null>> = {};
    for (const [key, props] of sample) {
        const outProps: Record<string, number | null> = {};
        for (const name of Object.keys(props)) {
            const value = props[name];
            outProps[name] = Number.isFinite(value) ? Math.round(value * 1000) / 1000 : null;
        }
        result[key] = outProps;
    }
    return result;
}
