"use client";

import { BottomNav } from "@/components/ui/mobile/BottomNav";
import { MOBILE_NAV } from "@/lib/nav-constants";

export default function MobileBottomNav() {
  return <BottomNav items={MOBILE_NAV} />;
}
