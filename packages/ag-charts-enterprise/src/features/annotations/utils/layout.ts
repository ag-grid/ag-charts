import { _Scene } from 'ag-charts-community';

export type PositionedScene = _Scene.Node & { x: number; y: number };

export function layoutScenesRow(
    scenes: Array<PositionedScene | Array<PositionedScene>>,
    startX: number = 0,
    gap: number = 0
) {
    let x = startX;

    for (const scene of scenes) {
        if (Array.isArray(scene)) {
            for (const scene_ of scene) {
                scene_.x = x;
            }
            x += _Scene.Group.computeChildrenBBox(scene).width + gap;
        } else {
            scene.x = x;
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
                scene_.y = y;
            }
            y += _Scene.Group.computeChildrenBBox(scene).height + gap;
        } else {
            scene.y = y;
            y += scene.getBBox().height + gap;
        }
    }
}
