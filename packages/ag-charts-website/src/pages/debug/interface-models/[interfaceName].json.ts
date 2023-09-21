import { buildModel } from '@features/api-documentation/utils/model';
import { getJsonFromDevFile } from '@utils/getJsonFromDevFile';
import { getModelInterfaces } from '@utils/pages';
import { execSync } from 'child_process';

interface Params {
    interfaceName: string;
}

export async function getStaticPaths() {
    return getModelInterfaces();
}

export async function get({ params }: { params: Params }) {
    const { interfaceName } = params;
    const interfaceLookup = getJsonFromDevFile('ag-charts-community/interfaces.AUTO.json');
    const codeLookup = getJsonFromDevFile('ag-charts-community/doc-interfaces.AUTO.json');
    const model = buildModel(interfaceName, interfaceLookup, codeLookup);

    const response = {
        model,
    };
    const body = JSON.stringify(response, null, 2);

    return {
        body,
    };
}
