import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { createImageVariantConfig } from '../../../util/sdkLoader';
import { denormalisedResponseEntities } from '../../../util/data';

import { ListingCard } from '../../../components';

import css from './CategoryCarousels.module.css';

// How many listings each category row can show (about 5 are visible at once on desktop)
const MAX_LISTINGS_PER_CATEGORY = 15;

/**
 * Thunk: fetch the newest listings of one top-level category, with their first image.
 * Rendered client-side only (below the fold), so it is not part of the page's loadData.
 *
 * @param {string} categoryId pub_categoryLevel1 value
 * @param {Object} config app configuration
 * @returns {Function} thunk resolving to an array of denormalised listings
 */
const fetchCategoryListings = (categoryId, config) => (dispatch, getState, sdk) => {
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  return sdk.listings
    .query({
      pub_categoryLevel1: categoryId,
      perPage: MAX_LISTINGS_PER_CATEGORY,
      include: ['author', 'images'],
      'fields.listing': [
        'title',
        'price',
        'deleted',
        'state',
        'publicData.listingType',
        'publicData.transactionProcessAlias',
        'publicData.unitType',
        'publicData.cardStyle',
      ],
      'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
      'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
      ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
      'limit.images': 1,
    })
    .then(response => denormalisedResponseEntities(response));
};

/**
 * One horizontally scrolling row of listings for a single category, with previous/next arrows.
 *
 * @component
 * @param {Object} props
 * @param {{id: string, name: string}} props.category top-level category
 * @param {Function} props.onShowOnMap called with the category id
 * @returns {JSX.Element}
 */
const CategoryRow = props => {
  const { category, onShowOnMap } = props;
  const config = useConfiguration();
  const intl = useIntl();
  const dispatch = useDispatch();
  const trackRef = useRef(null);

  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
    let isMounted = true;
    dispatch(fetchCategoryListings(category.id, config))
      .then(result => {
        if (isMounted) {
          setListings(result);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [category.id]);

  useEffect(() => {
    updateArrows();
  }, [listings]);

  // Move by roughly one "page" of visible cards
  const scrollByPage = direction => {
    const track = trackRef.current;
    if (track) {
      track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
    }
  };

  const headingId = `category-row-${category.id}`;

  return (
    <section className={css.row} aria-labelledby={headingId}>
      <div className={css.rowHeader}>
        <h3 id={headingId} className={css.rowTitle}>
          {category.name}
        </h3>
        <div className={css.rowActions}>
          <button type="button" className={css.showOnMap} onClick={() => onShowOnMap(category.id)}>
            <FormattedMessage id="CategoryCarousels.showOnMap" />
          </button>
          <button
            type="button"
            className={css.arrow}
            onClick={() => scrollByPage(-1)}
            disabled={!canScrollPrev}
            aria-label={intl.formatMessage({ id: 'CategoryCarousels.previous' })}
          >
            ‹
          </button>
          <button
            type="button"
            className={css.arrow}
            onClick={() => scrollByPage(1)}
            disabled={!canScrollNext}
            aria-label={intl.formatMessage({ id: 'CategoryCarousels.next' })}
          >
            ›
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className={css.message}>
          <FormattedMessage id="CategoryCarousels.loading" />
        </p>
      ) : listings.length === 0 ? (
        <p className={css.message}>
          <FormattedMessage id="CategoryCarousels.empty" />
        </p>
      ) : (
        <ul className={css.track} ref={trackRef} onScroll={updateArrows}>
          {listings.map(l => (
            <li key={l.id.uuid} className={css.item}>
              <ListingCard
                listing={l}
                showAuthorInfo={false}
                renderSizes="(max-width: 767px) 60vw, (max-width: 1023px) 30vw, 20vw"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

/**
 * Category rows shown below the map: one horizontally scrolling carousel per top-level category.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {Array<{id: string, name: string}>} props.categories top-level categories
 * @param {Function} props.onShowOnMap called with a category id to filter the map above
 * @returns {JSX.Element|null}
 */
const CategoryCarousels = props => {
  const { className, categories = [], onShowOnMap } = props;

  if (!categories.length) {
    return null;
  }

  return (
    <div className={classNames(css.root, className)}>
      <h2 className={css.title}>
        <FormattedMessage id="CategoryCarousels.title" />
      </h2>
      {categories.map(category => (
        <CategoryRow key={category.id} category={category} onShowOnMap={onShowOnMap} />
      ))}
    </div>
  );
};

export default CategoryCarousels;
