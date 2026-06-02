import fs from "fs";
let buf = fs.readFileSync("src/app/dashboard/audit/page.tsx");
let count = 0;
const apos = 0x27; // ASCII apostrophe
const amp = 0x26;  // &
const a = 0x61;     // a
const p = 0x70;     // p
const o = 0x6F;     // o
const s = 0x73;     // s
const semi = 0x3B;  // ;

// We need to replace ' with ' but only in JSX text content (between > and <)
// Simple approach: replace ALL ' with ' everywhere except in attribute strings
// First pass: find all positions of '
const positions = [];
for (let i = 0; i < buf.length; i++) {
  if (buf[i] === apos) positions.push(i);
}

// Build the new buffer
const result = [];
let lastPos = 0;
for (const pos of positions) {
  // Check if this ' is inside a JSX text content (between > and <)
  // Look backwards for the nearest > or <
  let j = pos - 1;
  let foundOpen = false;
  let foundClose = false;
  while (j >= 0 && j > pos - 200) {
    if (buf[j] === 0x3E) { foundOpen = true; break; } // >
    if (buf[j] === 0x3C) { foundClose = true; break; } // <
    j--;
  }
  
  // If we found a > (open tag ended) and no < before it, we're in text content
  if (foundOpen && !foundClose) {
    // Check forward for <
    let k = pos + 1;
    let foundEnd = false;
    while (k < buf.length && k < pos + 500) {
      if (buf[k] === 0x3C) { foundEnd = true; break; } // <
      k++;
    }
    if (foundEnd) {
      // This ' is in text content - replace with '
      result.push(buf.slice(lastPos, pos));
      result.push(Buffer.from([amp, a, p, o, s, semi]));
      lastPos = pos + 1;
      count++;
    }
  }
}
result.push(buf.slice(lastPos));

const newBuf = Buffer.concat(result);
fs.writeFileSync("src/app/dashboard/audit/page.tsx", newBuf);
console.log(`Replaced ${count} apostrophes`);
