import { boxContains } from 'ag-charts-core';
import { CANVAS_HEIGHT, CANVAS_WIDTH, Caster, ClassTypePair } from 'ag-charts-test';

import { BBox } from '../../scene/bbox';
import { TranslatableGroup } from '../../scene/group';
import { Node } from '../../scene/node';
import { Scene } from '../../scene/scene';
import { Selection } from '../../scene/selection';
import { Transformable } from '../../scene/transformable';
import { ListWidget } from '../../widget/listWidget';
import { NativeWidget } from '../../widget/nativeWidget';
import { SliderWidget } from '../../widget/sliderWidget';
import { ToolbarWidget } from '../../widget/toolbarWidget';
import { Widget } from '../../widget/widget';
import type { Chart } from '../chart';
import { WidgetSet } from '../interaction/widgetSet';
import { Legend } from '../legend/legend';
import { LegendDOMProxy } from '../legend/legendDOMProxy';
import { LegendMarkerLabel } from '../legend/legendMarkerLabel';
import { SeriesAreaManager } from '../series/seriesAreaManager';

export type MockEvent = {
    bubbleChain: HTMLElement[];
    target: HTMLElement;
    offsetX: number;
    offsetY: number;
    clientX: number;
    clientY: number;
};

const KNOWN_AG_CHARTS_CLASSES: readonly string[] = [
    'ag-charts-series-area',
    'ag-charts-canvas-proxy',
    'ag-charts-canvas-container',
] as const;

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
    WidgetSet: new ClassTypePair<WidgetSet, typeof WidgetSet>(WidgetSet),
} as const;

function makeMockEvent(opts: Pick<MockEvent, 'target' | 'offsetX' | 'offsetY' | 'clientX' | 'clientY'>): MockEvent {
    const bubbleChain: HTMLElement[] = [opts.target];
    let parent: HTMLElement | null = opts.target.parentElement;
    while (parent != null) {
        if (KNOWN_AG_CHARTS_CLASSES.includes(parent.className)) {
            bubbleChain.push(parent);
        }
        parent = parent.parentElement;
    }
    return { bubbleChain, ...opts };
}

function initBoundingClientRect(widgets: WidgetSet) {
    // getBoundingClientRect doesn't work correctly in node.js, but it's used in some parts of ag-charts.
    const canvasBounds = (): DOMRect => {
        return {
            bottom: 0,
            left: 0,
            right: 0,
            top: 0,
            x: 0,
            y: 0,
            height: CANVAS_HEIGHT,
            width: CANVAS_WIDTH,
            toJSON() {
                return `{bottom:0,left:0,right:0,top:0,x:0,y:0,height:${CANVAS_HEIGHT},width:${CANVAS_WIDTH}}`;
            },
        };
    };
    const seriesBounds = (): DOMRect => {
        const left = widgets.seriesWidget.cssLeft();
        const top = widgets.seriesWidget.cssTop();
        const height = widgets.seriesWidget.cssHeight();
        const width = widgets.seriesWidget.cssWidth();
        return {
            bottom: 0,
            left,
            right: 0,
            top,
            x: left,
            y: top,
            height,
            width,
            toJSON() {
                return `{bottom:0,left:${left},right:0,top:${top},x:${left},y:${top},height:${height},width:${width}}`;
            },
        };
    };
    (widgets.chartWidget.getElement() as any)['getBoundingClientRect'] = canvasBounds;
    (widgets.containerWidget.getElement() as any)['getBoundingClientRect'] = canvasBounds;
    (widgets.seriesWidget.getElement() as any)['getBoundingClientRect'] = seriesBounds;
}

function isClickable(widget: Widget | undefined): widget is Widget {
    if (widget == null) return false;
    const style = widget.getElement().style;
    return style.display !== 'none' && style.visibility !== 'none' && style.pointerEvents !== 'none';
}

function findLegendTarget(legendModule: unknown, clientX: number, clientY: number): MockEvent | undefined {
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
        if (bbox.containsPoint(clientX, clientY)) {
            const { x: offsetX, y: offsetY } = Transformable.fromCanvasPoint(node, clientX, clientY);
            const target = node.proxyButton.getElement();
            return makeMockEvent({ target, offsetX, offsetY, clientX, clientY });
        }
    }
}

function findNavigatorTarget(navigatorModule: unknown, clientX: number, clientY: number): MockEvent | undefined {
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
    if (Transformable.toCanvas(navigator.minHandle).containsPoint(clientX, clientY)) {
        targetWidget = domProxy.sliders[0];
    } else if (Transformable.toCanvas(navigator.maxHandle).containsPoint(clientX, clientY)) {
        targetWidget = domProxy.sliders[2];
    } else if (Transformable.toCanvas(navigator.mask).containsPoint(clientX, clientY)) {
        targetWidget = domProxy.sliders[1];
    }

    if (isClickable(targetWidget)) {
        const offsetX = clientX - targetWidget.cssLeft() - domProxy.toolbar.cssLeft();
        const offsetY = clientY - targetWidget.cssTop() - domProxy.toolbar.cssTop();
        const target = targetWidget.getElement();
        return makeMockEvent({ target, offsetX, offsetY, clientX, clientY });
    }

    return undefined;
}

function findZoomTarget(zoomModule: unknown, clientX: number, clientY: number): MockEvent | undefined {
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
            if (isClickable(axis.div) && boxContains(bbox, clientX, clientY)) {
                const offsetX = clientX - bbox.x;
                const offsetY = clientY - bbox.y;
                const target = axis.div.getElement();
                return makeMockEvent({ target, offsetX, offsetY, clientX, clientY });
            }
        }
    }

    return undefined;
}

function findSeriesAreaTarget(chart: unknown, widgets: WidgetSet, clientX: number, clientY: number): MockEvent {
    const seriesRect = new Caster(chart)
        .accessProperty('seriesAreaManager')
        .cast(CAST_INFO.SeriesAreaManager)
        .findProperty('seriesRect')
        .castProperty('seriesRect', CAST_INFO.BBox).value.seriesRect;
    const { seriesWidget, containerWidget } = widgets;

    const inSeriesRect = seriesRect?.containsPoint(clientX, clientY);
    const target: HTMLElement = inSeriesRect ? seriesWidget.getElement() : containerWidget.getElement();
    const [offsetX, offsetY] = inSeriesRect
        ? [clientX - seriesWidget.cssLeft(), clientY - seriesWidget.cssTop()]
        : [clientX, clientY];
    return makeMockEvent({ target, offsetX, offsetY, clientX, clientY });
}

export function findChartTarget(chart: Chart, clientX: number, clientY: number): MockEvent {
    const widgets = new Caster(chart).accessProperty('ctx').accessProperty('widgets').cast(CAST_INFO.WidgetSet).value;
    initBoundingClientRect(widgets);

    const getModule = (s: string) => chart.modulesManager.getModule<unknown>(s);
    return (
        findLegendTarget(getModule('legend'), clientX, clientY) ??
        findNavigatorTarget(getModule('navigator'), clientX, clientY) ??
        findZoomTarget(getModule('zoom'), clientX, clientY) ??
        findSeriesAreaTarget(chart, widgets, clientX, clientY)
    );
}
