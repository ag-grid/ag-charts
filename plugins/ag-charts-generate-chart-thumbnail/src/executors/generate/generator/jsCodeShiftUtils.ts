const getPropertyToCheck = (property: any) => {
    return property.key?.type === 'Identifier' ? property.key?.name : property.key?.value;
};

export function filterPropertyKeys({
    removePropertyKeys,
    properties,
}: {
    removePropertyKeys: string[];
    properties: any;
}) {
    return properties.filter((property: any) => {
        const valueToCheck = getPropertyToCheck(property);
        return !removePropertyKeys.includes(valueToCheck);
    });
}
