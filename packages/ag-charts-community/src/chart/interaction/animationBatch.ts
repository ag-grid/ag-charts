import { type IAnimation, PHASE_METADATA, PHASE_ORDER } from '../../motion/animation';
import { Debug } from '../../util/debug';
import { Logger } from '../../util/logger';

/**
 * A batch of animations that are synchronised together. Can be skipped independently of other batches and the main
 * animation skipping status.
 */
export class AnimationBatch {
    private readonly debug = Debug.create(true, 'animation');
    private readonly controllers: Map<string, IAnimation> = new Map();
    public readonly stoppedCbs: Set<() => void> = new Set();

    private currentPhase = 0;
    private readonly phases = new Map(PHASE_ORDER.map((p) => [p, [] as IAnimation[]]));
    private skipAnimations = false;
    private animationTimeConsumed = 0;

    /** Guard against premature animation execution. */
    private isReady = false;

    constructor(private readonly maxAnimationTime: number) {}

    get size() {
        return this.controllers.size;
    }

    get consumedTimeMs() {
        return this.animationTimeConsumed;
    }

    isActive() {
        return this.controllers.size > 0;
    }

    getActiveControllers(): IAnimation[] {
        return this.phases.get(PHASE_ORDER[this.currentPhase]) ?? [];
    }

    checkOverlappingId(id: string) {
        if (id != null && this.controllers.has(id)) {
            this.controllers.get(id)!.stop();

            this.debug(`Skipping animation batch due to update of existing animation: ${id}`);
            this.skip();
        }
    }

    addAnimation(animation: IAnimation) {
        if (animation.isComplete) return;

        const animationPhaseIdx = PHASE_ORDER.indexOf(animation.phase);
        if (animationPhaseIdx < this.currentPhase) {
            // Animation is for an earlier phase that the batch is currently in, so skip it.
            this.debug(`Skipping animation due to being for an earlier phase`, animation.id);
            animation.stop();
            return;
        }

        this.controllers.set(animation.id, animation);
        this.phases.get(animation.phase)?.push(animation);
    }

    removeAnimation(animation: IAnimation) {
        this.controllers.delete(animation.id);

        const phase = this.phases.get(animation.phase);
        const index = phase?.indexOf(animation);
        if (index != null && index >= 0) {
            phase?.splice(index, 1);
        }
    }

    progress(deltaTime: number) {
        if (!this.isReady) return;

        // Allow deltaTime 0 to progress through all phases if none of the animations consume time.
        let unusedTime = deltaTime === 0 ? 0.01 : deltaTime;

        const refresh = () => {
            const phase = PHASE_ORDER[this.currentPhase];
            return {
                phaseControllers: [...this.getActiveControllers()],
                phase,
                phaseMeta: PHASE_METADATA[phase],
            };
        };

        let { phase, phaseControllers, phaseMeta } = refresh();

        const arePhasesComplete = () => PHASE_ORDER[this.currentPhase] == null;
        const progressPhase = () => {
            ({ phase, phaseControllers, phaseMeta } = refresh());
            while (!arePhasesComplete() && phaseControllers.length === 0) {
                this.currentPhase++;
                ({ phase, phaseControllers, phaseMeta } = refresh());
                this.debug(`AnimationBatch - phase changing to ${phase}`, { unusedTime }, phaseControllers);
            }
        };

        const total = this.controllers.size;
        this.debug(`AnimationBatch - ${deltaTime}ms; phase ${phase} with ${phaseControllers?.length} of ${total}`);

        do {
            const phaseDeltaTime = unusedTime;
            const skipPhase = phaseMeta.skipIfNoEarlierAnimations && this.animationTimeConsumed === 0;
            let completeCount = 0;
            for (const controller of phaseControllers) {
                if (skipPhase) {
                    controller.stop();
                } else {
                    unusedTime = Math.min(controller.update(phaseDeltaTime), unusedTime);
                }

                if (controller.isComplete) {
                    completeCount++;
                    this.removeAnimation(controller);
                }
            }

            this.animationTimeConsumed += phaseDeltaTime - unusedTime;

            this.debug(`AnimationBatch - updated ${phaseControllers.length} controllers; ${completeCount} completed`);
            this.debug(`AnimationBatch - animationTimeConsumed: ${this.animationTimeConsumed}`);
            progressPhase();
        } while (unusedTime > 0 && !arePhasesComplete());

        if (this.animationTimeConsumed > this.maxAnimationTime) {
            Logger.warnOnce(
                'Animation batch exceeded max animation time, skipping.',
                new Map(this.controllers.entries())
            );
            this.stop();
        }
    }

    ready() {
        if (this.isReady) return;

        this.isReady = true;

        this.debug(`AnimationBatch - ready; skipped: ${this.skipAnimations}`, [...this.controllers]);

        let skipAll = true;
        for (const [, controller] of this.controllers) {
            if (controller.duration > 0 && PHASE_METADATA[controller.phase].skipIfNoEarlierAnimations !== true) {
                skipAll = false;
                break;
            }
        }

        if (!skipAll) {
            for (const [, controller] of this.controllers) {
                if (controller.autoplay) {
                    controller.play(true);
                }
            }
        }
    }

    skip(skip = true) {
        if (this.skipAnimations === false && skip === true) {
            for (const controller of this.controllers.values()) {
                controller.stop();
            }
            this.controllers.clear();
        }
        this.skipAnimations = skip;
    }

    play() {
        for (const controller of this.controllers.values()) {
            controller.play();
        }
    }

    pause() {
        for (const controller of this.controllers.values()) {
            controller.pause();
        }
    }

    stop() {
        for (const controller of this.controllers.values()) {
            try {
                controller.stop();
                this.removeAnimation(controller);
            } catch (error: unknown) {
                Logger.error('Error during animation stop', error);
            }
        }
        this.dispatchStopped();
    }

    stopByAnimationId(id: string) {
        if (id != null && this.controllers.has(id)) {
            const controller = this.controllers.get(id);
            if (controller) {
                controller.stop();
                this.removeAnimation(controller);
            }
        }
    }

    stopByAnimationGroupId(id: string) {
        for (const controller of this.controllers.values()) {
            if (controller.groupId === id) {
                this.stopByAnimationId(controller.id);
            }
        }
    }

    private dispatchStopped() {
        this.stoppedCbs.forEach((cb) => cb());
        this.stoppedCbs.clear();
    }

    isSkipped() {
        return this.skipAnimations;
    }

    destroy() {
        this.stop();
        this.controllers.clear();
    }
}
