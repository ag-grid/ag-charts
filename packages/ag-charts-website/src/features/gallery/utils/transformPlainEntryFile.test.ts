import { transformPlainEntryFile } from './transformPlainEntryFile';
import util from 'node:util';

const getEntryFile = (chartOptions: object) => {
    // NOTE: Use `util.inspect` instead of `JSON.stringify` so that there aren't quotes around
    // object keys, just like actual source code
    const chartOptionsStr = util.inspect(chartOptions, { depth: 10 });
    const entryFile = `const options = ${chartOptionsStr};\nvar chart = agCharts.AgChart.create(options);`;

    return entryFile;
};

const getChartsOptionsPlainEntryFile = (chartsOptions: object) => {
    const sourceStr = getEntryFile(chartsOptions);
    const output = transformPlainEntryFile(sourceStr);

    return output;
};

describe('transformPlainEntryFile', () => {
    test('object key as literal with strings ');

    test('default entry file', () => {
        expect(getChartsOptionsPlainEntryFile({}).code).toMatchInlineSnapshot(`
          "const options = {
            legend: {
              enabled: false
            },

            padding: {
              top: 10,
              right: 20,
              bottom: 10,
              left: 20
            }
          };
          var chart = agCharts.AgChart.create(options);"
        `);
    });

    test('remove subtitle', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                subtitle: {
                    enabled: true,
                    text: 'Test Subtitle',
                },
            }).code
        ).toMatchInlineSnapshot(`
          "const options = {
            legend: {
              enabled: false
            },

            padding: {
              top: 10,
              right: 20,
              bottom: 10,
              left: 20
            }
          };
          var chart = agCharts.AgChart.create(options);"
        `);
    });

    test('remove footnote', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                footnote: {
                    enabled: true,
                    text: 'Test footnote',
                },
            }).code
        ).toMatchInlineSnapshot(`
          "const options = {
            legend: {
              enabled: false
            },

            padding: {
              top: 10,
              right: 20,
              bottom: 10,
              left: 20
            }
          };
          var chart = agCharts.AgChart.create(options);"
        `);
    });

    test('disable legend', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                legend: {
                    enabled: true,
                    text: 'Test legend',
                },
            }).code
        ).toMatchInlineSnapshot(`
          "const options = {
            legend: {
              enabled: false
            },

            padding: {
              top: 10,
              right: 20,
              bottom: 10,
              left: 20
            }
          };
          var chart = agCharts.AgChart.create(options);"
        `);
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
            }).code
        ).toMatchInlineSnapshot(`
        "const options = {
          axes: [
            {
              type: 'category',
              position: 'bottom',
              title: {
                enabled: false
              }
            },
            {
              type: 'number',
              position: 'left',
              title: {
                enabled: false
              }
            }
          ],

          legend: {
            enabled: false
          },

          padding: {
            top: 10,
            right: 20,
            bottom: 10,
            left: 20
          }
        };
        var chart = agCharts.AgChart.create(options);"
      `);
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
            }).code
        ).toMatchInlineSnapshot(`
          "const options = {
            seriesArea: { padding: { left: 40 } },

            legend: {
              enabled: false
            },

            padding: {
              top: 10,
              right: 20,
              bottom: 10,
              left: 20
            }
          };
          var chart = agCharts.AgChart.create(options);"
        `);
    });
});
