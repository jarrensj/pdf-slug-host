import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

interface SlugPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params;
  
  // Create a public Supabase client for slug lookup
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Query the database to find the file for this slug
  const { data, error } = await supabase
    .from('pdf_slugs')
    .select('file, slug')
    .eq('slug', slug)
    .single();

  // If slug doesn't exist, show 404
  if (error || !data) {
    notFound();
  }

  // Determine file type based on URL or extension
  const fileUrl = data.file;
  const isImage = fileUrl.includes('.jpg') || fileUrl.includes('.jpeg') || fileUrl.includes('.png');
  const isPdf = fileUrl.includes('.pdf') || !isImage; // Default to PDF if unclear

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header with just download button */}
      <div className="bg-white dark:bg-[#18181b] border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-end">
          <a
            href={fileUrl}
            download
            className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            Download
          </a>
        </div>
      </div>

      {/* File content */}
      <div className="w-full h-[calc(100vh-52px)]">
        {isImage ? (
          <div className="flex items-center justify-center h-full p-4">
            <img
              src={fileUrl}
              alt={slug}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={slug}
          />
        )}
      </div>
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: SlugPageProps) {
  const { slug } = await params;
  
  return {
    title: `File: ${slug}`,
    description: `View file hosted at /${slug}`,
  };
} 