import type { _ModuleSupport } from 'ag-charts-community';
import type { Point } from 'ag-charts-core';

import type {
    AnnotationContext,
    AnnotationLineStyle,
    AnnotationOptionsColorPickerType,
    AnnotationType,
    DataPoint,
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
        point: DataPoint;
        shiftKey: boolean;
        bbox?: _ModuleSupport.BBox;
        textInputValue?: string;
    };
    dblclick: {
        offset: Point;
    };
    drag: {
        context: AnnotationContext;
        offset: Point;
        point: DataPoint;
        shiftKey: boolean;
        bbox?: _ModuleSupport.BBox;
        textInputValue?: string;
    };
    dragStart: {
        context: AnnotationContext;
        offset: Point;
        point: DataPoint;
        bbox: _ModuleSupport.BBox | undefined;
        textInputValue: string | undefined;
    };
    dragEnd: undefined;
    hover: {
        context: AnnotationContext;
        offset: Point;
        point: DataPoint;
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
        bbox: _ModuleSupport.BBox | undefined;
        context: AnnotationContext;
        key: string;
        shiftKey: boolean;
        textInputValue: string | undefined;
    };
    resize: {
        bbox: _ModuleSupport.BBox;
        textInputValue?: string;
    };
};

type ActionEvents = {
    copy: undefined;
    cut: undefined;
    paste: undefined;
    translate: { translation: Point };
    translateEnd: undefined;
    color: {
        colorPickerType: AnnotationOptionsColorPickerType;
        colorOpacity: string;
        color: string;
        opacity: number;
        isMultiColor: boolean;
    };
    fontSize: number;
    lineProps: LinearSettingsDialogLineChangeProps;
    lineStyle: AnnotationLineStyle;
    lineText: LinearSettingsDialogTextChangeProps;
    toolbarPressSettings: Event;
    updateTextInputBBox: _ModuleSupport.BBox | undefined;
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
