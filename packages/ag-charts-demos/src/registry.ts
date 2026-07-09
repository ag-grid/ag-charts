import { type ComponentType } from 'react';

export interface DemoAppEntry {
    id: string;
    title: string;
    description: string;
    load: () => Promise<{ default: ComponentType }>;
}

export const DEMO_APPS: DemoAppEntry[] = [
    {
        id: 'starter',
        title: 'Starter',
        description: 'Minimal AG Charts React app in a Material UI shell, used to exercise the demo-app pipeline.',
        load: () => import('./demos/starter'),
    },
];
