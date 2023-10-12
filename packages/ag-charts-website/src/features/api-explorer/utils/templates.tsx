/**
 * These templates are used to generate the code to render the charts in the Standalone Charts API Explorer.
 */
import type { GeneratedContents } from '@features/examples-generator/types';
import { getCacheBustingUrl, getChartEnterpriseScriptPath, getChartScriptPath } from '@utils/chartLibraryPaths';

import type { AgChartOptions } from 'ag-charts-community';

import { deepClone, formatJson } from '../utils/utils';

export const data = [
    {
        month: 'Jan',
        revenue: 155,
        profit: 33,
    },
    {
        month: 'Feb',
        revenue: 123,
        profit: 35.5,
    },
    {
        month: 'Mar',
        revenue: 172.5,
        profit: 41,
    },
    {
        month: 'Apr',
        revenue: 94,
        profit: 29,
    },
    {
        month: 'May',
        revenue: 112.5,
        profit: 37,
    },
    {
        month: 'Jun',
        revenue: 148,
        profit: 41.5,
    },
];

export const series = ['revenue', 'profit'].map((yKey) => ({
    type: 'bar',
    xKey: 'month',
    yKey,
    stacked: true,
}));

export const getJavascriptContent = ({ options }: { options: AgChartOptions }): GeneratedContents => {
    const formattedOptions = deepClone(options);
    formattedOptions.data = data;

    if (!formattedOptions.series) {
        formattedOptions.series = series;
    }

    const optionsJson = formatJson(formattedOptions);

    return {
        isEnterprise: true,
        scriptFiles: ['data.js', 'main.js'],
        styleFiles: [],
        sourceFileList: [],
        files: {
            'main.js': `const options = ${optionsJson};
            
options.container = document.querySelector('#myChart');
agCharts.AgChart.create(options);`,
            'index.html': '<div id="myChart" style="height: 100%"></div>',
        },
        entryFileName: 'main.js',
        boilerPlateFiles: {},
    };
};

export const getPlunkrHtml = ({
    contents,
    siteUrl,
    modifiedTimeMs,
}: {
    contents: GeneratedContents;
    siteUrl: string;
    modifiedTimeMs: number;
}) => {
    const { isEnterprise, files } = contents;
    const htmlFragment = files['index.html'];
    const chartScriptPath = getCacheBustingUrl(getChartScriptPath(siteUrl), modifiedTimeMs);
    const chartScriptEnterprisePath = getCacheBustingUrl(getChartEnterpriseScriptPath(siteUrl), modifiedTimeMs);

    return `<!DOCTYPE html><html lang="en">
	<head>
		<title>JavaScript example</title>
		<meta charSet="UTF-8"/>
		<meta name="viewport" content="width=device-width, initial-scale=1"/>
		<style media="only screen">
            html, body {
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
        </style>
	</head>
	<body>
		${htmlFragment}

		<script src="${chartScriptPath}"></script>
        ${isEnterprise ? `<script src="${chartScriptEnterprisePath}"></script>` : ''}
		<script src="main.js"></script>
	</body>
</html>`;
};
