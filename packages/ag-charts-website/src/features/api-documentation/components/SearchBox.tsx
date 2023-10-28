import type { IconName } from '@components/icon/Icon';
import { Icon } from '@components/icon/Icon';
import classnames from 'classnames';
import type { AllHTMLAttributes, FormEventHandler, KeyboardEventHandler } from 'react';
import { useState } from 'react';

import type { JsObjectSelection } from '../types';
import styles from './OptionsNavigation.module.scss';

type SearchDatum = { id: string; selection: JsObjectSelection };
type SelectionHandler = (selection: JsObjectSelection) => void;

export function SearchBox({
    className,
    searchData,
    placeholder = 'Search properties...',
    iconName = 'search',
    onItemClick,
    ...props
}: AllHTMLAttributes<Element> & {
    iconName?: IconName;
    searchData: SearchDatum[];
    onItemClick?: SelectionHandler;
}) {
    const { data, selectedIndex, handleInput, handleKeyDown, setSelectedIndex } = useSearch(searchData, onItemClick);
    const [inFocus, setInFocus] = useState(false);
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

            {data.length > 0 && inFocus && (
                <div className={styles.searchDropdown} onMouseDown={(e) => e.preventDefault()}>
                    <div className={styles.searchOptions}>
                        {data.map((data, index) => (
                            <div
                                key={data.id}
                                ref={
                                    index === selectedIndex
                                        ? (ref) => ref?.scrollIntoView({ block: 'nearest', inline: 'start' })
                                        : null
                                }
                                className={classnames(styles.searchOption, {
                                    [styles.selected]: index === selectedIndex,
                                })}
                                onClick={() => {
                                    onItemClick?.(data.selection);
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                {data.id.replace(/\s+/g, '')}
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
        const searchQuery = event.currentTarget.value;
        setFilteredData(searchData.filter((item) => item.id.includes(searchQuery)));
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
                    onItemClick?.(data[selectedIndex].selection);
                }
                break;
        }
    };

    return { data, searchQuery, selectedIndex, setSearchQuery, setSelectedIndex, handleInput, handleKeyDown };
}

// export function extractSearchDataFromJsonModel(model: JsonModel, idPrefix = '') {
//     return Object.keys(model.properties).flatMap(function walker(property) {
//         const results = [
//             {
//                 id: idPrefix + property,
//                 selection: {
//                     type: 'property',
//                     propName: property,
//                     path: idPrefix.split(/\.|(?=\[[^\]]+])/g).filter(Boolean),
//                     model,
//                 },
//             },
//         ];
//         const { desc } = model.properties[property];
//         if ('model' in desc) {
//             results.push(...extractSearchDataFromJsonModel(desc.model, `${idPrefix}${property}.`));
//         } else if ('elements' in desc && 'options' in desc.elements && Array.isArray(desc.elements.options)) {
//             results.push(
//                 ...desc.elements.options.flatMap((option) =>
//                     extractSearchDataFromJsonModel(
//                         option.model,
//                         `${idPrefix}${property}[type = ${option.model.properties.type.desc.tsType}].`
//                     )
//                 )
//             );
//         }
//         return results;
//     });
// }
