import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { NameInput } from './NameInput';

describe('NameInput', () => {
  it('renders with label and placeholder', () => {
    const onChange = vi.fn();

    render(<NameInput value="" onChange={onChange} />);

    expect(screen.getByLabelText('ชื่อผู้สั่ง')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('กรอกชื่อของคุณ')).toBeInTheDocument();
  });

  it('displays helper text', () => {
    const onChange = vi.fn();

    render(<NameInput value="" onChange={onChange} />);

    expect(
      screen.getByText('เราจะเรียกชื่อนี้เมื่อออเดอร์พร้อม')
    ).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<NameInput value="" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'John');

    expect(onChange).toHaveBeenCalled();
    // onChange is called for each character typed
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it('displays value correctly', () => {
    const onChange = vi.fn();

    render(<NameInput value="สมชาย" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('สมชาย');
  });

  it('shows validation error after blur when name is empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<NameInput value="" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab(); // blur the input

    expect(screen.getByText('กรุณากรอกชื่อ')).toBeInTheDocument();
  });

  it('shows validation error after blur when name is too short', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<NameInput value="A" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab(); // blur the input

    expect(
      screen.getByText('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร')
    ).toBeInTheDocument();
  });

  it('does not show validation error before blur', () => {
    const onChange = vi.fn();

    render(<NameInput value="A" onChange={onChange} />);

    expect(
      screen.queryByText('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร')
    ).not.toBeInTheDocument();
  });

  it('shows external error prop', () => {
    const onChange = vi.fn();

    render(
      <NameInput
        value="John"
        onChange={onChange}
        error="Custom error message"
      />
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('has maxLength attribute of 50', () => {
    const onChange = vi.fn();

    render(<NameInput value="" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '50');
  });

  it('applies error styling when there is an error', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<NameInput value="" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab();

    // Check for red border class
    expect(input).toHaveClass('border-red-500');
  });

  it('applies normal styling when there is no error', () => {
    const onChange = vi.fn();

    render(<NameInput value="Valid Name" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-gray-200');
    expect(input).not.toHaveClass('border-red-500');
  });

  it('has proper accessibility attributes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<NameInput value="" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab();

    // Input should have aria-describedby pointing to error
    expect(input).toHaveAttribute('aria-describedby', 'name-error');
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      'กรุณากรอกชื่อ'
    );
  });
});
