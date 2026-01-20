"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CalendarIcon,
  FileText,
  Trash2,
  Upload,
  X,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import { updateMilestone, deleteMilestone } from "@/lib/actions/milestones";
import {
  uploadMilestoneImage,
  deleteMilestoneImage,
} from "@/lib/actions/storage";
import type { Milestone } from "@/lib/types/milestones";

interface MilestoneEditFormProps {
  milestone: Milestone;
  className?: string;
}

const MAX_FILE_SIZE = 1000 * 1024; // 1MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function MilestoneEditForm({
  milestone,
  className,
}: MilestoneEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state dengan initial values dari milestone
  const [title, setTitle] = useState(milestone.title);
  const [description, setDescription] = useState(milestone.description || "");
  const [eventDate, setEventDate] = useState<Date | undefined>(
    new Date(milestone.event_date),
  );
  const [existingImageUrl, setExistingImageUrl] = useState(
    milestone.image_url || "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Feedback state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Preview URL
  const previewUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : removeExistingImage
      ? null
      : existingImageUrl;

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
    setRemoveExistingImage(false);
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
      let imageUrl: string | undefined = existingImageUrl || undefined;

      // Upload gambar baru jika ada
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const uploadResult = await uploadMilestoneImage(formData);
        if (!uploadResult.success) {
          setError(uploadResult.error || "Gagal mengupload gambar");
          return;
        }
        imageUrl = uploadResult.url;

        // Hapus gambar lama jika ada
        if (existingImageUrl) {
          await deleteMilestoneImage(existingImageUrl);
        }
      } else if (removeExistingImage && existingImageUrl) {
        // Hapus gambar lama tanpa mengganti
        await deleteMilestoneImage(existingImageUrl);
        imageUrl = undefined;
      }

      const result = await updateMilestone({
        id: milestone.id,
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate ? format(eventDate, "yyyy-MM-dd") : undefined,
        image_url: imageUrl || "",
      });

      if (result.success) {
        setSuccess("Milestone berhasil diperbarui!");

        // Redirect ke home setelah 1.5 detik
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      } else {
        setError(result.error || "Gagal memperbarui milestone");
      }
    });
  };

  /**
   * Handle delete milestone
   */
  const handleDelete = () => {
    startDeleteTransition(async () => {
      // Hapus gambar dari storage jika ada
      if (existingImageUrl) {
        await deleteMilestoneImage(existingImageUrl);
      }

      const result = await deleteMilestone(milestone.id);

      if (result.success) {
        setDeleteDialogOpen(false);
        toast.success("Milestone berhasil dihapus!");
        window.location.href = "/";
      } else {
        toast.error(result.error || "Gagal menghapus milestone");
        setDeleteDialogOpen(false);
      }
    });
  };

  /**
   * Reset form ke nilai awal
   */
  const handleReset = () => {
    setTitle(milestone.title);
    setDescription(milestone.description || "");
    setEventDate(new Date(milestone.event_date));
    setExistingImageUrl(milestone.image_url || "");
    setImageFile(null);
    setRemoveExistingImage(false);
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isPendingAny = isPending || isDeleting;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Edit Milestone
            </CardTitle>
            <CardDescription>Perbarui informasi milestone</CardDescription>
          </div>

          {/* Tombol Delete */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="icon" disabled={isPendingAny}>
                <Trash2 className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus Milestone?</DialogTitle>
                <DialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Milestone &quot;
                  {milestone.title}&quot; akan dihapus secara permanen.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    "Hapus"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
                disabled={isPendingAny}
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
                    disabled={isPendingAny}
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
                placeholder="Deskripsi detail tentang milestone ini..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (fieldErrors.description) {
                    setFieldErrors((prev) => ({ ...prev, description: "" }));
                  }
                }}
                disabled={isPendingAny}
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
                disabled={isPendingAny}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative rounded-lg border overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  {!isPendingAny && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 size-8"
                      onClick={() => {
                        if (imageFile) {
                          setImageFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        } else {
                          setRemoveExistingImage(true);
                        }
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                  {imageFile && (
                    <div className="absolute bottom-2 left-2 bg-background/80 rounded px-2 py-1 text-xs">
                      {imageFile.name} ({(imageFile.size / 1024).toFixed(0)}KB)
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => !isPendingAny && fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isPendingAny) setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50",
                    isPendingAny && "opacity-50 cursor-not-allowed",
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
                Upload gambar untuk milestone (opsional)
              </FieldDescription>
            </Field>

            {/* Tombol Aksi */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isPendingAny}
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isPendingAny || !title || !eventDate}
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
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
