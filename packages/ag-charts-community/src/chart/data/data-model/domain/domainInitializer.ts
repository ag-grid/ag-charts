import { BandedDomain, ContinuousDomain, DiscreteDomain, type IDataDomain } from '../../dataDomain';
import type { InternalDatumPropertyDefinition } from '../../dataModelTypes';
import type { DataModelContext } from '../dataModelContext';

/**
 * Handles domain initialization and extension for the DataModel.
 * Manages both discrete and continuous domains, including banded domain optimization.
 */
export class DomainInitializer<K extends string> {
    constructor(private readonly ctx: DataModelContext<any, K>) {}

    /**
     * Sets up the appropriate domain type for a property definition.
     * Returns a DiscreteDomain for category values, or a BandedDomain/ContinuousDomain
     * for continuous values depending on configuration.
     */
    setupDomainForDefinition(
        def: InternalDatumPropertyDefinition<K>,
        bandedDomains: Map<InternalDatumPropertyDefinition<any>, BandedDomain>
    ): IDataDomain {
        if (def.valueType === 'category') {
            return new DiscreteDomain();
        }

        let domain = bandedDomains.get(def);
        if (!domain && this.ctx.bandingConfig?.enableBanding !== false) {
            domain = new BandedDomain(() => new ContinuousDomain(), this.ctx.bandingConfig, false);
            bandedDomains.set(def, domain);
        }

        return domain ?? new ContinuousDomain();
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
        const shouldReinit = stats.bandCount === 0 || stats.dataSize !== dataSize || stats.needsReinitialization;

        if (this.ctx.debug.check() && shouldReinit && propertyName) {
            this.ctx.debug(
                `Reinitializing bands for ${propertyName}: bandCount=${stats.bandCount}, ` +
                    `dataSize=${stats.dataSize}, dataLength=${dataSize}, ` +
                    `needsReinitialization=${stats.needsReinitialization}`
            );
        }

        if (shouldReinit) {
            domain.initializeBands(dataSize);
        }
    }
}
