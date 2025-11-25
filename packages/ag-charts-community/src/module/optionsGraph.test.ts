import { describe, expect, it } from '@jest/globals';

import { PlainObject } from 'ag-charts-core';

import { setupModules } from '../chart/factory/setupModules';
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
    beforeAll(() => {
        setupModules();
    });

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
        const options = new OptionsGraph(themeConfig, userOptions).resolve();
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
        const options = new OptionsGraph(themeConfig, userOptions).resolve();
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
        const options = new OptionsGraph(themeConfig, userOptions).resolve();
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

    it('should replace default strings with user objects', () => {
        const themeConfig = {
            line: {
                one: 'default-value',
            },
        };
        const userOptions = prepareOptions({
            one: { child: 'child-value' },
        });
        const options = new OptionsGraph(themeConfig, userOptions).resolve();
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
                            stroke: { $ref: 'axisColor' },
                        },
                    },
                    category: {
                        title: {
                            text: 'Category Axis',
                        },
                        line: {
                            stroke: { $ref: 'axisColor' },
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
            axisColor: 'grey',
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

        const options = new OptionsGraph(themeConfig, userOptions, params, palette).resolve();
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

    it.failing('fails to handle merging objects with operations that resolve to objects', () => {
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
        const options = new OptionsGraph(themeConfig, userOptions, {}, {}, overrides).resolve();
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

    describe('location operations', () => {
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
                const options = new OptionsGraph(themeConfig, prepareOptions({}), {}, palette).resolve();
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
                const options = new OptionsGraph(themeConfig, prepareOptions({}), {}, palette).resolve();
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
                const options = new OptionsGraph(themeConfig, userOptions).resolve();
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
                const options = new OptionsGraph(themeConfig, userOptions).resolve();
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
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
                }).resolve();
                expect(options).toStrictEqual({
                    one: 'value',
                    axes: expect.any(Object),
                });
            });

            it('should resolve `$ref` operation on second `$ref` operation', () => {
                const options = new OptionsGraph({ line: { one: { $ref: 'second' } } }, prepareOptions({}), {
                    first: 'value',
                    second: { $ref: 'first' },
                }).resolve();
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
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
            expect(options).toStrictEqual({
                one: true,
                two: false,
                three: false,
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
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
            const options = new OptionsGraph(themeConfig, userOptions).resolve();
            expect(options).toStrictEqual({
                one: 'yes',
                two: 'no',
                three: 'yes-yes',
                four: { five: 'yes-yes', six: 'six' },
                seven: { five: 'yes-yes' },
                axes: expect.any(Object),
            });
        });

        it('should resolve `$not` operations', () => {
            const themeConfig = {
                line: {
                    one: { $not: [true] },
                    two: { $not: [false] },
                    three: { $not: ['hello'] },
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
            expect(options).toStrictEqual({
                one: true,
                two: true,
                three: false,
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
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
            expect(options).toStrictEqual({
                one: 'case-a-value',
                two: 'case-a',
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
                const options = new OptionsGraph(themeConfig, userOptions).resolve();
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
                const options = new OptionsGraph(themeConfig, userOptions).resolve();
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
                const options = new OptionsGraph(themeConfig, userOptions).resolve();
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
                const options = new OptionsGraph(themeConfig, userOptions).resolve();
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
                const options = new OptionsGraph(themeConfig, userOptions).resolve();
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
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
                const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
                const options = new OptionsGraph(themeConfig, prepareOptions({}), {}, palette).resolve();
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

    describe('numeric operations', () => {
        it('should resolve `$mul` operations', () => {
            const themeConfig = {
                line: {
                    one: { $mul: [2, 4] },
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
            expect(options).toStrictEqual({
                one: 8,
                axes: expect.any(Object),
            });
        });

        it('should resolve `$round` operations', () => {
            const themeConfig = {
                line: {
                    one: { $round: [1.234] },
                    two: { $round: [1.987] },
                },
            };
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
            expect(options).toStrictEqual({
                one: 1,
                two: 2,
                axes: expect.any(Object),
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
            const options = new OptionsGraph(themeConfig, prepareOptions({})).resolve();
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
});
