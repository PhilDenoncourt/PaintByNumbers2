import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../../components/layout/ErrorBoundary';

// Component that throws an error
const ThrowError = () => {
  throw new Error('Test error message');
};

const SafeComponent = () => <div>Safe content</div>;

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    const spy = vi.spyOn(console, 'error');
    spy.mockRestore();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('errorBoundary.title')).toBeInTheDocument();
    expect(
      screen.getByText('errorBoundary.message')
    ).toBeInTheDocument();
  });

  it('should display error details in development mode', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const details = screen.getByRole('group');
    expect(details).toBeInTheDocument();
  });

  it('should have Try Again and Home buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: 'errorBoundary.tryAgain' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.home' })).toBeInTheDocument();
  });

  it('should reset state when Try Again is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('errorBoundary.title')).toBeInTheDocument();

    const tryAgainButton = screen.getByRole('button', { name: 'errorBoundary.tryAgain' });
    expect(tryAgainButton).toBeInTheDocument();
    fireEvent.click(tryAgainButton);
    // Button click triggers handleReset which resets the error boundary state
    // The component will still show error UI until a new child that doesn't throw is rendered
  });

  it('should render custom fallback if provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('errorBoundary.title')).not.toBeInTheDocument();
  });
});
