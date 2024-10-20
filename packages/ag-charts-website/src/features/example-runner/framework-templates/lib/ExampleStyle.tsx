import React from 'react';

const css = String.raw;

/**
 * These are the CSS styles shared by all examples.
 */
export const ExampleStyle = ({
    layout = 'grid',
    rootSelector,
    extraStyles,
}: {
    layout?: 'grid' | 'toolbar' | 'none';
    rootSelector?: string;
    extraStyles?: string;
}) => {
    if (layout === 'none') {
        return extraStyles ? (
            <style media="only screen" dangerouslySetInnerHTML={{ __html: extraStyles }}></style>
        ) : null;
    }

    const toolbarStyles = css`
        ${rootSelector ?? 'body'} {
            display: grid;
            grid: 'toolbar' auto 'canvas' minmax(0, 1fr) / 1fr;
            padding: 1rem;
            gap: 9px;
        }

        .toolbar {
            --gap-vertical: 6px;
            --gap-horizontal: 8px;

            position: relative;
            display: flex;
            align-items: baseline;
            justify-content: center;
            flex-wrap: wrap;
            gap: calc(var(--gap-vertical) * 0.5) var(--gap-horizontal);
        }

        .toolbar hr {
            all: initial;
            flex: 0 0 100%;
        }

        .toolbar :is(button, select) {
            appearance: none;
            border: 1px solid var(--button-color-border-primary);
            border-radius: 6px;
            height: 36px;
            color: var(--button-text-color);
            background-color: var(--button-background-color);
            cursor: pointer;
            display: inline-block;
            font: inherit;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: 0.01em;
            padding: 0.375em 1em 0.5em;
            white-space: nowrap;
            transition: background-color 0.25s ease-in-out;
        }

        .toolbar :is(button, select):hover {
            background-color: var(--button-hover-background-color);
        }

        .toolbar button {
            text-align: center;
        }

        .toolbar select {
            padding-right: 2.4em;
            background: no-repeat center right 4px var(--select-chevron);
        }
    `;

    const gridStyles = css`
        ${rootSelector ?? 'body'} {
            display: grid;
            grid-auto-rows: minmax(0, 1fr);
            grid-auto-columns: minmax(0, 1fr);
            padding: 1rem;
        }
    `;

    const styles = css`
        :root {
            --button-background-color: transparent;
            --button-text-color: #212529;
            --button-color-border-primary: #d0d5dd;
            --button-hover-background-color: rgba(0, 0, 0, 0.1);
            --select-chevron: url('data:image/svg+xml;utf8,<svg fill="none" stroke="%23182230" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6 9L12 15L18 9"/></svg>');

            overflow: hidden;
            font-family: -apple-system, 'system-ui', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans',
                'Liberation Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
                'Noto Color Emoji';
        }

        :root[data-dark-mode='false'] {
            background: white;
        }

        :root[data-dark-mode='true'] {
            --button-text-color: #f8f9fa;
            --button-color-border-primary: rgba(255, 255, 255, 0.2);
            --button-hover-background-color: #2a343e;
            --select-chevron: url('data:image/svg+xml;utf8,<svg fill="none" stroke="%23667085" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6 9L12 15L18 9"/></svg>');

            background: #192232;
            color: white;
        }

        :root,
        body${rootSelector ? `, ${rootSelector}` : ''} {
            height: 100%;
            width: 100%;
            margin: 0;
            box-sizing: border-box;
        }

        ${layout === 'toolbar' ? toolbarStyles : gridStyles}

        ${extraStyles ?? ''}
    `;

    return <style media="only screen" dangerouslySetInnerHTML={{ __html: styles }}></style>;
};
