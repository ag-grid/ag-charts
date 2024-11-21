import { BBox } from '../../scene/bbox';
import { TranslatableGroup } from '../../scene/group';
import { Scene } from '../../scene/scene';
import { Selection } from '../../scene/selection';
import { Transformable } from '../../scene/transformable';
import { BBoxValues } from '../../util/bboxinterface';
import { NativeWidget } from '../../widget/nativeWidget';
import { SliderWidget } from '../../widget/sliderWidget';
import { ToolbarWidget } from '../../widget/toolbarWidget';
import type { Chart } from '../chart';
import type { MockEvent } from '../interaction/regionManager';
import { Legend } from '../legend/legend';
import { LegendMarkerLabel } from '../legend/legendMarkerLabel';
import { Navigator } from '../navigator/navigator';
import { NavigatorDOMProxy } from '../navigator/navigatorDOMProxy';
import { SeriesAreaManager } from '../series/seriesAreaManager';
import { Caster } from './caster';

function findLegendTarget(legendModule: unknown, canvasX: number, canvasY: number): MockEvent | undefined {
    if (legendModule === undefined) return undefined;

    const legend = new Caster(legendModule)
        .cast(Legend)
        .findProperty('group')
        .castProperty('group', TranslatableGroup).value;
    for (const node of Selection.selectByClass(legend.group, LegendMarkerLabel)) {
        if (!node.proxyButton) return;
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
    const navigator = caster.cast(Navigator).findBoolean('enabled').value;
    const domProxy = caster
        .accessProperty('domProxy')
        .cast(NavigatorDOMProxy)
        .findProperty('toolbar')
        .castProperty('toolbar', ToolbarWidget)
        .findProperty('sliders')
        .castPropertyArray('sliders', SliderWidget).value;

    if (!navigator.enabled) return undefined;

    let targetWidget: SliderWidget | undefined;
    if (Transformable.toCanvas(navigator.minHandle).containsPoint(canvasX, canvasY)) {
        targetWidget = domProxy.sliders[0];
    } else if (Transformable.toCanvas(navigator.maxHandle).containsPoint(canvasX, canvasY)) {
        targetWidget = domProxy.sliders[2];
    } else if (Transformable.toCanvas(navigator.mask).containsPoint(canvasX, canvasY)) {
        targetWidget = domProxy.sliders[1];
    }

    if (targetWidget) {
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
            .castProperty('axes', Array)
            .findArrayElementProperties('axes', 'div')
            .castArrayElementProperties('axes', 'div', NativeWidget).value;

        for (const axis of domProxy.axes) {
            const bbox = axis.div.getBounds();
            if (!axis.div.isHidden() && BBoxValues.containsPoint(bbox, canvasX, canvasY)) {
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
        .cast(SeriesAreaManager)
        .findProperty('seriesRect')
        .castProperty('seriesRect', BBox);

    const seriesRect = caster.value.seriesRect;
    const scene = caster.accessProperty('chart').accessProperty('ctx').accessProperty('scene').cast(Scene).value;

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
