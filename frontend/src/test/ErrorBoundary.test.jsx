import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

function ProblemChild() {
  throw new Error('Test clinical crash simulation');
}

describe('ErrorBoundary Component', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal Clinical Page</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal Clinical Page')).toBeInTheDocument();
  });

  it('catches render error and displays clinical fallback alert', () => {
    // Suppress console.error during expected test error throw
    const originalError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Clinical Workspace Interrupted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload dashboard/i })).toBeInTheDocument();

    console.error = originalError;
  });
});
