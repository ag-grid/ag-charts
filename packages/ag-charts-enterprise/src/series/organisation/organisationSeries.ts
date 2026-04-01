import { AbstractNetworkSeries } from '../network/networkSeries';
import { type OrganisationEdge, OrganisationGraph, type OrganisationVertex } from './organisationGraph';

/**
 *
 */
export class OrganisationSeries extends AbstractNetworkSeries<OrganisationVertex, OrganisationEdge> {
    createNetworkGraph() {
        return new OrganisationGraph();
    }
}
