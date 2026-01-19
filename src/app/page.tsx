import { getMilestones, isAdmin } from "@/lib/actions/milestones";
import { MilestoneCardGrid } from "@/components/molecules/milestone-card-grid";

export default async function Home() {
  const [milestonesResult, adminStatus] = await Promise.all([
    getMilestones(),
    isAdmin(),
  ]);

  const milestones = milestonesResult.success
    ? (milestonesResult.data ?? [])
    : [];

  return (
    <div className="min-h-screen bg-background">
      <main className="sm:pb-0 pb-[30%] flex flex-col gap-8 p-4 sm:p-6 max-w-5xl mx-auto min-h-screen">
        <div className="mt-3">
          <h1 className="font-bold text-3xl text-center">
            GKY Gerendeng Milestone
          </h1>
          <p className="text-center text-muted-foreground"></p>
        </div>
        <MilestoneCardGrid milestones={milestones} isAdmin={adminStatus} />
      </main>
    </div>
  );
}
