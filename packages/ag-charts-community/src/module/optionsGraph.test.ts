import { expectWarningsCalls, setupMockConsole, testLogger } from '_ag-charts-test';
import { describe, expect, it } from 'vitest';

import type { PlainObject } from 'ag-charts-core';

import { OptionsGraph } from './optionsGraph';

function prepareOptions(options: PlainObject) {
    return {
        axes: {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'number', position: 'left' },
        },
        ...options,
    };
}

describe('OptionsGraph', () => {
    setupMockConsole();

    it('should merge chart defaults and user options', () => {
        const themeConfig = {
            line: {
                title: { text: 'Default Title', spacing: 20 },
                legend: { enabled: true, label: { enabled: true, text: 'Default Legend' } },
            },
        };
        const userOptions = prepareOptions({
            title: { text: 'User Options Title' },
            legend: { label: { enabled: false } },
        });
        const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
        expect(options).toStrictEqual({
            title: { text: 'User Options Title', spacing: 20 },
            legend: { enabled: true, label: { enabled: false, text: 'Default Legend' } },
            axes: expect.any(Object),
        });
    });

    it('should prioritise user options', () => {
        const themeConfig = {
            line: {
                one: 'default-value',
                two: 'default-value',
                three: 'default-value',
            },
        };
        const userOptions = prepareOptions({
            two: undefined,
            three: 'user-value',
        });
        const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
        expect(options).toStrictEqual({
            one: 'default-value',
            two: undefined,
            three: 'user-value',
            axes: expect.any(Object),
        });
    });

    it('should auto-enable modules configured by the user', () => {
        const themeConfig = {
            line: {
                title: {
                    enabled: false,
                    text: 'Default Title',
                    spacing: { $if: [{ $path: '../legend/enabled' }, 10, 20] },
                },
                subtitle: { enabled: false, text: 'Default Subtitle' },
                legend: { enabled: false, label: { enabled: false, text: 'Default Legend' } },
                axes: {
                    time: { title: { enabled: false, text: 'Default Title' } },
                    number: { title: { _enabledFromTheme: true, enabled: false, text: 'Default Title' } },
                },
            },
        };
        const userOptions = prepareOptions({
            title: {},
            legend: { label: { text: 'User Options Legend' } },
            axes: {
                x: { type: 'time' },
                xSecondary: { type: 'time', title: { text: 'Time Title' } },
                y: { type: 'number', title: { text: 'Number Title' } },
            },
        });
        const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
        expect(options).toStrictEqual({
            title: { enabled: true, text: 'Default Title', spacing: 10 },
            subtitle: { enabled: false, text: 'Default Subtitle' },
            legend: { enabled: true, label: { enabled: true, text: 'User Options Legend' } },
            axes: {
                x: { type: 'time', title: { enabled: false, text: 'Default Title' } },
                xSecondary: { type: 'time', title: { enabled: true, text: 'Time Title' } },
                y: { type: 'number', title: { enabled: false, text: 'Number Title' } },
            },
        });
    });

    it('should auto-enable label border from a user object', () => {
        const themeConfig = {
            line: {
                label: { enabled: false, border: { enabled: false } },
            },
        };

        const autoEnabled = new OptionsGraph(
            themeConfig,
            prepareOptions({ label: { border: { strokeWidth: 5 } } })
        ).resolve(testLogger) as { label: { border: { enabled: boolean; strokeWidth: number } } };
        expect(autoEnabled.label.border).toStrictEqual({ enabled: true, strokeWidth: 5 });

        const explicitOff = new OptionsGraph(
            themeConfig,
            prepareOptions({ label: { border: { enabled: false, strokeWidth: 5 } } })
        ).resolve(testLogger) as { label: { border: { enabled: boolean; strokeWidth: number } } };
        expect(explicitOff.label.border).toStrictEqual({ enabled: false, strokeWidth: 5 });
    });

    it('should replace default strings with user objects', () => {
        const themeConfig = {
            line: {
                one: 'default-value',
            },
        };
        const userOptions = prepareOptions({
            one: { child: 'child-value' },
        });
        const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
        expect(options).toStrictEqual({
            one: { child: 'child-value' },
            axes: expect.any(Object),
        });
    });

    it('should resolve options', () => {
        const themeConfig = {
            bar: {
                background: { $ref: 'backgroundColor' },
                foreground: { $ref: 'foregroundColor' },
                series: {
                    fill: { $palette: 'fill' },
                    label: {
                        color: {
                            $if: [
                                {
                                    $or: [
                                        { $eq: [{ $path: './placement' }, 'outside-start'] },
                                        { $eq: [{ $path: './placement' }, 'outside-end'] },
                                    ],
                                },
                                'black',
                                'white',
                            ],
                        },
                        placement: 'inside-center',
                    },
                },
            },
            line: {
                background: { $ref: 'foregroundColor' },
                foreground: { $ref: 'backgroundColor' },
                legend: {
                    position: 'bottom',
                    orientation: {
                        $if: [
                            {
                                $or: [
                                    { $eq: [{ $path: './position' }, 'left'] },
                                    { $eq: [{ $path: './position' }, 'right'] },
                                ],
                            },
                            'vertical',
                            'horizontal',
                        ],
                    },
                    spacing: 30,
                },
                axes: {
                    number: {
                        title: {
                            text: 'Number Axis',
                        },
                        line: {
                            stroke: { $ref: 'axisLineColor' },
                        },
                    },
                    category: {
                        title: {
                            text: 'Category Axis',
                        },
                        line: {
                            stroke: { $ref: 'axisLineColor' },
                        },
                    },
                },
                series: {
                    stroke: { $palette: 'fill' },
                },
            },
        };

        const params = {
            backgroundColor: 'white',
            foregroundColor: 'black',
            axisLineColor: 'grey',
        };

        const palette = {
            fills: ['red', 'green', 'blue'],
        };

        const userOptions = prepareOptions({
            title: 'User Options',
            background: 'grey',
            legend: { position: 'left' },
            series: [
                { type: 'line', stroke: 'purple' },
                { type: 'bar', label: { placement: 'outside-start' } },
                { type: 'bar' },
            ],
        });

        const options = new OptionsGraph(themeConfig, userOptions, params, params, palette).resolve(testLogger);
        expect(options).toStrictEqual({
            title: 'User Options', // from user options
            background: 'grey', // from user options
            foreground: 'white', // from first series' chart defaults
            legend: {
                position: 'left',
                orientation: 'vertical',
                spacing: 30,
            },
            axes: {
                y: { type: 'number', position: 'left', title: { text: 'Number Axis' }, line: { stroke: 'grey' } },
                x: { type: 'category', position: 'bottom', title: { text: 'Category Axis' }, line: { stroke: 'grey' } },
            },
            series: [
                {
                    type: 'line',
                    stroke: 'purple', // from user options
                },
                {
                    type: 'bar',
                    fill: 'green', // from series defaults by type
                    label: {
                        color: 'black', // from series defaults by type with user options `placement`
                        placement: 'outside-start', // from user options
                    },
                },
                {
                    type: 'bar',
                    fill: 'blue', // from series defaults by type
                    label: {
                        color: 'white', // from series defaults by type with default options `placement`
                        placement: 'inside-center', // from series defaults by type
                    },
                },
            ],
        });
    });

    it.fails('fails to handle merging objects with operations that resolve to objects', () => {
        const themeConfig = {
            line: {
                item: {
                    one: 'default-one',
                    two: 'default-two',
                },
            },
        };
        const overrides = {
            line: {
                other: {
                    one: 'other-one',
                    three: 'other-three',
                },
            },
        };
        const userOptions = prepareOptions({
            item: { $path: '/other' },
        });
        const options = new OptionsGraph(themeConfig, userOptions, {}, {}, overrides).resolve(testLogger);
        expect(options).toStrictEqual({
            item: {
                one: 'other-one',
                two: 'default-two',
                three: 'other-three',
            },
            other: {
                one: 'other-one',
                three: 'other-three',
            },
            axes: expect.any(Object),
        });
    });

    describe('color operations', () => {
        it('should resolve `$mix` operations', () => {
            const themeConfig = {
                line: {
                    fill: { $mix: ['#ffffff', '#000000', 0.5] },
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                fill: '#808080',
                axes: expect.any(Object),
            });
        });

        it('should resolve `$opacity` operations ', () => {
            const themeConfig = {
                line: {
                    fill: { $opacity: ['#ff0000', 0.5] },
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                fill: 'rgba(255, 0, 0, 0.5)',
                axes: expect.any(Object),
            });
        });
    });

    describe('location operations', () => {
        describe('$circular', () => {
            // See AG-16931
            it('should resolve `$circular` operations', () => {
                const themeConfig = {
                    line: {
                        one: {
                            child: {
                                $some: [{ $eq: [{ $path: '/series/$index/fill' }, 'green'] }, { $path: '/series' }],
                            },
                            other: 'one-other-value',
                        },
                        series: {
                            two: { $circular: { $path: '/one/other' } },
                        },
                    },
                };
                const userOptions = prepareOptions({
                    series: [
                        { type: 'line', fill: 'red' },
                        { type: 'line', fill: 'green', fillOpacity: 0.5 },
                    ],
                });
                const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
                expect(options).toStrictEqual({
                    one: {
                        child: true,
                        other: 'one-other-value',
                    },
                    series: [
                        {
                            type: 'line',
                            fill: 'red',
                            two: 'one-other-value',
                        },
                        {
                            type: 'line',
                            fill: 'green',
                            fillOpacity: 0.5,
                            two: 'one-other-value',
                        },
                    ],
                    axes: expect.any(Object),
                });
            });
        });

        describe('$isUserOption', () => {
            const resolveWithMaxWidth = (themeConfig: PlainObject, maxWidth?: number) =>
                new OptionsGraph(themeConfig, prepareOptions(maxWidth === undefined ? {} : { maxWidth })).resolve(
                    testLogger
                );

            it('should resolve omitted branches to the check outcome', () => {
                const themeConfig = {
                    line: {
                        one: { $isUserOption: './maxWidth' },
                        two: { $isUserOption: ['./maxWidth'] },
                        three: { $isUserOption: ['./maxWidth', 2] },
                    },
                };

                expect(resolveWithMaxWidth(themeConfig, 10)).toMatchObject({ one: true, two: true, three: 2 });
                expect(resolveWithMaxWidth(themeConfig)).toMatchObject({ one: false, two: false, three: false });
            });

            it('should resolve an explicit `undefined` branch to `undefined`', () => {
                const themeConfig = { line: { one: { $isUserOption: ['./maxWidth', 2, undefined] } } };

                expect(resolveWithMaxWidth(themeConfig, 10)).toMatchObject({ one: 2 });
                expect(resolveWithMaxWidth(themeConfig)).not.toHaveProperty('one');
            });

            it('should match any path of a path list', () => {
                const themeConfig = {
                    line: {
                        one: { $isUserOption: [['./minWidth', './maxWidth']] },
                        two: { $isUserOption: [['./minWidth', './maxWidth'], 'yes'] },
                        three: { $isUserOption: [['./minWidth', './maxWidth'], 'yes', 'no'] },
                    },
                };

                expect(resolveWithMaxWidth(themeConfig, 10)).toMatchObject({
                    one: true,
                    two: 'yes',
                    three: 'yes',
                });
                expect(resolveWithMaxWidth(themeConfig)).toMatchObject({
                    one: false,
                    two: false,
                    three: 'no',
                });
            });
        });

        describe('$palette', () => {
            it('should resolve `$palette` operations', () => {
                const themeConfig = {
                    line: {
                        items: [
                            {
                                fill: { $palette: 'fill' },
                            },
                        ],
                    },
                };
                const palette = {
                    fills: ['red', 'green', 'blue'],
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({}), {}, {}, palette).resolve(testLogger);
                expect(options).toStrictEqual({
                    items: [{ fill: 'red' }],
                    axes: expect.any(Object),
                });
            });

            it('should resolve `$palette` operations', () => {
                const themeConfig = {
                    line: {
                        items: [
                            { fill: { $palette: 'fill' } },
                            { fill: { $palette: 'fill' } },
                            { fill: { $palette: 'fill' } },
                            { fill: { $palette: 'fill' } },
                            { fill: { $palette: 'fill' } },
                            { fill: { $palette: 'fill' } },
                        ],
                    },
                };
                const palette = {
                    fills: ['red', 'green', 'blue'],
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({}), {}, {}, palette).resolve(testLogger);
                expect(options).toStrictEqual({
                    items: [
                        { fill: 'red' },
                        { fill: 'green' },
                        { fill: 'blue' },
                        { fill: 'red' },
                        { fill: 'green' },
                        { fill: 'blue' },
                    ],
                    axes: expect.any(Object),
                });
            });
        });

        describe('$path', () => {
            it('should resolve `$path` operations', () => {
                const themeConfig = {
                    line: {
                        key: 'key-value',
                        parent: { child: 'child-value' },
                    },
                };
                const userOptions = prepareOptions({
                    cousin: { $path: '/key' },
                    secondCousin: { $path: '/parent/child' },
                    olderSibling: { $path: '/sibling' },
                    sibling: 'sibling-value',
                    youngerSibling: { $path: '/sibling' },
                    relative: {
                        relativeChild: { $path: '../parent/child' },
                    },
                });
                const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
                expect(options).toStrictEqual({
                    key: 'key-value',
                    parent: { child: 'child-value' },
                    cousin: 'key-value',
                    secondCousin: 'child-value',
                    olderSibling: 'sibling-value',
                    sibling: 'sibling-value',
                    youngerSibling: 'sibling-value',
                    relative: {
                        relativeChild: 'child-value',
                    },
                    axes: expect.any(Object),
                });
            });

            it('should resolve `$path` operations that resolve to operations', () => {
                const themeConfig = {
                    line: {
                        one: { $path: './two' },
                        two: { $path: './three' },
                        three: 'three-value',
                    },
                };
                const userOptions = prepareOptions({
                    four: { $path: './five' },
                    five: { $path: './six' },
                    six: 'six-value',
                });
                const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
                expect(options).toStrictEqual({
                    one: 'three-value',
                    two: 'three-value',
                    three: 'three-value',
                    four: 'six-value',
                    five: 'six-value',
                    six: 'six-value',
                    axes: expect.any(Object),
                });
            });

            // Reason: requires fixing
            it.skip('should resolve `$path` operations whose path is an operation', () => {
                const themeConfig = {
                    line: {
                        one: { $path: { $path: './two' } },
                        two: './three',
                        three: 'three-value',
                    },
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
                expect(options).toStrictEqual({
                    // TODO: `one` does not resolve since there is no operational dependency between `two` and `three`, the
                    // dependency is only discovered through the plain value of `two` being used by `one`. If `one` is
                    // after `three` in the object keys list, it would work.
                    one: 'three-value',
                    two: './three',
                    three: 'three-value',
                    axes: expect.any(Object),
                });
            });

            it('should resolve `$path` operations default values', () => {
                const themeConfig = {
                    line: {
                        one: { $path: ['./invalid', { $path: ['./also/invalid', { $path: './two' }] }] },
                        two: { $path: ['./invalid', { $path: './three' }] },
                        three: { $path: ['./invalid', 'default-value'] },
                    },
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
                expect(options).toStrictEqual({
                    one: 'default-value',
                    two: 'default-value',
                    three: 'default-value',
                    axes: expect.any(Object),
                });
            });

            it('should resolve `$path` operations with custom branches', () => {
                const themeConfig = {
                    line: {
                        parent: { $path: ['/child', undefined, { child: 'child-value' }] },
                    },
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
                expect(options).toStrictEqual({
                    parent: 'child-value',
                    axes: expect.any(Object),
                });
            });

            it('should resolve `$path` operations with custom branches that are `$path` operations', () => {
                const themeConfig = {
                    line: {
                        parent: {
                            child: 'child-value',
                        },
                        sibling: { $path: ['/child', undefined, { $path: '/parent' }] },
                    },
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
                expect(options).toStrictEqual({
                    parent: {
                        child: 'child-value',
                    },
                    sibling: 'child-value',
                    axes: expect.any(Object),
                });
            });
        });

        describe('$ref', () => {
            it('should resolve `$ref` operations', () => {
                const options = new OptionsGraph({ line: { one: { $ref: 'key' } } }, prepareOptions({}), {
                    key: 'value',
                }).resolve(testLogger);
                expect(options).toStrictEqual({
                    one: 'value',
                    axes: expect.any(Object),
                });
            });

            it('should resolve `$ref` operation on second `$ref` operation', () => {
                const options = new OptionsGraph({ line: { one: { $ref: 'second' } } }, prepareOptions({}), {
                    first: 'value',
                    second: { $ref: 'first' },
                }).resolve(testLogger);
                expect(options).toStrictEqual({
                    one: 'value',
                    axes: expect.any(Object),
                });
            });
        });

        describe('$value', () => {
            it('should resolve `$value` `$1` operations', () => {});

            it('should resolve `$value` `$index` operations', () => {
                const themeConfig = {
                    line: {
                        items: [
                            { index: { $value: '$index' } },
                            { index: { $value: '$index' } },
                            { index: { $value: '$index' } },
                        ],
                    },
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
                expect(options).toStrictEqual({
                    items: [{ index: 0 }, { index: 1 }, { index: 2 }],
                    axes: expect.any(Object),
                });
            });
        });
    });

    describe('logic operations', () => {
        it('should resolve `$and` operations', () => {
            const themeConfig = {
                line: {
                    one: { $and: [true, true] },
                    two: { $and: [true, false] },
                    three: { $and: [false, false] },
                    four: { $and: { $path: '/caseBoth' } },
                    five: { $and: { $path: '/caseOne' } },
                    caseBoth: [true, true],
                    caseOne: [true, false],
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                one: true,
                two: false,
                three: false,
                four: true,
                five: false,
                caseBoth: expect.anything(),
                caseOne: expect.anything(),
                axes: expect.any(Object),
            });
        });

        it.fails('should resolve `$and` operations with `$map`', () => {
            const themeConfig = {
                line: {
                    one: { $and: { $map: [{ $value: '$1' }, { $path: './two' }] } },
                    two: [true, false],
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                one: false,
                two: [true, false],
                axes: expect.any(Object),
            });
        });

        it('should resolve `$eq` operations', () => {
            const themeConfig = {
                line: {
                    one: { $eq: [1, 1] },
                    two: { $eq: [1, '1'] },
                    three: { $eq: ['hello', 'hello'] },
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                one: true,
                two: false,
                three: true,
                axes: expect.any(Object),
            });
        });

        it('should resolve `$if` operations', () => {
            const themeConfig = {
                line: {
                    one: { $if: [true, 'yes', 'no'] },
                    two: { $if: [false, 'yes', 'no'] },
                    three: { $if: [true, { $if: [true, 'yes-yes', 'yes-no'] }, 'no'] },
                    four: { $if: [true, { five: { $if: [true, 'yes-yes', 'yes-no'] }, six: 'six' }, 'no'] },
                },
            };
            const userOptions = prepareOptions({
                seven: { $if: [true, { $omit: [['six'], { $path: '/four' }] }, { eight: 'eight' }] },
            });
            const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
            expect(options).toStrictEqual({
                one: 'yes',
                two: 'no',
                three: 'yes-yes',
                four: { five: 'yes-yes', six: 'six' },
                seven: { five: 'yes-yes' },
                axes: expect.any(Object),
            });
        });

        it('should resolve omitted `$if` branches to the condition outcome', () => {
            const themeConfig = {
                line: {
                    one: { $if: [true] },
                    two: { $if: [false] },
                    three: { $if: ['hello'] },
                    four: { $if: [true, 'yes'] },
                    five: { $if: [false, 'yes'] },
                    six: { $if: [false, 'yes', undefined] },
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                one: true,
                two: false,
                three: true,
                four: 'yes',
                five: false,
                axes: expect.any(Object),
            });
            expect(options).not.toHaveProperty('six');
        });

        it('should resolve `$isType` operations', () => {
            const themeConfig = {
                line: {
                    arrayValue: [1, 2],
                    objectValue: { a: 1 },
                    stringValue: 'hello',
                    numberValue: 42,
                    booleanValue: false,
                    dateValue: new Date(0),
                    functionValue: () => 'called',
                    one: { $isType: [{ $path: './arrayValue' }, 'array', 'yes', 'no'] },
                    two: { $isType: [{ $path: './objectValue' }, 'array', 'yes', 'no'] },
                    three: { $isType: [{ $path: './objectValue' }, 'object', 'yes', 'no'] },
                    four: { $isType: [{ $path: './arrayValue' }, 'object', 'yes', 'no'] },
                    five: { $isType: [{ $path: './stringValue' }, 'string', 'yes', 'no'] },
                    six: { $isType: [{ $path: './numberValue' }, 'number', 'yes', 'no'] },
                    seven: { $isType: [{ $path: './booleanValue' }, 'boolean', 'yes', 'no'] },
                    eight: { $isType: [{ $path: './dateValue' }, 'date', 'yes', 'no'] },
                    nine: { $isType: [{ $path: './functionValue' }, 'function', 'yes', 'no'] },
                    ten: { $isType: [{ $path: './missingValue' }, 'nullish', 'yes', 'no'] },
                    eleven: { $isType: [{ $path: './stringValue' }, 'nullish', 'yes', 'no'] },
                    twelve: { $isType: [{ $path: './stringValue' }, ['number', 'string'], 'yes', 'no'] },
                    thirteen: { $isType: [{ $path: './stringValue' }, ['array', 'object'], 'yes', 'no'] },
                    fourteen: { $isType: [{ $path: './numberValue' }, 'number', { $path: './stringValue' }, 'no'] },
                    fifteen: { $isType: [{ $path: './stringValue' }, 'number', 'yes'] },
                    sixteen: {
                        $isType: [
                            { $path: './arrayValue' },
                            'array',
                            {
                                seventeen: { $isType: [{ $path: '/stringValue' }, 'string', 'yes-yes', 'yes-no'] },
                                eighteen: 'eighteen',
                            },
                            'no',
                        ],
                    },
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                arrayValue: expect.anything(),
                objectValue: expect.anything(),
                stringValue: 'hello',
                numberValue: 42,
                booleanValue: false,
                dateValue: expect.any(Date),
                functionValue: expect.any(Function),
                one: 'yes',
                two: 'no',
                three: 'yes',
                four: 'no',
                five: 'yes',
                six: 'yes',
                seven: 'yes',
                eight: 'yes',
                nine: 'yes',
                ten: 'yes',
                eleven: 'no',
                twelve: 'yes',
                thirteen: 'no',
                fourteen: 'hello',
                fifteen: false,
                sixteen: { seventeen: 'yes-yes', eighteen: 'eighteen' },
                axes: expect.any(Object),
            });
        });

        it('should resolve omitted `$isType` branches to the match outcome', () => {
            const themeConfig = {
                line: {
                    arrayValue: [1, 2],
                    one: { $isType: [{ $path: './arrayValue' }, 'array'] },
                    two: { $isType: [{ $path: './arrayValue' }, 'string'] },
                    three: { $isType: [{ $path: './arrayValue' }, 'array', 'yes'] },
                    four: { $isType: [{ $path: './arrayValue' }, 'string', 'yes'] },
                    five: { $isType: [{ $path: './arrayValue' }, 'string', 'yes', undefined] },
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                arrayValue: expect.anything(),
                one: true,
                two: false,
                three: 'yes',
                four: false,
                axes: expect.any(Object),
            });
            expect(options).not.toHaveProperty('five');
        });

        it('should resolve the `else` branch of `$isType` on an unrecognised type name', () => {
            (globalThis as any).agChartsDebug = 'dev';

            try {
                const themeConfig = {
                    line: {
                        stringValue: 'hello',
                        one: { $isType: [{ $path: './stringValue' }, 'symbol', 'yes', 'no'] },
                    },
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
                expect(options).toStrictEqual({
                    stringValue: 'hello',
                    one: 'no',
                    axes: expect.any(Object),
                });
                expectWarningsCalls().toMatchInlineSnapshot(`
                  [
                    [
                      "AG Charts - \`$isType\` json operation failed on [symbol] at [one], expecting one of [array, boolean, date, function, nullish, number, object, string].",
                    ],
                  ]
                `);
            } finally {
                delete (globalThis as any).agChartsDebug;
            }
        });

        it('should resolve `$isType` nested within `$isUserOption`', () => {
            const themeConfig = {
                line: {
                    strokeWidth: {
                        $isUserOption: ['./stroke', { $isType: [{ $path: './stroke' }, 'object', 4, 2] }, 0],
                    },
                },
            };

            const resolveWithStroke = (stroke?: unknown) =>
                new OptionsGraph(themeConfig, prepareOptions(stroke === undefined ? {} : { stroke })).resolve(
                    testLogger
                );

            expect(resolveWithStroke({ type: 'gradient' })).toMatchObject({ strokeWidth: 4 });
            expect(resolveWithStroke('red')).toMatchObject({ strokeWidth: 2 });
            expect(resolveWithStroke()).toMatchObject({ strokeWidth: 0 });
        });

        it('should resolve `$not` operations', () => {
            const themeConfig = {
                line: {
                    one: { $not: [true] },
                    two: { $not: [false] },
                    three: { $not: ['hello'] },
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                one: false,
                two: true,
                three: false,
                axes: expect.any(Object),
            });
        });

        it('should resolve `$or` operations', () => {
            const themeConfig = {
                line: {
                    one: { $or: [true, true] },
                    two: { $or: [true, false] },
                    three: { $or: [false, false] },
                    four: { $or: { $path: '/caseOne' } },
                    five: { $or: { $path: '/caseNeither' } },
                    caseOne: [true, false],
                    caseNeither: [false, false],
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                one: true,
                two: true,
                three: false,
                four: true,
                five: false,
                caseOne: expect.anything(),
                caseNeither: expect.anything(),
                axes: expect.any(Object),
            });
        });

        // TODO: This test is failing since the $or operation does not operate on the resolved value of the $map
        // operation. The precise reason for this is elusive.
        it.fails('should resolve `$or` operations with `$map`', () => {
            const themeConfig = {
                line: {
                    one: { $or: { $map: [{ $value: '$1' }, { $path: './two' }] } },
                    two: [true, false],
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                one: true,
                two: [true, false],
                axes: expect.any(Object),
            });
        });

        it('should resolve `$switch` operations', () => {
            const themeConfig = {
                line: {
                    one: {
                        $switch: [
                            { $path: '/two' },
                            'default-value',
                            ['case-a', 'case-a-value'],
                            ['case-b', 'case-b-value'],
                        ],
                    },
                    two: 'case-a',
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                one: 'case-a-value',
                two: 'case-a',
                axes: expect.any(Object),
            });
        });

        it('should resolve `$every` operations', () => {
            const themeConfig = {
                line: {
                    one: { $every: [{ $lessThan: [{ $value: '$1' }, 10] }, { $path: '/compare' }] },
                    two: { $every: [{ $lessThan: [{ $value: '$1' }, 20] }, { $path: '/compare' }] },
                    compare: [0, 5, 10],
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                one: false,
                two: true,
                compare: expect.anything(),
                axes: expect.any(Object),
            });
        });

        it('should resolve `$some` operations', () => {
            const themeConfig = {
                line: {
                    one: {
                        $some: [{ $greaterThan: [{ $path: '/compare/$index/value' }, 5] }, { $path: '/compare' }],
                    },
                    two: { $some: [{ $greaterThan: [{ $path: '/compare/$index/value' }, 20] }, { $path: '/compare' }] },
                    compare: [{ value: 0 }, { value: 5 }, { value: 10 }],
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                one: true,
                two: false,
                compare: expect.anything(),
                axes: expect.any(Object),
            });
        });
    });

    describe('transform operations', () => {
        describe('$apply', () => {
            it('should apply theme defaults to user options', () => {
                const themeConfig = {
                    line: {
                        title: 'Default Title',
                        series: {
                            items: {
                                $apply: [
                                    {
                                        other: { $path: './color' },
                                        color: 'black',
                                    },
                                ],
                            },
                        },
                    },
                };
                const userOptions = prepareOptions({
                    series: [
                        {
                            type: 'line',
                            items: [{}, { user: 'user-value' }, { user: 'user-value', color: 'red' }],
                        },
                    ],
                });
                const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
                expect(options).toStrictEqual({
                    title: 'Default Title',
                    axes: expect.any(Object),
                    series: [
                        {
                            type: 'line',
                            items: [
                                // We do not want to apply the defaults if the user explicitly provided an empty
                                // object, e.g. gridLine styles
                                {},
                                { user: 'user-value', color: 'black', other: 'black' },
                                { user: 'user-value', color: 'red', other: 'red' },
                            ],
                        },
                    ],
                });
            });
        });

        describe('$applyPadding', () => {
            it('should apply theme defaults', () => {
                const themeConfig = {
                    line: {
                        padding: {
                            $applyPadding: 4,
                        },
                    },
                };
                const userOptions = prepareOptions({});
                const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
                expect(options).toStrictEqual({
                    padding: { top: 4, right: 4, bottom: 4, left: 4 },
                    axes: expect.any(Object),
                });
            });

            it('should expand single user number to every side', () => {
                const themeConfig = {
                    line: {
                        padding: {
                            $applyPadding: { top: 4, right: 8, bottom: 12, left: 16 },
                        },
                    },
                };
                const userOptions = prepareOptions({ padding: 3 });
                const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
                expect(options).toStrictEqual({
                    padding: { top: 3, right: 3, bottom: 3, left: 3 },
                    axes: expect.any(Object),
                });
            });

            it('should apply theme defaults to partial user sides', () => {
                const themeConfig = {
                    line: {
                        padding: {
                            $applyPadding: { top: 4, right: 8, bottom: 12, left: 16 },
                        },
                    },
                };
                const userOptions = prepareOptions({ padding: { top: 3, bottom: 3 } });
                const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
                expect(options).toStrictEqual({
                    padding: { top: 3, right: 8, bottom: 3, left: 16 },
                    axes: expect.any(Object),
                });
            });

            it('should expand a single-number theme-override to every side', () => {
                const themeConfig = {
                    line: {
                        padding: {
                            $applyPadding: 4,
                        },
                    },
                };
                const userOptions = prepareOptions({});
                const overrides = { line: { padding: 8 } };
                const options = new OptionsGraph(themeConfig, userOptions, undefined, {}, {}, overrides).resolve(
                    testLogger
                );
                expect(options).toStrictEqual({
                    padding: { top: 8, right: 8, bottom: 8, left: 8 },
                    axes: expect.any(Object),
                });
            });

            it('should apply theme defaults to partial theme-override sides', () => {
                const themeConfig = {
                    line: {
                        padding: {
                            $applyPadding: { top: 4, right: 8, bottom: 4, left: 8 },
                        },
                    },
                };
                const userOptions = prepareOptions({});
                const overrides = { line: { padding: { left: 15, right: 15 } } };
                const options = new OptionsGraph(themeConfig, userOptions, undefined, {}, {}, overrides).resolve(
                    testLogger
                );
                expect(options).toStrictEqual({
                    padding: { top: 4, right: 15, bottom: 4, left: 15 },
                    axes: expect.any(Object),
                });
            });

            it('should prefer a user option over a theme-override', () => {
                const themeConfig = {
                    line: {
                        padding: {
                            $applyPadding: 4,
                        },
                    },
                };
                const userOptions = prepareOptions({ padding: 3 });
                const overrides = { line: { padding: 8 } };
                const options = new OptionsGraph(themeConfig, userOptions, undefined, {}, {}, overrides).resolve(
                    testLogger
                );
                expect(options).toStrictEqual({
                    padding: { top: 3, right: 3, bottom: 3, left: 3 },
                    axes: expect.any(Object),
                });
            });

            it('should merge a partial user option over a partial theme-override per side', () => {
                const themeConfig = {
                    line: {
                        padding: {
                            $applyPadding: { top: 4, right: 8, bottom: 4, left: 8 },
                        },
                    },
                };
                const userOptions = prepareOptions({ padding: { left: 20 } });
                // Override supplied via the `common` namespace while the default comes from the
                // series-type (`line`) namespace, exercising the common-namespace fallback in
                // dangerouslyGetThemeOverride alongside the per-side merge.
                const overrides = { common: { padding: { right: 15, bottom: 15 } } };
                const options = new OptionsGraph(themeConfig, userOptions, undefined, {}, {}, overrides).resolve(
                    testLogger
                );
                // Per-side precedence user > override > default: left from user, right/bottom from
                // override, top falls through to the default. A partial user object must not discard
                // the override- or default-supplied sides.
                expect(options).toStrictEqual({
                    padding: { top: 4, right: 15, bottom: 15, left: 20 },
                    axes: expect.any(Object),
                });
            });
        });

        describe('$applySwitch', () => {
            it('should resolve to default if no user option', () => {
                const themeConfig = {
                    line: {
                        item: {
                            $applySwitch: [
                                { $path: 'type' },
                                { first: 'default' },
                                ['one', { first: 'one', second: 'one' }],
                                ['two', { first: 'two', second: 'two' }],
                                ['three', { first: 'three', second: 'three' }],
                            ],
                        },
                    },
                };
                const userOptions = prepareOptions({});
                const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
                expect(options).toStrictEqual({
                    item: { first: 'default' },
                    axes: expect.any(Object),
                });
            });

            it('should resolve unmatched values to the user options', () => {
                const themeConfig = {
                    line: {
                        item: {
                            $applySwitch: [
                                { $path: 'type' },
                                { first: 'default' },
                                ['one', { first: 'one', second: 'one' }],
                                ['two', { first: 'two', second: 'two' }],
                                ['three', { first: 'three', second: 'three' }],
                            ],
                        },
                    },
                };
                const userOptions = prepareOptions({
                    item: { first: 'user' },
                });
                const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
                expect(options).toStrictEqual({
                    item: { first: 'user' },
                    axes: expect.any(Object),
                });
            });

            it('should resolve matched values', () => {
                const themeConfig = {
                    line: {
                        item: {
                            $applySwitch: [
                                { $path: 'type' },
                                { first: 'default' },
                                ['one', { first: 'one', second: 'one' }],
                                ['two', { first: 'two', second: 'two' }],
                                ['three', { first: 'three', second: 'three' }],
                            ],
                        },
                    },
                };
                const userOptions = prepareOptions({
                    item: {
                        type: 'two',
                        second: 'user',
                        other: 'user',
                    },
                });
                const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
                expect(options).toStrictEqual({
                    item: {
                        type: 'two',
                        first: 'two',
                        second: 'user',
                        other: 'user',
                    },
                    axes: expect.any(Object),
                });
            });
        });

        describe('$findFirstSiblingNotOperation', () => {
            it('should pick the path from the first sibling that is not an operation', () => {
                const themeConfig = {
                    line: {
                        items: {
                            $apply: [
                                {
                                    child: { $findFirstSiblingNotOperation: ['default-value'] },
                                    other: 'other-value',
                                },
                            ],
                        },
                    },
                };
                const userOptions = prepareOptions({
                    items: [
                        { other: 'user-value' },
                        { child: 'sibling-value', other: 'older-sibling' },
                        { other: 'younger-sibling' },
                    ],
                });
                const options = new OptionsGraph(themeConfig, userOptions).resolve(testLogger);
                expect(options).toStrictEqual({
                    items: [
                        { child: 'sibling-value', other: 'user-value' },
                        { child: 'sibling-value', other: 'older-sibling' },
                        { child: 'sibling-value', other: 'younger-sibling' },
                    ],
                    axes: expect.any(Object),
                });
            });
        });

        it('should resolve `$omit` operation', () => {
            const themeConfig = {
                line: {
                    one: { $omit: [['three', 'five'], { $path: '/two' }] },
                    two: {
                        three: 'three-value',
                        four: 'four-value',
                        five: 'five-value',
                        six: 'six-value',
                    },
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                one: {
                    four: 'four-value',
                    six: 'six-value',
                },
                two: {
                    three: 'three-value',
                    four: 'four-value',
                    five: 'five-value',
                    six: 'six-value',
                },
                axes: expect.any(Object),
            });
        });

        describe('$map', () => {
            it('should map values', () => {
                const themeConfig = {
                    line: {
                        one: { $map: ['ciao', ['hello', 'bonjour']] },
                    },
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
                expect(options).toStrictEqual({
                    one: ['ciao', 'ciao'],
                    axes: expect.any(Object),
                });
            });

            it('should map values from an operation', () => {
                const themeConfig = {
                    line: {
                        one: { $map: ['ciao', { $path: '/two' }] },
                        two: ['hello', 'bonjour'],
                    },
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
                expect(options).toStrictEqual({
                    one: ['ciao', 'ciao'],
                    two: ['hello', 'bonjour'],
                    axes: expect.any(Object),
                });
            });

            it('should map values onto an operation', () => {
                const themeConfig = {
                    line: {
                        one: { $map: [{ $path: '/three' }, { $path: '/two' }] },
                        two: [{ child: 'hello' }, { child: 'bonjour' }],
                        three: 'three-value',
                    },
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
                expect(options).toStrictEqual({
                    one: ['three-value', 'three-value'],
                    two: [{ child: 'hello' }, { child: 'bonjour' }],
                    three: 'three-value',
                    axes: expect.any(Object),
                });
            });

            it('should map values onto $value: $1', () => {
                const themeConfig = {
                    line: {
                        one: { $map: [{ $value: '$1' }, { $path: '/two' }] },
                        two: ['hello', 'bonjour'],
                    },
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
                expect(options).toStrictEqual({
                    one: ['hello', 'bonjour'],
                    two: ['hello', 'bonjour'],
                    axes: expect.any(Object),
                });
            });

            it('should map values onto nested $value: $1', () => {
                const themeConfig = {
                    line: {
                        one: { $map: [{ child: { $value: '$1' } }, { $path: '/two' }] },
                        two: ['hello', 'bonjour'],
                    },
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
                expect(options).toStrictEqual({
                    one: [{ child: 'hello' }, { child: 'bonjour' }],
                    two: ['hello', 'bonjour'],
                    axes: expect.any(Object),
                });
            });

            it("should map values onto an operation with `$value: '$1`'", () => {
                const themeConfig = {
                    line: {
                        one: { $map: [{ $path: ['/child', undefined, { $value: '$1' }] }, { $path: '/two' }] },
                        two: [{ child: 'hello' }, { child: 'bonjour' }],
                        three: 'three-value',
                    },
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
                expect(options).toStrictEqual({
                    one: ['hello', 'bonjour'],
                    two: [{ child: 'hello' }, { child: 'bonjour' }],
                    three: 'three-value',

                    axes: expect.any(Object),
                });
            });

            it('should map values onto an operation with `$index` in path', () => {
                const themeConfig = {
                    line: {
                        item: {
                            enabled: true,
                            colors: {
                                $map: [{ $path: '../../strokes/$index' }, { $path: '../strokes' }],
                                // $map: [{ $path: '../../strokes/$index' }, { $path: '../fills' }], // why does this fail?
                            },
                        },
                        fills: ['black', 'grey', 'white'],
                        strokes: { $palette: 'strokes' },
                    },
                };
                const palette = {
                    strokes: ['red', 'green', 'blue'],
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({}), {}, {}, palette).resolve(testLogger);
                expect(options).toStrictEqual({
                    item: {
                        enabled: true,
                        colors: ['red', 'green', 'blue'],
                    },
                    fills: ['black', 'grey', 'white'],
                    strokes: ['red', 'green', 'blue'],
                    axes: expect.any(Object),
                });
            });
        });
    });

    describe('combinations', () => {
        it('should resolve `$omit` with `$switch`', () => {
            const themeConfig = {
                line: {
                    two: {
                        child: 'child-value',
                        other: 'other-value',
                        third: 'third-value',
                    },
                    one: {
                        $omit: [
                            {
                                $switch: [
                                    { $path: 'child' },
                                    ['child', 'other'],
                                    ['child-value', ['other']],
                                    ['other-value', ['child']],
                                ],
                            },
                            { $path: '/two' },
                        ],
                    },
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve(testLogger);
            expect(options).toStrictEqual({
                one: {
                    child: 'child-value',
                    third: 'third-value',
                },
                two: {
                    child: 'child-value',
                    other: 'other-value',
                    third: 'third-value',
                },
                axes: expect.any(Object),
            });
        });
    });

    describe('css variables', () => {
        it('should not treat `Object.prototype` member names as CSS variables', () => {
            const themeConfig = { line: { themeValue: 'valueOf' } };
            const userOptions = prepareOptions({
                title: { text: 'constructor' },
                userValue: 'toString',
                inherited: '__proto__',
            });
            const options = new OptionsGraph(themeConfig, userOptions, {}, {}, {}, undefined, new Map(), {
                'var(--brand)': '#00ff00',
            }).resolve(testLogger);
            expect(options).toStrictEqual({
                themeValue: 'valueOf',
                title: { text: 'constructor' },
                userValue: 'toString',
                inherited: '__proto__',
                axes: expect.any(Object),
            });
        });
    });

    describe('public api', () => {
        describe('ref', () => {
            it('should resolve public `ref` operations', () => {
                const themeConfig = { line: { one: { ref: 'key' } } };
                const params = { key: 'value' };
                const options = new OptionsGraph(themeConfig, prepareOptions({}), params).resolve(testLogger);
                expect(options).toStrictEqual({
                    one: 'value',
                    axes: expect.any(Object),
                });
            });

            it('should resolve public `ref` operation on `$ref` operation', () => {
                const themeConfig = { line: { one: { ref: 'second' } } };
                const params = { first: 'value', second: { $ref: 'first' } };
                const options = new OptionsGraph(themeConfig, prepareOptions({}), params).resolve(testLogger);
                expect(options).toStrictEqual({
                    one: 'value',
                    axes: expect.any(Object),
                });
            });

            it('should resolve public `ref` operation with `mix` and default onto transparent', () => {
                const themeConfig = { line: { fill: { ref: 'accentColor', mix: 0.25 } } };
                const params = { accentColor: 'rgba(255, 0, 0, 1)' };
                const options = new OptionsGraph(themeConfig, prepareOptions({}), params).resolve(testLogger);
                expect(options).toStrictEqual({
                    fill: 'rgba(255, 0, 0, 0.25)',
                    axes: expect.any(Object),
                });
            });

            it('should resolve public `ref` operation with `mix` and `onto` color', () => {
                const themeConfig = { line: { fill: { ref: 'accentColor', mix: 0.25, onto: 'backgroundColor' } } };
                const params = { accentColor: '#ff0000', backgroundColor: '#00ff00' };
                const options = new OptionsGraph(themeConfig, prepareOptions({}), params).resolve(testLogger);
                expect(options).toStrictEqual({
                    fill: '#40bf00',
                    axes: expect.any(Object),
                });
            });

            it('should resolve public `ref` operation with `mix` and a literal `ontoColor`', () => {
                const themeConfig = { line: { fill: { ref: 'accentColor', mix: 0.25, ontoColor: '#00ff00' } } };
                const params = { accentColor: '#ff0000' };
                const options = new OptionsGraph(themeConfig, prepareOptions({}), params).resolve(testLogger);
                expect(options).toStrictEqual({
                    fill: '#40bf00',
                    axes: expect.any(Object),
                });
            });

            it('should resolve public `ref` operation with `mix` and a `var()` `ontoColor`', () => {
                const themeConfig = { line: { fill: { ref: 'accentColor', mix: 0.25, ontoColor: 'var(--brand)' } } };
                const params = { accentColor: '#ff0000' };
                const cssVariables = { 'var(--brand)': '#00ff00' };
                const options = new OptionsGraph(
                    themeConfig,
                    prepareOptions({}),
                    params,
                    {},
                    {},
                    undefined,
                    new Map(),
                    cssVariables
                ).resolve(testLogger);
                expect(options).toStrictEqual({
                    fill: '#40bf00',
                    axes: expect.any(Object),
                });
            });

            it('should resolve public `ref` operation with `mix` and an oklch() `ontoColor`', () => {
                const themeConfig = {
                    line: { fill: { ref: 'accentColor', mix: 0.25, ontoColor: 'oklch(0.7 0.15 200)' } },
                };
                const params = { accentColor: '#ff0000' };
                const options = new OptionsGraph(themeConfig, prepareOptions({}), params).resolve(testLogger);
                expect(options).toStrictEqual({
                    fill: '#408b92',
                    axes: expect.any(Object),
                });
            });

            it('should resolve public `ref` operation with `mix` on an oklch() param', () => {
                const themeConfig = { line: { fill: { ref: 'accentColor', mix: 0.25 } } };
                const params = { accentColor: 'oklch(0.7 0.15 200)' };
                const options = new OptionsGraph(themeConfig, prepareOptions({}), params).resolve(testLogger);
                expect(options).toStrictEqual({
                    fill: 'rgba(0, 185, 195, 0.25)',
                    axes: expect.any(Object),
                });
            });

            it('should warn and use `onto` when both `onto` and `ontoColor` are set', () => {
                const themeConfig = {
                    line: { fill: { ref: 'accentColor', mix: 0.25, onto: 'backgroundColor', ontoColor: '#0000ff' } },
                };
                const params = { accentColor: '#ff0000', backgroundColor: '#00ff00' };
                const options = new OptionsGraph(themeConfig, prepareOptions({}), params).resolve(testLogger);
                expect(options).toStrictEqual({
                    fill: '#40bf00',
                    axes: expect.any(Object),
                });
                expectWarningsCalls().toMatchInlineSnapshot(`
                  [
                    [
                      "AG Charts - \`onto\` and \`ontoColor\` are mutually exclusive, ignoring \`ontoColor\`.",
                    ],
                  ]
                `);
            });

            it('should resolve public `ref` operation on params', () => {
                const themeConfig = { line: { fill: { $ref: 'accentColor' } } };
                const params = {
                    accentColor: { ref: 'foregroundColor', mix: 0.25, onto: 'backgroundColor' },
                    foregroundColor: '#ff0000',
                    backgroundColor: '#00ff00',
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({}), params).resolve(testLogger);
                expect(options).toStrictEqual({
                    fill: '#40bf00',
                    axes: expect.any(Object),
                });
            });

            it('should resolve public `ref` operation with priority over default operations', () => {
                const themeConfig = { line: { fill: { $ref: 'accentColor' } } };
                const params = {
                    accentColor: { ref: 'foregroundColor', $foregroundBackgroundMix: 0.25 },
                    foregroundColor: '#ff0000',
                    backgroundColor: '#00ff00',
                };
                const options = new OptionsGraph(themeConfig, prepareOptions({}), params).resolve(testLogger);
                expect(options).toStrictEqual({
                    fill: '#ff0000',
                    axes: expect.any(Object),
                });
            });

            it('should warn on infinite loops', () => {
                const params = {
                    accentColor: { ref: 'gridLineColor' },
                    gridLineColor: { ref: 'foregroundColor' },
                    foregroundColor: { ref: 'accentColor' },
                };
                new OptionsGraph({}, prepareOptions({}), params).resolve(testLogger);
                expectWarningsCalls().toMatchInlineSnapshot(`
                  [
                    [
                      "AG Charts - Infinite loop cycle found in theme params [accentColor -> gridLineColor -> foregroundColor], ignoring.",
                    ],
                  ]
                `);
            });

            it('should warn on infinite loops through other operations', () => {
                const params = {
                    backgroundColor: 'white',
                    textColor: { ref: 'subtleTextColor' },
                    subtleTextColor: { $mix: [{ $ref: 'textColor' }, { $ref: 'backgroundColor' }, 0.38] },
                };
                new OptionsGraph({}, prepareOptions({}), params).resolve(testLogger);
                expectWarningsCalls().toMatchInlineSnapshot(`
                  [
                    [
                      "AG Charts - Infinite loop cycle found in theme params [textColor -> subtleTextColor], ignoring.",
                    ],
                  ]
                `);
            });
        });
    });
});
