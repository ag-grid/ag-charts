import type { Chart } from '../chart';
import type { MockEvent } from '../interaction/regionManager';

function findLegendTarget(legend: unknown, canvasX: number, canvasY: number): MockEvent | undefined {}

function findNavigatorTarget(navigator: unknown, canvasX: number, canvasY: number): MockEvent | undefined {}

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
