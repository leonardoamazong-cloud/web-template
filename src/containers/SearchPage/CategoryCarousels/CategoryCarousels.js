import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { useIntl } from '../../../util/reactIntl';
import { denormalisedResponseEntities } from '../../../util/data';
import { createSlug } from '../../../util/urlHelpers';
import { BUSINESS_PAGE_LISTING_TYPE } from '../../../util/businessPage';

import { NamedLink, ResponsiveImage } from '../../../components';

import css from './CategoryCarousels.module.css';

// Max cards per row (about 4.5 are visible at once on desktop)
const MAX_ITEMS_PER_ROW = 15;

/**
 * Thunk: fetch the published product/service listings of one top-level category.
 * Business pages are excluded – they are shown in the list next to the map.
 * Rendered client-side only (below the fold), so it is not part of the page's loadData.
 *
 * @param {string} categoryId top-level category id (categoryLevel1)
 * @param {Object} config marketplace configuration
 * @returns {Function} thunk resolving to an array of listings
 */
const fetchCategoryProducts = (categoryId, config) => (dispatch, getState, sdk) => {
  const productListingTypes = (config.listing.listingTypes || [])
    .map(t => t.listingType)
    .filter(t => t !== BUSINESS_PAGE_LISTING_TYPE);
  return sdk.listings
    .query({
      pub_categoryLevel1: categoryId,
      ...(productListingTypes.length > 0 ? { pub_listingType: productListingTypes } : {}),
      perPage: MAX_ITEMS_PER_ROW,
      include: ['images'],
      'fields.listing': ['title', 'publicData'],
      'fields.image': ['variants.scaled-small', 'variants.scaled-medium'],
      'limit.images': 1,
    })
    .then(response => denormalisedResponseEntities(response))
    .catch(() => []);
};

/**
 * One horizontally scrolling row of product cards with arrows on both sides.
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

  const headingId = `product-row-${row.id}`;

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
          {row.items.map(listing => {
            const { title, publicData } = listing.attributes;
            const firstImage = listing.images?.[0];
            const image = firstImage?.attributes?.variants ? firstImage : null;
            const businessName = publicData?.isyeriAdi;
            return (
              <li key={listing.id.uuid} className={css.item}>
                <NamedLink
                  className={css.card}
                  name="ListingPage"
                  params={{ id: listing.id.uuid, slug: createSlug(title) }}
                >
                  <div className={css.imageWrapper}>
                    {image ? (
                      <ResponsiveImage
                        rootClassName={css.image}
                        alt={title}
                        image={image}
                        variants={['scaled-small', 'scaled-medium']}
                        sizes="(max-width: 767px) 70vw, (max-width: 1023px) 35vw, 25vw"
                      />
                    ) : null}
                  </div>
                  <p className={css.cardTitle}>{title}</p>
                  {businessName && businessName !== title ? (
                    <p className={css.cardSubtitle}>{businessName}</p>
                  ) : null}
                </NamedLink>
              </li>
            );
          })}
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
 * Product rows below the map: one carousel per top-level category with the products/services
 * sellers have published in that category. Clicking a card opens the product page.
 * Categories without products are not shown.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @returns {JSX.Element|null}
 */
const CategoryCarousels = props => {
  const { className } = props;
  const dispatch = useDispatch();
  const config = useConfiguration();
  const [rows, setRows] = useState([]);

  const categories = config.categoryConfiguration?.categories || [];

  useEffect(() => {
    let isMounted = true;
    Promise.all(
      categories.map(category =>
        dispatch(fetchCategoryProducts(category.id, config)).then(items => ({
          id: category.id,
          title: category.name,
          items,
        }))
      )
    ).then(allRows => {
      if (isMounted) {
        setRows(allRows.filter(row => row.items.length > 0));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [categories.map(c => c.id).join(',')]);

  if (!rows.length) {
    return null;
  }

  return (
    <div className={classNames(css.root, className)}>
      {rows.map(row => (
        <CarouselRow key={row.id} row={row} variantPrefix={variantPrefix} />
      ))}
    </div>
  );
};

export default CategoryCarousels;
