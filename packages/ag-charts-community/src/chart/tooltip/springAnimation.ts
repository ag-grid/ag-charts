import { AgDocument, EventEmitter } from 'ag-charts-core';

interface SpringAnimationUpdateEvent {
    readonly x: number;
    readonly y: number;
}

const M = 0.1;
const K = 200;
const C = 12;

const DELTA = 0.5;

export class SpringAnimation {
    readonly events = new EventEmitter<{ update: SpringAnimationUpdateEvent }>();

    private x1 = Number.NaN;
    private y1 = Number.NaN;
    public x = Number.NaN;
    public y = Number.NaN;
    private vx = 0;
    private vy = 0;
    private t0 = Number.NaN;
    private animationFrameHandle: number | undefined = undefined;

    constructor(private readonly agDocument: AgDocument) {}

    reset() {
        this.x = Number.NaN;
        this.y = Number.NaN;

        if (this.animationFrameHandle != null) {
            this.agDocument.cancelAnimationFrame(this.animationFrameHandle);
            this.animationFrameHandle = undefined;
        }
    }

    update(x: number, y: number) {
        if (Number.isNaN(this.x) || Number.isNaN(this.y)) {
            this.x = x;
            this.y = y;
            this.vx = 0;
            this.vy = 0;

            this.emitUpdate();

            if (this.animationFrameHandle != null) {
                this.agDocument.cancelAnimationFrame(this.animationFrameHandle);
                this.animationFrameHandle = undefined;
            }

            return;
        }

        this.x1 = x;
        this.y1 = y;
        this.t0 = Date.now();

        this.animationFrameHandle ??= this.agDocument.requestAnimationFrame(this.onFrame.bind(this));
    }

    private onFrame() {
        this.animationFrameHandle = undefined;

        const { x1, y1, t0 } = this;

        const t1 = Date.now();
        const dt = t1 - t0;
        this.t0 = t1;

        const stepT = 1e-3;
        const iterations = Math.trunc(Math.ceil(dt / (stepT * 1e3)));

        let { x, y, vx, vy } = this;
        for (let i = 0; i < iterations; i += 1) {
            const dx = x - x1;
            const dy = y - y1;

            const ax = -(K * dx + C * vx) / M;
            const ay = -(K * dy + C * vy) / M;

            vx += ax * stepT;
            vy += ay * stepT;

            x += vx * stepT;
            y += vy * stepT;
        }

        if (Math.hypot(x - x1, y - y1) < DELTA) {
            this.x = this.x1;
            this.y = this.y1;
            this.vx = 0;
            this.vy = 0;
        } else {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.animationFrameHandle = this.agDocument.requestAnimationFrame(this.onFrame.bind(this));
        }

        this.emitUpdate();
    }

    private emitUpdate() {
        this.events.emit('update', { x: this.x, y: this.y });
    }
}
