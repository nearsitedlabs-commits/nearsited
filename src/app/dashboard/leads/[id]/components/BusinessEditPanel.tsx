"use client";

import { useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { businessTypes } from "@/lib/data/businessTypes";

type LookupResult = {
  found: true;
  name: string;
  address: string | null;
  city: string | null;
  place_id: string;
  rating: number | null;
  review_count: number | null;
  phone: string | null;
  suggested_business_type: string | null;
} | { found: false };

type BusinessEditPanelProps = {
  bizId: string;
  initialName: string;
  initialCity: string | null;
  initialBusinessType: string | null;
  onSaved: (updated: { name: string; city: string | null; business_type: string | null; opportunity_score: number | null; rating: number | null; review_count: number | null }) => void;
  onClose: () => void;
};

export function BusinessEditPanel({ bizId, initialName, initialCity, initialBusinessType, onSaved, onClose }: BusinessEditPanelProps) {
  const [mapsUrl, setMapsUrl] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupHint, setLookupHint] = useState<string | null>(null);
  const [enrichedRating, setEnrichedRating] = useState<number | null>(null);
  const [enrichedReviewCount, setEnrichedReviewCount] = useState<number | null>(null);
  const [enrichedPlaceId, setEnrichedPlaceId] = useState<string | null>(null);
  const [enrichedPhone, setEnrichedPhone] = useState<string | null>(null);

  const [name, setName] = useState(initialName ?? "");
  const [city, setCity] = useState(initialCity ?? "");
  const [businessType, setBusinessType] = useState(initialBusinessType ?? "");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleLookup() {
    const url = mapsUrl.trim();
    if (!url) return;
    setLookupLoading(true);
    setLookupHint(null);
    try {
      const res = await fetch(`/api/places-lookup?mapsUrl=${encodeURIComponent(url)}`);
      const data = await res.json() as LookupResult;
      if (!data.found) {
        setLookupHint("No business found. Check the link or fill in details manually.");
      } else {
        if (data.name) setName(data.name);
        if (data.city) setCity(data.city);
        if (data.suggested_business_type) setBusinessType(data.suggested_business_type);
        setEnrichedRating(data.rating);
        setEnrichedReviewCount(data.review_count);
        setEnrichedPlaceId(data.place_id);
        setEnrichedPhone(data.phone);
        const parts: string[] = [];
        if (data.rating != null) parts.push(`${data.rating.toFixed(1)}★`);
        if (data.review_count != null) parts.push(`${data.review_count} reviews`);
        setLookupHint(parts.length ? `Found. Will also update: ${parts.join(", ")}` : "Found — details filled in below.");
      }
    } catch {
      setLookupHint("Lookup failed. Fill in details manually.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = {};
      if (name.trim()) body.name = name.trim();
      if (city.trim()) body.city = city.trim();
      if (businessType) body.businessType = businessType;
      if (enrichedPlaceId) body.placeId = enrichedPlaceId;
      if (enrichedRating != null) body.rating = enrichedRating;
      if (enrichedReviewCount != null) body.reviewCount = enrichedReviewCount;
      if (enrichedPhone) body.phone = enrichedPhone;

      const res = await fetch(`/api/businesses/${bizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { success: boolean; business?: { name: string; city: string | null; business_type: string | null; opportunity_score: number | null; rating: number | null; review_count: number | null }; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "Failed to save");
      onSaved(data.business!);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "h-10 w-full rounded-lg border bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-tint)]";

  return (
    <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--bg-surface)] p-5 space-y-4">
      {/* Google Maps lookup */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-[var(--text-tertiary)]">Find on Google Maps <span className="text-[var(--text-muted)]">(optional)</span></p>
        <div className="flex gap-2">
          <input
            type="url"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            placeholder="Paste Google Maps link…"
            className={inputCls + " flex-1"}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleLookup(); } }}
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={!mapsUrl.trim() || lookupLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {lookupLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Look up
          </button>
        </div>
        {lookupHint && (
          <p className={`mt-1.5 text-xs ${lookupHint.startsWith("Found") ? "text-[var(--score-good)]" : "text-[var(--text-tertiary)]"}`}>
            {lookupHint}
          </p>
        )}
      </div>

      {/* Manual fields */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-tertiary)]">Business name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emma Sleep" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-tertiary)]">City</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-tertiary)]">Business type</label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className={inputCls + " cursor-pointer"}
          >
            <option value="">Select type…</option>
            {businessTypes.map((bt) => (
              <option key={bt.value} value={bt.value}>{bt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {saveError && (
        <p className="text-xs text-red-400">{saveError}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
