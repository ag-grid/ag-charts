export declare enum RedrawType {
    NONE = 0,// No change in rendering.
    TRIVIAL = 1,// Non-positional change in rendering.
    MINOR = 2,// Small change in rendering, potentially affecting other elements in the same group.
    MAJOR = 3
}
type SceneChangeDetectionOptions<T = any> = {
    redraw?: RedrawType;
    type?: 'normal' | 'transform' | 'path' | 'font';
    convertor?: (o: any) => any;
    changeCb?: (o: T) => any;
    checkDirtyOnAssignment?: boolean;
};
export declare function SceneChangeDetection<T = any>(opts?: SceneChangeDetectionOptions<T>): (target: T, key: string) => void;
export declare abstract class ChangeDetectable {
    protected _dirty: RedrawType;
    protected markDirty(_source: any, type?: RedrawType): void;
    markClean(_opts?: {
        force?: boolean;
        recursive?: boolean;
    }): void;
    isDirty(): boolean;
}
export {};
