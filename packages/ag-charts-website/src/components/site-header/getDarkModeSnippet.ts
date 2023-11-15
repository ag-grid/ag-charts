export const DARK_MODE_START = '/** DARK MODE START **/';
export const DARK_MODE_END = '/** DARK MODE END **/';

const DARK_MODE_SNIPPETS = {
    homepageHero: () => `
        heroChartOptions.theme = localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default';
<<<<<<< HEAD
        agCharts.AgCharts.update(chart, heroChartOptions);
=======
        agCharts.AgChart.update(chart, heroChartOptions);
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
>>>>>>> 4182b5111 (Add light & darkmode styles for examples UI buttons)
        window.addEventListener('message', (event) => {
            const data = event.detail;
            if (data?.type === 'color-scheme-change') {
                heroChartOptions.theme = data.darkmode ? 'ag-default-dark' : 'ag-default';
                agCharts.AgCharts.update(chart, heroChartOptions);
            }
        });`,
    vanilla: () => `
        options.theme = localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default';
<<<<<<< HEAD
        agCharts.AgCharts.update(chart, options);
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'color-scheme-change') {
                options.theme = event.data.darkmode ? 'ag-default-dark' : 'ag-default';
                agCharts.AgCharts.update(chart, options);
=======
        agCharts.AgChart.update(chart, options);
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'color-scheme-change') {
              options.theme = event.data.darkmode ? 'ag-default-dark' : 'ag-default';
              agCharts.AgChart.update(chart, options);
              document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
>>>>>>> 4182b5111 (Add light & darkmode styles for examples UI buttons)
            }
        });`,
    typescript: ({ chartAPI }: { chartAPI: string }) => `
        options.theme = localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default';
        ${chartAPI}.update(chart, options);
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'color-scheme-change') {
              options.theme = event.data.darkmode ? 'ag-default-dark' : 'ag-default';
              ${chartAPI}.update(chart, options);
              document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
            }
        });`,
    angular: () => `
        this.options = {
            ...this.options,
            theme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
        };
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                this.options = {
                    ...this.options,
                    theme: event.data.darkmode ? 'ag-default-dark' : 'ag-default'
                    
                };
                document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
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
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                this.setState((prevState) => ({
                    options: {
                        ...prevState.options,
                        theme: event.data.darkmode ? 'ag-default-dark' : 'ag-default'
                    }
                }));
                document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
            }
        });`,
    reactFunctional: () => `
        options.theme = localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default';
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                setOptions((currentOptions) => ({
                    ...currentOptions,
                    theme: event.data.darkmode ? 'ag-default-dark' : 'ag-default',
                }));
                document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
            }
        });`,
    reactFunctionalTs: () => `
        options.theme = localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default';
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'color-scheme-change') {
                setOptions((currentOptions) => ({
                    ...currentOptions,
                    theme: event.data.darkmode ? 'ag-default-dark' : 'ag-default',
                }));
                document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
            }
        });`,
    vue: () => `
        this.options = {
            ...this.options,
            theme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
        };
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                this.options = {
                    ...this.options,
                    theme: event.data.darkmode ? 'ag-default-dark' : 'ag-default'
                };
                document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
            }
        });`,
    vue3: () => `
        this.options = {
            ...this.options,
            theme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
        };
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                this.options = {
                    ...this.options,
                    theme: event.data.darkmode ? 'ag-default-dark' : 'ag-default'
                };
                document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
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
