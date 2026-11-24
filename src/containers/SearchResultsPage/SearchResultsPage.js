import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

// Utils
import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { denormalisedResponseEntities } from '../../util/data';
import { formatMoney } from '../../util/currency';
import { createSlug, parse, stringify } from '../../util/urlHelpers';
import { BUSINESS_PAGE_LISTING_TYPE, getBusinessCategoryIds } from '../../util/businessPage';
import { isScrollingDisabled } from '../../ducks/ui.duck';

// Shared components
import {
  Page,
  LayoutSingleColumn,
  NamedLink,
  ResponsiveImage,
  IconSpinner,
} from '../../components';

// Related components
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import { CategoryIcon } from '../SearchPage/SearchMapPriceLabel/categoryIcons';
import { getCategoryColor } from '../SearchPage/CategoryTabs/categoryColors';

import css from './SearchResultsPage.module.css';

const RESULTS_PER_SECTION = 24;
const IMAGE_PARAMS = {
  include: ['images', 'author'],
  'fields.image': ['variants.scaled-small', 'variants.scaled-medium'],
  'limit.images': 1,
};
const IMAGE_VARIANTS = ['scaled-small', 'scaled-medium'];

/**
 * Thunk: keyword search for sellers' business pages and for products (all other listing types),
 * plus the business page of every product's seller so product cards can link to it.
 * Client-side only.
 *
 * @param {string} keywords search words
 * @param {Object} config marketplace configuration
 * @returns {Function} thunk resolving to { sellers, products, sellerPageByAuthor }
 */
const searchSellersAndProducts = (keywords, config) => (dispatch, getState, sdk) => {
  const productTypes = (config.listing.listingTypes || [])
    .map(t => t.listingType)
    .filter(t => t !== BUSINESS_PAGE_LISTING_TYPE);

  const query = params =>
    sdk.listings
      .query({ keywords, perPage: RESULTS_PER_SECTION, ...IMAGE_PARAMS, ...params })
      .then(denormalisedResponseEntities);

  const sellersPromise = query({ pub_listingType: BUSINESS_PAGE_LISTING_TYPE });
  const productsPromise =
    productTypes.length > 0 ? query({ pub_listingType: productTypes }) : Promise.resolve([]);

  return Promise.all([sellersPromise, productsPromise]).then(([sellers, products]) => {
    // Find the business page of each product's seller (one small query per seller)
    const authorIds = [...new Set(products.map(p => p.author?.id?.uuid).filter(Boolean))];
    const knownPages = sellers.reduce(
      (acc, s) => (s.author?.id ? { ...acc, [s.author.id.uuid]: s } : acc),
      {}
    );
    const missing = authorIds.filter(id => !knownPages[id]);
    return Promise.all(
      missing.map(authorId =>
        sdk.listings
          .query({ authorId, pub_listingType: BUSINESS_PAGE_LISTING_TYPE, perPage: 1 })
          .then(res => [authorId, denormalisedResponseEntities(res)[0] || null])
          .catch(() => [authorId, null])
      )
    ).then(found => {
      const sellerPageByAuthor = found.reduce(
        (acc, [authorId, page]) => (page ? { ...acc, [authorId]: page } : acc),
        knownPages
      );
      return { sellers, products, sellerPageByAuthor };
    });
  });
};

const imageOf = listing => {
  const first = listing.images?.[0];
  return first?.attributes?.variants ? first : null;
};

const listingLinkParams = listing => ({
  id: listing.id.uuid,
  slug: createSlug(listing.attributes.title),
});

const SellerCard = ({ listing, categories }) => {
  const { title, publicData } = listing.attributes;
  const image = imageOf(listing);
  const categoryIds = getBusinessCategoryIds(publicData);
  return (
    <NamedLink className={css.card} name="ListingPage" params={listingLinkParams(listing)}>
      <div className={css.imageWrapper}>
        {image ? (
          <ResponsiveImage
            rootClassName={css.image}
            alt={title}
            image={image}
            variants={IMAGE_VARIANTS}
            sizes="(max-width: 767px) 100vw, 300px"
          />
        ) : null}
      </div>
      <div className={css.cardBody}>
        <span className={css.cardTitle}>{title}</span>
        {publicData?.location?.address ? (
          <span className={css.cardMeta}>{publicData.location.address}</span>
        ) : null}
        <span className={css.chips}>
          {categoryIds.map(id => {
            const category = categories.find(c => c.id === id);
            const color = getCategoryColor(id, categories);
            return category ? (
              <span
                key={id}
                className={css.chip}
                style={color ? { backgroundColor: color.bg, color: color.text } : null}
              >
                <CategoryIcon categoryId={id} className={css.chipIcon} />
                {category.name}
              </span>
            ) : null;
          })}
        </span>
      </div>
    </NamedLink>
  );
};

// Product cards open the seller's business page (shop photos, gallery, services);
// if the seller has no business page yet, the product page opens instead.
const ProductCard = ({ listing, sellerPage, intl, config }) => {
  const { title, price } = listing.attributes;
  const image = imageOf(listing);
  const formattedPrice =
    price && price.currency === config.currency ? formatMoney(intl, price) : null;
  const authorName = listing.author?.attributes?.profile?.displayName;
  const target = sellerPage || listing;
  return (
    <div className={css.productCard}>
      <NamedLink className={css.card} name="ListingPage" params={listingLinkParams(target)}>
        <div className={css.imageWrapper}>
          {image ? (
            <ResponsiveImage
              rootClassName={css.image}
              alt={title}
              image={image}
              variants={IMAGE_VARIANTS}
              sizes="(max-width: 767px) 50vw, 240px"
            />
          ) : null}
        </div>
        <div className={css.cardBody}>
          <span className={css.cardTitle}>{title}</span>
          {formattedPrice ? <span className={css.price}>{formattedPrice}</span> : null}
        </div>
      </NamedLink>
      {sellerPage ? (
        <NamedLink
          className={css.sellerLink}
          name="ListingPage"
          params={listingLinkParams(sellerPage)}
        >
          {sellerPage.attributes.title}
        </NamedLink>
      ) : authorName ? (
        <span className={css.sellerName}>{authorName}</span>
      ) : null}
    </div>
  );
};

/**
 * Search results page: keyword search over sellers (business pages) and products.
 * Product cards open the seller's business page.
 *
 * @component
 * @returns {JSX.Element}
 */
const SearchResultsPage = () => {
  const intl = useIntl();
  const config = useConfiguration();
  const dispatch = useDispatch();
  const location = useLocation();
  const scrollingDisabled = useSelector(state => isScrollingDisabled(state));

  const { keywords = '' } = parse(location.search);
  const searchWords = `${keywords}`.trim();
  const categories = config.categoryConfiguration?.categories || [];

  const [state, setState] = useState({ inProgress: false, error: false, results: null });

  useEffect(() => {
    if (!searchWords) {
      setState({ inProgress: false, error: false, results: null });
      return;
    }
    let isMounted = true;
    setState(prev => ({ ...prev, inProgress: true, error: false }));
    dispatch(searchSellersAndProducts(searchWords, config))
      .then(results => isMounted && setState({ inProgress: false, error: false, results }))
      .catch(() => isMounted && setState({ inProgress: false, error: true, results: null }));
    return () => {
      isMounted = false;
    };
  }, [searchWords]);

  const { inProgress, error, results } = state;
  const sellers = results?.sellers || [];
  const products = results?.products || [];
  const sellerPageByAuthor = results?.sellerPageByAuthor || {};
  const hasResults = sellers.length > 0 || products.length > 0;

  const title = intl.formatMessage(
    { id: 'SearchResultsPage.schemaTitle' },
    { keywords: searchWords, marketplaceName: config.marketplaceName }
  );

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.header}>
            <h1 className={css.title}>
              {searchWords ? (
                <FormattedMessage id="SearchResultsPage.title" values={{ keywords: searchWords }} />
              ) : (
                <FormattedMessage id="SearchResultsPage.noKeywords" />
              )}
            </h1>
            {searchWords ? (
              <NamedLink
                className={css.mapButton}
                name="SearchPage"
                to={{ search: `?${stringify({ keywords: searchWords })}` }}
              >
                <FormattedMessage id="SearchResultsPage.showOnMap" />
              </NamedLink>
            ) : null}
          </div>

          {inProgress ? (
            <div className={css.loading}>
              <IconSpinner />
            </div>
          ) : null}

          {error ? (
            <p className={css.error}>
              <FormattedMessage id="SearchResultsPage.error" />
            </p>
          ) : null}

          {!inProgress && results && !hasResults ? (
            <p className={css.empty}>
              <FormattedMessage id="SearchResultsPage.noResults" values={{ keywords: searchWords }} />
            </p>
          ) : null}

          {!inProgress && sellers.length > 0 ? (
            <section className={css.section}>
              <h2 className={css.sectionTitle}>
                <FormattedMessage
                  id="SearchResultsPage.sellersTitle"
                  values={{ count: sellers.length }}
                />
              </h2>
              <ul className={css.sellerGrid}>
                {sellers.map(s => (
                  <li key={s.id.uuid}>
                    <SellerCard listing={s} categories={categories} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {!inProgress && products.length > 0 ? (
            <section className={css.section}>
              <h2 className={css.sectionTitle}>
                <FormattedMessage
                  id="SearchResultsPage.productsTitle"
                  values={{ count: products.length }}
                />
              </h2>
              <ul className={css.productGrid}>
                {products.map(p => (
                  <li key={p.id.uuid}>
                    <ProductCard
                      listing={p}
                      sellerPage={sellerPageByAuthor[p.author?.id?.uuid]}
                      intl={intl}
                      config={config}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default SearchResultsPage;
