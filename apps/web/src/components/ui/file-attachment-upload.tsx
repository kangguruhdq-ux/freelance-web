"use client";

import * as React from "react";
import { UploadCloud, File, FileText, Image as ImageIcon, X, Paperclip } from "lucide-react";

export interface AttachedFile {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}

interface FileAttachmentUploadProps {
  attachments: AttachedFile[];
  onChange: (attachments: AttachedFile[]) => void;
  maxFiles?: number;
  maxSizeBytes?: number; // default 10MB
  accept?: string;
  disabled?: boolean;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(mimeType: string, fileName: string) {
  if (mimeType.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName)) {
    return <ImageIcon className="h-4 w-4 text-brand-500 shrink-0" />;
  }
  if (mimeType === "application/pdf" || /\.pdf$/i.test(fileName)) {
    return <FileText className="h-4 w-4 text-rose-500 shrink-0" />;
  }
  return <File className="h-4 w-4 text-slate-400 shrink-0" />;
}

export function FileAttachmentUpload({
  attachments,
  onChange,
  maxFiles = 5,
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
  accept = ".pdf,.docx,.doc,.txt,.zip,.png,.jpg,.jpeg",
  disabled = false,
}: FileAttachmentUploadProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    if (attachments.length + files.length > maxFiles) {
      setError(`You can attach up to ${maxFiles} files in total.`);
      return;
    }

    const validFiles = Array.from(files).filter((file) => {
      if (file.size > maxSizeBytes) {
        setError(`"${file.name}" exceeds the maximum allowed size (${formatFileSize(maxSizeBytes)}).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    let processedCount = 0;
    const newAttachments: AttachedFile[] = [];

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileUrl = (reader.result as string) || URL.createObjectURL(file);
        newAttachments.push({
          fileName: file.name,
          fileUrl,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });

        processedCount++;
        if (processedCount === validFiles.length) {
          onChange([...attachments, ...newAttachments]);
        }
      };
      reader.onerror = () => {
        processedCount++;
        if (processedCount === validFiles.length && newAttachments.length > 0) {
          onChange([...attachments, ...newAttachments]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeAttachment = (indexToRemove: number) => {
    onChange(attachments.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
          Supporting Documents &amp; Work Samples
        </label>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          Max {maxFiles} files ({formatFileSize(maxSizeBytes)} each)
        </span>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all duration-200 ${
          dragOver
            ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/20"
            : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => processFiles(e.target.files)}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-1.5">
          <div className="h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
            <span className="text-brand-600 dark:text-brand-400 hover:underline">Click to upload</span> or drag and drop
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            PDF, DOCX, ZIP, PNG, or JPG deliverables / case studies
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </p>
      )}

      {/* Uploaded Files List */}
      {attachments.length > 0 && (
        <div className="space-y-2 pt-1">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs shadow-subtle dark:shadow-none animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                {getFileIcon(file.mimeType, file.fileName)}
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                  {file.fileName}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                  ({formatFileSize(file.sizeBytes)})
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAttachment(idx);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Remove attachment"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
