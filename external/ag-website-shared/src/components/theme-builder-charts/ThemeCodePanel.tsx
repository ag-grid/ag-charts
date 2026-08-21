import Code from '@ag-website-shared/components/code/Code';
import styled from '@emotion/styled';

import { type ChartsThemeSelection, renderChartsThemeCode } from './chartsThemeOutput';

/**
 * The exported snippet, highlighted by the site's shared Code component - the
 * same one the grid and Studio export dialog uses, so the theme code reads like
 * every other snippet on the site and inherits its copy button.
 *
 * Grid and Studio share a full import/export dialog, but it is built around
 * `themeQuartz.withParams(...)` - both the generated chain and the parser that
 * reads one back in. An AG Charts theme is a plain options object, so for now
 * this shows the generated object. Round-tripping a pasted theme needs a
 * charts-shaped parser behind the shared dialog's seam.
 */
export const ThemeCodePanel = ({ selection }: { selection: ChartsThemeSelection }) => (
    <Panel>
        <Header>Theme code</Header>
        <Scroller>
            <Code code={renderChartsThemeCode(selection)} language="ts" copyToClipboard />
        </Scroller>
    </Panel>
);

const Panel = styled('div')`
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-top: 1px solid var(--color-border-primary);
`;

const Header = styled('div')`
    padding: 8px 12px 0;
    color: var(--color-fg-secondary);
    font-size: 12px;
`;

const Scroller = styled('div')`
    overflow: auto;
    max-height: 220px;
    padding: 0 12px 12px;

    // The snippet is the one part of the tool a user will select and copy by
    // hand, so it opts out of the builder-wide user-select: none.
    user-select: text;
`;
