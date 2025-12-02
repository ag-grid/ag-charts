import { BandedDomain, ContinuousDomain, DiscreteDomain, type IDataDomain } from '../../dataDomain';
import type { InternalDatumPropertyDefinition, SortOrderEntry } from '../../dataModelTypes';
import type { DataModelContext } from '../dataModelContext';

/**
 * Handles domain initialization and extension for the DataModel.
 * Manages both discrete and continuous domains, including banded domain optimization.
 */
export class DomainInitializer<K extends string> {
    constructor(private readonly ctx: DataModelContext<any, K>) {}

    /**
     * Sets up the appropriate domain type for a property definition.
     * Returns a BandedDomain wrapping DiscreteDomain for category values,
     * or a BandedDomain wrapping ContinuousDomain for continuous values.
     * Falls back to non-banded domains when banding is disabled.
     *
     * @param sortOrderEntry Optional sort order metadata from KEY_SORT_ORDERS.
     * When data is sorted and unique, enables fast array concatenation optimization.
     */
    setupDomainForDefinition(
        def: InternalDatumPropertyDefinition<K>,
        bandedDomains: Map<InternalDatumPropertyDefinition<any>, BandedDomain>,
        sortOrderEntry?: SortOrderEntry
    ): IDataDomain {
        const isDiscrete = def.valueType === 'category';

        let domain = bandedDomains.get(def);
        if (!domain && this.ctx.bandingConfig?.enableBanding !== false) {
            domain = new BandedDomain(
                isDiscrete ? () => new DiscreteDomain() : () => new ContinuousDomain(),
                this.ctx.bandingConfig,
                isDiscrete
            );
            bandedDomains.set(def, domain);
        }

        // Set sort order metadata for discrete domains to enable fast concatenation
        if (domain && isDiscrete && sortOrderEntry) {
            domain.setSortOrderMetadata(
                sortOrderEntry.sortOrder as 1 | -1 | undefined,
                sortOrderEntry.isUnique ?? false
            );
        }

        if (domain) {
            return domain;
        }

        return isDiscrete ? new DiscreteDomain() : new ContinuousDomain();
    }

    /**
     * Extends a domain from data array, using banded optimization if available.
     * Note: For BandedDomain, bands should already be initialized before calling this method.
     */
    extendDomainFromData(domain: IDataDomain, data: any[], invalidData?: boolean[]): void {
        if (domain instanceof BandedDomain) {
            // Bands should already be initialized by recomputeDomains()
            // This preserves the selective dirty marking from updateBandsForChanges()
            domain.extendBandsFromData(data, invalidData);
        } else {
            for (let i = 0; i < data.length; i++) {
                if (invalidData?.[i] === true) continue;
                domain.extend(data[i]);
            }
        }
    }

    /**
     * Initializes a banded domain if needed based on data size and state.
     * This is a memory optimization that divides large datasets into bands.
     */
    initializeBandedDomain(domain: IDataDomain, dataSize: number, propertyName?: string): void {
        if (!(domain instanceof BandedDomain)) return;

        const stats = domain.getStats();
        const shouldReinit = stats.bandCount === 0 || stats.dataSize !== dataSize;

        if (this.ctx.debug.check() && shouldReinit && propertyName) {
            this.ctx.debug(
                `Reinitializing bands for ${propertyName}: bandCount=${stats.bandCount}, ` +
                    `dataSize=${stats.dataSize}, dataLength=${dataSize}`
            );
        }

        if (shouldReinit) {
            domain.initializeBands(dataSize);
        }
    }
}
