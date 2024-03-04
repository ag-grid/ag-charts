import util from 'node:util';

import { transformPlainEntryFile } from './transformPlainEntryFile';

const getEntryFile = (chartOptions: object) => {
    // NOTE: Use `util.inspect` instead of `JSON.stringify` so that there aren't quotes around
    // object keys, just like actual source code
    const chartOptionsStr = util
        .inspect({ ...chartOptions, container: '@@CONTAINER@@' }, { depth: 10 })
        .replace(/(['"])@@CONTAINER@@\1/, 'document.getElementById("container")');

    const entryFile = `const options = ${chartOptionsStr};\nconst chart = agCharts.AgCharts.create(options);`;

    return entryFile;
};

const getChartsOptionsPlainEntryFile = (chartsOptions: object) => {
    const sourceStr = getEntryFile(chartsOptions);
    const output = transformPlainEntryFile(sourceStr);

    const options = output.optionsById.get('container');

    return options;
};

describe('transformPlainEntryFile', () => {
    test('default entry file', () => {
        expect(getChartsOptionsPlainEntryFile({})).toMatchSnapshot();
    });

    test('remove subtitle', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                subtitle: {
                    enabled: true,
                    text: 'Test Subtitle',
                },
            })
        ).toMatchSnapshot();
    });

    test('remove footnote', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                footnote: {
                    enabled: true,
                    text: 'Test footnote',
                },
            })
        ).toMatchSnapshot();
    });

    test('disable legend', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                legend: {
                    enabled: true,
                    text: 'Test legend',
                },
            })
        ).toMatchSnapshot();
    });

    test('Remove axes titles', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                axes: [
                    {
                        type: 'category',
                        position: 'bottom',
                        title: {
                            text: 'CATEGORY AXIS TITLE',
                        },
                    },
                    {
                        type: 'number',
                        position: 'left',
                        title: {
                            text: 'NUMBER AXIS TITLE',
                        },
                    },
                ],
            })
        ).toMatchSnapshot();
    });

    test('Adjust padding', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                seriesArea: {
                    padding: {
                        left: 40,
                    },
                },
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 30,
                    left: 40,
                },
            })
        ).toMatchSnapshot();
    });
});
