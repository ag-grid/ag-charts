import { _ModuleSupport } from 'ag-charts-community';

export type PositionedScene = Vec2Scene | Vec4Scene;

type Vec2Scene = _ModuleSupport.Node & { x: number; y: number };
type Vec4Scene = _ModuleSupport.Node & { x: number; y: number; x1: number; y1: number; x2: number; y2: number };

export function layoutScenesRow(
    scenes: Array<PositionedScene | Array<PositionedScene>>,
    startX: number = 0,
    gaps: number | number[] = 0
) {
    let x = startX;

    let index = 0;
    for (const scene of scenes) {
        const gap = Array.isArray(gaps) ? gaps[index] ?? 0 : gaps;
        if (Array.isArray(scene)) {
            for (const scene_ of scene) {
                layoutSetX(scene_, x);
                // Correct each scene's bbox left edge before computeChildrenBBox measures the
                // column width — backing-box padding extends the bbox past the anchor point, so
                // width would be over-counted without this shift. Note: callers that apply a
                // subsequent text-alignment pass (e.g. realign()) will overwrite x for rendering.
                alignSceneLeftEdge(scene_, x);
            }
            x += _ModuleSupport.Group.computeChildrenBBox(scene).width + gap;
        } else {
            layoutSetX(scene, x);
            alignSceneLeftEdge(scene, x);
            x += scene.getBBox().width + gap;
        }
        index++;
    }
}

export function layoutScenesColumn(
    scenes: Array<PositionedScene | Array<PositionedScene>>,
    startY: number = 0,
    gaps: number | number[] = 0
) {
    let y = startY;

    let index = 0;
    for (const scene of scenes) {
        const gap = Array.isArray(gaps) ? gaps[index] ?? 0 : gaps;
        if (Array.isArray(scene)) {
            for (const scene_ of scene) {
                layoutSetY(scene_, y);
                alignSceneTopEdge(scene_, y);
            }
            y += _ModuleSupport.Group.computeChildrenBBox(scene).height + gap;
        } else {
            layoutSetY(scene, y);
            alignSceneTopEdge(scene, y);
            y += scene.getBBox().height + gap;
        }
        index++;
    }
}

// Position the scene so its bbox top sits at `targetY`. Text nodes with backing-box
// padding return a bbox that extends `padding` above `scene.y` — without this shift,
// a fixed `scene.y` would let the box overflow above its slot and shrink the gap to
// the previous sibling.
function alignSceneTopEdge(scene: PositionedScene, targetY: number) {
    const overflow = targetY - scene.getBBox().y;
    if (overflow !== 0) layoutSetY(scene, ('y1' in scene ? scene.y1 : scene.y) + overflow);
}

function alignSceneLeftEdge(scene: PositionedScene, targetX: number) {
    const overflow = targetX - scene.getBBox().x;
    if (overflow !== 0) layoutSetX(scene, ('x1' in scene ? scene.x1 : scene.x) + overflow);
}

function layoutSetX(scene: PositionedScene, x: number) {
    if ('x1' in scene) {
        scene.x2 = x + (scene.x2 - scene.x1);
        scene.x1 = x;
    } else {
        scene.x = x;
    }
}

function layoutSetY(scene: PositionedScene, y: number) {
    if ('y1' in scene) {
        scene.y2 = y + (scene.y2 - scene.y1);
        scene.y1 = y;
    } else {
        scene.y = y;
    }
}
