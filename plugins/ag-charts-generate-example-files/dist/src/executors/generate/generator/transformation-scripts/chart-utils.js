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
    return code.replace(RegExp("(?<!= )options\\.", "g"), localVar + '.').replace(RegExp("(.*?)\\{(.*)\\}", "s"), `$1{\n${before}\n$2\n${after}\n}`);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBCaW5kaW5nSW1wb3J0IH0gZnJvbSAnLi9wYXJzZXItdXRpbHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gd3JhcE9wdGlvbnNVcGRhdGVDb2RlKFxuICAgIGNvZGU6IHN0cmluZyxcbiAgICBiZWZvcmUgPSAnY29uc3Qgb3B0aW9ucyA9IHsuLi50aGlzLm9wdGlvbnN9OycsXG4gICAgYWZ0ZXIgPSAndGhpcy5vcHRpb25zID0gb3B0aW9uczsnLFxuICAgIGxvY2FsVmFyID0gJ29wdGlvbnMnXG4pOiBzdHJpbmcge1xuICAgIGlmIChjb2RlLmluZGV4T2YoJ29wdGlvbnMuJykgPCAwKSB7XG4gICAgICAgIHJldHVybiBjb2RlO1xuICAgIH1cblxuICAgIHJldHVybiBjb2RlXG4gICAgICAgIC5yZXBsYWNlKC8oPzwhPSApb3B0aW9uc1xcLi9nLCBsb2NhbFZhciArICcuJylcbiAgICAgICAgLnJlcGxhY2UoLyguKj8pXFx7KC4qKVxcfS9zLCBgJDF7XFxuJHtiZWZvcmV9XFxuJDJcXG4ke2FmdGVyfVxcbn1gKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENoYXJ0SW1wb3J0cyhpbXBvcnRzOiBCaW5kaW5nSW1wb3J0W10sIHVzZXNDaGFydEFwaTogYm9vbGVhbik6IHN0cmluZyB7XG4gICAgY29uc3QgZW50ZXJwcmlzZUNoYXJ0cyA9IGltcG9ydHMuZmluZCgoaSkgPT4gaS5tb2R1bGUuaW5jbHVkZXMoJ2FnLWNoYXJ0cy1lbnRlcnByaXNlJykpO1xuICAgIGNvbnN0IGNoYXJ0c0ltcG9ydCA9IGltcG9ydHMuZmluZChcbiAgICAgICAgKGkpID0+IGkubW9kdWxlLmluY2x1ZGVzKCdhZy1jaGFydHMtY29tbXVuaXR5JykgfHwgaS5tb2R1bGUuaW5jbHVkZXMoJ2FnLWNoYXJ0cy1lbnRlcnByaXNlJylcbiAgICApO1xuICAgIGlmIChjaGFydHNJbXBvcnQpIHtcbiAgICAgICAgLy8gT25seSBpbmNsdWRlZCBBZ0NoYXJ0cyBpZiBpdHMgYXBpIGlzIHVzZWQuIE90aGVyd2lzZSBpdCBjYW4gYmUgcmVtb3ZlZCBhcyBBZ0NoYXJ0cy5jcmVhdGUgaXMgaGFuZGxlZCBieSBmcmFtZXdvcmsgY29tcG9uZW50c1xuICAgICAgICAvLyBCdXQgaWYgQWdDaGFydHMuZG93bmxvYWQgaXMgdXNlZCB3ZSBtdXN0bid0IHJlbW92ZSBpdC5cbiAgICAgICAgY29uc3QgZXh0cmFJbXBvcnRzID0gY2hhcnRzSW1wb3J0LmltcG9ydHMuZmlsdGVyKChpKSA9PiB1c2VzQ2hhcnRBcGkgfHwgaSAhPT0gJ0FnQ2hhcnRzJyk7XG5cbiAgICAgICAgaWYgKGV4dHJhSW1wb3J0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYGltcG9ydCB7ICR7ZXh0cmFJbXBvcnRzLmpvaW4oJywgJyl9IH0gZnJvbSAnYWctY2hhcnRzLSR7XG4gICAgICAgICAgICAgICAgZW50ZXJwcmlzZUNoYXJ0cyA/ICdlbnRlcnByaXNlJyA6ICdjb21tdW5pdHknXG4gICAgICAgICAgICB9JztgO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cbiJdLCJuYW1lcyI6WyJnZXRDaGFydEltcG9ydHMiLCJ3cmFwT3B0aW9uc1VwZGF0ZUNvZGUiLCJjb2RlIiwiYmVmb3JlIiwiYWZ0ZXIiLCJsb2NhbFZhciIsImluZGV4T2YiLCJyZXBsYWNlIiwiaW1wb3J0cyIsInVzZXNDaGFydEFwaSIsImVudGVycHJpc2VDaGFydHMiLCJmaW5kIiwiaSIsIm1vZHVsZSIsImluY2x1ZGVzIiwiY2hhcnRzSW1wb3J0IiwiZXh0cmFJbXBvcnRzIiwiZmlsdGVyIiwibGVuZ3RoIiwiam9pbiIsInVuZGVmaW5lZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFpQmdCQSxlQUFlO2VBQWZBOztJQWZBQyxxQkFBcUI7ZUFBckJBOzs7QUFBVCxTQUFTQSxzQkFDWkMsSUFBWSxFQUNaQyxTQUFTLG9DQUFvQyxFQUM3Q0MsUUFBUSx5QkFBeUIsRUFDakNDLFdBQVcsU0FBUztJQUVwQixJQUFJSCxLQUFLSSxPQUFPLENBQUMsY0FBYyxHQUFHO1FBQzlCLE9BQU9KO0lBQ1g7SUFFQSxPQUFPQSxLQUNGSyxPQUFPLENBQUMsa0NBQXFCRixXQUFXLEtBQ3hDRSxPQUFPLENBQUMsZ0NBQWtCLENBQUMsS0FBSyxFQUFFSixPQUFPLE1BQU0sRUFBRUMsTUFBTSxHQUFHLENBQUM7QUFDcEU7QUFFTyxTQUFTSixnQkFBZ0JRLE9BQXdCLEVBQUVDLFlBQXFCO0lBQzNFLE1BQU1DLG1CQUFtQkYsUUFBUUcsSUFBSSxDQUFDLENBQUNDLElBQU1BLEVBQUVDLE1BQU0sQ0FBQ0MsUUFBUSxDQUFDO0lBQy9ELE1BQU1DLGVBQWVQLFFBQVFHLElBQUksQ0FDN0IsQ0FBQ0MsSUFBTUEsRUFBRUMsTUFBTSxDQUFDQyxRQUFRLENBQUMsMEJBQTBCRixFQUFFQyxNQUFNLENBQUNDLFFBQVEsQ0FBQztJQUV6RSxJQUFJQyxjQUFjO1FBQ2QsK0hBQStIO1FBQy9ILHlEQUF5RDtRQUN6RCxNQUFNQyxlQUFlRCxhQUFhUCxPQUFPLENBQUNTLE1BQU0sQ0FBQyxDQUFDTCxJQUFNSCxnQkFBZ0JHLE1BQU07UUFFOUUsSUFBSUksYUFBYUUsTUFBTSxHQUFHLEdBQUc7WUFDekIsT0FBTyxDQUFDLFNBQVMsRUFBRUYsYUFBYUcsSUFBSSxDQUFDLE1BQU0sbUJBQW1CLEVBQzFEVCxtQkFBbUIsZUFBZSxZQUNyQyxFQUFFLENBQUM7UUFDUjtJQUNKO0lBRUEsT0FBT1U7QUFDWCJ9