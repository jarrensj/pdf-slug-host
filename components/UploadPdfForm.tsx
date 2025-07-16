"use client";
import { useRef, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSlugChecker } from "@/hooks/useSlugChecker";
import SlugStatusIndicator from "./SlugStatusIndicator";

export default function UploadPdfForm() {
  const [slug, setSlug] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();

  // Use the slug checker hook
  const { slugAvailable, checkingSlug, isValidFormat, shouldShowStatus } = useSlugChecker({
    slug,
  });

  // Auto-clear success message after 10 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 10000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!file) {
      setError("Please upload a PDF file.");
      return;
    }
    if (!slug || !isValidFormat) {
      setError("Please enter a valid unique name (letters, numbers, dashes, underscores only). e.g. my-document");
      return;
    }
    if (slugAvailable === false) {
      setError("This slug is already taken. Please choose a different name.");
      return;
    }
    if (!user) {
      setError("You must be signed in to upload a PDF.");
      return;
    }
    try {
      // First, upload the PDF file to S3
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const uploadError = await uploadRes.json();
        setError(uploadError.error || "Failed to upload PDF file.");
        return;
      }

      const { fileUrl } = await uploadRes.json();

      // Then, create the PDF slug record with the S3 URL
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          pdf: fileUrl, // Use the actual S3 URL
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create PDF slug.");
        return;
      }
      setSuccess(`PDF slug ${slug} created successfully!`);
      setSlug("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2 text-center">Upload your PDF</h1>
      <p className="mb-6 text-center text-gray-500 dark:text-gray-300 text-sm">Choose a PDF and give it a unique name to create a custom link like <span className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">/your-slug</span></p>
      <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2">
          <span className="font-medium">PDF File</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="border border-gray-300 rounded px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-100 dark:file:bg-gray-800 file:text-gray-700 dark:file:text-gray-200"
            onChange={e => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-medium">Unique Name (Slug)</span>
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            pattern="[-a-zA-Z0-9_]+"
            placeholder="e.g. my-document"
            className="border border-gray-300 rounded px-3 py-2"
            required
          />
          <SlugStatusIndicator
            slugAvailable={slugAvailable}
            checkingSlug={checkingSlug}
            isValidFormat={isValidFormat}
            shouldShow={shouldShowStatus}
          />
        </label>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center">{success}</div>}
        <button
          type="submit"
          className="mt-2 bg-foreground text-background rounded px-4 py-2 font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 dark:hover:text-black transition-colors"
        >
          Create PDF Slug
        </button>
      </form>
    </div>
  );
} 