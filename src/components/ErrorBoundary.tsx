import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BookOpen, RefreshCw, Home, AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.hash = '';
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, errorMessage: undefined });
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6 transition-colors"
          style={{
            backgroundColor: 'var(--paper-bg, #fdfbf7)',
            color: 'var(--ink-primary, #2d2823)',
          }}
        >
          <div
            className="w-full max-w-lg p-8 sm:p-10 rounded-2xl border shadow-2xl text-center paper-texture"
            style={{
              borderColor: 'var(--paper-border, #e6dfd1)',
              backgroundColor: 'var(--paper-page, #fbf8f1)',
            }}
          >
            <div
              className="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center border shadow-xs"
              style={{
                borderColor: 'var(--paper-border, #e6dfd1)',
                backgroundColor: 'var(--paper-page-alt, #f6f1e6)',
                color: 'var(--ink-accent, #8b3a2b)',
              }}
            >
              <BookOpen size={26} />
            </div>

            <h1 className="text-2xl font-display font-semibold mb-2">
              {this.props.fallbackTitle || 'The Journal Encountered a Gentle Pause'}
            </h1>

            <p className="text-sm font-garamond italic text-stone-600 dark:text-stone-400 mb-6 max-w-md mx-auto leading-relaxed">
              We were unable to render this page of the archive. Your memories and written thoughts remain securely preserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl text-xs font-garamond uppercase tracking-wider text-white shadow-md transition-transform hover:scale-105 cursor-pointer flex items-center gap-2"
                style={{ backgroundColor: 'var(--ink-accent, #8b3a2b)' }}
              >
                <RefreshCw size={13} />
                <span>Reopen Journal</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="px-5 py-2.5 rounded-xl text-xs font-garamond uppercase tracking-wider border transition-transform hover:scale-105 cursor-pointer flex items-center gap-2"
                style={{
                  borderColor: 'var(--paper-border, #e6dfd1)',
                  backgroundColor: 'var(--paper-page-alt, #f6f1e6)',
                  color: 'var(--ink-primary, #2d2823)',
                }}
              >
                <Home size={13} />
                <span>Return to Cover</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
