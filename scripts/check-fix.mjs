import { readFileSync } from "fs";

const lines = readFileSync("src/app/dashboard/pitches/page.tsx", "utf8").split("\n");
const l = lines[622];
console.log("Line 623:", l);
console.log("Has ':", l.includes("'"));
