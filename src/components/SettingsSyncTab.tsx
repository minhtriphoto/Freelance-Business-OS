import React, { useState, useEffect } from 'react';
import { Cloud, Save, CheckCircle, RefreshCcw, FileText } from 'lucide-react';
import { initAuth, googleSignIn, logout, getAccessToken } from '../lib/auth';
import type { User } from 'firebase/auth';

export default function SettingsSyncTab() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setNeedsAuth(false);
        setUser(user);
        setToken(token);
      },
      () => setNeedsAuth(true)
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setNeedsAuth(true);
    setUser(null);
    setToken(null);
  };

  const handleCreateSpreadsheet = async () => {
    if (!token) return;
    setIsExporting(true);
    setExportStatus('Đang tạo Spreadsheet...');
    try {
      // Create spreadsheet
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: `Freelance OS Backup - ${new Date().toLocaleDateString()}`
          },
          sheets: [
            { properties: { title: "Dự án & Công việc" } }
          ]
        })
      });
      const createData = await createRes.json();
      if (createData.error) {
        throw new Error(createData.error.message);
      }
      
      const spreadsheetId = createData.spreadsheetId;
      setExportStatus(`Đã tạo thành công: ${spreadsheetId}. Đang đồng bộ...`);
      
      // Update with Data
      const projectsStr = localStorage.getItem('freelance_os_projects') || '[]';
      const projects = JSON.parse(projectsStr);
      
      const values = [
        ['Tên Dự Án', 'Khách hàng', 'Trạng thái', 'Tổng tiền (VND)', 'Đã thu (VND)']
      ];
      projects.forEach((p: any) => {
        values.push([
          p.title,
          p.clientName || 'N/A',
          p.status,
          p.financials?.totalValue || 0,
          p.financials?.paidAmount || 0
        ]);
      });

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:E${values.length}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      });

      setExportStatus('Đồng bộ thành công lên Google Sheets!');
    } catch (error: any) {
      console.error(error);
      setExportStatus(`Lỗi đồng bộ: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 border-slate-150">
        <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
          <Cloud size={16} className="text-brand-green-mid" /> Đ. ĐỒNG BỘ GOOGLE DRIVE DỮ LIỆU
        </h3>
        <p className="text-slate-450 text-[11px] mt-1 font-medium">Bảo vệ an toàn thông tin với sao lưu dữ liệu hoạt động tự động lên Google Drive/Sheets.</p>
      </div>

      {!user ? (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-4">
          <div className="w-14 h-14 bg-white shadow flex items-center justify-center rounded-2xl mx-auto">
            <Cloud size={24} className="text-slate-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Kết nối Google Workspace</h4>
            <p className="text-slate-500 text-xs mt-1">Đăng nhập tài khoản Google để thực hiện sao lưu vào Drive của bạn.</p>
          </div>
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="gsi-material-button mx-auto"
            style={{ width: 'fit-content', border: '1px solid #dadce0', borderRadius: '4px', padding: '0 8px', display: 'flex', alignItems: 'center', backgroundColor: '#fff', gap: '8px', cursor: 'pointer', height: '40px' }}
          >
            <div className="gsi-material-button-icon">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{display: 'block', width: '20px', height: '20px'}}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span style={{ fontFamily: 'Roboto, arial, sans-serif', fontSize: '14px', color: '#3c4043', fontWeight: '500' }}>
              {isLoggingIn ? "Đang kết nối..." : "Sign in with Google"}
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50/50 border border-emerald-100/60 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-200">
                  <img src={user.photoURL || ''} referrerPolicy="no-referrer" alt="Avatar" className="w-full h-full object-cover" />
               </div>
               <div>
                  <h4 className="font-bold text-slate-800 text-xs">Đã kết nối Google Drive</h4>
                  <p className="text-3xs text-slate-500 font-medium">{user.email}</p>
               </div>
            </div>
            <button onClick={handleLogout} className="px-3 py-1.5 text-3xs font-medium text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">Ngắt kết nối</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-3xs flex flex-col items-start gap-4">
              <div className="p-3 bg-brand-green-mid/10 text-brand-green-mid rounded-xl">
                <FileText size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-sm">Sao lưu Danh sách Dự án</h4>
                <p className="text-xs text-slate-500">Tạo một tệp Google Sheets mới chứa toàn bộ dữ liệu dự án, khách hàng và trạng thái doanh thu hiện tại.</p>
              </div>
              <button 
                onClick={handleCreateSpreadsheet}
                disabled={isExporting}
                className="mt-auto px-4 py-2 w-full bg-brand-green-mid hover:bg-brand-green-mid-dark text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isExporting ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />} Đồng bộ lên Google Sheets
              </button>
            </div>
          </div>
          
          {exportStatus && (
            <div className="p-4 bg-slate-900 border border-slate-800 text-white rounded-xl flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" />
              <span className="font-bold text-xs">{exportStatus}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
