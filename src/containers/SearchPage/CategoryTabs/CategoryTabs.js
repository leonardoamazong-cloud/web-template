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
 * Each category tab has a checkbox on its right: several categories can be ticked at once and
 * the search results (and map markers) show businesses in any of them. "All" clears the ticks.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {Array<{id: string, name: string}>} props.categories top-level category configuration
 * @param {Array<string>} props.selectedIds ticked category ids (empty = all)
 * @param {Function} props.onToggle called with a category id to tick/untick it, or null for "All"
 * @returns {JSX.Element|null}
 */
const CategoryTabs = props => {
  const { className, categories = [], selectedIds = [], onToggle } = props;
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
          const isAll = tab.id === null;
          const isActive = isAll ? selectedIds.length === 0 : selectedIds.includes(tab.id);
          return (
            <li key={tab.id || 'all'} className={css.tabItem}>
              <button
                type="button"
                className={classNames(css.tab, { [css.tabActive]: isActive })}
                style={tabColorStyle(tab.color)}
                aria-pressed={isActive}
                onClick={() => onToggle(tab.id)}
              >
                <CategoryIcon
                  categoryId={tab.id || ALL_CATEGORIES_ICON_ID}
                  className={css.tabIcon}
                />
                <span>{tab.name}</span>
                {!isAll ? (
                  <span
                    className={classNames(css.checkbox, { [css.checkboxChecked]: isActive })}
                    aria-hidden="true"
                  >
                    {isActive ? (
                      <svg viewBox="0 0 24 24" width="12" height="12" className={css.checkIcon}>
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    ) : null}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default CategoryTabs;
