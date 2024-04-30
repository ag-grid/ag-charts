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
    getChartImports: function() {
        return getChartImports;
    },
    wrapOptionsUpdateCode: function() {
        return wrapOptionsUpdateCode;
    }
});
function wrapOptionsUpdateCode(code, before = 'const options = {...this.options};', after = 'this.options = options;', localVar = 'options') {
    if (code.indexOf('options.') < 0) {
        return code;
    }
    return code.replace(RegExp("(?<!\\w)options\\.", "g"), localVar + '.').replace(RegExp("(.*?)\\{(.*)\\}", "s"), `$1{\n${before}\n$2\n${after}\n}`);
}
function getChartImports(imports, usesChartApi) {
    const enterpriseCharts = imports.find((i)=>i.module.includes('ag-charts-enterprise'));
    const chartsImport = imports.find((i)=>i.module.includes('ag-charts-community') || i.module.includes('ag-charts-enterprise'));
    if (chartsImport) {
        // Only included AgCharts if its api is used. Otherwise it can be removed as AgCharts.create is handled by framework components
        // But if AgCharts.download is used we mustn't remove it.
        const extraImports = chartsImport.imports.filter((i)=>usesChartApi || i !== 'AgCharts');
        if (extraImports.length > 0) {
            return `import { ${extraImports.join(', ')} } from 'ag-charts-${enterpriseCharts ? 'enterprise' : 'community'}';`;
        }
    }
    return undefined;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBCaW5kaW5nSW1wb3J0IH0gZnJvbSAnLi9wYXJzZXItdXRpbHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gd3JhcE9wdGlvbnNVcGRhdGVDb2RlKFxuICAgIGNvZGU6IHN0cmluZyxcbiAgICBiZWZvcmUgPSAnY29uc3Qgb3B0aW9ucyA9IHsuLi50aGlzLm9wdGlvbnN9OycsXG4gICAgYWZ0ZXIgPSAndGhpcy5vcHRpb25zID0gb3B0aW9uczsnLFxuICAgIGxvY2FsVmFyID0gJ29wdGlvbnMnXG4pOiBzdHJpbmcge1xuICAgIGlmIChjb2RlLmluZGV4T2YoJ29wdGlvbnMuJykgPCAwKSB7XG4gICAgICAgIHJldHVybiBjb2RlO1xuICAgIH1cblxuICAgIHJldHVybiBjb2RlXG4gICAgICAgIC5yZXBsYWNlKC8oPzwhXFx3KW9wdGlvbnNcXC4vZywgbG9jYWxWYXIgKyAnLicpXG4gICAgICAgIC5yZXBsYWNlKC8oLio/KVxceyguKilcXH0vcywgYCQxe1xcbiR7YmVmb3JlfVxcbiQyXFxuJHthZnRlcn1cXG59YCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDaGFydEltcG9ydHMoaW1wb3J0czogQmluZGluZ0ltcG9ydFtdLCB1c2VzQ2hhcnRBcGk6IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGVudGVycHJpc2VDaGFydHMgPSBpbXBvcnRzLmZpbmQoKGkpID0+IGkubW9kdWxlLmluY2x1ZGVzKCdhZy1jaGFydHMtZW50ZXJwcmlzZScpKTtcbiAgICBjb25zdCBjaGFydHNJbXBvcnQgPSBpbXBvcnRzLmZpbmQoXG4gICAgICAgIChpKSA9PiBpLm1vZHVsZS5pbmNsdWRlcygnYWctY2hhcnRzLWNvbW11bml0eScpIHx8IGkubW9kdWxlLmluY2x1ZGVzKCdhZy1jaGFydHMtZW50ZXJwcmlzZScpXG4gICAgKTtcbiAgICBpZiAoY2hhcnRzSW1wb3J0KSB7XG4gICAgICAgIC8vIE9ubHkgaW5jbHVkZWQgQWdDaGFydHMgaWYgaXRzIGFwaSBpcyB1c2VkLiBPdGhlcndpc2UgaXQgY2FuIGJlIHJlbW92ZWQgYXMgQWdDaGFydHMuY3JlYXRlIGlzIGhhbmRsZWQgYnkgZnJhbWV3b3JrIGNvbXBvbmVudHNcbiAgICAgICAgLy8gQnV0IGlmIEFnQ2hhcnRzLmRvd25sb2FkIGlzIHVzZWQgd2UgbXVzdG4ndCByZW1vdmUgaXQuXG4gICAgICAgIGNvbnN0IGV4dHJhSW1wb3J0cyA9IGNoYXJ0c0ltcG9ydC5pbXBvcnRzLmZpbHRlcigoaSkgPT4gdXNlc0NoYXJ0QXBpIHx8IGkgIT09ICdBZ0NoYXJ0cycpO1xuXG4gICAgICAgIGlmIChleHRyYUltcG9ydHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGBpbXBvcnQgeyAke2V4dHJhSW1wb3J0cy5qb2luKCcsICcpfSB9IGZyb20gJ2FnLWNoYXJ0cy0ke1xuICAgICAgICAgICAgICAgIGVudGVycHJpc2VDaGFydHMgPyAnZW50ZXJwcmlzZScgOiAnY29tbXVuaXR5J1xuICAgICAgICAgICAgfSc7YDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG4iXSwibmFtZXMiOlsiZ2V0Q2hhcnRJbXBvcnRzIiwid3JhcE9wdGlvbnNVcGRhdGVDb2RlIiwiY29kZSIsImJlZm9yZSIsImFmdGVyIiwibG9jYWxWYXIiLCJpbmRleE9mIiwicmVwbGFjZSIsImltcG9ydHMiLCJ1c2VzQ2hhcnRBcGkiLCJlbnRlcnByaXNlQ2hhcnRzIiwiZmluZCIsImkiLCJtb2R1bGUiLCJpbmNsdWRlcyIsImNoYXJ0c0ltcG9ydCIsImV4dHJhSW1wb3J0cyIsImZpbHRlciIsImxlbmd0aCIsImpvaW4iLCJ1bmRlZmluZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBaUJnQkEsZUFBZTtlQUFmQTs7SUFmQUMscUJBQXFCO2VBQXJCQTs7O0FBQVQsU0FBU0Esc0JBQ1pDLElBQVksRUFDWkMsU0FBUyxvQ0FBb0MsRUFDN0NDLFFBQVEseUJBQXlCLEVBQ2pDQyxXQUFXLFNBQVM7SUFFcEIsSUFBSUgsS0FBS0ksT0FBTyxDQUFDLGNBQWMsR0FBRztRQUM5QixPQUFPSjtJQUNYO0lBRUEsT0FBT0EsS0FDRkssT0FBTyxDQUFDLG1DQUFxQkYsV0FBVyxLQUN4Q0UsT0FBTyxDQUFDLGdDQUFrQixDQUFDLEtBQUssRUFBRUosT0FBTyxNQUFNLEVBQUVDLE1BQU0sR0FBRyxDQUFDO0FBQ3BFO0FBRU8sU0FBU0osZ0JBQWdCUSxPQUF3QixFQUFFQyxZQUFxQjtJQUMzRSxNQUFNQyxtQkFBbUJGLFFBQVFHLElBQUksQ0FBQyxDQUFDQyxJQUFNQSxFQUFFQyxNQUFNLENBQUNDLFFBQVEsQ0FBQztJQUMvRCxNQUFNQyxlQUFlUCxRQUFRRyxJQUFJLENBQzdCLENBQUNDLElBQU1BLEVBQUVDLE1BQU0sQ0FBQ0MsUUFBUSxDQUFDLDBCQUEwQkYsRUFBRUMsTUFBTSxDQUFDQyxRQUFRLENBQUM7SUFFekUsSUFBSUMsY0FBYztRQUNkLCtIQUErSDtRQUMvSCx5REFBeUQ7UUFDekQsTUFBTUMsZUFBZUQsYUFBYVAsT0FBTyxDQUFDUyxNQUFNLENBQUMsQ0FBQ0wsSUFBTUgsZ0JBQWdCRyxNQUFNO1FBRTlFLElBQUlJLGFBQWFFLE1BQU0sR0FBRyxHQUFHO1lBQ3pCLE9BQU8sQ0FBQyxTQUFTLEVBQUVGLGFBQWFHLElBQUksQ0FBQyxNQUFNLG1CQUFtQixFQUMxRFQsbUJBQW1CLGVBQWUsWUFDckMsRUFBRSxDQUFDO1FBQ1I7SUFDSjtJQUVBLE9BQU9VO0FBQ1gifQ==