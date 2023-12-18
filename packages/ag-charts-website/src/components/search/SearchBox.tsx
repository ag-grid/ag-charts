import gridStyles from '@design-system/modules/gridSearchBox.module.scss';
import classnames from 'classnames';
import React, { useState } from 'react';
import { connectSearchBox } from 'react-instantsearch-dom';

import { Icon } from '../icon/Icon';

const IS_SSR = typeof window === 'undefined';

/**
 * The search box shown in the header at the top of the page.
 */
const SearchBox = ({ delay, refine, currentRefinement, className, onFocus, resultsOpen }) => {
    const [timerId, setTimerId] = useState();

    const onChangeDebounced = (event) => {
        const inputValue = event.target.value;

        clearTimeout(timerId);
        setTimerId(
            setTimeout(() => {
                refine(inputValue);
            }, delay)
        );
    };

    const searchPlaceholder = !IS_SSR && window.innerWidth < 620 ? 'Search...' : 'Search documentation...';

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
