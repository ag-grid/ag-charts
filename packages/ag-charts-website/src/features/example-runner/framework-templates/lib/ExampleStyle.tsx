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

        button:not(#myGrid button, #myChart button, button[class*='ag-'], .ag-chart-context-menu button) {
            --background-color: transparent;
            --text-color: #212529;
            --border-color: rgba(187, 187, 187, 0.3);
            --hover-background-color: rgba(0,0,0, 0.1);

            appearance: none;
            border: 2px solid var(--border-color);
            border-radius: 6px;
            height: 36px;
            color: var(--text-color);
            background-color: var(--background-color);
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

        button:not(#myGrid button, #myChart button, button[class*='ag-'], .ag-chart-context-menu button):hover {
          background-color: var(--hover-background-color);
        }

        html[data-dark-mode=true] button:not(#myGrid button, #myChart button, button[class*='ag-'], .ag-chart-context-menu button) {

          --text-color: #f8f9fa;
          --border-color: rgba(255,255,255, 0.2);
          --hover-background-color: #2a343e;
        }
    `}
    </style>
);
