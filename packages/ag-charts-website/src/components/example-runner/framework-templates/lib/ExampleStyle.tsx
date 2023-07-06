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
    `}
    </style>
);
