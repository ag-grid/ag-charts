import { Markdoc, type Schema, nodes } from '@astrojs/markdoc/config';
import { urlWithPrefix } from '@utils/urlWithPrefix';

export const link: Schema = {
    ...nodes.link,
    attributes: {
        ...nodes.link.attributes,
        /**
         * Open link in external tab
         */
        isExternal: { type: Boolean },
    },
    /**
     * Transform markdoc links to add url prefix and framework to href
     */
    transform(node, config) {
        const { framework } = config.variables;
        const children = node.transformChildren(config);
        const nodeAttributes = node.transformAttributes(config);
        const hasCodeChild = node.children.some((child: { type: string }) => child.type === 'code');

        // Links authored as './page' follow the visitor's framework; ones that name a framework in
        // the path keep their destination. Mark the former so `FrameworkLinks` can retarget them.
        const followsFramework = config.variables.markFrameworkLinks && nodeAttributes.href?.startsWith('./');

        const href = urlWithPrefix({ url: nodeAttributes.href, framework });

        const attributes = {
            ...nodeAttributes,
            href,
            ...(followsFramework ? { 'data-framework-link': 'true' } : undefined),
            target: nodeAttributes.isExternal ? '_blank' : undefined,
            ...(hasCodeChild ? { class: 'meta-link' } : undefined),
        };

        return new Markdoc.Tag('a', attributes, children);
    },
};
