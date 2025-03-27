'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-4 text-center">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
} 