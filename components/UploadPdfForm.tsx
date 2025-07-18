"use client";
import { useRef, useState, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useSlugChecker } from "@/hooks/useSlugChecker";
import SlugStatusIndicator from "./SlugStatusIndicator";

// Steps in the upload flow
enum UploadStep {
  SLUG_CHECK = "slug_check",
  SIGN_IN = "sign_in", 
  FILE_UPLOAD = "file_upload",
  UPLOADING = "uploading",
  SUCCESS = "success"
}

export default function UploadPdfForm() {
  const [step, setStep] = useState<UploadStep>(UploadStep.SLUG_CHECK);
  const [slug, setSlug] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploadedSlug, setUploadedSlug] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isLoaded } = useUser();

  // Use the slug checker hook
  const { slugAvailable, checkingSlug, isValidFormat, shouldShowStatus } = useSlugChecker({
    slug,
  });

  const slugRegex = /^[-a-zA-Z0-9_]+$/;
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSlug = localStorage.getItem('upload-slug');
      const savedStep = localStorage.getItem('upload-step');
      
      if (savedSlug) {
        setSlug(savedSlug);
      }
      
      if (savedStep && savedSlug) {
        setStep(savedStep as UploadStep);
      }
    }
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    if (!isLoaded) return;

    if (typeof window !== 'undefined') {
      const savedSlug = localStorage.getItem('upload-slug');
      const savedStep = localStorage.getItem('upload-step');
      
      // If user just signed in and we have saved state, go to file upload
      if (user && savedSlug && (savedStep === UploadStep.SIGN_IN || savedStep === UploadStep.FILE_UPLOAD)) {
        setStep(UploadStep.FILE_UPLOAD);
        setSlug(savedSlug);
        // Clean up localStorage after successful transition
        localStorage.removeItem('upload-slug');
        localStorage.removeItem('upload-step');
      }
    }
  }, [user, isLoaded]);

  const handleSlugNext = () => {
    setError("");
    
    if (!slug || !slugRegex.test(slug)) {
      setError("Please enter a valid unique name (letters, numbers, dashes, underscores only). e.g. my-document");
      return;
    }
    
    if (slugAvailable === false) {
      setError("This slug is already taken. Please choose a different name.");
      return;
    }
    
    if (slugAvailable !== true) {
      setError("Please wait for slug availability check to complete.");
      return;
    }

    if (user) {
      setStep(UploadStep.FILE_UPLOAD);
    } else {
      // Save state to localStorage before going to sign in
      if (typeof window !== 'undefined') {
        localStorage.setItem('upload-slug', slug);
        localStorage.setItem('upload-step', UploadStep.SIGN_IN);
      }
      setStep(UploadStep.SIGN_IN);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!file) {
      setError("Please upload a PDF or JPG file.");
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid PDF or JPG file.");
      return;
    }
    
    if (!user) {
      setError("You must be signed in to upload a file.");
      return;
    }

    setStep(UploadStep.UPLOADING);
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const uploadError = await uploadRes.json();
        setError(uploadError.error || "Failed to upload file.");
        setStep(UploadStep.FILE_UPLOAD);
        return;
      }

      const { fileUrl } = await uploadRes.json();

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, file: fileUrl }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create file slug.");
        setStep(UploadStep.FILE_UPLOAD);
        return;
      }
      
      // Store success info and show success screen
      setUploadedSlug(slug);
      setUploadedFileName(file.name);
      setStep(UploadStep.SUCCESS);
    } catch (err) {
      setError("An unexpected error occurred.");
      setStep(UploadStep.FILE_UPLOAD);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${uploadedSlug}`);
  };

  const startNewUpload = () => {
    // Clean up localStorage when starting new upload
    if (typeof window !== 'undefined') {
      localStorage.removeItem('upload-slug');
      localStorage.removeItem('upload-step');
    }
    setSlug("");
    setFile(null);
    setError("");
    setUploadedSlug("");
    setUploadedFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStep(UploadStep.SLUG_CHECK);
  };

  const goBack = () => {
    setError("");
    // Clean up localStorage when going back
    if (typeof window !== 'undefined') {
      localStorage.removeItem('upload-slug');
      localStorage.removeItem('upload-step');
    }
    setStep(UploadStep.SLUG_CHECK);
  };

  const buttonClass = "w-full rounded px-4 py-2 font-semibold transition-colors";
  const primaryButton = `${buttonClass} bg-foreground text-background hover:bg-gray-800 dark:hover:bg-gray-200 dark:hover:text-black`;
  const secondaryButton = `${buttonClass} bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600`;

  return (
    <div className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-xl shadow-lg p-8 flex flex-col items-center">
      
      {step === UploadStep.SLUG_CHECK && (
        <>
          <h1 className="text-2xl font-bold mb-2 text-center">Choose Your Unique Name</h1>
          <p className="mb-6 text-center text-gray-500 dark:text-gray-300 text-sm">
            Pick a unique name for your file link like <span className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">/your-name</span>
          </p>
          
          <div className="w-full flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="font-medium">Unique Name (Slug)</span>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="e.g. my-document"
                className="border border-gray-300 rounded px-3 py-2"
              />
              <SlugStatusIndicator
                slugAvailable={slugAvailable}
                checkingSlug={checkingSlug}
                isValidFormat={isValidFormat}
                shouldShow={shouldShowStatus}
              />
            </label>
            
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            
            <button
              type="button"
              onClick={handleSlugNext}
              disabled={!slugAvailable || checkingSlug}
              className={`${primaryButton} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {checkingSlug ? "Checking..." : "Create File Slug"}
            </button>
          </div>
        </>
      )}

      {step === UploadStep.SIGN_IN && (
        <>
          <h1 className="text-2xl font-bold mb-2 text-center">Sign In Required</h1>
          <p className="mb-6 text-center text-gray-500 dark:text-gray-300 text-sm">
            You need to sign in to upload your file to <span className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">/{slug}</span>
          </p>
          
          <div className="w-full flex flex-col gap-4">
            <SignInButton mode="modal">
              <button className={primaryButton}>Sign In / Create Account</button>
            </SignInButton>
            <button onClick={goBack} className={secondaryButton}>← Back to Name Selection</button>
          </div>
        </>
      )}

      {(step === UploadStep.FILE_UPLOAD || step === UploadStep.UPLOADING) && (
        <>
          <h1 className="text-2xl font-bold mb-2 text-center">Upload Your File</h1>
          <p className="mb-6 text-center text-gray-500 dark:text-gray-300 text-sm">
            Upload your PDF or JPG file to <span className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">/{slug}</span>
          </p>
          
          <form className="w-full flex flex-col gap-4" onSubmit={handleFileUpload}>
            <label className="flex flex-col gap-2">
              <span className="font-medium">File (PDF or JPG)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/jpg"
                className="border border-gray-300 rounded px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-100 dark:file:bg-gray-800 file:text-gray-700 dark:file:text-gray-200"
                onChange={e => setFile(e.target.files?.[0] || null)}
                disabled={step === UploadStep.UPLOADING}
              />
            </label>
            
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={goBack}
                disabled={step === UploadStep.UPLOADING}
                className={`flex-1 ${secondaryButton} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={step === UploadStep.UPLOADING || !file}
                className={`flex-1 ${primaryButton} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {step === UploadStep.UPLOADING ? "Uploading..." : "Upload File"}
              </button>
            </div>
          </form>
        </>
      )}

      {step === UploadStep.SUCCESS && (
        <>
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">File Uploaded Successfully!</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
              <span className="font-medium">{uploadedFileName}</span> is now live at:
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-blue-600 dark:text-blue-400 break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/{uploadedSlug}
                </span>
                <button onClick={copyToClipboard} className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" title="Copy to clipboard">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="w-full flex flex-col gap-3">
            <a 
              href={`/${uploadedSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-semibold transition-colors text-center"
            >
              View File →
            </a>
            <button onClick={startNewUpload} className={primaryButton}>Upload Another File</button>
          </div>
        </>
      )}
    </div>
  );
} 