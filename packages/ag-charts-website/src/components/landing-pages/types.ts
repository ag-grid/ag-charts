// ============================================================================
// AG Charts Specific Section Types
// ============================================================================

export interface GalleryShowcaseSection {
    type: 'gallery-showcase';
    tag: string;
    heading: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
    /** List of gallery example names to display */
    examples: string[];
    /** Number of columns in the grid (default: 3) */
    columns?: 2 | 3 | 4;
}

export interface ChartTypesGridSection {
    type: 'chart-types';
    tag: string;
    heading: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
    /** Filter by enterprise/community, or show all (default: 'all') */
    filter?: 'all' | 'community' | 'enterprise';
}

export interface InteractiveDemoSection {
    type: 'interactive-demo';
    tag: string;
    heading: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
    /** Gallery example name to embed */
    exampleName: string;
    /** Height of the demo in pixels (default: 500) */
    height?: number;
}

export interface ChartExplorerExample {
    /** Display name shown in the sidebar */
    name: string;
    /** Gallery example name */
    exampleName: string;
}

export interface ChartExplorerSection {
    type: 'chart-explorer';
    tag: string;
    heading: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
    /** List of examples to show in the explorer */
    examples: ChartExplorerExample[];
    /** Height of the chart area in pixels (default: 500) */
    height?: number;
    /** CTA button configuration */
    cta?: {
        text: string;
        url: string;
    };
}

export interface FinancialChartsSection {
    type: 'financial-charts';
    tag: string;
    heading: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
    /** Height of the demo in pixels (default: 700) */
    height?: number;
    /** CTA button configuration */
    cta?: {
        text: string;
        url: string;
    };
}

export interface MapChartsCard {
    title: string;
    description: string;
    pageName: string;
    exampleName: string;
}

export interface MapChartsSection {
    type: 'map-charts';
    tag: string;
    heading: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
    /** Cards with map examples */
    cards: MapChartsCard[];
    /** Height of each card's demo in pixels (default: 360) */
    cardHeight?: number;
    /** CTA button configuration */
    cta?: {
        text: string;
        url: string;
    };
}

export interface WhatsNewSection {
    type: 'whats-new';
    tag: string;
    heading: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
    /** Number of versions to show (default: 3) */
    versionsToShow?: number;
    /** CTA button configuration */
    cta?: {
        text: string;
        url: string;
    };
}

export interface PerformanceDemoSection {
    type: 'performance-demo';
    tag: string;
    heading: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
    /** Docs page name containing the example */
    pageName: string;
    /** Example name within the page */
    exampleName: string;
    /** Height of the demo in pixels (default: 500) */
    height?: number;
    /** CTA button configuration */
    cta?: {
        text: string;
        url: string;
    };
}

export interface CodeExampleSection {
    type: 'code-example';
    tag: string;
    heading: string;
    /** HTML heading with highlighting support (e.g., "Simple, Intuitive <span>API</span>") */
    headingHtml?: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
    /** The code to display */
    code: string;
    /** Language for syntax highlighting (default: 'ts') */
    language?: 'js' | 'ts' | 'jsx' | 'json' | 'html' | 'css' | 'bash';
    /** Filename to display in the header */
    fileName?: string;
}

export interface FeatureGridItem {
    /** Icon name from the Icon component */
    icon: string;
    /** Feature title */
    title: string;
    /** Feature description */
    description: string;
    /** Link URL for the feature card */
    link: string;
}

export interface FeatureGridSection {
    type: 'feature-grid';
    tag: string;
    heading: string;
    /** HTML heading with highlighting support */
    headingHtml?: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
    /** Feature items to display in the grid */
    items: FeatureGridItem[];
}

export interface ChartTypesShowcaseItem {
    /** Display title */
    title: string;
    /** Short description */
    description: string;
    /** Example name to embed (optional if using icon) */
    exampleName?: string;
    /** Optional: docs page name if this is a docs example (not gallery) */
    pageName?: string;
    /** Optional: icon name to display instead of a chart */
    icon?: string;
}

export interface ChartTypesShowcaseSection {
    type: 'chart-types-showcase';
    tag: string;
    heading: string;
    /** HTML heading with highlighting support */
    headingHtml?: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
    /** Chart type items to display */
    items: ChartTypesShowcaseItem[];
    /** Height of each chart preview in pixels (default: 150) */
    chartHeight?: number;
    /** CTA button configuration */
    cta?: {
        text: string;
        url: string;
    };
}
