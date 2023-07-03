import React from 'react';
import path from 'node:path';

export const Scripts = ({ baseUrl, files = [] }) => {
    if (!baseUrl) {
        throw new Error('No baseUrl');
    }

    return files.map((file) => {
        const srcFile = path.join(baseUrl, file);
        return <script key={file} src={srcFile} />;
    });
};
