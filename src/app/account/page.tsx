import { redirect } from "next/navigation";
import { getUser, signOut } from "@/lib/actions/auth";
import { AccountCard } from "@/components/organism/account-card";
import { Header } from "@/components/organism/header";

export default async function AccountPage() {
  const user = await getUser();

  // Redirect ke login jika tidak terautentikasi
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="relative">
      <div className="absolute top-0 w-full">
        <Header />
        <div className="bg-background flex min-h-svh flex-col items-center justify-start md:justify-center gap-6 p-6">
          <div className="mt-[6%] md:-mt-[16%] w-full max-w-md">
            <AccountCard user={user} signOutAction={signOut} />
          </div>
        </div>
      </div>
    </div>
  );
}
