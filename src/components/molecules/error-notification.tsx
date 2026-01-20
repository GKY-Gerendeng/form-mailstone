"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Komponen untuk menampilkan notifikasi error dari URL params menggunakan Sonner
 */
export function ErrorNotification() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "unauthorized" && !hasShownToast.current) {
      hasShownToast.current = true;

      // Tampilkan toast error
      toast.error("Akses Ditolak", {
        id: "unauthorized-error",
        description:
          "Anda bukan admin. Hanya admin yang dapat menambah atau mengedit journey.",
        duration: 5000,
      });

      // Hapus error param dari URL
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      router.replace(url.pathname, { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
