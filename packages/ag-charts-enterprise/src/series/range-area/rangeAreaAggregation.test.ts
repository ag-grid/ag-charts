import { describeExtremesAggregationEntryPoint } from '../../test/aggregationSharedTests';
import { aggregateRangeAreaDataFromDataModel } from './rangeAreaAggregation';

describeExtremesAggregationEntryPoint('aggregateRangeAreaDataFromDataModel', {
    aggregate: aggregateRangeAreaDataFromDataModel,
    highColumnId: 'yHighValue',
    lowColumnId: 'yLowValue',
});
