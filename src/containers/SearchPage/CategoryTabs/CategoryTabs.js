import React from 'react';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';

import { ALL_CATEGORIES_ICON_ID, CategoryIcon } from '../SearchMapPriceLabel/categoryIcons';

import { ALL_CATEGORY_COLOR, CATEGORY_COLORS } from './categoryColors';
import css from './CategoryTabs.module.css';

const tabColorStyle = color => ({
  '--tabBg': color.bg,
  '--tabText': color.text,
  '--tabActiveBg': color.active,
});

/**
 * Horizontal tab bar that shows one tab per top-level listing category plus an "All" tab.
 * Selecting a tab filters the search results (and the map markers) by that category.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {Array<{id: string, name: string}>} props.categories top-level category configuration
 * @param {string?} props.activeCategoryId currently selected category id (pub_categoryLevel1)
 * @param {Function} props.onSelect called with a category id, or null for "All"
 * @returns {JSX.Element|null}
 */
const CategoryTabs = props => {
  const { className, categories = [], activeCategoryId, onSelect } = props;
  const intl = useIntl();

  if (!categories.length) {
    return null;
  }

  const tabs = [
    { id: null, name: intl.formatMessage({ id: 'CategoryTabs.all' }), color: ALL_CATEGORY_COLOR },
    ...categories.map(({ id, name }, i) => ({
      id,
      name,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    })),
  ];

  return (
    <nav
      className={classNames(css.root, className)}
      aria-label={intl.formatMessage({ id: 'CategoryTabs.ariaLabel' })}
    >
      <ul className={css.tabList}>
        {tabs.map(tab => {
          const isActive = (activeCategoryId || null) === tab.id;
          return (
            <li key={tab.id || 'all'} className={css.tabItem}>
              <button
                type="button"
                className={classNames(css.tab, { [css.tabActive]: isActive })}
                style={tabColorStyle(tab.color)}
                aria-pressed={isActive}
                onClick={() => onSelect(tab.id)}
              >
                <CategoryIcon
                  categoryId={tab.id || ALL_CATEGORIES_ICON_ID}
                  className={css.tabIcon}
                />
                <span>{tab.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default CategoryTabs;
