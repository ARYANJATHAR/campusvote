export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
        <p className="text-gray-600 animate-pulse">Loading...</p>
      </div>
    </div>
  );
} 