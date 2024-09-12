import type { AstroIntegration } from 'astro';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Options = {
    include: boolean;
};

const HTACCESS_CONTENT = `### AUTOGENERATED DO NOT EDIT
ErrorDocument 404 /404.html

# add MIME types for serving example files
AddType text/javascript ts jsx

# CORS settings
Header add Access-Control-Allow-Origin "*"
Header add Access-Control-Allow-Methods: "GET,POST,OPTIONS,DELETE,PUT"

Options -Indexes
`;

export default function createPlugin(options: Options): AstroIntegration {
    return {
        name: 'ag-htaccess-gen',
        hooks: {
            'astro:build:done': async ({ dir, routes }) => {
                if (!options.include) {
                    // eslint-disable-next-line no-console
                    console.info('[agHtaccessGen] .htaccess generation disabled, skipping');
                    return;
                }

                const redirects = routes
                    .flatMap(({ route, redirect }) =>
                        route != null && redirect != null ? [`Redirect 301 ${route} ${redirect}`] : []
                    )
                    .join('\n');

                const content = HTACCESS_CONTENT + redirects;

                const destDir = fileURLToPath(dir);
                const filename = join(destDir, '.htaccess');
                writeFileSync(filename, content);

                // eslint-disable-next-line no-console
                console.info('[agHtaccessGen] .htaccess generated to: ', filename);
            },
        },
    };
}
