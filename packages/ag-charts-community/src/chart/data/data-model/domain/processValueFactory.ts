import { Logger, isNegative } from 'ag-charts-core';

import type { IDataDomain } from '../../dataDomain';
import type { InternalDatumPropertyDefinition, ProcessedValue, ProcessorFn } from '../../dataModelTypes';
import type { DataModelContext } from '../dataModelContext';

/**
 * Specialized function type for processing property values.
 * Generated per property definition to eliminate branching and optimize hot paths.
 */
export type SpecializedProcessValueFn = (datum: unknown, idx: number, valueScopes: string | string[]) => ProcessedValue;

/**
 * Helper: Tracks missing values for a property definition across scopes.
 * Named function for profiler visibility.
 */
function trackMissingValue(missing: Map<string, number>, valueScopes: string | string[]): void {
    if (typeof valueScopes === 'string') {
        missing.set(valueScopes, (missing.get(valueScopes) ?? 0) + 1);
    } else {
        for (const scope of valueScopes) {
            missing.set(scope, (missing.get(scope) ?? 0) + 1);
        }
    }
}

/**
 * Helper: Handles invalid value case - sets result, optionally extends domain, logs warning.
 * Named function for profiler visibility.
 */
function handleInvalidValue(
    reusableResult: ProcessedValue,
    hasInvalidValue: boolean,
    invalidValue: any,
    domain: IDataDomain,
    def: InternalDatumPropertyDefinition<any>,
    value: any,
    mode: string
): void {
    reusableResult.valid = false;

    if (hasInvalidValue) {
        reusableResult.value = invalidValue;
        domain.extend(invalidValue);
        return;
    }

    if (mode !== 'integrated') {
        Logger.warnOnce(
            `invalid value of type [${typeof value}] for [${def.scopes} / ${def.id}] ignored:`,
            `[${value}]`
        );
    }
    reusableResult.value = undefined;
}

/**
 * Helper: Checks validation and handles invalid case if validation fails.
 * Returns the result object if validation failed (caller should return early),
 * or null if validation passed (caller should continue processing).
 * Named function for profiler visibility.
 */
function processValidationCheck(
    validation: ((value: any, datum: any, index: number) => boolean) | undefined,
    valueInDatum: boolean,
    value: any,
    datum: any,
    idx: number,
    reusableResult: ProcessedValue,
    hasInvalidValue: boolean,
    invalidValue: any,
    domain: IDataDomain,
    def: InternalDatumPropertyDefinition<any>,
    mode: string
): ProcessedValue | null {
    if (validation && valueInDatum && validation(value, datum, idx) === false) {
        reusableResult.missing = false;
        handleInvalidValue(reusableResult, hasInvalidValue, invalidValue, domain, def, value, mode);
        return reusableResult;
    }
    return null;
}

/**
 * Helper: Handles missing value tracking logic.
 * Sets the missing flag and tracks missing values if needed.
 * Named function for profiler visibility.
 */
function handleMissingTracking(
    valueInDatum: boolean,
    hasMissingValue: boolean,
    missing: Map<string, number>,
    valueScopes: string | string[],
    reusableResult: ProcessedValue
): void {
    reusableResult.missing = !valueInDatum;
    if (!valueInDatum && !hasMissingValue) {
        trackMissingValue(missing, valueScopes);
    }
}

/**
 * Helper: Sets valid result and extends domain.
 * Final step for successful value processing.
 * Named function for profiler visibility.
 */
function setValidResult(value: any, reusableResult: ProcessedValue, domain: IDataDomain): ProcessedValue {
    reusableResult.valid = true;
    reusableResult.value = value;
    domain.extend(value);
    return reusableResult;
}

/**
 * Factory responsible for generating optimized processValue functions per property definition.
 * Encapsulates the specialized variants to keep DomainManager focused on orchestration.
 */
export class ProcessValueFactory<D extends object, K extends keyof D & string> {
    constructor(private readonly ctx: DataModelContext<D, K>) {}

    createProcessValueFn(
        def: InternalDatumPropertyDefinition<K>,
        accessor: ((datum: any) => any) | undefined,
        domain: IDataDomain,
        reusableResult: ProcessedValue,
        processorFns: Map<InternalDatumPropertyDefinition<K>, ProcessorFn>,
        domainMode: 'extend' | 'skip'
    ): SpecializedProcessValueFn {
        const specializedFn =
            domainMode === 'extend'
                ? this.createSpecializedProcessValue(def, accessor, domain, reusableResult, processorFns, def.validation)
                : null;

        return specializedFn ?? this.createGenericProcessValue(def, accessor, domain, processorFns, domainMode);
    }

    private createSpecializedProcessValue(
        def: InternalDatumPropertyDefinition<K>,
        accessor: ((datum: any) => any) | undefined,
        domain: IDataDomain,
        reusableResult: ProcessedValue,
        processorFns: Map<InternalDatumPropertyDefinition<K>, ProcessorFn>,
        validation: ((value: any, datum: any, index: number) => boolean) | undefined
    ): SpecializedProcessValueFn | null {
        if (def.forceValue != null) {
            return this.createSpecializedProcessValue_ForceValue(def, accessor, domain, reusableResult);
        }

        if (def.processor) {
            return this.createSpecializedProcessValue_Processor(
                def,
                accessor,
                domain,
                reusableResult,
                processorFns,
                validation
            );
        }

        if (validation) {
            return def.type === 'key'
                ? this.createSpecializedProcessValue_Key_Validation(def, accessor, domain, reusableResult, validation)
                : this.createSpecializedProcessValue_Value_Validation(def, accessor, domain, reusableResult, validation);
        }

        return null;
    }

    /**
     * Creates a specialized processValue function optimized for key properties with validation.
     * Eliminates all branching for the most common key property case (~30% of calls).
     */
    private createSpecializedProcessValue_Key_Validation(
        def: InternalDatumPropertyDefinition<K>,
        accessor: ((datum: any) => any) | undefined,
        domain: IDataDomain,
        reusableResult: ProcessedValue,
        validation: (value: any, datum: any, index: number) => boolean
    ): SpecializedProcessValueFn {
        const property = def.property;
        const hasMissingValue = 'missingValue' in def;
        const missingValue = def.missingValue;
        const hasInvalidValue = 'invalidValue' in def;
        const invalidValue = def.invalidValue;
        const missing = def.missing;
        const mode = this.ctx.mode;

        if (accessor) {
            // Key with accessor (rare case)
            const accessorFn = accessor;
            return function processValue_Key_Validation_Accessor(
                datum: unknown,
                idx: number,
                valueScopes: string | string[]
            ): ProcessedValue {
                let value;
                try {
                    value = accessorFn(datum);
                } catch {
                    // Swallow errors
                }
                const valueInDatum = value != null;

                // Keys cannot be null/undefined
                if (!valueInDatum || value == null || validation(value, datum, idx) === false) {
                    reusableResult.missing = !valueInDatum;

                    if (!valueInDatum && !hasMissingValue) {
                        trackMissingValue(missing, valueScopes);
                    }

                    handleInvalidValue(reusableResult, hasInvalidValue, invalidValue, domain, def, value, mode);
                    return reusableResult;
                }

                reusableResult.missing = false;
                reusableResult.valid = true;
                reusableResult.value = value;
                domain.extend(value);
                return reusableResult;
            };
        }

        // Key without accessor (most common key case)
        return function processValue_Key_Validation_Direct(
            datum: unknown,
            idx: number,
            valueScopes: string | string[]
        ): ProcessedValue {
            const valueInDatum = property in (datum as any);
            const value = valueInDatum ? (datum as any)[property] : missingValue;

            // Keys cannot be null/undefined
            if (!valueInDatum || value == null || validation(value, datum as any, idx) === false) {
                reusableResult.missing = !valueInDatum;

                if (!valueInDatum && !hasMissingValue) {
                    trackMissingValue(missing, valueScopes);
                }

                handleInvalidValue(reusableResult, hasInvalidValue, invalidValue, domain, def, value, mode);
                return reusableResult;
            }

            reusableResult.missing = false;
            reusableResult.valid = true;
            reusableResult.value = value;
            domain.extend(value);
            return reusableResult;
        };
    }

    /**
     * Creates a specialized processValue function optimized for value properties with validation.
     * Eliminates branching for the most common value property case (~50% of calls).
     */
    private createSpecializedProcessValue_Value_Validation(
        def: InternalDatumPropertyDefinition<K>,
        accessor: ((datum: any) => any) | undefined,
        domain: IDataDomain,
        reusableResult: ProcessedValue,
        validation: (value: any, datum: any, index: number) => boolean
    ): SpecializedProcessValueFn {
        const property = def.property;
        const hasMissingValue = 'missingValue' in def;
        const missingValue = def.missingValue;
        const hasInvalidValue = 'invalidValue' in def;
        const invalidValue = def.invalidValue;
        const missing = def.missing;
        const mode = this.ctx.mode;

        if (accessor) {
            // Value with accessor
            const accessorFn = accessor;
            return function processValue_Value_Validation_Accessor(
                datum: unknown,
                idx: number,
                valueScopes: string | string[]
            ): ProcessedValue {
                let value;
                try {
                    value = accessorFn(datum);
                } catch {
                    // Swallow errors
                }
                const valueInDatum = value != null;

                const validationFailed = processValidationCheck(
                    validation,
                    valueInDatum,
                    value,
                    datum,
                    idx,
                    reusableResult,
                    hasInvalidValue,
                    invalidValue,
                    domain,
                    def,
                    mode
                );
                if (validationFailed !== null) return validationFailed;

                handleMissingTracking(valueInDatum, hasMissingValue, missing, valueScopes, reusableResult);
                return setValidResult(value, reusableResult, domain);
            };
        }

        // Value without accessor (most common value case)
        return function processValue_Value_Validation_Direct(
            datum: unknown,
            idx: number,
            valueScopes: string | string[]
        ): ProcessedValue {
            const valueInDatum = property in (datum as any);
            const value = valueInDatum ? (datum as any)[property] : missingValue;

            const validationFailed = processValidationCheck(
                validation,
                valueInDatum,
                value,
                datum,
                idx,
                reusableResult,
                hasInvalidValue,
                invalidValue,
                domain,
                def,
                mode
            );
            if (validationFailed !== null) return validationFailed;

            handleMissingTracking(valueInDatum, hasMissingValue, missing, valueScopes, reusableResult);
            return setValidResult(value, reusableResult, domain);
        };
    }

    /**
     * Creates a specialized processValue function for properties with forceValue.
     * Optimized for invisible series (~5-10% of calls).
     */
    private createSpecializedProcessValue_ForceValue(
        def: InternalDatumPropertyDefinition<K>,
        accessor: ((datum: any) => any) | undefined,
        domain: IDataDomain,
        reusableResult: ProcessedValue
    ): SpecializedProcessValueFn {
        const property = def.property;
        const forceValue = def.forceValue!;

        if (accessor) {
            const accessorFn = accessor;
            return function processValue_ForceValue_Accessor(
                datum: unknown,
                _idx: number,
                _valueScopes: string | string[]
            ): ProcessedValue {
                let value;
                try {
                    value = accessorFn(datum);
                } catch {
                    // Swallow errors
                }
                const valueInDatum = value != null;
                const valueNegative = valueInDatum && isNegative(value);
                const forcedValue = valueNegative ? -1 * forceValue : forceValue;

                reusableResult.missing = false;
                reusableResult.valid = true;
                reusableResult.value = forcedValue;
                domain.extend(forcedValue);
                return reusableResult;
            };
        }

        return function processValue_ForceValue_Direct(
            datum: unknown,
            _idx: number,
            _valueScopes: string | string[]
        ): ProcessedValue {
            const valueInDatum = property in (datum as any);
            const value = valueInDatum ? (datum as any)[property] : undefined;
            const valueNegative = valueInDatum && isNegative(value);
            const forcedValue = valueNegative ? -1 * forceValue : forceValue;

            reusableResult.missing = false;
            reusableResult.valid = true;
            reusableResult.value = forcedValue;
            domain.extend(forcedValue);
            return reusableResult;
        };
    }

    /**
     * Creates a specialized processValue function for properties with processors.
     * Optimized for data transformations (~5-10% of calls).
     */
    private createSpecializedProcessValue_Processor(
        def: InternalDatumPropertyDefinition<K>,
        accessor: ((datum: any) => any) | undefined,
        domain: IDataDomain,
        reusableResult: ProcessedValue,
        processorFns: Map<InternalDatumPropertyDefinition<K>, ProcessorFn>,
        validation: ((value: any, datum: any, index: number) => boolean) | undefined
    ): SpecializedProcessValueFn {
        const property = def.property;
        const hasMissingValue = 'missingValue' in def;
        const missingValue = def.missingValue;
        const hasInvalidValue = 'invalidValue' in def;
        const invalidValue = def.invalidValue;
        const missing = def.missing;
        const processor = def.processor!;
        const mode = this.ctx.mode;

        if (accessor) {
            const accessorFn = accessor;
            return function processValue_Processor_Accessor(
                datum: unknown,
                idx: number,
                valueScopes: string | string[]
            ): ProcessedValue {
                let value;
                try {
                    value = accessorFn(datum);
                } catch {
                    // Swallow errors
                }
                const valueInDatum = value != null;

                const validationFailed = processValidationCheck(
                    validation,
                    valueInDatum,
                    value,
                    datum,
                    idx,
                    reusableResult,
                    hasInvalidValue,
                    invalidValue,
                    domain,
                    def,
                    mode
                );
                if (validationFailed !== null) return validationFailed;

                handleMissingTracking(valueInDatum, hasMissingValue, missing, valueScopes, reusableResult);

                let processorFn = processorFns.get(def);
                if (processorFn == null) {
                    processorFn = processor();
                    processorFns.set(def, processorFn);
                }
                value = processorFn(value, idx);

                return setValidResult(value, reusableResult, domain);
            };
        }

        return function processValue_Processor_Direct(
            datum: unknown,
            idx: number,
            valueScopes: string | string[]
        ): ProcessedValue {
            const valueInDatum = property in (datum as any);
            let value = valueInDatum ? (datum as any)[property] : missingValue;

            const validationFailed = processValidationCheck(
                validation,
                valueInDatum,
                value,
                datum,
                idx,
                reusableResult,
                hasInvalidValue,
                invalidValue,
                domain,
                def,
                mode
            );
            if (validationFailed !== null) return validationFailed;

            handleMissingTracking(valueInDatum, hasMissingValue, missing, valueScopes, reusableResult);

            let processorFn = processorFns.get(def);
            if (processorFn == null) {
                processorFn = processor();
                processorFns.set(def, processorFn);
            }
            value = processorFn(value, idx);

            return setValidResult(value, reusableResult, domain);
        };
    }

    /**
     * Creates the generic fallback processValue implementation used for edge cases
     * and for skip mode (no domain extension). Generates a per-definition function
     * so callers can resolve it once and reuse it without additional branching.
     */
    private createGenericProcessValue(
        def: InternalDatumPropertyDefinition<K>,
        accessor: ((datum: any) => any) | undefined,
        domain: IDataDomain,
        processorFns: Map<InternalDatumPropertyDefinition<K>, ProcessorFn>,
        domainMode: 'extend' | 'skip'
    ): SpecializedProcessValueFn {
        const property = def.property;
        const hasMissingValue = 'missingValue' in def;
        const missingValue = def.missingValue;
        const hasInvalidValue = 'invalidValue' in def;
        const invalidValue = def.invalidValue;
        const missing = def.missing;
        const mode = this.ctx.mode;
        const shouldExtendDomain = domainMode === 'extend';
        const reusableResult: ProcessedValue = {
            value: undefined,
            missing: false,
            valid: false,
        };

        return function processValue_Generic(
            datum: unknown,
            idx: number,
            valueScopes: string | string[]
        ): ProcessedValue {
            let value;
            let valueInDatum: boolean;

            if (accessor) {
                try {
                    value = accessor(datum);
                } catch {
                    // Swallow errors
                }
                valueInDatum = value != null;
            } else {
                valueInDatum = property in (datum as any);
                value = valueInDatum ? (datum as any)[property] : missingValue;
            }

            if (def.forceValue != null) {
                const valueNegative = valueInDatum && isNegative(value);
                value = valueNegative ? -1 * def.forceValue : def.forceValue;
                valueInDatum = true;
            }

            handleMissingTracking(valueInDatum, hasMissingValue, missing, valueScopes, reusableResult);

            const isKeyWithNullValue = def.type === 'key' && value == null;
            if (isKeyWithNullValue) {
                handleInvalidValue(reusableResult, hasInvalidValue, invalidValue, domain, def, value, mode);
                return reusableResult;
            }

            const validationFailed = processValidationCheck(
                def.validation,
                valueInDatum,
                value,
                datum,
                idx,
                reusableResult,
                hasInvalidValue,
                invalidValue,
                domain,
                def,
                mode
            );
            if (validationFailed !== null) return validationFailed;

            reusableResult.valid = true;

            if (def.processor) {
                let processor = processorFns.get(def);
                if (processor == null) {
                    processor = def.processor();
                    processorFns.set(def, processor);
                }
                value = processor(value, idx);
            }

            if (shouldExtendDomain) {
                domain.extend(value);
            }
            reusableResult.value = value;
            return reusableResult;
        };
    }
}
