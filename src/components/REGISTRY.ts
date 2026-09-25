/**
 * FioriWeb Component Registry
 *
 * Single source of truth for every component in this library.
 * AI agents: read this file first to discover available components,
 * their categories, doc paths, related components, and composition rules.
 *
 * Structure:
 *   REGISTRY[ComponentName] = ComponentMeta
 *
 * ComponentMeta fields:
 *   - category:  'atom' | 'molecule' | 'organism'
 *   - doc:       Path to the human-readable markdown doc
 *   - src:       Path to the source TSX file
 *   - family:    Other components commonly used with this one
 *   - replaces:  Components this should NOT be confused with (pick this, not that)
 */

export interface ComponentMeta {
  category: 'atom' | 'molecule' | 'organism';
  doc: string;
  src: string;
  /** Related components that are commonly composed with this one */
  family?: string[];
  /** Components this should NOT be confused with — use this one instead of those for the described scenario */
  replaces?: { component: string; when: string }[];
}

export const REGISTRY: Record<string, ComponentMeta> = {

  // ─── Atoms ───────────────────────────────────────────────────────────────

  Button: {
    category: 'atom',
    doc: 'src/pages/docs/buttons.md',
    src: 'src/components/atoms/Button/Button.tsx',
    family: ['Link', 'Toolbar', 'Dialog'],
    replaces: [
      { component: 'Link', when: 'triggering an action (not navigating)' },
    ],
  },

  Input: {
    category: 'atom',
    doc: 'src/pages/docs/input.md',
    src: 'src/components/atoms/Input/Input.tsx',
    family: ['Label', 'FormItem', 'Select', 'TextArea'],
    replaces: [
      { component: 'Select', when: 'free-text entry or search-as-you-type' },
    ],
  },

  Label: {
    category: 'atom',
    doc: 'src/pages/docs/label.md',
    src: 'src/components/atoms/Label/Label.tsx',
    family: ['Input', 'CheckBox', 'Switch', 'FormItem'],
    replaces: [
      { component: 'Text', when: 'labelling a form control (use Label + htmlFor, not Text)' },
    ],
  },

  TextArea: {
    category: 'atom',
    doc: 'src/pages/docs/textarea.md',
    src: 'src/components/atoms/TextArea/TextArea.tsx',
    family: ['Label', 'FormItem'],
    replaces: [
      { component: 'Input', when: 'multi-line text entry is needed' },
    ],
  },

  CheckBox: {
    category: 'atom',
    doc: 'src/pages/docs/checkbox.md',
    src: 'src/components/atoms/CheckBox/CheckBox.tsx',
    family: ['Switch', 'RadioButton', 'FormItem'],
    replaces: [
      { component: 'Switch', when: 'the option requires a submit step or is not immediate-effect' },
    ],
  },

  Switch: {
    category: 'atom',
    doc: 'src/pages/docs/checkbox.md',
    src: 'src/components/atoms/Switch/Switch.tsx',
    family: ['CheckBox', 'FormItem'],
    replaces: [
      { component: 'CheckBox', when: 'the toggle has an immediate side-effect (e.g. dark mode, notifications)' },
    ],
  },

  RadioButton: {
    category: 'atom',
    doc: 'src/pages/docs/radio-button.md',
    src: 'src/components/atoms/RadioButton/RadioButton.tsx',
    family: ['CheckBox', 'Select', 'FormItem'],
  },

  Tag: {
    category: 'atom',
    doc: 'src/pages/docs/tag.md',
    src: 'src/components/atoms/Tag/Tag.tsx',
    family: ['Avatar', 'List', 'Table'],
  },

  Avatar: {
    category: 'atom',
    doc: 'src/pages/docs/avatar.md',
    src: 'src/components/atoms/Avatar/Avatar.tsx',
    family: ['ShellBar', 'Card', 'NotificationListItem'],
  },

  Icon: {
    category: 'atom',
    doc: 'src/pages/docs/icon.md',
    src: 'src/components/atoms/Icon/Icon.tsx',
    family: ['Button', 'Link', 'Tag'],
  },

  Link: {
    category: 'atom',
    doc: 'src/pages/docs/link.md',
    src: 'src/components/atoms/Link/Link.tsx',
    family: ['Button', 'Breadcrumb'],
    replaces: [
      { component: 'Button', when: 'navigating to another page or URL (not an action)' },
    ],
  },

  Breadcrumb: {
    category: 'atom',
    doc: 'src/pages/docs/breadcrumb.md',
    src: 'src/components/atoms/Breadcrumb/Breadcrumb.tsx',
    family: ['Link', 'ToolHeader'],
  },

  Text: {
    category: 'atom',
    doc: 'src/pages/docs/text.md',
    src: 'src/components/atoms/Text/Text.tsx',
    family: ['Label'],
  },

  MessageStrip: {
    category: 'atom',
    doc: 'src/pages/docs/message-strip.md',
    src: 'src/components/atoms/MessageStrip/MessageStrip.tsx',
    family: ['Dialog', 'Form'],
    replaces: [
      { component: 'Toast', when: 'the message must persist until the user dismisses it' },
      { component: 'Dialog', when: 'the message is contextual and does not block the workflow' },
    ],
  },

  Toast: {
    category: 'atom',
    doc: 'src/pages/docs/toast.md',
    src: 'src/components/atoms/Toast/Toast.tsx',
    family: ['Button'],
    replaces: [
      { component: 'MessageStrip', when: 'the notification is a brief success confirmation that auto-dismisses' },
      { component: 'Dialog', when: 'no user action is required in response to the message' },
    ],
  },

  BusyIndicator: {
    category: 'atom',
    doc: 'src/pages/docs/busy-indicator.md',
    src: 'src/components/atoms/BusyIndicator/BusyIndicator.tsx',
    family: ['ProgressIndicator'],
    replaces: [
      { component: 'ProgressIndicator', when: 'duration is unknown and progress cannot be measured' },
    ],
  },

  ProgressIndicator: {
    category: 'atom',
    doc: 'src/pages/docs/progress-indicator.md',
    src: 'src/components/atoms/ProgressIndicator/ProgressIndicator.tsx',
    family: ['BusyIndicator'],
    replaces: [
      { component: 'BusyIndicator', when: 'completion percentage is known' },
    ],
  },

  Slider: {
    category: 'atom',
    doc: 'src/pages/docs/slider.md',
    src: 'src/components/atoms/Slider/Slider.tsx',
    family: ['StepInput', 'FormItem'],
    replaces: [
      { component: 'StepInput', when: 'a continuous range value is more natural than a stepped numeric input' },
    ],
  },

  StepInput: {
    category: 'atom',
    doc: 'src/pages/docs/step-input.md',
    src: 'src/components/atoms/StepInput/StepInput.tsx',
    family: ['Input', 'Slider', 'FormItem'],
  },

  RatingIndicator: {
    category: 'atom',
    doc: 'src/pages/docs/rating-indicator.md',
    src: 'src/components/atoms/RatingIndicator/RatingIndicator.tsx',
    family: ['FormItem'],
  },

  // ─── Molecules ───────────────────────────────────────────────────────────

  Dialog: {
    category: 'molecule',
    doc: 'src/pages/docs/dialog.md',
    src: 'src/components/molecules/Dialog/Dialog.tsx',
    family: ['Button', 'Form', 'MessageStrip'],
    replaces: [
      { component: 'Popover', when: 'the user must complete or acknowledge the task before continuing' },
      { component: 'Toast', when: 'user input or confirmation is required' },
    ],
  },

  Form: {
    category: 'molecule',
    doc: 'src/pages/docs/form.md',
    src: 'src/components/molecules/Form/Form.tsx',
    family: ['FormColumn', 'FormGroup', 'FormItem', 'Input', 'Select', 'CheckBox', 'Dialog', 'Panel'],
  },

  FormColumn: {
    category: 'molecule',
    doc: 'src/pages/docs/form.md',
    src: 'src/components/molecules/Form/Form.tsx',
    family: ['Form', 'FormGroup'],
  },

  FormGroup: {
    category: 'molecule',
    doc: 'src/pages/docs/form.md',
    src: 'src/components/molecules/Form/Form.tsx',
    family: ['FormColumn', 'FormItem'],
  },

  FormItem: {
    category: 'molecule',
    doc: 'src/pages/docs/form.md',
    src: 'src/components/molecules/Form/Form.tsx',
    family: ['FormGroup', 'Input', 'Select', 'CheckBox', 'Switch', 'TextArea'],
  },

  Card: {
    category: 'molecule',
    doc: 'src/pages/docs/card.md',
    src: 'src/components/molecules/Card/Card.tsx',
    family: ['Grid', 'Avatar', 'Button', 'Tag'],
    replaces: [
      { component: 'Panel', when: 'content stands alone on a dashboard or overview page' },
    ],
  },

  Panel: {
    category: 'molecule',
    doc: 'src/pages/docs/panel.md',
    src: 'src/components/molecules/Panel/Panel.tsx',
    family: ['Form', 'Grid'],
    replaces: [
      { component: 'Card', when: 'collapsible form sections within a page are needed' },
    ],
  },

  Select: {
    category: 'molecule',
    doc: 'src/pages/docs/select.md',
    src: 'src/components/molecules/Select/Select.tsx',
    family: ['Label', 'FormItem', 'Input'],
    replaces: [
      { component: 'Input', when: 'the user must pick from a bounded set of predefined options' },
    ],
  },

  Toolbar: {
    category: 'molecule',
    doc: 'src/pages/docs/toolbar.md',
    src: 'src/components/molecules/Toolbar/Toolbar.tsx',
    family: ['ToolbarSpacer', 'ToolbarSeparator', 'Button', 'Select', 'ToolHeader'],
  },

  ToolbarSpacer: {
    category: 'molecule',
    doc: 'src/pages/docs/toolbar.md',
    src: 'src/components/molecules/Toolbar/Toolbar.tsx',
    family: ['Toolbar'],
  },

  ToolbarSeparator: {
    category: 'molecule',
    doc: 'src/pages/docs/toolbar.md',
    src: 'src/components/molecules/Toolbar/Toolbar.tsx',
    family: ['Toolbar'],
  },

  Popover: {
    category: 'molecule',
    doc: 'src/pages/docs/popover.md',
    src: 'src/components/molecules/Popover/Popover.tsx',
    family: ['Button', 'Dialog', 'Menu'],
    replaces: [
      { component: 'Dialog', when: 'the overlay is non-blocking contextual information or a quick-action panel' },
    ],
  },

  NotificationListItem: {
    category: 'molecule',
    doc: 'src/pages/docs/notifications.md',
    src: 'src/components/molecules/Notifications/Notifications.tsx',
    family: ['NotificationGroup', 'NotificationPanel', 'ShellBar'],
  },

  NotificationGroup: {
    category: 'molecule',
    doc: 'src/pages/docs/notifications.md',
    src: 'src/components/molecules/Notifications/Notifications.tsx',
    family: ['NotificationListItem', 'NotificationPanel'],
  },

  NotificationPanel: {
    category: 'molecule',
    doc: 'src/pages/docs/notifications.md',
    src: 'src/components/molecules/Notifications/Notifications.tsx',
    family: ['NotificationGroup', 'NotificationListItem', 'ShellBar'],
  },

  List: {
    category: 'molecule',
    doc: 'src/pages/docs/list.md',
    src: 'src/components/molecules/List/List.tsx',
    family: ['ListItem', 'ListGroupHeader', 'Table'],
    replaces: [
      { component: 'Table', when: 'items are non-tabular and do not require column headers' },
    ],
  },

  ListItem: {
    category: 'molecule',
    doc: 'src/pages/docs/list.md',
    src: 'src/components/molecules/List/List.tsx',
    family: ['List', 'ListGroupHeader'],
  },

  ListGroupHeader: {
    category: 'molecule',
    doc: 'src/pages/docs/list.md',
    src: 'src/components/molecules/List/List.tsx',
    family: ['List', 'ListItem'],
  },

  Menu: {
    category: 'molecule',
    doc: 'src/pages/docs/menu.md',
    src: 'src/components/molecules/Menu/Menu.tsx',
    family: ['Popover', 'Button', 'Toolbar'],
  },

  // ─── Organisms ───────────────────────────────────────────────────────────

  ShellBar: {
    category: 'organism',
    doc: 'src/pages/docs/shellbar.md',
    src: 'src/components/organisms/ShellBar/ShellBar.tsx',
    family: ['SideNavigation', 'Avatar', 'NotificationPanel'],
  },

  SideNavigation: {
    category: 'organism',
    doc: 'src/pages/docs/side-navigation.md',
    src: 'src/components/organisms/SideNavigation/SideNavigation.tsx',
    family: ['ShellBar', 'Grid'],
  },

  Table: {
    category: 'organism',
    doc: 'src/pages/docs/table.md',
    src: 'src/components/organisms/Table/Table.tsx',
    family: ['Toolbar', 'Dialog', 'MessageStrip'],
    replaces: [
      { component: 'List', when: 'data has columns and headers or requires multi-column sorting/selection' },
    ],
  },

  TabBar: {
    category: 'organism',
    doc: 'src/pages/docs/tabbar.md',
    src: 'src/components/organisms/TabBar/TabBar.tsx',
    family: ['ToolHeader', 'Panel'],
  },

  Grid: {
    category: 'organism',
    doc: 'src/pages/docs/grid.md',
    src: 'src/components/organisms/Grid/Grid.tsx',
    family: ['GridCell', 'Card', 'Panel'],
  },

  GridCell: {
    category: 'organism',
    doc: 'src/pages/docs/grid.md',
    src: 'src/components/organisms/Grid/Grid.tsx',
    family: ['Grid'],
  },

  ToolHeader: {
    category: 'organism',
    doc: 'src/pages/docs/tool-header.md',
    src: 'src/components/organisms/ToolHeader/ToolHeader.tsx',
    family: ['ShellBar', 'Toolbar', 'Breadcrumb', 'TabBar'],
  },

};

/**
 * Look up one or more components by name.
 * @example
 * lookup('Button')          // → ComponentMeta
 * lookup('Button', 'Input') // → { Button: ComponentMeta, Input: ComponentMeta }
 */
export function lookup(name: string): ComponentMeta | undefined;
export function lookup(...names: string[]): Record<string, ComponentMeta>;
export function lookup(...names: string[]): ComponentMeta | undefined | Record<string, ComponentMeta> {
  if (names.length === 1) return REGISTRY[names[0]];
  return Object.fromEntries(names.map(n => [n, REGISTRY[n]]).filter(([, v]) => v !== undefined));
}

/** All components in a given category */
export function byCategory(category: ComponentMeta['category']): Record<string, ComponentMeta> {
  return Object.fromEntries(
    Object.entries(REGISTRY).filter(([, meta]) => meta.category === category)
  );
}
