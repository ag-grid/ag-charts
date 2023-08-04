import React from 'react';
import { pathJoin } from '@utils/pathJoin';

export const Styles = ({ baseUrl, files = [] }) =>
    files.map((file) => {
        const srcFile = pathJoin(baseUrl, file);
        return <link key={file} rel="stylesheet" href={srcFile} />;
    });
