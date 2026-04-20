export enum RegistryMode {
    Enterprise = 'enterprise',
    Integrated = 'integrated',
    UMD = 'umd',
}

const registeredModes = new Set<RegistryMode>();

export function setRegistryMode(registryFlag: RegistryMode): void {
    registeredModes.add(registryFlag);
}

export function clearRegistryModes(): void {
    registeredModes.clear();
}

export function isEnterprise(): boolean {
    return registeredModes.has(RegistryMode.Enterprise);
}

export function isIntegrated(): boolean {
    return registeredModes.has(RegistryMode.Integrated);
}

export function isUmd(): boolean {
    return registeredModes.has(RegistryMode.UMD);
}
