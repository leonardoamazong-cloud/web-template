import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import classNames from 'classnames';

// Utils
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { denormalisedResponseEntities } from '../../../util/data';
import { createSlug } from '../../../util/urlHelpers';
import {
  BUSINESS_PAGE_LISTING_TYPE,
  BUSINESS_FIELD_KEYS,
  getBusinessCategoryIds,
} from '../../../util/businessPage';

// Shared components
import { NamedLink, ResponsiveImage, ExternalLink } from '../../../components';

// Related modules
import { CategoryIcon } from '../../SearchPage/SearchMapPriceLabel/categoryIcons';
import { getCategoryColor } from '../../SearchPage/CategoryTabs/categoryColors';

import css from './BusinessPage.module.css';

const MAX_GALLERY_PHOTOS = 20;
const HERO_VARIANTS = ['scaled-medium', 'scaled-large', 'scaled-xlarge'];

// Fetch the seller's other (service) listings. Client-side only: this section is not needed for SSR.
const fetchSellerServices = (authorId, config) => (dispatch, getState, sdk) => {
  const { variantPrefix = 'listing-card' } = config.layout.listingImage;
  return sdk.listings
    .query({
      authorId,
      include: ['images'],
      'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
      'limit.images': 1,
      perPage: 24,
    })
    .then(response =>
      denormalisedResponseEntities(response).filter(
        l => l.attributes.publicData?.listingType !== BUSINESS_PAGE_LISTING_TYPE
      )
    );
};

// Human readable value of a listing field (enum labels resolved from the field config)
const fieldValue = (publicData, key, listingFields) => {
  const value = publicData?.[key];
  if (value == null || value === '') {
    return null;
  }
  const fieldConfig = listingFields?.find(f => f.key === key);
  const options = fieldConfig?.enumOptions;
  if (options && !Array.isArray(value)) {
    return options.find(o => `${o.option}` === `${value}`)?.label || `${value}`;
  }
  return `${value}`;
};

const InfoCard = ({ label, value }) =>
  value ? (
    <div className={css.infoCard}>
      <div className={css.infoLabel}>{label}</div>
      <div className={css.infoValue}>{value}</div>
    </div>
  ) : null;

const CategoryChips = ({ categoryIds, categories }) => (
  <ul className={css.chips}>
    {categoryIds.map(id => {
      const category = categories.find(c => c.id === id);
      if (!category) {
        return null;
      }
      const color = getCategoryColor(id, categories);
      const style = color ? { backgroundColor: color.bg, color: color.text } : null;
      return (
        <li key={id} className={css.chip} style={style}>
          <CategoryIcon categoryId={id} className={css.chipIcon} />
          {category.name}
        </li>
      );
    })}
  </ul>
);

const ServiceCard = ({ listing, categories, variantPrefix }) => {
  const { title, publicData } = listing.attributes;
  const categoryId = publicData?.categoryLevel1;
  const category = categories.find(c => c.id === categoryId);
  const color = getCategoryColor(categoryId, categories);
  const image = listing.images?.[0];
  return (
    <NamedLink
      className={css.serviceCard}
      name="ListingPage"
      params={{ id: listing.id.uuid, slug: createSlug(title) }}
    >
      <div className={css.serviceImage}>
        {image ? (
          <ResponsiveImage
            rootClassName={css.coverImage}
            alt={title}
            image={image}
            variants={[variantPrefix, `${variantPrefix}-2x`]}
            sizes="280px"
          />
        ) : null}
      </div>
      <div className={css.serviceBody}>
        {category ? (
          <span
            className={css.serviceCategory}
            style={color ? { backgroundColor: color.bg, color: color.text } : null}
          >
            {category.name}
          </span>
        ) : null}
        <span className={css.serviceTitle}>{title}</span>
      </div>
    </NamedLink>
  );
};

/**
 * Seller's business page: big main photo, name, ZIP, categories (with icons), info cards,
 * about text, contact details, photo gallery with captions and the seller's services.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.listing business page listing (with images and author)
 * @param {Object} props.config marketplace configuration
 * @param {Array<Object>} props.listingFields listing field configs
 * @param {Function} props.onContactUser opens the inquiry modal
 * @param {boolean} props.isOwnListing true if the current user owns the page
 * @param {ReactNode} props.notifications owner action bar (edit link etc.)
 * @param {ReactNode} props.mapSection map of the ZIP area
 * @param {ReactNode} props.authorSection author card (also renders the contact modal)
 * @returns {JSX.Element}
 */
const BusinessPage = props => {
  const {
    listing,
    config,
    listingFields = [],
    onContactUser,
    isOwnListing,
    notifications,
    mapSection,
    authorSection,
  } = props;
  const intl = useIntl();
  const dispatch = useDispatch();
  const [services, setServices] = useState([]);

  const { title, description, publicData = {} } = listing.attributes;
  const authorId = listing.author?.id;
  const categories = config.categoryConfiguration?.categories || [];
  const variantPrefix = config.layout.listingImage.variantPrefix || 'listing-card';

  useEffect(() => {
    if (authorId) {
      dispatch(fetchSellerServices(authorId, config))
        .then(setServices)
        .catch(() => setServices([]));
    }
  }, [authorId?.uuid]);

  const images = listing.images || [];
  const [mainImage, ...galleryImages] = images;
  const gallery = galleryImages.slice(0, MAX_GALLERY_PHOTOS);
  const captions = publicData.imageCaptions || {};

  const categoryIds = getBusinessCategoryIds(publicData);
  const zip = publicData.location?.address;
  const memberSince = listing.author?.attributes?.createdAt;

  const f = key => fieldValue(publicData, BUSINESS_FIELD_KEYS[key], listingFields);
  const phone = f('phone');
  const website = f('website');
  const websiteHref = website && !/^https?:\/\//.test(website) ? `https://${website}` : website;

  return (
    <div className={css.root}>
      {notifications}

      <div className={css.hero}>
        {mainImage ? (
          <ResponsiveImage
            rootClassName={css.coverImage}
            alt={title}
            image={mainImage}
            variants={HERO_VARIANTS}
            sizes="(max-width: 1160px) 100vw, 1160px"
          />
        ) : (
          <div className={css.heroPlaceholder}>
            <FormattedMessage id="BusinessPage.noMainPhoto" />
          </div>
        )}
      </div>
      {mainImage && captions[mainImage.id.uuid] ? (
        <p className={css.heroCaption}>{captions[mainImage.id.uuid]}</p>
      ) : null}

      <div className={css.headerRow}>
        <div className={css.headerMain}>
          <h1 className={css.name}>{title}</h1>
          <p className={css.meta}>
            {zip ? <span>{zip}</span> : null}
            {memberSince ? (
              <span>
                <FormattedMessage
                  id="BusinessPage.memberSince"
                  values={{ year: new Date(memberSince).getFullYear() }}
                />
              </span>
            ) : null}
          </p>
          <CategoryChips categoryIds={categoryIds} categories={categories} />
        </div>
        {!isOwnListing ? (
          <div className={css.actions}>
            <button type="button" className={css.contactButton} onClick={onContactUser}>
              <FormattedMessage id="BusinessPage.contactSeller" />
            </button>
          </div>
        ) : null}
      </div>

      <div className={css.infoGrid}>
        <InfoCard label={intl.formatMessage({ id: 'BusinessPage.deliveryTime' })} value={f('deliveryTime')} />
        <InfoCard label={intl.formatMessage({ id: 'BusinessPage.minOrder' })} value={f('minOrder')} />
        <InfoCard label={intl.formatMessage({ id: 'BusinessPage.openingHours' })} value={f('openingHours')} />
        <InfoCard label={intl.formatMessage({ id: 'BusinessPage.pickupDelivery' })} value={f('pickupDelivery')} />
      </div>

      <div className={css.twoColumns}>
        <div className={css.mainColumn}>
          {description ? (
            <section className={css.section}>
              <h2 className={css.sectionTitle}>
                <FormattedMessage id="BusinessPage.aboutTitle" />
              </h2>
              <p className={css.text}>{description}</p>
            </section>
          ) : null}
          {f('whatWeOffer') ? (
            <section className={css.section}>
              <h2 className={css.sectionTitle}>
                <FormattedMessage id="BusinessPage.offerTitle" />
              </h2>
              <p className={css.text}>{f('whatWeOffer')}</p>
            </section>
          ) : null}
        </div>
        <aside className={css.sideColumn}>
          {phone || website ? (
            <div className={css.contactBox}>
              <div className={css.infoLabel}>
                <FormattedMessage id="BusinessPage.contactTitle" />
              </div>
              {phone ? (
                <a className={css.contactLine} href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
                  {phone}
                </a>
              ) : null}
              {website ? (
                <ExternalLink className={css.contactLine} href={websiteHref}>
                  {website}
                </ExternalLink>
              ) : null}
            </div>
          ) : null}
          {mapSection}
        </aside>
      </div>

      {gallery.length > 0 ? (
        <section className={css.section}>
          <div className={css.galleryHeader}>
            <h2 className={css.sectionTitle}>
              <FormattedMessage id="BusinessPage.galleryTitle" />
            </h2>
            <span className={css.galleryCount}>
              <FormattedMessage id="BusinessPage.photoCount" values={{ count: gallery.length }} />
            </span>
          </div>
          <ul className={css.gallery}>
            {gallery.map(image => {
              const caption = captions[image.id.uuid];
              return (
                <li key={image.id.uuid} className={css.galleryItem}>
                  <figure className={css.figure}>
                    <div className={css.galleryImage}>
                      <ResponsiveImage
                        rootClassName={css.coverImage}
                        alt={caption || title}
                        image={image}
                        variants={['scaled-small', 'scaled-medium']}
                        sizes="(max-width: 767px) 50vw, 240px"
                      />
                    </div>
                    {caption ? <figcaption className={css.caption}>{caption}</figcaption> : null}
                  </figure>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {services.length > 0 ? (
        <section className={css.section}>
          <h2 className={css.sectionTitle}>
            <FormattedMessage id="BusinessPage.servicesTitle" />
          </h2>
          <ul className={css.services}>
            {services.map(s => (
              <li key={s.id.uuid}>
                <ServiceCard listing={s} categories={categories} variantPrefix={variantPrefix} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className={classNames(css.section, css.authorSection)}>{authorSection}</div>
    </div>
  );
};

export default BusinessPage;
