import { Fragment } from 'react';

export const Breadcrumbs = ({ breadcrumbs }) => {
    const breadcrumbsLength = Object.keys(breadcrumbs).length;

    if (breadcrumbsLength <= 1) {
        return null;
    }

    const links = [];
    let href = '';
    let index = 0;

    Object.entries(breadcrumbs).forEach(([key, text]) => {
        href += `${href.length > 0 ? '.' : 'reference-'}${key}`;

        if (index < breadcrumbsLength - 1) {
            links.push(
                <Fragment key={key}>
                    <a href={`#${href}`} title={text}>
                        {key}
                    </a>{' '}
                    &gt;{' '}
                </Fragment>
            );
        } else {
            links.push(<Fragment key={key}>{key}</Fragment>);
        }

        index++;
    });

    return <div className={styles.breadcrumbs}>{links}</div>;
};
