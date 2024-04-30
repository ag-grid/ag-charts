import type { PlainObject } from '../../util/types';
import { type OptionsDefs, union } from '../util/validation';

export const themeOptionsDef: OptionsDefs<PlainObject> = {
    baseTheme: union(
        'ag-default',
        'ag-default-dark',
        'ag-material',
        'ag-material-dark',
        'ag-polychroma',
        'ag-polychroma-dark',
        'ag-sheets',
        'ag-sheets-dark',
        'ag-vivid',
        'ag-vivid-dark'
    ),

    variables: {},
    chartDefaults: {},
    axesDefaults: { number: { positionOverrides: { top: {}, right: {}, bottom: {}, left: {} } } },
    axisTypeDefaults: { positionOverrides: { top: {}, right: {}, bottom: {}, left: {} } },
    seriesDefaults: {},
    seriesTypeDefaults: {},
};

// Example:
// const themeOptions = {
//     baseTheme: 'ag-default-dark', // Extends the default dark theme
//     variables: {
//         // Overrides for theme variables
//         primaryColor: '#005f73',
//         secondaryColor: '#0a9396',
//     },
//     chartDefaults: {
//         // Overrides for specific chart options
//         title: { text: 'Annual Sales', fontSize: 18, color: '#e9d8a6' },
//     },
//     axesDefaults: {
//         // Default settings for all axes
//         label: { fontSize: 12, fontStyle: 'italic', color: '#94d2bd' },
//         lineColor: '#94d2bd',
//         positionOverrides: {
//             // Position-specific overrides for axes
//             top: { label: { color: '#ee9b00' } },
//             bottom: { label: { color: '#ca6702' } },
//             left: { lineColor: '#003049' },
//             right: { lineColor: '#003049' },
//         },
//     },
//     axisTypeDefaults: {
//         // Type-specific axis defaults
//         numeric: { tickInterval: 10, label: { format: '0.0a' } },
//         category: { tickInterval: 1, labelRotation: -45 },
//     },
//     seriesDefaults: {
//         // Default settings for all series
//         fillOpacity: 0.8,
//         strokeOpacity: 0.9,
//     },
//     seriesTypeDefaults: {
//         // Type-specific series defaults
//         bar: { barPadding: 0.1 },
//         line: { lineWidth: 2 },
//     },
// };
