"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/shadcn/button";

interface ImageUploadProps {
  value?: File | null;
  existingUrl?: string;
  onChange: (file: File | null) => void;
  onRemoveExisting?: () => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const MAX_FILE_SIZE = 1000 * 1024; // 1MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({
  value,
  existingUrl,
  onChange,
  onRemoveExisting,
  disabled,
  error,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const previewUrl = value ? URL.createObjectURL(value) : existingUrl;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Tipe file tidak didukung. Gunakan JPEG, PNG, atau WebP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Ukuran file terlalu besar (${(file.size / 1024).toFixed(0)}KB). Maksimal 1MB.`;
    }
    return null;
  };

  const handleFile = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setLocalError(error);
      return;
    }
    setLocalError(null);
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayError = error || localError;

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative rounded-lg border overflow-hidden">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 size-8"
              onClick={existingUrl && !value ? onRemoveExisting : handleRemove}
            >
              <X className="size-4" />
            </Button>
          )}
          {value && (
            <div className="absolute bottom-2 left-2 bg-background/80 rounded px-2 py-1 text-xs">
              {value.name} ({(value.size / 1024).toFixed(0)}KB)
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed",
            displayError && "border-destructive",
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-muted p-3">
              <Upload className="size-6 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium">
              Klik atau drag gambar ke sini
            </div>
            <div className="text-xs text-muted-foreground">
              JPEG, PNG, WebP (max 1MB)
            </div>
          </div>
        </div>
      )}

      {displayError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <p>{displayError}</p>
          {displayError.includes("1MB") && (
            <a
              href="https://compressjpeg.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1 underline hover:no-underline"
            >
              Compress gambar di sini
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
