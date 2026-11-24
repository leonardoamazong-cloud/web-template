/**
 * Business pages: every seller has one "Business page" listing that works as the seller's
 * page (main photo, gallery with captions, categories they work in, contact & delivery info).
 * Business pages are what the search map shows; regular service listings are listed on the
 * seller's business page.
 *
 * The listing type and the listing fields below are created in Console
 * (Listings > Listing types / Listing fields). Keep these ids in sync with Console.
 */

// Listing type id of business pages
export const BUSINESS_PAGE_LISTING_TYPE = 'business-page';

// Multi-select listing field (enum options = top-level category ids) with the categories
// a seller works in. Shown as checkboxes in the listing editor.
export const BUSINESS_CATEGORIES_KEY = 'businessCategories';

// Other listing fields shown on the business page
export const BUSINESS_FIELD_KEYS = {
  phone: 'telefon',
  openingHours: 'calismaSaatleri',
  deliveryTime: 'teslimSuresi',
  minOrder: 'minSiparisAdedi',
  whatWeOffer: 'whatWeOffer',
  pickupDelivery: 'pickupDelivery',
  website: 'website',
};

/**
 * @param {Object} listing listing or ownListing entity
 * @returns {boolean} true if the listing is a business page
 */
export const isBusinessPageListing = listing =>
  listing?.attributes?.publicData?.listingType === BUSINESS_PAGE_LISTING_TYPE;

/**
 * Categories (top-level category ids) a business page is shown under.
 * Falls back to the single category (categoryLevel1) for regular listings.
 *
 * @param {Object} publicData listing's public data
 * @returns {Array<string>} category ids
 */
export const getBusinessCategoryIds = publicData => {
  const multi = publicData?.[BUSINESS_CATEGORIES_KEY];
  if (Array.isArray(multi) && multi.length > 0) {
    return multi;
  }
  return publicData?.categoryLevel1 ? [publicData.categoryLevel1] : [];
};

/**
 * Find the business page of each given seller (one small query per seller).
 *
 * @param {Object} sdk Sharetribe SDK instance
 * @param {Array<string>} authorIds user uuids
 * @param {Function} denormalise response -> entities (denormalisedResponseEntities)
 * @returns {Promise<Object>} map: author uuid -> business page listing
 */
export const fetchBusinessPagesByAuthor = (sdk, authorIds, denormalise) =>
  Promise.all(
    [...new Set(authorIds.filter(Boolean))].map(authorId =>
      sdk.listings
        .query({
          authorId,
          pub_listingType: BUSINESS_PAGE_LISTING_TYPE,
          perPage: 1,
          'fields.listing': ['title'],
        })
        .then(res => [authorId, denormalise(res)[0] || null])
        .catch(() => [authorId, null])
    )
  ).then(pairs =>
    pairs.reduce((acc, [authorId, page]) => (page ? { ...acc, [authorId]: page } : acc), {})
  );

/**
 * Find the seller business page of each product listing. A product can name its business page
 * explicitly in publicData.businessPageId; otherwise the seller's (author's) business page is used.
 *
 * @param {Object} sdk Sharetribe SDK instance
 * @param {Array<Object>} listings product listings (with author)
 * @param {Function} denormalise response -> entities (denormalisedResponseEntities)
 * @returns {Promise<Object>} map: product listing uuid -> business page listing
 */
export const resolveSellerPages = (sdk, listings, denormalise) => {
  const explicitIds = [
    ...new Set(listings.map(l => l.attributes?.publicData?.businessPageId).filter(Boolean)),
  ];
  const explicitPromise = Promise.all(
    explicitIds.map(id =>
      sdk.listings
        .show({ id, 'fields.listing': ['title', 'publicData'] })
        .then(res => [id, denormalise(res)[0] || null])
        .catch(() => [id, null])
    )
  );
  const authorIds = listings
    .filter(l => !l.attributes?.publicData?.businessPageId)
    .map(l => l.author?.id?.uuid);
  return Promise.all([
    explicitPromise,
    fetchBusinessPagesByAuthor(sdk, authorIds, denormalise),
  ]).then(([explicitPairs, byAuthor]) => {
    const byId = explicitPairs.reduce((acc, [id, page]) => (page ? { ...acc, [id]: page } : acc), {});
    return listings.reduce((acc, l) => {
      const explicitId = l.attributes?.publicData?.businessPageId;
      const page = explicitId ? byId[explicitId] : byAuthor[l.author?.id?.uuid];
      return page && isBusinessPageListing(page) ? { ...acc, [l.id.uuid]: page } : acc;
    }, {});
  });
};
