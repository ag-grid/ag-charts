import { ToolbarWidget } from '../../module-support';
import { TranslatableGroup } from '../../scene/group';
import { Selection } from '../../scene/selection';
import { Transformable } from '../../scene/transformable';
import { SliderWidget } from '../../widget/sliderWidget';
import type { Chart } from '../chart';
import type { MockEvent } from '../interaction/regionManager';
import { Legend } from '../legend/legend';
import { LegendMarkerLabel } from '../legend/legendMarkerLabel';
import { Navigator } from '../navigator/navigator';
import { NavigatorDOMProxy } from '../navigator/navigatorDOMProxy';
import { RangeHandle } from '../navigator/shapes/rangeHandle';
import { RangeMask } from '../navigator/shapes/rangeMask';
import { Caster } from './caster';

function findLegendTarget(legendModule: unknown, canvasX: number, canvasY: number): MockEvent | undefined {
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
    const navigator = new Caster(navigatorModule)
        .cast(Navigator)
        .findProperty('enabled')
        .findProperty('mask')
        .castProperty('mask', RangeMask)
        .findProperty('minHandle')
        .castProperty('minHandle', RangeHandle)
        .findProperty('maxHandle')
        .castProperty('maxHandle', RangeHandle)
        .findProperty('domProxy').value;

    const domProxy = new Caster(navigator.domProxy)
        .cast(NavigatorDOMProxy)
        .findProperty('toolbar')
        .castProperty('toolbar', ToolbarWidget)
        .findProperty('sliders')
        .castProperty('sliders', Array).value;

    if (!navigator.enabled) return undefined;

    let targetWidget: SliderWidget | undefined;
    if (Transformable.toCanvas(navigator.minHandle).containsPoint(canvasX, canvasY)) {
        targetWidget = domProxy.sliders[0] as SliderWidget; // TODO sanity-check
    } else if (Transformable.toCanvas(navigator.maxHandle).containsPoint(canvasX, canvasY)) {
        targetWidget = domProxy.sliders[2] as SliderWidget; // TODO sanity-check
    } else if (Transformable.toCanvas(navigator.mask).containsPoint(canvasX, canvasY)) {
        targetWidget = domProxy.sliders[1] as SliderWidget; // TODO sanity-check
    }

    if (targetWidget) {
        const offsetX = canvasX - targetWidget.cssLeft() - domProxy.toolbar.cssLeft();
        const offsetY = canvasY - targetWidget.cssTop() - domProxy.toolbar.cssTop();
        const target = targetWidget.getElement();
        return { target, offsetX, offsetY };
    }

    return undefined;
}

function findZoomTarget(zoom: unknown, canvasX: number, canvasY: number): MockEvent | undefined {}

function findSeriesAreaTarget(seriesArea: unknown, canvasX: number, canvasY: number): MockEvent {}

export function findChartTarget(chart: Chart, canvasX: number, canvasY: number): MockEvent {
    const getModule = (s: string) => chart.modulesManager.getModule<unknown>(s);
    return (
        findLegendTarget(getModule('legend'), canvasX, canvasY) ||
        findNavigatorTarget(getModule('navigator'), canvasX, canvasY) ||
        findZoomTarget(getModule('zoom'), canvasX, canvasY) ||
        findSeriesAreaTarget((chart as any).seriesAreaManager, canvasX, canvasY)
    );
}
