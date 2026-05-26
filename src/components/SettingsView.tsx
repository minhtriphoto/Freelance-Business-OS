import React, { useState, useEffect } from 'react';
import {
  User,
  Briefcase,
  FileText,
  Bookmark,
  Plus,
  Trash2,
  Edit2,
  Check,
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Percent,
  AlertCircle,
  HelpCircle,
  FileSignature,
  FileCheck,
  Bell,
  CheckCircle,
  Tag,
  Clock,
  DollarSign,
  Undo
} from 'lucide-react';
import { formatVND } from '../utils';

// Types for settings state
export interface ProfileSettings {
  brandName: string;
  householdName: string;
  representative: string;
  phone: string;
  email: string;
  address: string;
  taxCode: string;
  logoUrl: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  qrNotes: string;
}

export interface ServiceSetting {
  id: string;
  name: string;
  defaultPrice: number;
  description: string;
  defaultDurationDays: number;
}

export interface TemplatesSetting {
  quoteHeader: string;
  contractTerms: string;
  paymentReminder: string;
  depositReceipt: string;
  acceptanceReceipt: string;
}

export interface StatusesSetting {
  jobStatuses: string[];
  clientStatuses: string[];
  quoteStatuses: string[];
}

export default function SettingsView() {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'services' | 'templates' | 'statuses'>('profile');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // --- 1. PROFILE SETTINGS ---
  const [profile, setProfile] = useState<ProfileSettings>(() => {
    const saved = localStorage.getItem('freelance_os_profile_settings');
    if (saved) return JSON.parse(saved);
    return {
      brandName: "Minh Trí Media Studio",
      householdName: "Hộ kinh doanh Minh Trí Creative",
      representative: "Nguyễn Minh Trí",
      phone: "0909 123 456",
      email: "minhtri89.no2@gmail.com",
      address: "123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh",
      taxCode: "8032489215",
      logoUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=180&q=80",
      bankName: "Vietcombank (VCB)",
      bankAccount: "1012398574",
      bankHolder: "NGUYEN MINH TRI",
      qrNotes: "Chuyển khoản cọc 50% giá trị hợp đồng creative"
    };
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = () => {
    localStorage.setItem('freelance_os_profile_settings', JSON.stringify(profile));
    triggerSaveAlert("Đã lưu thông tin Cá nhân & Hộ kinh doanh thành công!");
    window.dispatchEvent(new Event('storage_settings_changed'));
  };

  // --- 2. SERVICES LIST ---
  const [services, setServices] = useState<ServiceSetting[]>(() => {
    const saved = localStorage.getItem('freelance_os_services_settings');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'srv-1', name: "Chụp ảnh cá nhân (Outdoor/Studio)", defaultPrice: 2500000, defaultDurationDays: 3, description: "Gói chụp portfolio chân dung 1 người, cam kết tối thiểu 30 ảnh đã retouch kỹ, bàn giao toàn bộ file gốc." },
      { id: 'srv-2', name: "Chụp ảnh sản phẩm & Food", defaultPrice: 5000000, defaultDurationDays: 5, description: "Chụp concept decor nâng cao tại studio, bao gồm thiết kế concept ánh sáng và chuẩn bị phụ kiện chụp cơ bản." },
      { id: 'srv-3', name: "Sản xuất Video ngắn (Reels/TikTok)", defaultPrice: 1500000, defaultDurationDays: 2, description: "Kịch bản quay nhanh, thời lượng 60s, bao gồm dựng phim, chèn phụ đề hiệu ứng và chọn nhạc bắt trend." },
      { id: 'srv-4', name: "Quay dựng TVC Doanh nghiệp", defaultPrice: 15000000, defaultDurationDays: 14, description: "Kịch bản phân cảnh chi tiết, quay chụp 4K, hậu kỳ màu sắc kỹ lưỡng, chỉnh sửa âm thanh bài bản." },
      { id: 'srv-5', name: "Trang điểm sự kiện & Makeup cô dâu", defaultPrice: 1200000, defaultDurationDays: 1, description: "Tone trang điểm tự nhiên cao cấp, đi kèm làm tóc thời trang phù hợp trang phục buổi tiệc." }
    ];
  });

  // Service form state (new or editing)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number>(0);
  const [newServiceDays, setNewServiceDays] = useState<number>(3);
  const [newServiceDesc, setNewServiceDesc] = useState('');

  const handleAddOrUpdateService = () => {
    if (!newServiceName.trim()) {
      alert("Vui lòng nhập tên dịch vụ!");
      return;
    }

    if (editingServiceId) {
      // Update
      setServices(prev => prev.map(s => s.id === editingServiceId ? {
        ...s,
        name: newServiceName,
        defaultPrice: Number(newServicePrice),
        defaultDurationDays: Number(newServiceDays),
        description: newServiceDesc
      } : s));
      setEditingServiceId(null);
    } else {
      // Add
      const newSrv: ServiceSetting = {
        id: `srv-${Date.now()}`,
        name: newServiceName,
        defaultPrice: Number(newServicePrice),
        defaultDurationDays: Number(newServiceDays),
        description: newServiceDesc
      };
      setServices(prev => [...prev, newSrv]);
    }

    // Reset fields
    setNewServiceName('');
    setNewServicePrice(0);
    setNewServiceDays(3);
    setNewServiceDesc('');
  };

  const handleEditClick = (srv: ServiceSetting) => {
    setEditingServiceId(srv.id);
    setNewServiceName(srv.name);
    setNewServicePrice(srv.defaultPrice);
    setNewServiceDays(srv.defaultDurationDays);
    setNewServiceDesc(srv.description);
  };

  const handleDeleteService = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa dịch vụ này khỏi danh mục mặc định? (Sẽ không ảnh hưởng các Job lịch sử đã lập)")) {
      setServices(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleSaveServices = () => {
    localStorage.setItem('freelance_os_services_settings', JSON.stringify(services));
    triggerSaveAlert("Bổ sung & cập nhật danh mục dịch vụ mẫu thành công!");
    window.dispatchEvent(new Event('storage_settings_changed'));
  };

  // --- 3. TEXT TEMPLATES ---
  const [templates, setTemplates] = useState<TemplatesSetting>(() => {
    const saved = localStorage.getItem('freelance_os_templates_settings');
    if (saved) return JSON.parse(saved);
    return {
      quoteHeader: "Kính gửi quý khách hàng,\n\nMinh Trí Media Studio trân trọng hân hạnh gửi đến quý đối tác bảng mô tả báo giá các gói dịch vụ media - sản xuất hình ảnh nghệ thuật chuyên nghiệp. Các thỏa thuận đơn giá dựa trên yêu cầu đặc thù và được cam kết bàn giao chuẩn chất lượng cao.\n\nBáo giá có giá trị hiệu lực bàn giao trong vòng 15 ngày làm việc.",
      contractTerms: "ĐIỀU KHOẢN HỢP ĐỒNG SÁNG TẠO SỐ:\n\n1. SỞ HỮU TRÍ TUỆ: Bên A (Khách hàng) giữ toàn bộ bản quyền thương mại đối với file nghiệm thu cuối cùng sau khi thanh toán đủ 100% hóa đơn. Toàn bộ file nháp thô thuộc sở hữu độc quyền của Bên B.\n2. GIỚI HẠN SỬA ĐỔI: Phí hợp đồng mặc định bao gồm 2 lần phản hồi sửa đổi lớn miễn phí. Mỗi lần yêu cầu sửa đổi phát sinh thêm ngoài scope sẽ phạt thu phí 500.000 VNĐ / giờ.\n3. THỦ TỤC HUỶ HỢP ĐỒNG: Đặt cọc tối thiểu 30% để giữ chỗ thiết bị không có chính sách hoàn lại nếu khách hàng hủy lịch vô cớ trước lúc bấm máy dưới 48 tiếng.",
      paymentReminder: "Thân gửi anh/chị [Tên khách],\n\nMinh Trí Media Studio trân trọng gửi lời chúc mừng dự án '[Tên dự án]' đã ghi nhận nghiệm thu bàn giao files trơn tru.\nNhờ anh/chị kết nối hỗ trợ duyệt phiếu thu số dư thanh toán còn lại trị giá [Số tiền] trước ngày [Hạn chót] để bộ phận kế toán kịp kích hoạt link lưu trữ lâu dài của dự án trên ổ đĩa Drive.\n\nThông tin chuyển khoản nhanh: [Số tài khoản] - [Tên chủ tài khoản] mở tại ngân hàng [Tên ngân hàng].\n\nXin chân thành cảm ơn sự đồng hành quý báu của anh/chị!",
      depositReceipt: "BIÊN NHẬN ĐÃ THU CỌC TẠM KHẤU\n\nMinh Trí Media ghi nhận xác nhận đã thu khoản tiền [Số tiền] gửi đặt cọc thông qua ủy nhiệm chuyển khoản của đại diện bên liên quan '[Tên khách]'.\n\nKhoản tiền cọc này phục vụ giữ máy móc bấm ảnh cho Job '[Tên dự án]' và sẽ tự động chi khấu trừ thẳng vào bảng tổng nghiệm thu quyết toán cuối cùng.",
      acceptanceReceipt: "BIÊN BẢN NGHIỆM THU TÀI NGUYÊN BÀN GIAO\n\n- Dự án: [Tên dự án]\n- Khách hàng thụ hưởng: [Tên khách]\n- Nội dung nghiệm thu: Bàn giao toàn bộ danh mục tài nguyên chất lượng gốc đúng theo timeline kỹ thuật cam kết trong thỏa thuận.\n\nHai bên chính thức thống nhất ký xác nhận không phát sinh thêm khiếu nại chất lượng hình ảnh thô."
    };
  });

  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTemplates(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveTemplates = () => {
    localStorage.setItem('freelance_os_templates_settings', JSON.stringify(templates));
    triggerSaveAlert("Đã lưu các mẫu văn bản hợp đồng, báo giá, nhắc nợ lịch sự.");
  };

  // --- 4. STATUSES LISTS ---
  const [statuses, setStatuses] = useState<StatusesSetting>(() => {
    const saved = localStorage.getItem('freelance_os_statuses_settings');
    if (saved) return JSON.parse(saved);
    return {
      jobStatuses: ["lead", "đã báo giá", "đã nhận cọc", "đang chuẩn bị", "đang thực hiện", "chờ khách duyệt", "cần chỉnh sửa", "đã bàn giao", "chờ thanh toán", "hoàn thành", "hủy"],
      clientStatuses: ["lead mới", "đang tư vấn", "đã báo giá", "đã chốt", "đang làm việc", "khách cũ", "không tiềm năng"],
      quoteStatuses: ["nháp", "đã gửi", "khách đang xem xét", "đã duyệt", "bị từ chối", "hết hạn"]
    };
  });

  // Simple state for adding items to tags
  const [newJobStatus, setNewJobStatus] = useState('');
  const [newClientStatus, setNewClientStatus] = useState('');
  const [newQuoteStatus, setNewQuoteStatus] = useState('');

  const handleAddJobStatus = () => {
    if (!newJobStatus.trim()) return;
    if (statuses.jobStatuses.includes(newJobStatus.trim())) {
      alert("Trạng thái này đã tồn tại!");
      return;
    }
    setStatuses(prev => ({
      ...prev,
      jobStatuses: [...prev.jobStatuses, newJobStatus.trim()]
    }));
    setNewJobStatus('');
  };

  const handleAddClientStatus = () => {
    if (!newClientStatus.trim()) return;
    if (statuses.clientStatuses.includes(newClientStatus.trim())) {
      alert("Trạng thái này đã tồn tại!");
      return;
    }
    setStatuses(prev => ({
      ...prev,
      clientStatuses: [...prev.clientStatuses, newClientStatus.trim()]
    }));
    setNewClientStatus('');
  };

  const handleAddQuoteStatus = () => {
    if (!newQuoteStatus.trim()) return;
    if (statuses.quoteStatuses.includes(newQuoteStatus.trim())) {
      alert("Trạng thái này đã tồn tại!");
      return;
    }
    setStatuses(prev => ({
      ...prev,
      quoteStatuses: [...prev.quoteStatuses, newQuoteStatus.trim()]
    }));
    setNewQuoteStatus('');
  };

  const handleDeleteJobStatus = (item: string) => {
    if (statuses.jobStatuses.length <= 3) {
      alert("Không được xóa hết trạng thái! Vui lòng giữ tối thiểu 3 trạng thái cốt lõi.");
      return;
    }
    setStatuses(prev => ({
      ...prev,
      jobStatuses: prev.jobStatuses.filter(s => s !== item)
    }));
  };

  const handleDeleteClientStatus = (item: string) => {
    if (statuses.clientStatuses.length <= 3) {
      alert("Vui lòng giữ lại tối thiểu 3 trạng thái khách hàng để CRM hoạt động.");
      return;
    }
    setStatuses(prev => ({
      ...prev,
      clientStatuses: prev.clientStatuses.filter(s => s !== item)
    }));
  };

  const handleDeleteQuoteStatus = (item: string) => {
    if (statuses.quoteStatuses.length <= 3) {
      alert("Báo giá cần tối thiểu 3 trạng thái để phân loại.");
      return;
    }
    setStatuses(prev => ({
      ...prev,
      quoteStatuses: prev.quoteStatuses.filter(s => s !== item)
    }));
  };

  const handleSaveStatuses = () => {
    localStorage.setItem('freelance_os_statuses_settings', JSON.stringify(statuses));
    triggerSaveAlert("Thiết lập hệ thống trạng thái CRM & Jobs đã đồng bộ!");
  };

  // Helper trigger action message
  const triggerSaveAlert = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => {
      setSaveStatus(null);
    }, 4000);
  };

  // RESET ALL SETTINGS TO DEFAULTS
  const handleResetAllToDefaults = () => {
    if (confirm("Bạn có chắc chắn muốn khôi phục tất cả thiết lập, danh mục dịch vụ mẫu & trạng thái về giá trị ban đầu của hệ thống?")) {
      localStorage.removeItem('freelance_os_profile_settings');
      localStorage.removeItem('freelance_os_services_settings');
      localStorage.removeItem('freelance_os_templates_settings');
      localStorage.removeItem('freelance_os_statuses_settings');
      
      // Reload states
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 space-y-6">
      
      {/* HEADER BAR */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-950 flex items-center gap-2">
            <span className="p-2 bg-brand-green-mid/10 text-brand-green-mid rounded-lg">
              <Bookmark size={22} />
            </span>
            Trung tâm Cài đặt & Tùy chỉnh
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Quản lý thông tin thương hiệu, tài khoản ngân hàng chuyển khoản cọc, danh mục đơn giá dịch vụ mỏ neo và tinh chỉnh mẫu văn bản tự động.
          </p>
        </div>
        <button
          onClick={handleResetAllToDefaults}
          className="px-3.5 py-1.5 border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-50 text-3xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Undo size={12} /> Khôi phục tất cả mặc định
        </button>
      </div>

      {/* FLOAT SAVE ALERT PANEL */}
      {saveStatus && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce z-50 border border-slate-700">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span className="text-3xs font-black uppercase tracking-wider">{saveStatus}</span>
        </div>
      )}

      {/* NAV CHỌN SUB-MODULE SƠ ĐỒ */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-2xl text-xs">
        {[
          { id: 'profile', icon: User, label: "Thông tin Thương hiệu & Bank" },
          { id: 'services', icon: Briefcase, label: "Danh mục Đơn giá Dịch vụ" },
          { id: 'templates', icon: FileText, label: "Mẫu văn bản & Nhắc nợ" },
          { id: 'statuses', icon: Tag, label: "Hệ thống Trạng thái" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveSubTab(tab.id as any); }}
            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-white text-slate-950 shadow-3xs text-3xs uppercase font-black border-b-2 border-slate-800'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            <tab.icon size={14} className={activeSubTab === tab.id ? 'text-brand-green-mid' : 'text-slate-400'} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTAINER CHÍNH */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-3xs">
        
        {/* ========================================================= */}
        {/* A. THÔNG TIN CÁ NHÂN & BANK */}
        {/* ========================================================= */}
        {activeSubTab === 'profile' && (
          <div className="space-y-6">
            <div className="border-b pb-4 border-slate-150">
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                <Building size={16} className="text-brand-green-mid" /> A. HỒ SƠ FREELANCER & HỘ KINH DOANH
              </h3>
              <p className="text-slate-450 text-[11px] mt-1 font-medium">Bố trí thông tin cá nhân/hộ kinh doanh, mã số thuế để hệ thống tự động chèn vào hợp đồng & hóa đơn.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Form cá nhân (8/12) */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-3xs font-black uppercase text-slate-500 tracking-wider">Tên Freelancer / Thương hiệu</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="brandName"
                      value={profile.brandName}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 text-xxs border border-slate-200 rounded-lg focus:outline-slate-800 font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-3xs font-black uppercase text-slate-500 tracking-wider">Tên Hộ kinh doanh (nếu có)</label>
                  <input
                    type="text"
                    name="householdName"
                    value={profile.householdName}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 text-xxs border border-slate-200 rounded-lg focus:outline-slate-800 font-bold text-slate-900"
                    placeholder="Chưa có hộ kinh doanh"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-3xs font-black uppercase text-slate-500 tracking-wider">Người đại diện pháp lý</label>
                  <input
                    type="text"
                    name="representative"
                    value={profile.representative}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 text-xxs border border-slate-200 rounded-lg focus:outline-slate-800 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-3xs font-black uppercase text-slate-500 tracking-wider">Mã số thuế hộ kinh doanh</label>
                  <input
                    type="text"
                    name="taxCode"
                    value={profile.taxCode}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 text-xxs border border-slate-200 rounded-lg focus:outline-slate-800 font-mono font-bold"
                    placeholder="Không bắt buộc"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-3xs font-black uppercase text-slate-500 tracking-wider">Số điện thoại</label>
                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 text-xxs border border-slate-200 rounded-lg focus:outline-slate-800 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-3xs font-black uppercase text-slate-500 tracking-wider">Email liên hệ</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 text-xxs border border-slate-200 rounded-lg focus:outline-slate-800 font-bold"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-3xs font-black uppercase text-slate-500 tracking-wider">Địa chỉ giao dịch</label>
                  <input
                    type="text"
                    name="address"
                    value={profile.address}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 text-xxs border border-slate-200 rounded-lg focus:outline-slate-800 font-medium"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-3xs font-black uppercase text-slate-500 tracking-wider">Logo thương hiệu (Đường dẫn Link URL)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="logoUrl"
                      value={profile.logoUrl}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 text-xxs border border-slate-200 rounded-lg focus:outline-slate-800 font-mono text-slate-500"
                    />
                    <div className="w-10 h-10 border border-slate-200 rounded-lg shrink-0 overflow-hidden flex items-center justify-center bg-slate-50">
                      {profile.logoUrl ? (
                        <img src={profile.logoUrl} alt="Logo preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={16} className="text-slate-300" />
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Box Ngân hàng (4/12) */}
              <div className="md:col-span-4 bg-slate-50/50 border border-slate-200 p-4 rounded-2xl space-y-4">
                <div className="border-b pb-2 border-slate-200 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-indigo-600" />
                  <h4 className="font-extrabold text-slate-805 text-xxs uppercase tracking-wider">Cấu hình Tài khoản Ngân hàng</h4>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-3xs font-black uppercase text-slate-450 tracking-wider">Tên Ngân hàng</label>
                    <input
                      type="text"
                      name="bankName"
                      value={profile.bankName}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 text-xxs border border-slate-250 bg-white rounded-lg focus:outline-slate-800 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-3xs font-black uppercase text-slate-450 tracking-wider">Số tài khoản (STK)</label>
                    <input
                      type="text"
                      name="bankAccount"
                      value={profile.bankAccount}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 text-xxs border border-slate-250 bg-white rounded-lg focus:outline-slate-800 font-mono font-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-3xs font-black uppercase text-slate-450 tracking-wider">Chủ tài khoản (Viết hoa)</label>
                    <input
                      type="text"
                      name="bankHolder"
                      value={profile.bankHolder}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 text-xxs border border-slate-250 bg-white rounded-lg focus:outline-slate-800 font-extrabold uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-3xs font-black uppercase text-slate-450 tracking-wider">Cú pháp / Ghi chú thu cọc quy ước</label>
                    <textarea
                      name="qrNotes"
                      value={profile.qrNotes}
                      onChange={handleProfileChange}
                      rows={2}
                      className="w-full px-3 py-2 text-xxs border border-slate-250 bg-white rounded-lg focus:outline-slate-800 font-medium"
                      placeholder="VD: CK COC 50% TEN_KHACH HANG_MUC"
                    />
                  </div>
                </div>

                {/* Mockup QR Code */}
                <div className="pt-2 bg-slate-900 border border-slate-800 text-white p-3 rounded-xl space-y-2 flex flex-col items-center text-center">
                  <div className="p-1 bg-white rounded-lg">
                    {/* Use standard static QR-code rendering */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=STK_SAMPLE_${profile.bankAccount}_${profile.bankHolder}`} 
                      alt="VietQR Mock" 
                      className="w-20 h-20"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">VietQR Tự động sinh</span>
                    <p className="text-[9px] text-slate-400 mt-0.5 leading-tight font-medium">Báo giá/Hợp đồng sẽ đính kèm mã QR chuẩn của STK này.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* BUTTON SUBMIT */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveProfile}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xxs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-slate-800 transition-all cursor-pointer shadow-3xs"
              >
                <Save size={14} /> Lưu Hồ Sơ & Thông Tin Ngân Hàng
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* B. DỊCH VỤ & ĐƠN GIÁ MẶC ĐỊNH */}
        {/* ========================================================= */}
        {activeSubTab === 'services' && (
          <div className="space-y-6">
            <div className="border-b pb-4 border-slate-150">
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                <Briefcase size={16} className="text-brand-green-mid" /> B. DANH MỤC DỊCH VỤ & ĐƠN GIÁ MỎ NEO
              </h3>
              <p className="text-slate-450 text-[11px] mt-1 font-medium">Cấu hình trước bảng giá mỏ neo của bạn. Bản thiết kế báo giá nháp mới sẽ tự động lấy thông tin từ đây giúp tiết kiệm thời gian gõ tay.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form thêm/sửa dịch vụ (4/12) */}
              <div className="lg:col-span-4 bg-slate-50/70 border border-slate-200 p-4 rounded-2xl space-y-4 self-start">
                <div className="flex items-center gap-1.5 border-b pb-2">
                  <Plus size={15} className="text-brand-green-mid" />
                  <span className="text-xxs uppercase font-black text-slate-800 tracking-wider">
                    {editingServiceId ? "Chỉnh sửa Dịch vụ" : "Tạo mẫu Dịch vụ mới"}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-3xs font-black uppercase text-slate-500 tracking-wider">Tên gói dịch vụ</label>
                    <input
                      type="text"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="VD: Chụp Lookbook thương hiệu lớn"
                      className="w-full px-3 py-2 text-xxs border border-slate-200 bg-white rounded-lg focus:outline-slate-800 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-3xs font-black uppercase text-slate-500 tracking-wider">Đơn giá định mức</label>
                      <input
                        type="number"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xxs border border-slate-200 bg-white rounded-lg focus:outline-slate-800 font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-3xs font-black uppercase text-slate-500 tracking-wider">Số ngày thực hiện</label>
                      <input
                        type="number"
                        value={newServiceDays}
                        onChange={(e) => setNewServiceDays(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xxs border border-slate-200 bg-white rounded-lg focus:outline-slate-800 font-bold"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-3xs font-black uppercase text-slate-500 tracking-wider">Mô tả đặc tả kỹ thuật / thiết bị</label>
                    <textarea
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      rows={3}
                      placeholder="VD: Lens chụp khẩu độ lớn, cung cấp toàn bộ ảnh thô chất lượng RAW..."
                      className="w-full px-3 py-2 text-xxs border border-slate-200 bg-white rounded-lg focus:outline-slate-800 font-medium"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAddOrUpdateService}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-3xs font-black uppercase tracking-wider text-center cursor-pointer transition-all"
                    >
                      {editingServiceId ? "Cập nhật" : "Bổ sung gói"}
                    </button>
                    {editingServiceId && (
                      <button
                        onClick={() => {
                          setEditingServiceId(null);
                          setNewServiceName('');
                          setNewServicePrice(0);
                          setNewServiceDays(3);
                          setNewServiceDesc('');
                        }}
                        className="px-3 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-3xs font-bold text-slate-650 cursor-pointer"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Danh sách dịch vụ hiện tại (8/12) */}
              <div className="lg:col-span-8 space-y-3.5">
                <span className="text-xxs uppercase font-black text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Clock size={13} className="text-slate-400" /> Bảng đơn giá hiện hữu trong Studio ({services.length})
                </span>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {services.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-3xl text-slate-400 italic">
                      Chưa cấu hình dịch vụ mẫu nào. Hãy thêm ở bảng bên trái.
                    </div>
                  ) : (
                    services.map((srv, idx) => (
                      <div 
                        key={srv.id} 
                        className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-3xs hover:border-slate-350 ${
                          editingServiceId === srv.id ? 'border-brand-green-mid bg-slate-50/50' : 'border-slate-205 bg-white'
                        }`}
                      >
                        <div className="space-y-1.5 max-w-xs sm:max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-slate-100 rounded-lg text-xxs font-black text-slate-600 flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-xxs truncate">{srv.name}</h4>
                          </div>
                          <p className="text-3xs text-slate-500 font-medium leading-relaxed">{srv.description || "Không có mô tả chi tiết"}</p>
                          <div className="flex items-center gap-3.5 text-3xs font-bold text-slate-450">
                            <span className="flex items-center gap-1"><Clock size={11} /> {srv.defaultDurationDays} ngày cam kết</span>
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                            <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-lg">Giá sàn: {formatVND(srv.defaultPrice)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col items-center justify-end gap-1.5 shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0">
                          <button
                            onClick={() => handleEditClick(srv)}
                            className="p-1.5 border border-slate-200 hover:text-slate-900 rounded-lg text-slate-500 cursor-pointer transition-colors"
                            title="Chỉnh sửa dịch vụ"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteService(srv.id)}
                            className="p-1.5 border border-rose-100/80 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer transition-colors"
                            title="Xóa dịch vụ"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* ACTION SUBMIT SAVING SERVICES */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveServices}
                className="px-5 py-2.5 bg-brand-green-mid hover:bg-brand-green-mid-dark text-white rounded-xl text-xxs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-3xs"
              >
                <Save size={14} /> Hoàn tất Đồng bộ Danh mục dịch vụ
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* C. MẪU NỘI DUNG VĂN BẢN (TEMPLATES) */}
        {/* ========================================================= */}
        {activeSubTab === 'templates' && (
          <div className="space-y-6">
            <div className="border-b pb-4 border-slate-150">
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                <FileText size={16} className="text-brand-green-mid" /> C. THIẾT LẬP MẪU NỘI DUNG TỰ ĐỘNG PHÁT SINH
              </h3>
              <p className="text-slate-450 text-[11px] mt-1 font-medium">Lưu trữ các mẫu từ ngữ xã giao hoặc điều khoản pháp lý quy chuẩn để nhúng nhanh. Hỗ trợ các thẻ thay thế động: `[Tên khách]`, `[Tên dự án]`, `[Số tiền]`, `[Hạn chót]`, `[Số tài khoản]`.</p>
            </div>

            {/* Template Editors layout */}
            <div className="space-y-5">
              
              {/* Template Quote & Contract side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Mẫu Báo giá */}
                <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="text-xxs uppercase font-black text-indigo-750 flex items-center gap-1">
                    <FileText size={13} /> 1. Phần mở đầu & Thỏa thuận Báo giá (Quotation Memo)
                  </span>
                  <p className="text-3xs text-slate-500 font-medium">Văn bản này tự động dán lên đầu phiếu báo giá gửi khách duyệt.</p>
                  <textarea
                    name="quoteHeader"
                    value={templates.quoteHeader}
                    onChange={handleTemplateChange}
                    rows={6}
                    className="w-full px-3 py-2 text-xxs border border-slate-250 bg-white rounded-xl focus:outline-indigo-650 font-medium leading-relaxed"
                  />
                </div>

                {/* 2. Mẫu Hợp đồng */}
                <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="text-xxs uppercase font-black text-slate-800 flex items-center gap-1">
                    <FileSignature size={13} /> 2. Trích đoạn Điều khoản Hợp đồng cốt lõi (Contract Scope)
                  </span>
                  <p className="text-3xs text-slate-500 font-medium">Bao gồm bản quyền tác giả, phạm vi số lần sửa đổi và khoản cọc không hoàn trả.</p>
                  <textarea
                    name="contractTerms"
                    value={templates.contractTerms}
                    onChange={handleTemplateChange}
                    rows={6}
                    className="w-full px-3 py-2 text-xxs border border-slate-250 bg-white rounded-xl focus:outline-slate-800 font-medium leading-relaxed"
                  />
                </div>

              </div>

              {/* Template Payment reminders, Deposits & Acceptance Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* 3. Mẫu nhắc thanh toán */}
                <div className="p-4 bg-amber-50/10 border border-amber-150 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-black text-amber-700 flex items-center gap-1">
                      <Bell size={12} /> 3. Tin nhắn nhắc nợ lịch sự
                    </span>
                    <span className="text-[8px] px-1 bg-amber-100 text-amber-805 rounded font-black uppercase">Zalo/Email</span>
                  </div>
                  <p className="text-3xs text-slate-500 font-medium">Chứa sẵn thông tin ngân hàng giúp thu nợ trơn tru, văn phong tinh tế.</p>
                  <textarea
                    name="paymentReminder"
                    value={templates.paymentReminder}
                    onChange={handleTemplateChange}
                    rows={5}
                    className="w-full px-3 py-2 text-xxs border border-amber-200/60 bg-white rounded-xl focus:outline-amber-600 font-medium leading-relaxed"
                  />
                </div>

                {/* 4. Mẫu Phiếu thu cọc */}
                <div className="p-4 bg-emerald-50/10 border border-emerald-150 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-black text-emerald-700 flex items-center gap-1">
                      <Save size={12} /> 4. Đơn biên nhận đóng cọc
                    </span>
                    <span className="text-[8px] px-1 bg-emerald-100 text-emerald-805 rounded font-black uppercase">Bút toán</span>
                  </div>
                  <p className="text-3xs text-slate-500 font-medium">Cam cam kết tạm khấu đặt cọc trong Sổ quỹ, là bằng chứng đã bỏ ví.</p>
                  <textarea
                    name="depositReceipt"
                    value={templates.depositReceipt}
                    onChange={handleTemplateChange}
                    rows={5}
                    className="w-full px-3 py-2 text-xxs border border-emerald-200/60 bg-white rounded-xl focus:outline-emerald-600 font-medium leading-relaxed"
                  />
                </div>

                {/* 5. Mẫu Nghiệm thu */}
                <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-black text-slate-800 flex items-center gap-1">
                      <FileCheck size={12} /> 5. Giấy nghiệm thu tài bàn
                    </span>
                    <span className="text-[8px] px-1 bg-slate-205 text-slate-650 rounded font-black uppercase">Chốt job</span>
                  </div>
                  <p className="text-3xs text-slate-500 font-medium">Chứng từ xác nhận bàn giao hàng đúng hẹn, không khiếu nại chất lượng thô.</p>
                  <textarea
                    name="acceptanceReceipt"
                    value={templates.acceptanceReceipt}
                    onChange={handleTemplateChange}
                    rows={5}
                    className="w-full px-3 py-2 text-xxs border border-slate-250 bg-white rounded-xl focus:outline-slate-800 font-medium leading-relaxed"
                  />
                </div>

              </div>

              {/* Live Preview interactive Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3.5">
                <h4 className="font-extrabold text-slate-400 text-3xs uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-2">
                  <HelpCircle size={12} className="text-emerald-400 animate-pulse" /> Trực quan hóa Mẫu nhắc thanh toán thông minh (Khi nhắm vào Job cụ thể)
                </h4>
                
                {/* Simulated rendering helper */}
                <div className="bg-slate-800 border-l-4 border-amber-400 p-3.5 rounded-xl font-medium leading-relaxed text-xxs text-amber-50">
                  {templates.paymentReminder
                    .replace('[Tên khách]', 'Nguyễn Văn Đạt (Agency Star)')
                    .replace('[Tên dự án]', 'Lookbook Thu Đông Ivy Moda')
                    .replace('[Số tiền]', formatVND(4500000))
                    .replace('[Hạn chót]', '30/05/2026')
                    .replace('[Số tài khoản]', profile.bankAccount)
                    .replace('[Tên chủ tài khoản]', profile.bankHolder)
                    .replace('[Tên ngân hàng]', profile.bankName)
                  }
                </div>
                <div className="text-[10px] text-slate-400 italic font-medium">
                  (*) Hệ thống sẽ tự động phân giải các mã token `[Tên khách]`, `[Số tiền]` ... thành giá trị thật của đối tượng dự án tương ứng trước khi kết xuất để gửi Zalo/SMS!
                </div>
              </div>

            </div>

            {/* ACTION SAVE BUTTON */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveTemplates}
                className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xxs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-3xs"
              >
                <Save size={14} /> Cất giữ tất cả Mẫu văn bản
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* D. TRẠNG THÁI HỆ THỐNG */}
        {/* ========================================================= */}
        {activeSubTab === 'statuses' && (
          <div className="space-y-6">
            <div className="border-b pb-4 border-slate-150">
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                <Tag size={16} className="text-brand-green-mid" /> D. TÙY CHỈNH HỆ THỐNG TRẠNG THÁI LÀM VIỆC & CRM
              </h3>
              <p className="text-slate-450 text-[11px] mt-1 font-medium">Kiểm soát và bổ sung các thẻ trạng thái theo đặc thù luồng làm việc thực tế của studio bạn để hiển thị đúng tiến độ.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 1. Trạng thái Job/Dự án */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                <div className="border-b pb-2 flex items-center justify-between border-slate-200">
                  <span className="text-xxs uppercase font-black text-slate-800">1. Trạng thái Job</span>
                  <span className="text-[10px] font-bold text-slate-400">{statuses.jobStatuses.length} thẻ</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 min-h-[140px] items-start align-top">
                  {statuses.jobStatuses.map((st, i) => (
                    <span 
                      key={st} 
                      className="bg-white border border-slate-250 hover:bg-slate-100 px-2 py-1 rounded-lg text-3xs font-bold text-slate-700 flex items-center gap-1"
                    >
                      {st}
                      <button 
                        onClick={() => handleDeleteJobStatus(st)}
                        className="text-slate-400 hover:text-rose-500 font-bold ml-1"
                        title="Xóa trạng thái"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add block */}
                <div className="flex gap-2.5pt-2 border-t border-slate-150 pt-2.5">
                  <input
                    type="text"
                    value={newJobStatus}
                    onChange={(e) => setNewJobStatus(e.target.value)}
                    placeholder="VD: đang quay dựng..."
                    className="flex-1 px-2 py-1 text-3xs border bg-white rounded-lg focus:outline-slate-805"
                  />
                  <button
                    onClick={handleAddJobStatus}
                    className="px-2.5 py-1 bg-slate-900 text-white font-extrabold text-3xs rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* 2. Trạng thái Khách hàng CRM */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                <div className="border-b pb-2 flex items-center justify-between border-slate-200">
                  <span className="text-xxs uppercase font-black text-slate-800">2. Khách hàng CRM</span>
                  <span className="text-[10px] font-bold text-slate-400">{statuses.clientStatuses.length} thẻ</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 min-h-[140px] items-start align-top">
                  {statuses.clientStatuses.map((st, i) => (
                    <span 
                      key={st} 
                      className="bg-white border border-slate-250 hover:bg-slate-100 px-2 py-1 rounded-lg text-3xs font-bold text-slate-700 flex items-center gap-1"
                    >
                      {st}
                      <button 
                        onClick={() => handleDeleteClientStatus(st)}
                        className="text-slate-400 hover:text-rose-500 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add block */}
                <div className="flex gap-2pt-2 border-t border-slate-150 pt-2.5">
                  <input
                    type="text"
                    value={newClientStatus}
                    onChange={(e) => setNewClientStatus(e.target.value)}
                    placeholder="VD: khách VIP..."
                    className="flex-1 px-2 py-1 text-3xs border bg-white rounded-lg focus:outline-slate-805"
                  />
                  <button
                    onClick={handleAddClientStatus}
                    className="px-2.5 py-1 bg-slate-900 text-white font-extrabold text-3xs rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* 3. Trạng thái Báo giá */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                <div className="border-b pb-2 flex items-center justify-between border-slate-200">
                  <span className="text-xxs uppercase font-black text-slate-800">3. Trạng thái Báo giá</span>
                  <span className="text-[10px] font-bold text-slate-400">{statuses.quoteStatuses.length} thẻ</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 min-h-[140px] items-start align-top">
                  {statuses.quoteStatuses.map((st, i) => (
                    <span 
                      key={st} 
                      className="bg-white border border-slate-250 hover:bg-slate-100 px-2 py-1 rounded-lg text-3xs font-bold text-slate-700 flex items-center gap-1"
                    >
                      {st}
                      <button 
                        onClick={() => handleDeleteQuoteStatus(st)}
                        className="text-slate-400 hover:text-rose-500 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add block */}
                <div className="flex gap-2pt-2 border-t border-slate-150 pt-2.5">
                  <input
                    type="text"
                    value={newQuoteStatus}
                    onChange={(e) => setNewQuoteStatus(e.target.value)}
                    placeholder="VD: đã đệ trình..."
                    className="flex-1 px-2 py-1 text-3xs border bg-white rounded-lg focus:outline-slate-805"
                  />
                  <button
                    onClick={handleAddQuoteStatus}
                    className="px-2.5 py-1 bg-slate-900 text-white font-extrabold text-3xs rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Thêm
                  </button>
                </div>
              </div>

            </div>

            {/* ACTION SAVE BUTTON */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveStatuses}
                className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xxs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-3xs"
              >
                <Save size={14} /> Hoàn tất Đồng bộ Danh thái hóa
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
