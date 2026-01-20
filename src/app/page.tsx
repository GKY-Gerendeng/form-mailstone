import { getMilestones, isAdmin } from "@/lib/actions/milestones";
import { MilestoneCardGrid } from "@/components/molecules/milestone-card-grid";
import { ErrorNotification } from "@/components/molecules/error-notification";
import { Suspense } from "react";
import { Header } from "@/components/organism/header";

export default async function Home() {
  const [milestonesResult, adminStatus] = await Promise.all([
    getMilestones(),
    isAdmin(),
  ]);

  const milestones = milestonesResult.success
    ? (milestonesResult.data ?? [])
    : [];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <Suspense fallback={null}>
          <ErrorNotification />
        </Suspense>
        <main className="mt-6 sm:pb-0 pb-[30%] flex flex-col gap-8 p-4 sm:p-6 max-w-5xl mx-auto min-h-screen">
          <MilestoneCardGrid milestones={milestones} isAdmin={adminStatus} />
        </main>
      </div>
    </>
  );
}
