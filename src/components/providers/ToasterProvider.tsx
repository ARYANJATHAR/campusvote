'use client';

import { Toaster } from 'sonner';

export function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      expand={false}
      richColors
      closeButton
      theme="light"
      pauseWhenPageIsHidden
      toastOptions={{
        duration: 1000,
        dismissible: true,
        closeButton: true,
        className: "bg-white border border-gray-200 shadow-lg",
        classNames: {
          toast: "bg-white border border-gray-200 shadow-lg",
          title: "text-gray-900 font-semibold",
          description: "text-gray-600",
          actionButton: "bg-purple-600 hover:bg-purple-700",
          cancelButton: "bg-gray-100 hover:bg-gray-200",
          success: "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
          error: "bg-red-500 text-white",
          loading: "bg-purple-600 text-white",
        },
      }}
    />
  );
} 