"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Ellipsis } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import type { Milestone } from "@/lib/types/milestones";

interface MilestoneCardGridProps {
  milestones: Milestone[];
  isAdmin?: boolean;
}

/**
 * Format date to Indonesian locale
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function MilestoneCardGrid({
  milestones,
  isAdmin = false,
}: MilestoneCardGridProps) {
  if (milestones.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Belum ada milestone.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {milestones.map((item) => (
        <Dialog key={item.id}>
          <DialogTrigger asChild>
            <div className="w-full space-y-3 cursor-pointer group">
              <div className="relative rounded-lg overflow-hidden">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    width={1000}
                    height={1000}
                    className="transition group-hover:scale-105 aspect-video object-cover"
                  />
                ) : (
                  <Image
                    src="/images/sample.jpg"
                    alt={item.title}
                    width={1000}
                    height={1000}
                    className="transition group-hover:scale-105 aspect-video object-cover"
                  />
                )}

                {/* Admin controls */}
                {isAdmin && (
                  <div className="absolute top-1 right-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-background/40 dark:bg-primary/40 hover:bg-background/50 hover:dark:bg-primary/50 border-none text-background hover:text-background dark:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Ellipsis />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-fit bg-transparent p-0 border-none">
                        <Button
                          onClick={(e) => e.stopPropagation()}
                          variant="default"
                          className="h-8 rounded-sm"
                        >
                          Edit
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              <div className="space-y-1 px-1 sm:px-0">
                <h1 className="font-bold text-base sm:text-lg">{item.title}</h1>
                <p className="text-muted-foreground text-sm">
                  {formatDate(item.event_date)}
                </p>
                {item.description && (
                  <p className="text-muted-foreground line-clamp-2 sm:text-base text-sm">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{item.title}</DialogTitle>
              <p className="text-muted-foreground text-sm">
                {formatDate(item.event_date)}
              </p>
              {item.description && (
                <DialogDescription>{item.description}</DialogDescription>
              )}
            </DialogHeader>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
