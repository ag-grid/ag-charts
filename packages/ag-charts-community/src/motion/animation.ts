import { interpolateColor, interpolateNumber } from '../interpolate';
import { Node } from '../scene/node';
import type { Selection } from '../scene/selection';
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
    skip?: boolean;
    autoplay?: boolean;
    /** Time in milliseconds to wait before starting the animation. */
    delay?: number;
    duration?: number;
    ease?: (x: number) => number;
    /** Number of times to repeat the animation before stopping. Set to `0` to disable repetition. */
    repeat?: number;
    repeatType?: RepeatType;
    /** Called once when the animation is successfully completed, after all repetitions if any. */
    onComplete?: (this: IAnimation<T>, self: IAnimation<T>) => void;
    onPlay?: (this: IAnimation<T>, self: IAnimation<T>) => void;
    /** Called once when then animation successfully completes or is prematurely stopped. */
    onStop?: (this: IAnimation<T>, self: IAnimation<T>) => void;
    onRepeat?: (this: IAnimation<T>, self: IAnimation<T>) => void;
    /** Called once per frame with the tweened value between the `from` and `to` properties. */
    onUpdate?: (this: IAnimation<T>, value: T, preInit: boolean, self: IAnimation<T>) => void;
}

export interface AdditionalAnimationOptions {
    id?: string;
    disableInteractions?: boolean;
    immutable?: boolean;
}

export type ResetAnimationOptions<T extends AnimationValue> = Pick<
    AnimationOptions<T>,
    'from' | 'to' | 'delay' | 'duration' | 'ease'
>;

export interface IAnimation<T extends AnimationValue> {
    readonly id: string;
    readonly groupId: string;
    readonly play: () => this;
    readonly pause: () => this;
    readonly stop: () => this;
    readonly reset: (opts: ResetAnimationOptions<T>) => this;
    readonly update: (time: number) => this;
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

export class Animation<T extends AnimationValue> implements IAnimation<T> {
    public readonly id;
    public readonly groupId;
    protected autoplay;
    protected delay;
    protected duration;
    protected ease;
    protected repeat;
    protected repeatType;

    protected elapsed = 0;
    protected iteration = 0;

    private isPlaying = false;
    private isReverse = false;

    private readonly onComplete; // onEnd
    private readonly onPlay; // onStart
    private readonly onStop; // onCancel
    private readonly onRepeat; // onIteration
    private readonly onUpdate;

    private interpolate: (delta: number) => T;

    constructor(opts: AnimationOptions<T>) {
        // animation configuration
        this.id = opts.id;
        this.groupId = opts.groupId;
        this.autoplay = opts.autoplay ?? true;
        this.delay = opts.delay ?? 0;
        this.duration = opts.duration ?? 1000;
        this.ease = opts.ease ?? linear;
        this.repeat = opts.repeat ?? 0;
        this.repeatType = opts.repeatType ?? RepeatType.Loop;

        // user defined event listeners
        this.onComplete = opts.onComplete;
        this.onPlay = opts.onPlay;
        this.onStop = opts.onStop;
        this.onRepeat = opts.onRepeat;
        this.onUpdate = opts.onUpdate;

        // animation interpolator based on `from` & `to` types
        this.interpolate = this.createInterpolator(opts.from, opts.to) as (delta: number) => T;

        if (opts.skip === true) {
            this.onUpdate?.(opts.to, false, this);
            this.onStop?.(this);
            this.onComplete?.(this);
        } else if (this.autoplay) {
            this.play();
            // Initialise the animation immediately without requesting a frame to prevent flashes
            this.onUpdate?.(opts.from, true, this);
        }
    }

    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.onPlay?.(this);
        }
        return this;
    }

    pause() {
        if (this.isPlaying) {
            this.isPlaying = false;
        }
        return this;
    }

    stop() {
        if (this.isPlaying) {
            this.isPlaying = false;
            this.onStop?.(this);
        }
        return this;
    }

    reset(opts: ResetAnimationOptions<T>) {
        const deltaState = this.interpolate(this.isReverse ? 1 - this.delta : this.delta);
        this.interpolate = this.createInterpolator(deltaState, opts.to) as (delta: number) => T;

        this.elapsed = 0;
        this.iteration = 0;

        if (typeof opts.delay === 'number') {
            this.delay = opts.delay;
        }
        if (typeof opts.duration === 'number') {
            this.duration = opts.duration;
        }
        if (typeof opts.ease === 'function') {
            this.ease = opts.ease;
        }

        return this;
    }

    update(time: number) {
        this.elapsed += time;

        if (this.elapsed <= this.delay) {
            return this;
        }

        const value = this.interpolate(this.isReverse ? 1 - this.delta : this.delta);

        this.onUpdate?.(value, false, this);

        if (this.elapsed - this.delay >= this.duration) {
            if (this.iteration < this.repeat) {
                this.iteration++;
                this.elapsed = ((this.elapsed - this.delay) % this.duration) + this.delay;
                if (this.repeatType === RepeatType.Reverse) {
                    this.isReverse = !this.isReverse;
                }
                this.onRepeat?.(this);
            } else {
                this.stop();
                this.onComplete?.(this);
            }
        }

        return this;
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
