import React from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { getListingImageMaxCount } from '../../../../util/configHelpers';
import { isBusinessPageListing } from '../../../../util/businessPage';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPhotosForm, { imageUuid } from './EditListingPhotosForm';
import css from './EditListingPhotosPanel.module.css';

const getInitialValues = params => {
  const { images = [], listing } = params;
  const imageCaptions = listing?.attributes?.publicData?.imageCaptions || {};
  return { images, imageCaptions };
};

/**
 * The EditListingPhotosPanel component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {Object} props.errors - The errors object
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {Array} props.images - The images array
 * @param {propTypes.ownListing} props.listing - The listing object
 * @param {Function} props.onImageUpload - The image upload function
 * @param {string} props.submitButtonText - The submit button text
 * @param {boolean} props.panelUpdated - Whether the panel is updated
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {Function} props.onSubmit - The submit function
 * @param {Function} props.onRemoveImage - The remove image function
 * @param {Object} props.listingImageConfig - The listing image config
 * @returns {JSX.Element}
 */
const EditListingPhotosPanel = props => {
  const {
    className,
    rootClassName,
    errors,
    disabled,
    ready,
    listing,
    onImageUpload,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    onSubmit,
    onRemoveImage,
    listingImageConfig,
    listingTypes = [],
    updatePageTitle: UpdatePageTitle,
    intl,
    allFilesUploadedAndVerified,
    filesTabParams,
    filesRequired,
  } = props;

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;
  const listingType = listing?.attributes?.publicData?.listingType;
  const listingTypeConfig = listingTypes.find(conf => conf.listingType === listingType);
  const maxImages = getListingImageMaxCount(listingTypeConfig);
  // Business pages get a short caption under each photo
  const showCaptions = isBusinessPageListing(listing);

  const panelHeadingProps = isPublished
    ? {
        id: 'EditListingPhotosPanel.title',
        values: { listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> },
        messageProps: { listingTitle: listing.attributes.title },
      }
    : {
        id: 'EditListingPhotosPanel.createListingTitle',
        values: { lineBreak: <br /> },
        messageProps: {},
      };

  return (
    <main className={classes}>
      <UpdatePageTitle
        panelHeading={intl.formatMessage(
          { id: panelHeadingProps.id },
          { ...panelHeadingProps.messageProps }
        )}
      />
      <H3 as="h1">
        <FormattedMessage id={panelHeadingProps.id} values={{ ...panelHeadingProps.values }} />
      </H3>

      <EditListingPhotosForm
        className={css.form}
        disabled={disabled}
        ready={ready}
        fetchErrors={errors}
        initialValues={getInitialValues(props)}
        onImageUpload={onImageUpload}
        onSubmit={values => {
          const { addImage, imageCaptions, ...updateValues } = values;
          // Keep only captions of images that are still attached, trimmed
          const keptIds = (updateValues.images || []).map(imageUuid).filter(Boolean);
          const cleanCaptions = keptIds.reduce((acc, uuid) => {
            const caption = imageCaptions?.[uuid]?.trim();
            return caption ? { ...acc, [uuid]: caption } : acc;
          }, {});
          const captionsMaybe = showCaptions ? { publicData: { imageCaptions: cleanCaptions } } : {};
          onSubmit({ ...updateValues, ...captionsMaybe });
        }}
        showCaptions={showCaptions}
        onRemoveImage={onRemoveImage}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        listingImageConfig={listingImageConfig}
        maxImages={maxImages}
        allFilesUploadedAndVerified={allFilesUploadedAndVerified}
        filesTabParams={filesTabParams}
        filesRequired={filesRequired}
      />
    </main>
  );
};

export default EditListingPhotosPanel;
