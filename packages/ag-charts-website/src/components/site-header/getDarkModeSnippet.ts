export const DARK_MODE_START = '/** DARK MODE START **/';
export const DARK_MODE_END = '/** DARK MODE END **/';

const DARK_MODE_SNIPPETS = {
    homepageHero: () => `
        heroChartOptions.theme = localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default';
        agCharts.AgCharts.update(chart, heroChartOptions);
        window.addEventListener('message', (event) => {
            const data = event.detail;
            if (data?.type === 'color-scheme-change') {
                heroChartOptions.theme = data.darkmode ? 'ag-default-dark' : 'ag-default';
                agCharts.AgCharts.update(chart, heroChartOptions);
            }
        });`,
    vanilla: () => `
        options.theme = localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default';
        agCharts.AgCharts.update(chart, options);
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'color-scheme-change') {
                options.theme = event.data.darkmode ? 'ag-default-dark' : 'ag-default';
                agCharts.AgCharts.update(chart, options);
            }
        });`,
    typescript: ({ chartAPI }: { chartAPI: string }) => `
        options.theme = localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default';
        ${chartAPI}.update(chart, options);
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'color-scheme-change') {
                options.theme = event.data.darkmode ? 'ag-default-dark' : 'ag-default';
                ${chartAPI}.update(chart, options);
            }
        });`,
    angular: () => `
        this.options = {
            ...this.options,
            theme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
        };
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                this.options = {
                    ...this.options,
                    theme: event.data.darkmode ? 'ag-default-dark' : 'ag-default'
                };
            }
        });`,
    react: () => `
        this.setState((prevState) => ({
            options: {
                ...prevState.options,
                theme:
                    localStorage['documentation:darkmode'] === 'true'
                        ? 'ag-default-dark'
                        : 'ag-default'
            }
        }));
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                this.setState((prevState) => ({
                    options: {
                        ...prevState.options,
                        theme: event.data.darkmode ? 'ag-default-dark' : 'ag-default'
                    }
                }));
            }
        });`,
    reactFunctional: () => `
        options.theme = localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default';
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                setOptions((currentOptions) => ({
                    ...currentOptions,
                    theme: event.data.darkmode ? 'ag-default-dark' : 'ag-default',
                }));
            }
        });`,
    reactFunctionalTs: () => `
        options.theme = localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default';
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'color-scheme-change') {
                setOptions((currentOptions) => ({
                    ...currentOptions,
                    theme: event.data.darkmode ? 'ag-default-dark' : 'ag-default',
                }));
            }
        });`,
    vue: () => `
        this.options = {
            ...this.options,
            theme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
        };
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                this.options = {
                    ...this.options,
                    theme: event.data.darkmode ? 'ag-default-dark' : 'ag-default'
                };
            }
        });`,
    vue3: () => `
        this.options = {
            ...this.options,
            theme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
        };
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                this.options = {
                    ...this.options,
                    theme: event.data.darkmode ? 'ag-default-dark' : 'ag-default'
                };
            }
        });`,
};

export type SnippetType = keyof typeof DARK_MODE_SNIPPETS;

export function getDarkModeSnippet(snippetType: SnippetType, options?: any) {
    return `${DARK_MODE_START}
    ${DARK_MODE_SNIPPETS[snippetType](options)}
    ${DARK_MODE_END}
    `;
}
