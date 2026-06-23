import fs from 'fs';
let s = fs.readFileSync('src/App.tsx', 'utf8');

const s1 = '          {/* Dev/Demo Controls MVP */}\n          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-2">';
const s1idx = s.indexOf(s1);
if (s1idx !== -1) {
    const end = s.indexOf('          </div>\n        </div>\n      </div>', s1idx);
    s = s.substring(0, s1idx) + s.substring(end + 17);
}

const s2 = '                {/* Dev/Demo Controls MVP (Mobile) */}\n                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl space-y-3">';
const s2idx = s.indexOf(s2);
if (s2idx !== -1) {
    const end = s.indexOf('                </div>\n              </div>\n            </motion.div>', s2idx);
    s = s.substring(0, s2idx) + s.substring(end + 23);
}

fs.writeFileSync('src/App.tsx', s);
console.log("Success");
