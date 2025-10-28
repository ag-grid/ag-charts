import { Logger, iterate } from 'ag-charts-core';

import type { InternalDatumPropertyDefinition, PropertyId, PropertySelectors } from '../../dataModelTypes';
import type { DataModelContext } from '../dataModelContext';
import { createPathAccessor, getPathComponents } from './helpers';

/**
 * ScopeCacheManager manages the scope cache for property definitions.
 *
 * SCOPE CACHE RESPONSIBILITIES:
 * - Maintains mapping of property IDs to definitions per scope
 * - Validates uniqueness of property IDs within each scope
 * - Provides lookup functions for keys, values, and aggregates
 * - Handles property ID resolution with dot notation support
 *
 * SCOPE CONCEPT:
 * Scopes allow multiple data sources (series) to use the same DataModel
 * while maintaining separate property definitions. Each scope has its own
 * namespace for property IDs.
 */
export class ScopeCacheManager<K extends string> {
    constructor(private readonly ctx: DataModelContext<any, K>) {}

    processScopeCache() {
        this.ctx.scopeCache.clear();
        for (const def of iterate(this.ctx.keys, this.ctx.values, this.ctx.aggregates)) {
            if (!def.idsMap) continue;
            for (const [scope, ids] of def.idsMap) {
                for (const id of ids) {
                    if (!this.ctx.scopeCache.has(scope)) {
                        this.ctx.scopeCache.set(scope, new Map([[id, def]]));
                    } else if (this.ctx.scopeCache.get(scope)?.has(id)) {
                        throw new Error('duplicate definition ids on the same scope are not allowed.');
                    } else {
                        this.ctx.scopeCache.get(scope)!.set(id, def);
                    }
                }
            }
        }
    }

    valueGroupIdxLookup({ matchGroupIds }: PropertySelectors) {
        const result: number[] = [];
        for (const [index, def] of this.ctx.values.entries()) {
            if (!matchGroupIds || (def.groupId && matchGroupIds.includes(def.groupId))) {
                result.push(index);
            }
        }
        return result;
    }

    valueIdxLookup(scopes: string[] | undefined, prop: PropertyId<string>) {
        const noScopesToMatch = scopes == null || scopes.length === 0;
        const propId = typeof prop === 'string' ? prop : prop.id;

        const hasMatchingScopeId = (def: InternalDatumPropertyDefinition<K>) => {
            if (def.idsMap) {
                for (const [scope, ids] of def.idsMap) {
                    if (scopes?.includes(scope) && ids.has(propId)) {
                        return true;
                    }
                }
            }
            return false;
        };

        const result = this.ctx.values.reduce((res, def, index) => {
            const validDefScopes =
                def.scopes == null ||
                (noScopesToMatch && !def.scopes.length) ||
                def.scopes.some((s) => scopes?.includes(s));

            if (validDefScopes && (def.property === propId || def.id === propId || hasMatchingScopeId(def))) {
                res.push(index);
            }
            return res;
        }, [] as number[]);

        if (result.length === 0) {
            throw new Error(
                `AG Charts - configuration error, unknown property ${JSON.stringify(prop)} in scope(s) ${JSON.stringify(
                    scopes
                )}`
            );
        }

        return result;
    }

    buildAccessors(defs: Iterable<{ property: string }>) {
        const result = new Map<string, (d: any) => any>();
        if (this.ctx.suppressFieldDotNotation) {
            return result;
        }

        for (const def of defs) {
            const isPath = def.property.includes('.') || def.property.includes('[');
            if (!isPath) continue;

            const components = getPathComponents(def.property);
            if (components == null) {
                Logger.warnOnce('Invalid property path [%s]', def.property);
                continue;
            }
            const accessor = createPathAccessor(components);
            result.set(def.property, accessor);
        }
        return result;
    }
}
