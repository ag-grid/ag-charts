import { type ReactNode } from 'react';

interface DemoPageProps {
    title: string;
    description: string;
    children: ReactNode;
}

// Minimal shared shell for the demo apps — plain React, no UI library. Keeps the
// focus on the chart while giving each demo a consistent, app-like frame.
export function DemoPage({ title, description, children }: DemoPageProps) {
    return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 24 }}>
                <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600 }}>{title}</h1>
                <p style={{ margin: '0 0 16px', color: '#666', fontSize: 14 }}>{description}</p>
                {children}
            </div>
        </div>
    );
}
