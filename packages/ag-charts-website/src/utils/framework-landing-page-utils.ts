/**
 * Utility functions for framework landing pages
 * Handles framework logo integration in headings
 */

// Map frameworks to their logo and display name
// Only used for framework landing pages: react-charts, javascript-charts, vue-charts, angular-charts
export const frameworkLogoMap: Record<string, { logo: string; name: string }> = {
    react: { logo: 'react.svg', name: 'React' },
    angular: { logo: 'angular.svg', name: 'Angular' },
    vue: { logo: 'vue.svg', name: 'Vue' },
    javascript: { logo: 'javascript.svg', name: 'JavaScript' },
};

/**
 * Normalize framework key from JSON content to frameworkLogoMap key
 */
export function normalizeFrameworkKey(frameworkKey: string | undefined): string {
    if (!frameworkKey) return '';

    // Check if the key exists directly in the map
    if (frameworkLogoMap[frameworkKey]) {
        return frameworkKey;
    }

    // Map framework variants to base framework keys
    const variantMapping: Record<string, string> = {
        vue3: 'vue',
        reactfunctionalt: 'react',
        reactFunctionalTs: 'react',
        typescript: 'javascript',
        vanilla: 'javascript',
    };

    const normalized = frameworkKey.toLowerCase();
    if (variantMapping[frameworkKey] || variantMapping[normalized]) {
        return variantMapping[frameworkKey] || variantMapping[normalized] || '';
    }

    // Check lowercase version as fallback
    if (frameworkLogoMap[normalized]) {
        return normalized;
    }

    return frameworkKey;
}

/**
 * Generate heading HTML with framework logo
 * Replaces framework name in heading template with logo image + text
 */
export function getHeadingWithLogo(
    frameworkKey: string,
    headingTemplate: string,
    urlWithBaseUrl: (url: string) => string
): string {
    const normalizedKey = normalizeFrameworkKey(frameworkKey);
    const frameworkInfo = frameworkLogoMap[normalizedKey] || frameworkLogoMap['react'];
    const logoUrl = urlWithBaseUrl(`/images/fw-logos/${frameworkInfo.logo}`);
    const frameworkName = frameworkInfo.name;

    // Replace framework name with logo + text, adding <br> before it
    const logoHtml = `<span class="frameworkLogoGroup"><img src="${logoUrl}" alt="${frameworkName}" style="display: inline-block; vertical-align: middle; height: 56px; width: auto; margin: 0 0.2em;"/> ${frameworkName}</span>`;

    // Add <br> before the framework name to put logo on new line
    const frameworkNameRegex = new RegExp(`\\s+${frameworkName}`, 'i');
    const heading = headingTemplate.replace(frameworkNameRegex, `<br>${logoHtml}`);

    return heading;
}
