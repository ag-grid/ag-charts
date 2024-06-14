import { Logger } from '../../util/logger';
import { isDate, isObject } from '../../util/type-guards';

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
export class MementoCaretaker {
    public readonly version: string;

    constructor(version: string) {
        // Strip out version suffixes, e.g. `-beta`
        this.version = version.split('-')[0];
    }

    save(...originators: Array<MementoOriginator>) {
        const packet: MementoCaretakerPacket = { version: this.version };
        for (const originator of Object.values(originators)) {
            packet[originator.mementoOriginatorKey] = this.encode(originator, originator.createMemento());
        }
        return packet;
    }

    restore(blob: unknown, ...originators: Array<MementoOriginator>) {
        if (typeof blob !== 'object') {
            Logger.warnOnce(`Could not restore data of type [${typeof blob}], expecting an object, ignoring.`);
            return;
        }

        if (blob == null) {
            Logger.warnOnce(`Could not restore data of type [null], expecting an object, ignoring.`);
            return;
        }

        if (!('version' in blob) || typeof blob.version !== 'string') {
            Logger.warnOnce(`Could not restore data, missing [version] string in object, ignoring.`);
            return;
        }

        for (const originator of originators) {
            if (!(originator.mementoOriginatorKey in blob)) {
                // Silently skip restoring this originator, as we are happy restoring partial state
                continue;
            }

            const memento = this.decode(originator, (blob as any)[originator.mementoOriginatorKey]);

            if (!originator.guardMemento(memento)) {
                Logger.warnOnce(
                    `Could not restore [${originator.mementoOriginatorKey}] data, value was invalid, ignoring.`,
                    memento
                );
                return;
            }

            originator.restoreMemento(this.version, blob.version, memento);
        }
    }

    /**
     * Encode a memento as a serializable object, encoding any non-serializble types.
     */
    private encode(originator: MementoOriginator, memento: any) {
        try {
            return JSON.parse(JSON.stringify(memento, this.encodeTypes));
        } catch (error) {
            throw new Error(`Failed to encode [${originator.mementoOriginatorKey}] value [${error}].`, {
                cause: error,
            });
        }
    }

    /**
     * Decode an encoded memento, decoding any non-serializable types.
     */
    private decode(originator: MementoOriginator, encoded: unknown) {
        try {
            return JSON.parse(JSON.stringify(encoded), this.decodeTypes) as unknown;
        } catch (error) {
            throw new Error(`Failed to decode [${originator.mementoOriginatorKey}] value [${error}].`, {
                cause: error,
            });
        }
    }

    private encodeTypes(this: any, key: any, value: any) {
        if (isDate(this[key])) {
            return { __type: 'date', value: String(this[key]) };
        }
        return value;
    }

    private decodeTypes(this: any, key: any, value: any) {
        if (isObject(this[key]) && '__type' in this[key] && this[key].__type === 'date') {
            return new Date(this[key].value);
        }
        return value;
    }
}
