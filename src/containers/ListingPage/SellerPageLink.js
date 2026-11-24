import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { FormattedMessage } from '../../util/reactIntl';
import { denormalisedResponseEntities } from '../../util/data';
import { createSlug } from '../../util/urlHelpers';
import { resolveSellerPages } from '../../util/businessPage';

import { NamedLink } from '../../components';

import css from './ListingPage.module.css';

// Find the seller's business page. Client-side only.
const fetchSellerBusinessPage = listing => (dispatch, getState, sdk) =>
  resolveSellerPages(sdk, [listing], denormalisedResponseEntities)
    .then(pages => pages[listing.id.uuid] || null)
    .catch(() => null);

/**
 * Link from a product page to the seller's business page (if the seller has one).
 *
 * @component
 * @param {Object} props
 * @param {Object} props.listing product listing with author
 * @returns {JSX.Element|null}
 */
const SellerPageLink = props => {
  const { listing } = props;
  const dispatch = useDispatch();
  const [sellerPage, setSellerPage] = useState(null);
  const authorId = listing?.author?.id;

  useEffect(() => {
    if (authorId) {
      dispatch(fetchSellerBusinessPage(listing)).then(setSellerPage);
    }
  }, [listing?.id?.uuid, authorId?.uuid]);

  if (!sellerPage) {
    return null;
  }
  const { title } = sellerPage.attributes;
  return (
    <NamedLink
      className={css.sellerPageLink}
      name="ListingPage"
      params={{ id: sellerPage.id.uuid, slug: createSlug(title) }}
    >
      <FormattedMessage id="ListingPage.visitSellerPage" values={{ seller: title }} />
    </NamedLink>
  );
};

export default SellerPageLink;
