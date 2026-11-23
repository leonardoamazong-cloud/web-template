import React from 'react';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';

import css from './CategoryTabs.module.css';

// Soft (faded) color per category tab, assigned by the category's position in Console.
// bg = resting tint, text = readable dark shade of the same hue, active = stronger tint.
const TAB_COLORS = [
  { bg: '#EEEDFE', text: '#3C3489', active: '#CECBF6' }, // purple
  { bg: '#FAECE7', text: '#712B13', active: '#F5C4B3' }, // coral
  { bg: '#E1F5EE', text: '#085041', active: '#9FE1CB' }, // teal
  { bg: '#FAEEDA', text: '#633806', active: '#FAC775' }, // amber
  { bg: '#FBEAF0', text: '#72243E', active: '#F4C0D1' }, // pink
  { bg: '#E6F1FB', text: '#0C447C', active: '#B5D4F4' }, // blue
  { bg: '#EAF3DE', text: '#27500A', active: '#C0DD97' }, // green
  { bg: '#F1EFE8', text: '#444441', active: '#D3D1C7' }, // gray
];
const ALL_TAB_COLOR = { bg: '#FFFFFF', text: '#444441', active: '#D3D1C7' };

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
    { id: null, name: intl.formatMessage({ id: 'CategoryTabs.all' }), color: ALL_TAB_COLOR },
    ...categories.map(({ id, name }, i) => ({
      id,
      name,
      color: TAB_COLORS[i % TAB_COLORS.length],
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
                {tab.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default CategoryTabs;
