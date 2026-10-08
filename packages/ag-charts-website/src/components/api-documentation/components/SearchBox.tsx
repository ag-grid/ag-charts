import { Icon, type IconName } from '@ag-website-shared/components/icon/Icon';
import classnames from 'classnames';
import {
    type AllHTMLAttributes,
    type FormEventHandler,
    type KeyboardEventHandler,
    type RefObject,
    useEffect,
    useRef,
    useState,
} from 'react';

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
    usePreserveWindowScrollWhileEditing(inputRef);
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
                        {data.length > 0 ? (
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
                                    {markResults && searchQuery !== '' ? (
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

// The sticky input's caret can sit just inside the root `scroll-padding-top` band, where the browser's
// caret reveal after each edit scrolls the window without ever moving the caret, so the page drifts on
// every keystroke. `scroll-margin` does not affect caret reveal, so that scroll is undone before paint.
function usePreserveWindowScrollWhileEditing(inputRef: RefObject<HTMLInputElement>) {
    useEffect(() => {
        const input = inputRef.current;
        if (!input) {
            return;
        }

        let saved: { x: number; y: number } | undefined;
        let frame: number | undefined;

        const cancelFrame = () => {
            if (frame != null) {
                cancelAnimationFrame(frame);
                frame = undefined;
            }
        };
        const onBeforeInput = () => {
            cancelFrame();
            saved = { x: window.scrollX, y: window.scrollY };
        };
        const onInput = () => {
            cancelFrame();
            frame = requestAnimationFrame(() => {
                frame = requestAnimationFrame(() => {
                    frame = undefined;
                    saved = undefined;
                });
            });
        };
        const onScroll = () => {
            if (saved && (window.scrollX !== saved.x || window.scrollY !== saved.y)) {
                window.scrollTo(saved.x, saved.y);
            }
        };

        input.addEventListener('beforeinput', onBeforeInput);
        input.addEventListener('input', onInput);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            cancelFrame();
            input.removeEventListener('beforeinput', onBeforeInput);
            input.removeEventListener('input', onInput);
            window.removeEventListener('scroll', onScroll);
        };
    }, [inputRef]);
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
                const selectedDatum =
                    selectedIndex >= 0 && selectedIndex < data.length ? data[selectedIndex] : undefined;
                if (selectedDatum != null) {
                    handleClick(selectedDatum);
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
    // clientTop and clientHeight exclude the container's borders and scrollbar gutter, which the
    // bounding rect includes — aligning to the bounding rect leaves the option clipped by them.
    const visibleTop = containerRect.top + container.clientTop;
    const visibleBottom = visibleTop + container.clientHeight;

    if (elementRect.top < visibleTop) {
        container.scrollTop -= visibleTop - elementRect.top;
    } else if (elementRect.bottom > visibleBottom) {
        container.scrollTop += elementRect.bottom - visibleBottom;
    }
}
