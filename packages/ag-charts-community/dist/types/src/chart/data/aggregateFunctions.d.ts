import type { AggregatePropertyDefinition, DatumPropertyDefinition, ScopeProvider } from './dataModel';
export declare function sum(scope: ScopeProvider, id: string, matchGroupId: string): AggregatePropertyDefinition<any, any, [number, number], [number, number]>;
export declare function groupSum(scope: ScopeProvider, id: string, matchGroupId?: string): AggregatePropertyDefinition<any, any>;
export declare function range(scope: ScopeProvider, id: string, matchGroupId: string): AggregatePropertyDefinition<any, any, [number, number], [number, number]>;
export declare function groupCount(scope: ScopeProvider, id: string): AggregatePropertyDefinition<any, any>;
export declare function groupAverage(scope: ScopeProvider, id: string, matchGroupId?: string): AggregatePropertyDefinition<any, any, [number, number], [number, number, number]>;
export declare function area(scope: ScopeProvider, id: string, aggFn: AggregatePropertyDefinition<any, any>, matchGroupId?: string): AggregatePropertyDefinition<any, any, [number, number], [number, number]>;
export declare function accumulatedValue(onlyPositive?: boolean): DatumPropertyDefinition<any>['processor'];
export declare function trailingAccumulatedValue(): DatumPropertyDefinition<any>['processor'];
