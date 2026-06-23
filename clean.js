import fs from 'fs';
let s = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');
const start = s.indexOf(`  if (['staff', 'viewer'].includes(`);
const end = s.indexOf(`  return (\n    <div className="space-y-8 pb-10">`, start);
if (start !== -1 && end !== -1) {
    s = s.substring(0, start) + s.substring(end);
    fs.writeFileSync('src/components/DashboardView.tsx', s);
    console.log("Success");
} else {
    console.log("Not found");
}
