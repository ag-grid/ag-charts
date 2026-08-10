import { type ComponentType } from 'react';

export interface DemoAppEntry {
    id: string;
    load: () => Promise<{ default: ComponentType }>;
}

export const DEMO_APPS: DemoAppEntry[] = [
    {
        id: 'starter',
        load: () => import('./demos/starter'),
    },
    {
        id: 'line',
        load: () => import('./demos/line'),
    },
    {
        id: 'pie',
        load: () => import('./demos/pie'),
    },
    {
        id: 'financial',
        load: () => import('./demos/financial'),
    },
    {
        id: 'web-analytics',
        load: () => import('./demos/web-analytics'),
    },
];
