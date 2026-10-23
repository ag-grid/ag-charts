import type { PluginModuleDefinition } from 'ag-charts-core';

import type { ChartRegistry } from '../../module/moduleContext';
import { communityModule } from '../../module/moduleIdentity';
import { VERSION } from '../../version';
import { CrossLinesDOMProxy } from './crossLinesDOMProxy';

type CrossLinesDOMProxyRegistry = ChartRegistry & { readonly crossLinesDOMProxy: CrossLinesDOMProxy };

/** Chart-wide keyboard proxies for the cross lines of every axis; the cross-lines modules depend on it. */
export const CrossLinesDOMProxyModule: PluginModuleDefinition<never, CrossLinesDOMProxyRegistry> =
    /* #__PURE__ */ communityModule({
        type: 'plugin',
        name: 'cross-lines-dom-proxy',
        chartTypes: ['cartesian', 'polar'],
        version: VERSION,
        register: (ctx) => {
            if (ctx.has('crossLinesDOMProxy')) return;
            // Eager, so its list precedes the axis and legend proxies in the tab order.
            ctx.constant('crossLinesDOMProxy', new CrossLinesDOMProxy(ctx));
        },
        create: (ctx) => ctx.crossLinesDOMProxy,
    });
