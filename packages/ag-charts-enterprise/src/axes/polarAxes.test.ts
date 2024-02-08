import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../test/utils';

describe('Polar Axes', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const RADAR_LINE_SERIES: AgChartOptions['series'] = [
        {
            type: 'radar-line',
            angleKey: 'skill',
            radiusKey: 'Bob',
        },
        {
            type: 'radar-line',
            angleKey: 'skill',
            radiusKey: 'Collin',
        },
        {
            type: 'radar-line',
            angleKey: 'skill',
            radiusKey: 'Giovanni',
        },
    ];
    const RADAR_AREA_SERIES: AgChartOptions['series'] = RADAR_LINE_SERIES.map((series) => {
        return {
            ...series,
            type: 'radar-area',
            fillOpacity: 0.25,
            marker: {
                enabled: true,
            },
        };
    });

    const EXAMPLE_OPTIONS: AgChartOptions = {
        data: [
            { skill: 'Communication', Bob: 7, Collin: 4, Giovanni: 10 },
            { skill: 'Technical Skills', Bob: 8, Collin: 10, Giovanni: 3 },
            { skill: 'Team Player', Bob: 6, Collin: 3, Giovanni: 8 },
            { skill: 'Punctuality', Bob: 5, Collin: 10, Giovanni: 3 },
            { skill: 'Meeting Deadlines', Bob: 9, Collin: 10, Giovanni: 2 },
            { skill: 'Problem Solving', Bob: 8, Collin: 5, Giovanni: 10 },
        ],
        title: {
            text: 'Skill Analysis',
        },
        series: RADAR_LINE_SERIES,
        legend: {
            enabled: true,
        },
    };

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    it(`should render polar axes as expected`, async () => {
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS, series: RADAR_AREA_SERIES };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar axes with angle offset as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: [
                { type: 'angle-category', startAngle: 330 },
                { type: 'radius-number', title: { text: 'Skill Score' } },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar axes with circle shape as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: RADAR_AREA_SERIES,
            axes: [
                { type: 'angle-category', shape: 'circle' },
                { type: 'radius-number', shape: 'circle' },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render angle cross line as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: RADAR_AREA_SERIES,
            axes: [
                {
                    type: 'angle-category',
                    crossLines: [
                        {
                            type: 'line',
                            value: 'Meeting Deadlines',
                            strokeWidth: 2,
                            label: {
                                text: 'Useless Skill',
                                color: 'rgb(30, 122, 152)',
                                fontWeight: 'bold',
                            },
                        },
                    ],
                },
                { type: 'radius-number' },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render angle cross line range as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: RADAR_AREA_SERIES,
            axes: [
                {
                    type: 'angle-category',
                    crossLines: [
                        {
                            type: 'range',
                            range: ['Communication', 'Team Player'],
                            label: {
                                text: 'Valuable Skills',
                                color: 'rgb(30, 122, 152)',
                                fontWeight: 'bold',
                            },
                        },
                    ],
                },
                { type: 'radius-number' },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render angle cross line range with circle shape as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: RADAR_AREA_SERIES,
            axes: [
                {
                    type: 'angle-category',
                    shape: 'circle',
                    crossLines: [
                        {
                            type: 'range',
                            range: ['Communication', 'Team Player'],
                            label: {
                                text: 'Valuable Skills',
                                color: 'rgb(30, 122, 152)',
                                fontWeight: 'bold',
                            },
                        },
                    ],
                },
                { type: 'radius-number', shape: 'circle' },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render radius cross line as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: RADAR_AREA_SERIES,
            axes: [
                { type: 'angle-category' },
                {
                    type: 'radius-number',
                    crossLines: [
                        {
                            type: 'line',
                            value: 5,
                            strokeWidth: 2,
                            label: {
                                text: 'Minimal\nRequirement',
                                color: 'rgb(0, 64, 144)',
                                positionAngle: 180,
                                fontWeight: 'bold',
                            },
                        },
                    ],
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render radius cross line with circle shape as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: RADAR_AREA_SERIES,
            axes: [
                { type: 'angle-category', shape: 'circle', startAngle: 330 },
                {
                    type: 'radius-number',
                    shape: 'circle',
                    crossLines: [
                        {
                            type: 'line',
                            value: 5,
                            strokeWidth: 2,
                            label: {
                                text: 'Minimal\nRequirement',
                                color: 'rgb(0, 64, 144)',
                                positionAngle: 180,
                                fontWeight: 'bold',
                            },
                        },
                    ],
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render radius cross line range as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: RADAR_AREA_SERIES,
            axes: [
                { type: 'angle-category' },
                {
                    type: 'radius-number',
                    crossLines: [
                        {
                            type: 'range',
                            fill: 'rgb(224, 64, 112)',
                            fillOpacity: 0.2,
                            stroke: 'transparent',
                            range: [0, 5],
                            label: {
                                text: 'Needs\nImprovement',
                                color: 'rgb(144, 0, 64)',
                                positionAngle: 210,
                                fontWeight: 'bold',
                            },
                        },
                        {
                            type: 'range',
                            fill: 'rgb(32, 128, 192)',
                            fillOpacity: 0.2,
                            stroke: 'transparent',
                            range: [7, 10],
                            label: {
                                text: 'Excellent',
                                color: 'rgb(32, 128, 192)',
                                positionAngle: 150,
                                fontWeight: 'bold',
                            },
                        },
                    ],
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render radius cross line range with circle shape as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: RADAR_AREA_SERIES,
            axes: [
                { type: 'angle-category', shape: 'circle' },
                {
                    type: 'radius-number',
                    shape: 'circle',
                    crossLines: [
                        {
                            type: 'range',
                            fill: 'rgb(224, 64, 112)',
                            fillOpacity: 0.2,
                            stroke: 'transparent',
                            range: [0, 5],
                            label: {
                                text: 'Needs\nImprovement',
                                color: 'rgb(144, 0, 64)',
                                positionAngle: 210,
                                fontWeight: 'bold',
                            },
                        },
                        {
                            type: 'range',
                            fill: 'rgb(32, 128, 192)',
                            fillOpacity: 0.2,
                            stroke: 'transparent',
                            range: [7, 10],
                            label: {
                                text: 'Excellent',
                                color: 'rgb(32, 128, 192)',
                                positionAngle: 150,
                                fontWeight: 'bold',
                            },
                        },
                    ],
                },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render axis labels with parallel orientation as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            data: EXAMPLE_OPTIONS.data!.concat([
                { skill: 'Test 1', Bob: 7, Collin: 4, Giovanni: 10 },
                { skill: 'Test2', Bob: 8, Collin: 10, Giovanni: 3 },
            ]),
            axes: [
                { type: 'angle-category', label: { orientation: 'parallel' } },
                { type: 'radius-number', title: { text: 'Skill Score' } },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render axis labels with perpendicular orientation as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            data: EXAMPLE_OPTIONS.data!.concat([
                { skill: 'Test 1', Bob: 7, Collin: 4, Giovanni: 10 },
                { skill: 'Test2', Bob: 8, Collin: 10, Giovanni: 3 },
            ]),
            axes: [
                { type: 'angle-category', label: { orientation: 'perpendicular' } },
                { type: 'radius-number', title: { text: 'Skill Score' } },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });
});
