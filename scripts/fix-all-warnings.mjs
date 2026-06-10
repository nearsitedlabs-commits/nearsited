import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const ROOT = process.cwd();

function fix(file, replacements) {
  const fp = resolve(ROOT, file);
  let content = readFileSync(fp, "utf8");
  let changed = false;
  for (const [from, to] of replacements) {
    const idx = content.indexOf(from);
    if (idx >= 0) {
      content = content.slice(0, idx) + to + content.slice(idx + from.length);
      changed = true;
      console.log(`  OK: ${file} -> ${from.substring(0, 50)}...`);
    } else {
      console.log(`  MISS: ${file} -> ${from.substring(0, 50)}...`);
    }
  }
  if (changed) writeFileSync(fp, content, "utf8");
}

// Audit page - remove X from imports
fix("src/app/dashboard/audit/page.tsx", [
  [`import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Search, X } from "lucide-react";`,
   `import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Search } from "lucide-react";`],
]);

// Discover page - prefix unused import name
fix("src/app/dashboard/discover/page.tsx", [
  [`  noWebsiteOpportunityScore,`,
   `  _noWebsiteOpportunityScore,`],
]);

// LeadHeaderStrip - prefix unused arg
fix("src/app/dashboard/leads/[id]/components/LeadHeaderStrip.tsx", [
  [`  businessId: string;`,
   `  _businessId: string;`],
]);

// PitchCard - remove unused import, prefix unused arg
fix("src/app/dashboard/leads/[id]/components/PitchCard.tsx", [
  [`import { ChevronDown, Copy, ExternalLink, Loader2, Share2, Sparkles, Trash2 } from "lucide-react";`,
   `import { Copy, ExternalLink, Loader2, Share2, Sparkles, Trash2 } from "lucide-react";`],
  [`  businessId: string;`,
   `  _businessId: string;`],
]);

// no-digital-presence-page - remove unused icon imports
fix("src/app/dashboard/leads/[id]/components/no-digital-presence-page.tsx", [
  [`Copy, Loader2, Mail, Phone, RefreshCw, Send`, `Loader2`],
]);

// social-opportunity-page - remove unused icon imports
fix("src/app/dashboard/leads/[id]/components/social-opportunity-page.tsx", [
  [`Mail, Phone`, ` `],
]);

// lead-detail-client - remove SubScore import
fix("src/app/dashboard/leads/[id]/lead-detail-client.tsx", [
  [`SubScore,`, ` `],
]);

// LeadActionCell - prefix unused arg
fix("src/app/dashboard/leads/components/LeadActionCell.tsx", [
  [`  onPitch,`, `  _onPitch,`],
]);

// LeadsTable - remove Loader2, prefix unused arg
fix("src/app/dashboard/leads/components/LeadsTable.tsx", [
  [`Loader2,`, ` `],
  [`  setExpandedClusters,`, `  _setExpandedClusters,`],
]);

// pipeline page - remove unused import
fix("src/app/dashboard/pipeline/page.tsx", [
  [`PipelineCard,`, ` `],
]);

// LandingHero - prefix unused type var
fix("src/components/landing/LandingHero.tsx", [
  [`const OPP_TYPES`, `const _OPP_TYPES`],
]);

// ScoreRing - prefix unused var
fix("src/components/ui/ScoreRing.tsx", [
  [`const isOpp`, `const _isOpp`],
]);

console.log("\nDone!");
