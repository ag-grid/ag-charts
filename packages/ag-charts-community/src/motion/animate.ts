export interface KeyframesOptions<T> {
    /** Length of the animation in milliseconds. */
    duration: number;
    from: T;
    to: T;
    /** Function with which to tween the value between `from` and `to`. See https://easings.net for examples. */
    ease?: (x: number) => number;
}

export enum RepeatType {
    Loop = 'loop',
    Reverse = 'reverse',
}

export interface AnimationOptions<T> extends KeyframesOptions<T> {
    driver: Driver;
    autoplay?: boolean;
    /** Time in milliseconds to wait before starting the animation. */
    delay?: number;
    /** Number of times to repeat the animation before stopping. Set to `0` to disable repetition. */
    repeat?: number;
    repeatType?: RepeatType;
    /** Called once when the animation is successfully completed, after all repetitions if any. */
    onComplete?: () => void;
    onPlay?: () => void;
    onRepeat?: () => void;
    /** Called once when then animation successfully completes or is prematurely stopped. */
    onStop?: () => void;
    /** Called once per frame with the tweened value between the `from` and `to` properties. */
    onUpdate?: (v: T) => void;
}

export interface AnimationControls {
    // isPlaying: boolean;
    play: () => AnimationControls;
    pause: () => AnimationControls;
    stop: () => AnimationControls;
    reset: () => AnimationControls;
}

export interface DriverControls {
    start: () => void;
    stop: () => void;
    reset: () => void;
}

export type Driver = (update: (time: number) => void) => DriverControls;

// export function animate<T = number>({
//     driver,
//     duration,
//     from,
//     to,
//     autoplay = true,
//     delay = 0,
//     ease = linear,
//     repeat: repeatMax = 0,
//     repeatType = RepeatType.Loop,
//     onComplete,
//     onPlay,
//     onRepeat,
//     onStop,
//     onUpdate,
// }: AnimationOptions<T>): AnimationControls {
//     let state: T;
//     let delayElapsed = 0;
//     let elapsed = 0;
//     let iteration = 0;
//     let isForward = true;
//     let isComplete = false;
//
//     const easing = ease({ from, to });
//     const controls: AnimationControls = { play, pause, stop, reset };
//     const driverControls = driver(update);
//
//     function play(): AnimationControls {
//         // controls.isPlaying = true;
//         driverControls.start();
//         onPlay?.();
//         return controls;
//     }
//
//     function pause(): AnimationControls {
//         // controls.isPlaying = false;
//         return controls;
//     }
//
//     function stop(): AnimationControls {
//         // controls.isPlaying = false;
//         driverControls.stop();
//         onStop?.();
//         return controls;
//     }
//
//     function reset(): AnimationControls {
//         isComplete = false;
//         elapsed = 0;
//         iteration = 0;
//         driverControls.reset();
//         return controls;
//     }
//
//     function update(delta: number): void {
//         if (!isForward) delta = -delta;
//         if (delayElapsed >= delay) {
//             elapsed += delta;
//         } else {
//             delayElapsed += delta;
//             return;
//         }
//
//         if (!isComplete) {
//             state = easing(clamp(0, elapsed / duration, 1));
//             isComplete = isForward ? elapsed >= duration : elapsed <= 0;
//         }
//
//         onUpdate?.(state);
//
//         if (isComplete) {
//             if (iteration < repeatMax) {
//                 iteration++;
//
//                 if (repeatType === RepeatType.Reverse) {
//                     isForward = iteration % 2 === 0;
//                     elapsed = isForward ? elapsed % duration : duration - (elapsed % duration);
//                 } else {
//                     elapsed = elapsed % duration;
//                 }
//
//                 isComplete = false;
//                 onRepeat?.();
//             } else {
//                 stop();
//                 onComplete?.();
//             }
//         }
//     }
//
//     if (autoplay) play();
//
//     return controls;
// }
