import type { Logger } from '../logging/logger';
import { isDate, isObject } from '../utils/types/typeGuards';

export interface MementoOriginator<Memento = any> {
    mementoOriginatorKey: string;
    createMemento(): Memento;
    guardMemento(blob: unknown, messages: Array<string>): blob is Memento | undefined;
    restoreMemento(version: string, mementoVersion: string, blob: Memento | undefined): void;
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

    restore(logger: Logger, blob: unknown, ...originators: Array<MementoOriginator>) {
        if (!isObject(blob)) {
            const blobType = blob === null ? 'null' : typeof blob;
            logger.warnOnce(`Could not restore data of type [${blobType}], expecting an object, ignoring.`);
            return;
        }

        if (!('version' in blob) || typeof blob.version !== 'string') {
            logger.warnOnce(`Could not restore data, missing [version] string in object, ignoring.`);
            return;
        }

        for (const originator of originators) {
            const memento = this.decode(originator, blob[originator.mementoOriginatorKey]);
            const messages: string[] = [];

            if (!originator.guardMemento(memento, messages)) {
                let messagesString = `Could not restore [${originator.mementoOriginatorKey}] data, value was invalid, ignoring.`;
                if (messages.length > 0) {
                    messagesString += `\n\n${messages.join('\n\n')}\n\n`;
                }
                logger.warnOnce(messagesString, memento);
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
            // eslint-disable-next-line @typescript-eslint/unbound-method
            return JSON.parse(JSON.stringify(memento, MementoCaretaker.encodeTypes));
        } catch (error: any) {
            throw new Error(`Failed to encode [${originator.mementoOriginatorKey}] value [${error}].`, {
                cause: error,
            });
        }
    }

    /**
     * Decode an encoded memento, decoding any non-serializable types.
     */
    private decode(originator: MementoOriginator, encoded: unknown) {
        if (encoded == null) return encoded;
        try {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            return JSON.parse(JSON.stringify(encoded), MementoCaretaker.decodeTypes) as unknown;
        } catch (error: any) {
            throw new Error(`Failed to decode [${originator.mementoOriginatorKey}] value [${error}].`, {
                cause: error,
            });
        }
    }

    private static encodeTypes(this: any, key: any, value: any) {
        if (isDate(this[key])) {
            return { __type: 'date', value: this[key].toISOString() };
        }
        if (typeof this[key] === 'bigint') {
            // Encode as a base-10 string; JSON numbers (doubles) lose integer precision beyond ±(2^53 - 1).
            return { __type: 'bigint', value: this[key].toString() };
        }
        return value;
    }

    private static decodeTypes(this: any, key: any, value: any) {
        if (isObject(this[key]) && '__type' in this[key]) {
            if (this[key].__type === 'date') {
                return new Date(this[key].value);
            }
            if (this[key].__type === 'bigint') {
                // Untrusted input: only decode a valid integer string, else leave it for guardMemento to reject.
                const bigintValue = this[key].value;
                if (typeof bigintValue === 'string' && /^-?\d+$/.test(bigintValue)) {
                    return BigInt(bigintValue);
                }
            }
        }
        return value;
    }
}
