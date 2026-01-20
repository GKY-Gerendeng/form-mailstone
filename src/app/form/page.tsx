import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/actions/milestones";
import { getUser } from "@/lib/actions/auth";
import { MilestoneForm } from "@/components/organism/milestone-form";
import { Header } from "@/components/organism/header";

/**
 * Halaman form untuk membuat milestone baru
 * DILINDUNGI: Hanya admin yang bisa mengakses
 */
export default async function FormPage() {
  // Verifikasi user terautentikasi
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  // Verifikasi user adalah admin
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    redirect("/?error=unauthorized");
  }

  return (
    <div className="relative">
      <div className="absolute top-0 w-full">
        <Header />
        <div className="pb-[8%] bg-background">
          <main className="flex flex-col gap-8 min-h-svh p-4 sm:p-6 max-w-2xl mx-auto">
            <div className="mt-3">
              <h1 className="font-bold text-2xl sm:text-3xl text-center">
                Tambah Journey Baru
              </h1>
              <p className="text-center text-sm sm:text-base text-muted-foreground mt-2">
                Isi form di bawah untuk menambahkan journey baru
              </p>
            </div>
            <MilestoneForm />
          </main>
        </div>
      </div>
    </div>
  );
}
