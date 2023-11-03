import type { IconName } from '@components/icon/Icon';
import { Icon } from '@components/icon/Icon';
import classnames from 'classnames';
import type { AllHTMLAttributes, FormEventHandler, KeyboardEventHandler } from 'react';
import { useState } from 'react';
import Markdown from 'react-markdown';

import type { SearchDatum } from '../apiReferenceHelpers';
import styles from './OptionsNavigation.module.scss';

type SelectionHandler = (data: SearchDatum) => void;

export function SearchBox({
    className,
    searchData,
    placeholder = 'Search properties...',
    iconName = 'search',
    onItemClick,
    markResults = true,
    ...props
}: AllHTMLAttributes<Element> & {
    iconName?: IconName;
    searchData: SearchDatum[];
    markResults?: boolean;
    onItemClick?: SelectionHandler;
}) {
    const [inFocus, setInFocus] = useState(false);
    const { data, searchQuery, selectedIndex, handleInput, handleKeyDown, setSelectedIndex } = useSearch(
        searchData,
        onItemClick
    );

    const cleanQuery = searchQuery.replace(/[^-a-z0-9]/g, '');
    const searchRegexp = new RegExp(`(${cleanQuery})+`, 'ig');

    return (
        <div className={classnames(styles.searchOuter, className)} {...props}>
            <input
                type="search"
                className={styles.searchInput}
                placeholder={placeholder}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onBlur={() => setInFocus(false)}
                onFocus={() => setInFocus(true)}
            />
            <Icon svgClasses={styles.searchIcon} name={iconName} />

            {data.length > 0 && searchQuery.length > 0 && inFocus && (
                <div className={styles.searchDropdown} onMouseDown={(e) => e.preventDefault()}>
                    <div className={styles.searchOptions}>
                        {data.map((data, index) => (
                            <div
                                key={data.label}
                                ref={
                                    index === selectedIndex
                                        ? (ref) => ref?.scrollIntoView({ block: 'nearest', inline: 'start' })
                                        : null
                                }
                                className={classnames(styles.searchOption, {
                                    [styles.selected]: index === selectedIndex,
                                })}
                                onClick={() => onItemClick?.(data)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                {markResults && searchQuery ? (
                                    <Markdown>{data.label.replace(searchRegexp, `**$1**`)}</Markdown>
                                ) : (
                                    data.label
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function useSearch(searchData: SearchDatum[], onItemClick?: SelectionHandler, initialValue = '') {
    const [data, setFilteredData] = useState(searchData);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState(initialValue);

    const handleInput: FormEventHandler<HTMLInputElement> = (event) => {
        const searchQuery = event.currentTarget.value.trim().toLowerCase();
        setFilteredData(
            searchData
                .filter((item) => item.searchable.includes(searchQuery))
                .sort((a, b) => a.label.toLowerCase().indexOf(searchQuery) - b.label.toLowerCase().indexOf(searchQuery))
        );
        setSearchQuery(searchQuery);
        setSelectedIndex(0);
    };

    const handleKeyDown: KeyboardEventHandler = (event) => {
        if (['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
            event.preventDefault();
            event.stopPropagation();
        }
        switch (event.key) {
            case 'ArrowUp':
                setSelectedIndex(selectedIndex === 0 ? data.length - 1 : selectedIndex - 1);
                break;
            case 'ArrowDown':
                setSelectedIndex(selectedIndex === data.length - 1 ? 0 : selectedIndex + 1);
                break;
            case 'Enter':
                if (data[selectedIndex]) {
                    onItemClick?.(data[selectedIndex]);
                }
                break;
        }
    };

    return { data, searchQuery, selectedIndex, setSearchQuery, setSelectedIndex, handleInput, handleKeyDown };
}
