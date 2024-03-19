import { ICON_MAP } from '@components/icon/Icon';
import { defineCollection, z } from 'astro:content';

import { FRAMEWORKS } from '../constants';

const docs = defineCollection({
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        enterprise: z.boolean().optional(),
        /**
         * Hide right hand side menu
         */
        hideSideMenu: z.boolean().optional(),
        /**
         * Hide left hand page menu
         */
        hidePageMenu: z.boolean().optional(),
    }),
});

const menuItemBase = {
    title: z.string(),
    /**
     * Path to website docs within `src/content/docs`
     */
    path: z.string().optional(),
    /**
     * External link url
     */
    url: z.string().url().optional(),
    icon: z.enum(Object.keys(ICON_MAP) as any).optional(),
    cssClass: z.string().optional(),
    frameworks: z.array(z.enum(FRAMEWORKS as any)).optional(),
    isEnterprise: z.boolean().optional(),
    feature: z.boolean().optional(),
};

const level3MenuItem = z.object({
    ...menuItemBase,
    items: z.array(z.object(menuItemBase)).optional(),
});

const level2MenuItem = z.object({
    ...menuItemBase,
    items: z.array(level3MenuItem).optional(),
});

const level1MenuItem = z.object({
    ...menuItemBase,
    items: z.array(level2MenuItem).optional(),
});

const menu = defineCollection({
    type: 'data',
    schema: z.object({
        header: z.object({
            items: z.array(level1MenuItem),
        }),
        api: z.object({
            items: z.array(level1MenuItem),
        }),
        main: z.object({
            items: z.array(level1MenuItem),
        }),
        maps: z.object({
            items: z.array(level1MenuItem),
        }),
        charts: z.object({
            items: z.array(level1MenuItem),
        }),
    }),
});

export const collections = {
    docs,
    menu,
};
