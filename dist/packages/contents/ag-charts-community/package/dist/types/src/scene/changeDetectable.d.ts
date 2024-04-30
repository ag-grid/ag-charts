export declare enum RedrawType {
    NONE = 0,
    TRIVIAL = 1,
    MINOR = 2,
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
