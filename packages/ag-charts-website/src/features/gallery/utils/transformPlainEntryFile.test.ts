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
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }
          };
          var chart = agCharts.AgChart.create(options);"
        `);
    });

    test('remove title', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                title: {
                    enabled: true,
                    text: 'Test title',
                },
            }).code
        ).toMatchInlineSnapshot(`
          "const options = {
            legend: {
              enabled: false
            },

            padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
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
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
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
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }
          };
          var chart = agCharts.AgChart.create(options);"
        `);
    });

    test('disable axes labels', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                axes: [
                    {
                        type: 'category',
                        position: 'bottom',
                        label: {
                            enabled: true,
                        },
                    },
                    {
                        type: 'number',
                        position: 'left',
                        label: {
                            enabled: true,
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

                label: {
                  enabled: false
                },

                tick: {
                  width: 2,
                  color: \\"transparent\\"
                },

                line: {
                  color: \\"transparent\\"
                },

                gridStyle: [{
                  stroke: \\"#C3C3C3\\",
                  lineDash: [4, 4]
                }]
              },
              {
                type: 'number',
                position: 'left',

                label: {
                  enabled: false
                },

                tick: {
                  width: 2,
                  color: \\"transparent\\"
                },

                line: {
                  color: \\"transparent\\"
                },

                gridStyle: [{
                  stroke: \\"#C3C3C3\\",
                  lineDash: [4, 4]
                }]
              }
            ],

            legend: {
              enabled: false
            },

            padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }
          };
          var chart = agCharts.AgChart.create(options);"
        `);
    });

    test('do not disable series labels', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                series: [
                    {
                        type: 'bar',
                        xKey: 'job',
                        yKey: 'change',
                        highlightStyle: {
                            item: {
                                fill: '#0ab9ff',
                            },
                        },
                        label: {
                            fontWeight: 'bold',
                            color: 'white',
                        },
                    },
                ],
            }).code
        ).toMatchInlineSnapshot(`
          "const options = {
            series: [
              {
                type: 'bar',
                xKey: 'job',
                yKey: 'change',
                highlightStyle: { item: { fill: '#0ab9ff' } },
                label: { fontWeight: 'bold', color: 'white' }
              }
            ],

            legend: {
              enabled: false
            },

            padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }
          };
          var chart = agCharts.AgChart.create(options);"
        `);
    });

    test('hide axis ticks and make the chart lines thicker', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                axes: [
                    {
                        type: 'category',
                        position: 'bottom',
                        tick: {
                            enabled: true,
                        },
                    },
                    {
                        type: 'number',
                        position: 'left',
                        tick: {
                            enabled: true,
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

                label: {
                  enabled: false
                },

                tick: {
                  width: 2,
                  color: \\"transparent\\"
                },

                line: {
                  color: \\"transparent\\"
                },

                gridStyle: [{
                  stroke: \\"#C3C3C3\\",
                  lineDash: [4, 4]
                }]
              },
              {
                type: 'number',
                position: 'left',

                label: {
                  enabled: false
                },

                tick: {
                  width: 2,
                  color: \\"transparent\\"
                },

                line: {
                  color: \\"transparent\\"
                },

                gridStyle: [{
                  stroke: \\"#C3C3C3\\",
                  lineDash: [4, 4]
                }]
              }
            ],

            legend: {
              enabled: false
            },

            padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }
          };
          var chart = agCharts.AgChart.create(options);"
        `);
    });

    test('hide axis lines', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                axes: [
                    {
                        type: 'category',
                        position: 'bottom',
                        line: {
                            color: 'black',
                        },
                    },
                    {
                        type: 'number',
                        position: 'left',
                        line: {
                            color: 'black',
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

                label: {
                  enabled: false
                },

                tick: {
                  width: 2,
                  color: \\"transparent\\"
                },

                line: {
                  color: \\"transparent\\"
                },

                gridStyle: [{
                  stroke: \\"#C3C3C3\\",
                  lineDash: [4, 4]
                }]
              },
              {
                type: 'number',
                position: 'left',

                label: {
                  enabled: false
                },

                tick: {
                  width: 2,
                  color: \\"transparent\\"
                },

                line: {
                  color: \\"transparent\\"
                },

                gridStyle: [{
                  stroke: \\"#C3C3C3\\",
                  lineDash: [4, 4]
                }]
              }
            ],

            legend: {
              enabled: false
            },

            padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }
          };
          var chart = agCharts.AgChart.create(options);"
        `);
    });

    test('make grid lines more prominent', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                axes: [
                    {
                        type: 'category',
                        position: 'bottom',
                        gridStyle: {
                            stroke: 'blue',
                        },
                    },
                    {
                        type: 'number',
                        position: 'left',
                        gridStyle: {
                            stroke: 'blue',
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

                label: {
                  enabled: false
                },

                tick: {
                  width: 2,
                  color: \\"transparent\\"
                },

                line: {
                  color: \\"transparent\\"
                },

                gridStyle: [{
                  stroke: \\"#C3C3C3\\",
                  lineDash: [4, 4]
                }]
              },
              {
                type: 'number',
                position: 'left',

                label: {
                  enabled: false
                },

                tick: {
                  width: 2,
                  color: \\"transparent\\"
                },

                line: {
                  color: \\"transparent\\"
                },

                gridStyle: [{
                  stroke: \\"#C3C3C3\\",
                  lineDash: [4, 4]
                }]
              }
            ],

            legend: {
              enabled: false
            },

            padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }
          };
          var chart = agCharts.AgChart.create(options);"
        `);
    });

    test('remove padding', () => {
        expect(
            getChartsOptionsPlainEntryFile({
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 30,
                    left: 40,
                },
            }).code
        ).toMatchInlineSnapshot(`
          "const options = {
            legend: {
              enabled: false
            },

            padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }
          };
          var chart = agCharts.AgChart.create(options);"
        `);
    });
});
