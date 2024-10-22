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
    click: { textInputValue?: string; bbox?: _Scene.BBox; point: () => Point };
    dblclick: { offset: _ModuleSupport.Vec2 };
    drag: {
        offset: _ModuleSupport.Vec2;
        context: AnnotationContext;
        point: () => Point;
        textInputValue?: string;
        bbox?: _Scene.BBox;
    };
    dragStart: {
        offset: _ModuleSupport.Vec2;
        context: AnnotationContext;
        point: () => Point;
        textInputValue: string | undefined;
        bbox: _Scene.BBox | undefined;
    };
    dragEnd: undefined;
    hover: { offset: _ModuleSupport.Vec2; point: () => Point };
    keyDown: {
        shiftKey: boolean;
        context: AnnotationContext;
        point?: () => Point;
    };
    keyUp: { shiftKey: boolean; context: AnnotationContext; point?: () => Point };
    textInput: {
        key: string;
        shiftKey: boolean;
        textInputValue: string | undefined;
        bbox: _Scene.BBox | undefined;
        context: AnnotationContext;
    };
    zoomChange: { textInputValue?: string; bbox: _Scene.BBox };
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
