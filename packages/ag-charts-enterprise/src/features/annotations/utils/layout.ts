import type { PositionedScene } from '../../../utils/sceneLayout';

export function layoutAddX(scene: PositionedScene, x: number) {
    if ('x1' in scene) {
        scene.x1 += x;
        scene.x2 += x;
    } else if ('translationX' in scene) {
        scene.translationX += x;
    } else {
        scene.x += x;
    }
}

export function layoutAddY(scene: PositionedScene, y: number) {
    if ('y1' in scene) {
        scene.y1 += y;
        scene.y2 += y;
    } else if ('translationY' in scene) {
        scene.translationY += y;
    } else {
        scene.y += y;
    }
}
