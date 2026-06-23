import fs from 'fs';
let s = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove UserRole import
s = s.replace(' Appointment, UserRole } from', ' Appointment } from');

// 2. Remove states
s = s.replace(/  \/\/ Phân quyền mô phỏng RBAC[\s\S]*?const \[activeCtvName, setActiveCtvName\] = useState<string>\([\s\S]*?\}\);/m, '');

// 3. Remove localStorage effect
s = s.replace(/  useEffect\(\(\) => \{\n    localStorage.setItem\('freelance_os_user_role'[\s\S]*?\}, \[currentUserRole\]\);\n/m, '');
s = s.replace(/  useEffect\(\(\) => \{\n    localStorage.setItem\('freelance_os_ctv_name'[\s\S]*?\}, \[activeCtvName\]\);\n/m, '');

// 4. filteredProjects -> projects, filteredAppointments -> appointments
s = s.replace(/  \/\/ 1.5 Bộ lọc bảo mật tài chính.*?\[appointments, filteredProjects, currentUserRole\]\);\n/ms, '');
s = s.replace(/projects={filteredProjects}/g, 'projects={projects}');
s = s.replace(/appointments={filteredAppointments}/g, 'appointments={appointments}');

// 5. Remove permission checks in delete/etc
const methods = [
    `    if \\(\\['staff', 'viewer'\\]\\.includes\\(currentUserRole\\)\\) \\{\n      triggerAlert\\('Quyền bị từ chối', 'Vai trò của bạn không có quyền xóa lịch hẹn!'\\);\n      return;\n    \\}`,
    `    if \\(\\['manager', 'accountant', 'staff', 'viewer'\\]\\.includes\\(currentUserRole\\)\\) \\{\n      triggerAlert\\('Quyền bị từ chối', 'Chỉ Owner/Admin mới được xóa khách hàng!'\\);\n      return;\n    \\}`,
    `    if \\(\\['manager', 'accountant', 'staff', 'viewer'\\]\\.includes\\(currentUserRole\\)\\) \\{\n      triggerAlert\\('Quyền bị từ chối', 'Bạn không có quyền xóa báo giá!'\\);\n      return;\n    \\}`,
    `    if \\(\\['manager', 'accountant', 'staff', 'viewer'\\]\\.includes\\(currentUserRole\\)\\) \\{\n      triggerAlert\\('Quyền bị từ chối', 'Bạn không có quyền xóa hợp đồng!'\\);\n      return;\n    \\}`,
    `    if \\(currentUserRole !== 'owner'\\) \\{\n      triggerAlert\\('Quyền bị từ chối', 'Chỉ Chủ tiệm \\(Owner\\) mới có quyền xóa dự án / công việc!'\\);\n      return;\n    \\}`,
    `    if \\(\\['manager', 'staff', 'viewer'\\]\\.includes\\(currentUserRole\\)\\) \\{\n      triggerAlert\\('Quyền bị từ chối', 'Bạn không có quyền xóa giao dịch ngân quỹ!'\\);\n      return;\n    \\}`,
];
methods.forEach(reg => {
    s = s.replace(new RegExp(reg, 'g'), '');
});

// 6. renderTabContent restricted block
s = s.replace(/    \/\/ Restricted Tabs by Role[\s\S]*?    if \(restricted\) \{[\s\S]*?      \);\n    \}\n\n/m, '');

// 7. Remove currentUserRole from props
s = s.replace(/currentUserRole=\{currentUserRole\}\n/g, '');
s = s.replace(/activeCtvName=\{activeCtvName\}\n/g, '');

const start1 = s.indexOf('            {/* Mô phỏng Vai trò */}');
if (start1 !== -1) {
    const endStr = '            </div>';
    const end1 = s.indexOf(endStr, s.indexOf(endStr, start1) + 1); // skip one inner div
    s = s.substring(0, start1) + s.substring(end1 + endStr.length);
}

const start2 = s.indexOf('                {/* Mô phỏng Vai trò (Mobile) */}');
if (start2 !== -1) {
    const endStr = '                </div>';
    const end2 = s.indexOf(endStr, s.indexOf(endStr, start2) + 1);
    s = s.substring(0, start2) + s.substring(end2 + endStr.length);
}


fs.writeFileSync('src/App.tsx', s);
console.log("Success");
