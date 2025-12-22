/**
 * @fileoverview Validates that ModuleRegistry.registerModules includes all required modules
 */
import {
    annotationsPluginToModule,
    axisModuleCompatibility,
    axisPluginToModule,
    axisTypeToModule,
    bundleContents,
    cartesianSeriesModules,
    enterpriseModules,
    intrinsicDefaults,
    moduleToPackage,
    pluginOptionToModule,
    polarSeriesModules,
    seriesChartType,
    seriesDefaultAxes,
    seriesPluginToModule,
    seriesTypeToModule,
    validModuleIds,
} from './module-mappings.mjs';

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description:
                'Validates that ModuleRegistry.registerModules includes all modules required by chart options.',
            recommended: 'error',
        },
        messages: {
            missingModule: "Module '{{moduleId}}' is required for {{reason}} but not registered.",
            unnecessaryModule: "Module '{{moduleId}}' is registered but not used by chart options.",
            unknownModule: "Unknown module '{{moduleId}}' in registerModules call.",
            redundantModule: "Module '{{moduleId}}' is already included in registered bundle '{{bundleId}}'.",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    warnOverRegistration: {
                        type: 'boolean',
                        default: true,
                    },
                },
                additionalProperties: false,
            },
        ],
    },

    defaultOptions: [{ warnOverRegistration: true }],

    create(context) {
        const options = context.options[0] || {};
        const warnOverRegistration = options.warnOverRegistration !== false;

        // Track state across the file
        let registeredModules = new Set();
        let registeredModuleNodes = new Map(); // moduleId -> AST node
        let registeredModulesNode = null;
        let registeredModulesArrayNode = null;
        let requiredModules = new Map(); // moduleId -> { reason, node }
        let isEnterprise = false;
        let explicitAxes = new Set(); // tracks 'x', 'y', 'angle', 'radius'
        let seriesTypes = [];

        // Import tracking for auto-fix
        let importedModules = new Map(); // moduleId -> { node, packageName }
        let importDeclarations = new Map(); // packageName -> ImportDeclaration node

        /**
         * Expand bundle modules to their contents
         */
        function expandBundles(modules) {
            const expanded = new Set();
            for (const mod of modules) {
                if (bundleContents.has(mod)) {
                    for (const contained of bundleContents.get(mod)) {
                        expanded.add(contained);
                    }
                    // Also add the bundle itself as registered
                    expanded.add(mod);
                } else {
                    expanded.add(mod);
                }
            }
            return expanded;
        }

        /**
         * Add a required module with reason
         */
        function requireModule(moduleId, reason, node) {
            if (!requiredModules.has(moduleId)) {
                requiredModules.set(moduleId, { reason, node });
            }
        }

        /**
         * Check if a module is satisfied by registration (including bundles)
         */
        function isModuleSatisfied(moduleId, expandedModules) {
            return expandedModules.has(moduleId);
        }

        /**
         * Get string value from a node (handles Literal and some simple cases)
         */
        function getStringValue(node) {
            if (!node) return null;
            if (node.type === 'Literal' && typeof node.value === 'string') {
                return node.value;
            }
            return null;
        }

        /**
         * Check if this is a ModuleRegistry.registerModules call
         */
        function isRegisterModulesCall(node) {
            if (node.type !== 'CallExpression') return false;
            const callee = node.callee;
            if (callee.type !== 'MemberExpression') return false;
            const obj = callee.object;
            const prop = callee.property;
            return (
                obj.type === 'Identifier' &&
                obj.name === 'ModuleRegistry' &&
                prop.type === 'Identifier' &&
                prop.name === 'registerModules'
            );
        }

        /**
         * Extract module names from registerModules array argument
         */
        function extractRegisteredModules(node) {
            const modules = new Set();
            if (node.arguments.length === 0) return modules;

            const arg = node.arguments[0];
            if (arg.type !== 'ArrayExpression') return modules;

            registeredModulesArrayNode = arg;

            for (const element of arg.elements) {
                if (element && element.type === 'Identifier') {
                    modules.add(element.name);
                    registeredModuleNodes.set(element.name, element);
                }
            }
            return modules;
        }

        /**
         * Unwrap TypeScript type assertions and parenthesized expressions
         */
        function unwrapExpressions(node) {
            if (!node) return node;
            while (
                node.type === 'TSAsExpression' ||
                node.type === 'TSSatisfiesExpression' ||
                node.type === 'ParenthesizedExpression'
            ) {
                node = node.expression;
            }
            return node;
        }

        /**
         * Process a single series object to find required modules
         */
        function processSeriesObject(element, parentNode) {
            element = unwrapExpressions(element);
            if (!element || element.type !== 'ObjectExpression') return;

            for (const prop of element.properties) {
                if (prop.type !== 'Property') continue;
                const keyName = prop.key.type === 'Identifier' ? prop.key.name : getStringValue(prop.key);

                if (keyName === 'type') {
                    // Unwrap 'map-line' as const -> 'map-line'
                    const typeValue = unwrapExpressions(prop.value);
                    const seriesType = getStringValue(typeValue);
                    if (seriesType) {
                        seriesTypes.push(seriesType);
                        const moduleId = seriesTypeToModule.get(seriesType);
                        if (moduleId) {
                            requireModule(moduleId, `series type '${seriesType}'`, prop);
                        }
                    }
                }

                // Check for series plugins (errorBar)
                if (keyName && seriesPluginToModule.has(keyName)) {
                    const moduleId = seriesPluginToModule.get(keyName);
                    requireModule(moduleId, `series option '${keyName}'`, prop);
                }
            }
        }

        /**
         * Extract return value from a function body
         */
        function extractReturnValue(body) {
            if (!body) return null;

            // Expression body: d => ({ type: 'bar' })
            body = unwrapExpressions(body);
            if (body.type === 'ObjectExpression') {
                return body;
            }

            // Block body: d => { return { type: 'bar' }; }
            if (body.type === 'BlockStatement') {
                for (const stmt of body.body) {
                    if (stmt.type === 'ReturnStatement' && stmt.argument) {
                        return unwrapExpressions(stmt.argument);
                    }
                }
            }

            return null;
        }

        /**
         * Process a CallExpression that may contain series (e.g., data.map())
         */
        function processSeriesCallExpression(callExpr, parentNode) {
            const callback = callExpr.arguments[0];
            if (callback && (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression')) {
                const returnValue = extractReturnValue(callback.body);
                if (returnValue && returnValue.type === 'ObjectExpression') {
                    processSeriesObject(returnValue, parentNode);
                }
            }
        }

        /**
         * Process series array to find required modules
         */
        function processSeriesArray(seriesArray, parentNode) {
            seriesArray = unwrapExpressions(seriesArray);

            if (seriesArray.type === 'ArrayExpression') {
                for (const element of seriesArray.elements) {
                    if (!element) continue;

                    // Handle spread elements: ...data.map(...)
                    if (element.type === 'SpreadElement') {
                        const spreadArg = unwrapExpressions(element.argument);
                        if (spreadArg.type === 'CallExpression') {
                            processSeriesCallExpression(spreadArg, parentNode);
                        }
                        continue;
                    }

                    processSeriesObject(element, parentNode);
                }
            } else if (seriesArray.type === 'CallExpression') {
                // Handle computed series like: series: data.map(d => ({ type: 'bar', ... }))
                processSeriesCallExpression(seriesArray, parentNode);
            }
        }

        /**
         * Process axes object to find required modules
         */
        function processAxes(axesNode, parentNode) {
            if (axesNode.type !== 'ObjectExpression') return;

            // Object format: axes: { x: { type: '...' }, y: { type: '...' } }
            for (const prop of axesNode.properties) {
                if (prop.type !== 'Property') continue;
                if (prop.value.type !== 'ObjectExpression') continue;

                // Track which axis key was explicitly defined
                const axisKey = prop.key.type === 'Identifier' ? prop.key.name : getStringValue(prop.key);
                if (axisKey) {
                    explicitAxes.add(axisKey);
                }

                processAxisObject(prop.value, prop);
            }
        }

        /**
         * Process a single axis object
         */
        function processAxisObject(axisObj, parentNode) {
            for (const prop of axisObj.properties) {
                if (prop.type !== 'Property') continue;
                const keyName = prop.key.type === 'Identifier' ? prop.key.name : getStringValue(prop.key);

                if (keyName === 'type') {
                    const axisType = getStringValue(prop.value);
                    if (axisType) {
                        const moduleId = axisTypeToModule.get(axisType);
                        if (moduleId) {
                            requireModule(moduleId, `axis type '${axisType}'`, prop);
                        }
                    }
                }

                // Check for axis plugins (crosshair, bandHighlight)
                if (keyName && axisPluginToModule.has(keyName)) {
                    // Skip if feature is explicitly disabled (e.g., crosshair: { enabled: false })
                    if (isFeatureDisabled(prop.value)) {
                        continue;
                    }
                    const moduleId = axisPluginToModule.get(keyName);
                    requireModule(moduleId, `axis option '${keyName}'`, prop);
                }
            }
        }

        /**
         * Process top-level plugin options
         */
        function processPluginOption(keyName, valueNode, propNode) {
            if (pluginOptionToModule.has(keyName)) {
                // Skip if feature is explicitly disabled (e.g., legend: { enabled: false })
                if (isFeatureDisabled(valueNode)) {
                    return;
                }
                const moduleId = pluginOptionToModule.get(keyName);
                requireModule(moduleId, `option '${keyName}'`, propNode);
            }

            // Check for nested options under annotations
            if (keyName === 'annotations' && valueNode.type === 'ObjectExpression') {
                for (const nestedProp of valueNode.properties) {
                    if (nestedProp.type !== 'Property') continue;
                    const nestedKey =
                        nestedProp.key.type === 'Identifier' ? nestedProp.key.name : getStringValue(nestedProp.key);
                    if (nestedKey && annotationsPluginToModule.has(nestedKey)) {
                        const nestedModuleId = annotationsPluginToModule.get(nestedKey);
                        requireModule(nestedModuleId, `annotations.${nestedKey} option`, nestedProp);
                    }
                }
            }
        }

        /**
         * Check if a feature config has enabled: false
         */
        function isFeatureDisabled(node) {
            if (node.type !== 'ObjectExpression') return false;
            for (const prop of node.properties) {
                if (prop.type !== 'Property') continue;
                const keyName = prop.key.type === 'Identifier' ? prop.key.name : null;
                if (keyName === 'enabled' && prop.value.type === 'Literal' && prop.value.value === false) {
                    return true;
                }
            }
            return false;
        }

        // Property keys whose values should not be interpreted as series/axis types
        const excludedPropertyKeys = new Set([
            // Data keys
            'xKey',
            'yKey',
            'sizeKey',
            'colorKey',
            'labelKey',
            'angleKey',
            'radiusKey',
            'calloutLabelKey',
            'sectorLabelKey',
            'fromKey',
            'toKey',
            'openKey',
            'closeKey',
            'highKey',
            'lowKey',
            'yLowKey',
            'yHighKey',
            // Shape/style properties
            'shape',
            // Non-chart contexts
            'crossLines',
            'annotations',
            'targets',
            // Callback properties
            'formatter',
            'renderer',
            'comparator',
            // Other
            'department',
            'category',
        ]);

        /**
         * Check if a literal is in a context where it should not be interpreted as a type
         */
        function isLiteralInExcludedContext(node) {
            const ancestors = context.sourceCode.getAncestors(node);

            for (let i = ancestors.length - 1; i >= 0; i--) {
                const ancestor = ancestors[i];

                // Skip if inside a function body (formatters, renderers, callbacks)
                if (ancestor.type === 'ArrowFunctionExpression' || ancestor.type === 'FunctionExpression') {
                    // Check if this function is a property value (e.g., formatter: () => ...)
                    const funcParentIndex = i - 1;
                    if (funcParentIndex >= 0 && ancestors[funcParentIndex]?.type === 'Property') {
                        return true; // Exclude literals inside callback functions
                    }
                }

                // Skip if inside excluded property context
                if (ancestor.type === 'Property' && ancestor.key.type === 'Identifier') {
                    if (excludedPropertyKeys.has(ancestor.key.name)) {
                        return true;
                    }
                }
            }

            return false;
        }

        /**
         * Create a fixer to remove a module from the registerModules array
         */
        function createRemoveModuleFixer(moduleId) {
            const moduleNode = registeredModuleNodes.get(moduleId);
            if (!moduleNode || !registeredModulesArrayNode) return null;

            return function (fixer) {
                const sourceCode = context.sourceCode || context.getSourceCode();
                const elements = registeredModulesArrayNode.elements;
                const index = elements.indexOf(moduleNode);

                if (index === -1) return null;

                // Determine the range to remove (including comma and whitespace)
                let start = moduleNode.range[0];
                let end = moduleNode.range[1];

                if (index < elements.length - 1) {
                    // Not the last element - remove trailing comma and whitespace
                    const nextElement = elements[index + 1];
                    if (nextElement) {
                        const textBetween = sourceCode.text.slice(end, nextElement.range[0]);
                        const commaMatch = textBetween.match(/^[\s,]*/);
                        if (commaMatch) {
                            end += commaMatch[0].length;
                        }
                    }
                } else if (index > 0) {
                    // Last element - remove preceding comma and whitespace
                    const prevElement = elements[index - 1];
                    if (prevElement) {
                        const textBetween = sourceCode.text.slice(prevElement.range[1], start);
                        const commaMatch = textBetween.match(/[\s,]*$/);
                        if (commaMatch) {
                            start -= commaMatch[0].length;
                        }
                    }
                }

                return fixer.removeRange([start, end]);
            };
        }

        /**
         * Check if an array node spans multiple lines
         */
        function isArrayMultiline(arrayNode) {
            return arrayNode.loc.start.line !== arrayNode.loc.end.line;
        }

        /**
         * Detect the indentation used for array elements
         */
        function detectIndentation(node) {
            const sourceCode = context.sourceCode || context.getSourceCode();
            const lineStart = sourceCode.getIndexFromLoc({ line: node.loc.start.line, column: 0 });
            const textBeforeNode = sourceCode.text.slice(lineStart, node.range[0]);
            const match = textBeforeNode.match(/^(\s*)/);
            return match ? match[1] : '    ';
        }

        /**
         * Create a fixer to add a module to the registerModules array and import if needed
         */
        function createAddModuleFixer(moduleId) {
            if (!registeredModulesArrayNode) return null;

            const packageName = moduleToPackage.get(moduleId);
            if (!packageName) return null; // Can't fix if we don't know the package

            return function* (fixer) {
                const sourceCode = context.sourceCode || context.getSourceCode();

                // Part 1: Add import if needed
                if (!importedModules.has(moduleId)) {
                    const existingImport = importDeclarations.get(packageName);

                    if (existingImport && existingImport.specifiers.length > 0) {
                        // Add to existing import: import { A } from '...' -> import { A, B } from '...'
                        const lastSpecifier = existingImport.specifiers[existingImport.specifiers.length - 1];
                        yield fixer.insertTextAfter(lastSpecifier, `, ${moduleId}`);
                    } else {
                        // Create new import at top of file
                        const importText = `import { ${moduleId} } from '${packageName}';\n`;
                        yield fixer.insertTextBefore(sourceCode.ast.body[0], importText);
                    }
                }

                // Part 2: Add to registerModules array
                const elements = registeredModulesArrayNode.elements;

                if (elements.length === 0) {
                    // Empty array: insert as first element
                    const openBracket = sourceCode.getFirstToken(registeredModulesArrayNode);
                    yield fixer.insertTextAfter(openBracket, moduleId);
                } else {
                    const lastElement = elements[elements.length - 1];
                    const multiline = isArrayMultiline(registeredModulesArrayNode);

                    if (multiline) {
                        // Detect indentation from existing elements
                        const indent = detectIndentation(lastElement);
                        yield fixer.insertTextAfter(lastElement, `,\n${indent}${moduleId}`);
                    } else {
                        yield fixer.insertTextAfter(lastElement, `, ${moduleId}`);
                    }
                }
            };
        }

        /**
         * Get intrinsic default modules (commonly registered without explicit options)
         */
        function getIntrinsicDefaults() {
            const defaults = new Set(intrinsicDefaults.always);
            if (isEnterprise) {
                for (const mod of intrinsicDefaults.enterprise) {
                    defaults.add(mod);
                }
            }
            // Check if any series is cartesian type (from options parsing)
            const hasCartesianSeries = seriesTypes.some((type) => seriesChartType.get(type) === 'cartesian');
            // Also check if any registered module is a cartesian series module (for dynamic series)
            const hasCartesianSeriesModule = [...registeredModules].some((mod) => cartesianSeriesModules.has(mod));
            if ((hasCartesianSeries || hasCartesianSeriesModule) && intrinsicDefaults.cartesian) {
                for (const mod of intrinsicDefaults.cartesian) {
                    defaults.add(mod);
                }
            }
            // Check if any series is polar type (from options parsing)
            const hasPolarSeries = seriesTypes.some((type) => seriesChartType.get(type) === 'polar');
            // Also check if any registered module is a polar series module (for dynamic series)
            const hasPolarSeriesModule = [...registeredModules].some((mod) => polarSeriesModules.has(mod));
            if ((hasPolarSeries || hasPolarSeriesModule) && intrinsicDefaults.polar) {
                for (const mod of intrinsicDefaults.polar) {
                    defaults.add(mod);
                }
            }
            return defaults;
        }

        /**
         * Check if a compatible axis module is registered that satisfies the default axis requirement.
         * Returns true only if a DIFFERENT compatible module is registered (not the exact module).
         * This allows us to skip requiring CategoryAxisModule when GroupedCategoryAxisModule is registered.
         */
        function isAxisRequirementSatisfiedByCompatible(moduleId, expandedModules) {
            // Check if a compatible module is registered (e.g., GroupedCategoryAxisModule for CategoryAxisModule)
            const compatibleModules = axisModuleCompatibility.get(moduleId);
            if (compatibleModules) {
                return compatibleModules.some((compatMod) => expandedModules.has(compatMod));
            }

            return false;
        }

        /**
         * Apply default axes based on series types
         */
        function applyDefaultAxes() {
            const expandedRegistered = expandBundles(registeredModules);

            for (const seriesType of seriesTypes) {
                const defaults = seriesDefaultAxes.get(seriesType);
                if (defaults) {
                    // Cartesian axes (x, y) - only apply if not explicitly defined
                    if (defaults.x && !explicitAxes.has('x')) {
                        const moduleId = axisTypeToModule.get(defaults.x);
                        if (moduleId && !isAxisRequirementSatisfiedByCompatible(moduleId, expandedRegistered)) {
                            requireModule(moduleId, `default axis for '${seriesType}' series`, null);
                        }
                    }
                    if (defaults.y && !explicitAxes.has('y')) {
                        const moduleId = axisTypeToModule.get(defaults.y);
                        if (moduleId && !isAxisRequirementSatisfiedByCompatible(moduleId, expandedRegistered)) {
                            requireModule(moduleId, `default axis for '${seriesType}' series`, null);
                        }
                    }
                    // Polar axes (angle, radius) - only apply if not explicitly defined
                    if (defaults.angle && !explicitAxes.has('angle')) {
                        const moduleId = axisTypeToModule.get(defaults.angle);
                        if (moduleId && !isAxisRequirementSatisfiedByCompatible(moduleId, expandedRegistered)) {
                            requireModule(moduleId, `default axis for '${seriesType}' series`, null);
                        }
                    }
                    if (defaults.radius && !explicitAxes.has('radius')) {
                        const moduleId = axisTypeToModule.get(defaults.radius);
                        if (moduleId && !isAxisRequirementSatisfiedByCompatible(moduleId, expandedRegistered)) {
                            requireModule(moduleId, `default axis for '${seriesType}' series`, null);
                        }
                    }
                }
            }
        }

        return {
            // Track imports for auto-fix and enterprise detection
            ImportDeclaration(node) {
                const packageName = node.source.value;

                // Track enterprise detection (existing behaviour)
                if (packageName === 'ag-charts-enterprise') {
                    isEnterprise = true;
                }

                // Track all AG Charts imports for auto-fix
                if (packageName === 'ag-charts-community' || packageName === 'ag-charts-enterprise') {
                    importDeclarations.set(packageName, node);

                    for (const specifier of node.specifiers) {
                        if (specifier.type === 'ImportSpecifier' && specifier.imported) {
                            const moduleName = specifier.imported.name;
                            importedModules.set(moduleName, { node: specifier, packageName });
                        }
                    }
                }
            },

            // Find ModuleRegistry.registerModules([...])
            CallExpression(node) {
                if (isRegisterModulesCall(node)) {
                    registeredModules = extractRegisteredModules(node);
                    registeredModulesNode = node;
                }
            },

            // Find options object properties
            Property(node) {
                // Only process top-level properties of objects that look like chart options
                const keyName = node.key.type === 'Identifier' ? node.key.name : getStringValue(node.key);
                if (!keyName) return;

                if (keyName === 'series') {
                    // Handle series: [...], series: variable, series: data.map(...)
                    processSeriesArray(node.value, node);
                } else if (keyName === 'axes') {
                    processAxes(node.value, node);
                } else if (keyName === 'axis') {
                    // Sparklines use singular 'axis' - mark all axes as explicit to skip default axis application
                    explicitAxes.add('x');
                    explicitAxes.add('y');
                    explicitAxes.add('angle');
                    explicitAxes.add('radius');
                    // Process the axis type if it's an object with type property
                    if (node.value.type === 'ObjectExpression') {
                        processAxisObject(node.value, node);
                    }
                } else if (pluginOptionToModule.has(keyName)) {
                    processPluginOption(keyName, node.value, node);
                } else if (keyName === 'type') {
                    // Handle type properties anywhere in the file
                    const typeValue = getStringValue(node.value);
                    if (!typeValue) return;

                    // Skip types in non-chart contexts (crossLines, annotations)
                    const ancestors = context.sourceCode.getAncestors(node);
                    const isInNonSeriesContext = ancestors.some(
                        (a) =>
                            a.type === 'Property' &&
                            a.key.type === 'Identifier' &&
                            (a.key.name === 'crossLines' || a.key.name === 'annotations')
                    );
                    if (isInNonSeriesContext) return;

                    // Check if it's a series type
                    if (seriesTypeToModule.has(typeValue)) {
                        seriesTypes.push(typeValue);
                        const moduleId = seriesTypeToModule.get(typeValue);
                        requireModule(moduleId, `series type '${typeValue}'`, node);
                    }

                    // Check if it's an axis type
                    if (axisTypeToModule.has(typeValue)) {
                        const moduleId = axisTypeToModule.get(typeValue);
                        requireModule(moduleId, `axis type '${typeValue}'`, node);
                    }
                }
            },

            // Scan ALL string literals in the file for known series/axis types
            // This catches dynamic patterns like: case 'bar':, type === 'bar' ? ...
            Literal(node) {
                if (typeof node.value !== 'string') return;
                const value = node.value;

                // Skip if in excluded context (data keys, callbacks, shapes, etc.)
                if (isLiteralInExcludedContext(node)) return;

                // Check if it's a known series type
                if (seriesTypeToModule.has(value)) {
                    seriesTypes.push(value);
                    const moduleId = seriesTypeToModule.get(value);
                    requireModule(moduleId, `series type '${value}'`, node);
                }

                // Check if it's a known axis type and require the module
                if (axisTypeToModule.has(value)) {
                    const moduleId = axisTypeToModule.get(value);
                    requireModule(moduleId, `axis type '${value}'`, node);
                }
            },

            // Report at end of file
            'Program:exit'() {
                // If no registerModules call found, skip validation
                if (registeredModules.size === 0 && !registeredModulesNode) {
                    return;
                }

                // Apply default axes based on series
                applyDefaultAxes();

                // Expand bundles in registered modules
                const expandedRegistered = expandBundles(registeredModules);

                // Get intrinsic defaults (modules that are OK to register without explicit options)
                const intrinsicDefaultSet = getIntrinsicDefaults();

                // Check for missing modules
                for (const [moduleId, info] of requiredModules) {
                    if (!isModuleSatisfied(moduleId, expandedRegistered)) {
                        context.report({
                            node: info.node || registeredModulesNode,
                            messageId: 'missingModule',
                            data: { moduleId, reason: info.reason },
                            fix: createAddModuleFixer(moduleId),
                        });
                    }
                }

                // Check for redundant modules already included in bundles
                if (registeredModulesNode) {
                    for (const moduleId of registeredModules) {
                        // Skip bundles themselves
                        if (bundleContents.has(moduleId)) continue;

                        // Check if this module is contained in any registered bundle
                        for (const bundleId of registeredModules) {
                            if (bundleContents.has(bundleId) && bundleContents.get(bundleId).includes(moduleId)) {
                                context.report({
                                    node: registeredModuleNodes.get(moduleId) || registeredModulesNode,
                                    messageId: 'redundantModule',
                                    data: { moduleId, bundleId },
                                    fix: createRemoveModuleFixer(moduleId),
                                });
                                break; // Only report once per module
                            }
                        }
                    }
                }

                // Check for over-registration
                if (warnOverRegistration && registeredModulesNode) {
                    const requiredSet = new Set(requiredModules.keys());

                    for (const moduleId of registeredModules) {
                        // Skip bundles - they're expected to include more than needed
                        if (bundleContents.has(moduleId)) continue;

                        // Skip if it's a required module
                        if (requiredSet.has(moduleId)) continue;

                        // Skip intrinsic defaults (commonly registered modules)
                        if (intrinsicDefaultSet.has(moduleId)) continue;

                        // Skip if it's contained in a required module's bundle
                        let isContainedInRequired = false;
                        for (const reqMod of requiredSet) {
                            if (bundleContents.has(reqMod) && bundleContents.get(reqMod).includes(moduleId)) {
                                isContainedInRequired = true;
                                break;
                            }
                        }
                        if (isContainedInRequired) continue;

                        // Check if it's a valid module ID
                        if (!validModuleIds.has(moduleId)) {
                            context.report({
                                node: registeredModuleNodes.get(moduleId) || registeredModulesNode,
                                messageId: 'unknownModule',
                                data: { moduleId },
                                fix: createRemoveModuleFixer(moduleId),
                            });
                        } else {
                            context.report({
                                node: registeredModuleNodes.get(moduleId) || registeredModulesNode,
                                messageId: 'unnecessaryModule',
                                data: { moduleId },
                                fix: createRemoveModuleFixer(moduleId),
                            });
                        }
                    }
                }
            },
        };
    },
};
