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
    default: function() {
        return _default;
    },
    internalParser: function() {
        return internalParser;
    },
    parser: function() {
        return parser;
    }
});
const _interop_require_default = require("@swc/helpers/_/_interop_require_default");
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _object_without_properties_loose = require("@swc/helpers/_/_object_without_properties_loose");
const _cheerio = /*#__PURE__*/ _interop_require_wildcard._(require("cheerio"));
const _typescript = /*#__PURE__*/ _interop_require_default._(require("typescript"));
const _parserutils = require("./parser-utils");
const chartVariableName = 'chart';
const optionsVariableName = 'options';
function tsGenerateWithOptionReferences(node, srcFile) {
    return (0, _parserutils.tsGenerate)(node, srcFile).replace(new RegExp(`AgCharts\\.update\\(chart, options\\);?`, 'g'), '');
}
function parser({ srcFile, html, exampleSettings }) {
    const bindings = internalParser((0, _parserutils.readAsJsFile)(srcFile, {
        includeImports: true
    }), html, exampleSettings);
    const typedBindings = internalParser(srcFile, html, exampleSettings);
    return {
        bindings,
        typedBindings
    };
}
function internalParser(js, html, exampleSettings) {
    const domTree = _cheerio.load(html, null, false);
    domTree('style').remove();
    const domEventHandlers = (0, _parserutils.extractEventHandlers)(domTree, _parserutils.recognizedDomEvents);
    const tsTree = (0, _parserutils.parseFile)(js);
    const tsCollectors = [];
    const tsOptionsCollectors = [];
    const registered = [
        chartVariableName,
        optionsVariableName
    ];
    // handler is the function name, params are any function parameters
    domEventHandlers.forEach(([_, handler, params])=>{
        if (registered.indexOf(handler) > -1) {
            return;
        }
        registered.push(handler);
        // one of the event handlers extracted earlier (onclick, onchange etc)
        tsCollectors.push({
            matches: (node)=>(0, _parserutils.tsNodeIsFunctionWithName)(node, handler),
            apply: (bindings, node)=>{
                bindings.externalEventHandlers.push({
                    name: handler,
                    params: params,
                    body: tsGenerateWithOptionReferences(node, tsTree)
                });
            }
        });
    });
    const unboundInstanceMethods = (0, _parserutils.extractUnboundInstanceMethods)(tsTree);
    // functions marked as "inScope" will be added to "instance" methods, as opposed to "global" ones
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsInScope)(node, unboundInstanceMethods),
        apply: (bindings, node)=>bindings.instanceMethods.push((0, _parserutils.removeInScopeJsDoc)(tsGenerateWithOptionReferences(node, tsTree)))
    });
    // anything not marked as "inScope" is considered a "global" method
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsUnusedFunction)(node, registered, unboundInstanceMethods),
        apply: (bindings, node)=>bindings.globals.push((0, _parserutils.tsGenerate)(node, tsTree))
    });
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsPropertyWithName)(node, 'container'),
        apply: (bindings, node)=>{
            const { initializer } = node;
            if (!(0, _parserutils.tsNodeIsFunctionCall)(initializer) || !(0, _parserutils.tsNodeIsPropertyAccessExpressionOf)(initializer.expression, [
                'document',
                'getElementById'
            ])) {
                throw new Error('Invalid container definition (must be in form of document.getElementById)');
            }
            let propertyAssignment = node;
            while(propertyAssignment != null && !(0, _parserutils.tsNodeIsGlobalVar)(propertyAssignment)){
                propertyAssignment = propertyAssignment.parent;
            }
            if (propertyAssignment == null || !(0, _parserutils.tsNodeIsGlobalVar)(propertyAssignment)) {
                throw new Error('AgChartOptions was not assigned to variable');
            }
            const propertyName = propertyAssignment.name.escapedText;
            const id = initializer.arguments[0].text;
            let code = (0, _parserutils.tsGenerate)(propertyAssignment.initializer, tsTree);
            code = code.replace(/container:.*/, '');
            registered.push(propertyName);
            bindings.chartProperties[id] = propertyName;
            bindings.properties.push({
                name: propertyName,
                value: code
            });
        }
    });
    // anything vars is considered an "global" var
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsTopLevelVariable)(node, registered),
        apply: (bindings, node)=>{
            const code = (0, _parserutils.tsGenerate)(node, tsTree);
            // FIXME - removes AgChartOptions. There's got to be a better way to do this...
            if (code.includes('document.getElementById')) return;
            bindings.globals.push(code);
        }
    });
    // optionsCollectors captures all events, properties etc that are related to options
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsGlobalVarWithName)(node, optionsVariableName),
        apply: (bindings, node)=>{
            const initializer = node.initializer;
            if ((initializer == null ? void 0 : initializer.kind) !== _typescript.default.SyntaxKind.ObjectLiteralExpression) return bindings;
            initializer.properties.forEach((prop)=>{
                bindings = (0, _parserutils.tsCollect)(prop, bindings, tsOptionsCollectors, false);
            });
            return bindings;
        }
    });
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsGlobalFunctionCall)(node),
        apply: (bindings, node)=>bindings.init.push((0, _parserutils.tsGenerate)(node, tsTree))
    });
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsTypeDeclaration)(node),
        apply: (bindings, node)=>{
            const declaration = (0, _parserutils.tsGenerate)(node, tsTree);
            bindings.declarations.push(declaration);
        }
    });
    // For React we need to identify the external dependencies for callbacks to prevent stale closures
    const GLOBAL_DEPS = new Set([
        'console',
        'document',
        'Error',
        'AgCharts',
        'chart',
        'window',
        'Image',
        'Date',
        'this'
    ]);
    tsCollectors.push({
        matches: (node)=>(0, _parserutils.tsNodeIsTopLevelFunction)(node),
        apply: (bindings, node)=>{
            const body = node.body;
            const allVariables = new Set(body ? (0, _parserutils.findAllVariables)(body) : []);
            if (node.parameters && node.parameters.length > 0) {
                node.parameters.forEach((p)=>{
                    allVariables.add(p.name.getText());
                });
            }
            const deps = body ? (0, _parserutils.findAllAccessedProperties)(body) : [];
            const allDeps = deps.filter((id)=>{
                // Ignore locally defined variables
                const isVariable = allVariables.has(id);
                // Let's assume that all caps are constants so should be ignored, i.e KEY_UP
                const isCapsConst = id === id.toUpperCase();
                return !isVariable && !isCapsConst && !GLOBAL_DEPS.has(id);
            });
            if (allDeps.length > 0) {
                bindings.callbackDependencies[node.name.getText()] = [
                    ...new Set(allDeps)
                ];
            }
        }
    });
    /*
     * properties -> chart related properties
     * globals -> none chart related methods/variables (i.e. non-instance)
     */ const tsBindings = (0, _parserutils.tsCollect)(tsTree, {
        properties: [],
        chartProperties: {},
        externalEventHandlers: [],
        instanceMethods: [],
        globals: [],
        init: [],
        declarations: [],
        callbackDependencies: {}
    }, tsCollectors);
    // Must be record for serialization
    const placeholders = {};
    const chartAttributes = {};
    domTree('div[id]').each((index, elem)=>{
        const _elem_attribs = elem.attribs, { id } = _elem_attribs, rest = _object_without_properties_loose._(_elem_attribs, [
            "id"
        ]);
        const templatePlaceholder = `$$CHART${index}$$`;
        placeholders[id] = templatePlaceholder;
        chartAttributes[id] = rest;
        domTree(elem).replaceWith(templatePlaceholder);
    });
    tsBindings.placeholders = placeholders;
    tsBindings.chartAttributes = chartAttributes;
    tsBindings.template = domTree.html();
    tsBindings.imports = (0, _parserutils.extractImportStatements)(tsTree);
    tsBindings.optionsTypeInfo = (0, _parserutils.extractTypeInfoForVariable)(tsTree, 'options');
    tsBindings.usesChartApi = (0, _parserutils.usesChartApi)(tsTree);
    tsBindings.chartSettings = exampleSettings;
    return tsBindings;
}
const _default = parser;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS1zcmMtcGFyc2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNoZWVyaW8gZnJvbSAnY2hlZXJpbyc7XG5pbXBvcnQgdHlwZSB7IE9iamVjdExpdGVyYWxFeHByZXNzaW9uLCBTaWduYXR1cmVEZWNsYXJhdGlvbiB9IGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQgdHlwZSB7IEV4YW1wbGVTZXR0aW5ncyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7XG4gICAgZXh0cmFjdEV2ZW50SGFuZGxlcnMsXG4gICAgZXh0cmFjdEltcG9ydFN0YXRlbWVudHMsXG4gICAgZXh0cmFjdFR5cGVJbmZvRm9yVmFyaWFibGUsXG4gICAgZXh0cmFjdFVuYm91bmRJbnN0YW5jZU1ldGhvZHMsXG4gICAgZmluZEFsbEFjY2Vzc2VkUHJvcGVydGllcyxcbiAgICBmaW5kQWxsVmFyaWFibGVzLFxuICAgIHBhcnNlRmlsZSxcbiAgICByZWFkQXNKc0ZpbGUsXG4gICAgcmVjb2duaXplZERvbUV2ZW50cyxcbiAgICByZW1vdmVJblNjb3BlSnNEb2MsXG4gICAgdHNDb2xsZWN0LFxuICAgIHRzR2VuZXJhdGUsXG4gICAgdHNOb2RlSXNGdW5jdGlvbkNhbGwsXG4gICAgdHNOb2RlSXNGdW5jdGlvbldpdGhOYW1lLFxuICAgIHRzTm9kZUlzR2xvYmFsRnVuY3Rpb25DYWxsLFxuICAgIHRzTm9kZUlzR2xvYmFsVmFyLFxuICAgIHRzTm9kZUlzR2xvYmFsVmFyV2l0aE5hbWUsXG4gICAgdHNOb2RlSXNJblNjb3BlLFxuICAgIHRzTm9kZUlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uT2YsXG4gICAgdHNOb2RlSXNQcm9wZXJ0eVdpdGhOYW1lLFxuICAgIHRzTm9kZUlzVG9wTGV2ZWxGdW5jdGlvbixcbiAgICB0c05vZGVJc1RvcExldmVsVmFyaWFibGUsXG4gICAgdHNOb2RlSXNUeXBlRGVjbGFyYXRpb24sXG4gICAgdHNOb2RlSXNVbnVzZWRGdW5jdGlvbixcbiAgICB1c2VzQ2hhcnRBcGksXG59IGZyb20gJy4vcGFyc2VyLXV0aWxzJztcblxuY29uc3QgY2hhcnRWYXJpYWJsZU5hbWUgPSAnY2hhcnQnO1xuY29uc3Qgb3B0aW9uc1ZhcmlhYmxlTmFtZSA9ICdvcHRpb25zJztcblxuZnVuY3Rpb24gdHNHZW5lcmF0ZVdpdGhPcHRpb25SZWZlcmVuY2VzKG5vZGUsIHNyY0ZpbGUpIHtcbiAgICByZXR1cm4gdHNHZW5lcmF0ZShub2RlLCBzcmNGaWxlKS5yZXBsYWNlKG5ldyBSZWdFeHAoYEFnQ2hhcnRzXFxcXC51cGRhdGVcXFxcKGNoYXJ0LCBvcHRpb25zXFxcXCk7P2AsICdnJyksICcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlcih7XG4gICAgc3JjRmlsZSxcbiAgICBodG1sLFxuICAgIGV4YW1wbGVTZXR0aW5ncyxcbn06IHtcbiAgICBzcmNGaWxlOiBzdHJpbmc7XG4gICAgaHRtbDogc3RyaW5nO1xuICAgIGV4YW1wbGVTZXR0aW5nczogRXhhbXBsZVNldHRpbmdzO1xufSkge1xuICAgIGNvbnN0IGJpbmRpbmdzID0gaW50ZXJuYWxQYXJzZXIocmVhZEFzSnNGaWxlKHNyY0ZpbGUsIHsgaW5jbHVkZUltcG9ydHM6IHRydWUgfSksIGh0bWwsIGV4YW1wbGVTZXR0aW5ncyk7XG4gICAgY29uc3QgdHlwZWRCaW5kaW5ncyA9IGludGVybmFsUGFyc2VyKHNyY0ZpbGUsIGh0bWwsIGV4YW1wbGVTZXR0aW5ncyk7XG4gICAgcmV0dXJuIHsgYmluZGluZ3MsIHR5cGVkQmluZGluZ3MgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsUGFyc2VyKGpzLCBodG1sLCBleGFtcGxlU2V0dGluZ3MpIHtcbiAgICBjb25zdCBkb21UcmVlID0gY2hlZXJpby5sb2FkKGh0bWwsIG51bGwsIGZhbHNlKTtcbiAgICBkb21UcmVlKCdzdHlsZScpLnJlbW92ZSgpO1xuXG4gICAgY29uc3QgZG9tRXZlbnRIYW5kbGVycyA9IGV4dHJhY3RFdmVudEhhbmRsZXJzKGRvbVRyZWUsIHJlY29nbml6ZWREb21FdmVudHMpO1xuICAgIGNvbnN0IHRzVHJlZSA9IHBhcnNlRmlsZShqcyk7XG4gICAgY29uc3QgdHNDb2xsZWN0b3JzID0gW107XG4gICAgY29uc3QgdHNPcHRpb25zQ29sbGVjdG9ycyA9IFtdO1xuICAgIGNvbnN0IHJlZ2lzdGVyZWQgPSBbY2hhcnRWYXJpYWJsZU5hbWUsIG9wdGlvbnNWYXJpYWJsZU5hbWVdO1xuXG4gICAgLy8gaGFuZGxlciBpcyB0aGUgZnVuY3Rpb24gbmFtZSwgcGFyYW1zIGFyZSBhbnkgZnVuY3Rpb24gcGFyYW1ldGVyc1xuICAgIGRvbUV2ZW50SGFuZGxlcnMuZm9yRWFjaCgoW18sIGhhbmRsZXIsIHBhcmFtc10pID0+IHtcbiAgICAgICAgaWYgKHJlZ2lzdGVyZWQuaW5kZXhPZihoYW5kbGVyKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZWdpc3RlcmVkLnB1c2goaGFuZGxlcik7XG5cbiAgICAgICAgLy8gb25lIG9mIHRoZSBldmVudCBoYW5kbGVycyBleHRyYWN0ZWQgZWFybGllciAob25jbGljaywgb25jaGFuZ2UgZXRjKVxuICAgICAgICB0c0NvbGxlY3RvcnMucHVzaCh7XG4gICAgICAgICAgICBtYXRjaGVzOiAobm9kZSkgPT4gdHNOb2RlSXNGdW5jdGlvbldpdGhOYW1lKG5vZGUsIGhhbmRsZXIpLFxuICAgICAgICAgICAgYXBwbHk6IChiaW5kaW5ncywgbm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgIGJpbmRpbmdzLmV4dGVybmFsRXZlbnRIYW5kbGVycy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogaGFuZGxlcixcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IHRzR2VuZXJhdGVXaXRoT3B0aW9uUmVmZXJlbmNlcyhub2RlLCB0c1RyZWUpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB1bmJvdW5kSW5zdGFuY2VNZXRob2RzID0gZXh0cmFjdFVuYm91bmRJbnN0YW5jZU1ldGhvZHModHNUcmVlKTtcbiAgICAvLyBmdW5jdGlvbnMgbWFya2VkIGFzIFwiaW5TY29wZVwiIHdpbGwgYmUgYWRkZWQgdG8gXCJpbnN0YW5jZVwiIG1ldGhvZHMsIGFzIG9wcG9zZWQgdG8gXCJnbG9iYWxcIiBvbmVzXG4gICAgdHNDb2xsZWN0b3JzLnB1c2goe1xuICAgICAgICBtYXRjaGVzOiAobm9kZSkgPT4gdHNOb2RlSXNJblNjb3BlKG5vZGUsIHVuYm91bmRJbnN0YW5jZU1ldGhvZHMpLFxuICAgICAgICBhcHBseTogKGJpbmRpbmdzLCBub2RlKSA9PlxuICAgICAgICAgICAgYmluZGluZ3MuaW5zdGFuY2VNZXRob2RzLnB1c2gocmVtb3ZlSW5TY29wZUpzRG9jKHRzR2VuZXJhdGVXaXRoT3B0aW9uUmVmZXJlbmNlcyhub2RlLCB0c1RyZWUpKSksXG4gICAgfSk7XG5cbiAgICAvLyBhbnl0aGluZyBub3QgbWFya2VkIGFzIFwiaW5TY29wZVwiIGlzIGNvbnNpZGVyZWQgYSBcImdsb2JhbFwiIG1ldGhvZFxuICAgIHRzQ29sbGVjdG9ycy5wdXNoKHtcbiAgICAgICAgbWF0Y2hlczogKG5vZGUpID0+IHRzTm9kZUlzVW51c2VkRnVuY3Rpb24obm9kZSwgcmVnaXN0ZXJlZCwgdW5ib3VuZEluc3RhbmNlTWV0aG9kcyksXG4gICAgICAgIGFwcGx5OiAoYmluZGluZ3MsIG5vZGUpID0+IGJpbmRpbmdzLmdsb2JhbHMucHVzaCh0c0dlbmVyYXRlKG5vZGUsIHRzVHJlZSkpLFxuICAgIH0pO1xuXG4gICAgdHNDb2xsZWN0b3JzLnB1c2goe1xuICAgICAgICBtYXRjaGVzOiAobm9kZSkgPT4gdHNOb2RlSXNQcm9wZXJ0eVdpdGhOYW1lKG5vZGUsICdjb250YWluZXInKSxcbiAgICAgICAgYXBwbHk6IChiaW5kaW5ncywgbm9kZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBpbml0aWFsaXplciB9ID0gbm9kZTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAhdHNOb2RlSXNGdW5jdGlvbkNhbGwoaW5pdGlhbGl6ZXIpIHx8XG4gICAgICAgICAgICAgICAgIXRzTm9kZUlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uT2YoaW5pdGlhbGl6ZXIuZXhwcmVzc2lvbiwgWydkb2N1bWVudCcsICdnZXRFbGVtZW50QnlJZCddKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbnRhaW5lciBkZWZpbml0aW9uIChtdXN0IGJlIGluIGZvcm0gb2YgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQpJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBwcm9wZXJ0eUFzc2lnbm1lbnQgPSBub2RlO1xuICAgICAgICAgICAgd2hpbGUgKHByb3BlcnR5QXNzaWdubWVudCAhPSBudWxsICYmICF0c05vZGVJc0dsb2JhbFZhcihwcm9wZXJ0eUFzc2lnbm1lbnQpKSB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlBc3NpZ25tZW50ID0gcHJvcGVydHlBc3NpZ25tZW50LnBhcmVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eUFzc2lnbm1lbnQgPT0gbnVsbCB8fCAhdHNOb2RlSXNHbG9iYWxWYXIocHJvcGVydHlBc3NpZ25tZW50KSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQWdDaGFydE9wdGlvbnMgd2FzIG5vdCBhc3NpZ25lZCB0byB2YXJpYWJsZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eU5hbWUgPSBwcm9wZXJ0eUFzc2lnbm1lbnQubmFtZS5lc2NhcGVkVGV4dDtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gaW5pdGlhbGl6ZXIuYXJndW1lbnRzWzBdLnRleHQ7XG5cbiAgICAgICAgICAgIGxldCBjb2RlID0gdHNHZW5lcmF0ZShwcm9wZXJ0eUFzc2lnbm1lbnQuaW5pdGlhbGl6ZXIsIHRzVHJlZSk7XG4gICAgICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKC9jb250YWluZXI6LiovLCAnJyk7XG5cbiAgICAgICAgICAgIHJlZ2lzdGVyZWQucHVzaChwcm9wZXJ0eU5hbWUpO1xuICAgICAgICAgICAgYmluZGluZ3MuY2hhcnRQcm9wZXJ0aWVzW2lkXSA9IHByb3BlcnR5TmFtZTtcbiAgICAgICAgICAgIGJpbmRpbmdzLnByb3BlcnRpZXMucHVzaCh7IG5hbWU6IHByb3BlcnR5TmFtZSwgdmFsdWU6IGNvZGUgfSk7XG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBhbnl0aGluZyB2YXJzIGlzIGNvbnNpZGVyZWQgYW4gXCJnbG9iYWxcIiB2YXJcbiAgICB0c0NvbGxlY3RvcnMucHVzaCh7XG4gICAgICAgIG1hdGNoZXM6IChub2RlKSA9PiB0c05vZGVJc1RvcExldmVsVmFyaWFibGUobm9kZSwgcmVnaXN0ZXJlZCksXG4gICAgICAgIGFwcGx5OiAoYmluZGluZ3MsIG5vZGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvZGUgPSB0c0dlbmVyYXRlKG5vZGUsIHRzVHJlZSk7XG5cbiAgICAgICAgICAgIC8vIEZJWE1FIC0gcmVtb3ZlcyBBZ0NoYXJ0T3B0aW9ucy4gVGhlcmUncyBnb3QgdG8gYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXMuLi5cbiAgICAgICAgICAgIGlmIChjb2RlLmluY2x1ZGVzKCdkb2N1bWVudC5nZXRFbGVtZW50QnlJZCcpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGJpbmRpbmdzLmdsb2JhbHMucHVzaChjb2RlKTtcbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIG9wdGlvbnNDb2xsZWN0b3JzIGNhcHR1cmVzIGFsbCBldmVudHMsIHByb3BlcnRpZXMgZXRjIHRoYXQgYXJlIHJlbGF0ZWQgdG8gb3B0aW9uc1xuICAgIHRzQ29sbGVjdG9ycy5wdXNoKHtcbiAgICAgICAgbWF0Y2hlczogKG5vZGUpID0+IHRzTm9kZUlzR2xvYmFsVmFyV2l0aE5hbWUobm9kZSwgb3B0aW9uc1ZhcmlhYmxlTmFtZSksXG4gICAgICAgIGFwcGx5OiAoYmluZGluZ3MsIG5vZGU6IHRzLlZhcmlhYmxlRGVjbGFyYXRpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluaXRpYWxpemVyID0gbm9kZS5pbml0aWFsaXplcjtcbiAgICAgICAgICAgIGlmIChpbml0aWFsaXplcj8ua2luZCAhPT0gdHMuU3ludGF4S2luZC5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbikgcmV0dXJuIGJpbmRpbmdzO1xuXG4gICAgICAgICAgICAoaW5pdGlhbGl6ZXIgYXMgT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24pLnByb3BlcnRpZXMuZm9yRWFjaCgocHJvcCkgPT4ge1xuICAgICAgICAgICAgICAgIGJpbmRpbmdzID0gdHNDb2xsZWN0KHByb3AsIGJpbmRpbmdzLCB0c09wdGlvbnNDb2xsZWN0b3JzLCBmYWxzZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmdzO1xuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgdHNDb2xsZWN0b3JzLnB1c2goe1xuICAgICAgICBtYXRjaGVzOiAobm9kZSkgPT4gdHNOb2RlSXNHbG9iYWxGdW5jdGlvbkNhbGwobm9kZSksXG4gICAgICAgIGFwcGx5OiAoYmluZGluZ3MsIG5vZGUpID0+IGJpbmRpbmdzLmluaXQucHVzaCh0c0dlbmVyYXRlKG5vZGUsIHRzVHJlZSkpLFxuICAgIH0pO1xuXG4gICAgdHNDb2xsZWN0b3JzLnB1c2goe1xuICAgICAgICBtYXRjaGVzOiAobm9kZSkgPT4gdHNOb2RlSXNUeXBlRGVjbGFyYXRpb24obm9kZSksXG4gICAgICAgIGFwcGx5OiAoYmluZGluZ3MsIG5vZGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRlY2xhcmF0aW9uID0gdHNHZW5lcmF0ZShub2RlLCB0c1RyZWUpO1xuICAgICAgICAgICAgYmluZGluZ3MuZGVjbGFyYXRpb25zLnB1c2goZGVjbGFyYXRpb24pO1xuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gRm9yIFJlYWN0IHdlIG5lZWQgdG8gaWRlbnRpZnkgdGhlIGV4dGVybmFsIGRlcGVuZGVuY2llcyBmb3IgY2FsbGJhY2tzIHRvIHByZXZlbnQgc3RhbGUgY2xvc3VyZXNcbiAgICBjb25zdCBHTE9CQUxfREVQUyA9IG5ldyBTZXQoW1xuICAgICAgICAnY29uc29sZScsXG4gICAgICAgICdkb2N1bWVudCcsXG4gICAgICAgICdFcnJvcicsXG4gICAgICAgICdBZ0NoYXJ0cycsXG4gICAgICAgICdjaGFydCcsXG4gICAgICAgICd3aW5kb3cnLFxuICAgICAgICAnSW1hZ2UnLFxuICAgICAgICAnRGF0ZScsXG4gICAgICAgICd0aGlzJyxcbiAgICBdKTtcbiAgICB0c0NvbGxlY3RvcnMucHVzaCh7XG4gICAgICAgIG1hdGNoZXM6IChub2RlKSA9PiB0c05vZGVJc1RvcExldmVsRnVuY3Rpb24obm9kZSksXG4gICAgICAgIGFwcGx5OiAoYmluZGluZ3MsIG5vZGU6IFNpZ25hdHVyZURlY2xhcmF0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gKG5vZGUgYXMgYW55KS5ib2R5O1xuXG4gICAgICAgICAgICBjb25zdCBhbGxWYXJpYWJsZXMgPSBuZXcgU2V0KGJvZHkgPyBmaW5kQWxsVmFyaWFibGVzKGJvZHkpIDogW10pO1xuICAgICAgICAgICAgaWYgKG5vZGUucGFyYW1ldGVycyAmJiBub2RlLnBhcmFtZXRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIG5vZGUucGFyYW1ldGVycy5mb3JFYWNoKChwKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFsbFZhcmlhYmxlcy5hZGQocC5uYW1lLmdldFRleHQoKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRlcHMgPSBib2R5ID8gZmluZEFsbEFjY2Vzc2VkUHJvcGVydGllcyhib2R5KSA6IFtdO1xuICAgICAgICAgICAgY29uc3QgYWxsRGVwcyA9IGRlcHMuZmlsdGVyKChpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gSWdub3JlIGxvY2FsbHkgZGVmaW5lZCB2YXJpYWJsZXNcbiAgICAgICAgICAgICAgICBjb25zdCBpc1ZhcmlhYmxlID0gYWxsVmFyaWFibGVzLmhhcyhpZCk7XG4gICAgICAgICAgICAgICAgLy8gTGV0J3MgYXNzdW1lIHRoYXQgYWxsIGNhcHMgYXJlIGNvbnN0YW50cyBzbyBzaG91bGQgYmUgaWdub3JlZCwgaS5lIEtFWV9VUFxuICAgICAgICAgICAgICAgIGNvbnN0IGlzQ2Fwc0NvbnN0ID0gaWQgPT09IGlkLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFpc1ZhcmlhYmxlICYmICFpc0NhcHNDb25zdCAmJiAhR0xPQkFMX0RFUFMuaGFzKGlkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGFsbERlcHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGJpbmRpbmdzLmNhbGxiYWNrRGVwZW5kZW5jaWVzW25vZGUubmFtZS5nZXRUZXh0KCldID0gWy4uLm5ldyBTZXQoYWxsRGVwcyldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgLypcbiAgICAgKiBwcm9wZXJ0aWVzIC0+IGNoYXJ0IHJlbGF0ZWQgcHJvcGVydGllc1xuICAgICAqIGdsb2JhbHMgLT4gbm9uZSBjaGFydCByZWxhdGVkIG1ldGhvZHMvdmFyaWFibGVzIChpLmUuIG5vbi1pbnN0YW5jZSlcbiAgICAgKi9cbiAgICBjb25zdCB0c0JpbmRpbmdzID0gdHNDb2xsZWN0KFxuICAgICAgICB0c1RyZWUsXG4gICAgICAgIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IFtdLFxuICAgICAgICAgICAgY2hhcnRQcm9wZXJ0aWVzOiB7fSxcbiAgICAgICAgICAgIGV4dGVybmFsRXZlbnRIYW5kbGVyczogW10sXG4gICAgICAgICAgICBpbnN0YW5jZU1ldGhvZHM6IFtdLFxuICAgICAgICAgICAgZ2xvYmFsczogW10sXG4gICAgICAgICAgICBpbml0OiBbXSxcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uczogW10sXG4gICAgICAgICAgICBjYWxsYmFja0RlcGVuZGVuY2llczoge30sXG4gICAgICAgIH0sXG4gICAgICAgIHRzQ29sbGVjdG9yc1xuICAgICk7XG5cbiAgICAvLyBNdXN0IGJlIHJlY29yZCBmb3Igc2VyaWFsaXphdGlvblxuICAgIGNvbnN0IHBsYWNlaG9sZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIGNvbnN0IGNoYXJ0QXR0cmlidXRlczogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgc3RyaW5nPj4gPSB7fTtcblxuICAgIGRvbVRyZWUoJ2RpdltpZF0nKS5lYWNoKChpbmRleCwgZWxlbSkgPT4ge1xuICAgICAgICBjb25zdCB7IGlkLCAuLi5yZXN0IH0gPSBlbGVtLmF0dHJpYnM7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlUGxhY2Vob2xkZXIgPSBgJCRDSEFSVCR7aW5kZXh9JCRgO1xuICAgICAgICBwbGFjZWhvbGRlcnNbaWRdID0gdGVtcGxhdGVQbGFjZWhvbGRlcjtcbiAgICAgICAgY2hhcnRBdHRyaWJ1dGVzW2lkXSA9IHJlc3Q7XG4gICAgICAgIGRvbVRyZWUoZWxlbSkucmVwbGFjZVdpdGgodGVtcGxhdGVQbGFjZWhvbGRlcik7XG4gICAgfSk7XG5cbiAgICB0c0JpbmRpbmdzLnBsYWNlaG9sZGVycyA9IHBsYWNlaG9sZGVycztcbiAgICB0c0JpbmRpbmdzLmNoYXJ0QXR0cmlidXRlcyA9IGNoYXJ0QXR0cmlidXRlcztcbiAgICB0c0JpbmRpbmdzLnRlbXBsYXRlID0gZG9tVHJlZS5odG1sKCk7XG4gICAgdHNCaW5kaW5ncy5pbXBvcnRzID0gZXh0cmFjdEltcG9ydFN0YXRlbWVudHModHNUcmVlKTtcbiAgICB0c0JpbmRpbmdzLm9wdGlvbnNUeXBlSW5mbyA9IGV4dHJhY3RUeXBlSW5mb0ZvclZhcmlhYmxlKHRzVHJlZSwgJ29wdGlvbnMnKTtcbiAgICB0c0JpbmRpbmdzLnVzZXNDaGFydEFwaSA9IHVzZXNDaGFydEFwaSh0c1RyZWUpO1xuICAgIHRzQmluZGluZ3MuY2hhcnRTZXR0aW5ncyA9IGV4YW1wbGVTZXR0aW5ncztcblxuICAgIHJldHVybiB0c0JpbmRpbmdzO1xufVxuXG5leHBvcnQgZGVmYXVsdCBwYXJzZXI7XG4iXSwibmFtZXMiOlsiaW50ZXJuYWxQYXJzZXIiLCJwYXJzZXIiLCJjaGFydFZhcmlhYmxlTmFtZSIsIm9wdGlvbnNWYXJpYWJsZU5hbWUiLCJ0c0dlbmVyYXRlV2l0aE9wdGlvblJlZmVyZW5jZXMiLCJub2RlIiwic3JjRmlsZSIsInRzR2VuZXJhdGUiLCJyZXBsYWNlIiwiUmVnRXhwIiwiaHRtbCIsImV4YW1wbGVTZXR0aW5ncyIsImJpbmRpbmdzIiwicmVhZEFzSnNGaWxlIiwiaW5jbHVkZUltcG9ydHMiLCJ0eXBlZEJpbmRpbmdzIiwianMiLCJkb21UcmVlIiwiY2hlZXJpbyIsImxvYWQiLCJyZW1vdmUiLCJkb21FdmVudEhhbmRsZXJzIiwiZXh0cmFjdEV2ZW50SGFuZGxlcnMiLCJyZWNvZ25pemVkRG9tRXZlbnRzIiwidHNUcmVlIiwicGFyc2VGaWxlIiwidHNDb2xsZWN0b3JzIiwidHNPcHRpb25zQ29sbGVjdG9ycyIsInJlZ2lzdGVyZWQiLCJmb3JFYWNoIiwiXyIsImhhbmRsZXIiLCJwYXJhbXMiLCJpbmRleE9mIiwicHVzaCIsIm1hdGNoZXMiLCJ0c05vZGVJc0Z1bmN0aW9uV2l0aE5hbWUiLCJhcHBseSIsImV4dGVybmFsRXZlbnRIYW5kbGVycyIsIm5hbWUiLCJib2R5IiwidW5ib3VuZEluc3RhbmNlTWV0aG9kcyIsImV4dHJhY3RVbmJvdW5kSW5zdGFuY2VNZXRob2RzIiwidHNOb2RlSXNJblNjb3BlIiwiaW5zdGFuY2VNZXRob2RzIiwicmVtb3ZlSW5TY29wZUpzRG9jIiwidHNOb2RlSXNVbnVzZWRGdW5jdGlvbiIsImdsb2JhbHMiLCJ0c05vZGVJc1Byb3BlcnR5V2l0aE5hbWUiLCJpbml0aWFsaXplciIsInRzTm9kZUlzRnVuY3Rpb25DYWxsIiwidHNOb2RlSXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb25PZiIsImV4cHJlc3Npb24iLCJFcnJvciIsInByb3BlcnR5QXNzaWdubWVudCIsInRzTm9kZUlzR2xvYmFsVmFyIiwicGFyZW50IiwicHJvcGVydHlOYW1lIiwiZXNjYXBlZFRleHQiLCJpZCIsImFyZ3VtZW50cyIsInRleHQiLCJjb2RlIiwiY2hhcnRQcm9wZXJ0aWVzIiwicHJvcGVydGllcyIsInZhbHVlIiwidHNOb2RlSXNUb3BMZXZlbFZhcmlhYmxlIiwiaW5jbHVkZXMiLCJ0c05vZGVJc0dsb2JhbFZhcldpdGhOYW1lIiwia2luZCIsInRzIiwiU3ludGF4S2luZCIsIk9iamVjdExpdGVyYWxFeHByZXNzaW9uIiwicHJvcCIsInRzQ29sbGVjdCIsInRzTm9kZUlzR2xvYmFsRnVuY3Rpb25DYWxsIiwiaW5pdCIsInRzTm9kZUlzVHlwZURlY2xhcmF0aW9uIiwiZGVjbGFyYXRpb24iLCJkZWNsYXJhdGlvbnMiLCJHTE9CQUxfREVQUyIsIlNldCIsInRzTm9kZUlzVG9wTGV2ZWxGdW5jdGlvbiIsImFsbFZhcmlhYmxlcyIsImZpbmRBbGxWYXJpYWJsZXMiLCJwYXJhbWV0ZXJzIiwibGVuZ3RoIiwicCIsImFkZCIsImdldFRleHQiLCJkZXBzIiwiZmluZEFsbEFjY2Vzc2VkUHJvcGVydGllcyIsImFsbERlcHMiLCJmaWx0ZXIiLCJpc1ZhcmlhYmxlIiwiaGFzIiwiaXNDYXBzQ29uc3QiLCJ0b1VwcGVyQ2FzZSIsImNhbGxiYWNrRGVwZW5kZW5jaWVzIiwidHNCaW5kaW5ncyIsInBsYWNlaG9sZGVycyIsImNoYXJ0QXR0cmlidXRlcyIsImVhY2giLCJpbmRleCIsImVsZW0iLCJhdHRyaWJzIiwicmVzdCIsInRlbXBsYXRlUGxhY2Vob2xkZXIiLCJyZXBsYWNlV2l0aCIsInRlbXBsYXRlIiwiaW1wb3J0cyIsImV4dHJhY3RJbXBvcnRTdGF0ZW1lbnRzIiwib3B0aW9uc1R5cGVJbmZvIiwiZXh0cmFjdFR5cGVJbmZvRm9yVmFyaWFibGUiLCJ1c2VzQ2hhcnRBcGkiLCJjaGFydFNldHRpbmdzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQTJQQSxPQUFzQjtlQUF0Qjs7SUFyTWdCQSxjQUFjO2VBQWRBOztJQWRBQyxNQUFNO2VBQU5BOzs7Ozs7bUVBeENTO3FFQUVWOzZCQTZCUjtBQUVQLE1BQU1DLG9CQUFvQjtBQUMxQixNQUFNQyxzQkFBc0I7QUFFNUIsU0FBU0MsK0JBQStCQyxJQUFJLEVBQUVDLE9BQU87SUFDakQsT0FBT0MsSUFBQUEsdUJBQVUsRUFBQ0YsTUFBTUMsU0FBU0UsT0FBTyxDQUFDLElBQUlDLE9BQU8sQ0FBQyx1Q0FBdUMsQ0FBQyxFQUFFLE1BQU07QUFDekc7QUFFTyxTQUFTUixPQUFPLEVBQ25CSyxPQUFPLEVBQ1BJLElBQUksRUFDSkMsZUFBZSxFQUtsQjtJQUNHLE1BQU1DLFdBQVdaLGVBQWVhLElBQUFBLHlCQUFZLEVBQUNQLFNBQVM7UUFBRVEsZ0JBQWdCO0lBQUssSUFBSUosTUFBTUM7SUFDdkYsTUFBTUksZ0JBQWdCZixlQUFlTSxTQUFTSSxNQUFNQztJQUNwRCxPQUFPO1FBQUVDO1FBQVVHO0lBQWM7QUFDckM7QUFFTyxTQUFTZixlQUFlZ0IsRUFBRSxFQUFFTixJQUFJLEVBQUVDLGVBQWU7SUFDcEQsTUFBTU0sVUFBVUMsU0FBUUMsSUFBSSxDQUFDVCxNQUFNLE1BQU07SUFDekNPLFFBQVEsU0FBU0csTUFBTTtJQUV2QixNQUFNQyxtQkFBbUJD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