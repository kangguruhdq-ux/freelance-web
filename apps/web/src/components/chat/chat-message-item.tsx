"use client";

import * as React from "react";
import { Check, Clock, AlertCircle, RefreshCw, Paperclip, Download, FileText, Image as ImageIcon } from "lucide-react";
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
  attachments?: ChatAttachment[];
  pending?: boolean;
  error?: boolean;
}

interface ChatMessageItemProps {
  message: ChatMessageData;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  onRetry?: (message: ChatMessageData) => void;
}

export function ChatMessageItem({
  message,
  isFirstInGroup = true,
  isLastInGroup = true,
  onRetry,
}: ChatMessageItemProps) {
  const isSender = message.isSender;

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

  return (
    <div
      className={cn(
        "flex flex-col transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 duration-200",
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

      {/* Message Bubble + Actions */}
      <div className={cn("flex items-end gap-1.5 max-w-[85%] sm:max-w-[75%]", isSender && "flex-row-reverse")}>
        <div
          className={cn(
            "p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed break-words whitespace-pre-line shadow-xs transition-all duration-150",
            isSender
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
        </div>

        {/* Delivery / Status state */}
        {isSender && (
          <div className="shrink-0 text-slate-400 dark:text-slate-500 mb-0.5">
            {message.pending ? (
              <span title="Sending...">
                <Clock className="h-3 w-3 animate-pulse text-slate-400" />
              </span>
            ) : message.error ? (
              <button
                type="button"
                onClick={() => onRetry?.(message)}
                className="text-rose-500 hover:text-rose-600 flex items-center gap-0.5 text-[10px] font-bold"
                title="Send failed. Click to retry."
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>
            ) : (
              <span title="Sent">
                <Check className="h-3 w-3 text-brand-500" />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
