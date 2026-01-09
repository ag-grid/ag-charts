// ============================================================================
// Section Content Types
// ============================================================================

export interface HeroCta {
    text: string;
    url?: string;
    /** If true, renders a trial button component instead of a regular link */
    useTrialButton?: boolean;
}

export interface HeroGalleryExample {
    /** Display title shown in the gallery */
    title: string;
    /** Gallery example name or docs example reference */
    exampleName: string;
    /** Optional: docs page name if this is a docs example (not gallery) */
    pageName?: string;
    /** Thumbnail image URL for navigation */
    thumbnail?: string;
}

export interface HeroSection {
    type: 'hero';
    variant?: 'default' | 'enterprise';
    tag: string;
    heading: string;
    /**
     * HTML heading with formatting. If provided, takes precedence over heading.
     * Use for framework pages that need framework logos in headings.
     */
    headingHtml?: string;
    /** Plain text subheading */
    subHeading: string;
    /**
     * HTML subheading with formatting. If provided, takes precedence over subHeading.
     * Use for framework pages that need: "Add <b>high-performance</b>..." template
     */
    subHeadingHtml?: string;
    showVersionBadge?: boolean;
    /** Whether to show customer logos in the hero section (default: true) */
    showCustomerLogos?: boolean;
    /** Primary CTA button (e.g., "Get Started" or "Start Free Trial") */
    primaryCta?: HeroCta;
    /** Secondary CTA link below the demo (e.g., "View All Demos") */
    secondaryCta?: HeroCta;
    /** Demo grid configuration (AG Grid specific) */
    demo?: {
        enableRowGroup?: boolean;
        gridHeight?: number;
    };
    /** Gallery examples for sliding gallery (AG Charts specific) */
    galleryExamples?: HeroGalleryExample[];
    /** Height of the hero demo */
    demoHeight?: number;
}

export interface FeatureItem {
    id: string;
    title: string;
    isEnterprise?: boolean;
    example: {
        pageName: string;
        exampleName: string;
    };
    features: Array<{
        heading: string;
        detail: string;
        link?: string;
    }>;
    docsLink: string;
}

export interface FeaturesSection {
    type: 'features';
    tag: string;
    heading: string;
    subHeading: string;
    items: FeatureItem[];
}

export interface ShowcaseSection {
    type: 'showcase';
    tag: string;
    heading: string;
    subHeading: string;
}

export interface CustomersSection {
    type: 'customers';
    tag: string;
    headingHtml: string;
    subHeadingHtml: string;
    displayLogos?: boolean;
}

export interface ExampleItem {
    img: string;
    imgAlt: string;
    title: string;
    content: string;
    docs: string;
    demo: string;
}

export interface ExamplesSection {
    type: 'examples';
    tag: string;
    heading: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
    items: ExampleItem[];
}

export interface FAQItem {
    question: string;
    answer: string;
}

export interface FAQSection {
    type: 'faq';
    tag: string;
    heading: string;
    subHeading: string;
    items: FAQItem[];
}

export interface ContactSection {
    type: 'contact';
    variant?: 'default' | 'sales';
    tag: string;
    heading: string;
    subHeading: string;
    features: string[];
}

export interface IntegratedChartsSection {
    type: 'integrated-charts';
    tag: string;
    heading?: string;
    headingHtml?: string;
    subHeading?: string;
    subHeadingHtml?: string;
    showBackgroundGradient?: boolean;
}

export interface ThemeBuilderSection {
    type: 'theme-builder';
    tag: string;
    heading: string;
    subHeading: string;
}

export interface ComparisonSection {
    type: 'comparison';
    tag: string;
    heading: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
}

export interface PricingCard {
    title: string;
    price: string;
    priceNote: string;
    features: string[];
    ctaText: string;
    ctaUrl: string;
    ctaId?: string;
    isPrimary?: boolean;
    showTrialButton?: boolean;
}

export interface PricingSection {
    type: 'pricing';
    tag: string;
    heading: string;
    subHeading: string;
    showBackgroundGradient?: boolean;
    cards: PricingCard[];
}

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

// Union of all section types
export type LandingPageSectionType =
    | HeroSection
    | FeaturesSection
    | ShowcaseSection
    | CustomersSection
    | ExamplesSection
    | FAQSection
    | ContactSection
    | IntegratedChartsSection
    | ThemeBuilderSection
    | ComparisonSection
    | PricingSection
    | GalleryShowcaseSection
    | ChartTypesGridSection
    | InteractiveDemoSection
    | ChartExplorerSection
    | FinancialChartsSection
    | MapChartsSection
    | WhatsNewSection
    | PerformanceDemoSection
    | CodeExampleSection
    | FeatureGridSection
    | ChartTypesShowcaseSection;

// ============================================================================
// Landing Page Content
// ============================================================================

export interface LandingPageContent {
    meta: {
        title: string;
        description: string;
    };
    /** Product name for display (e.g., 'AG Grid', 'AG Charts') */
    productName?: string;
    /** Framework identifier for examples (e.g., 'reactFunctionalTs', 'angular', 'vue3') */
    framework?: string;
    packageName?: string;
    docsPath: string;
    analyticsPrefix: string;
    sections: LandingPageSectionType[];
}

// ============================================================================
// Helper type to extract section by type
// ============================================================================

export type ExtractSection<T extends LandingPageSectionType['type']> = Extract<LandingPageSectionType, { type: T }>;
