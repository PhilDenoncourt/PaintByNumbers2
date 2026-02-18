import React, { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

function ErrorFallback({ error, errorInfo, onReset }: { error: Error | null; errorInfo: React.ErrorInfo | null; onReset: () => void }) {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4v2m0 0v2m0 4v2m0 0H9m3 0H6m3 0h3m3 0h3"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
          {t('errorBoundary.title')}
        </h1>
        <p className="text-gray-600 text-center text-sm mb-6">
          {t('errorBoundary.message')}
        </p>

        {error && (
          <details className="mb-6 p-3 bg-gray-100 rounded text-xs text-gray-700 text-left overflow-auto max-h-40">
            <summary className="cursor-pointer font-semibold mb-2">
              {t('errorBoundary.errorDetails')} ({process.env.NODE_ENV === 'development' ? 'Development' : 'Hidden'})
            </summary>
            <div className="whitespace-pre-wrap break-words">
              <p className="font-mono text-red-600 mb-2">
                {error.toString()}
              </p>
              {errorInfo?.componentStack && (
                <p className="text-gray-600 font-mono">
                  {errorInfo.componentStack}
                </p>
              )}
            </div>
          </details>
        )}

        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {t('errorBoundary.tryAgain')}
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            {t('common.home')}
          </button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Update state with error details
    this.setState((prevState) => ({
      ...prevState,
      errorInfo,
    }));

    // Optional: Send error to logging service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ErrorFallback 
            error={this.state.error} 
            errorInfo={this.state.errorInfo} 
            onReset={this.handleReset} 
          />
        )
      );
    }

    return this.props.children;
  }
}
