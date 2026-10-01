import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BsDate } from 'nepali-miti';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { NepaliDatePicker, type NepaliDatePickerProps } from '../src';

const ASOJ_15: BsDate = { year: 2083, month: 6, day: 15 };

function Controlled(props: Partial<NepaliDatePickerProps> & { initial?: BsDate | null }) {
  const { initial = null, ...rest } = props;
  const [value, setValue] = useState<BsDate | null>(initial);
  return (
    <>
      <NepaliDatePicker value={value} onChange={setValue} locale="en" {...rest} />
      <output data-testid="value">{value ? `${value.year}-${value.month}-${value.day}` : 'none'}</output>
      <button type="button">outside</button>
    </>
  );
}

const input = (): HTMLInputElement => screen.getByRole('textbox');
const toggle = (): HTMLElement => screen.getByRole('button', { name: 'Choose date' });

afterEach(() => vi.useRealTimers());

describe('NepaliDatePicker', () => {
  it('shows the value in the input using the format and locale', () => {
    const { rerender } = render(<NepaliDatePicker value={ASOJ_15} />);
    expect(input()).toHaveValue('२०८३-०६-१५');
    rerender(<NepaliDatePicker value={ASOJ_15} locale="en" format="D MMMM YYYY" />);
    expect(input()).toHaveValue('15 Asoj 2083');
    expect(input()).toHaveAttribute('placeholder', 'D MMMM YYYY');
  });

  it('opens a dialog, focuses the selected day and picks a date', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={ASOJ_15} />);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    const dialog = screen.getByRole('dialog', { name: 'Choose date' });
    expect(toggle()).toHaveAttribute('aria-controls', dialog.id);
    expect(document.activeElement).toHaveAccessibleName(/^Thursday, 15 Asoj 2083/);

    await user.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByTestId('value')).toHaveTextContent('2083-6-16');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(input()).toHaveValue('2083-06-16');
    expect(document.activeElement).toBe(input());
  });

  it('accepts typed dates in English or Devanagari digits on Enter and blur', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.type(input(), '2083-07-01{Enter}');
    expect(screen.getByTestId('value')).toHaveTextContent('2083-7-1');
    await user.clear(input());
    await user.type(input(), '२०८३-०३-३२');
    await user.tab();
    expect(screen.getByTestId('value')).toHaveTextContent('2083-3-32');
  });

  it('flags invalid or disabled typed dates without changing the value', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={ASOJ_15} maxDate={{ year: 2083, month: 12, day: 30 }} />);
    await user.clear(input());
    await user.type(input(), '2083-06-32{Enter}'); // Asoj 2083 has 31 days
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('value')).toHaveTextContent('2083-6-15');
    await user.clear(input());
    await user.type(input(), '2084-01-01{Enter}'); // after maxDate
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    await user.type(input(), 'x');
    expect(input()).not.toHaveAttribute('aria-invalid');
  });

  it('clears the value when the input is emptied', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={ASOJ_15} />);
    await user.clear(input());
    await user.tab();
    expect(screen.getByTestId('value')).toHaveTextContent('none');
  });

  it('Today and Clear buttons', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-18T06:00:00Z'));
    const user = userEvent.setup();
    render(<Controlled timeZone="utc" />);
    await user.click(toggle());
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByTestId('value')).toHaveTextContent('2083-7-1');
    await user.click(toggle());
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByTestId('value')).toHaveTextContent('none');
    expect(input()).toHaveValue('');
  });

  it('disables Today when today is not selectable and hides Clear when not clearable', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-18T06:00:00Z'));
    const user = userEvent.setup();
    render(<Controlled timeZone="utc" clearable={false} isDateDisabled={(d) => d.month === 7} />);
    await user.click(toggle());
    expect(screen.getByRole('button', { name: 'Today' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('closes on Escape (returning focus), outside click and Tab out', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={ASOJ_15} />);
    await user.click(toggle());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(input());

    await user.click(toggle());
    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(toggle());
    fireEvent.blur(screen.getByRole('dialog'), { relatedTarget: screen.getByRole('button', { name: 'outside' }) });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens with ArrowDown and closes with Escape from the input', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={ASOJ_15} />);
    input().focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    input().focus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the popup open when closeOnSelect is false', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={ASOJ_15} closeOnSelect={false} />);
    await user.click(toggle());
    await user.click(screen.getByRole('button', { name: /^Friday, 16 Asoj/ }));
    expect(screen.getByTestId('value')).toHaveTextContent('2083-6-16');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('works uncontrolled and submits an ASCII YYYY-MM-DD value in forms', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <NepaliDatePicker name="dob" defaultValue={ASOJ_15} onChange={onChange} />
      </form>,
    );
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden).toHaveAttribute('name', 'dob');
    expect(hidden.value).toBe('2083-06-15');
    await user.click(screen.getByRole('button', { name: 'मिति छान्नुहोस्' }));
    expect(screen.getByRole('dialog', { name: 'मिति छान्नुहोस्' })).toBeInTheDocument();
  });

  it('calls onChange only when the day actually changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NepaliDatePicker defaultValue={ASOJ_15} onChange={onChange} locale="en" />);
    await user.click(input());
    await user.tab(); // blur with unchanged text
    expect(onChange).not.toHaveBeenCalled();
    await user.clear(input());
    await user.type(input(), '2083-06-20{Enter}');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ year: 2083, month: 6, day: 20 });
  });

  it('does not reset typing when an equal value object is passed on every render', async () => {
    const user = userEvent.setup();
    function Inline() {
      const [, force] = useState(0);
      return <NepaliDatePicker value={{ ...ASOJ_15 }} onChange={() => force((n) => n + 1)} locale="en" />;
    }
    render(<Inline />);
    await user.clear(input());
    await user.type(input(), '2083-0');
    expect(input()).toHaveValue('2083-0');
  });

  it('passes inputProps and respects disabled', async () => {
    const onKeyDown = vi.fn();
    const onBlur = vi.fn();
    const { rerender } = render(
      <NepaliDatePicker id="d" inputProps={{ 'aria-describedby': 'help', onKeyDown, onBlur }} locale="en" />,
    );
    expect(input()).toHaveAttribute('id', 'd');
    expect(input()).toHaveAttribute('aria-describedby', 'help');
    fireEvent.keyDown(input(), { key: 'a' });
    fireEvent.blur(input());
    expect(onKeyDown).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
    rerender(<NepaliDatePicker disabled locale="en" />);
    expect(input()).toBeDisabled();
    expect(toggle()).toBeDisabled();
  });

  it('has no axe violations open or closed', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <label>
        Date of birth
        <NepaliDatePicker defaultValue={ASOJ_15} locale="en" />
      </label>,
    );
    expect(await axe(container)).toHaveNoViolations();
    await user.click(toggle());
    expect(await axe(container)).toHaveNoViolations();
  });
});
