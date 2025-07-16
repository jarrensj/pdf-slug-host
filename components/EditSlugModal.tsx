'use client';
import { useState, useEffect } from 'react';
import { useSlugChecker } from '@/hooks/useSlugChecker';
import SlugStatusIndicator from './SlugStatusIndicator';

interface EditSlugModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlug: string;
  slugId: string;
  onUpdate: (newSlug: string) => void;
}

export default function EditSlugModal({ 
  isOpen, 
  onClose, 
  currentSlug, 
  slugId, 
  onUpdate 
}: EditSlugModalProps) {
  const [newSlug, setNewSlug] = useState(currentSlug);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Use the slug checker hook with current slug excluded
  const { slugAvailable, checkingSlug, isValidFormat, shouldShowStatus } = useSlugChecker({
    slug: newSlug,
    excludeSlug: currentSlug,
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setNewSlug(currentSlug);
      setError('');
    }
  }, [isOpen, currentSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!newSlug || !isValidFormat) {
      setError('Please enter a valid slug (letters, numbers, dashes, underscores only)');
      setIsLoading(false);
      return;
    }

    if (newSlug === currentSlug) {
      onClose();
      setIsLoading(false);
      return;
    }

    if (slugAvailable === false) {
      setError('This slug is already taken. Please choose a different name.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/slugs/${slugId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: newSlug }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update slug');
        setIsLoading(false);
        return;
      }

      onUpdate(newSlug);
      onClose();
    } catch (err) {
      setError('An unexpected error occurred');
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setNewSlug(currentSlug);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const isSlugChanged = newSlug !== currentSlug;
  const canSubmit = isSlugChanged && slugAvailable !== false && !checkingSlug;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#18181b] rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Edit Slug Name</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="slug" className="block text-sm font-medium mb-2">
              Slug Name
            </label>
            <input
              id="slug"
              type="text"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. my-document"
              disabled={isLoading}
            />
            
            <SlugStatusIndicator
              slugAvailable={slugAvailable}
              checkingSlug={checkingSlug}
              isValidFormat={isValidFormat}
              shouldShow={shouldShowStatus && isSlugChanged}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-foreground text-background rounded hover:bg-gray-800 dark:hover:bg-gray-200 dark:hover:text-black transition-colors disabled:opacity-50"
              disabled={isLoading || !canSubmit}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 