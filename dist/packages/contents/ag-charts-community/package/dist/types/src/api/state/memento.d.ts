export interface MementoOriginator<Memento extends any = any> {
    mementoOriginatorKey: string;
    createMemento(): Memento;
    guardMemento(blob: unknown): blob is Memento;
    restoreMemento(version: string, mementoVersion: string, blob: Memento): void;
}
type MementoCaretakerPacket = Record<'version', string> & Record<string, any>;
/**
 * The caretaker manages the encoding and decoding of mementos from originators, ensuring they can be provided to and
 * received from external systems. A memento encapsulates the state of an originator at a point in time. A memento
 * is also versioned to ensure it can be migrated to newer versions of the originator.
 */
export declare class MementoCaretaker {
    readonly version: string;
    constructor(version: string);
    save(...originators: Array<MementoOriginator>): MementoCaretakerPacket;
    restore(blob: unknown, ...originators: Array<MementoOriginator>): void;
    /**
     * Encode a memento as a serializable object, encoding any non-serializble types.
     */
    private encode;
    /**
     * Decode an encoded memento, decoding any non-serializable types.
     */
    private decode;
    private encodeTypes;
    private decodeTypes;
}
export {};
