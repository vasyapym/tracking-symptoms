'use strict';

const obsidian = require('obsidian');

/* ============================================================
   CONSTANTS
============================================================ */

const DATA_FILE_NAME = 'tracking-symptoms-data.json';
const LEGACY_DATA_FILE_NAME = 'ibs-logger-data.json';
const RELIEF_EVENT_ID = '__system_relief_event__';

const RELIEF_FIELD_OPTIONS = {
  completion: ['complete', 'partial', 'unsatisfying'],
  ease: ['easy', 'normal', 'difficult'],
  comfortAfter: ['better', 'unchanged', 'worse'],
  residualDiscomfort: ['none', 'mild', 'moderate', 'strong'],
  urgencyBefore: ['low', 'moderate', 'high'],
  bloatingAfter: ['better', 'unchanged', 'worse'],
};

const DEFAULT_RELIEF_EVENT_PRESETS = [
  {
    id: 'relief-complete-better',
    label: 'Complete · better',
    details: {
      completion: 'complete',
      ease: 'easy',
      comfortAfter: 'better',
      residualDiscomfort: 'none',
      urgencyBefore: 'moderate',
      bloatingAfter: 'better',
    },
  },
  {
    id: 'relief-urgent-better',
    label: 'Urgent · better',
    details: {
      completion: 'complete',
      ease: 'normal',
      comfortAfter: 'better',
      residualDiscomfort: 'mild',
      urgencyBefore: 'high',
      bloatingAfter: 'better',
    },
  },
  {
    id: 'relief-partial-better',
    label: 'Partial · better',
    details: {
      completion: 'partial',
      ease: 'normal',
      comfortAfter: 'better',
      residualDiscomfort: 'mild',
      urgencyBefore: 'moderate',
      bloatingAfter: 'unchanged',
    },
  },
  {
    id: 'relief-partial-same',
    label: 'Partial · same',
    details: {
      completion: 'partial',
      ease: 'normal',
      comfortAfter: 'unchanged',
      residualDiscomfort: 'mild',
      urgencyBefore: 'moderate',
      bloatingAfter: 'unchanged',
    },
  },
  {
    id: 'relief-difficult-residual',
    label: 'Difficult · residual',
    details: {
      completion: 'partial',
      ease: 'difficult',
      comfortAfter: 'better',
      residualDiscomfort: 'moderate',
      urgencyBefore: 'high',
      bloatingAfter: 'unchanged',
    },
  },
  {
    id: 'relief-unsatisfying',
    label: 'Unsatisfying',
    details: {
      completion: 'unsatisfying',
      ease: 'difficult',
      comfortAfter: 'unchanged',
      residualDiscomfort: 'strong',
      urgencyBefore: 'high',
      bloatingAfter: 'worse',
    },
  },
];

const DEFAULT_SETTINGS = {
  folderPath: 'data',
  duplicateWindowSeconds: 12,
  favoriteItemIds: [],
  customLabels: {
    reliefEvent: 'Relief event',
  },
  reliefEventPresets: [],
};

const SECTIONS = {
  QUICK: 'quick',
  HISTORY: 'history',
  LIBRARY: 'library',
  REVIEW: 'review',
};

const VALENCE_OPTIONS = ['supportive', 'challenging', 'uncertain', 'neutral'];
const TEMPLATE_MODES = ['instant', 'intensity', 'outcome'];

const VALENCE_COLORS = {
  supportive: '#10b981',
  challenging: '#ef4444',
  uncertain: '#f59e0b',
  neutral: '#64748b',
  mixed: '#f97316',
};

const CATEGORY_META = {
  sleep: {
    label: 'Sleep',
    color: '#6366f1',
  },
  stress: {
    label: 'Stress',
    color: '#ef4444',
  },
  activity: {
    label: 'Activity',
    color: '#10b981',
  },
  food_drink: {
    label: 'Food & drink',
    color: '#f59e0b',
  },
  digestive_sensation: {
    label: 'Digestive sensation',
    color: '#ec4899',
  },
  general_context: {
    label: 'General context',
    color: '#64748b',
  },
};

const CATEGORY_ORDER = Object.keys(CATEGORY_META);

/* ============================================================
   STYLES
============================================================ */

const PLUGIN_STYLES = `
.tracking-symptoms-modal .modal,
.tracking-symptoms-modal .modal *,
.tracking-symptoms-modal .modal *::before,
.tracking-symptoms-modal .modal *::after {
  box-sizing: border-box;
}

.tracking-symptoms-modal .modal {
  width: min(920px, 96vw);
  max-height: 94vh;
  padding: 0;
  overflow: visible;
  border-radius: 12px;
  border: 1px solid var(--background-modifier-border);
}

.tracking-symptoms-modal .modal-content {
  height: 100%;
  padding: 0;
  overflow: visible;
}

.ib-shell {
  display: flex;
  flex-direction: column;
  min-height: 56vh;
  max-height: 94vh;
  min-width: 0;
  background: var(--background-primary);
  overflow: hidden;
  border-radius: inherit;
}

.ib-topnav {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 9px 10px 9px 12px;
  border-bottom: 1px solid var(--background-modifier-border);
  background: var(--background-primary);
  min-width: 0;
}

.ib-brand {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-normal);
  flex: 0 1 auto;
  min-width: 0;
  max-width: 150px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ib-topnav-inner {
  display: flex;
  gap: 6px;
  align-items: center;
  overflow-x: auto;
  scrollbar-width: none;
  min-width: 0;
  flex: 1 1 auto;
  padding: 1px 0;
}

.ib-topnav-inner::-webkit-scrollbar { display: none; }

.ib-topnav-spacer {
  display: inline-block;
  min-width: 28px;
  height: 1px;
  flex-shrink: 0;
}

.ib-nav-btn {
  border: 1px solid transparent;
  background: var(--background-secondary);
  color: var(--text-muted);
  border-radius: 999px;
  min-height: 30px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.15;
  white-space: normal !important;
  text-align: center;
  min-width: 0;
  max-width: 112px;
  overflow-wrap: anywhere;
  word-break: break-word;
  flex: 0 0 auto;
  height: auto;
  transition: background .12s ease, color .12s ease, border-color .12s ease, box-shadow .12s ease;
}

.ib-nav-btn:hover {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
}

.ib-nav-btn.is-active {
  background: var(--interactive-accent);
  color: var(--text-on-accent);
  border-color: transparent;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.14);
}

.ib-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: visible;
  padding: 10px;
  padding-bottom: 18px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
  scroll-padding-bottom: 160px;
}

.ib-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.ib-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}

.ib-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.ib-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.ib-row {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  min-width: 0;
}

.ib-header-actions,
.ib-item-actions {
  justify-content: flex-end;
}

.ib-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.ib-card {
  background: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 10px;
  padding: 9px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ib-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.ib-card-title {
  margin: 0;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-muted);
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.ib-note {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.ib-inline-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
  gap: 8px;
}

.ib-stat {
  border: 1px solid var(--background-modifier-border);
  border-radius: 9px;
  padding: 9px;
  background: var(--background-primary);
  min-width: 0;
}

.ib-stat-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-muted);
  margin-bottom: 4px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.ib-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-normal);
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.ib-stat-sub {
  margin-top: 2px;
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.ib-chip-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}

.ib-chip {
  border: 1px solid var(--background-modifier-border);
  background: var(--background-primary);
  color: var(--text-normal);
  border-radius: 999px;
  min-height: 26px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.15;
  white-space: normal !important;
  text-align: center;
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
  height: auto;
  transition: background .12s ease, border-color .12s ease, color .12s ease;
}

.ib-chip:hover {
  background: var(--background-modifier-hover);
}

.ib-chip.is-active {
  background: var(--interactive-accent);
  color: var(--text-on-accent);
  border-color: transparent;
}

.ib-btn,
.ib-btn-secondary,
.ib-btn-danger,
.ib-btn-ghost,
.ib-btn-primary-action,
.ib-show-more-btn,
.ib-section-toggle {
  border-radius: 8px;
  min-height: 30px;
  padding: 0 10px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  min-width: 0;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  white-space: normal !important;
  overflow-wrap: anywhere;
  word-break: break-word;
  height: auto;
  transition: background .12s ease, border-color .12s ease, color .12s ease, transform .12s ease;
}

.ib-btn {
  border: none;
  background: var(--interactive-accent);
  color: var(--text-on-accent);
}

.ib-btn:hover {
  filter: brightness(1.08);
}

.ib-btn-secondary {
  border: 1px solid var(--background-modifier-border);
  background: var(--background-primary);
  color: var(--text-normal);
}

.ib-btn-secondary:hover {
  background: var(--background-modifier-hover);
}

.ib-btn-danger {
  border: 1px solid var(--background-modifier-border);
  background: var(--background-primary);
  color: var(--text-error);
}

.ib-btn-danger:hover {
  background: var(--background-modifier-hover);
}

.ib-btn-ghost {
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 0 5px;
  min-height: 22px;
}

.ib-btn-ghost:hover {
  color: var(--text-normal);
}

.ib-btn-primary-action {
  border: none;
  background: var(--interactive-accent);
  color: var(--text-on-accent);
  min-width: 56px;
  padding: 0 10px;
}

.ib-btn-primary-action:hover {
  filter: brightness(1.08);
}

.ib-show-more-wrap {
  margin-top: 6px;
}

.ib-show-more-btn {
  width: 100%;
  border: 1px dashed var(--background-modifier-border);
  background: transparent;
  color: var(--text-muted);
}

.ib-show-more-btn:hover {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
}

.ib-input,
.ib-select,
.ib-textarea {
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--background-modifier-border);
  background: var(--background-primary);
  color: var(--text-normal);
  min-height: 30px;
  padding: 6px 8px;
  font-size: 12px;
  min-width: 0;
  max-width: 100% !important;
}

.ib-select {
  display: block;
  width: 100%;
  padding-right: 28px;
  overflow: visible;
  text-overflow: clip;
}

.ib-textarea {
  min-height: 76px;
  resize: vertical;
}

.ib-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 10px;
  min-width: 0;
}

.ib-field-label {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.ib-row > .ib-select,
.ib-row > .ib-input,
.ib-row > .ib-textarea {
  flex: 1 1 220px;
  min-width: 180px;
}

.ib-category-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.ib-category-card {
  border: 1px solid var(--background-modifier-border);
  background: var(--background-primary);
  border-radius: 9px;
  padding: 9px;
  cursor: pointer;
  text-align: left;
  min-width: 0;
  min-height: 58px;
  transition: background .12s ease, border-color .12s ease;
}

.ib-category-card:hover {
  background: var(--background-modifier-hover);
}

.ib-category-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.ib-category-main {
  min-width: 0;
  flex: 1 1 auto;
}

.ib-category-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-normal);
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.ib-category-count {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  text-align: right;
}

.ib-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.ib-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 9px;
  padding: 8px 9px;
  background: var(--background-primary);
  min-width: 0;
}

.ib-item-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1 1 auto;
}

.ib-item-title-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ib-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

.ib-item-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-normal);
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.ib-item-sub {
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.ib-entry-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.ib-entry {
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  border-left: 3px solid var(--interactive-accent);
  border-radius: 9px;
  padding: 8px 9px;
  min-width: 0;
}

.ib-entry-top {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
  min-width: 0;
}

.ib-entry-time {
  font-size: 10px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.ib-entry-title {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.ib-pill {
  font-size: 10px;
  border-radius: 999px;
  background: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  padding: 2px 6px;
  color: var(--text-muted);
  line-height: 1.15;
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
}

.ib-entry-actions {
  margin-left: auto;
  display: flex;
  gap: 6px;
  min-width: 0;
}

.ib-entry-details {
  margin-top: 5px;
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.ib-entry-note {
  margin-top: 5px;
  font-size: 11px;
  color: var(--text-muted);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.ib-empty {
  text-align: center;
  padding: 12px 10px;
  color: var(--text-muted);
  border: 1px dashed var(--background-modifier-border);
  border-radius: 9px;
  background: var(--background-primary);
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.ib-bar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ib-bar-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.ib-bar-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  min-width: 0;
}

.ib-bar-label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.ib-bar-value {
  flex-shrink: 0;
}

.ib-bar-bg {
  height: 6px;
  border-radius: 999px;
  background: var(--background-primary);
  overflow: hidden;
}

.ib-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--interactive-accent);
}

.ib-library-toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ib-library-card {
  gap: 8px;
}

.ib-section-toggle {
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  padding: 0;
  border: 1px solid var(--background-modifier-border);
  background: var(--background-primary);
  color: var(--text-muted);
  flex: 0 0 28px;
  align-self: flex-start;
}

.ib-section-toggle:hover {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
}

.ib-section-toggle.is-collapsed .ib-section-toggle-glyph {
  transform: rotate(-90deg);
}

.ib-section-toggle-glyph {
  display: block;
  font-size: 12px;
  line-height: 1;
  transform-origin: center;
  transition: transform .12s ease;
}

.ib-heatmap-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ib-heatmap-head {
  display: grid;
  grid-template-columns: minmax(120px, 140px) 1fr;
  gap: 8px;
  align-items: end;
}

.ib-heatmap-day-headers {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 24px;
  gap: 3px;
  justify-content: start;
  overflow-x: auto;
  scrollbar-width: none;
}

.ib-heatmap-day-headers::-webkit-scrollbar,
.ib-heatmap-cells::-webkit-scrollbar {
  display: none;
}

.ib-heatmap-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  font-size: 9px;
  color: var(--text-muted);
}

.ib-heatmap-day-num {
  font-weight: 700;
  color: var(--text-normal);
}

.ib-heatmap-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ib-heatmap-row {
  display: grid;
  grid-template-columns: minmax(120px, 140px) 1fr;
  gap: 8px;
  align-items: center;
}

.ib-heatmap-row-label {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.ib-heatmap-row-main {
  min-width: 0;
}

.ib-heatmap-row-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-normal);
  overflow-wrap: anywhere;
}

.ib-heatmap-total {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.ib-heatmap-cells {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 24px;
  gap: 3px;
  justify-content: start;
  overflow-x: auto;
  scrollbar-width: none;
}

.ib-heatmap-cell {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--background-modifier-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  user-select: none;
}

.ib-legend-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ib-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--text-muted);
}

.ib-legend-swatch {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  flex-shrink: 0;
}

.ib-dialog {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 88vh;
  background: var(--background-primary);
}

.ib-dialog-head {
  padding: 10px 12px 8px;
  border-bottom: 1px solid var(--background-modifier-border);
  background: var(--background-primary);
}

.ib-dialog-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.ib-dialog-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: visible;
  padding: 10px 12px 16px;
  min-width: 0;
  scroll-padding-bottom: 180px;
}

.ib-preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  margin-bottom: 10px;
  align-items: stretch;
}

.ib-preset-btn {
  border: 1px solid var(--background-modifier-border);
  border-radius: 9px;
  background: var(--background-secondary);
  color: var(--text-normal);
  padding: 9px 10px;
  text-align: left;
  cursor: pointer;
  min-height: 72px;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 4px;
  white-space: normal !important;
  overflow-wrap: anywhere;
  word-break: break-word;
  height: auto;
}

.ib-preset-btn:hover {
  background: var(--background-modifier-hover);
}

.ib-preset-title {
  width: 100%;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 0;
  line-height: 1.2;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.ib-preset-sub {
  width: 100%;
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.35;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}

.ib-divider {
  height: 1px;
  background: var(--background-modifier-border);
  margin: 1px 0;
}

.ib-compat-note {
  margin-bottom: 10px;
}

.ib-spacer-bottom {
  height: 2px;
}

.ib-relief-section {
  background: var(--background-modifier-form-field);
  border-left: 3px solid #ec4899;
  margin-bottom: 10px;
}

.ib-group-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.ib-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.ib-group-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--text-muted);
  line-height: 1.2;
}

.ib-quick-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ib-quick-actions > button {
  flex: 1 1 150px;
  min-height: 40px;
  padding-top: 8px;
  padding-bottom: 8px;
  align-self: stretch;
}

.ib-compact-divider {
  height: 1px;
  background: var(--background-modifier-border);
  margin: 0;
}

.ib-muted-inline {
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.25;
}

@media (max-width: 760px) {
  .tracking-symptoms-modal .modal {
    width: min(97vw, 560px);
    max-height: 93vh;
    border-radius: 10px;
  }

  .ib-main {
    padding: 8px;
    padding-bottom: 14px;
    gap: 8px;
  }

  .ib-page-header,
  .ib-card-header,
  .ib-item-row,
  .ib-heatmap-head,
  .ib-heatmap-row {
    flex-direction: column;
    align-items: stretch;
    display: flex;
  }

  .ib-category-grid,
  .ib-inline-stats {
    grid-template-columns: 1fr 1fr;
  }

  .ib-preset-grid {
    grid-template-columns: 1fr;
  }

  .ib-entry-actions {
    margin-left: 0;
    width: 100%;
  }

  .ib-item-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .ib-item-actions > button,
  .ib-header-actions > button,
  .ib-row > button {
    min-width: 0;
    flex: 1 1 0;
  }

  .ib-quick-actions > button {
    flex: 1 1 100%;
  }

  .ib-section-toggle {
    flex: 0 0 28px !important;
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    min-height: 28px !important;
  }

  .ib-category-count {
    white-space: normal;
    text-align: left;
  }

  .ib-heatmap-day-headers,
  .ib-heatmap-cells {
    grid-auto-columns: 22px;
  }

  .ib-heatmap-cell {
    width: 22px;
    height: 22px;
  }

  .ib-brand {
    max-width: 112px;
  }

  .ib-nav-btn {
    max-width: 92px;
    padding: 5px 8px;
  }

  .ib-row > .ib-select,
  .ib-row > .ib-input,
  .ib-row > .ib-textarea {
    min-width: 0;
    flex: 1 1 100%;
  }
}
`;

/* ============================================================
   HELPERS
============================================================ */

function safeString(v) {
  return typeof v === 'string' ? v : '';
}

function safeTrim(v) {
  return safeString(v).trim();
}

function normalizeSpaces(v) {
  return safeTrim(v).replace(/\s+/g, ' ');
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function parseTags(raw) {
  if (Array.isArray(raw)) return raw.map(t => normalizeSpaces(t)).filter(Boolean);
  return safeString(raw).split(',').map(t => normalizeSpaces(t)).filter(Boolean);
}

function generateId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const r = (Math.random() * 16) | 0;
    const n = ch === 'x' ? r : ((r & 0x3) | 0x8);
    return n.toString(16);
  });
}

function nowIso() {
  return new Date().toISOString();
}

function parseDate(v, fallback = new Date()) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function dateKey(v) {
  const d = parseDate(v);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function timeLabel(v) {
  const d = parseDate(v);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function shortDateLabel(v) {
  const d = parseDate(v);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function shortDayLabel(v) {
  const d = parseDate(v);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return days[d.getDay()];
}

function dateTimeLabel(v) {
  const d = parseDate(v);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function readableDate(v) {
  const d = parseDate(v);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function startOfDay(v) {
  const d = parseDate(v);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(v) {
  const d = parseDate(v);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDays(v, n) {
  const d = new Date(parseDate(v));
  d.setDate(d.getDate() + n);
  return d;
}

function lastNDates(days) {
  const out = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    out.push(startOfDay(addDays(new Date(), -offset)));
  }
  return out;
}

function periodToDays(period) {
  if (period === 'today') return 1;
  if (period === 'yesterday') return 1;
  if (period === '7d') return 7;
  if (period === '14d') return 14;
  if (period === '21d') return 21;
  if (period === '30d') return 30;
  if (period === '90d') return 90;
  return null;
}

function getPeriodDates(period) {
  if (period === 'today') return [startOfDay(new Date())];
  if (period === 'yesterday') return [startOfDay(addDays(new Date(), -1))];
  const days = periodToDays(period);
  if (!days) return [];
  return lastNDates(days);
}

function inPeriod(datetime, period) {
  if (period === 'all') return true;
  const target = parseDate(datetime);

  if (period === 'today') {
    return dateKey(target) === dateKey(new Date());
  }

  if (period === 'yesterday') {
    return dateKey(target) === dateKey(addDays(new Date(), -1));
  }

  const days = periodToDays(period);
  if (!days) return true;
  const start = startOfDay(addDays(new Date(), -(days - 1)));
  return target >= start;
}

function periodDisplayLabel(period) {
  if (period === 'today') return 'Today';
  if (period === 'yesterday') return 'Yesterday';
  if (period === '7d') return 'Last 7 days';
  if (period === '14d') return 'Last 14 days';
  if (period === '21d') return 'Last 21 days';
  if (period === '30d') return 'Last 30 days';
  if (period === '90d') return 'Last 90 days';
  return 'All time';
}

function periodShortLabel(period) {
  if (period === 'today') return 'Today';
  if (period === 'yesterday') return 'Yesterday';
  if (period === '7d') return '7d';
  if (period === '14d') return '14d';
  if (period === '21d') return '21d';
  if (period === '30d') return '30d';
  if (period === '90d') return '90d';
  return 'All';
}

function escapeCsv(v) {
  const s = String(v ?? '');
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function categoryExists(category) {
  return Boolean(CATEGORY_META[category]);
}

function remapCategory(category) {
  if (category === 'digestive_outcome') return 'digestive_sensation';
  if (category === 'medication_supplement') return 'general_context';
  return category;
}

function normalizeValence(v) {
  return VALENCE_OPTIONS.includes(v) ? v : 'neutral';
}

function normalizeIntensityOptions(raw, fallback = []) {
  const arr = Array.isArray(raw)
    ? raw
    : safeString(raw).split(',');
  const cleaned = arr.map(v => normalizeSpaces(v)).filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function defaultModeForCategory(category) {
  if (category === 'stress' || category === 'digestive_sensation') return 'intensity';
  return 'instant';
}

function defaultIntensityOptions(category) {
  if (category === 'activity') return ['light', 'moderate', 'strong'];
  return ['mild', 'moderate', 'strong'];
}

function normalizeEnum(v, options, fallback = '') {
  return options.includes(v) ? v : fallback;
}

function normalizeReliefDetails(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    completion: normalizeEnum(src.completion, RELIEF_FIELD_OPTIONS.completion, ''),
    ease: normalizeEnum(src.ease, RELIEF_FIELD_OPTIONS.ease, ''),
    comfortAfter: normalizeEnum(src.comfortAfter, RELIEF_FIELD_OPTIONS.comfortAfter, ''),
    residualDiscomfort: normalizeEnum(src.residualDiscomfort, RELIEF_FIELD_OPTIONS.residualDiscomfort, ''),
    urgencyBefore: normalizeEnum(src.urgencyBefore, RELIEF_FIELD_OPTIONS.urgencyBefore, ''),
    bloatingAfter: normalizeEnum(src.bloatingAfter, RELIEF_FIELD_OPTIONS.bloatingAfter, ''),
  };
}

function reliefPresetSummary(details, compact = false) {
  const d = normalizeReliefDetails(details);
  const parts = [];

  if (d.completion) parts.push(compact ? d.completion : `completion: ${d.completion}`);
  if (d.ease) parts.push(compact ? d.ease : `ease: ${d.ease}`);
  if (d.comfortAfter) parts.push(compact ? d.comfortAfter : `comfort: ${d.comfortAfter}`);
  if (d.residualDiscomfort) parts.push(compact ? `residual ${d.residualDiscomfort}` : `residual: ${d.residualDiscomfort}`);
  if (d.urgencyBefore) parts.push(compact ? `urgency ${d.urgencyBefore}` : `urgency before: ${d.urgencyBefore}`);
  if (d.bloatingAfter) parts.push(compact ? `bloating ${d.bloatingAfter}` : `bloating after: ${d.bloatingAfter}`);

  return parts.length ? parts.join(' · ') : 'No details';
}

function normalizeReliefPreset(raw) {
  const details = normalizeReliefDetails(raw?.details);
  return {
    id: safeString(raw?.id) || generateId(),
    label: normalizeSpaces(raw?.label) || 'Preset',
    details,
  };
}

function getDefaultReliefEventPresets() {
  return DEFAULT_RELIEF_EVENT_PRESETS.map(preset => normalizeReliefPreset(preset));
}

function normalizeReliefPresets(raw, fallbackToDefaults = true) {
  const presets = ensureArray(raw).map(normalizeReliefPreset);
  if (!presets.length && fallbackToDefaults) return getDefaultReliefEventPresets();
  return presets;
}

function isReliefEntry(entry) {
  if (entry.itemId === RELIEF_EVENT_ID) return true;
  const d = entry.details || {};
  return !!(
    d.completion ||
    d.ease ||
    d.comfortAfter ||
    d.residualDiscomfort ||
    d.urgencyBefore ||
    d.bloatingAfter
  );
}

function normalizeTemplate(raw) {
  const mapped = remapCategory(raw?.category);
  const category = categoryExists(mapped) ? mapped : 'food_drink';
  const mode = TEMPLATE_MODES.includes(raw?.mode) ? raw.mode : defaultModeForCategory(category);
  return {
    id: raw?.id || generateId(),
    label: normalizeSpaces(raw?.label) || 'Untitled item',
    category,
    mode,
    valence: normalizeValence(raw?.valence),
    tags: parseTags(raw?.tags),
    intensityOptions: mode === 'intensity'
      ? normalizeIntensityOptions(raw?.intensityOptions, defaultIntensityOptions(category))
      : [],
    createdAt: safeString(raw?.createdAt) || nowIso(),
    updatedAt: nowIso(),
  };
}

function normalizeEntry(raw) {
  const mapped = remapCategory(raw?.category);
  const category = categoryExists(mapped) ? mapped : 'general_context';
  const detailsSource = raw?.details && typeof raw.details === 'object' && !Array.isArray(raw.details) ? raw.details : {};
  const details = isReliefEntry(raw || {}) ? normalizeReliefDetails(detailsSource) : detailsSource;

  return {
    id: raw?.id || generateId(),
    datetime: safeString(raw?.datetime) || nowIso(),
    category,
    itemId: safeString(raw?.itemId),
    itemLabel: normalizeSpaces(raw?.itemLabel) || 'Untitled',
    valence: normalizeValence(raw?.valence),
    intensity: normalizeSpaces(raw?.intensity).toLowerCase(),
    source: normalizeSpaces(raw?.source) || 'manual',
    note: safeString(raw?.note),
    tags: parseTags(raw?.tags),
    details,
  };
}

function byNewest(a, b) {
  return parseDate(b.datetime).getTime() - parseDate(a.datetime).getTime();
}

function countBy(list, getter) {
  const m = new Map();
  for (const item of list) {
    const key = getter(item);
    m.set(key, (m.get(key) || 0) + 1);
  }
  return m;
}

function addSelectOptions(select, options, value) {
  (options || []).forEach(opt => {
    const option = select.createEl('option', { text: opt.label ?? opt, value: opt.value ?? opt });
    if ((opt.value ?? opt) === value) option.selected = true;
  });
}

function createField(container, label) {
  const field = container.createDiv({ cls: 'ib-field' });
  field.createDiv({ text: label, cls: 'ib-field-label' });
  return field;
}

function createDialogScaffold(modal, title, subtitle = '') {
  const c = modal.contentEl;
  c.empty();
  const root = c.createDiv({ cls: 'ib-dialog' });
  const head = root.createDiv({ cls: 'ib-dialog-head' });
  head.createEl('h2', { text: title, cls: 'ib-dialog-title' });
  if (subtitle) head.createDiv({ text: subtitle, cls: 'ib-note' });
  const body = root.createDiv({ cls: 'ib-dialog-body' });
  return { root, head, body };
}

function countUnique(list, getter) {
  const s = new Set();
  for (const item of list) s.add(getter(item));
  return s.size;
}

function hexToRgba(hex, alpha = 1) {
  const clean = safeString(hex).replace('#', '');
  const normalized = clean.length === 3
    ? clean.split('').map(ch => ch + ch).join('')
    : clean;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some(n => Number.isNaN(n))) return `rgba(127, 127, 127, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function registerModalCleanup(modal, cleanup) {
  if (!modal._ibCleanups) modal._ibCleanups = [];
  modal._ibCleanups.push(cleanup);
}

function runModalCleanups(modal) {
  const cleanups = Array.isArray(modal._ibCleanups) ? modal._ibCleanups : [];
  while (cleanups.length) {
    try {
      const fn = cleanups.pop();
      if (typeof fn === 'function') fn();
    } catch (_) {}
  }
  modal._ibCleanups = [];
}

function revealElementInScrollArea(el) {
  if (!el || !el.isConnected) return;
  try {
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  } catch (_) {}

  const body = el.closest('.ib-dialog-body') || el.closest('.modal-content');
  if (!body || typeof body.scrollTop !== 'number') return;

  const bodyRect = body.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const pad = 18;

  if (elRect.bottom > bodyRect.bottom - pad) {
    body.scrollTop += elRect.bottom - bodyRect.bottom + pad;
  } else if (elRect.top < bodyRect.top + pad) {
    body.scrollTop -= bodyRect.top - elRect.top + pad;
  }
}

function enableMobileInputVisibility(modal, input, autoFocus = true) {
  if (!input) return;

  const reveal = () => revealElementInScrollArea(input);

  const onFocus = () => {
    window.setTimeout(reveal, 40);
    window.setTimeout(reveal, 180);
    window.setTimeout(reveal, 340);
  };

  const onClick = () => {
    window.setTimeout(reveal, 40);
  };

  input.addEventListener('focus', onFocus);
  input.addEventListener('click', onClick);

  registerModalCleanup(modal, () => {
    input.removeEventListener('focus', onFocus);
    input.removeEventListener('click', onClick);
  });

  if (window.visualViewport) {
    const onViewportChange = () => {
      if (document.activeElement === input) reveal();
    };

    window.visualViewport.addEventListener('resize', onViewportChange);
    window.visualViewport.addEventListener('scroll', onViewportChange);

    registerModalCleanup(modal, () => {
      window.visualViewport.removeEventListener('resize', onViewportChange);
      window.visualViewport.removeEventListener('scroll', onViewportChange);
    });
  }

  if (autoFocus) {
    window.setTimeout(() => {
      if (!input.isConnected) return;
      input.focus();
      reveal();
    }, 60);
    window.setTimeout(reveal, 220);
    window.setTimeout(reveal, 420);
  }
}

/* ============================================================
   PERSISTENCE
============================================================ */

class TrackingSymptomsPersistenceService {
  constructor(plugin) {
    this.plugin = plugin;
  }

  get folderPath() {
    return obsidian.normalizePath(this.plugin.settings.folderPath || 'data');
  }

  get filePath() {
    return obsidian.normalizePath(`${this.folderPath}/${DATA_FILE_NAME}`);
  }

  get legacyFilePath() {
    return obsidian.normalizePath(`${this.folderPath}/${LEGACY_DATA_FILE_NAME}`);
  }

  async ensureFolder() {
    const adapter = this.plugin.app.vault.adapter;
    if (!(await adapter.exists(this.folderPath))) {
      await adapter.mkdir(this.folderPath);
    }
  }

  async ensureFile() {
    const adapter = this.plugin.app.vault.adapter;
    await this.ensureFolder();

    const hasNew = await adapter.exists(this.filePath);
    const hasLegacy = await adapter.exists(this.legacyFilePath);

    if (!hasNew && !hasLegacy) {
      await adapter.write(this.filePath, JSON.stringify({
        version: 3,
        templates: [],
        entries: [],
      }, null, 2));
    }
  }

  async getReadablePath() {
    const adapter = this.plugin.app.vault.adapter;
    await this.ensureFolder();

    if (await adapter.exists(this.filePath)) return this.filePath;
    if (await adapter.exists(this.legacyFilePath)) return this.legacyFilePath;
    return this.filePath;
  }

  async loadDatabase() {
    await this.ensureFile();

    try {
      const path = await this.getReadablePath();
      const raw = await this.plugin.app.vault.adapter.read(path);

      if (!raw || !raw.trim()) {
        return { version: 3, templates: [], entries: [] };
      }

      const parsed = JSON.parse(raw);
      const templateSource = Array.isArray(parsed?.templates)
        ? parsed.templates
        : Array.isArray(parsed?.customItems)
          ? parsed.customItems
          : [];

      return {
        version: Number(parsed?.version) || 3,
        templates: ensureArray(templateSource).map(normalizeTemplate),
        entries: ensureArray(parsed?.entries).map(normalizeEntry).sort(byNewest),
      };
    } catch (err) {
      new obsidian.Notice(`Tracking Symptoms: error loading data – ${err.message}`);
      return { version: 3, templates: [], entries: [] };
    }
  }

  async saveDatabase(db) {
    await this.ensureFile();

    const payload = {
      version: 3,
      templates: ensureArray(db?.templates).map(normalizeTemplate),
      entries: ensureArray(db?.entries).map(normalizeEntry).sort(byNewest),
    };

    await this.plugin.app.vault.adapter.write(this.filePath, JSON.stringify(payload, null, 2));
  }

  async exportDatabase(format = 'json') {
    await this.ensureFile();

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const base = obsidian.normalizePath(`${this.folderPath}/tracking-symptoms-export-${stamp}`);

    if (format === 'json') {
      const path = `${base}.json`;
      await this.plugin.app.vault.adapter.write(path, JSON.stringify({
        version: 3,
        templates: this.plugin.templates,
        entries: this.plugin.entries,
      }, null, 2));
      return path;
    }

    const path = `${base}.csv`;
    const header = [
      'id',
      'datetime',
      'category',
      'itemId',
      'itemLabel',
      'valence',
      'intensity',
      'source',
      'note',
      'tags',
      'completion',
      'ease',
      'comfortAfter',
      'residualDiscomfort',
      'urgencyBefore',
      'bloatingAfter',
    ];

    const lines = [header.join(',')];

    for (const entry of this.plugin.entries) {
      const d = normalizeReliefDetails(entry.details || {});
      lines.push([
        escapeCsv(entry.id),
        escapeCsv(entry.datetime),
        escapeCsv(entry.category),
        escapeCsv(entry.itemId),
        escapeCsv(entry.itemLabel),
        escapeCsv(entry.valence),
        escapeCsv(entry.intensity),
        escapeCsv(entry.source),
        escapeCsv(entry.note),
        escapeCsv((entry.tags || []).join(';')),
        escapeCsv(d.completion || ''),
        escapeCsv(d.ease || ''),
        escapeCsv(d.comfortAfter || ''),
        escapeCsv(d.residualDiscomfort || ''),
        escapeCsv(d.urgencyBefore || ''),
        escapeCsv(d.bloatingAfter || ''),
      ].join(','));
    }

    await this.plugin.app.vault.adapter.write(path, lines.join('\n'));
    return path;
  }
}

/* ============================================================
   SMALL MODALS
============================================================ */

class QuickChoiceModal extends obsidian.Modal {
  constructor(app, title, options, onChoose) {
    super(app);
    this.title = title;
    this.options = options || [];
    this.onChoose = onChoose;
    this.modalEl.addClass('tracking-symptoms-modal');
  }

  onOpen() {
    const { body } = createDialogScaffold(this, this.title);

    const row = body.createDiv({ cls: 'ib-chip-row' });

    this.options.forEach(option => {
      const label = option.label ?? option;
      const value = option.value ?? option;
      const btn = row.createEl('button', { text: label, cls: 'ib-chip' });
      btn.addEventListener('click', async () => {
        this.close();
        if (this.onChoose) await this.onChoose(value);
      });
    });
  }

  onClose() {
    runModalCleanups(this);
    this.contentEl.empty();
  }
}

class ReliefPresetEditModal extends obsidian.Modal {
  constructor(app, plugin, preset = null, onSave = null) {
    super(app);
    this.plugin = plugin;
    this.preset = preset ? normalizeReliefPreset(preset) : null;
    this.onSave = onSave;
    this.modalEl.addClass('tracking-symptoms-modal');
  }

  onOpen() {
    const { body } = createDialogScaffold(
      this,
      this.preset ? 'Edit relief preset' : 'New relief preset',
      'Choose the quick values used for the relief event.'
    );

    const seed = this.preset?.details || {
      completion: 'partial',
      ease: 'normal',
      comfortAfter: 'unchanged',
      residualDiscomfort: 'mild',
      urgencyBefore: 'moderate',
      bloatingAfter: 'unchanged',
    };

    const labelField = createField(body, 'Preset label');
    const labelInput = labelField.createEl('input', {
      type: 'text',
      cls: 'ib-input',
      placeholder: 'e.g. Complete · better',
    });
    labelInput.value = this.preset?.label || '';

    const completionField = createField(body, 'Completion');
    const completionSelect = completionField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(completionSelect, RELIEF_FIELD_OPTIONS.completion, seed.completion);

    const easeField = createField(body, 'Ease');
    const easeSelect = easeField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(easeSelect, RELIEF_FIELD_OPTIONS.ease, seed.ease);

    const comfortField = createField(body, 'Comfort after');
    const comfortSelect = comfortField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(comfortSelect, RELIEF_FIELD_OPTIONS.comfortAfter, seed.comfortAfter);

    const residualField = createField(body, 'Residual discomfort');
    const residualSelect = residualField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(residualSelect, RELIEF_FIELD_OPTIONS.residualDiscomfort, seed.residualDiscomfort);

    const urgencyField = createField(body, 'Urgency before');
    const urgencySelect = urgencyField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(urgencySelect, RELIEF_FIELD_OPTIONS.urgencyBefore, seed.urgencyBefore);

    const bloatingField = createField(body, 'Bloating after');
    const bloatingSelect = bloatingField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(bloatingSelect, RELIEF_FIELD_OPTIONS.bloatingAfter, seed.bloatingAfter);

    const preview = body.createDiv({ cls: 'ib-note' });

    const updatePreview = () => {
      preview.setText(`Summary: ${reliefPresetSummary({
        completion: completionSelect.value,
        ease: easeSelect.value,
        comfortAfter: comfortSelect.value,
        residualDiscomfort: residualSelect.value,
        urgencyBefore: urgencySelect.value,
        bloatingAfter: bloatingSelect.value,
      }, true)}`);
    };

    [completionSelect, easeSelect, comfortSelect, residualSelect, urgencySelect, bloatingSelect].forEach(el => {
      el.addEventListener('change', updatePreview);
    });
    updatePreview();

    const actions = body.createDiv({ cls: 'ib-row' });
    const saveBtn = actions.createEl('button', {
      text: this.preset ? 'Save' : 'Create',
      cls: 'ib-btn',
    });
    const cancelBtn = actions.createEl('button', { text: 'Cancel', cls: 'ib-btn-secondary' });

    saveBtn.addEventListener('click', async () => {
      const out = normalizeReliefPreset({
        id: this.preset?.id,
        label: labelInput.value,
        details: {
          completion: completionSelect.value,
          ease: easeSelect.value,
          comfortAfter: comfortSelect.value,
          residualDiscomfort: residualSelect.value,
          urgencyBefore: urgencySelect.value,
          bloatingAfter: bloatingSelect.value,
        },
      });

      if (this.onSave) await this.onSave(out);
      this.close();
    });

    cancelBtn.addEventListener('click', () => this.close());

    enableMobileInputVisibility(this, labelInput, true);
  }

  onClose() {
    runModalCleanups(this);
    this.contentEl.empty();
  }
}

class ReliefPresetManagerModal extends obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.modalEl.addClass('tracking-symptoms-modal');
  }

  onOpen() {
    this.render();
  }

  render() {
    const presets = this.plugin.getReliefEventPresets();
    const { body } = createDialogScaffold(
      this,
      'Relief presets',
      'Edit the quick preset buttons used by the relief event.'
    );

    const topActions = body.createDiv({ cls: 'ib-row' });

    const addBtn = topActions.createEl('button', { text: 'New preset', cls: 'ib-btn' });
    addBtn.addEventListener('click', () => {
      new ReliefPresetEditModal(this.app, this.plugin, null, async preset => {
        await this.plugin.upsertReliefEventPreset(preset);
        this.render();
      }).open();
    });

    const restoreBtn = topActions.createEl('button', { text: 'Defaults', cls: 'ib-btn-secondary' });
    restoreBtn.addEventListener('click', async () => {
      const ok = window.confirm('Restore the default relief presets? Your current preset set will be replaced.');
      if (!ok) return;
      await this.plugin.restoreDefaultReliefEventPresets();
      this.render();
    });

    if (!presets.length) {
      body.createDiv({ text: 'No relief presets yet.', cls: 'ib-empty' });
      return;
    }

    const list = body.createDiv({ cls: 'ib-list' });

    presets.forEach((preset, index) => {
      const row = list.createDiv({ cls: 'ib-item-row' });

      const meta = row.createDiv({ cls: 'ib-item-meta' });
      meta.createDiv({ text: preset.label, cls: 'ib-item-title' });
      meta.createDiv({
        text: reliefPresetSummary(preset.details, true),
        cls: 'ib-item-sub',
      });

      const actions = row.createDiv({ cls: 'ib-row ib-item-actions' });

      const upBtn = actions.createEl('button', { text: 'Up', cls: 'ib-btn-secondary' });
      upBtn.disabled = index === 0;
      upBtn.addEventListener('click', async () => {
        await this.plugin.moveReliefEventPreset(preset.id, -1);
        this.render();
      });

      const downBtn = actions.createEl('button', { text: 'Down', cls: 'ib-btn-secondary' });
      downBtn.disabled = index === presets.length - 1;
      downBtn.addEventListener('click', async () => {
        await this.plugin.moveReliefEventPreset(preset.id, 1);
        this.render();
      });

      const editBtn = actions.createEl('button', { text: 'Edit', cls: 'ib-btn-secondary' });
      editBtn.addEventListener('click', () => {
        new ReliefPresetEditModal(this.app, this.plugin, preset, async nextPreset => {
          await this.plugin.upsertReliefEventPreset(nextPreset);
          this.render();
        }).open();
      });

      const delBtn = actions.createEl('button', { text: 'Delete', cls: 'ib-btn-danger' });
      delBtn.addEventListener('click', async () => {
        const ok = window.confirm(`Delete preset "${preset.label}"?`);
        if (!ok) return;
        await this.plugin.deleteReliefEventPreset(preset.id);
        this.render();
      });
    });
  }

  onClose() {
    runModalCleanups(this);
    this.contentEl.empty();
    this.plugin.refreshModal();
  }
}

class OutcomeModal extends obsidian.Modal {
  constructor(app, plugin, item, source = 'manual') {
    super(app);
    this.plugin = plugin;
    this.item = item;
    this.source = source;
    this.showAdvanced = false;
    this.noteDraft = '';
    this.reliefDraft = {
      completion: 'partial',
      ease: 'normal',
      comfortAfter: 'unchanged',
      residualDiscomfort: 'none',
      urgencyBefore: 'moderate',
      bloatingAfter: 'unchanged',
    };
    this.modalEl.addClass('tracking-symptoms-modal');
  }

  onOpen() {
    this.render();
  }

  render() {
    const isSystemRelief = this.item?.id === RELIEF_EVENT_ID;
    const { body } = createDialogScaffold(this, this.plugin.getItemDisplayLabel(this.item));

    body.createDiv({
      text: isSystemRelief ? 'Presets' : 'Quick presets',
      cls: 'ib-card-title',
    });

    const presets = this.plugin.getReliefEventPresets();
    if (!presets.length) {
      body.createDiv({ text: 'No presets yet. Use the preset editor to add some.', cls: 'ib-empty' });
    } else {
      const presetGrid = body.createDiv({ cls: 'ib-preset-grid' });
      presets.forEach(preset => {
        const btn = presetGrid.createEl('button', { cls: 'ib-preset-btn' });
        btn.createDiv({ text: preset.label, cls: 'ib-preset-title' });
        btn.createDiv({ text: reliefPresetSummary(preset.details, true), cls: 'ib-preset-sub' });
        btn.addEventListener('click', async () => {
          await this.plugin.logItem(this.item, {
            source: this.source,
            details: preset.details,
          });
          this.close();
        });
      });
    }

    const actionRow = body.createDiv({ cls: 'ib-row' });

    if (isSystemRelief) {
      const editPresetsBtn = actionRow.createEl('button', {
        text: 'Edit presets',
        cls: 'ib-btn-secondary',
      });
      editPresetsBtn.addEventListener('click', () => {
        new ReliefPresetManagerModal(this.app, this.plugin).open();
      });
    }

    const advancedToggle = actionRow.createEl('button', {
      text: this.showAdvanced ? 'Less' : 'More',
      cls: 'ib-btn-secondary',
    });

    advancedToggle.addEventListener('click', () => {
      this.showAdvanced = !this.showAdvanced;
      this.render();
    });

    if (!this.showAdvanced) {
      body.createDiv({ cls: 'ib-spacer-bottom' });
      return;
    }

    body.createDiv({ cls: 'ib-divider' });

    const form = body.createDiv();

    const completionField = createField(form, 'Completion');
    const completionSelect = completionField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(completionSelect, RELIEF_FIELD_OPTIONS.completion, this.reliefDraft.completion);

    const easeField = createField(form, 'Ease');
    const easeSelect = easeField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(easeSelect, RELIEF_FIELD_OPTIONS.ease, this.reliefDraft.ease);

    const comfortField = createField(form, 'Comfort after');
    const comfortSelect = comfortField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(comfortSelect, RELIEF_FIELD_OPTIONS.comfortAfter, this.reliefDraft.comfortAfter);

    const residualField = createField(form, 'Residual discomfort');
    const residualSelect = residualField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(residualSelect, RELIEF_FIELD_OPTIONS.residualDiscomfort, this.reliefDraft.residualDiscomfort);

    const urgencyField = createField(form, 'Urgency before');
    const urgencySelect = urgencyField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(urgencySelect, RELIEF_FIELD_OPTIONS.urgencyBefore, this.reliefDraft.urgencyBefore);

    const bloatingField = createField(form, 'Bloating after');
    const bloatingSelect = bloatingField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(bloatingSelect, RELIEF_FIELD_OPTIONS.bloatingAfter, this.reliefDraft.bloatingAfter);

    const noteField = createField(form, 'Note (optional)');
    const noteInput = noteField.createEl('textarea', { cls: 'ib-textarea', placeholder: 'Optional note…' });
    noteInput.value = this.noteDraft;

    [completionSelect, easeSelect, comfortSelect, residualSelect, urgencySelect, bloatingSelect].forEach(select => {
      select.addEventListener('change', () => {
        this.reliefDraft = {
          completion: completionSelect.value,
          ease: easeSelect.value,
          comfortAfter: comfortSelect.value,
          residualDiscomfort: residualSelect.value,
          urgencyBefore: urgencySelect.value,
          bloatingAfter: bloatingSelect.value,
        };
      });
    });

    noteInput.addEventListener('input', () => {
      this.noteDraft = noteInput.value;
    });

    const actions = form.createDiv({ cls: 'ib-row' });
    const saveBtn = actions.createEl('button', { text: 'Save', cls: 'ib-btn' });
    const cancelBtn = actions.createEl('button', { text: 'Cancel', cls: 'ib-btn-secondary' });

    saveBtn.addEventListener('click', async () => {
      await this.plugin.logItem(this.item, {
        source: this.source,
        note: noteInput.value,
        details: {
          completion: completionSelect.value,
          ease: easeSelect.value,
          comfortAfter: comfortSelect.value,
          residualDiscomfort: residualSelect.value,
          urgencyBefore: urgencySelect.value,
          bloatingAfter: bloatingSelect.value,
        },
      });
      this.close();
    });

    cancelBtn.addEventListener('click', () => this.close());
    enableMobileInputVisibility(this, noteInput, false);
  }

  onClose() {
    runModalCleanups(this);
    this.contentEl.empty();
    this.plugin.refreshModal();
  }
}

class TemplateModal extends obsidian.Modal {
  constructor(app, plugin, template = null, initialCategory = 'food_drink') {
    super(app);
    this.plugin = plugin;
    this.template = template;
    this.initialCategory = initialCategory;
    this.modalEl.addClass('tracking-symptoms-modal');
  }

  onOpen() {
    const title = this.template ? 'Edit item' : 'New item';
    const { body } = createDialogScaffold(this, title);

    if (this.template?.mode === 'outcome') {
      body.createDiv({
        text: 'This item uses a legacy outcome mode. Relief logging is now reserved for the special relief event. Saving this item will switch it to a regular logging style.',
        cls: 'ib-note ib-compat-note',
      });
    }

    const labelField = createField(body, 'Label');
    const labelInput = labelField.createEl('input', {
      type: 'text',
      cls: 'ib-input',
      placeholder: 'e.g. coffee, late dinner, cramps',
    });
    labelInput.value = this.template?.label || '';

    const categoryField = createField(body, 'Category');
    const categorySelect = categoryField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(
      categorySelect,
      CATEGORY_ORDER.map(id => ({ value: id, label: this.plugin.getCategoryLabel(id) })),
      this.template?.category || this.initialCategory
    );

    const modeField = createField(body, 'Logging style');
    const modeSelect = modeField.createEl('select', { cls: 'ib-select' });

    const initialMode = ['instant', 'intensity'].includes(this.template?.mode)
      ? this.template.mode
      : defaultModeForCategory(this.template?.category || this.initialCategory);

    addSelectOptions(modeSelect, [
      { value: 'instant', label: 'Instant' },
      { value: 'intensity', label: 'Intensity choice' },
    ], initialMode);

    const valenceField = createField(body, 'Valence');
    const valenceSelect = valenceField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(valenceSelect, VALENCE_OPTIONS, this.template?.valence || 'uncertain');

    const intensityHost = body.createDiv();

    const renderIntensityField = () => {
      intensityHost.empty();
      if (modeSelect.value !== 'intensity') return;
      const intensityField = createField(intensityHost, 'Intensity options (comma separated)');
      const intensityInput = intensityField.createEl('input', {
        type: 'text',
        cls: 'ib-input',
        placeholder: 'e.g. mild, moderate, strong',
      });
      intensityInput.value = (this.template?.intensityOptions || defaultIntensityOptions(categorySelect.value)).join(', ');
      intensityInput.dataset.role = 'intensity-options';
      enableMobileInputVisibility(this, intensityInput, false);
    };

    renderIntensityField();

    categorySelect.addEventListener('change', () => {
      if (!this.template || this.template.mode === 'outcome') {
        modeSelect.value = defaultModeForCategory(categorySelect.value);
      }
      renderIntensityField();
    });

    modeSelect.addEventListener('change', () => {
      renderIntensityField();
    });

    const tagsField = createField(body, 'Tags (comma separated)');
    const tagsInput = tagsField.createEl('input', {
      type: 'text',
      cls: 'ib-input',
      placeholder: 'optional',
    });
    tagsInput.value = (this.template?.tags || []).join(', ');

    const actions = body.createDiv({ cls: 'ib-row' });
    const saveBtn = actions.createEl('button', { text: this.template ? 'Save' : 'Create', cls: 'ib-btn' });
    const cancelBtn = actions.createEl('button', { text: 'Cancel', cls: 'ib-btn-secondary' });

    saveBtn.addEventListener('click', async () => {
      const intensityRaw = body.querySelector('[data-role="intensity-options"]')?.value || '';
      await this.plugin.saveTemplate({
        id: this.template?.id,
        label: labelInput.value,
        category: categorySelect.value,
        mode: modeSelect.value,
        valence: valenceSelect.value,
        tags: parseTags(tagsInput.value),
        intensityOptions: modeSelect.value === 'intensity'
          ? normalizeIntensityOptions(intensityRaw, defaultIntensityOptions(categorySelect.value))
          : [],
        createdAt: this.template?.createdAt,
      });
      this.close();
    });

    cancelBtn.addEventListener('click', () => this.close());

    enableMobileInputVisibility(this, labelInput, true);
    enableMobileInputVisibility(this, tagsInput, false);
  }

  onClose() {
    runModalCleanups(this);
    this.contentEl.empty();
    this.plugin.refreshModal();
  }
}

class CategoryPickerModal extends obsidian.Modal {
  constructor(app, plugin, category, source = 'manual') {
    super(app);
    this.plugin = plugin;
    this.category = category;
    this.source = source;
    this.modalEl.addClass('tracking-symptoms-modal');
  }

  onOpen() {
    this.render();
  }

  render() {
    const { body } = createDialogScaffold(
      this,
      this.plugin.getCategoryLabel(this.category)
    );

    const searchField = createField(body, 'Search');
    const searchInput = searchField.createEl('input', {
      type: 'text',
      cls: 'ib-input',
      placeholder: 'Search…',
    });

    const actions = body.createDiv({ cls: 'ib-row' });
    actions.style.marginBottom = '8px';

    const newBtn = actions.createEl('button', { text: 'New item', cls: 'ib-btn' });
    newBtn.addEventListener('click', () => {
      new TemplateModal(this.app, this.plugin, null, this.category).open();
    });

    if (this.category === 'digestive_sensation') {
      const reliefSection = body.createDiv({ cls: 'ib-card ib-relief-section' });
      reliefSection.createDiv({ text: this.plugin.getReliefEventLabel(), cls: 'ib-card-title' });

      const reliefRow = reliefSection.createDiv({ cls: 'ib-row' });
      const quickReliefBtn = reliefRow.createEl('button', {
        text: 'Log relief',
        cls: 'ib-btn',
      });
      quickReliefBtn.addEventListener('click', () => {
        this.close();
        this.plugin.openQuickReliefEvent('category_browser');
      });

      const editPresetsBtn = reliefRow.createEl('button', {
        text: 'Presets',
        cls: 'ib-btn-secondary',
      });
      editPresetsBtn.addEventListener('click', () => {
        new ReliefPresetManagerModal(this.app, this.plugin).open();
      });
    }

    const listHost = body.createDiv();

    const drawList = () => {
      listHost.empty();

      const query = searchInput.value.toLowerCase().trim();
      const items = this.plugin.getTemplatesByCategory(this.category).filter(item => {
        const hay = `${item.label} ${(item.tags || []).join(' ')}`.toLowerCase();
        return !query || hay.includes(query);
      });

      if (!items.length) {
        listHost.createDiv({ text: 'No matches here yet.', cls: 'ib-empty' });
        return;
      }

      const list = listHost.createDiv({ cls: 'ib-list' });

      items.forEach(item => {
        const row = list.createDiv({ cls: 'ib-item-row' });

        const meta = row.createDiv({ cls: 'ib-item-meta' });
        const titleLine = meta.createDiv({ cls: 'ib-item-title-line' });
        const dot = titleLine.createDiv({ cls: 'ib-color-dot' });
        dot.style.background = this.plugin.getCategoryColor(item.category);
        titleLine.createDiv({ text: item.label, cls: 'ib-item-title' });

        meta.createDiv({
          text: `${this.plugin.getModeDisplayLabel(item.mode)}${item.valence ? ` · ${item.valence}` : ''}${item.tags.length ? ` · ${item.tags.join(', ')}` : ''}`,
          cls: 'ib-item-sub',
        });

        const rowActions = row.createDiv({ cls: 'ib-row ib-item-actions' });

        const logBtn = rowActions.createEl('button', { text: 'Log', cls: 'ib-btn-primary-action' });
        logBtn.addEventListener('click', async () => {
          this.close();
          await this.plugin.openItemFlow(item, { source: this.source });
        });

        const pinBtn = rowActions.createEl('button', {
          text: this.plugin.isFavorite(item.id) ? 'Unpin' : 'Pin',
          cls: 'ib-btn-secondary',
        });
        pinBtn.addEventListener('click', async () => {
          await this.plugin.toggleFavorite(item.id);
          this.render();
        });

        const editBtn = rowActions.createEl('button', { text: 'Edit', cls: 'ib-btn-secondary' });
        editBtn.addEventListener('click', () => {
          new TemplateModal(this.app, this.plugin, item, this.category).open();
        });
      });
    };

    searchInput.addEventListener('input', drawList);
    enableMobileInputVisibility(this, searchInput, false);
    drawList();
  }

  onClose() {
    runModalCleanups(this);
    this.contentEl.empty();
    this.plugin.refreshModal();
  }
}

class EntryEditModal extends obsidian.Modal {
  constructor(app, plugin, entry) {
    super(app);
    this.plugin = plugin;
    this.entry = normalizeEntry(entry);
    this.modalEl.addClass('tracking-symptoms-modal');
  }

  onOpen() {
    const { body } = createDialogScaffold(this, 'Edit entry', `Logged ${dateTimeLabel(this.entry.datetime)}`);

    const labelField = createField(body, 'Item label');
    const labelInput = labelField.createEl('input', { type: 'text', cls: 'ib-input' });
    labelInput.value = this.entry.itemLabel;

    const categoryField = createField(body, 'Category');
    const categorySelect = categoryField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(
      categorySelect,
      CATEGORY_ORDER.map(id => ({ value: id, label: this.plugin.getCategoryLabel(id) })),
      this.entry.category
    );

    const valenceField = createField(body, 'Valence');
    const valenceSelect = valenceField.createEl('select', { cls: 'ib-select' });
    addSelectOptions(valenceSelect, VALENCE_OPTIONS, this.entry.valence);

    const intensityField = createField(body, 'Intensity (optional)');
    const intensityInput = intensityField.createEl('input', {
      type: 'text',
      cls: 'ib-input',
      placeholder: 'e.g. mild, moderate, strong',
    });
    intensityInput.value = this.entry.intensity || '';

    const tagsField = createField(body, 'Tags (comma separated)');
    const tagsInput = tagsField.createEl('input', { type: 'text', cls: 'ib-input' });
    tagsInput.value = (this.entry.tags || []).join(', ');

    const outcomeHost = body.createDiv();
    let completionSelect = null;
    let easeSelect = null;
    let comfortSelect = null;
    let residualSelect = null;
    let urgencySelect = null;
    let bloatingSelect = null;

    const entryIsRelief = isReliefEntry(this.entry);

    const renderOutcomeFields = () => {
      outcomeHost.empty();
      if (!entryIsRelief) return;

      const d = normalizeReliefDetails(this.entry.details || {});

      const completionField = createField(outcomeHost, 'Completion');
      completionSelect = completionField.createEl('select', { cls: 'ib-select' });
      addSelectOptions(completionSelect, [''].concat(RELIEF_FIELD_OPTIONS.completion), d.completion || '');

      const easeField = createField(outcomeHost, 'Ease');
      easeSelect = easeField.createEl('select', { cls: 'ib-select' });
      addSelectOptions(easeSelect, [''].concat(RELIEF_FIELD_OPTIONS.ease), d.ease || '');

      const comfortField = createField(outcomeHost, 'Comfort after');
      comfortSelect = comfortField.createEl('select', { cls: 'ib-select' });
      addSelectOptions(comfortSelect, [''].concat(RELIEF_FIELD_OPTIONS.comfortAfter), d.comfortAfter || '');

      const residualField = createField(outcomeHost, 'Residual discomfort');
      residualSelect = residualField.createEl('select', { cls: 'ib-select' });
      addSelectOptions(residualSelect, [''].concat(RELIEF_FIELD_OPTIONS.residualDiscomfort), d.residualDiscomfort || '');

      const urgencyField = createField(outcomeHost, 'Urgency before');
      urgencySelect = urgencyField.createEl('select', { cls: 'ib-select' });
      addSelectOptions(urgencySelect, [''].concat(RELIEF_FIELD_OPTIONS.urgencyBefore), d.urgencyBefore || '');

      const bloatingField = createField(outcomeHost, 'Bloating after');
      bloatingSelect = bloatingField.createEl('select', { cls: 'ib-select' });
      addSelectOptions(bloatingSelect, [''].concat(RELIEF_FIELD_OPTIONS.bloatingAfter), d.bloatingAfter || '');
    };

    renderOutcomeFields();

    const noteField = createField(body, 'Note');
    const noteInput = noteField.createEl('textarea', { cls: 'ib-textarea' });
    noteInput.value = this.entry.note || '';

    const actions = body.createDiv({ cls: 'ib-row' });
    const saveBtn = actions.createEl('button', { text: 'Save', cls: 'ib-btn' });
    const cancelBtn = actions.createEl('button', { text: 'Cancel', cls: 'ib-btn-secondary' });

    saveBtn.addEventListener('click', async () => {
      const patch = {
        itemLabel: labelInput.value,
        category: categorySelect.value,
        valence: valenceSelect.value,
        intensity: intensityInput.value,
        tags: parseTags(tagsInput.value),
        note: noteInput.value,
      };

      if (entryIsRelief) {
        patch.details = {
          completion: completionSelect?.value || '',
          ease: easeSelect?.value || '',
          comfortAfter: comfortSelect?.value || '',
          residualDiscomfort: residualSelect?.value || '',
          urgencyBefore: urgencySelect?.value || '',
          bloatingAfter: bloatingSelect?.value || '',
        };
      } else {
        patch.details = {};
      }

      await this.plugin.updateEntry(this.entry.id, patch);
      this.close();
    });

    cancelBtn.addEventListener('click', () => this.close());

    enableMobileInputVisibility(this, labelInput, true);
    enableMobileInputVisibility(this, noteInput, false);
  }

  onClose() {
    runModalCleanups(this);
    this.contentEl.empty();
    this.plugin.refreshModal();
  }
}

/* ============================================================
   MAIN MODAL
============================================================ */

class TrackingSymptomsModal extends obsidian.Modal {
  constructor(app, plugin, initialSection = SECTIONS.QUICK) {
    super(app);
    this.plugin = plugin;
    this.section = initialSection;
    this.historyPeriod = 'today';
    this.historyCategory = 'all';
    this.historySearch = '';
    this.historyLimit = 15;
    this.librarySearch = '';
    this.libraryFocusCategory = 'all';
    this.libraryCollapsedCategories = new Set();
    this.reviewPeriod = '7d';
    this.modalEl.addClass('tracking-symptoms-modal');
  }

  onOpen() {
    this.plugin.currentModal = this;
    this.render();
  }

  onClose() {
    runModalCleanups(this);
    this.contentEl.empty();
    if (this.plugin.currentModal === this) this.plugin.currentModal = null;
  }

  setSection(section) {
    if (this.section === section) return;
    this.section = section;
    if (section === SECTIONS.HISTORY) this.historyLimit = 15;
    this.render();
  }

  render() {
    const c = this.contentEl;
    c.empty();

    const shell = c.createDiv({ cls: 'ib-shell' });
    this.renderTopNav(shell);

    const main = shell.createDiv({ cls: 'ib-main' });

    if (this.section === SECTIONS.HISTORY) this.renderHistory(main);
    else if (this.section === SECTIONS.LIBRARY) this.renderLibrary(main);
    else if (this.section === SECTIONS.REVIEW) this.renderReview(main);
    else this.renderQuick(main);
  }

  renderTopNav(shell) {
    const nav = shell.createDiv({ cls: 'ib-topnav' });
    nav.createSpan({ text: 'Tracking Symptoms', cls: 'ib-brand' });

    const inner = nav.createDiv({ cls: 'ib-topnav-inner' });
    this.renderNavBtn(inner, 'Log', SECTIONS.QUICK);
    this.renderNavBtn(inner, 'History', SECTIONS.HISTORY);
    this.renderNavBtn(inner, 'Library', SECTIONS.LIBRARY);
    this.renderNavBtn(inner, 'Review', SECTIONS.REVIEW);
    inner.createSpan({ cls: 'ib-topnav-spacer' });
  }

  renderNavBtn(nav, label, section) {
    const btn = nav.createEl('button', {
      text: label,
      cls: `ib-nav-btn${this.section === section ? ' is-active' : ''}`,
    });
    btn.addEventListener('click', () => this.setSection(section));
  }

  renderHeader(container, title, subtitle = '', actionsBuilder = null) {
    const header = container.createDiv({ cls: 'ib-page-header' });
    const left = header.createDiv({ cls: 'ib-title-wrap' });
    left.createEl('h2', { text: title, cls: 'ib-title' });
    if (subtitle) left.createDiv({ text: subtitle, cls: 'ib-subtitle' });

    if (actionsBuilder) {
      const right = header.createDiv({ cls: 'ib-row ib-header-actions' });
      actionsBuilder(right);
    }
  }

  /* ---- LOG section ---- */

  renderQuick(container) {
    const actionCard = container.createDiv({ cls: 'ib-card' });
    const actionRow = actionCard.createDiv({ cls: 'ib-row ib-quick-actions' });

    const reliefBtn = actionRow.createEl('button', {
      text: this.plugin.getReliefEventLabel(),
      cls: 'ib-btn',
    });
    reliefBtn.addEventListener('click', () => this.plugin.openQuickReliefEvent('quick'));

    const newBtn = actionRow.createEl('button', {
      text: 'New item',
      cls: 'ib-btn-secondary',
    });
    newBtn.addEventListener('click', () => new TemplateModal(this.app, this.plugin).open());

    const libBtn = actionRow.createEl('button', {
      text: 'Library',
      cls: 'ib-btn-secondary',
    });
    libBtn.addEventListener('click', () => this.setSection(SECTIONS.LIBRARY));

    const groupedPinned = this.plugin.getGroupedFavoriteTemplates();

    if (groupedPinned.length) {
      const quickCard = container.createDiv({ cls: 'ib-card' });
      quickCard.createDiv({ text: 'Quick access', cls: 'ib-card-title' });

      const stack = quickCard.createDiv({ cls: 'ib-group-stack' });
      groupedPinned.forEach(group => {
        const groupEl = stack.createDiv({ cls: 'ib-group' });
        groupEl.createDiv({ text: this.plugin.getCategoryLabel(group.category), cls: 'ib-group-label' });

        const row = groupEl.createDiv({ cls: 'ib-chip-row' });
        group.items.forEach(item => {
          const btn = row.createEl('button', {
            text: item.label,
            cls: 'ib-chip',
          });
          btn.addEventListener('click', async () => {
            await this.plugin.openItemFlow(item, { source: 'favorite' });
          });
        });
      });
    } else {
      container.createDiv({
        text: 'Pin shortcuts from the Library or a category screen to keep your most-used entries here.',
        cls: 'ib-empty',
      });
    }

    const categoriesCard = container.createDiv({ cls: 'ib-card' });
    categoriesCard.createDiv({ text: 'Browse', cls: 'ib-card-title' });
    const grid = categoriesCard.createDiv({ cls: 'ib-category-grid' });

    CATEGORY_ORDER.forEach(category => {
      const itemCount = this.plugin.getTemplatesByCategory(category).length;
      const btn = grid.createEl('button', { cls: 'ib-category-card' });
      btn.style.borderLeft = `3px solid ${this.plugin.getCategoryColor(category)}`;

      const top = btn.createDiv({ cls: 'ib-category-top' });
      const main = top.createDiv({ cls: 'ib-category-main' });
      main.createDiv({ text: this.plugin.getCategoryLabel(category), cls: 'ib-category-label' });
      top.createDiv({ text: String(itemCount), cls: 'ib-category-count' });

      btn.addEventListener('click', () => {
        new CategoryPickerModal(this.app, this.plugin, category, 'category_browser').open();
      });
    });

    const recents = this.plugin.getRecentTemplates(8);
    if (recents.length) {
      const recentCard = container.createDiv({ cls: 'ib-card' });
      recentCard.createDiv({ text: 'Recent', cls: 'ib-card-title' });
      const row = recentCard.createDiv({ cls: 'ib-chip-row' });
      recents.forEach(item => {
        const btn = row.createEl('button', {
          text: item.label,
          cls: 'ib-chip',
        });
        btn.addEventListener('click', async () => {
          await this.plugin.openItemFlow(item, { source: 'recent' });
        });
      });
    }
  }

  /* ---- HISTORY section ---- */

  renderHistory(container) {
    const filteredEntries = this.plugin.entries.filter(entry => {
      if (!inPeriod(entry.datetime, this.historyPeriod)) return false;
      if (this.historyCategory !== 'all' && entry.category !== this.historyCategory) return false;
      if (this.historySearch) {
        const hay = `${entry.itemLabel} ${entry.note} ${(entry.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(this.historySearch.toLowerCase())) return false;
      }
      return true;
    });

    const subtitle = this.historyPeriod === 'today'
      ? readableDate(new Date())
      : `${periodDisplayLabel(this.historyPeriod)} · filter, search, edit, and export your log.`;

    this.renderHeader(
      container,
      'History',
      subtitle,
      actions => {
        const jsonBtn = actions.createEl('button', { text: 'JSON', cls: 'ib-btn-secondary' });
        jsonBtn.addEventListener('click', async () => await this.plugin.exportData('json'));

        const csvBtn = actions.createEl('button', { text: 'CSV', cls: 'ib-btn-secondary' });
        csvBtn.addEventListener('click', async () => await this.plugin.exportData('csv'));
      }
    );

    const metrics = container.createDiv({ cls: 'ib-inline-stats' });

    if (this.historyPeriod === 'today') {
      const counts = countBy(filteredEntries, e => e.category);
      const reliefCount = filteredEntries.filter(e => isReliefEntry(e)).length;

      this.stat(metrics, 'Entries', String(filteredEntries.length), 'logged');
      this.stat(metrics, 'Food & drink', String(counts.get('food_drink') || 0), '');
      this.stat(metrics, 'Sensations', String(counts.get('digestive_sensation') || 0), '');
      this.stat(metrics, 'Relief', String(reliefCount), '');
    } else {
      const reliefCount = filteredEntries.filter(e => isReliefEntry(e)).length;
      const challengingCount = filteredEntries.filter(e => e.valence === 'challenging').length;
      const activeDays = countUnique(filteredEntries, e => dateKey(e.datetime));

      this.stat(metrics, periodShortLabel(this.historyPeriod), String(filteredEntries.length), 'entries');
      this.stat(metrics, 'Active days', String(activeDays), '');
      this.stat(metrics, 'Relief', String(reliefCount), '');
      this.stat(metrics, 'Challenging', String(challengingCount), '');
    }

    const filterCard = container.createDiv({ cls: 'ib-card' });
    filterCard.createDiv({ text: 'Filters', cls: 'ib-card-title' });

    const periodRow = filterCard.createDiv({ cls: 'ib-chip-row' });
    [
      { value: 'today', label: 'Today' },
      { value: '7d', label: '7d' },
      { value: '30d', label: '30d' },
      { value: '90d', label: '90d' },
      { value: 'all', label: 'All' },
    ].forEach(period => {
      const btn = periodRow.createEl('button', {
        text: period.label,
        cls: `ib-chip${this.historyPeriod === period.value ? ' is-active' : ''}`,
      });
      btn.addEventListener('click', () => {
        this.historyPeriod = period.value;
        this.historyLimit = 15;
        this.render();
      });
    });

    const row = filterCard.createDiv({ cls: 'ib-row' });

    const categorySelect = row.createEl('select', { cls: 'ib-select' });
    addSelectOptions(
      categorySelect,
      [{ value: 'all', label: 'All categories' }].concat(
        CATEGORY_ORDER.map(id => ({ value: id, label: this.plugin.getCategoryLabel(id) }))
      ),
      this.historyCategory
    );
    categorySelect.addEventListener('change', () => {
      this.historyCategory = categorySelect.value;
      this.historyLimit = 15;
      this.render();
    });

    const searchInput = row.createEl('input', {
      type: 'text',
      cls: 'ib-input',
      placeholder: 'Search…',
    });
    searchInput.value = this.historySearch;
    searchInput.addEventListener('input', () => {
      this.historySearch = searchInput.value;
      this.historyLimit = 15;
      this.render();
    });

    const listCard = container.createDiv({ cls: 'ib-card' });
    listCard.createDiv({
      text: `Timeline (${filteredEntries.length})`,
      cls: 'ib-card-title',
    });

    this.renderEntryList(listCard, filteredEntries, 'No matching entries.', {
      limit: this.historyLimit,
      showDate: this.historyPeriod !== 'today',
      showCategory: this.historyCategory === 'all',
      onShowMore: filteredEntries.length > this.historyLimit
        ? () => {
            this.historyLimit += 20;
            this.render();
          }
        : null,
    });
  }

  /* ---- LIBRARY section ---- */

  renderLibrary(container) {
    this.renderHeader(
      container,
      'Library',
      'Search, filter, collapse, and keep the list compact.',
      actions => {
        const addBtn = actions.createEl('button', { text: 'New item', cls: 'ib-btn' });
        addBtn.addEventListener('click', () => new TemplateModal(this.app, this.plugin).open());
      }
    );

    const toolbarCard = container.createDiv({ cls: 'ib-card' });
    toolbarCard.addClass('ib-library-toolbar');
    toolbarCard.createDiv({ text: 'Browse library', cls: 'ib-card-title' });

    const searchInput = toolbarCard.createEl('input', {
      type: 'text',
      cls: 'ib-input',
      placeholder: 'Search name or tag…',
    });
    searchInput.value = this.librarySearch;
    searchInput.addEventListener('input', () => {
      this.librarySearch = searchInput.value;
      this.render();
    });

    const chipRow = toolbarCard.createDiv({ cls: 'ib-chip-row' });
    [{ value: 'all', label: 'All categories' }].concat(
      CATEGORY_ORDER.map(id => ({ value: id, label: this.plugin.getCategoryLabel(id) }))
    ).forEach(opt => {
      const chip = chipRow.createEl('button', {
        text: opt.label,
        cls: `ib-chip${this.libraryFocusCategory === opt.value ? ' is-active' : ''}`,
      });
      chip.addEventListener('click', () => {
        this.libraryFocusCategory = opt.value;
        this.render();
      });
    });

    const collapseRow = toolbarCard.createDiv({ cls: 'ib-row' });
    const collapseAllBtn = collapseRow.createEl('button', { text: 'Collapse all', cls: 'ib-btn-secondary' });
    collapseAllBtn.addEventListener('click', () => {
      this.libraryCollapsedCategories = new Set(CATEGORY_ORDER);
      this.render();
    });

    const expandAllBtn = collapseRow.createEl('button', { text: 'Expand all', cls: 'ib-btn-secondary' });
    expandAllBtn.addEventListener('click', () => {
      this.libraryCollapsedCategories.clear();
      this.render();
    });

    let visibleCategoryCards = 0;

    CATEGORY_ORDER.forEach(category => {
      if (this.libraryFocusCategory !== 'all' && this.libraryFocusCategory !== category) return;

      const allItems = this.plugin.getTemplatesByCategory(category);
      const query = this.librarySearch.toLowerCase().trim();
      const items = allItems.filter(item => {
        const hay = `${item.label} ${(item.tags || []).join(' ')}`.toLowerCase();
        return !query || hay.includes(query);
      });

      const shouldShowCard = this.libraryFocusCategory !== 'all'
        ? true
        : (!query || items.length > 0 || allItems.length === 0);

      if (!shouldShowCard) return;
      visibleCategoryCards++;

      const card = container.createDiv({ cls: 'ib-card ib-library-card' });
      card.style.borderLeft = `3px solid ${this.plugin.getCategoryColor(category)}`;

      const header = card.createDiv({ cls: 'ib-card-header' });
      const left = header.createDiv({ cls: 'ib-title-wrap' });

      const titleLine = left.createDiv({ cls: 'ib-item-title-line' });
      const dot = titleLine.createDiv({ cls: 'ib-color-dot' });
      dot.style.background = this.plugin.getCategoryColor(category);
      titleLine.createDiv({ text: this.plugin.getCategoryLabel(category), cls: 'ib-category-label' });

      left.createDiv({
        text: `${items.length} shown / ${allItems.length} total`,
        cls: 'ib-note',
      });

      const actions = header.createDiv({ cls: 'ib-row ib-header-actions' });

      if (category === 'digestive_sensation') {
        const reliefBtn = actions.createEl('button', {
          text: this.plugin.getReliefEventLabel(),
          cls: 'ib-btn-secondary',
        });
        reliefBtn.addEventListener('click', () => this.plugin.openQuickReliefEvent('library'));

        const presetBtn = actions.createEl('button', {
          text: 'Presets',
          cls: 'ib-btn-secondary',
        });
        presetBtn.addEventListener('click', () => new ReliefPresetManagerModal(this.app, this.plugin).open());
      }

      const addBtn = actions.createEl('button', { text: 'Add', cls: 'ib-btn-secondary' });
      addBtn.addEventListener('click', () => new TemplateModal(this.app, this.plugin, null, category).open());

      const collapsed = this.libraryCollapsedCategories.has(category);
      const toggleBtn = actions.createEl('button', {
        cls: `ib-section-toggle${collapsed ? ' is-collapsed' : ''}`,
      });
      toggleBtn.setAttr('aria-label', collapsed ? 'Expand section' : 'Collapse section');
      toggleBtn.setAttr('title', collapsed ? 'Expand' : 'Collapse');
      toggleBtn.createSpan({ text: '▾', cls: 'ib-section-toggle-glyph' });

      toggleBtn.addEventListener('click', () => {
        if (this.libraryCollapsedCategories.has(category)) this.libraryCollapsedCategories.delete(category);
        else this.libraryCollapsedCategories.add(category);
        this.render();
      });

      if (collapsed) return;

      if (!items.length) {
        card.createDiv({
          text: query ? 'No matches in this category.' : 'Nothing in this category yet.',
          cls: 'ib-empty',
        });
        return;
      }

      const list = card.createDiv({ cls: 'ib-list' });

      items.forEach(item => {
        const row = list.createDiv({ cls: 'ib-item-row' });

        const meta = row.createDiv({ cls: 'ib-item-meta' });
        const rowTitle = meta.createDiv({ cls: 'ib-item-title-line' });
        const rowDot = rowTitle.createDiv({ cls: 'ib-color-dot' });
        rowDot.style.background = this.plugin.getCategoryColor(category);
        rowTitle.createDiv({ text: item.label, cls: 'ib-item-title' });

        const tagsPart = item.tags.length ? ` · ${item.tags.join(', ')}` : '';
        const favoritePart = this.plugin.isFavorite(item.id) ? ' · pinned' : '';
        meta.createDiv({
          text: `${this.plugin.getModeDisplayLabel(item.mode)}${item.valence ? ` · ${item.valence}` : ''}${tagsPart}${favoritePart}`,
          cls: 'ib-item-sub',
        });

        const rowActions = row.createDiv({ cls: 'ib-row ib-item-actions' });

        const logBtn = rowActions.createEl('button', { text: 'Log', cls: 'ib-btn-primary-action' });
        logBtn.addEventListener('click', async () => await this.plugin.openItemFlow(item, { source: 'library' }));

        const pinBtn = rowActions.createEl('button', {
          text: this.plugin.isFavorite(item.id) ? 'Unpin' : 'Pin',
          cls: 'ib-btn-secondary',
        });
        pinBtn.addEventListener('click', async () => await this.plugin.toggleFavorite(item.id));

        const editBtn = rowActions.createEl('button', { text: 'Edit', cls: 'ib-btn-secondary' });
        editBtn.addEventListener('click', () => new TemplateModal(this.app, this.plugin, item, category).open());

        const delBtn = rowActions.createEl('button', { text: 'Delete', cls: 'ib-btn-danger' });
        delBtn.addEventListener('click', async () => {
          const ok = window.confirm(`Delete "${item.label}"? Existing history will stay, but the item will be removed from your library.`);
          if (!ok) return;
          await this.plugin.deleteTemplate(item.id);
        });
      });
    });

    if (!visibleCategoryCards) {
      container.createDiv({
        text: 'No library entries match the current filters.',
        cls: 'ib-empty',
      });
    }
  }

  /* ---- REVIEW section ---- */

  renderReview(container) {
    const period = this.reviewPeriod;
    const entriesWindow = this.plugin.entries.filter(e => inPeriod(e.datetime, period));
    const reliefEntries = entriesWindow.filter(e => isReliefEntry(e));
    const valenceEntries = entriesWindow.filter(e => e.valence && e.valence !== 'neutral');
    const challengingEntries = entriesWindow.filter(e => e.valence === 'challenging');
    const activeDays = countUnique(entriesWindow, e => dateKey(e.datetime));

    const subtitle = period === 'yesterday'
      ? `${readableDate(addDays(new Date(), -1))} · useful for delayed symptom cross-checking`
      : period === 'today'
        ? readableDate(new Date())
        : `Recent activity across ${periodDisplayLabel(period).toLowerCase()}.`;

    this.renderHeader(
      container,
      'Review',
      subtitle
    );

    const metrics = container.createDiv({ cls: 'ib-inline-stats' });
    this.stat(metrics, periodShortLabel(period), String(entriesWindow.length), 'entries');
    this.stat(metrics, 'Active days', String(activeDays), '');
    this.stat(metrics, 'Relief', String(reliefEntries.length), '');
    this.stat(metrics, 'Challenging', String(challengingEntries.length), '');

    const heatmapCard = container.createDiv({ cls: 'ib-card' });
    heatmapCard.createDiv({ text: 'Activity', cls: 'ib-card-title' });
    heatmapCard.createDiv({
      text: 'Cell number = entries that day. Stronger color = more entries. Split color = mixed valence.',
      cls: 'ib-note',
    });

    const selectorRow = heatmapCard.createDiv({ cls: 'ib-chip-row' });
    ['yesterday', 'today', '7d', '14d', '21d'].forEach(nextPeriod => {
      const btn = selectorRow.createEl('button', {
        text: periodShortLabel(nextPeriod),
        cls: `ib-chip${this.reviewPeriod === nextPeriod ? ' is-active' : ''}`,
      });
      btn.addEventListener('click', () => {
        this.reviewPeriod = nextPeriod;
        this.render();
      });
    });

    this.renderCategoryHeatmap(heatmapCard, period);

    const legend = heatmapCard.createDiv({ cls: 'ib-legend-row' });
    [
      { label: 'supportive', color: VALENCE_COLORS.supportive },
      { label: 'challenging', color: VALENCE_COLORS.challenging },
      { label: 'uncertain', color: VALENCE_COLORS.uncertain },
      { label: 'neutral', color: VALENCE_COLORS.neutral },
      { label: 'mixed', color: VALENCE_COLORS.mixed },
    ].forEach(item => {
      const leg = legend.createDiv({ cls: 'ib-legend-item' });
      const sw = leg.createDiv({ cls: 'ib-legend-swatch' });
      sw.style.background = item.color;
      leg.createSpan({ text: item.label });
    });

    const topItems = [...countBy(entriesWindow, e => e.itemLabel).entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const topCategories = [...countBy(entriesWindow, e => e.category).entries()]
      .sort((a, b) => b[1] - a[1]);

    const completionCounts = [...countBy(reliefEntries, e => e.details?.completion || 'unspecified').entries()]
      .sort((a, b) => b[1] - a[1]);

    const urgencyCounts = [...countBy(reliefEntries, e => e.details?.urgencyBefore || 'unspecified').entries()]
      .sort((a, b) => b[1] - a[1]);

    const valenceCounts = [...countBy(valenceEntries, e => e.valence).entries()]
      .sort((a, b) => b[1] - a[1]);

    const topItemsCard = container.createDiv({ cls: 'ib-card' });
    topItemsCard.createDiv({ text: `Most logged (${periodShortLabel(period)})`, cls: 'ib-card-title' });
    this.renderBarList(topItemsCard, topItems, 'No data yet.');

    const topCategoriesCard = container.createDiv({ cls: 'ib-card' });
    topCategoriesCard.createDiv({ text: `Categories (${periodShortLabel(period)})`, cls: 'ib-card-title' });
    this.renderBarList(topCategoriesCard, topCategories, 'No data yet.', {
      labelFor: key => this.plugin.getCategoryLabel(key),
      colorFor: key => this.plugin.getCategoryColor(key),
    });

    const completionCard = container.createDiv({ cls: 'ib-card' });
    completionCard.createDiv({ text: `Relief completion (${periodShortLabel(period)})`, cls: 'ib-card-title' });
    this.renderBarList(completionCard, completionCounts, 'No relief entries yet.', {
      colorFor: key => {
        if (key === 'complete') return '#10b981';
        if (key === 'partial') return '#f59e0b';
        if (key === 'unsatisfying') return '#ef4444';
        return 'var(--interactive-accent)';
      },
    });

    const urgencyCard = container.createDiv({ cls: 'ib-card' });
    urgencyCard.createDiv({ text: `Urgency before (${periodShortLabel(period)})`, cls: 'ib-card-title' });
    this.renderBarList(urgencyCard, urgencyCounts, 'No urgency data yet.', {
      colorFor: key => {
        if (key === 'low') return '#10b981';
        if (key === 'moderate') return '#f59e0b';
        if (key === 'high') return '#ef4444';
        return 'var(--interactive-accent)';
      },
    });

    const valenceCard = container.createDiv({ cls: 'ib-card' });
    valenceCard.createDiv({ text: `Valence (${periodShortLabel(period)})`, cls: 'ib-card-title' });
    this.renderBarList(valenceCard, valenceCounts, 'No valence data yet.', {
      colorFor: key => VALENCE_COLORS[key] || 'var(--interactive-accent)',
    });
  }

  renderCategoryHeatmap(container, period) {
    const dates = getPeriodDates(period);
    const wrap = container.createDiv({ cls: 'ib-heatmap-wrap' });

    const head = wrap.createDiv({ cls: 'ib-heatmap-head' });
    head.createDiv();
    const dayHeaders = head.createDiv({ cls: 'ib-heatmap-day-headers' });

    dates.forEach(date => {
      const day = dayHeaders.createDiv({ cls: 'ib-heatmap-day' });
      day.createDiv({ text: shortDayLabel(date), cls: 'ib-note' });
      day.createDiv({ text: String(parseDate(date).getDate()), cls: 'ib-heatmap-day-num' });
      day.title = readableDate(date);
    });

    const grid = wrap.createDiv({ cls: 'ib-heatmap-grid' });

    CATEGORY_ORDER.forEach(category => {
      const categoryEntries = this.plugin.entries.filter(e =>
        e.category === category && inPeriod(e.datetime, period)
      );
      const totalCount = categoryEntries.length;

      const row = grid.createDiv({ cls: 'ib-heatmap-row' });

      const labelWrap = row.createDiv({ cls: 'ib-heatmap-row-label' });
      const left = labelWrap.createDiv({ cls: 'ib-heatmap-row-main' });
      left.createDiv({ text: this.plugin.getCategoryLabel(category), cls: 'ib-heatmap-row-title' });
      labelWrap.createDiv({
        text: `${totalCount}`,
        cls: 'ib-heatmap-total',
      });

      const cells = row.createDiv({ cls: 'ib-heatmap-cells' });

      dates.forEach(date => {
        const dayKey = dateKey(date);
        const dayEntries = categoryEntries.filter(e => dateKey(e.datetime) === dayKey);
        const visual = this.getHeatmapCellVisual(dayEntries, date, category);

        const cell = cells.createDiv({ cls: 'ib-heatmap-cell' });
        cell.style.background = visual.background;
        cell.style.borderColor = visual.borderColor;
        cell.style.color = visual.textColor;
        cell.setText(visual.label);
        cell.title = visual.title;
        cell.setAttr('aria-label', visual.title);
      });
    });
  }

  getHeatmapCellVisual(entries, date, category) {
    const total = entries.length;
    const categoryLabel = this.plugin.getCategoryLabel(category);

    if (!total) {
      return {
        label: '',
        background: 'rgba(127,127,127,0.08)',
        borderColor: 'rgba(127,127,127,0.14)',
        textColor: 'var(--text-muted)',
        title: `${categoryLabel} · ${readableDate(date)} · no entries`,
      };
    }

    const counts = {
      supportive: 0,
      challenging: 0,
      uncertain: 0,
      neutral: 0,
    };

    entries.forEach(entry => {
      counts[normalizeValence(entry.valence)] += 1;
    });

    const nonZero = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const dominant = nonZero[0]?.[0] || 'neutral';
    const second = nonZero[1]?.[0] || null;
    const alpha = Math.min(0.25 + total * 0.18, 0.92);

    let background = hexToRgba(VALENCE_COLORS[dominant], alpha);
    let borderColor = hexToRgba(VALENCE_COLORS[dominant], Math.min(alpha + 0.08, 1));
    let textColor = dominant === 'neutral' && total === 1 ? 'var(--text-normal)' : '#ffffff';

    if (nonZero.length > 1) {
      const firstColor = hexToRgba(VALENCE_COLORS[dominant], alpha);
      const secondColor = hexToRgba(VALENCE_COLORS[second] || VALENCE_COLORS.mixed, Math.max(alpha - 0.08, 0.28));
      background = `linear-gradient(135deg, ${firstColor} 0%, ${firstColor} 56%, ${secondColor} 100%)`;
      borderColor = hexToRgba(VALENCE_COLORS.mixed, 0.75);
      textColor = '#ffffff';
    }

    const breakdown = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([valence, count]) => `${valence}: ${count}`)
      .join(' · ');

    return {
      label: String(total),
      background,
      borderColor,
      textColor,
      title: `${categoryLabel} · ${readableDate(date)} · ${total} entr${total === 1 ? 'y' : 'ies'} · ${breakdown}`,
    };
  }

  /* ---- Shared renderers ---- */

  stat(container, label, value, sub = '') {
    const el = container.createDiv({ cls: 'ib-stat' });
    el.createDiv({ text: label, cls: 'ib-stat-label' });
    el.createDiv({ text: value, cls: 'ib-stat-value' });
    if (sub) el.createDiv({ text: sub, cls: 'ib-stat-sub' });
  }

  renderBarList(container, data, emptyText, options = {}) {
    if (!data.length) {
      container.createDiv({ text: emptyText, cls: 'ib-empty' });
      return;
    }

    const maxVal = Math.max(...data.map(d => d[1]), 1);
    const list = container.createDiv({ cls: 'ib-bar-list' });

    data.forEach(([key, count]) => {
      const row = list.createDiv({ cls: 'ib-bar-row' });
      const meta = row.createDiv({ cls: 'ib-bar-meta' });
      const label = options.labelFor ? options.labelFor(key) : key;
      meta.createSpan({ text: label, cls: 'ib-bar-label' });
      meta.createSpan({ text: String(count), cls: 'ib-bar-value' });

      const bg = row.createDiv({ cls: 'ib-bar-bg' });
      const fill = bg.createDiv({ cls: 'ib-bar-fill' });
      fill.style.width = `${Math.round((count / maxVal) * 100)}%`;
      fill.style.background = options.colorFor ? options.colorFor(key) : 'var(--interactive-accent)';
    });
  }

  renderEntryList(container, entries, emptyText, options = {}) {
    if (!entries.length) {
      container.createDiv({ text: emptyText, cls: 'ib-empty' });
      return;
    }

    const limit = Number.isFinite(options.limit) ? options.limit : entries.length;
    const visibleEntries = entries.slice(0, limit);

    const list = container.createDiv({ cls: 'ib-entry-list' });

    visibleEntries.forEach(entry => {
      const el = list.createDiv({ cls: 'ib-entry' });

      const color = this.plugin.getCategoryColor(entry.category);
      el.style.borderLeftColor = color;

      const top = el.createDiv({ cls: 'ib-entry-top' });

      if (options.showDate) top.createSpan({ text: shortDateLabel(entry.datetime), cls: 'ib-pill' });
      top.createSpan({ text: timeLabel(entry.datetime), cls: 'ib-entry-time' });

      if (options.showCategory) {
        top.createSpan({
          text: this.plugin.getCategoryLabel(entry.category),
          cls: 'ib-pill',
        });
      }

      top.createSpan({ text: entry.itemLabel, cls: 'ib-entry-title' });

      if (entry.intensity) top.createSpan({ text: entry.intensity, cls: 'ib-pill' });
      if (entry.valence && entry.valence !== 'neutral') top.createSpan({ text: entry.valence, cls: 'ib-pill' });
      if (entry.tags?.length) top.createSpan({ text: entry.tags.join(', '), cls: 'ib-pill' });

      const entryActions = top.createDiv({ cls: 'ib-entry-actions' });

      const editBtn = entryActions.createEl('button', { text: 'Edit', cls: 'ib-btn-ghost' });
      editBtn.addEventListener('click', () => {
        new EntryEditModal(this.app, this.plugin, entry).open();
      });

      const delBtn = entryActions.createEl('button', { text: '×', cls: 'ib-btn-ghost' });
      delBtn.addEventListener('click', async () => {
        const ok = window.confirm('Delete this entry?');
        if (!ok) return;
        await this.plugin.deleteEntry(entry.id);
      });

      const relief = isReliefEntry(entry);
      if (relief) {
        const d = normalizeReliefDetails(entry.details || {});
        const summary = reliefPresetSummary(d, false);
        if (summary) {
          el.createDiv({
            text: summary,
            cls: 'ib-entry-details',
          });
        }
      }

      if (entry.note?.trim()) {
        el.createDiv({
          text: entry.note.trim(),
          cls: 'ib-entry-note',
        });
      }
    });

    if (options.onShowMore) {
      const wrap = container.createDiv({ cls: 'ib-show-more-wrap' });
      const btn = wrap.createEl('button', {
        text: 'Show more',
        cls: 'ib-show-more-btn',
      });
      btn.addEventListener('click', options.onShowMore);
    }
  }
}

/* ============================================================
   SETTINGS TAB
============================================================ */

class TrackingSymptomsSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Tracking Symptoms' });
    containerEl.createEl('p', {
      text: 'Compact symptom logging focused on fast mobile use.',
    });

    new obsidian.Setting(containerEl)
      .setName('Data folder')
      .setDesc('Folder used for the plugin data and exports.')
      .addText(text => {
        text.setPlaceholder('data');
        text.setValue(this.plugin.settings.folderPath || 'data');
        text.onChange(async value => {
          this.plugin.settings.folderPath = normalizeSpaces(value) || 'data';
          await this.plugin.saveSettings();
        });
      });

    new obsidian.Setting(containerEl)
      .setName('Duplicate window (seconds)')
      .setDesc('Prevents accidental double taps from creating duplicate entries too quickly.')
      .addText(text => {
        text.setPlaceholder('12');
        text.setValue(String(this.plugin.settings.duplicateWindowSeconds ?? 12));
        text.onChange(async value => {
          const n = Math.max(0, Number(value) || 0);
          this.plugin.settings.duplicateWindowSeconds = n;
          await this.plugin.saveSettings();
        });
      });

    new obsidian.Setting(containerEl)
      .setName('Relief event label')
      .setDesc('Customize the special relief event label shown in the UI.')
      .addText(text => {
        text.setPlaceholder('Relief event');
        text.setValue(this.plugin.getReliefEventLabel());
        text.onChange(async value => {
          this.plugin.settings.customLabels = this.plugin.settings.customLabels || {};
          this.plugin.settings.customLabels.reliefEvent = normalizeSpaces(value) || 'Relief event';
          await this.plugin.saveSettings();
          this.plugin.refreshModal();
        });
      });

    new obsidian.Setting(containerEl)
      .setName('Open tracker')
      .setDesc('Open the main Tracking Symptoms interface.')
      .addButton(btn => {
        btn.setButtonText('Open');
        btn.onClick(() => this.plugin.openMainModal(SECTIONS.QUICK));
      });

    new obsidian.Setting(containerEl)
      .setName('Manage relief presets')
      .setDesc('Edit the quick preset buttons used for relief logging.')
      .addButton(btn => {
        btn.setButtonText('Manage');
        btn.onClick(() => new ReliefPresetManagerModal(this.app, this.plugin).open());
      });

    new obsidian.Setting(containerEl)
      .setName('Export JSON')
      .setDesc('Save a JSON export in your configured data folder.')
      .addButton(btn => {
        btn.setButtonText('Export');
        btn.onClick(async () => await this.plugin.exportData('json'));
      });

    new obsidian.Setting(containerEl)
      .setName('Export CSV')
      .setDesc('Save a CSV export in your configured data folder.')
      .addButton(btn => {
        btn.setButtonText('Export');
        btn.onClick(async () => await this.plugin.exportData('csv'));
      });
  }
}

/* ============================================================
   MAIN PLUGIN
============================================================ */

module.exports = class TrackingSymptomsPlugin extends obsidian.Plugin {
  async onload() {
    this.currentModal = null;
    this.templates = [];
    this.entries = [];
    this.settings = Object.assign({}, DEFAULT_SETTINGS);
    this.persistence = new TrackingSymptomsPersistenceService(this);

    await this.loadSettings();

    const db = await this.persistence.loadDatabase();
    this.templates = ensureArray(db.templates).map(normalizeTemplate);
    this.entries = ensureArray(db.entries).map(normalizeEntry).sort(byNewest);

    this.injectStyles();

    this.addRibbonIcon('activity', 'Tracking Symptoms', () => {
      this.openMainModal(SECTIONS.QUICK);
    });

    this.addCommand({
      id: 'open-tracking-symptoms',
      name: 'Open Tracking Symptoms',
      callback: () => this.openMainModal(SECTIONS.QUICK),
    });

    this.addCommand({
      id: 'open-tracking-symptoms-review',
      name: 'Open Tracking Symptoms review',
      callback: () => this.openMainModal(SECTIONS.REVIEW),
    });

    this.addCommand({
      id: 'log-relief-event',
      name: 'Log relief event',
      callback: () => this.openQuickReliefEvent('command'),
    });

    this.addSettingTab(new TrackingSymptomsSettingTab(this.app, this));

    new obsidian.Notice('Tracking Symptoms loaded');
  }

  onunload() {
    if (this.styleEl?.isConnected) this.styleEl.remove();
    this.styleEl = null;

    if (this.currentModal) {
      try { this.currentModal.close(); } catch (_) {}
      this.currentModal = null;
    }
  }

  injectStyles() {
    if (this.styleEl?.isConnected) this.styleEl.remove();
    this.styleEl = document.createElement('style');
    this.styleEl.setText(PLUGIN_STYLES);
    document.head.appendChild(this.styleEl);
  }

  async loadSettings() {
    const raw = await this.loadData();
    const merged = Object.assign({}, DEFAULT_SETTINGS, raw || {});
    merged.favoriteItemIds = ensureArray(merged.favoriteItemIds).map(v => safeString(v)).filter(Boolean);
    merged.customLabels = Object.assign({}, DEFAULT_SETTINGS.customLabels, raw?.customLabels || {});
    merged.reliefEventPresets = normalizeReliefPresets(raw?.reliefEventPresets, true);
    merged.folderPath = normalizeSpaces(merged.folderPath) || 'data';
    merged.duplicateWindowSeconds = Math.max(0, Number(merged.duplicateWindowSeconds) || 12);
    this.settings = merged;
  }

  async saveSettings() {
    this.settings.reliefEventPresets = normalizeReliefPresets(this.settings.reliefEventPresets, true);
    await this.saveData(this.settings);
  }

  async persistDatabase() {
    await this.persistence.saveDatabase({
      templates: this.templates,
      entries: this.entries,
    });
  }

  refreshModal() {
    if (this.currentModal && typeof this.currentModal.render === 'function') {
      this.currentModal.render();
    }
  }

  openMainModal(initialSection = SECTIONS.QUICK) {
    if (this.currentModal) {
      try { this.currentModal.close(); } catch (_) {}
    }
    const modal = new TrackingSymptomsModal(this.app, this, initialSection);
    modal.open();
    this.currentModal = modal;
  }

  /* ---- labels / colors ---- */

  getCategoryLabel(category) {
    return CATEGORY_META[category]?.label || 'Unknown';
  }

  getCategoryColor(category) {
    return CATEGORY_META[category]?.color || '#64748b';
  }

  getModeDisplayLabel(mode) {
    if (mode === 'intensity') return 'intensity';
    if (mode === 'instant') return 'instant';
    if (mode === 'outcome') return 'outcome';
    return 'instant';
  }

  getReliefEventLabel() {
    return normalizeSpaces(this.settings?.customLabels?.reliefEvent) || 'Relief event';
  }

  getReliefEventTemplate() {
    return {
      id: RELIEF_EVENT_ID,
      label: this.getReliefEventLabel(),
      category: 'digestive_sensation',
      mode: 'outcome',
      valence: 'neutral',
      tags: ['relief'],
      intensityOptions: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  }

  getItemDisplayLabel(item) {
    if (!item) return 'Untitled';
    if (item.id === RELIEF_EVENT_ID) return this.getReliefEventLabel();
    return item.label || 'Untitled';
  }

  /* ---- templates ---- */

  getTemplatesByCategory(category) {
    return this.templates
      .filter(item => item.category === category)
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  getTemplateById(id) {
    return this.templates.find(t => t.id === id) || null;
  }

  async saveTemplate(raw) {
    const next = normalizeTemplate(raw);
    const existingIndex = this.templates.findIndex(t => t.id === next.id);

    if (existingIndex >= 0) {
      next.createdAt = this.templates[existingIndex].createdAt || next.createdAt;
      next.updatedAt = nowIso();
      this.templates.splice(existingIndex, 1, next);
    } else {
      this.templates.push(next);
    }

    this.templates.sort((a, b) => {
      const categoryCmp = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
      if (categoryCmp !== 0) return categoryCmp;
      return a.label.localeCompare(b.label);
    });

    await this.persistDatabase();
    this.refreshModal();
    new obsidian.Notice(`Saved item: ${next.label}`);
    return next;
  }

  async deleteTemplate(id) {
    const existing = this.getTemplateById(id);
    if (!existing) return;

    this.templates = this.templates.filter(t => t.id !== id);
    this.settings.favoriteItemIds = this.settings.favoriteItemIds.filter(v => v !== id);

    await this.saveSettings();
    await this.persistDatabase();
    this.refreshModal();
    new obsidian.Notice(`Deleted item: ${existing.label}`);
  }

  /* ---- favorites / recent ---- */

  isFavorite(itemId) {
    return ensureArray(this.settings.favoriteItemIds).includes(itemId);
  }

  async toggleFavorite(itemId) {
    const set = new Set(ensureArray(this.settings.favoriteItemIds));
    if (set.has(itemId)) set.delete(itemId);
    else set.add(itemId);
    this.settings.favoriteItemIds = [...set];
    await this.saveSettings();
    this.refreshModal();
  }

  getFavoriteTemplates() {
    const ids = ensureArray(this.settings.favoriteItemIds);
    const idSet = new Set(ids);
    return this.templates.filter(t => idSet.has(t.id));
  }

  getTemplateLastUsedAt(itemId) {
    const match = this.entries.find(entry => entry.itemId === itemId);
    return match ? parseDate(match.datetime).getTime() : 0;
  }

  getGroupedFavoriteTemplates() {
    const favorites = this.getFavoriteTemplates().slice();

    const groups = CATEGORY_ORDER.map(category => {
      const items = favorites
        .filter(item => item.category === category)
        .sort((a, b) => {
          const lastDiff = this.getTemplateLastUsedAt(b.id) - this.getTemplateLastUsedAt(a.id);
          if (lastDiff !== 0) return lastDiff;
          return a.label.localeCompare(b.label);
        });

      return { category, items };
    }).filter(group => group.items.length);

    return groups;
  }

  getRecentTemplates(limit = 8) {
    const seen = new Set();
    const out = [];

    for (const entry of this.entries) {
      if (!entry.itemId || entry.itemId === RELIEF_EVENT_ID) continue;
      if (seen.has(entry.itemId)) continue;

      const template = this.getTemplateById(entry.itemId);
      if (!template) continue;

      seen.add(entry.itemId);
      out.push(template);

      if (out.length >= limit) break;
    }

    return out;
  }

  /* ---- relief presets ---- */

  getReliefEventPresets() {
    return normalizeReliefPresets(this.settings?.reliefEventPresets, true);
  }

  async upsertReliefEventPreset(rawPreset) {
    const preset = normalizeReliefPreset(rawPreset);
    const presets = this.getReliefEventPresets();
    const idx = presets.findIndex(p => p.id === preset.id);

    if (idx >= 0) presets.splice(idx, 1, preset);
    else presets.push(preset);

    this.settings.reliefEventPresets = presets;
    await this.saveSettings();
    this.refreshModal();
    new obsidian.Notice(`Saved preset: ${preset.label}`);
    return preset;
  }

  async deleteReliefEventPreset(presetId) {
    const presets = this.getReliefEventPresets();
    const target = presets.find(p => p.id === presetId);
    if (!target) return;

    this.settings.reliefEventPresets = presets.filter(p => p.id !== presetId);
    await this.saveSettings();
    this.refreshModal();
    new obsidian.Notice(`Deleted preset: ${target.label}`);
  }

  async moveReliefEventPreset(presetId, direction) {
    const presets = this.getReliefEventPresets().slice();
    const idx = presets.findIndex(p => p.id === presetId);
    if (idx < 0) return;

    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= presets.length) return;

    const [preset] = presets.splice(idx, 1);
    presets.splice(nextIdx, 0, preset);

    this.settings.reliefEventPresets = presets;
    await this.saveSettings();
    this.refreshModal();
  }

  async restoreDefaultReliefEventPresets() {
    this.settings.reliefEventPresets = getDefaultReliefEventPresets();
    await this.saveSettings();
    this.refreshModal();
    new obsidian.Notice('Restored default relief presets');
  }

  /* ---- logging ---- */

  async openQuickReliefEvent(source = 'manual') {
    const item = this.getReliefEventTemplate();
    new OutcomeModal(this.app, this, item, source).open();
  }

  async openItemFlow(item, options = {}) {
    if (!item) return;
    const source = normalizeSpaces(options.source) || 'manual';

    if (item.id === RELIEF_EVENT_ID || item.mode === 'outcome') {
      new OutcomeModal(this.app, this, item, source).open();
      return;
    }

    if (item.mode === 'intensity') {
      const intensityOptions = normalizeIntensityOptions(
        item.intensityOptions,
        defaultIntensityOptions(item.category)
      );

      new QuickChoiceModal(
        this.app,
        this.getItemDisplayLabel(item),
        intensityOptions,
        async choice => {
          await this.logItem(item, {
            source,
            intensity: choice,
          });
        }
      ).open();
      return;
    }

    await this.logItem(item, { source });
  }

  getDuplicateWindowMs() {
    return Math.max(0, Number(this.settings?.duplicateWindowSeconds) || 0) * 1000;
  }

  findRecentDuplicate(candidate) {
    const windowMs = this.getDuplicateWindowMs();
    if (!windowMs) return null;

    const targetTime = parseDate(candidate.datetime).getTime();

    return this.entries.find(entry => {
      const delta = Math.abs(parseDate(entry.datetime).getTime() - targetTime);
      if (delta > windowMs) return false;

      const sameItemId = safeString(entry.itemId) === safeString(candidate.itemId);
      const sameLabel = safeTrim(entry.itemLabel).toLowerCase() === safeTrim(candidate.itemLabel).toLowerCase();
      const sameCategory = entry.category === candidate.category;
      const sameIntensity = safeTrim(entry.intensity) === safeTrim(candidate.intensity);
      const sameNote = safeTrim(entry.note) === safeTrim(candidate.note);
      const sameSource = safeTrim(entry.source) === safeTrim(candidate.source);
      const sameDetails = JSON.stringify(normalizeReliefDetails(entry.details || {})) === JSON.stringify(normalizeReliefDetails(candidate.details || {}));

      return sameItemId && sameLabel && sameCategory && sameIntensity && sameNote && sameSource && sameDetails;
    }) || null;
  }

  async logItem(item, options = {}) {
    const resolvedItem = item?.id === RELIEF_EVENT_ID
      ? this.getReliefEventTemplate()
      : item;

    if (!resolvedItem) return null;

    const entry = normalizeEntry({
      datetime: options.datetime || nowIso(),
      category: resolvedItem.category,
      itemId: resolvedItem.id,
      itemLabel: this.getItemDisplayLabel(resolvedItem),
      valence: resolvedItem.valence || 'neutral',
      intensity: options.intensity || '',
      source: options.source || 'manual',
      note: options.note || '',
      tags: resolvedItem.tags || [],
      details: isReliefEntry({ itemId: resolvedItem.id, details: options.details || {} })
        ? normalizeReliefDetails(options.details || {})
        : (options.details || {}),
    });

    const duplicate = this.findRecentDuplicate(entry);
    if (duplicate) {
      new obsidian.Notice('Skipped duplicate entry');
      return duplicate;
    }

    this.entries.unshift(entry);
    this.entries.sort(byNewest);

    await this.persistDatabase();
    this.refreshModal();
    new obsidian.Notice(`Logged: ${entry.itemLabel}`);
    return entry;
  }

  async updateEntry(entryId, patch = {}) {
    const idx = this.entries.findIndex(entry => entry.id === entryId);
    if (idx < 0) return null;

    const current = this.entries[idx];
    const merged = normalizeEntry({
      ...current,
      ...patch,
      id: current.id,
      datetime: current.datetime,
      itemId: patch.itemId ?? current.itemId,
      details: patch.details ?? current.details,
    });

    this.entries.splice(idx, 1, merged);
    this.entries.sort(byNewest);

    await this.persistDatabase();
    this.refreshModal();
    new obsidian.Notice('Entry updated');
    return merged;
  }

  async deleteEntry(entryId) {
    const existing = this.entries.find(entry => entry.id === entryId);
    if (!existing) return;

    this.entries = this.entries.filter(entry => entry.id !== entryId);
    await this.persistDatabase();
    this.refreshModal();
    new obsidian.Notice(`Deleted: ${existing.itemLabel}`);
  }

  /* ---- exports ---- */

  async exportData(format = 'json') {
    try {
      const path = await this.persistence.exportDatabase(format);
      new obsidian.Notice(`Exported ${format.toUpperCase()}: ${path}`);
      return path;
    } catch (err) {
      new obsidian.Notice(`Export failed: ${err.message}`);
      return null;
};
    }
  }
