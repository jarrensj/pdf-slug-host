import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">File Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          The file slug you're looking for doesn't exist or may have been removed.
        </p>
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-foreground text-background px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 dark:hover:text-black transition-colors"
          >
            Upload a New File
          </Link>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Or go back to create your own custom file URL</p>
          </div>
        </div>
      </div>
    </div>
  );
} 