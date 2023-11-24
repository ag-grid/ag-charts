export const DARK_MODE_START = '/** DARK MODE START **/';
export const DARK_MODE_END = '/** DARK MODE END **/';

const DARK_MODE_SNIPPETS = {
    homepageHero: () => `
        options.theme = localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default';
        agCharts.AgCharts.update(chart, options);
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        `,
    homepageHeroListener: () => `
        window.addEventListener('message', (event) => {
            const data = event.detail;
            if (data?.type === 'color-scheme-change') {
                options.theme = data.darkmode ? 'ag-default-dark' : 'ag-default';
                agCharts.AgCharts.update(chart, options);
            }
        });`,
    vanilla: () => `
        options.theme = {
            ...options.theme,
            baseTheme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
        }
        agCharts.AgCharts.update(chart, options);
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'color-scheme-change') {
              options.theme.baseTheme = event.data.darkmode ? 'ag-default-dark' : 'ag-default';
              agCharts.AgCharts.update(chart, options);
              document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
            }
        });`,
    typescript: ({ chartAPI }: { chartAPI: string }) => `
        options.theme = {
            ...options.theme,
            baseTheme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
        }
        ${chartAPI}.update(chart, options);
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'color-scheme-change') {
              options.theme.baseTheme = event.data.darkmode ? 'ag-default-dark' : 'ag-default';
              ${chartAPI}.update(chart, options);
              document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
            }
        });`,
    angular: () => `
        this.options = {
            ...this.options,
            theme: {
                ...this.options.theme,
                baseTheme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
            }
        };
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                this.options = {
                    ...this.options,
                    theme: {
                        ...this.options,
                        baseTheme: event.data.darkmode ? 'ag-default-dark' : 'ag-default'
                    }
                };
                document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
            }
        });`,
    reactFunctional: () => `
        options.theme = {
            ...options.theme,
            baseTheme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
        }
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                setOptions((currentOptions) => ({
                    ...currentOptions,
                    theme: {
                        ...currentOptions.theme,
                        baseTheme: event.data.darkmode ? 'ag-default-dark' : 'ag-default'
                    }
                }));
                document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
            }
        });`,
    reactFunctionalTs: () => `
        options.theme = {
            ...options.theme,
            baseTheme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
        }
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'color-scheme-change') {
                setOptions((currentOptions) => ({
                    ...currentOptions,
                    theme: {
                        ...currentOptions.theme,
                        baseTheme: event.data.darkmode ? 'ag-default-dark' : 'ag-default'
                    }
                }));
                document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
            }
        });`,
    vue: () => `
        this.options = {
            ...this.options,
            theme: {
                ...this.options.theme,
                baseTheme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
            }
        };
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                this.options = {
                    ...this.options,
                    theme: {
                        ...this.options.theme,
                        baseTheme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
                    }
                };
                document.querySelector('html').setAttribute('data-dark-mode', event.data.darkmode);
            }
        });`,
    vue3: () => `
        this.options = {
            ...this.options,
            theme: {
                ...this.options.theme,
                baseTheme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
            }
        };
        document.querySelector('html').setAttribute('data-dark-mode', localStorage['documentation:darkmode'] === 'true');
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'color-scheme-change') {
                this.options = {
                    ...this.options,
                    theme: {
                        ...this.options.theme,
                        baseTheme: localStorage['documentation:darkmode'] === 'true' ? 'ag-default-dark' : 'ag-default'
                    }
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
