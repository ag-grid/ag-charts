import gridStyles from '@design-system/modules/SearchBox.module.scss';
import classnames from 'classnames';
import { useEffect, useState } from 'react';
import { connectSearchBox } from 'react-instantsearch-dom';

import { Icon } from '../icon/Icon';

/**
 * The search box shown in the header at the top of the page.
 */
const SearchBox = ({ delay, refine, currentRefinement, className, onFocus, resultsOpen }) => {
    const [timerId, setTimerId] = useState<ReturnType<typeof setTimeout>>();
    const [searchPlaceholder, setSearchPlaceholder] = useState<string>('Search documentation...');

    const onChangeDebounced = (event) => {
        const inputValue = event.target.value;

        clearTimeout(timerId);
        setTimerId(
            setTimeout(() => {
                refine(inputValue);
            }, delay)
        );
    };

    useEffect(() => {
        if (window.innerWidth < 620) {
            setSearchPlaceholder('Search...');
        }
    }, []);

    return (
        <form className={classnames(className, gridStyles.searchBox)}>
            <input
                type="search"
                placeholder={searchPlaceholder}
                aria-label="Search"
                onChange={onChangeDebounced}
                onFocus={onFocus}
                className={resultsOpen ? gridStyles.resultsOpen : ''}
            />

            <Icon name="search" />
        </form>
    );
};
export default connectSearchBox(SearchBox);
