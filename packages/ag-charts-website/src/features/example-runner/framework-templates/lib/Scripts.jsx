import { pathJoin } from '@utils/pathJoin';
import React from 'react';

export const Scripts = ({ baseUrl, files = [] }) => {
    return files.map((file) => {
        const srcFile = pathJoin(baseUrl, file);
        return <script key={file} src={srcFile} />;
    });
};
