import express from 'express';

import { AllEnterpriseModule, LicenseManager, ModuleRegistry } from 'ag-charts-enterprise';
import { AgChartsServerSide } from 'ag-charts-server-side';

LicenseManager.setLicenseKey('your-licence-key');
ModuleRegistry.registerModules([AllEnterpriseModule]);

function getBaseUrl(port: number): string {
    if (process.env.CODESPACES === 'true') {
        const name = process.env.CODESPACE_NAME;
        const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
        return `https://${name}-${port}.${domain}`;
    }
    return `http://localhost:${port}`;
}

const app = express();

app.get('/chart.png', async (req, res) => {
    const buffer = await AgChartsServerSide.render({
        options: {
            data: [
                { category: 'Q1', value: 10 },
                { category: 'Q2', value: 25 },
                { category: 'Q3', value: 15 },
                { category: 'Q4', value: 30 },
            ],
            series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
        },
        width: 800,
        height: 600,
    });

    console.log('Serving rendered chart to client');

    res.set('Content-Type', 'image/png');
    res.send(buffer);
});

app.listen(3000, () => {
    console.log(`Chart server running at ${getBaseUrl(3000)}/chart.png`);
});
