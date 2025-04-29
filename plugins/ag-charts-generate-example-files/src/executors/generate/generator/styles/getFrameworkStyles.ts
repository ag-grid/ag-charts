import type { InternalFramework } from '../types';

export function getFrameworkStyles(internalFramework: InternalFramework): string {
    switch (internalFramework) {
        case 'reactFunctional':
        case 'reactFunctionalTs':
            return `
#root {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 8px;
}

#root div:has(> .ag-charts-wrapper) {
    padding: 1rem;
    height: 100%;
    border-radius: 8px;
    background-color: var(--chart-bg);
    border: 1px solid var(--chart-border);
    overflow: hidden;
}
`;
        case 'angular':
            return `
my-app {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 8px;
}

ag-charts,
ag-financial-charts {
    display: block;
    padding: 1rem;
    height: 100%;
    border-radius: 8px;
    background-color: var(--chart-bg);
    border: 1px solid var(--chart-border);
    overflow: hidden;
}
`;
        case 'vue3':
            return `
#app {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 8px;
}

#app div:has(> .ag-charts-wrapper) {
    padding: 1rem;
    height: 100%;
    border-radius: 8px;
    background-color: var(--chart-bg);
    border: 1px solid var(--chart-border);
    overflow: hidden;
}
`;
        case 'typescript':
            return `
body {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 8px;
}

#myChart {
    padding: 1rem;
    height: 100%;
    border-radius: 8px;
    background-color: var(--chart-bg);
    border: 1px solid var(--chart-border);
    overflow: hidden;
}
`;
        case 'vanilla':
            return `
body {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 8px;
}

div:has(> .ag-charts-wrapper) {
    padding: 1rem;
    height: 100%;
    border-radius: 8px;
    background-color: var(--chart-bg);
    border: 1px solid var(--chart-border);
    overflow: hidden;
}
`;
        default:
            throw new Error(`Unsupported framework: ${internalFramework}`);
    }
}
