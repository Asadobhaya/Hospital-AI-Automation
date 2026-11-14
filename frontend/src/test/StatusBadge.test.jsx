import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders confirmed status with clinical success colors', () => {
    render(<StatusBadge status="confirmed" />);
    const badge = screen.getByText('Confirmed');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('[role="status"]').className).toContain('text-[#18794E]');
  });

  it('renders cancelled status with error colors', () => {
    render(<StatusBadge status="cancelled" />);
    const badge = screen.getByText('Cancelled');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('[role="status"]').className).toContain('text-[#B42318]');
  });

  it('renders urgent triage status with critical alert styles', () => {
    render(<StatusBadge status="urgent" />);
    const badge = screen.getByText('Urgent');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('[role="status"]').className).toContain('text-[#B42318]');
  });

  it('handles unknown status fallback gracefully', () => {
    render(<StatusBadge status="unknown_state" />);
    const badge = screen.getByText('unknown_state');
    expect(badge).toBeInTheDocument();
  });
});
