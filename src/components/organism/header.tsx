import { Separator } from "@/components/shadcn/separator";
import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "@/components/molecules/mode-toggle";

export function Header() {
  return (
    <>
      <header className="flex flex-row items-center justify-between py-2.5 sm:py-2.5 px-4 sm:p-6 max-w-5xl mx-auto">
        <div>
          <Link href="/" className="flex flex-row items-center gap-1 w-fit ">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={50}
              height={50}
              className="-ml-2"
            />
            <h1 className="text-2xl sm:text-3xl font-bold">Journey</h1>
          </Link>
        </div>
        <div>
          <ModeToggle />
        </div>
      </header>
      <Separator className="border-b border-border/20" />
    </>
  );
}
