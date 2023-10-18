import { createUnionNestedObjectPathItemRegex } from './modelPath';

/**
 * Remove the top level path, including discriminator eg, `[ "axes", "[type = 'log']" ]`
 */
export function removeTopLevelPath(path: string[]) {
    if (!path || !path.length) {
        return [];
    }
    const regex = createUnionNestedObjectPathItemRegex();
    const hasDiscriminator = Boolean(regex.exec(path[1]));
    return hasDiscriminator ? path.slice(2) : path.slice(1);
}
