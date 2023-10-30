import { buildModel } from '@features/api-explorer/utils/model';
import { getDeprecateLookupFiles } from '@utils/devFiles';
import { getModelInterfaces } from '@utils/pages';

export async function getStaticPaths() {
    return getModelInterfaces();
}

export async function get({ params: { interfaceName } }: { params: { interfaceName: string } }) {
    const { interfaceLookup, codeLookup } = getDeprecateLookupFiles();
    const model = buildModel(interfaceName, interfaceLookup, codeLookup);
    return { body: JSON.stringify({ model }, null, 2) };
}
