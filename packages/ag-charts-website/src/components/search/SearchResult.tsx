import classnames from 'classnames';
import { Highlight, Index, InfiniteHits, Snippet, connectStateResults } from 'react-instantsearch-dom';

import styles from './SearchResult.module.scss';

const HitCount = connectStateResults(({ searchResults, hasResults }) => {
    const hitCount = searchResults && searchResults.nbHits;

    return (
        <div className={classnames(styles.hitCount, { [styles.hasResults]: hasResults })}>
            <span className="text-secondary">Results:</span> <b>{hitCount}</b>
        </div>
    );
});

const PageHit = ({ hit, onResultClicked }) => (
    <a href={hit.path} onClick={onResultClicked}>
        <div className={classnames(styles.breadcrumb, 'font-size-small')}>{hit.breadcrumb}</div>
        <h4>
            <Highlight attribute="title" hit={hit} tagName="mark" />
            {hit.heading && (
                <>
                    {`: `}
                    <Highlight attribute="heading" hit={hit} tagName="mark" />
                </>
            )}
        </h4>
        <Snippet className="font-size-small" attribute="text" hit={hit} tagName="mark" />
    </a>
);

const Results = connectStateResults(({ searchState, searchResults, children, isSearchStalled }) => {
    if (searchResults && searchResults.nbHits > 0) {
        return children;
    } else {
        return (
            <div className={styles.resultsMessage}>
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

        <div className={classnames(styles.searchResults, { [styles.isOpen]: show })}>
            {indices.map((index) => (
                <HitsInIndex index={index} key={index.name} onResultClicked={onResultClicked} />
            ))}
        </div>
    </>
);

export default SearchResult;
