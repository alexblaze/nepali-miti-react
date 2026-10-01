# nepali-miti-react

[![npm version](https://img.shields.io/npm/v/nepali-miti-react.svg)](https://www.npmjs.com/package/nepali-miti-react)
[![CI](https://github.com/alexblaze/nepali-miti-react/actions/workflows/ci.yml/badge.svg)](https://github.com/alexblaze/nepali-miti-react/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/nepali-miti-react.svg)](./LICENSE)

An accessible **Bikram Sambat (Nepali) date picker and calendar for React 18 and 19**, built on
[nepali-miti](https://github.com/alexblaze/nepali-miti).

![NepaliDatePicker with the Asoj 2083 calendar open, Nepali digits and AD day numbers](https://raw.githubusercontent.com/alexblaze/nepali-miti-react/main/docs/screenshot.png)

- **Correct dates.** It uses nepali-miti's checked calendar data, which has Asoj 2083 as 31 days. Pickers built on
  `bikram-sambat-js` are a day off from Kartik 2083 (18 October 2026).
- **Keyboard and screen-reader friendly.** It follows the WAI-ARIA date picker pattern: a labelled dialog, a roving
  focus grid, arrow keys, Home/End, PageUp/PageDown, and Escape to close. Each day is announced in full with its AD
  date. axe tests run in CI.
- **Nepali or English**, with Devanagari digits, Saturday highlighted as the weekend, and small AD day numbers you can
  turn off.
- **Type or pick.** Users can type `२०८३-०६-१५` or `2083-06-15`, and invalid dates are flagged with `aria-invalid`.
- **Works in forms.** It supports controlled and uncontrolled use, and `name` adds a hidden `YYYY-MM-DD` field.
- **Small and themeable.** It has no dependencies besides React and nepali-miti, one CSS file with variables, and
  automatic dark mode. It is marked `"use client"` for the Next.js App Router.

## Installation

```sh
npm install nepali-miti-react nepali-miti
```

`react` (≥ 18), `react-dom` and `nepali-miti` are peer dependencies. Your app's `nepali-miti` is the one the picker
uses, so `registerYear()` calendar updates apply to both.

## Usage

```tsx
import { useState } from 'react';
import { NepaliDatePicker, type BsDate } from 'nepali-miti-react';
import 'nepali-miti-react/styles.css';

export function BirthDateField() {
  const [date, setDate] = useState<BsDate | null>(null);
  return (
    <label>
      जन्म मिति
      <NepaliDatePicker value={date} onChange={setDate} />
    </label>
  );
}
```

`BsDate` is a plain `{ year, month, day }` object (month 1 = Baisakh). Use nepali-miti's helpers to convert it:

```ts
import { toAd, format } from 'nepali-miti';

toAd(date); // { year: 2026, month: 10, day: 1 }
format(date, 'D MMMM YYYY', { locale: 'ne' }); // "१५ असोज २०८३"
```

### Inline calendar

```tsx
import { NepaliCalendar } from 'nepali-miti-react';

<NepaliCalendar value={date} onChange={setDate} locale="en" />;
```

### Restricting dates

```tsx
<NepaliDatePicker
  value={date}
  onChange={setDate}
  minDate={{ year: 2083, month: 1, day: 1 }}
  maxDate={{ year: 2083, month: 12, day: 30 }}
  isDateDisabled={(d) => getWeekday(d) === 6} // no Saturdays (getWeekday from nepali-miti)
/>
```

### Plain HTML forms

```tsx
<form action="/register" method="post">
  <NepaliDatePicker name="dob" defaultValue={null} required />
  <button>Submit</button>
</form>
// Submits dob=2083-06-15 (ASCII digits) or an empty string.
```

## API

### `<NepaliDatePicker>`

| Prop                                        | Type                                              | Default        | Description                                                                                                                           |
| ------------------------------------------- | ------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                                     | `BsDate \| null`                                  | —              | Selected date (controlled).                                                                                                           |
| `defaultValue`                              | `BsDate \| null`                                  | `null`         | Initial date when uncontrolled.                                                                                                       |
| `onChange`                                  | `(date: BsDate \| null) => void`                  | —              | Called when the day changes. Gets `null` when cleared.                                                                                |
| `format`                                    | `string`                                          | `"YYYY-MM-DD"` | Display and typing pattern ([tokens](https://github.com/alexblaze/nepali-miti#formatting-and-parsing)). Also the default placeholder. |
| `locale`                                    | `"ne" \| "en"`                                    | `"ne"`         | Names, digits and labels.                                                                                                             |
| `minDate` / `maxDate`                       | `BsDate`                                          | —              | Selectable range, inclusive.                                                                                                          |
| `isDateDisabled`                            | `(date: BsDate) => boolean`                       | —              | Disable individual days.                                                                                                              |
| `weekStartsOn`                              | `0`–`6`                                           | `0` (Sunday)   | First column of the calendar.                                                                                                         |
| `showAdDates`                               | `boolean`                                         | `true`         | Show AD day numbers under BS days.                                                                                                    |
| `timeZone`                                  | `"local" \| "utc" \| "nepal"`                     | `"local"`      | Which "today" to highlight and select with the Today button.                                                                          |
| `defaultMonth`                              | `{ year, month }`                                 | today          | Month shown when there is no value.                                                                                                   |
| `name`                                      | `string`                                          | —              | Adds a hidden input for form submission.                                                                                              |
| `id`, `placeholder`, `disabled`, `required` | —                                                 | —              | Passed to the text input.                                                                                                             |
| `clearable`                                 | `boolean`                                         | `true`         | Show the Clear button.                                                                                                                |
| `closeOnSelect`                             | `boolean`                                         | `true`         | Close the popup after picking.                                                                                                        |
| `inputProps`                                | input attributes                                  | —              | Extra attributes and handlers for the text input.                                                                                     |
| `labels`                                    | `Partial<{ openCalendar, dialog, today, clear }>` | by locale      | Accessible labels and button text.                                                                                                    |
| `className`                                 | `string`                                          | —              | Added to the root element.                                                                                                            |

### `<NepaliCalendar>`

It takes the same `value`, `minDate`, `maxDate`, `isDateDisabled`, `locale`, `weekStartsOn`, `showAdDates`,
`timeZone`, `defaultMonth` and `className` props, plus:

| Prop        | Type                                                 | Description                                   |
| ----------- | ---------------------------------------------------- | --------------------------------------------- |
| `onChange`  | `(date: BsDate) => void`                             | Called on click, Enter or Space.              |
| `autoFocus` | `boolean`                                            | Focus the selected (or today's) day on mount. |
| `labels`    | `Partial<{ previousMonth, nextMonth, month, year }>` | Accessible names of the navigation controls.  |

## Keyboard

| Key                         | Action                              |
| --------------------------- | ----------------------------------- |
| `↓` / `Alt + ↓` in input    | Open the calendar                   |
| `←` `→`                     | Previous / next day                 |
| `↑` `↓`                     | Same day previous / next week       |
| `Home` / `End`              | First / last day of the week        |
| `PageUp` / `PageDown`       | Previous / next month               |
| `Shift + PageUp / PageDown` | Previous / next year                |
| `Enter` / `Space`           | Select the focused day              |
| `Escape`                    | Close and return focus to the input |
| `Enter` in input            | Accept the typed date               |

## Styling

Import `nepali-miti-react/styles.css` once, then override any of these variables:

```css
.nmr-picker,
.nmr-calendar {
  --nmr-accent: #0f766e; /* selected day, today ring */
  --nmr-focus: #2563eb; /* focus rings, Today/Clear text */
  --nmr-weekend: #b91c1c; /* Saturday */
  --nmr-bg: #fff;
  --nmr-fg: #111827;
  --nmr-muted: #6b7280;
  --nmr-border: #d1d5db;
  --nmr-hover: #f3f4f6;
  --nmr-radius: 6px;
  --nmr-cell: 2.5rem; /* day size */
  --nmr-font: inherit;
}
```

Dark colours apply automatically with `prefers-color-scheme: dark`. Add the class `nmr-dark` to force dark mode, or
`nmr-light` to opt out. You can also skip the stylesheet and style the `nmr-*` classes and `data-selected`,
`data-today`, `data-weekend` and `aria-disabled` attributes yourself.

## Next.js

The bundle starts with `"use client"`, so you can render it straight from a Server Component page in the App Router:

```tsx
// app/page.tsx
import { NepaliDatePicker } from 'nepali-miti-react';
import 'nepali-miti-react/styles.css';

export default function Page() {
  return <NepaliDatePicker name="date" timeZone="nepal" />;
}
```

Use `timeZone="nepal"` when "today" should mean today in Nepal, so the server render and a visitor abroad agree.

## Accessibility

- The toggle button has `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`. The popup is a labelled
  `role="dialog"`.
- The calendar is a `role="grid"` table labelled by the month heading, with column headers that carry full weekday
  names. Only one day is tabbable at a time (roving `tabindex`).
- Each day is announced in full, for example "बिहीबार, १५ असोज २०८३ (1 October 2026)". Today has
  `aria-current="date"`, the selected day has `aria-selected`, and unavailable days have `aria-disabled` but stay
  focusable so keyboard users can move past them.
- Tests check keyboard behaviour and run axe-core with the picker open and closed.

## Compatibility

Tested with React 18.3 and 19.3 on Node.js 22 and 24 (the test tooling needs Node 22+), in several timezones. The output is ES2020 and needs no
polyfills.

## Contributing and development

See [CONTRIBUTING.md](./CONTRIBUTING.md). Report wrong dates in
[nepali-miti](https://github.com/alexblaze/nepali-miti/issues).

```sh
npm install
npm test           # vitest + Testing Library + axe (jsdom)
npm run lint       # eslint + prettier + tsc
npm run build      # ESM + CJS + .d.ts + styles.css
```

## License

[MIT](./LICENSE) © alexblaze
