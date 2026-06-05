"use client";

import { useEffect, useState } from "react";

type ContactInfoState = { email: string | null; phone: string | null; loading: boolean };

export function useContactInfo(businessId: string) {
  const [contactInfo, setContactInfo] = useState<ContactInfoState>({
    email: null,
    phone: null,
    loading: true,
  });
  const [manualEmail, setManualEmail] = useState("");

  useEffect(() => {
    if (!businessId) {
      setContactInfo((prev) => ({ ...prev, loading: false }));
      return;
    }
    Promise.all([
      fetch(`/api/contact-info?businessId=${businessId}`)
        .then((res) => res.json())
        .then((data: { email?: string | null; phone?: string | null }) => {
          setContactInfo({ email: data.email ?? null, phone: data.phone ?? null, loading: false });
        })
        .catch((err) => {
          console.error("[LEAD-DETAIL] contact-info fetch failed:", err);
          setContactInfo((prev) => ({ ...prev, loading: false }));
        }),
      fetch("/api/refresh-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      }).catch((err) => {
        console.error("[LEAD-DETAIL] refresh-ratings failed:", err);
      }),
    ]);
  }, [businessId]);

  return { contactInfo, manualEmail, setManualEmail };
}
