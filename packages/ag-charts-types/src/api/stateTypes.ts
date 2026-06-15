export interface AgStateSerializableDate {
    /** Type discriminator for serialisable date objects. */
    __type: 'date';
    /** The date value as an ISO 8601 string or Unix timestamp. */
    value: string | number;
}

export interface AgStateSerializableBigInt {
    /** Type discriminator for serialisable bigint objects. */
    __type: 'bigint';
    /** The bigint value as a base-10 string, preserving full integer precision. */
    value: string;
}

export type AgStateValueType = string | number | bigint | Date;
export type AgStateSerializableValueType = string | number | AgStateSerializableDate | AgStateSerializableBigInt;

export interface AgStateGroupingValueType {
    /** The value to use for the position. */
    value: AgStateValueType;
    /** The percentage position within a grouped category. */
    groupPercentage: number;
}

export interface AgStateSerializableGroupingValueType {
    /** The value to use for the position. */
    value: AgStateSerializableValueType;
    /** The percentage position within a grouped category. */
    groupPercentage: number;
}
