"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    DARK_MODE_END: function() {
        return DARK_MODE_END;
    },
    DARK_MODE_START: function() {
        return DARK_MODE_START;
    },
    getDarkModeSnippet: function() {
        return getDarkModeSnippet;
    }
});
const DARK_MODE_START = '/** DARK MODE START **/';
const DARK_MODE_END = '/** DARK MODE END **/';
const getDarkModeSnippet = ({ chartAPI } = {})=>`${DARK_MODE_START}
${chartAPI == null ? `import { AgCharts as __chartAPI } from 'ag-charts-community';` : `const __chartAPI = ${chartAPI};`}

let darkmode =
    (localStorage['documentation:darkmode'] || String(matchMedia('(prefers-color-scheme: dark)').matches)) === 'true';

const isAgThemeOrUndefined = (theme) => {
    return theme == null || (typeof theme === 'string' && theme.startsWith('ag-'));
};

const getDarkmodeTheme = (theme = 'ag-default') => {
    const baseTheme = theme.replace(/-dark$/, '');
    return darkmode ? baseTheme + '-dark' : baseTheme;
};

const defaultUpdate = __chartAPI.update;
__chartAPI.update = function update(chart, options) {
    const nextOptions = { ...options };
    const theme = options.theme;
    if (isAgThemeOrUndefined(theme)) {
        nextOptions.theme = getDarkmodeTheme(theme);
    } else if (typeof theme === 'object' && isAgThemeOrUndefined(theme.baseTheme)) {
        nextOptions.theme = {
            ...options.theme,
            baseTheme: getDarkmodeTheme(theme.baseTheme),
        };
    }
    defaultUpdate(chart, nextOptions);
};

const defaultUpdateDelta = __chartAPI.updateDelta;
__chartAPI.updateDelta = function updateDelta(chart, options) {
    const nextOptions = { ...options };
    // Allow setting theme overrides updateDelta (see api-create-update)
    if (typeof options.theme === 'object') {
        const theme = options.theme.baseTheme || 'ag-default';
        nextOptions.theme = {
            ...options.theme,
            baseTheme: getDarkmodeTheme(theme),
        };
    }
    defaultUpdateDelta(chart, nextOptions);
};

const applyDarkmode = () => {
    document.documentElement.setAttribute('data-dark-mode', darkmode);
    const charts = document.querySelectorAll('[data-ag-charts]');
    charts.forEach((element) => {
        const chart = __chartAPI.getInstance(element);
        if (chart == null) return;
        // .update is monkey-patched to apply theme to options
        // This is just needed to trigger the theme update
        __chartAPI.update(chart, chart.getOptions());
    });
    return charts.length !== 0;
};

if (!applyDarkmode()) {
    /* React defers updates. Rather than try and hook into the API, just wait until the darkmode is applied. */
    const observer = new MutationObserver(() => {
        if (applyDarkmode()) {
            observer.disconnect();
        }
    });
    observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
    });
}
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'color-scheme-change') {
        darkmode = event.data.darkmode;
        applyDarkmode();
    }
});
${DARK_MODE_END}`;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3V0aWxzL2dldERhcmtNb2RlU25pcHBldC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgREFSS19NT0RFX1NUQVJUID0gJy8qKiBEQVJLIE1PREUgU1RBUlQgKiovJztcbmV4cG9ydCBjb25zdCBEQVJLX01PREVfRU5EID0gJy8qKiBEQVJLIE1PREUgRU5EICoqLyc7XG5cbmV4cG9ydCBjb25zdCBnZXREYXJrTW9kZVNuaXBwZXQgPSAoeyBjaGFydEFQSSB9OiB7IGNoYXJ0QVBJPzogc3RyaW5nIH0gPSB7fSkgPT5cbiAgICBgJHtEQVJLX01PREVfU1RBUlR9XG4ke1xuICAgIGNoYXJ0QVBJID09IG51bGxcbiAgICAgICAgPyBgaW1wb3J0IHsgQWdDaGFydHMgYXMgX19jaGFydEFQSSB9IGZyb20gJ2FnLWNoYXJ0cy1jb21tdW5pdHknO2BcbiAgICAgICAgOiBgY29uc3QgX19jaGFydEFQSSA9ICR7Y2hhcnRBUEl9O2Bcbn1cblxubGV0IGRhcmttb2RlID1cbiAgICAobG9jYWxTdG9yYWdlWydkb2N1bWVudGF0aW9uOmRhcmttb2RlJ10gfHwgU3RyaW5nKG1hdGNoTWVkaWEoJyhwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyayknKS5tYXRjaGVzKSkgPT09ICd0cnVlJztcblxuY29uc3QgaXNBZ1RoZW1lT3JVbmRlZmluZWQgPSAodGhlbWUpID0+IHtcbiAgICByZXR1cm4gdGhlbWUgPT0gbnVsbCB8fCAodHlwZW9mIHRoZW1lID09PSAnc3RyaW5nJyAmJiB0aGVtZS5zdGFydHNXaXRoKCdhZy0nKSk7XG59O1xuXG5jb25zdCBnZXREYXJrbW9kZVRoZW1lID0gKHRoZW1lID0gJ2FnLWRlZmF1bHQnKSA9PiB7XG4gICAgY29uc3QgYmFzZVRoZW1lID0gdGhlbWUucmVwbGFjZSgvLWRhcmskLywgJycpO1xuICAgIHJldHVybiBkYXJrbW9kZSA/IGJhc2VUaGVtZSArICctZGFyaycgOiBiYXNlVGhlbWU7XG59O1xuXG5jb25zdCBkZWZhdWx0VXBkYXRlID0gX19jaGFydEFQSS51cGRhdGU7XG5fX2NoYXJ0QVBJLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZShjaGFydCwgb3B0aW9ucykge1xuICAgIGNvbnN0IG5leHRPcHRpb25zID0geyAuLi5vcHRpb25zIH07XG4gICAgY29uc3QgdGhlbWUgPSBvcHRpb25zLnRoZW1lO1xuICAgIGlmIChpc0FnVGhlbWVPclVuZGVmaW5lZCh0aGVtZSkpIHtcbiAgICAgICAgbmV4dE9wdGlvbnMudGhlbWUgPSBnZXREYXJrbW9kZVRoZW1lKHRoZW1lKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGVtZSA9PT0gJ29iamVjdCcgJiYgaXNBZ1RoZW1lT3JVbmRlZmluZWQodGhlbWUuYmFzZVRoZW1lKSkge1xuICAgICAgICBuZXh0T3B0aW9ucy50aGVtZSA9IHtcbiAgICAgICAgICAgIC4uLm9wdGlvbnMudGhlbWUsXG4gICAgICAgICAgICBiYXNlVGhlbWU6IGdldERhcmttb2RlVGhlbWUodGhlbWUuYmFzZVRoZW1lKSxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZGVmYXVsdFVwZGF0ZShjaGFydCwgbmV4dE9wdGlvbnMpO1xufTtcblxuY29uc3QgZGVmYXVsdFVwZGF0ZURlbHRhID0gX19jaGFydEFQSS51cGRhdGVEZWx0YTtcbl9fY2hhcnRBUEkudXBkYXRlRGVsdGEgPSBmdW5jdGlvbiB1cGRhdGVEZWx0YShjaGFydCwgb3B0aW9ucykge1xuICAgIGNvbnN0IG5leHRPcHRpb25zID0geyAuLi5vcHRpb25zIH07XG4gICAgLy8gQWxsb3cgc2V0dGluZyB0aGVtZSBvdmVycmlkZXMgdXBkYXRlRGVsdGEgKHNlZSBhcGktY3JlYXRlLXVwZGF0ZSlcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMudGhlbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbnN0IHRoZW1lID0gb3B0aW9ucy50aGVtZS5iYXNlVGhlbWUgfHwgJ2FnLWRlZmF1bHQnO1xuICAgICAgICBuZXh0T3B0aW9ucy50aGVtZSA9IHtcbiAgICAgICAgICAgIC4uLm9wdGlvbnMudGhlbWUsXG4gICAgICAgICAgICBiYXNlVGhlbWU6IGdldERhcmttb2RlVGhlbWUodGhlbWUpLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBkZWZhdWx0VXBkYXRlRGVsdGEoY2hhcnQsIG5leHRPcHRpb25zKTtcbn07XG5cbmNvbnN0IGFwcGx5RGFya21vZGUgPSAoKSA9PiB7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1kYXJrLW1vZGUnLCBkYXJrbW9kZSk7XG4gICAgY29uc3QgY2hhcnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtYWctY2hhcnRzXScpO1xuICAgIGNoYXJ0cy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGNoYXJ0ID0gX19jaGFydEFQSS5nZXRJbnN0YW5jZShlbGVtZW50KTtcbiAgICAgICAgaWYgKGNoYXJ0ID09IG51bGwpIHJldHVybjtcbiAgICAgICAgLy8gLnVwZGF0ZSBpcyBtb25rZXktcGF0Y2hlZCB0byBhcHBseSB0aGVtZSB0byBvcHRpb25zXG4gICAgICAgIC8vIFRoaXMgaXMganVzdCBuZWVkZWQgdG8gdHJpZ2dlciB0aGUgdGhlbWUgdXBkYXRlXG4gICAgICAgIF9fY2hhcnRBUEkudXBkYXRlKGNoYXJ0LCBjaGFydC5nZXRPcHRpb25zKCkpO1xuICAgIH0pO1xuICAgIHJldHVybiBjaGFydHMubGVuZ3RoICE9PSAwO1xufTtcblxuaWYgKCFhcHBseURhcmttb2RlKCkpIHtcbiAgICAvKiBSZWFjdCBkZWZlcnMgdXBkYXRlcy4gUmF0aGVyIHRoYW4gdHJ5IGFuZCBob29rIGludG8gdGhlIEFQSSwganVzdCB3YWl0IHVudGlsIHRoZSBkYXJrbW9kZSBpcyBhcHBsaWVkLiAqL1xuICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4ge1xuICAgICAgICBpZiAoYXBwbHlEYXJrbW9kZSgpKSB7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcbiAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgIH0pO1xufVxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoZXZlbnQuZGF0YSAmJiBldmVudC5kYXRhLnR5cGUgPT09ICdjb2xvci1zY2hlbWUtY2hhbmdlJykge1xuICAgICAgICBkYXJrbW9kZSA9IGV2ZW50LmRhdGEuZGFya21vZGU7XG4gICAgICAgIGFwcGx5RGFya21vZGUoKTtcbiAgICB9XG59KTtcbiR7REFSS19NT0RFX0VORH1gO1xuIl0sIm5hbWVzIjpbIkRBUktfTU9ERV9FTkQiLCJEQVJLX01PREVfU1RBUlQiLCJnZXREYXJrTW9kZVNuaXBwZXQiLCJjaGFydEFQSSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFDYUEsYUFBYTtlQUFiQTs7SUFEQUMsZUFBZTtlQUFmQTs7SUFHQUMsa0JBQWtCO2VBQWxCQTs7O0FBSE4sTUFBTUQsa0JBQWtCO0FBQ3hCLE1BQU1ELGdCQUFnQjtBQUV0QixNQUFNRSxxQkFBcUIsQ0FBQyxFQUFFQyxRQUFRLEVBQXlCLEdBQUcsQ0FBQyxDQUFDLEdBQ3ZFLENBQUMsRUFBRUYsZ0JBQWdCO0FBQ3ZCLEVBQ0lFLFlBQVksT0FDTixDQUFDLDZEQUE2RCxDQUFDLEdBQy9ELENBQUMsbUJBQW1CLEVBQUVBLFNBQVMsQ0FBQyxDQUFDLENBQzFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyRUQsRUFBRUgsY0FBYyxDQUFDIn0=