import { readFileSync, writeFileSync } from "fs";

// Fix pitches/page.tsx
let p = readFileSync("src/app/dashboard/pitches/page.tsx", "utf8");
let idx = p.indexOf("That's all your pitches.");
if (idx >= 0) {
  p = p.slice(0, idx) + "That's all your pitches." + p.slice(idx + "That's all your pitches.".length);
  writeFileSync("src/app/dashboard/pitches/page.tsx", p, "utf8");
  console.log("Fixed pitches - replaced at index", idx);
} else {
  console.log("NOT FOUND in pitches");
}

// Fix ExampleReportModal.tsx
let e = readFileSync("src/app/dashboard/audit/components/ExampleReportModal.tsx", "utf8");
let replacements = [
  ["I'd be happy to share a few ideas that could help improve results.", "I'd be happy to share a few ideas that could help improve results."],
  ["I noticed your business doesn't have a website yet. In today's", "I noticed your business doesn't have a website yet. In today's"],
  ["I'd be happy to discuss how we could help.", "I'd be happy to discuss how we could help."],
  ["I noticed you're doing a great job engaging customers on social media.", "I noticed you're doing a great job engaging customers on social media."],
  ["However, without a dedicated website, you're leaving search visibility", "However, without a dedicated website, you're leaving search visibility"],
  ["I'd love to show you what that could look like.", "I'd love to show you what that could look like."],
];
let count = 0;
for (const [from, to] of replacements) {
  let i = e.indexOf(from);
  if (i >= 0) {
    e = e.slice(0, i) + to + e.slice(i + from.length);
    count++;
  }
}
if (count > 0) {
  writeFileSync("src/app/dashboard/audit/components/ExampleReportModal.tsx", e, "utf8");
  console.log("Fixed ExampleReportModal -", count, "replacements");
} else {
  console.log("No replacements made in ExampleReportModal");
}
