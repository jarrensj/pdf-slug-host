'use client';
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import EditSlugModal from "@/components/EditSlugModal";
import ConfirmationModal from "@/components/ConfirmationModal";

interface PdfSlug {
  id: string;
  slug: string;
  pdf: string;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [slugs, setSlugs] = useState<PdfSlug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    slug?: PdfSlug;
  }>({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    slug?: PdfSlug;
    isDeleting: boolean;
  }>({ isOpen: false, isDeleting: false });

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/");
      return;
    }

    if (user) {
      fetchSlugs();
    }
  }, [user, isLoaded, router]);

  const fetchSlugs = async () => {
    try {
      const response = await fetch('/api/slugs');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch PDF slugs');
        return;
      }

      setSlugs(data.slugs || []);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (slug: PdfSlug) => {
    setDeleteModal({ isOpen: true, slug, isDeleting: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.slug) return;

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      const response = await fetch(`/api/slugs/${deleteModal.slug.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to delete PDF slug');
        setDeleteModal({ isOpen: false, isDeleting: false });
        return;
      }

      // Remove from local state
      setSlugs(prevSlugs => prevSlugs.filter(s => s.id !== deleteModal.slug!.id));
      setDeleteModal({ isOpen: false, isDeleting: false });
    } catch (err) {
      setError('An unexpected error occurred while deleting');
      setDeleteModal({ isOpen: false, isDeleting: false });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, isDeleting: false });
  };

  const handleEdit = (slug: PdfSlug) => {
    setEditModal({ isOpen: true, slug });
  };

  const handleUpdateSlug = (newSlugName: string) => {
    if (!editModal.slug) return;

    // Update local state
    setSlugs(prevSlugs => 
      prevSlugs.map(s => 
        s.id === editModal.slug!.id 
          ? { ...s, slug: newSlugName, updated_at: new Date().toISOString() }
          : s
      )
    );
    setEditModal({ isOpen: false });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}! 
            Manage your PDF slugs below.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button 
              onClick={() => setError('')}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* PDF Slugs Management Section */}
        <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Your PDF Slugs</h2>
            <a 
              href="/" 
              className="bg-foreground text-background px-4 py-2 rounded font-medium hover:bg-gray-800 dark:hover:bg-gray-200 dark:hover:text-black transition-colors"
            >
              Create New Slug
            </a>
          </div>
          
          {slugs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No PDF slugs created yet.</p>
              <p className="text-sm">Create your first PDF slug to get started!</p>
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="max-h-96 overflow-y-auto">
                {slugs.map((slugData, index) => (
                  <div 
                    key={slugData.id} 
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      index !== slugs.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-foreground">
                            /{slugData.slug}
                          </h3>
                          <a
                            href={slugData.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                          >
                            View PDF ↗
                          </a>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>Created: {formatDate(slugData.created_at)}</p>
                          {slugData.updated_at !== slugData.created_at && (
                            <p>Updated: {formatDate(slugData.updated_at)}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(slugData)}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(slugData)}
                          className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {slugs.length > 5 && (
                <div className="text-center py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                  Scroll to see more slugs
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-foreground">{slugs.length}</h3>
            <p className="text-gray-600 dark:text-gray-400">Total PDFs</p>
          </div>
          <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-foreground">
              {slugs.filter(s => s.updated_at !== s.created_at).length}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Updated PDFs</p>
          </div>
          <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-foreground">{slugs.length}</h3>
            <p className="text-gray-600 dark:text-gray-400">Active Slugs</p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal.slug && (
        <EditSlugModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false })}
          currentSlug={editModal.slug.slug}
          slugId={editModal.slug.id}
          onUpdate={handleUpdateSlug}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete PDF Slug"
        message={`Are you sure you want to delete "${deleteModal.slug?.slug}"? This action cannot be undone and will permanently remove the PDF slug from your account.`}
        confirmButtonText="Delete Slug"
        isLoading={deleteModal.isDeleting}
        variant="danger"
      />
    </div>
  );
} 