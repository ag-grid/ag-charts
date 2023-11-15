import React from 'react';

/**
 * These are the CSS styles shared by all examples.
 */
export const ExampleStyle = ({ rootId }: { rootId?: string }) => (
    <style media="only screen">
        {`
        html, body${rootId ? `, #${rootId}` : ''} {
            height: 100%;
            width: 100%;
            margin: 0;
            box-sizing: border-box;
            -webkit-overflow-scrolling: touch;
        }

        html {
            position: absolute;
            top: 0;
            left: 0;
            padding: 0;
            overflow: auto;
        }

        body {
            padding: 1rem;
            overflow: auto;
        }

        html button:not(#myGrid button, #myChart button, button[class*='ag-'], .ag-chart-context-menu__menu) {
            appearance: none;
            background-color: var(--background-100);
            border: 2px solid rgba(187, 187, 187, 0.3);
            border-radius: 6px;
            height: 36px;
            color: #969696;
            cursor: pointer;
            display: inline-block;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: .01em;
            padding: 0.375em 1em 0.5em;
            white-space: nowrap;
            margin-right: 6px;
            margin-bottom: 8px;
            transition: background-color .25s ease-in-out;
        }
    `}
    </style>
);
