"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { LogOut, Mail, User as UserIcon, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Separator } from "@/components/shadcn/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";

interface AccountCardProps {
  user: User;
  signOutAction: () => Promise<never>;
}

export function AccountCard({ user, signOutAction }: AccountCardProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const avatarUrl = user.user_metadata?.avatar_url;
  const provider = user.app_metadata?.provider || "email";

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOutAction();
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              width={80}
              height={80}
              className="size-20 rounded-full border-2 border-border object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-muted">
              <UserIcon className="size-10 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardTitle>{displayName}</CardTitle>
        <CardDescription className="flex items-center justify-center gap-1.5">
          <Mail className="size-3.5" />
          {user.email}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Separator />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Provider</span>
            <span className="font-medium capitalize">{provider}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs">{user.id.slice(0, 8)}...</span>
          </div>

          {user.created_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span className="font-medium">
                {new Date(user.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              className="w-full"
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 size-4" />
              Sign Out
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Logout</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin keluar dari akun ini?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isLoggingOut}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 size-4" />
                    Ya, Logout
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
