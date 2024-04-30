declare enum Command {
    Move = 0,
    Line = 1,
    Arc = 2,
    Curve = 3,
    ClosePath = 4
}
export declare class ExtendedPath2D {
    private path2d;
    private previousCommands;
    private previousParams;
    private previousClosedPath;
    commands: Command[];
    params: number[];
    openedPath: boolean;
    closedPath: boolean;
    isDirty(): boolean;
    getPath2D(): Path2D;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    rect(x: number, y: number, width: number, height: number): void;
    roundRect(x: number, y: number, width: number, height: number, radii: number): void;
    arc(x: number, y: number, r: number, sAngle: number, eAngle: number, counterClockwise?: boolean): void;
    cubicCurveTo(cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number): void;
    closePath(): void;
    clear(trackChanges?: boolean): void;
    isPointInPath(x: number, y: number): boolean;
    distanceSquared(x: number, y: number): number;
    getPoints(): Array<{
        x: number;
        y: number;
    }>;
}
export {};
