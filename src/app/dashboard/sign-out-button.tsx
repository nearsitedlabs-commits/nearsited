"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SignOutButton({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (compact) {
    return (
      <Button variant="icon" icon={<LogOut className="h-4 w-4" />} onClick={handleSignOut}>
        Sign out
      </Button>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
