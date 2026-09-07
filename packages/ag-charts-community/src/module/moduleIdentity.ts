// Licensing trusts identity rather than the caller-writable `enterprise` flag: a module scope is
// community only when every definition in it was marked here by the community package itself.
const communityModules = new WeakSet<object>();

export function communityModule<T extends object>(definition: T): T {
    communityModules.add(definition);
    return definition;
}

export function isCommunityModule(definition: object): boolean {
    return communityModules.has(definition);
}
