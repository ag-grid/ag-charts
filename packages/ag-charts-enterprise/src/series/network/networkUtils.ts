import { _ModuleSupport } from 'ag-charts-community';
import { type Point, clamp } from 'ag-charts-core';

const DOWN = Math.PI * 0;
const LEFT = Math.PI * 0.5;
const UP = Math.PI * 1;
const RIGHT = Math.PI * 1.5;

const DOWN_CCW = UP;
const LEFT_CCW = RIGHT;
const UP_CCW = DOWN;
const RIGHT_CCW = LEFT;

export function pathWithElbows(
    path: _ModuleSupport.ExtendedPath2D,
    start: Point,
    elbows: Point[],
    end: Point,
    cornerRadii: number[]
) {
    path.moveTo(start.x, start.y);

    for (let index = 0; index < elbows.length; index++) {
        const elbow = elbows[index];

        const from = elbows[index - 1] ?? start;
        const to = elbows[index + 1] ?? end;

        const radius = clamp(0, cornerRadii[index], Math.min(Math.abs(from.x - to.x), Math.abs(from.y - to.y)) / 2);

        if (radius <= 0) {
            path.lineTo(elbow.x, elbow.y);
            continue;
        }

        const direction = elbowDirection(from, elbow, to);

        switch (direction) {
            case 'down-left':
                path.lineTo(elbow.x, elbow.y - radius);
                path.arc(elbow.x - radius, elbow.y - radius, radius, DOWN, LEFT, false);
                break;

            case 'down-right':
                path.lineTo(elbow.x, elbow.y - radius);
                path.arc(elbow.x + radius, elbow.y - radius, radius, DOWN_CCW, RIGHT_CCW, true);
                break;

            case 'up-left':
                path.lineTo(elbow.x, elbow.y + radius);
                path.arc(elbow.x - radius, elbow.y + radius, radius, UP_CCW, LEFT_CCW, true);
                break;

            case 'up-right':
                path.lineTo(elbow.x, elbow.y + radius);
                path.arc(elbow.x + radius, elbow.y + radius, radius, UP, RIGHT, false);
                break;

            case 'left-down':
                path.lineTo(elbow.x + radius, elbow.y);
                path.arc(elbow.x + radius, elbow.y + radius, radius, LEFT_CCW, DOWN_CCW, true);
                break;

            case 'left-up':
                path.lineTo(elbow.x + radius, elbow.y);
                path.arc(elbow.x + radius, elbow.y - radius, radius, LEFT, UP, false);
                break;

            case 'right-down':
                path.lineTo(elbow.x - radius, elbow.y);
                path.arc(elbow.x - radius, elbow.y + radius, radius, RIGHT, DOWN, false);
                break;

            case 'right-up':
                path.lineTo(elbow.x - radius, elbow.y);
                path.arc(elbow.x - radius, elbow.y - radius, radius, RIGHT_CCW, UP_CCW, true);
                break;

            case 'straight':
                path.lineTo(elbow.x, elbow.y);
                break;
        }
    }

    path.lineTo(end.x, end.y);
}

function elbowDirection(from: Point, elbow: Point, to: Point) {
    if (from.x === to.x || from.y === to.y) return 'straight';

    const d0x = Math.abs(from.x - elbow.x);
    const d0y = Math.abs(from.y - elbow.y);

    if (d0x >= d0y) {
        if (elbow.x > from.x) {
            if (to.y > elbow.y) return 'right-down';
            return 'right-up';
        }
        if (to.y > elbow.y) return 'left-down';
        return 'left-up';
    }

    if (to.x > elbow.x) {
        if (elbow.y > from.y) return 'down-right';
        return 'up-right';
    }
    if (elbow.y > from.y) return 'down-left';
    return 'up-left';
}
