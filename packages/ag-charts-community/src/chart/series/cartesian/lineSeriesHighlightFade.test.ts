import { describeHighlightFade, markerCentre } from '../../test/highlightFadeSuite';
import { createChart } from '../../test/utils';

describeHighlightFade(
    [
        {
            name: 'line series markers',
            // Without a line stroke, the pixel at a marker's centre is the marker's fill alone.
            options: {
                data: [
                    { category: 'Q1', apples: 5, oranges: 2 },
                    { category: 'Q2', apples: 7, oranges: 3 },
                    { category: 'Q3', apples: 6, oranges: 4 },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', gridLine: { enabled: false } },
                },
                series: (['apples', 'oranges'] as const).map((yKey) => ({
                    type: 'line' as const,
                    xKey: 'category',
                    yKey,
                    strokeWidth: 0,
                    marker: { size: 20 },
                })),
            },
            itemCentre: markerCentre,
        },
    ],
    createChart
);
