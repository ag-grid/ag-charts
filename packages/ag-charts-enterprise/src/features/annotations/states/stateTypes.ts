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
    click: { textInputValue?: string; bbox?: _Scene.BBox; point: Point; shiftKey: boolean };
    dblclick: { offset: _ModuleSupport.Vec2 };
    drag: {
        shiftKey: boolean;
        offset: _ModuleSupport.Vec2;
        point: Point;
        context: AnnotationContext;
        textInputValue?: string;
        bbox?: _Scene.BBox;
    };
    dragStart: {
        offset: _ModuleSupport.Vec2;
        point: Point;
        context: AnnotationContext;
        textInputValue: string | undefined;
        bbox: _Scene.BBox | undefined;
    };
    dragEnd: undefined;
    hover: { context: AnnotationContext; offset: _ModuleSupport.Vec2; shiftKey: boolean; point: Point };
    keyDown: {
        shiftKey: boolean;
        context: AnnotationContext;
    };
    keyUp: { shiftKey: boolean; context: AnnotationContext };
    textInput: {
        key: string;
        shiftKey: boolean;
        textInputValue: string | undefined;
        bbox: _Scene.BBox | undefined;
        context: AnnotationContext;
    };
    resize: { textInputValue?: string; bbox: _Scene.BBox };
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
