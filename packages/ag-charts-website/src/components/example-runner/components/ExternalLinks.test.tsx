import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ExternalLinks } from './ExternalLinks';

// The real export buttons fetch the example page and open a sandbox on click; here only the props
// they are handed matter.
const { plunkrProps, codeSandboxProps } = vi.hoisted(() => ({ plunkrProps: vi.fn(), codeSandboxProps: vi.fn() }));

vi.mock('@ag-website-shared/components/plunkr/components/OpenInPlunkr', () => ({
    OpenInPlunkr: (props: unknown) => {
        plunkrProps(props);
        return null;
    },
}));
vi.mock('@ag-website-shared/components/codeSandbox/components/OpenInCodeSandbox', () => ({
    OpenInCodeSandbox: (props: unknown) => {
        codeSandboxProps(props);
        return null;
    },
}));

const renderLinks = () =>
    renderToStaticMarkup(
        <ExternalLinks
            title="Example"
            internalFramework="vanilla"
            exampleFiles={{ 'main.ts': '' }}
            packageJson={{}}
            initialSelectedFile="main.ts"
            plunkrHtmlUrl="/plunkr.html"
            codeSandboxHtmlUrl="/codesandbox.html"
        />
    );

describe('ExternalLinks', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        plunkrProps.mockClear();
        codeSandboxProps.mockClear();
    });

    // The export buttons only strip the dev server's Vite client and URLs from the example HTML
    // when told they are running in dev, so the flag has to reach them; it was once omitted.
    test.each([true, false])('hands the export buttons isDev=%s from the build environment', (dev) => {
        vi.stubEnv('DEV', dev);

        renderLinks();

        expect(plunkrProps).toHaveBeenCalledWith(expect.objectContaining({ isDev: dev }));
        expect(codeSandboxProps).toHaveBeenCalledWith(expect.objectContaining({ isDev: dev }));
    });
});
