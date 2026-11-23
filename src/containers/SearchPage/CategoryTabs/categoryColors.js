// Soft (faded) color per top-level category, assigned by the category's position in Console.
// bg = resting tint, text = readable dark shade of the same hue, active = stronger tint.
// Shared by the category tabs and the map markers so a category looks the same everywhere.
export const CATEGORY_COLORS = [
  { bg: '#EEEDFE', text: '#3C3489', active: '#CECBF6' }, // purple
  { bg: '#FAECE7', text: '#712B13', active: '#F5C4B3' }, // coral
  { bg: '#E1F5EE', text: '#085041', active: '#9FE1CB' }, // teal
  { bg: '#FAEEDA', text: '#633806', active: '#FAC775' }, // amber
  { bg: '#FBEAF0', text: '#72243E', active: '#F4C0D1' }, // pink
  { bg: '#E6F1FB', text: '#0C447C', active: '#B5D4F4' }, // blue
  { bg: '#EAF3DE', text: '#27500A', active: '#C0DD97' }, // green
  { bg: '#F1EFE8', text: '#444441', active: '#D3D1C7' }, // gray
];

export const ALL_CATEGORY_COLOR = { bg: '#FFFFFF', text: '#444441', active: '#D3D1C7' };

/**
 * Color for a top-level category id, based on its index in the category configuration.
 *
 * @param {string} categoryId pub_categoryLevel1 value
 * @param {Array<{id: string}>} categories top-level categories from config
 * @returns {{bg: string, text: string, active: string}|null}
 */
export const getCategoryColor = (categoryId, categories = []) => {
  const index = categories.findIndex(c => c.id === categoryId);
  return index >= 0 ? CATEGORY_COLORS[index % CATEGORY_COLORS.length] : null;
};
