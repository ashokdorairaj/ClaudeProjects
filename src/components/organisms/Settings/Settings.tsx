import React, { useState } from 'react';
import { Icon } from '../../atoms/Icon';
import './Settings.css';

/* ──────────────────────────────────────────────────────
   SettingsItem — a single row in the left-hand list
   ────────────────────────────────────────────────────── */
export interface SettingsItemDef {
  key: string;
  label: string;
  /** SAP icon name, defaults to 'action-settings' */
  icon?: string;
  /** Content to render in the right panel when selected */
  content?: React.ReactNode;
  /** Optional sub-tabs shown in the content header */
  tabs?: { key: string; label: string }[];
}

/* ──────────────────────────────────────────────────────
   Settings
   ────────────────────────────────────────────────────── */
export interface SettingsProps {
  /** Title shown in the left-panel header */
  title?: string;
  /** List of setting sections */
  items: SettingsItemDef[];
  /** Item pinned at the bottom of the list (e.g. "About") */
  footerItem?: SettingsItemDef;
  /** Called when the Close button is clicked */
  onClose?: () => void;
  /** Controlled selected key */
  selectedKey?: string;
  /** Callback when selection changes */
  onSelectionChange?: (key: string) => void;
  formFactor?: 'cozy' | 'compact';
  className?: string;
}

export const Settings: React.FC<SettingsProps> = ({
  title = 'Settings',
  items,
  footerItem,
  onClose,
  selectedKey: controlledKey,
  onSelectionChange,
  formFactor = 'cozy',
  className = '',
}) => {
  const [internalKey, setInternalKey] = useState<string>(items[0]?.key ?? '');
  const [activeTabKey, setActiveTabKey] = useState<string>('');

  const selectedKey = controlledKey !== undefined ? controlledKey : internalKey;

  const handleSelect = (key: string) => {
    if (controlledKey === undefined) setInternalKey(key);
    onSelectionChange?.(key);
    // Reset tab selection when item changes
    setActiveTabKey('');
  };

  const allItems = [...items, ...(footerItem ? [footerItem] : [])];
  const selectedItem =
    allItems.find((i) => i.key === selectedKey) ?? items[0];
  const tabs = selectedItem?.tabs ?? [];
  const activeTab =
    tabs.find((t) => t.key === activeTabKey) ?? tabs[0];

  const rowHeight = formFactor === 'compact' ? 'fd-settings__item--compact' : '';

  return (
    <div
      className={[
        'fd-settings',
        formFactor === 'compact' ? 'fd-settings--compact' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="dialog"
      aria-label={title}
    >
      {/* ── Content container (list + content) ── */}
      <div className="fd-settings__body">
        {/* Left panel — list */}
        <div className="fd-settings__list-area">
          {/* List header */}
          <div className="fd-settings__list-header">
            <span className="fd-settings__list-title">{title}</span>
          </div>

          {/* Scrollable list */}
          <div className="fd-settings__list" role="listbox" aria-label={title}>
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                className={[
                  'fd-settings__item',
                  rowHeight,
                  item.key === selectedKey ? 'fd-settings__item--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                role="option"
                aria-selected={item.key === selectedKey}
                onClick={() => handleSelect(item.key)}
              >
                <span className="fd-settings__item-icon">
                  <Icon name={item.icon ?? 'action-settings'} size={formFactor === 'compact' ? 16 : 18} />
                </span>
                <span className="fd-settings__item-label">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Fixed footer item */}
          {footerItem && (
            <div className="fd-settings__list-footer">
              <button
                type="button"
                className={[
                  'fd-settings__item',
                  rowHeight,
                  footerItem.key === selectedKey ? 'fd-settings__item--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                role="option"
                aria-selected={footerItem.key === selectedKey}
                onClick={() => handleSelect(footerItem.key)}
              >
                <span className="fd-settings__item-icon">
                  <Icon name={footerItem.icon ?? 'action-settings'} size={formFactor === 'compact' ? 16 : 18} />
                </span>
                <span className="fd-settings__item-label">{footerItem.label}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right panel — content */}
        <div className="fd-settings__content-area">
          {/* Content header + tabs */}
          <div className="fd-settings__content-header">
            <div className="fd-settings__content-title-bar">
              <span className="fd-settings__content-title">
                {selectedItem?.label ?? ''}
              </span>
            </div>

            {/* Icon tab bar */}
            {tabs.length > 0 && (
              <div className="fd-settings__tab-bar" role="tablist">
                {tabs.map((tab) => {
                  const isActive = tab.key === (activeTab?.key ?? tabs[0]?.key);
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      className={[
                        'fd-settings__tab',
                        isActive ? 'fd-settings__tab--active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTabKey(tab.key)}
                    >
                      <span className="fd-settings__tab-text">{tab.label}</span>
                      {isActive && <span className="fd-settings__tab-bar-indicator" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Slot content */}
          <div className="fd-settings__content" role="tabpanel">
            {selectedItem?.content ?? null}
          </div>
        </div>
      </div>

      {/* ── Footer bar ── */}
      <div className="fd-settings__footer">
        <button
          type="button"
          className="fd-settings__close-btn"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Settings;
