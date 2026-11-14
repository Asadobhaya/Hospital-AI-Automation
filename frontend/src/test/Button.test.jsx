import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Confirm Appointment</Button>);
    expect(screen.getByRole('button', { name: /confirm appointment/i })).toBeInTheDocument();
  });

  it('triggers onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and aria-busy when loading', () => {
    const handleClick = vi.fn();
    render(<Button loading onClick={handleClick}>Processing</Button>);
    const button = screen.getByRole('button', { name: /processing/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies danger variant classes correctly', () => {
    render(<Button variant="danger">Cancel Consultation</Button>);
    const button = screen.getByRole('button', { name: /cancel consultation/i });
    expect(button.className).toContain('bg-[#B42318]');
  });
});
