/**
 * @fileoverview Validates that ModuleRegistry.registerModules includes all required modules
 */
import {
    annotationsPluginToModule,
    axisPluginToModule,
    axisTypeToModule,
    bundleContents,
    cartesianSeriesModules,
    enterpriseModules,
    intrinsicDefaults,
    pluginOptionToModule,
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
        let hasExplicitAxes = false;
        let seriesTypes = [];

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
         * Process series array to find required modules
         */
        function processSeriesArray(seriesArray, parentNode) {
            if (seriesArray.type !== 'ArrayExpression') return;

            for (const element of seriesArray.elements) {
                if (!element || element.type !== 'ObjectExpression') continue;

                let seriesType = null;
                let seriesNode = element;

                for (const prop of element.properties) {
                    if (prop.type !== 'Property') continue;
                    const keyName = prop.key.type === 'Identifier' ? prop.key.name : getStringValue(prop.key);

                    if (keyName === 'type') {
                        seriesType = getStringValue(prop.value);
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
        }

        /**
         * Process axes object or array to find required modules
         */
        function processAxes(axesNode, parentNode) {
            hasExplicitAxes = true;

            if (axesNode.type === 'ObjectExpression') {
                // Object format: axes: { x: { type: '...' }, y: { type: '...' } }
                for (const prop of axesNode.properties) {
                    if (prop.type !== 'Property') continue;
                    if (prop.value.type !== 'ObjectExpression') continue;

                    processAxisObject(prop.value, prop);
                }
            } else if (axesNode.type === 'ArrayExpression') {
                // Array format: axes: [{ type: '...' }, { type: '...' }]
                for (const element of axesNode.elements) {
                    if (!element || element.type !== 'ObjectExpression') continue;
                    processAxisObject(element, element);
                }
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
            return defaults;
        }

        /**
         * Apply default axes based on series types
         */
        function applyDefaultAxes() {
            if (hasExplicitAxes) return;

            for (const seriesType of seriesTypes) {
                const defaults = seriesDefaultAxes.get(seriesType);
                if (defaults) {
                    if (defaults.x) {
                        const moduleId = axisTypeToModule.get(defaults.x);
                        if (moduleId) {
                            requireModule(moduleId, `default axis for '${seriesType}' series`, null);
                        }
                    }
                    if (defaults.y) {
                        const moduleId = axisTypeToModule.get(defaults.y);
                        if (moduleId) {
                            requireModule(moduleId, `default axis for '${seriesType}' series`, null);
                        }
                    }
                }
            }
        }

        return {
            // Check for enterprise imports
            ImportDeclaration(node) {
                if (node.source.value === 'ag-charts-enterprise') {
                    isEnterprise = true;
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

                if (keyName === 'series' && node.value.type === 'ArrayExpression') {
                    processSeriesArray(node.value, node);
                } else if (keyName === 'axes') {
                    processAxes(node.value, node);
                } else if (pluginOptionToModule.has(keyName)) {
                    processPluginOption(keyName, node.value, node);
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

                // Check for missing modules (skip intrinsic modules - they're typically included)
                for (const [moduleId, info] of requiredModules) {
                    // Skip intrinsic modules - they're expected to be included without explicit registration check
                    if (intrinsicDefaultSet.has(moduleId)) continue;

                    if (!isModuleSatisfied(moduleId, expandedRegistered)) {
                        context.report({
                            node: info.node || registeredModulesNode,
                            messageId: 'missingModule',
                            data: { moduleId, reason: info.reason },
                        });
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
