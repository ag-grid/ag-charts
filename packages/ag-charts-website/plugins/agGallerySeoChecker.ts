import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';

import { gallerySeoChecker } from '../src/components/gallery/utils/gallerySeoChecker';

type Options = {
    skip: boolean;
};

export default function createPlugin(options: Options): AstroIntegration {
    return {
        name: 'ag-gallery-seo-checker',
        hooks: {
            'astro:build:done': ({ dir, logger }) => {
                if (options.skip) {
                    logger.info('Gallery SEO check skipped');
                    return;
                }

                gallerySeoChecker({ buildDir: fileURLToPath(dir), log: (message) => logger.info(message) });
            },
        },
    };
}
