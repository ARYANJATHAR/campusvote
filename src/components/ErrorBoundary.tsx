'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { handleSupabaseError, isSupabaseError } from '@/lib/utils/supabase-error';
import Loading from '@/components/ui/loading'
import Image from 'next/image'
import { Poppins } from 'next/font/google'

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private getErrorMessage(error: Error | null): string {
    if (!error) return 'An unexpected error occurred';
    
    if (isSupabaseError(error)) {
      return handleSupabaseError(error);
    }
    
    return error.message || 'An unexpected error occurred';
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              {this.getErrorMessage(this.state.error)}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={poppins.className}>
        {this.props.children}
      </div>
    );
  }
} 