import Code from '@ag-website-shared/components/code/Code';
import { Checkmark, Copy } from '@carbon/icons-react';
import styled from '@emotion/styled';
import type { KeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { type ChartsThemeSelection, renderChartsThemeCode } from './chartsThemeOutput';

/**
 * The generated theme, shown on demand rather than permanently below the chart.
 *
 * Grid and Studio open this from the same place with an Import tab alongside,
 * built around parsing `themeQuartz.withParams(...)` back into params. An AG
 * Charts theme is a plain options object, so reading one back needs a
 * charts-shaped parser; until there is one this is export only, and the dialog
 * is a single panel rather than a tab strip presenting one tab.
 */
export const ThemeExportDialog = ({ selection }: { selection: ChartsThemeSelection }) => {
    const code = useMemo(() => renderChartsThemeCode(selection), [selection]);
    const downloadHref = `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`;

    const dialogRef = useRef<HTMLDivElement>(null);
    const codeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        dialogRef.current?.focus();
    }, []);

    // Ctrl/Cmd-A selects the snippet rather than the whole page, matching what
    // the keystroke would do if the dialog were a document of its own.
    const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'a' && codeRef.current) {
            event.preventDefault();
            window.getSelection()?.selectAllChildren(codeRef.current);
        }
    };

    const selectAllCode = () => {
        const domSelection = window.getSelection();
        if (codeRef.current && domSelection?.isCollapsed) {
            domSelection.selectAllChildren(codeRef.current);
        }
    };

    return (
        <DialogWrapper ref={dialogRef} tabIndex={0} onKeyDown={handleKeyDown}>
            <Paragraph>
                Pass this theme to the <code>theme</code> option of your chart to apply everything you have chosen here.
            </Paragraph>
            <CodeWrapper ref={codeRef} onClick={selectAllCode}>
                <Code code={code} language="js" />
            </CodeWrapper>
            <ButtonRow>
                <DownloadLink className="button-tertiary" href={downloadHref} download="ag-charts-theme-builder.js">
                    <LinkContent>{downloadIcon} Download</LinkContent>
                </DownloadLink>
                <CopyButton code={code} />
            </ButtonRow>
        </DialogWrapper>
    );
};

const CopyButton = ({ code }: { code: string }) => {
    const [copied, setCopied] = useState(false);

    // The two labels are stacked so the button does not resize as it swaps.
    return (
        <CopyLink
            className="button-tertiary"
            onClick={(event) => {
                event.preventDefault();
                if (!copied) {
                    setTimeout(() => setCopied(false), 4000);
                }
                setCopied(true);
                navigator.clipboard.writeText(code);
            }}
        >
            <LinkContent className={`copy-state-ready ${copied ? 'copy-state-hidden' : 'copy-state-visible'}`}>
                <Copy /> Copy
            </LinkContent>
            <LinkContent className={`copy-state-clicked ${copied ? 'copy-state-visible' : 'copy-state-hidden'}`}>
                <Checkmark /> Copied
            </LinkContent>
        </CopyLink>
    );
};

const DialogWrapper = styled('div')`
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: min(800px, var(--popup-available-width) - 40px);
    height: 600px;
    // Not the viewport: the builder's root clips its overflow, so the popup's
    // room is the tool's own height. The floating-ui size middleware measures
    // that and publishes it, minus this dialog's share of the popup padding.
    max-height: calc(var(--popup-available-height, 100vh) - 40px);
    outline: none;
`;

const Paragraph = styled('div')`
    code {
        font-family: var(--text-monospace-font-family);
    }
`;

const CodeWrapper = styled('div')`
    user-select: text;
    cursor: text;
    flex: 1;
    min-height: 0;
    overflow: auto;

    .code {
        max-height: 100%;
        overflow: auto;
        margin-top: 0;
    }
`;

const ButtonRow = styled('div')`
    display: flex;
    gap: 16px;
    justify-content: flex-end;
`;

const DownloadLink = styled('a')`
    & span {
        padding-right: 4px;
    }
`;

const CopyLink = styled('button')`
    position: relative;

    .copy-state-ready {
        position: absolute;
        inset: 0;
    }
    .copy-state-clicked {
        margin-right: 4px;
    }
    .copy-state-visible {
        opacity: 1;
    }
    .copy-state-hidden {
        opacity: 0;
    }
`;

const LinkContent = styled('span')`
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s;
`;

const downloadIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" fill="none">
        <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M2.5 10c0 1.885 0 2.829.586 3.414C3.671 14 4.615 14 6.5 14h4c1.885 0 2.829 0 3.414-.586.586-.585.586-1.529.586-3.414m-6-8v8.667m0 0 2.667-2.917M8.5 10.667 5.833 7.75"
        />
    </svg>
);
