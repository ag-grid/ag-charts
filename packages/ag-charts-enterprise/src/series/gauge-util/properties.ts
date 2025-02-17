import { _ModuleSupport } from 'ag-charts-community';

const { MARKER_SHAPE, UNION, OR } = _ModuleSupport;

export const FILL_MODE = UNION(['continuous', 'discrete'], 'a fill mode');
export const TARGET_MARKER_SHAPE = OR(MARKER_SHAPE, UNION(['line'], 'a marker shape'));
export const CORNER_MODE = UNION(['container', 'item'], 'a corner mode');
