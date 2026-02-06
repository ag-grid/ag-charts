export interface AgStateSerializableDate {
    /** Type discriminator for serialisable date objects. */
    __type: 'date';
    /** The date value as an ISO 8601 string or Unix timestamp. */
    value: string | number;
}
