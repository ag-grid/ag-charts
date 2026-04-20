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
        const gap = Array.isArray(gaps) ? gaps[index] : gaps;
        if (Array.isArray(scene)) {
            for (const scene_ of scene) {
                layoutSetX(scene_, x);
            }
            x += _ModuleSupport.Group.computeChildrenBBox(scene).width + gap;
        } else {
            layoutSetX(scene, x);
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
        const gap = Array.isArray(gaps) ? gaps[index] : gaps;
        if (Array.isArray(scene)) {
            for (const scene_ of scene) {
                layoutSetY(scene_, y);
            }
            y += _ModuleSupport.Group.computeChildrenBBox(scene).height + gap;
        } else {
            layoutSetY(scene, y);
            y += scene.getBBox().height + gap;
        }
        index++;
    }
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
