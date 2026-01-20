"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CalendarIcon,
  FileText,
  Upload,
  X,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/shadcn/field";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Calendar } from "@/components/shadcn/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { createMilestone } from "@/lib/actions/milestones";
import { uploadMilestoneImage } from "@/lib/actions/storage";

interface MilestoneFormProps {
  className?: string;
}

const MAX_FILE_SIZE = 1000 * 1024; // 1MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function MilestoneForm({ className }: MilestoneFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Feedback state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Preview URL
  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : null;

  /**
   * Validasi form sebelum submit
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Judul wajib diisi";
    } else if (title.length > 200) {
      errors.title = "Judul maksimal 200 karakter";
    }

    if (!eventDate) {
      errors.eventDate = "Tanggal wajib diisi";
    }

    if (description.length > 2000) {
      errors.description = "Deskripsi maksimal 2000 karakter";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Validasi file gambar
   */
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Tipe file tidak didukung. Gunakan JPEG, PNG, atau WebP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Ukuran file terlalu besar (${(file.size / 1024).toFixed(0)}KB). Maksimal 1MB.`;
    }
    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, image: error }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, image: "" }));
    setImageFile(file);
  };

  /**
   * Handle file input change
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  /**
   * Handle drag and drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      let imageUrl: string | undefined;

      // Upload gambar jika ada
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const uploadResult = await uploadMilestoneImage(formData);
        if (!uploadResult.success) {
          setError(uploadResult.error || "Gagal mengupload gambar");
          return;
        }
        imageUrl = uploadResult.url;
      }

      const result = await createMilestone({
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate ? format(eventDate, "yyyy-MM-dd") : "",
        image_url: imageUrl,
      });

      if (result.success) {
        setSuccess("Journey berhasil ditambahkan!");
        // Reset form
        setTitle("");
        setDescription("");
        setEventDate(undefined);
        setImageFile(null);
        setFieldErrors({});

        // Redirect ke home setelah 1.5 detik
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      } else {
        setError(result.error || "Gagal menambahkan journey");
      }
    });
  };

  /**
   * Reset form
   */
  const handleReset = () => {
    setTitle("");
    setDescription("");
    setEventDate(undefined);
    setImageFile(null);
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" />
          Form Journey
        </CardTitle>
        <CardDescription>
          Isi detail journey yang ingin ditambahkan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="space-y-0">
            {/* Pesan Error Global */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Pesan Sukses */}
            {success && (
              <div className="rounded-md bg-green-500/10 p-3 text-center text-sm text-green-600 dark:text-green-400">
                {success}
              </div>
            )}

            {/* Judul */}
            <Field>
              <FieldLabel htmlFor="title">
                Judul <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="title"
                type="text"
                placeholder="Contoh: Ibadah Natal 2025"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) {
                    setFieldErrors((prev) => ({ ...prev, title: "" }));
                  }
                }}
                disabled={isPending}
                maxLength={200}
                className={fieldErrors.title ? "border-destructive" : ""}
              />
              {fieldErrors.title && (
                <FieldError className="text-destructive">
                  {fieldErrors.title}
                </FieldError>
              )}
              <FieldDescription>{title.length}/200 karakter</FieldDescription>
            </Field>

            {/* Tanggal Event */}
            <Field>
              <FieldLabel>
                <span className="flex items-center gap-2">
                  <CalendarIcon className="size-4" />
                  Tanggal Event <span className="text-destructive">*</span>
                </span>
              </FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isPending}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventDate && "text-muted-foreground",
                      fieldErrors.eventDate && "border-destructive",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {eventDate
                      ? format(eventDate, "d MMMM yyyy", { locale: id })
                      : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={(date) => {
                      setEventDate(date);
                      if (fieldErrors.eventDate) {
                        setFieldErrors((prev) => ({ ...prev, eventDate: "" }));
                      }
                    }}
                    captionLayout="dropdown"
                    startMonth={new Date(new Date().getFullYear() - 100, 0)}
                    endMonth={new Date(new Date().getFullYear() + 50, 11)}
                  />
                </PopoverContent>
              </Popover>
              {fieldErrors.eventDate && (
                <FieldError className="text-destructive">
                  {fieldErrors.eventDate}
                </FieldError>
              )}
            </Field>

            {/* Deskripsi */}
            <Field>
              <FieldLabel htmlFor="description">Deskripsi</FieldLabel>
              <Textarea
                id="description"
                placeholder="Deskripsi detail tentang journey ini..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (fieldErrors.description) {
                    setFieldErrors((prev) => ({ ...prev, description: "" }));
                  }
                }}
                disabled={isPending}
                rows={4}
                maxLength={2000}
                className={fieldErrors.description ? "border-destructive" : ""}
              />
              {fieldErrors.description && (
                <FieldError className="text-destructive">
                  {fieldErrors.description}
                </FieldError>
              )}
              <FieldDescription>
                {description.length}/2000 karakter (opsional)
              </FieldDescription>
            </Field>

            {/* Upload Gambar */}
            <Field>
              <FieldLabel>
                <span className="flex items-center gap-2">
                  <Upload className="size-4" />
                  Gambar
                </span>
              </FieldLabel>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={isPending}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative rounded-lg border overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  {!isPending && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 size-8"
                      onClick={() => {
                        setImageFile(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                  <div className="absolute bottom-2 left-2 bg-background/80 rounded px-2 py-1 text-xs">
                    {imageFile?.name} (
                    {((imageFile?.size || 0) / 1024).toFixed(0)}KB)
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !isPending && fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isPending) setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50",
                    isPending && "opacity-50 cursor-not-allowed",
                    fieldErrors.image && "border-destructive",
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

              {fieldErrors.image && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <p>{fieldErrors.image}</p>
                  {fieldErrors.image.includes("1MB") && (
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

              <FieldDescription>
                Upload gambar untuk journey (opsional)
              </FieldDescription>
            </Field>

            {/* Tombol Aksi */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isPending}
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isPending || !title || !eventDate}
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Journey"
                )}
              </Button>
            </div>

            {/* Link Kembali */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground cursor-pointer"
              >
                ← Kembali ke Beranda
              </button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
