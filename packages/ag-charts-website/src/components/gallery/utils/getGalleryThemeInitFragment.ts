import { BASE_THEME_NAMES, THEME_STORAGE_KEY } from '@stores/themeStore';

/**
 * Sets the example document's `data-gallery-theme` to the theme picked in the gallery dropdown, which
 * the example's generated dark mode snippet then uses as its base theme.
 */
export const getGalleryThemeInitFragment = () => `<script nonce="123123">
(function () {
    let storedTheme;
    try {
        storedTheme = localStorage[${JSON.stringify(THEME_STORAGE_KEY)}];
    } catch (e) {
        /* Storage can be unavailable, in which case the example keeps its own theme. */
    }

    if (${JSON.stringify(BASE_THEME_NAMES)}.includes(storedTheme)) {
        document.documentElement.dataset.galleryTheme = storedTheme;
    }
})();
</script>`;
