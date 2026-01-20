import { redirect, notFound } from "next/navigation";
import { isAdmin, getMilestoneById } from "@/lib/actions/milestones";
import { getUser } from "@/lib/actions/auth";
import { MilestoneEditForm } from "@/components/organism/milestone-edit-form";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Halaman form untuk mengedit milestone
 * DILINDUNGI: Hanya admin yang bisa mengakses
 */
export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;

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

  // Ambil data milestone
  const milestoneResult = await getMilestoneById(id);
  if (!milestoneResult.success || !milestoneResult.data) {
    notFound();
  }

  return (
    <div className="pb-[8%] min-h-screen bg-background">
      <main className="flex flex-col gap-8 p-4 sm:p-6 max-w-2xl mx-auto min-h-screen pb-24">
        <div className="mt-3">
          <h1 className="font-bold text-2xl sm:text-3xl text-center">
            Edit Journey
          </h1>
          <p className="text-center text-sm sm:text-base text-muted-foreground mt-2">
            Perbarui informasi journey
          </p>
        </div>
        <MilestoneEditForm milestone={milestoneResult.data} />
      </main>
    </div>
  );
}
