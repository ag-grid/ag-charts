import { isGridOptionEvent } from './isGridOptionEvent';

export function applyInterfaceInclusions({ gridOpProp, interfaceHierarchyOverrides }) {
    return (typeName) => {
        if (interfaceHierarchyOverrides) {
            // If definition includes overrides apply them
            if ((interfaceHierarchyOverrides.exclude || []).includes(typeName)) {
                return false;
            }
            if ((interfaceHierarchyOverrides.include || []).includes(typeName)) {
                return true;
            }
        }
        // If its an event return true to force inclusion, otherwise undefined to use default inclusion logic.
        return isGridOptionEvent(gridOpProp) || undefined;
    };
}
