import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import css from './ScrollToProductsButton.module.css';

// Hide the button once the visitor has scrolled this far down the page
const HIDE_AFTER_SCROLL_PX = 80;

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
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
