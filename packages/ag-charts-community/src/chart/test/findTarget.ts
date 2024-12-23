import { Caster, ClassTypePair } from 'ag-charts-test';

import { BBox } from '../../scene/bbox';
import { TranslatableGroup } from '../../scene/group';
import { Node } from '../../scene/node';
import { Scene } from '../../scene/scene';
import { Selection } from '../../scene/selection';
import { Transformable } from '../../scene/transformable';
import { BBoxValues } from '../../util/bboxinterface';
import { ListWidget } from '../../widget/listWidget';
import { NativeWidget } from '../../widget/nativeWidget';
import { SliderWidget } from '../../widget/sliderWidget';
import { ToolbarWidget } from '../../widget/toolbarWidget';
import { Widget } from '../../widget/widget';
import type { Chart } from '../chart';
import type { MockEvent } from '../interaction/regionManager';
import { Legend } from '../legend/legend';
import { LegendDOMProxy } from '../legend/legendDOMProxy';
import { LegendMarkerLabel } from '../legend/legendMarkerLabel';
import { SeriesAreaManager } from '../series/seriesAreaManager';

const CAST_INFO = {
    Array: new ClassTypePair<unknown[], typeof Array>(Array),

    BBox: new ClassTypePair<BBox, typeof BBox>(BBox),
    TranslatableGroup: new ClassTypePair<TranslatableGroup, typeof TranslatableGroup>(TranslatableGroup),
    Scene: new ClassTypePair<Scene, typeof Scene>(Scene),
    Node: new ClassTypePair<Node, typeof Node>(Node),

    Legend: new ClassTypePair<Legend, typeof Legend>(Legend),
    LegendDOMProxy: new ClassTypePair<LegendDOMProxy, typeof LegendDOMProxy>(LegendDOMProxy),
    SeriesAreaManager: new ClassTypePair<SeriesAreaManager, typeof SeriesAreaManager>(SeriesAreaManager),

    ToolbarWidget: new ClassTypePair<ToolbarWidget, typeof ToolbarWidget>(ToolbarWidget),
    SliderWidget: new ClassTypePair<SliderWidget, typeof SliderWidget>(SliderWidget),
    ListWidget: new ClassTypePair<ListWidget, typeof ListWidget>(ListWidget),
    NativeWidget: new ClassTypePair<NativeWidget, typeof NativeWidget>(NativeWidget),
} as const;

function isClickable(widget: Widget | undefined): widget is Widget {
    if (widget == null) return false;
    const style = widget.getElement().style;
    return style.display !== 'none' && style.visibility !== 'none' && style.pointerEvents !== 'none';
}

function findLegendTarget(legendModule: unknown, canvasX: number, canvasY: number): MockEvent | undefined {
    if (legendModule === undefined) return undefined;

    const legend = new Caster(legendModule)
        .cast(CAST_INFO.Legend)
        .findProperty('group')
        .castProperty('group', CAST_INFO.TranslatableGroup).value;
    const legendDOMProxy = new Caster(legendModule)
        .accessProperty('domProxy')
        .cast(CAST_INFO.LegendDOMProxy)
        .findProperty('itemList')
        .castProperty('itemList', CAST_INFO.ListWidget).value;

    if (!isClickable(legendDOMProxy.itemList)) return undefined;

    for (const node of Selection.selectByClass(legend.group, LegendMarkerLabel)) {
        if (!isClickable(node.proxyButton)) continue;
        const bbox = Transformable.toCanvas(node);
        if (bbox.containsPoint(canvasX, canvasY)) {
            const { x, y } = Transformable.fromCanvasPoint(node, canvasX, canvasY);
            return { target: node.proxyButton.getElement(), offsetX: x, offsetY: y };
        }
    }
}

function findNavigatorTarget(navigatorModule: unknown, canvasX: number, canvasY: number): MockEvent | undefined {
    if (navigatorModule === undefined) return undefined;

    const caster = new Caster(navigatorModule);
    const navigator = caster
        .findBoolean('enabled')
        .findProperty('minHandle')
        .castProperty('minHandle', CAST_INFO.Node)
        .findProperty('maxHandle')
        .castProperty('maxHandle', CAST_INFO.Node)
        .findProperty('mask')
        .castProperty('mask', CAST_INFO.Node).value;
    const domProxy = caster
        .accessProperty('domProxy')
        .findProperty('toolbar')
        .castProperty('toolbar', CAST_INFO.ToolbarWidget)
        .findProperty('sliders')
        .castPropertyArray('sliders', CAST_INFO.SliderWidget).value;

    if (!navigator.enabled) return undefined;

    let targetWidget: SliderWidget | undefined;
    if (Transformable.toCanvas(navigator.minHandle).containsPoint(canvasX, canvasY)) {
        targetWidget = domProxy.sliders[0];
    } else if (Transformable.toCanvas(navigator.maxHandle).containsPoint(canvasX, canvasY)) {
        targetWidget = domProxy.sliders[2];
    } else if (Transformable.toCanvas(navigator.mask).containsPoint(canvasX, canvasY)) {
        targetWidget = domProxy.sliders[1];
    }

    if (isClickable(targetWidget)) {
        const offsetX = canvasX - targetWidget.cssLeft() - domProxy.toolbar.cssLeft();
        const offsetY = canvasY - targetWidget.cssTop() - domProxy.toolbar.cssTop();
        const target = targetWidget.getElement();
        return { target, offsetX, offsetY };
    }

    return undefined;
}

function findZoomTarget(zoomModule: unknown, canvasX: number, canvasY: number): MockEvent | undefined {
    if (zoomModule === undefined) return undefined;

    const caster = new Caster(zoomModule);
    const zoom = caster.findBoolean('enabled').findBoolean('enableAxisDragging').value;

    if (zoom.enabled && zoom.enableAxisDragging) {
        const domProxy = caster
            .accessProperty('domProxy')
            .findProperty('axes')
            .castProperty('axes', CAST_INFO.Array)
            .findArrayElementProperties('axes', 'div')
            .castArrayElementProperties('axes', 'div', CAST_INFO.NativeWidget).value;

        for (const axis of domProxy.axes) {
            const bbox = axis.div.getBounds();
            if (isClickable(axis.div) && BBoxValues.containsPoint(bbox, canvasX, canvasY)) {
                const offsetX = canvasX - bbox.x;
                const offsetY = canvasY - bbox.y;
                return { target: axis.div.getElement(), offsetX, offsetY };
            }
        }
    }

    return undefined;
}

function findSeriesAreaTarget(chart: unknown, canvasX: number, canvasY: number): MockEvent {
    const caster = new Caster(chart)
        .accessProperty('seriesAreaManager')
        .cast(CAST_INFO.SeriesAreaManager)
        .findProperty('seriesRect')
        .castProperty('seriesRect', CAST_INFO.BBox);

    const seriesRect = caster.value.seriesRect;
    const scene = caster
        .accessProperty('chart')
        .accessProperty('ctx')
        .accessProperty('scene')
        .cast(CAST_INFO.Scene).value;

    const target = scene.canvas.element;
    const [offsetX, offsetY] = [NaN, NaN];
    if (seriesRect?.containsPoint(canvasX, canvasY)) {
        const regionX = canvasX - seriesRect.x;
        const regionY = canvasY - seriesRect.y;
        return { target, offsetX, offsetY, mockRegion: { region: 'series', canvasX, canvasY, regionX, regionY } };
    } else {
        const regionX = canvasX;
        const regionY = canvasY;
        return { target, offsetX, offsetY, mockRegion: { region: 'root', canvasX, canvasY, regionX, regionY } };
    }
}

export function findChartTarget(chart: Chart, canvasX: number, canvasY: number): MockEvent {
    const getModule = (s: string) => chart.modulesManager.getModule<unknown>(s);
    return (
        findLegendTarget(getModule('legend'), canvasX, canvasY) ??
        findNavigatorTarget(getModule('navigator'), canvasX, canvasY) ??
        findZoomTarget(getModule('zoom'), canvasX, canvasY) ??
        findSeriesAreaTarget(chart, canvasX, canvasY)
    );
}
