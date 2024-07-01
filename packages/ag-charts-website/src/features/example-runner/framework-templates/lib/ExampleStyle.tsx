import React from 'react';

const css = String.raw;

/**
 * These are the CSS styles shared by all examples.
 */
export const ExampleStyle = ({ rootSelector, extraStyles }: { rootSelector?: string; extraStyles?: string }) => {
    const styles = css`
        :root {
            position: absolute;
            top: 0;
            left: 0;
            padding: 0;
            overflow: hidden;
            font-family: -apple-system, 'system-ui', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans',
                'Liberation Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
                'Noto Color Emoji';

            --button-background-color: transparent;
            --button-text-color: #212529;
            --button-color-border-primary: #d0d5dd;
            --button-hover-background-color: rgba(0, 0, 0, 0.1);
        }

        :root[data-dark-mode='true'] {
            background: #192232;
            color: white;

            --button-text-color: #f8f9fa;
            --button-color-border-primary: rgba(255, 255, 255, 0.2);
            --button-hover-background-color: #2a343e;
        }

        :root,
        body${rootSelector ? `, ${rootSelector}` : ''} {
            height: 100%;
            width: 100%;
            margin: 0;
            box-sizing: border-box;
        }

        ${rootSelector ?? 'body'} {
            display: grid;
            grid-auto-rows: minmax(0, 1fr);
            grid-auto-columns: minmax(0, 1fr);
            padding: 1rem;
        }

        ${rootSelector ?? 'body'}:has(.toolbar) {
            grid: 'toolbar' auto 'canvas' 1fr / 1fr;
        }

        .toolbar,
        .toolbar__row {
            position: relative;
            display: flex;
            align-items: baseline;
            justify-content: center;
            flex-wrap: wrap;
            gap: 6px 8px;
        }

        .toolbar__row {
            flex: 0 0 100%;
        }

        .toolbar button {
            appearance: none;
            border: 1px solid var(--button-color-border-primary);
            border-radius: 6px;
            height: 36px;
            color: var(--button-text-color);
            background: var(--button-background-color);
            cursor: pointer;
            display: inline-block;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: 0.01em;
            padding: 0.375em 1em 0.5em;
            white-space: nowrap;
            transition: background-color 0.25s ease-in-out;
        }

        .toolbar button:hover {
            background: var(--button-hover-background-color);
        }

        ${extraStyles ? extraStyles : ''}
    `;

    return <style media="only screen" dangerouslySetInnerHTML={{ __html: styles }}></style>;
};
