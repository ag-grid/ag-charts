import type {
    AgBaseAxisOptions,
    AgBaseCartesianAxisOptions,
    AgCartesianAxisPosition,
    AgCartesianAxisType,
} from '../../options/agChartOptions';
import type { ChartAxis } from '../chartAxis';

const CARTESIAN_AXIS_POSITIONS: AgCartesianAxisPosition[] = ['top', 'right', 'bottom', 'left'];
const CARTESIAN_AXIS_TYPES: AgCartesianAxisType[] = [
    'category',
    'grouped-category',
    // 'ordinal-time',
    'number',
    'log',
    'time',
];

function hasCartesianAxisPosition(axis: ChartAxis): axis is ChartAxis & { position: AgCartesianAxisPosition } {
    const allowedTypes: string[] = CARTESIAN_AXIS_TYPES;
    return allowedTypes.includes(axis.type);
}

function isCartesianAxisOptions(options: AgBaseAxisOptions): options is AgBaseCartesianAxisOptions {
    const allowedTypes: string[] = CARTESIAN_AXIS_TYPES;
    return allowedTypes.includes(options.type);
}

function isAxisPosition(position: unknown): position is AgCartesianAxisPosition {
    const allowedPositions: string[] = CARTESIAN_AXIS_POSITIONS;
    return typeof position === 'string' && allowedPositions.includes(position);
}

// If axis[].position, then we cannot always default to the same value. We need
// to default to an 'untaken' position (see AG-9963 for more info).
export class AxisPositionGuesser {
    private result: ChartAxis[] = [];
    private valid: ChartAxis[] = [];
    private invalid: ChartAxis[] = [];

    push(axis: ChartAxis, options: AgBaseAxisOptions) {
        const { result, valid, invalid } = this;
        if (isCartesianAxisOptions(options)) {
            if (isAxisPosition(options.position)) {
                valid.push(axis);
            } else {
                invalid.push(axis);
            }
        }

        result.push(axis);
    }

    guessInvalidPositions() {
        const takenPosition: (AgCartesianAxisPosition | undefined)[] = this.valid
            .filter((v) => hasCartesianAxisPosition(v))
            .map((v) => v.position)
            .filter((v) => v !== undefined);
        const guesses: AgCartesianAxisPosition[] = ['top', 'right', 'bottom', 'left'];
        for (const invalidAxis of this.invalid) {
            let nextGuess = guesses.pop();
            while (takenPosition.includes(nextGuess) && nextGuess !== undefined) {
                nextGuess = guesses.pop();
            }

            if (nextGuess === undefined) break;
            invalidAxis.position = nextGuess;
        }

        return this.result;
    }
}
