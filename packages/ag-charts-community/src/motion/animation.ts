import { linear } from './easing';
import { clamp } from '../util/number';
import { interpolateColor, interpolateNumber } from './interpolate';

export type AnimationValue = number | string | Record<string, number | string>;

export enum RepeatType {
    Loop = 'loop',
    Reverse = 'reverse',
}
export interface AnimationOptions<T extends AnimationValue = AnimationValue> {
    from: T;
    to: T;
    id?: string;
    autoplay?: boolean;
    /** Time in milliseconds to wait before starting the animation. */
    delay?: number;
    duration?: number;
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
    onUpdate?: (value: T, self: IAnimation) => void;
}

export interface IAnimation {
    readonly play: () => this;
    readonly pause: () => this;
    readonly stop: () => this;
    readonly reset: () => this;
    readonly update: (time: number) => this;
}

export class Animation<T extends AnimationValue> implements IAnimation {
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

    private readonly interpolate: (delta: number) => T;

    constructor(opts: AnimationOptions<T>) {
        // animation configuration
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

        if (this.autoplay) {
            this.play();
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

    reset() {
        this.elapsed = 0;
        this.iteration = 0;
        return this;
    }

    update(time: number) {
        this.elapsed += time;

        if (this.elapsed <= this.delay) {
            return this;
        }

        const delta = this.ease(clamp(0, (this.elapsed - this.delay) / this.duration, 1));
        const value = this.interpolate(this.isReverse ? 1 - delta : delta);

        this.onUpdate?.(value, this);

        if (this.elapsed - this.delay > this.duration) {
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

    private createInterpolator(from: AnimationValue, to: AnimationValue) {
        if (typeof to !== 'object') {
            return this.interpolateValue(from, to);
        }
        type InterpolatorTuple = [string, (d: number) => number | string];
        const interpolatorEntries: InterpolatorTuple[] = Object.keys(to).map((key) => [
            key,
            this.interpolateValue((from as typeof to)[key], to[key]),
        ]);
        return (d: number) => {
            const result: Record<string, number | string> = {};
            for (const [key, interpolator] of interpolatorEntries) {
                result[key] = interpolator(d);
            }
            return result;
        };
    }

    private interpolateValue(a: any, b: any) {
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
        throw new Error('Unable to interpolate values');
    }
}
