import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import css from './ScrollToProductsButton.module.css';

// Hide the button once the visitor has scrolled this far down the page
const HIDE_AFTER_SCROLL_PX = 80;
// Height of the sticky category tab bar + a little breathing room
const CATEGORY_BAR_HEIGHT_PX = 56;
const EXTRA_GAP_PX = 8;

// Fixed topbar height from the global CSS variable (falls back to 72px)
const topbarHeight = () => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    '--topbarHeightDesktop'
  );
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 72;
};

/**
 * Floating "Browse products" button at the bottom of the search map. It tells buyers that
 * product carousels continue below the map and scrolls the page down to them.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string} props.targetId id of the element to scroll to
 * @returns {JSX.Element|null}
 */
const ScrollToProductsButton = props => {
  const { className, targetId } = props;
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsHidden(window.scrollY > HIDE_AFTER_SCROLL_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToProducts = () => {
    const target = typeof document !== 'undefined' ? document.getElementById(targetId) : null;
    if (target) {
      // Stop the first product row just below the fixed topbar and the sticky category bar
      const offset = topbarHeight() + CATEGORY_BAR_HEIGHT_PX + EXTRA_GAP_PX;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <button
      type="button"
      className={classNames(css.root, { [css.hidden]: isHidden }, className)}
      onClick={scrollToProducts}
      tabIndex={isHidden ? -1 : 0}
      aria-hidden={isHidden}
    >
      <FormattedMessage id="ScrollToProductsButton.label" />
      <svg
        className={css.arrow}
        viewBox="0 0 24 24"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <path d="M12 5v14M6 13l6 6 6-6" />
      </svg>
    </button>
  );
};

export default ScrollToProductsButton;
