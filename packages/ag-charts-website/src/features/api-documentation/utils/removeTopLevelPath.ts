import { createUnionNestedObjectPathItemRegex } from './modelPath';

const PATH_LENGTH_OF_NON_DISCRIMINATOR = 1;
const PATH_LENGTH_OF_DISCRIMINATOR = 2;

/**
 * Remove the top level path for all sublevels unless the top level is
 * the only path
 */
export function removeTopLevelPath({
    path,
    keepTopLevelIfOnlyItem,
}: {
    path: string[];
    keepTopLevelIfOnlyItem?: boolean;
}) {
    if (!path || !path.length) {
        return [];
    }
    const regex = createUnionNestedObjectPathItemRegex();
    const hasDiscriminator = Boolean(regex.exec(path[1]));
    if (hasDiscriminator) {
        const removedTopLevelItem = path.slice(PATH_LENGTH_OF_DISCRIMINATOR);
        const keepTopLevelItemOrRemove = path.length === PATH_LENGTH_OF_DISCRIMINATOR ? path : removedTopLevelItem;
        return keepTopLevelIfOnlyItem ? keepTopLevelItemOrRemove : removedTopLevelItem;
    } else {
        const removedTopLevelItem = path.slice(PATH_LENGTH_OF_NON_DISCRIMINATOR);
        const keepTopLevelItemOrRemove = path.length === PATH_LENGTH_OF_NON_DISCRIMINATOR ? path : removedTopLevelItem;
        return keepTopLevelIfOnlyItem ? keepTopLevelItemOrRemove : removedTopLevelItem;
    }
}
