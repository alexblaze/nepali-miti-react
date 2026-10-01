import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BsDate } from 'nepali-miti';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { NepaliCalendar } from '../src';

const ASOJ_15: BsDate = { year: 2083, month: 6, day: 15 };

function dayButton(label: RegExp): HTMLElement {
  return screen.getByRole('button', { name: label });
}

function Controlled(props: { initial?: BsDate | null } & Partial<Parameters<typeof NepaliCalendar>[0]>) {
  const { initial = null, ...rest } = props;
  const [value, setValue] = useState<BsDate | null>(initial);
  return (
    <>
      <NepaliCalendar value={value} onChange={setValue} {...rest} />
      <output data-testid="value">{value ? `${value.year}-${value.month}-${value.day}` : 'none'}</output>
    </>
  );
}

afterEach(() => vi.useRealTimers());

describe('NepaliCalendar rendering', () => {
  it('lays out Asoj 2083 starting on Thursday with Nepali digits by default', () => {
    render(<NepaliCalendar value={ASOJ_15} />);
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAccessibleName('असोज २०८३');
    const firstWeek = within(grid).getAllByRole('row')[1]!;
    const cells = within(firstWeek).getAllByRole('cell');
    // Sun–Wed empty, Thursday = 1 Asoj (17 Sep 2026)
    expect(cells.slice(0, 4).every((c) => c.textContent === '')).toBe(true);
    const gridcells = within(grid).getAllByRole('gridcell');
    expect(gridcells).toHaveLength(31);
    expect(gridcells[0]).toHaveTextContent('१17');
    expect(dayButton(/^बिहीबार, १५ असोज २०८३ \(1 October 2026\)$/)).toHaveAttribute('data-selected', 'true');
  });

  it('renders English and hides AD dates on request', () => {
    render(<NepaliCalendar value={ASOJ_15} locale="en" showAdDates={false} />);
    expect(screen.getByRole('grid')).toHaveAccessibleName('Asoj 2083');
    const cell = dayButton(/^Thursday, 15 Asoj 2083/);
    expect(cell).toHaveTextContent(/^15$/);
    expect(screen.getByRole('columnheader', { name: 'Sat' })).toHaveAttribute('abbr', 'Saturday');
  });

  it('marks the selected cell and only it as aria-selected', () => {
    render(<NepaliCalendar value={ASOJ_15} locale="en" />);
    const selected = screen.getAllByRole('gridcell').filter((c) => c.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent('15');
  });

  it('marks today with aria-current', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-01T12:00:00Z'));
    render(<NepaliCalendar locale="en" timeZone="utc" />);
    expect(screen.getByRole('grid')).toHaveAccessibleName('Asoj 2083');
    expect(dayButton(/^Thursday, 15 Asoj/)).toHaveAttribute('aria-current', 'date');
  });

  it('respects weekStartsOn', () => {
    render(<NepaliCalendar value={ASOJ_15} locale="en" weekStartsOn={1} />);
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('opens on defaultMonth when there is no value', () => {
    render(<NepaliCalendar locale="en" defaultMonth={{ year: 2084, month: 1 }} />);
    expect(screen.getByRole('grid')).toHaveAccessibleName('Baisakh 2084');
  });

  it('has no axe violations', async () => {
    const { container } = render(<NepaliCalendar value={ASOJ_15} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('NepaliCalendar interaction', () => {
  it('selects a date on click', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={ASOJ_15} locale="en" />);
    await user.click(dayButton(/^Sunday, 18 Asoj/));
    expect(screen.getByTestId('value')).toHaveTextContent('2083-6-18');
  });

  it('navigates with the arrow, Home/End and Page keys', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={ASOJ_15} locale="en" />);
    dayButton(/^Thursday, 15 Asoj/).focus();

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toHaveAccessibleName(/^Friday, 16 Asoj/);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName(/^Friday, 23 Asoj/);
    await user.keyboard('{ArrowUp}{ArrowLeft}');
    expect(document.activeElement).toHaveAccessibleName(/^Thursday, 15 Asoj/);
    await user.keyboard('{Home}');
    expect(document.activeElement).toHaveAccessibleName(/^Sunday, 11 Asoj/);
    await user.keyboard('{End}');
    expect(document.activeElement).toHaveAccessibleName(/^Saturday, 17 Asoj/);

    // Crossing into the next month re-renders the grid and keeps focus on the new day.
    dayButton(/^Saturday, 31 Asoj/).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('grid')).toHaveAccessibleName('Kartik 2083');
    expect(document.activeElement).toHaveAccessibleName(/^Sunday, 1 Kartik 2083 \(18 October 2026\)/);

    await user.keyboard('{PageDown}');
    expect(document.activeElement).toHaveAccessibleName(/^Tuesday, 1 Mangsir 2083 \(17 November 2026\)/);
    await user.keyboard('{Shift>}{PageUp}{/Shift}');
    expect(document.activeElement).toHaveAccessibleName(/1 Mangsir 2082/);
    await user.keyboard('{PageUp}');
    expect(document.activeElement).toHaveAccessibleName(/1 Kartik 2082/);

    await user.keyboard('{Enter}');
    expect(screen.getByTestId('value')).toHaveTextContent('2082-7-1');
  });

  it('only one day is in the tab order', () => {
    render(<NepaliCalendar value={ASOJ_15} locale="en" />);
    const tabbable = screen.getAllByRole('gridcell').map((c) => within(c).getByRole('button'));
    expect(tabbable.filter((b) => b.tabIndex === 0)).toHaveLength(1);
  });

  it('changes month and year with the buttons and selects', async () => {
    const user = userEvent.setup();
    render(<NepaliCalendar value={ASOJ_15} locale="en" />);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('grid')).toHaveAccessibleName('Kartik 2083');
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('grid')).toHaveAccessibleName('Bhadra 2083');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Month' }), 'Chaitra');
    expect(screen.getByRole('grid')).toHaveAccessibleName('Chaitra 2083');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Year' }), '2080');
    expect(screen.getByRole('grid')).toHaveAccessibleName('Chaitra 2080');
  });

  it('respects minDate, maxDate and isDateDisabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <NepaliCalendar
        value={ASOJ_15}
        onChange={onChange}
        locale="en"
        minDate={{ year: 2083, month: 6, day: 10 }}
        maxDate={{ year: 2083, month: 6, day: 20 }}
        isDateDisabled={(d) => d.day === 16}
      />,
    );
    expect(dayButton(/^Friday, 9 Asoj/)).toHaveAttribute('aria-disabled', 'true');
    expect(dayButton(/^Friday, 16 Asoj/)).toHaveAttribute('aria-disabled', 'true');
    expect(dayButton(/^Wednesday, 21 Asoj/)).toHaveAttribute('aria-disabled', 'true');
    await user.click(dayButton(/^Friday, 16 Asoj/));
    await user.click(dayButton(/^Friday, 9 Asoj/));
    expect(onChange).not.toHaveBeenCalled();

    // Month navigation stops at the bounds.
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();

    // Keyboard focus is clamped to the range.
    dayButton(/^Thursday, 15 Asoj/).focus();
    await user.keyboard('{PageDown}');
    expect(document.activeElement).toHaveAccessibleName(/^Tuesday, 20 Asoj/);
    await user.keyboard('{Shift>}{PageUp}{/Shift}');
    expect(document.activeElement).toHaveAccessibleName(/^Saturday, 10 Asoj/);
  });

  it('follows external value changes', () => {
    const { rerender } = render(<NepaliCalendar value={ASOJ_15} locale="en" />);
    rerender(<NepaliCalendar value={{ year: 2084, month: 1, day: 5 }} locale="en" />);
    expect(screen.getByRole('grid')).toHaveAccessibleName('Baisakh 2084');
  });

  it('autoFocus moves focus to the selected day', () => {
    render(<NepaliCalendar value={ASOJ_15} locale="en" autoFocus />);
    expect(document.activeElement).toHaveAccessibleName(/^Thursday, 15 Asoj/);
  });

  it('accepts custom labels', () => {
    render(<NepaliCalendar value={ASOJ_15} labels={{ nextMonth: 'Agadi' }} />);
    expect(screen.getByRole('button', { name: 'Agadi' })).toBeInTheDocument();
  });
});
