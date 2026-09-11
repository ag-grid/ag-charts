import { ParamModel, useParamAtom } from '@ag-website-shared/theming/ParamModel';
import type { ThemeParam } from '@ag-website-shared/theming/utils';
import styled from '@emotion/styled';

import { INHERITED_SOURCES } from './params';

/**
 * A line under a field saying that its value is inherited, and from where.
 *
 * Most of AG Charts' params derive their default from another param, and the
 * panel shows them all with the value they currently resolve to - so without
 * this there is no telling a colour the theme will keep in step from one pinned
 * where it is. It says so in words rather than with a mark to interpret, and
 * goes once the param has a value of its own, because at that point the value
 * on show is the answer to the question.
 *
 * Params whose default stands alone - the foreground colour, the font - never
 * carry it. There is nothing for them to inherit from.
 */
export const InheritedValueNote = ({ param }: { param: string }) => {
    const [value] = useParamAtom(ParamModel.for(param as ThemeParam));
    const sources = INHERITED_SOURCES[param];

    if (value != null || !sources) {
        return null;
    }

    return <Note>Inherited from {andList(sources.map((source) => ParamModel.for(source as ThemeParam).label))}</Note>;
};

const andList = (items: string[]) =>
    items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

// Quieter than the label above it: this is the field's footnote, and a param
// panel is almost entirely inherited values, so at label weight the panel would
// read as a wall of this one sentence.
const Note = styled('span')`
    color: var(--color-fg-secondary);
    opacity: 0.6;
    font-size: 11px;
    line-height: 1.3;
`;
