import type { _ModuleSupport, _Scene } from 'ag-charts-community';

import type {
    AnnotationContext,
    AnnotationLineStyle,
    AnnotationOptionsColorPickerType,
    AnnotationType,
    Point,
} from '../annotationTypes';
import type {
    LinearSettingsDialogLineChangeProps,
    LinearSettingsDialogTextChangeProps,
} from '../settings-dialog/settingsDialog';

export type AnnotationStateEvents = InteractionEvents &
    ActionEvents &
    DataEvents &
    ProcessEvents &
    Record<AnnotationType, undefined>;

type InteractionEvents = {
    click: {
        point: Point;
        shiftKey: boolean;
        bbox?: _Scene.BBox;
        textInputValue?: string;
    };
    dblclick: {
        offset: _ModuleSupport.Vec2;
    };
    drag: {
        context: AnnotationContext;
        offset: _ModuleSupport.Vec2;
        point: Point;
        shiftKey: boolean;
        bbox?: _Scene.BBox;
        textInputValue?: string;
    };
    dragStart: {
        context: AnnotationContext;
        offset: _ModuleSupport.Vec2;
        point: Point;
        bbox: _Scene.BBox | undefined;
        textInputValue: string | undefined;
    };
    dragEnd: undefined;
    hover: {
        context: AnnotationContext;
        offset: _ModuleSupport.Vec2;
        point: Point;
        shiftKey: boolean;
    };
    keyDown: {
        context: AnnotationContext;
        shiftKey: boolean;
    };
    keyUp: {
        context: AnnotationContext;
        shiftKey: boolean;
    };
    textInput: {
        bbox: _Scene.BBox | undefined;
        context: AnnotationContext;
        key: string;
        shiftKey: boolean;
        textInputValue: string | undefined;
    };
    resize: {
        bbox: _Scene.BBox;
        textInputValue?: string;
    };
};

type ActionEvents = {
    copy: undefined;
    cut: undefined;
    paste: undefined;
    translate: { translation: _ModuleSupport.Vec2 };
    translateEnd: undefined;
    color: {
        colorPickerType: AnnotationOptionsColorPickerType;
        colorOpacity: string;
        color: string;
        opacity: number;
    };
    fontSize: number;
    lineProps: LinearSettingsDialogLineChangeProps;
    lineStyle: AnnotationLineStyle;
    lineText: LinearSettingsDialogTextChangeProps;
    toolbarPressSettings: Event;
    updateTextInputBBox: _Scene.BBox | undefined;
};

type DataEvents = {
    cancel: undefined;
    delete: undefined;
    deleteAll: undefined;
    reset: undefined;
    selectLast: undefined;
};

type ProcessEvents = {
    render: undefined;
};
