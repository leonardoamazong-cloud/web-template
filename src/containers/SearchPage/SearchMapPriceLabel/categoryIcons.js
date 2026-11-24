import React from 'react';

// Simple line icons (24x24, stroke = currentColor) shown on map markers for each category.
// Keys are category ids from Console > Listings > Listing categories.
const ICON_PATHS = {
  // 3D printer: frame, nozzle and printed object
  '3d-baski': (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 8h18" />
      <path d="M10 8v3l2 2 2-2V8" />
      <path d="M8 21v-3h8v3" />
    </>
  ),
  // T-shirt
  'tisort-tekstil-baski': (
    <path d="M8 3 4 5.5 2 10l3.5 1.5V21h13v-9.5L22 10l-2-4.5L16 3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3Z" />
  ),
  // Laser beam hitting a plate
  'lazer-kesim-kazima': (
    <>
      <path d="M9 2h6v5H9z" />
      <path d="M12 7v9" />
      <path d="m9 13 3 3 3-3" />
      <path d="M3 20h18" />
      <path d="M6 17.5 4.5 16M18 17.5l1.5-1.5" />
    </>
  ),
  // Sign board on a post
  'tabela-reklam': (
    <>
      <rect x="3" y="4" width="18" height="10" rx="1.5" />
      <path d="M7 9h10" />
      <path d="M12 14v7" />
      <path d="M9 21h6" />
    </>
  ),
  // Hand-made: heart
  'el-isciligi': (
    <path d="M12 20s-7-4.4-9-9a4.7 4.7 0 0 1 9-3 4.7 4.7 0 0 1 9 3c-2 4.6-9 9-9 9Z" />
  ),
  // Stationery & packaging: box
  'kirtasiye-ambalaj': (
    <>
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" />
      <path d="m3 7.5 9 4.5 9-4.5" />
      <path d="M12 12v9" />
    </>
  ),
};

// "All" tab: four squares
export const ALL_CATEGORIES_ICON_ID = 'all';
ICON_PATHS[ALL_CATEGORIES_ICON_ID] = (
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </>
);

// Fallback: a small shop
const DEFAULT_ICON = (
  <>
    <path d="M3 9 4.5 4h15L21 9" />
    <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    <path d="M5 12v9h14v-9" />
    <path d="M10 21v-5h4v5" />
  </>
);

export const CategoryIcon = ({ categoryId, className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {ICON_PATHS[categoryId] || DEFAULT_ICON}
  </svg>
);

export default CategoryIcon;
