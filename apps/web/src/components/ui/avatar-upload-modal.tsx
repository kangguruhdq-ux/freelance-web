"use client";

import * as React from "react";
import { X, UploadCloud, Trash2, Camera, Check, ZoomIn, ZoomOut, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  userName?: string;
  onSuccess?: (newAvatarUrl: string | null) => void;
}

const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function AvatarUploadModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  userName = "User",
  onSuccess,
}: AvatarUploadModalProps) {
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(currentAvatarUrl || null);
  const [hasNewSelection, setHasNewSelection] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentAvatarUrl || null);
      setHasNewSelection(false);
      setZoom(1);
      setError(null);
    }
  }, [isOpen, currentAvatarUrl]);

  // Handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !uploading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, uploading, onClose]);

  if (!isOpen) return null;

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setError(null);

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid image format. Please select a JPEG, PNG, WebP, or GIF image.");
      toast.error("Unsupported image format. Please use JPEG, PNG, WebP, or GIF.");
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setError(`File size (${sizeMb}MB) exceeds the 3MB limit.`);
      toast.error(`Image is ${sizeMb}MB. Maximum allowed size is 3MB.`);
      return;
    }

    // Read as Base64 Data URL
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setHasNewSelection(true);
      setZoom(1);
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
      toast.error("Unable to read selected image.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    if (!previewUrl || !hasNewSelection) {
      onClose();
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await apiFetch("/users/me/avatar", {
        method: "PUT",
        body: JSON.stringify({ avatarUrl: previewUrl }),
      });

      if (res.success) {
        toast.success("Profile photo updated successfully!");
        await refreshUser();
        onSuccess?.(previewUrl);
        onClose();
      } else {
        const msg = res.error || "Failed to upload photo.";
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err.message || "Failed to save profile photo.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    setError(null);

    try {
      const res = await apiFetch("/users/me/avatar", {
        method: "DELETE",
      });

      if (res.success) {
        toast.success("Profile photo removed.");
        setPreviewUrl(null);
        setHasNewSelection(false);
        await refreshUser();
        onSuccess?.(null);
        onClose();
      } else {
        const msg = res.error || "Failed to remove photo.";
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err.message || "Failed to remove profile photo.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-modal-title"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 id="avatar-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Profile Photo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload a professional avatar for your account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Interactive Preview Area */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative group">
              <div
                className="relative overflow-hidden rounded-full ring-4 ring-brand-500/20 dark:ring-brand-500/30 shadow-lg"
                style={{ width: "128px", height: "128px" }}
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover transition-transform duration-150"
                    style={{ transform: `scale(${zoom})` }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-extrabold uppercase">
                    <Avatar fallback={userName} size="2xl" />
                  </div>
                )}
              </div>

              {/* Camera overlay badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-1 right-1 p-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-md transition-transform hover:scale-105"
                title="Choose new image"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* Zoom / scale slider if image is selected */}
            {previewUrl && (
              <div className="w-full max-w-xs flex items-center gap-3 pt-1">
                <ZoomOut className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="range"
                  min="1"
                  max="1.8"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-brand-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  aria-label="Zoom avatar preview"
                />
                <ZoomIn className="h-4 w-4 text-slate-400 shrink-0" />
              </div>
            )}
          </div>

          {/* Drag and drop upload zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!uploading) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all duration-200 ${
              dragOver
                ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/20"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:border-brand-400 dark:hover:border-brand-600 hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              onChange={(e) => handleFile(e.target.files?.[0])}
              disabled={uploading}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <UploadCloud className="h-6 w-6 text-brand-600 dark:text-brand-400" />
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                <span className="text-brand-600 dark:text-brand-400 hover:underline">Click to upload</span> or drag and drop
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                JPEG, PNG, WebP, or GIF (max 3MB)
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            {(previewUrl || currentAvatarUrl) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={uploading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={uploading || !hasNewSelection}
              className="text-xs font-bold gap-1.5 bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
            >
              {uploading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Save Photo
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
