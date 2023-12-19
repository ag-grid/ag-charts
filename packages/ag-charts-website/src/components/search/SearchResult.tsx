import { PUBLIC_BASE_URL, PUBLIC_SITE_URL, SITE_BASE_URL, SITE_URL } from '@constants';
import gridStyles from '@design-system/modules/SearchResult.module.scss';
import classnames from 'classnames';
import { Highlight, Index, InfiniteHits, Snippet, connectStateResults } from 'react-instantsearch-dom';

const HitCount = connectStateResults(({ searchResults, hasResults }) => {
    const hitCount = searchResults && searchResults.nbHits;

    return (
        <div className={classnames(gridStyles.hitCount, { [gridStyles.hasResults]: hasResults })}>
            <span className="text-secondary">Results:</span> <b>{hitCount}</b>
        </div>
    );
});

const PageHit = ({ hit, onResultClicked }) => {
    const path = `${SITE_BASE_URL ?? ''}${hit.path}`.replaceAll('//', '/');
    const url = `${SITE_URL}${path}`;
    return (
        <a href={url} onClick={onResultClicked}>
            <div className={classnames(gridStyles.breadcrumb, 'text-sm')}>{hit.breadcrumb}</div>
            <h4>
                <Highlight attribute="title" hit={hit} tagName="mark" />
                {hit.heading && (
                    <>
                        {`: `}
                        <Highlight attribute="heading" hit={hit} tagName="mark" />
                    </>
                )}
            </h4>
            <Snippet className="text-sm" attribute="text" hit={hit} tagName="mark" />
        </a>
    );
};

const Results = connectStateResults(({ searchState, searchResults, children, isSearchStalled }) => {
    if (searchResults && searchResults.nbHits > 0) {
        return children;
    } else {
        return (
            <div className={gridStyles.resultsMessage}>
                {isSearchStalled ? (
                    <span>Loading...</span>
                ) : (
                    <span>
                        We couldn't find any matches for "<b>{searchState.query}</b>"
                    </span>
                )}
            </div>
        );
    }
});

const HitsInIndex = ({ index, onResultClicked }) => (
    <Index indexName={index.name}>
        <Results>
            <InfiniteHits hitComponent={(props) => PageHit({ ...props, onResultClicked })} />
        </Results>
    </Index>
);

const SearchResult = ({ indices, show, onResultClicked }) => (
    <>
        <HitCount hasResults={show} />

        <div className={classnames(gridStyles.searchResults, { [gridStyles.isOpen]: show })}>
            {indices.map((index) => (
                <HitsInIndex index={index} key={index.name} onResultClicked={onResultClicked} />
            ))}
        </div>
    </>
);

export default SearchResult;
