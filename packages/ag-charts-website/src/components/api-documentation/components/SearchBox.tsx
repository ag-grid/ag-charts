import { Icon, type IconName } from '@ag-website-shared/components/icon/Icon';
import classnames from 'classnames';
import { type AllHTMLAttributes, type FormEventHandler, type KeyboardEventHandler, useRef, useState } from 'react';

import { INDEXED_SEARCH_FIELD, type SearchDatum, type SearchIndex } from '../apiReferenceHelpers';
import { HighlightText } from './HighlightText';
import styles from './OptionsNavigation.module.scss';

type SelectionHandler = (data: SearchDatum) => void;

export function SearchBox({
    className,
    searchData,
    searchDataIndex,
    placeholder = 'Search properties...',
    iconName = 'search',
    onItemClick,
    markResults = true,
    ...props
}: AllHTMLAttributes<Element> & {
    iconName?: IconName;
    searchData: SearchDatum[];
    searchDataIndex: SearchIndex;
    markResults?: boolean;
    onItemClick: SelectionHandler;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inFocus, setInFocus] = useState(false);
    const {
        data,
        searchQuery,
        selectedIndex,
        dropdownRef,
        selectedOptionRef,
        handleInput,
        handleClick,
        handleKeyDown,
        selectFromPointer,
    } = useSearch(searchData, searchDataIndex, (d) => {
        onItemClick(d);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    });

    return (
        <div className={classnames(styles.searchOuter, className)} {...props}>
            <input
                type="search"
                ref={inputRef}
                className={styles.searchInput}
                placeholder={placeholder}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onBlur={() => setInFocus(false)}
                onFocus={() => setInFocus(true)}
            />
            <Icon svgClasses={styles.searchIcon} name={iconName} />

            {searchQuery.length > 0 && inFocus && (
                <div ref={dropdownRef} className={styles.searchDropdown} onMouseDown={(e) => e.preventDefault()}>
                    <div className={styles.searchOptions}>
                        {data.length ? (
                            data.map((innerData, index) => (
                                <div
                                    // Sibling union variants can collapse to the same label, so the
                                    // label alone is not unique.
                                    key={`${index}-${innerData.label}`}
                                    ref={index === selectedIndex ? selectedOptionRef : null}
                                    className={classnames(styles.searchOption, {
                                        [styles.selected]: index === selectedIndex,
                                    })}
                                    onClick={() => handleClick(innerData)}
                                    onMouseEnter={() => selectFromPointer(index)}
                                >
                                    {markResults && searchQuery ? (
                                        <HighlightText text={innerData.label} searchTerm={searchQuery} />
                                    ) : (
                                        innerData.label
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className={styles.searchOption}>
                                <span className="text-sm">
                                    We couldn't find any matches for "<b>{searchQuery}</b>"
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function useSearch(
    searchData: SearchDatum[],
    searchDataIndex: SearchIndex,
    onItemClick: SelectionHandler,
    initialValue = ''
) {
    const [data, setFilteredData] = useState(searchData);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState(initialValue);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const shouldScrollToSelection = useRef(false);

    // An option selected by the pointer is already under the cursor, so scrolling to it would fight
    // the scroll the user is performing.
    const selectFromPointer = (index: number) => {
        shouldScrollToSelection.current = false;
        setSelectedIndex(index);
    };

    const selectedOptionRef = (element: HTMLDivElement | null) => {
        if (!element || !shouldScrollToSelection.current) {
            return;
        }
        shouldScrollToSelection.current = false;
        scrollVerticallyIntoView(element, dropdownRef.current);
    };

    const handleInput: FormEventHandler<HTMLInputElement> = (event) => {
        const inputSearchQuery = event.currentTarget.value.trim().toLowerCase();

        const searchableEntries = searchDataIndex
            .search(inputSearchQuery, 500)
            .find(({ field }) => field === INDEXED_SEARCH_FIELD);

        const dataResults =
            searchableEntries?.result.map((id) => {
                return searchData[id];
            }) ?? [];

        setFilteredData(dataResults);

        setSearchQuery(inputSearchQuery);
        shouldScrollToSelection.current = true;
        setSelectedIndex(0);
    };

    const handleClick = (d: SearchDatum) => {
        setSearchQuery('');
        onItemClick(d);
    };

    const handleKeyDown: KeyboardEventHandler = (event) => {
        if (['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
            event.preventDefault();
            // eslint-disable-next-line no-restricted-properties
            event.stopPropagation();
        }
        switch (event.key) {
            case 'ArrowUp':
                shouldScrollToSelection.current = true;
                setSelectedIndex(selectedIndex === 0 ? data.length - 1 : selectedIndex - 1);
                break;
            case 'ArrowDown':
                shouldScrollToSelection.current = true;
                setSelectedIndex(selectedIndex === data.length - 1 ? 0 : selectedIndex + 1);
                break;
            case 'Enter':
                if (data[selectedIndex]) {
                    handleClick(data[selectedIndex]);
                }
                break;
        }
    };

    return {
        data,
        searchQuery,
        selectedIndex,
        dropdownRef,
        selectedOptionRef,
        setSearchQuery,
        selectFromPointer,
        handleInput,
        handleClick,
        handleKeyDown,
    };
}

// Element.scrollIntoView() cannot be constrained to one axis, so the scroll is applied by hand to
// leave the horizontal position the user has scrolled to untouched.
function scrollVerticallyIntoView(element: HTMLElement, container: HTMLElement | null) {
    if (!container) {
        return;
    }

    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    if (elementRect.top < containerRect.top) {
        container.scrollTop -= containerRect.top - elementRect.top;
    } else if (elementRect.bottom > containerRect.bottom) {
        container.scrollTop += elementRect.bottom - containerRect.bottom;
    }
}
