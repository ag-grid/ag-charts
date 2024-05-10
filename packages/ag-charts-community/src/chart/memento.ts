import { Logger } from '../util/logger';
import { isDate, isPlainObject } from '../util/type-guards';

export interface Memento {
    type: string;
    version: string;
}

export interface MementoOriginator {
    mementoOriginatorName: string;
    createMemento(version: string): Memento;
    guardMemento(blob: unknown): boolean;
    restoreMemento(blob: Memento): void;
}

/**
 * The caretaker manages the encoding and decoding of mementos from originators, ensuring they can be provided to and
 * received from external systems. A memento encapsulates the state of an originator at a point in time. A memento
 * is also versioned to ensure it can be migrated to newer versions of the originator.
 */
export class MementoCaretaker {
    private readonly version: string;

    constructor(version: string) {
        // Only consider the major and minor when versioning mementos, to handle migrating breaking changes and
        // deprecations. Changes in patch versions can be safely ignored.
        const [major, minor] = version.split('.');
        this.version = `${major}.${minor}`;
    }

    save(originator: MementoOriginator) {
        return this.encode(originator, originator.createMemento(this.version));
    }

    restore(originator: MementoOriginator, blob: unknown) {
        if (typeof blob !== 'string') {
            Logger.warnOnce(
                `${originator.mementoOriginatorName} - Could not restore data of type [${typeof blob}], expecting a string, ignoring.`
            );
            return;
        }

        const memento = this.decode(originator, blob);

        if (!originator.guardMemento(memento)) {
            Logger.warnOnce(
                `${originator.mementoOriginatorName} - Could not restore data, memento was invalid, ignoring.`,
                memento
            );
            return;
        }

        originator.restoreMemento(memento);
    }

    /**
     * Encode a memento as a base64 string. Base64 encoding only supports utf-8, so multi-byte unicode characters are
     * converted into multiple single-byte utf-8 characters.
     */
    private encode(originator: MementoOriginator, memento: Memento) {
        try {
            const mementoString = JSON.stringify(memento, this.encodeTypes);
            const bytes = new TextEncoder().encode(mementoString);
            const binaryString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
            return btoa(binaryString);
        } catch (error) {
            throw new Error(`${originator.mementoOriginatorName} - Failed to encode memento [${error}].`, {
                cause: error,
            });
        }
    }

    /**
     * Decode an encoded memento, translating multiple single-byte uft-8 characters back into multi-byte unicode.
     */
    private decode(originator: MementoOriginator, encoded: string) {
        try {
            const binaryString = atob(encoded);
            const bytes = Uint8Array.from(binaryString, (m) => m.codePointAt(0) ?? 0);
            const blobString = new TextDecoder().decode(bytes);
            return JSON.parse(blobString, this.decodeTypes);
        } catch (error) {
            throw new Error(`${originator.mementoOriginatorName} - Failed to decode memento [${error}].`, {
                cause: error,
            });
        }
    }

    private encodeTypes(this: any, key: any, value: any) {
        if (isDate(this[key])) return { __type: 'date', value: String(this[key]) };
        return value;
    }

    private decodeTypes(this: any, key: any, value: any) {
        if (isPlainObject(this[key]) && '__type' in this[key] && this[key].__type === 'date') {
            return new Date(this[key].value);
        }
        return value;
    }
}
