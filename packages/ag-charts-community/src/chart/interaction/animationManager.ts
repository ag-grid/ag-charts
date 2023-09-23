import { Debug } from '../../util/debug';
import { BaseManager } from './baseManager';
import type { InteractionManager } from './interactionManager';
import type { AnimationOptions, AnimationValue, IAnimation } from '../../motion/animation';
import { Animation } from '../../motion/animation';
import { onContentLoaded } from '../../util/document';

type AnimationEventType = 'animation-frame';

interface AnimationEvent {
    type: AnimationEventType;
    deltaMs: number;
}

/**
 * Manage animations across a chart, running all animations through only one `requestAnimationFrame` callback,
 * preventing duplicate animations and handling their lifecycle.
 */
export class AnimationManager extends BaseManager<AnimationEventType, AnimationEvent> {
    private readonly debug = Debug.create(true, 'animation');
    private readonly controllers: Map<string, IAnimation<any>> = new Map();

    defaultDuration = 1000;

    private isPlaying = false;
    private requestId: number | null = null;
    private readyToPlay = false;
    private skipAnimations = false;

    private interactionManager: InteractionManager;

    constructor(interactionManager: InteractionManager) {
        super();
        this.interactionManager = interactionManager;
        onContentLoaded(() => {
            this.readyToPlay = true;
        });
    }

    /**
     * Create an animation to tween a value between the `from` and `to` properties. If an animation already exists
     * with the same `id`, immediately stop it.
     */
    public animate<T extends AnimationValue>(opts: AnimationOptions<T> & { disableInteractions?: boolean }) {
        if (opts.id != null && this.controllers.has(opts.id)) {
            return this.controllers.get(opts.id)!.reset(opts);
        }

        const id = opts.id ?? Math.random().toString();

        return new Animation({
            ...opts,
            skip: this.skipAnimations,
            autoplay: this.isPlaying ? opts.autoplay : false,
            duration: opts.duration ?? this.defaultDuration,
            onPlay: (controller) => {
                this.controllers.set(id, controller);
                this.requestAnimation();
                if (opts.disableInteractions ?? true) {
                    this.interactionManager.pause(`animation_${id}`);
                }
                opts.onPlay?.(controller);
            },
            onStop: (controller) => {
                this.controllers.delete(id);
                if (this.controllers.size === 0) {
                    this.cancelAnimation();
                }
                if (opts.disableInteractions ?? true) {
                    this.interactionManager.resume(`animation_${id}`);
                }
                opts.onStop?.(controller);
            },
        });
    }

    public play() {
        if (this.isPlaying) {
            return;
        }

        this.isPlaying = true;

        this.debug('AnimationManager.play()');

        for (const controller of this.controllers.values()) {
            controller.play();
        }

        this.requestAnimation();
    }

    public pause() {
        if (!this.isPlaying) {
            return;
        }

        this.isPlaying = false;
        this.cancelAnimation();
        this.debug('AnimationManager.pause()');

        for (const controller of this.controllers.values()) {
            controller.pause();
        }
    }

    public stop() {
        this.isPlaying = false;
        this.cancelAnimation();
        this.debug('AnimationManager.stop()');

        for (const controller of this.controllers.values()) {
            controller.stop();
        }
    }

    public reset() {
        if (this.isPlaying) {
            this.stop();
            this.play();
        } else {
            this.stop();
        }
    }

    public skip(skip = true) {
        this.skipAnimations = skip;
    }

    public isSkipped() {
        return this.skipAnimations;
    }

    private requestAnimation() {
        if (this.controllers.size === 0 || this.requestId !== null) return;

        let prevTime: number;
        const onAnimationFrame = (time: number) => {
            this.requestId = requestAnimationFrame(onAnimationFrame);

            if (!this.readyToPlay) {
                return;
            }

            const deltaTime = time - (prevTime ?? time);

            prevTime = time;

            this.debug('AnimationManager - onAnimationFrame()', { controllersCount: this.controllers.size });

            for (const controller of this.controllers.values()) {
                controller.update(deltaTime);
            }

            this.listeners.dispatch('animation-frame', { type: 'animation-frame', deltaMs: deltaTime });
        };

        this.requestId = requestAnimationFrame(onAnimationFrame);
    }

    private cancelAnimation() {
        if (this.requestId === null) return;
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
    }
}
