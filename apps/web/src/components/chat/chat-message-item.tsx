"use client";

import * as React from "react";
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Download,
  Ban,
  Pencil,
  Trash2,
  Copy,
  Check as CopyCheck,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatFileSize, getFileIcon } from "@/components/ui/file-attachment-upload";
import { cn } from "@/lib/utils";

export interface ChatAttachment {
  id?: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface ChatMessageData {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  senderRole?: string;
  isSender: boolean;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  attachments?: ChatAttachment[];
  pending?: boolean;
  error?: boolean;
}

interface ChatMessageItemProps {
  message: ChatMessageData;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  onRetry?: (message: ChatMessageData) => void;
  onEdit?: (message: ChatMessageData) => void;
  onDelete?: (message: ChatMessageData) => void;
}

export function ChatMessageItem({
  message,
  isFirstInGroup = true,
  isLastInGroup = true,
  onRetry,
  onEdit,
  onDelete,
}: ChatMessageItemProps) {
  const isSender = message.isSender;
  const isDeleted = message.isDeleted || message.content === "This message was deleted";
  const [copied, setCopied] = React.useState(false);

  const timeString = React.useMemo(() => {
    try {
      return new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }, [message.createdAt]);

  const handleCopy = () => {
    if (isDeleted || !message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 duration-200",
        isSender ? "items-end" : "items-start",
        isFirstInGroup ? "mt-3" : "mt-1"
      )}
    >
      {/* Sender name & timestamp header (only on first message in group) */}
      {isFirstInGroup && (
        <div
          className={cn(
            "flex items-center gap-2 mb-1 px-1 text-[11px]",
            isSender ? "flex-row-reverse" : "flex-row"
          )}
        >
          {!isSender && (
            <Avatar
              src={message.senderAvatar}
              fallback={message.senderName}
              size="xs"
              className="ring-1 ring-white dark:ring-slate-900"
            />
          )}
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {isSender ? "You" : message.senderName}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {timeString}
          </span>
        </div>
      )}

      {/* Message Bubble Row + Hover Actions */}
      <div
        className={cn(
          "relative flex items-end gap-1.5 max-w-[85%] sm:max-w-[75%]",
          isSender && "flex-row-reverse"
        )}
      >
        {/* Floating Quick Action Bar on hover */}
        {!isDeleted && !message.pending && !message.error && (
          <div
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute top-0 -translate-y-1/2 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md px-1.5 py-0.5 z-10 gap-1",
              isSender ? "left-0 -translate-x-full mr-2" : "right-0 translate-x-full ml-2"
            )}
          >
            {isSender && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(message)}
                className="p-1 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                title="Edit message"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {isSender && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(message)}
                className="p-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                title="Delete message"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title={copied ? "Copied!" : "Copy text"}
            >
              {copied ? <CopyCheck className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed break-words whitespace-pre-line shadow-xs transition-all duration-150",
            isDeleted
              ? "bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 italic flex items-center gap-1.5"
              : isSender
              ? "bg-brand-600 text-white"
              : "bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100",
            // Rounded corner tweaks based on grouping
            isSender && isFirstInGroup && !isLastInGroup && "rounded-br-md",
            isSender && !isFirstInGroup && !isLastInGroup && "rounded-r-md",
            isSender && isLastInGroup && "rounded-br-none",
            !isSender && isFirstInGroup && !isLastInGroup && "rounded-bl-md",
            !isSender && !isFirstInGroup && !isLastInGroup && "rounded-l-md",
            !isSender && isLastInGroup && "rounded-bl-none",
            message.pending && "opacity-75"
          )}
        >
          {/* Deleted message render */}
          {isDeleted ? (
            <div className="flex items-center gap-1.5 text-xs select-none">
              <Ban className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span>This message was deleted</span>
            </div>
          ) : (
            <>
              {/* Text content */}
              {message.content && (
                <div className="leading-relaxed selection:bg-brand-400 selection:text-white">
                  {message.content}
                </div>
              )}

              {/* Attachments preview */}
              {message.attachments && message.attachments.length > 0 && (
                <div
                  className={cn(
                    "space-y-2 mt-2 pt-2 border-t",
                    isSender
                      ? "border-brand-500/40"
                      : "border-slate-100 dark:border-slate-700"
                  )}
                >
                  {message.attachments.map((att, idx) => {
                    const isImg =
                      att.mimeType?.startsWith("image/") ||
                      /\.(png|jpe?g|webp|gif)$/i.test(att.fileName);

                    if (isImg && att.fileUrl) {
                      return (
                        <div key={idx} className="rounded-lg overflow-hidden max-w-xs border border-white/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att.fileUrl}
                            alt={att.fileName}
                            className="w-full max-h-48 object-cover rounded-lg"
                          />
                          <div className="p-1.5 bg-black/40 text-white flex items-center justify-between text-[10px]">
                            <span className="truncate max-w-[150px]">{att.fileName}</span>
                            <a
                              href={att.fileUrl}
                              download={att.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <a
                        key={idx}
                        href={att.fileUrl}
                        download={att.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center justify-between gap-2 p-2 rounded-lg text-xs font-medium transition-colors",
                          isSender
                            ? "bg-brand-700/60 hover:bg-brand-700 text-white"
                            : "bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          {getFileIcon(att.mimeType || "", att.fileName)}
                          <span className="truncate max-w-[160px]">{att.fileName}</span>
                          {att.sizeBytes ? (
                            <span className="text-[10px] opacity-75">
                              ({formatFileSize(att.sizeBytes)})
                            </span>
                          ) : null}
                        </div>
                        <Download className="h-3.5 w-3.5 shrink-0 opacity-80" />
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Timestamp & Edited Indicator inside bubble bottom right */}
              <div
                className={cn(
                  "flex items-center justify-end gap-1 mt-1 text-[10px] select-none",
                  isSender ? "text-brand-100/90" : "text-slate-400 dark:text-slate-500"
                )}
              >
                {message.isEdited && (
                  <span className="italic opacity-80 mr-0.5">edited</span>
                )}
                <span>{timeString}</span>

                {/* WhatsApp double checkmarks */}
                {isSender && (
                  <span className="ml-0.5 inline-flex items-center" title={message.pending ? "Sending..." : "Delivered & Read"}>
                    {message.pending ? (
                      <Clock className="h-2.5 w-2.5 animate-pulse" />
                    ) : (
                      <CheckCheck className="h-3 w-3 text-emerald-300 dark:text-emerald-400" />
                    )}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Delivery / Retry error state (outside bubble) */}
        {isSender && message.error && (
          <div className="shrink-0 mb-0.5">
            <button
              type="button"
              onClick={() => onRetry?.(message)}
              className="text-rose-500 hover:text-rose-600 flex items-center gap-0.5 text-[10px] font-bold"
              title="Send failed. Click to retry."
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

