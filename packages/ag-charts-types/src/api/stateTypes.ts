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
