import type { AgCartesianAxisPosition } from '../../options/agChartOptions';
import { CartesianAxis } from '../axis/cartesianAxis';
import type { ChartAxis } from '../chartAxis';

const CartesianAxisPositions: AgCartesianAxisPosition[] = ['top', 'right', 'bottom', 'left'];

function isAxisPosition(position: unknown): position is AgCartesianAxisPosition {
    return typeof position === 'string' && CartesianAxisPositions.includes(position as AgCartesianAxisPosition);
}

export function guessInvalidPositions(axes: ChartAxis[]) {
    const invalidAxes: ChartAxis[] = [];
    const usedPositions: AgCartesianAxisPosition[] = [];
    const guesses = [...CartesianAxisPositions];

    for (const axis of axes) {
        if (axis instanceof CartesianAxis) {
            if (isAxisPosition(axis.position)) {
                usedPositions.push(axis.position);
            } else {
                invalidAxes.push(axis);
            }
        }
    }

    for (const axis of invalidAxes) {
        let nextGuess: AgCartesianAxisPosition | undefined;
        do {
            nextGuess = guesses.pop();
        } while (nextGuess && usedPositions.includes(nextGuess));
        if (nextGuess == null) break;
        axis.position = nextGuess;
    }
}
