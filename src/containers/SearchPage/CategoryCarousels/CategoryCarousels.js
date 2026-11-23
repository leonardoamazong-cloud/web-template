import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';
import { denormalizeAssetData } from '../../../util/data';

import { ExternalLink, ResponsiveImage } from '../../../components';

import css from './CategoryCarousels.module.css';

// Console > Content > Pages > page with this ID holds the showcase images.
// Each section of that page becomes one carousel row (section title = row title,
// each block's image + title + optional button link = one card).
export const SHOWCASE_ASSET_PATH = 'content/pages/showcase.json';

// Max cards per row (about 4.5 are visible at once on desktop)
const MAX_ITEMS_PER_ROW = 15;

/**
 * Thunk: fetch the operator's showcase page from Sharetribe hosted assets.
 * Rendered client-side only (below the fold), so it is not part of the page's loadData.
 *
 * @returns {Function} thunk resolving to the denormalised page data, or null if missing
 */
const fetchShowcase = () => (dispatch, getState, sdk) =>
  sdk
    .assetByAlias({ path: SHOWCASE_ASSET_PATH, alias: 'latest' })
    .then(response => denormalizeAssetData(response.data))
    .catch(() => null);

// Grey placeholder cards shown in a row that has no images yet
const PLACEHOLDER_COUNT = 6;

/**
 * Turn the Console page sections into carousel rows. Rows without images show placeholders.
 *
 * @param {Object} pageData denormalised page asset
 * @returns {Array<{id: string, title: string, items: Array}>}
 */
const toRows = pageData => {
  const sections = pageData?.sections || [];
  return sections
    .map((section, i) => {
      const items = (section.blocks || [])
        .filter(block => block?.media?.image?.attributes?.variants)
        .slice(0, MAX_ITEMS_PER_ROW)
        .map((block, j) => ({
          id: block.blockId || `${i}-${j}`,
          image: block.media.image,
          alt: block.media.alt || block.title?.content || '',
          title: block.title?.content || '',
          href: block.callToAction?.href || block.media?.link?.href || null,
        }));
      return {
        id: section.sectionId || `section-${i}`,
        title: section.title?.content || '',
        items,
      };
    })
    .filter(row => row.title || row.items.length > 0);
};

/**
 * Link wrapper: internal paths use the app router, other URLs open in a new tab.
 */
const CardLink = props => {
  const { href, className, children } = props;
  if (!href) {
    return <div className={className}>{children}</div>;
  }
  return href.startsWith('/') ? (
    <Link to={href} className={className}>
      {children}
    </Link>
  ) : (
    <ExternalLink href={href} className={className}>
      {children}
    </ExternalLink>
  );
};

/**
 * One horizontally scrolling row of showcase images with arrows on both sides.
 *
 * @component
 * @param {Object} props
 * @param {{id: string, title: string, items: Array}} props.row
 * @returns {JSX.Element}
 */
const CarouselRow = props => {
  const { row } = props;
  const intl = useIntl();
  const trackRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateArrows = () => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    setCanScrollPrev(track.scrollLeft > 4);
    setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, []);

  // Move by roughly one "page" of visible cards
  const scrollByPage = direction => {
    const track = trackRef.current;
    if (track) {
      track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
    }
  };

  const headingId = `showcase-row-${row.id}`;

  return (
    <section className={css.row} aria-labelledby={headingId}>
      <h3 id={headingId} className={css.rowTitle}>
        {row.title}
      </h3>
      <div className={css.carousel}>
        <button
          type="button"
          className={classNames(css.arrow, css.arrowPrev)}
          onClick={() => scrollByPage(-1)}
          disabled={!canScrollPrev}
          aria-label={intl.formatMessage({ id: 'CategoryCarousels.previous' })}
        >
          ‹
        </button>
        <ul className={css.track} ref={trackRef} onScroll={updateArrows}>
          {row.items.length === 0
            ? [...Array(PLACEHOLDER_COUNT).keys()].map(i => (
                <li key={`placeholder-${i}`} className={css.item} aria-hidden="true">
                  <div className={css.imageWrapper} />
                </li>
              ))
            : null}
          {row.items.map(item => (
            <li key={item.id} className={css.item}>
              <CardLink href={item.href} className={css.card}>
                <div className={css.imageWrapper}>
                  <ResponsiveImage
                    rootClassName={css.image}
                    alt={item.alt}
                    image={item.image}
                    variants={Object.keys(item.image.attributes.variants)}
                    sizes="(max-width: 767px) 70vw, (max-width: 1023px) 35vw, 25vw"
                  />
                </div>
                {item.title ? <p className={css.cardTitle}>{item.title}</p> : null}
              </CardLink>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={classNames(css.arrow, css.arrowNext)}
          onClick={() => scrollByPage(1)}
          disabled={!canScrollNext}
          aria-label={intl.formatMessage({ id: 'CategoryCarousels.next' })}
        >
          ›
        </button>
      </div>
    </section>
  );
};

/**
 * Showcase rows below the map: the marketplace operator's own images, one carousel per
 * section of the "showcase" page in Sharetribe Console. Renders nothing until that page exists.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @returns {JSX.Element|null}
 */
const CategoryCarousels = props => {
  const { className } = props;
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let isMounted = true;
    dispatch(fetchShowcase()).then(pageData => {
      if (isMounted) {
        setRows(toRows(pageData));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!rows.length) {
    return null;
  }

  return (
    <div className={classNames(css.root, className)}>
      {rows.map(row => (
        <CarouselRow key={row.id} row={row} />
      ))}
    </div>
  );
};

export default CategoryCarousels;
