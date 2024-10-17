import { _Scene } from 'ag-charts-community';

export type PositionedScene = Vec2Scene | Vec4Scene;

type Vec2Scene = _Scene.Node & { x: number; y: number };
type Vec4Scene = _Scene.Node & { x: number; y: number; x1: number; y1: number; x2: number; y2: number };

export function layoutScenesRow(
    scenes: Array<PositionedScene | Array<PositionedScene>>,
    startX: number = 0,
    gap: number = 0
) {
    let x = startX;

    for (const scene of scenes) {
        if (Array.isArray(scene)) {
            for (const scene_ of scene) {
                layoutSetX(scene_, x);
            }
            x += _Scene.Group.computeChildrenBBox(scene).width + gap;
        } else {
            layoutSetX(scene, x);
            x += scene.getBBox().width + gap;
        }
    }
}

export function layoutScenesColumn(
    scenes: Array<PositionedScene | Array<PositionedScene>>,
    startY: number = 0,
    gap: number = 0
) {
    let y = startY;

    for (const scene of scenes) {
        if (Array.isArray(scene)) {
            for (const scene_ of scene) {
                layoutSetY(scene_, y);
            }
            y += _Scene.Group.computeChildrenBBox(scene).height + gap;
        } else {
            layoutSetY(scene, y);
            y += scene.getBBox().height + gap;
        }
    }
}

export function layoutSetX(scene: PositionedScene, x: number) {
    if ('x1' in scene) {
        scene.x2 = x + (scene.x2 - scene.x1);
        scene.x1 = x;
    } else {
        scene.x = x;
    }
}

export function layoutSetY(scene: PositionedScene, y: number) {
    if ('y1' in scene) {
        scene.y2 = y + (scene.y2 - scene.y1);
        scene.y1 = y;
    } else {
        scene.y = y;
    }
}

export function layoutAddX(scene: PositionedScene, x: number) {
    if ('x1' in scene) {
        scene.x1 += x;
        scene.x2 += x;
    } else {
        scene.x += x;
    }
}

export function layoutAddY(scene: PositionedScene, y: number) {
    if ('y1' in scene) {
        scene.y1 += y;
        scene.y2 += y;
    } else {
        scene.y += y;
    }
}
