import { Node } from '../scene/node';
import type { Selection } from '../scene/selection';
import { interpolateColor, interpolateNumber } from '../util/interpolate';
import { jsonDiff } from '../util/json';
import { clamp } from '../util/number';
import { linear } from './easing';

export type AnimationTiming = {
    animationDuration: number;
    animationDelay: number;
};
export const QUICK_TRANSITION = 0.2;
export const INITIAL_LOAD: AnimationTiming = {
    animationDuration: 1,
    animationDelay: 0,
};
export const REMOVE_PHASE: AnimationTiming = {
    animationDuration: 0.25,
    animationDelay: 0,
};
export const UPDATE_PHASE: AnimationTiming = {
    animationDuration: 0.5,
    animationDelay: 0.25,
};
export const ADD_PHASE: AnimationTiming = {
    animationDuration: 0.25,
    animationDelay: 0.75,
};
export const LABEL_PHASE: AnimationTiming = {
    animationDuration: QUICK_TRANSITION,
    animationDelay: 1,
};

export const ANIMATION_PHASE_ORDER = ['initial', 'remove', 'update', 'add', 'trailing', 'end'] as const;
export type AnimationPhase = (typeof ANIMATION_PHASE_ORDER)[number];
export const ANIMATION_PHASE_TIMINGS: Record<AnimationPhase, AnimationTiming> = {
    initial: INITIAL_LOAD,
    add: ADD_PHASE,
    remove: REMOVE_PHASE,
    update: UPDATE_PHASE,
    trailing: LABEL_PHASE,
    end: {
        animationDelay: 1 + QUICK_TRANSITION,
        animationDuration: 0,
    },
};

export type AnimationValue = number | string | undefined | Record<string, number | string | undefined>;

export enum RepeatType {
    Loop = 'loop',
    Reverse = 'reverse',
}
export interface AnimationOptions<T extends AnimationValue> {
    id: string;
    groupId: string;
    from: T;
    to: T;
    phase: AnimationPhase;
    skip?: boolean;
    autoplay?: boolean;
    /** Duration of this animation, expressed as a proportion of the total animation time. */
    duration?: number;
    /** Delay before starting this animation, expressed as a proportion of the total animation time. */
    delay?: number;
    ease?: (x: number) => number;
    /** Number of times to repeat the animation before stopping. Set to `0` to disable repetition. */
    repeat?: number;
    repeatType?: RepeatType;
    /** Called once when the animation is successfully completed, after all repetitions if any. */
    onComplete?: (self: IAnimation) => void;
    onPlay?: (self: IAnimation) => void;
    /** Called once when then animation successfully completes or is prematurely stopped. */
    onStop?: (self: IAnimation) => void;
    onRepeat?: (self: IAnimation) => void;
    /** Called once per frame with the tweened value between the `from` and `to` properties. */
    onUpdate?: (value: T, preInit: boolean, self: IAnimation) => void;
}

export interface AdditionalAnimationOptions {
    id?: string;
    disableInteractions?: boolean;
}

export interface IAnimation {
    readonly id: string;
    readonly groupId: string;
    readonly phase: AnimationPhase;
    readonly isComplete: boolean;
    readonly delay: number;
    readonly duration: number;
    readonly play: () => void;
    readonly pause: () => void;
    readonly stop: () => void;
    readonly update: (time: number) => number;
}

function isNodeArray<N extends Node>(array: (object | N)[]): array is N[] {
    return array.every((n) => n instanceof Node);
}

export function deconstructSelectionsOrNodes<N extends Node, D>(
    selectionsOrNodes: Selection<N, D>[] | N[]
): { nodes: N[]; selections: Selection<N, D>[] } {
    return isNodeArray(selectionsOrNodes)
        ? { nodes: selectionsOrNodes, selections: [] }
        : { nodes: [], selections: selectionsOrNodes };
}

export class Animation<T extends AnimationValue> implements IAnimation {
    public readonly id;
    public readonly groupId;
    public readonly phase: AnimationPhase;
    public isComplete = false;
    public readonly delay;
    public readonly duration;
    protected autoplay;
    protected ease;

    protected elapsed = 0;
    protected iteration = 0;

    private isPlaying = false;
    private isReverse = false;

    private readonly onComplete; // onEnd
    private readonly onPlay; // onStart
    private readonly onStop; // onCancel
    private readonly onUpdate;

    private interpolate: (delta: number) => T;

    constructor(opts: AnimationOptions<T> & { defaultDuration: number }) {
        // animation configuration
        this.id = opts.id;
        this.groupId = opts.groupId;
        this.autoplay = opts.autoplay ?? true;
        this.ease = opts.ease ?? linear;
        this.phase = opts.phase;

        const durationProportion = opts.duration ?? ANIMATION_PHASE_TIMINGS[this.phase].animationDuration;
        this.duration = durationProportion * opts.defaultDuration;
        this.delay = (opts.delay ?? 0) * opts.defaultDuration;

        // user defined event listeners
        this.onComplete = opts.onComplete;
        this.onPlay = opts.onPlay;
        this.onStop = opts.onStop;
        this.onUpdate = opts.onUpdate;

        // animation interpolator based on `from` & `to` types
        this.interpolate = this.createInterpolator(opts.from, opts.to) as (delta: number) => T;

        if (opts.skip === true) {
            this.onUpdate?.(opts.to, false, this);
            this.onStop?.(this);
            this.onComplete?.(this);
            this.isComplete = true;
        } else if (this.autoplay) {
            this.play();
            // Initialise the animation immediately without requesting a frame to prevent flashes
            this.onUpdate?.(opts.from, true, this);
        }

        // Treat this animation as having zero duration if there is no difference between from and to
        // state, allowing us to run the update processing once and then skip any further updates.
        // This additionally allows animation phases to progress if all animations in a phase are
        // no-ops.
        let isNoop = opts.from === opts.to;
        isNoop ||= typeof opts.from === 'object' && jsonDiff(opts.from, opts.to) == null;
        if (isNoop) {
            this.duration = 0;
        }
    }

    play() {
        if (!this.isPlaying && !this.isComplete) {
            this.isPlaying = true;
            this.onPlay?.(this);
        }
    }

    pause() {
        if (this.isPlaying) {
            this.isPlaying = false;
        }
    }

    stop() {
        if (this.isPlaying) {
            this.isPlaying = false;
            this.isComplete = true;
            this.onStop?.(this);
        }
    }

    update(time: number) {
        const previousElapsed = this.elapsed;
        this.elapsed += time;

        if (this.delay > this.elapsed) return 0;

        const value = this.interpolate(this.isReverse ? 1 - this.delta : this.delta);

        this.onUpdate?.(value, false, this);

        const totalDuration = this.delay + this.duration;
        if (this.elapsed >= totalDuration) {
            this.stop();
            this.isComplete = true;
            this.onComplete?.(this);

            return time - (totalDuration - previousElapsed);
        }

        return 0;
    }

    protected get delta() {
        return this.ease(clamp(0, (this.elapsed - this.delay) / this.duration, 1));
    }

    private createInterpolator(from: AnimationValue, to: AnimationValue) {
        if (typeof to !== 'object') {
            return this.interpolateValue(from, to);
        }
        type InterpolatorTuple = [string, (d: number) => number | string];
        const interpolatorEntries: InterpolatorTuple[] = [];
        for (const key in to) {
            const interpolator = this.interpolateValue((from as typeof to)[key], to[key]);
            if (interpolator != null) {
                interpolatorEntries.push([key, interpolator]);
            }
        }
        return (d: number) => {
            const result: Record<string, number | string> = {};
            for (const [key, interpolator] of interpolatorEntries) {
                result[key] = interpolator(d);
            }
            return result;
        };
    }

    private interpolateValue(a: any, b: any) {
        if (a === undefined || b === undefined) {
            return undefined;
        }

        try {
            switch (typeof a) {
                case 'number':
                    return interpolateNumber(a, b);
                case 'string':
                    return interpolateColor(a, b);
            }
        } catch (e) {
            // Error-case handled below.
        }
        throw new Error(`Unable to interpolate values: ${a}, ${b}`);
    }
}
