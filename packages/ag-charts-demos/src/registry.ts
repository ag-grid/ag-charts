import { type ComponentType } from 'react';

export interface DemoAppEntry {
    id: string;
    load: () => Promise<{ default: ComponentType }>;
}

export const DEMO_APPS: DemoAppEntry[] = [
    {
        id: 'financial',
        load: () => import('./demos/financial'),
    },
    {
        id: 'web-analytics',
        load: () => import('./demos/web-analytics'),
    },
    {
        id: 'procurement',
        load: () => import('./demos/procurement'),
    },
];
