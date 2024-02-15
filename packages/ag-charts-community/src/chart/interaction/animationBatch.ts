import { ANIMATION_PHASE_ORDER, type IAnimation } from '../../motion/animation';
import { Debug } from '../../util/debug';
import { Logger } from '../../util/logger';

const DEBUG_SELECTORS = [true, 'animation'];

/**
 * A batch of animations that are synchronised together. Can be skipped independently of other batches and the main
 * animation skipping status.
 */
export class AnimationBatch {
    public readonly stoppedCbs: Set<() => void> = new Set();
    private readonly controllers: Map<string, IAnimation> = new Map();

    private readonly debug = Debug.create(...DEBUG_SELECTORS);

    private currentPhase = 0;
    private phases = new Map(ANIMATION_PHASE_ORDER.map((p) => [p, [] as IAnimation[]]));
    private skipAnimations = false;

    get size() {
        return this.controllers.size;
    }

    isActive() {
        return this.controllers.size > 0;
    }

    getActiveControllers(): IAnimation[] {
        return this.phases.get(ANIMATION_PHASE_ORDER[this.currentPhase]) ?? [];
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

        const animationPhaseIdx = ANIMATION_PHASE_ORDER.indexOf(animation.phase);
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
        const phase = ANIMATION_PHASE_ORDER[this.currentPhase];
        let phaseControllers: IAnimation[] = [...this.getActiveControllers()];
        const total = this.controllers.size;
        this.debug(
            `AnimationBatch - progressing by ${deltaTime}; current phase ${phase} with ${phaseControllers?.length} active controllers of ${total} total`,
            this.phases
        );

        // Allow deltaTime 0 to progress through all phases if none of the animations consume time.
        let unusedTime = deltaTime === 0 ? 0.01 : deltaTime;
        const arePhasesComplete = () => ANIMATION_PHASE_ORDER[this.currentPhase] == null;
        const progressPhase = () => {
            phaseControllers = [...this.getActiveControllers()];
            while (!arePhasesComplete() && phaseControllers.length === 0) {
                this.currentPhase++;
                phaseControllers = [...this.getActiveControllers()];
                this.debug(
                    `AnimationBatch - phase changing to ${ANIMATION_PHASE_ORDER[this.currentPhase]}`,
                    { unusedTime },
                    phaseControllers
                );
            }
        };

        while (unusedTime > 0 && !arePhasesComplete()) {
            progressPhase();

            const phaseDeltaTime = unusedTime;
            let completeCount = 0;
            for (const controller of phaseControllers) {
                unusedTime = Math.min(controller.update(phaseDeltaTime), unusedTime);

                if (controller.isComplete) {
                    completeCount++;
                    this.removeAnimation(controller);
                }
            }

            this.debug(`AnimationBatch - updated ${phaseControllers.length} controllers; ${completeCount} completed`);
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

    destroy() {}
}
