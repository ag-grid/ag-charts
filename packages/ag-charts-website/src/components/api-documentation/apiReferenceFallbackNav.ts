import type { ApiReferenceConfig } from '@components/api-documentation/components/ApiReference';
import type { InterfaceNode, MemberNode, TypeNode } from '@generate-code-reference-plugin/doc-interfaces/types';
import { apiReferencePageHeading } from '@utils/markdown-pages/apiReferencePageContent';

import {
    type ApiReferenceType,
    type NavigationData,
    type NavigationPath,
    buildTypeArgumentsFromGenericsMap,
    cleanupName,
    getAliasedUnionVariants,
    getInterfaceArrayTypes,
    getMemberType,
    getNavigationDataFromPath,
    getVariantDiscriminator,
    normalizeType,
    processMembers,
} from './apiReferenceHelpers';

export interface FallbackNavItem {
    label: string;
    href: string;
    /** Set when `href` is the page being rendered, rather than another page or an anchor on one. */
    isCurrentPage: boolean;
    /** Id of the element `href` targets, when it is an anchor on a page rather than a page of its own. */
    anchorId?: string;
    /** The property the entry stands for; unset for the root and for the entries of union variants. */
    member?: MemberNode;
    children: FallbackNavItem[];
}

export interface FallbackNavOptions {
    reference: ApiReferenceType;
    rootInterface: string;
    /** Label of the root entry, matching the last breadcrumb of the hydrated navigation. */
    rootLabel: string;
    /** URL path of the root page, including the site base and a trailing slash, e.g. `/charts/options/`. */
    basePath: string;
    config: ApiReferenceConfig;
    /** Interface the page being rendered documents; its members are listed whatever their depth. */
    pageInterface?: string;
    /** Levels of the tree to list, counting the root's members as the first. */
    depth: number;
}

/**
 * The entries of the API reference navigation tree, cut off at `depth`, for the server-rendered
 * fallback. Walks the same structure as `<OptionsNavigation>` and resolves each entry to the URL the
 * hydrated tree navigates to, so the links match the pages and anchors the reference renders.
 */
export function buildFallbackNav(options: FallbackNavOptions): FallbackNavItem {
    const { reference, rootInterface, rootLabel, basePath, config, pageInterface } = options;
    const rootRef = reference.get(rootInterface);
    const rootPath = [{ name: basePath, type: rootInterface }];
    const walk: NavWalk = { ...options, pageLinkCache: new Map() };

    return {
        label: rootLabel,
        href: basePath,
        isCurrentPage: pageInterface == null || pageInterface === rootInterface,
        children:
            rootRef?.kind === 'interface'
                ? buildMemberItems(walk, processMembers(rootRef, config), rootPath, 1, rootRef, true, false)
                : [],
    };
}

interface NavWalk extends FallbackNavOptions {
    pageLinkCache: Map<string, boolean>;
}

/**
 * Entries past the depth cut-off are kept only when they are, or lead to, a page of their own, so every
 * reference page stays reachable however deep it sits, e.g. `navigator.miniChart.series[type='line']`.
 */
function leadsToPage(walk: NavWalk, type: string): boolean {
    if (walk.config.specialTypes?.[type] != null) {
        return true;
    }
    const cached = walk.pageLinkCache.get(type);
    if (cached != null) {
        return cached;
    }
    // Seeded before recursing so a self-referencing type terminates.
    walk.pageLinkCache.set(type, false);
    const ref = walk.reference.get(type);
    const result = ref?.kind === 'interface' && ref.members.some((member) => leadsToPage(walk, getMemberType(member)));
    walk.pageLinkCache.set(type, result);
    return result;
}

function buildMemberItems(
    walk: NavWalk,
    members: MemberNode[],
    parentPath: NavigationPath[],
    level: number,
    parentRef: InterfaceNode,
    listAll: boolean,
    cleanNames = true
): FallbackNavItem[] {
    return members.flatMap((member) => {
        const path = parentPath.concat(memberPath(member, cleanNames));
        if (!listAll && !leadsToPage(walk, getMemberType(member))) {
            return [];
        }
        return [buildMemberItem(walk, member, path, level, parentRef)];
    });
}

function memberPath(member: MemberNode, cleanName = true): NavigationPath {
    return { name: cleanName ? cleanupName(member.name) : member.name, type: getMemberType(member) };
}

function toHref(navData: NavigationData, parentPageInterface: string) {
    // An entry that opens a page of its own links to the page itself, not an anchor on it.
    const isPageLink = navData.pageInterface !== parentPageInterface;
    return {
        href: isPageLink ? navData.pathname : `${navData.pathname}#${navData.hash}`,
        anchorId: isPageLink ? undefined : navData.hash,
        isPageLink,
    };
}

function shouldListAll(options: FallbackNavOptions, level: number, isCurrentPage: boolean) {
    return level < options.depth || isCurrentPage;
}

function buildMemberItem(
    walk: NavWalk,
    member: MemberNode,
    path: NavigationPath[],
    level: number,
    parentRef: InterfaceNode
): FallbackNavItem {
    const { reference, config } = walk;
    const specialTypes = config.specialTypes;
    const memberType = getMemberType(member);
    const memberRef = reference.get(memberType);
    const specialType = specialTypes?.[memberType];
    const isInterfaceArrayOrRecord = specialType === 'InterfaceArray' || specialType === 'InterfaceRecord';

    const parentNavData = getNavigationDataFromPath(path.slice(0, -1), specialTypes);
    const navData = getNavigationDataFromPath(path, specialTypes);
    const { href, anchorId, isPageLink } = toHref(navData, parentNavData.pageInterface);
    const isCurrentPage = isPageLink && navData.pageInterface === walk.pageInterface;

    const item: FallbackNavItem = {
        label: `${cleanupName(member.name)}${specialType === 'InterfaceRecord' ? '.key' : ''}`,
        href,
        isCurrentPage,
        anchorId,
        member,
        children: [],
    };

    const listAll = shouldListAll(walk, level, isCurrentPage);
    if ((!listAll && !leadsToPage(walk, memberType)) || config.noExpand?.includes(cleanupName(member.name))) {
        return item;
    }

    if (isInterfaceArrayOrRecord) {
        item.children = buildVariantItems(walk, getInterfaceArrayTypes(reference, memberRef), path, level + 1, listAll);
        return item;
    }

    if (specialType !== 'NestedPage') {
        const unionVariants = getAliasedUnionVariants(memberRef, reference);
        if (unionVariants) {
            item.children = buildVariantItems(
                walk,
                unionVariants.variants,
                path,
                level + 1,
                listAll,
                unionVariants.genericsMap
            );
            return item;
        }
    }

    if (memberRef?.kind !== 'interface') {
        return item;
    }

    let typeArguments: string[] | undefined;
    if (typeof member.type === 'object' && member.type.kind === 'typeRef') {
        typeArguments = member.type.typeArguments?.map((genericType) =>
            normalizeType(parentRef.genericsMap?.[genericType as any] ?? genericType)
        );
    }

    const skip = getOmittedMembers(walk, member);
    const childMembers = processMembers(memberRef, config, typeArguments).filter(
        (childMember) => !skip?.includes(childMember.name)
    );
    item.children = buildMemberItems(walk, childMembers, path, level + 1, memberRef, listAll);
    return item;
}

function buildVariantItems(
    walk: NavWalk,
    variants: NavigationPath[],
    parentPath: NavigationPath[],
    level: number,
    listAll: boolean,
    genericsMap?: Record<string, TypeNode>
): FallbackNavItem[] {
    const { reference, config } = walk;
    const parentNavData = getNavigationDataFromPath(parentPath, config.specialTypes);

    return variants.flatMap((variant) => {
        const variantRef = reference.get(variant.type);
        if (variantRef?.kind !== 'interface') {
            return [];
        }

        const path = parentPath.concat(variant);
        const navData = getNavigationDataFromPath(path, config.specialTypes);
        const { href, anchorId, isPageLink } = toHref(navData, parentNavData.pageInterface);
        if (!listAll && !isPageLink) {
            return [];
        }
        const isCurrentPage = isPageLink && navData.pageInterface === walk.pageInterface;
        const discriminatorKey = getVariantDiscriminator(variantRef)?.key ?? 'type';

        const item: FallbackNavItem = {
            label: isPageLink ? apiReferencePageHeading(navData.pageTitle) : `${discriminatorKey}='${variant.name}'`,
            href,
            isCurrentPage,
            anchorId,
            children: [],
        };

        const listMembers = shouldListAll(walk, level, isCurrentPage);
        if (listMembers || leadsToPage(walk, variant.type)) {
            const typeArguments = buildTypeArgumentsFromGenericsMap(variantRef, genericsMap);
            const members = processMembers(variantRef, config, typeArguments);
            item.children = buildMemberItems(walk, members, path, level + 1, variantRef, listMembers, false);
        }

        return [item];
    });
}

/** The entry for the page being rendered, whose members the page lists. */
export function findCurrentPage(item: FallbackNavItem): FallbackNavItem | undefined {
    if (item.isCurrentPage) {
        return item;
    }
    for (const child of item.children) {
        const found = findCurrentPage(child);
        if (found) {
            return found;
        }
    }
}

/**
 * The entries below `item` that are anchors on the page being rendered, nested as in the navigation.
 * Entries that open a page of their own are left out, along with everything beneath them, as the
 * page that renders them provides their targets.
 */
export function getNestedAnchors(item: FallbackNavItem): FallbackNavItem[] {
    return item.children
        .filter((child) => child.anchorId != null)
        .map((child) => ({ ...child, children: getNestedAnchors(child) }));
}

/** Members an `Omit<>`-typed member leaves out, which the hydrated tree skips too. */
function getOmittedMembers({ reference }: FallbackNavOptions, member: MemberNode & { omit?: string }) {
    const omitType = member.omit == null ? undefined : reference.get(member.omit);
    if (omitType?.kind === 'typeAlias' && typeof omitType.type === 'object' && omitType.type.kind === 'union') {
        return omitType.type.type.map((type) => normalizeType(type).replace(/^'(.*)'$/, '$1'));
    }
}
