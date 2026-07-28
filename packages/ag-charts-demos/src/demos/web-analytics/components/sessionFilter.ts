// Evaluate the sessions grid's column filters against the raw session list so the
// traffic chart can re-aggregate on the filtered set. AG Grid has no API for
// "rows passing all filters except one", so we replicate the predicates for the
// grid's filterable columns — excluding the When (timestamp) column, which is
// driven by the chart selection and must not narrow the chart's own domain.
import type { Session } from '../types';

// How each filterable column derives its value from a session. Keyed by the grid's
// filter-model key (column field, or colId for value-getter columns).
const STRING_VALUE: Record<string, (s: Session) => string> = {
    channel: (s) => s.channel,
    deviceCategory: (s) => s.deviceCategory,
    browser: (s) => s.browser,
    country: (s) => s.country,
    visitor: (s) => (s.isNewVisitor ? 'New' : 'Returning'),
    landingPage: (s) => s.landingPage,
    exitPage: (s) => s.exitPage,
    converted: (s) => (s.converted ? 'Yes' : 'No'),
};

const NUMBER_VALUE: Record<string, (s: Session) => number> = {
    pageviewsCount: (s) => s.pageviewsCount,
    sessionDuration: (s) => s.sessionDuration,
    conversionValue: (s) => s.conversionValue,
};

// Mirrors AG Grid's SetFilterModel: `values` is always an array (a null entry means
// the blank value); an inactive filter is absent from the model map entirely.
interface SetFilterModel {
    filterType: 'set';
    values: (string | null)[];
}

interface NumberCondition {
    filterType: 'number';
    type: string;
    filter?: number | null;
    filterTo?: number | null;
}

interface CombinedNumberModel {
    filterType: 'number';
    operator: 'AND' | 'OR';
    conditions: NumberCondition[];
}

type Predicate = (s: Session) => boolean;

const evalNumberCondition = (c: NumberCondition, value: number): boolean => {
    const { filter, filterTo } = c;
    switch (c.type) {
        case 'equals':
            return filter != null && value === filter;
        case 'notEqual':
            return filter != null && value !== filter;
        case 'lessThan':
            return filter != null && value < filter;
        case 'lessThanOrEqual':
            return filter != null && value <= filter;
        case 'greaterThan':
            return filter != null && value > filter;
        case 'greaterThanOrEqual':
            return filter != null && value >= filter;
        case 'inRange':
            return filter != null && filterTo != null && value >= filter && value <= filterTo;
        default:
            return true;
    }
};

const buildPredicate = (key: string, model: unknown): Predicate | null => {
    if (model == null || typeof model !== 'object') return null;
    const filterType = (model as { filterType?: string }).filterType;

    if (filterType === 'set') {
        const accessor = STRING_VALUE[key];
        if (!accessor) return null;
        const allowed = new Set((model as SetFilterModel).values);
        return (s) => allowed.has(accessor(s));
    }

    if (filterType === 'number') {
        const accessor = NUMBER_VALUE[key];
        if (!accessor) return null;
        const m = model as NumberCondition | CombinedNumberModel;
        if ('operator' in m) {
            const parts = m.conditions.map((c) => (s: Session) => evalNumberCondition(c, accessor(s)));
            return m.operator === 'AND' ? (s) => parts.every((p) => p(s)) : (s) => parts.some((p) => p(s));
        }
        return (s) => evalNumberCondition(m, accessor(s));
    }

    return null;
};

/**
 * Sessions passing every column filter except the When (timestamp) column.
 * `filterModel` is AG Grid's `api.getFilterModel()` map (colId → model).
 */
export const sessionsPassingNonWhenFilters = (sessions: Session[], filterModel: Record<string, unknown>): Session[] => {
    const predicates = Object.keys(filterModel)
        .filter((key) => key !== 'timestamp')
        .map((key) => buildPredicate(key, filterModel[key]))
        .filter((p): p is Predicate => p !== null);

    if (predicates.length === 0) return sessions;
    return sessions.filter((s) => predicates.every((p) => p(s)));
};
