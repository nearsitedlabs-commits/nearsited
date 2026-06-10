import { readFileSync, writeFileSync } from "fs";

// Fix pitches/page.tsx
let p = readFileSync("src/app/dashboard/pitches/page.tsx", "utf8");
p = p.replace("That's all your pitches.", "That's all your pitches.");
writeFileSync("src/app/dashboard/pitches/page.tsx", p, "utf8");
console.log("Fixed pitches/page.tsx");

// Fix ExampleReportModal.tsx  
let e = readFileSync("src/app/dashboard/audit/components/ExampleReportModal.tsx", "utf8");
e = e.replace("I'd be happy to share a few ideas that could help improve results.", "I'd be happy to share a few ideas that could help improve results.");
e = e.replace("I noticed your business doesn't have a website yet. In today's", "I noticed your business doesn't have a website yet. In today's");
e = e.replace("I'd be happy to discuss how we could help.", "I'd be happy to discuss how we could help.");
e = e.replace("I noticed you're doing a great job engaging customers on social media.", "I noticed you're doing a great job engaging customers on social media.");
e = e.replace("However, without a dedicated website, you're leaving search visibility", "However, without a dedicated website, you're leaving search visibility");
e = e.replace("I'd love to show you what that could look like.", "I'd love to show you what that could look like.");
writeFileSync("src/app/dashboard/audit/components/ExampleReportModal.tsx", e, "utf8");
console.log("Fixed ExampleReportModal.tsx");
