/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Client, Project, Transaction, ClientCategoryType, ClientSourceType, ClientInterestedServiceType, ClientStatusType, ClientPriorityType, ProjectStatus } from '../types';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  User, 
  Trash2, 
  Edit2, 
  X, 
  Briefcase, 
  PlusCircle, 
  DollarSign, 
  MapPin, 
  Eye, 
  ExternalLink,
  Facebook, 
  Instagram, 
  Video, 
  FolderLock, 
  Heart, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Flag,
  Share2,
  Bookmark,
  Sparkles,
  ChevronRight,
  Send,
  MessageCircle,
  FileText,
  BadgeAlert,
  Coins
} from 'lucide-react';
import { formatDate, formatVND, formatShortVND } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface ClientsViewProps {
  clients: Client[];
  projects: Project[];
  transactions: Transaction[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onQuickAddProject?: (clientId: string, status: ProjectStatus) => void;
  onSelectProject?: (projectId: string) => void;
}

export default function ClientsView({
  clients,
  projects,
  transactions,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onQuickAddProject,
  onSelectProject
}: ClientsViewProps) {
  // --- States tìm kiếm & bộ lọc ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  
  // --- Thao tác Modal & Form ---
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Chi tiết một khách hàng để xem lịch sử job & transaction
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // --- Form fields state ---
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zalo, setZalo] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<ClientCategoryType>('cá nhân');
  const [source, setSource] = useState<ClientSourceType>('khác');
  const [interestedServices, setInterestedServices] = useState<ClientInterestedServiceType[]>([]);
  const [status, setStatus] = useState<ClientStatusType>('lead mới');
  const [priority, setPriority] = useState<ClientPriorityType>('trung bình');
  const [notes, setNotes] = useState('');

  // --- Hỗ trợ hạch toán tài chính tích lũy cho từng khách ---
  const clientFinancials = useMemo(() => {
    const map: Record<string, { totalRevenue: number; outstandingDebt: number; projectCount: number }> = {};
    
    // Khởi tạo cho toàn bộ khách hàng
    clients.forEach(c => {
      map[c.id] = { totalRevenue: 0, outstandingDebt: 0, projectCount: 0 };
    });

    // Cộng dồn từ danh sách dự án
    projects.forEach(p => {
      if (!map[p.clientId]) {
        map[p.clientId] = { totalRevenue: 0, outstandingDebt: 0, projectCount: 0 };
      }
      
      map[p.clientId].projectCount += 1;
      
      // Các job không ở dạng nháp được cộng dồn doanh thu tiềm năng/cam kết
      if (p.status !== 'draft') {
        map[p.clientId].totalRevenue += p.price;
        // Nếu dự án chưa hoàn tất thanh toán, cộng dồn công nợ còn lại
        if (p.finalPaymentStatus !== 'paid') {
          map[p.clientId].outstandingDebt += p.finalPayment;
        }
      }
    });

    return map;
  }, [clients, projects]);

  // --- CRM KPIs Thống kê ở thanh trên đầu ---
  const kpis = useMemo(() => {
    let totalLeads = 0;
    let totalActiveClients = 0;
    let highPriorityCount = 0;
    let grandRevenue = 0;

    clients.forEach(c => {
      if (['lead mới', 'đang tư vấn', 'đã báo giá'].includes(c.status)) {
        totalLeads += 1;
      }
      if (['đã chốt', 'đang làm việc', 'khách cũ'].includes(c.status)) {
        totalActiveClients += 1;
      }
      if (c.priority === 'cao') {
        highPriorityCount += 1;
      }
      
      const financial = clientFinancials[c.id];
      if (financial) {
        grandRevenue += financial.totalRevenue;
      }
    });

    return {
      totalLeads,
      totalActiveClients,
      highPriorityCount,
      grandRevenue,
      totalClients: clients.length
    };
  }, [clients, clientFinancials]);

  // --- Lọc danh sách khách hàng ---
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.zalo && c.zalo.includes(searchTerm));

      const matchType = filterType === 'all' || c.type === filterType;
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      const matchSource = filterSource === 'all' || c.source === filterSource;
      const matchPriority = filterPriority === 'all' || c.priority === filterPriority;

      return matchSearch && matchType && matchStatus && matchSource && matchPriority;
    });
  }, [clients, searchTerm, filterType, filterStatus, filterSource, filterPriority]);

  // --- Đóng/Mở Form thêm khách ---
  const openAddForm = () => {
    setEditingClient(null);
    setIsEditing(false);
    setName('');
    setPhone('');
    setEmail('');
    setZalo('');
    setFacebook('');
    setInstagram('');
    setTiktok('');
    setAddress('');
    setType('cá nhân');
    setSource('khác');
    setInterestedServices([]);
    setStatus('lead mới');
    setPriority('trung bình');
    setNotes('');
    setShowForm(true);
  };

  // --- Đóng/Mở Form sửa khách ---
  const openEditForm = (client: Client) => {
    setEditingClient(client);
    setIsEditing(true);
    setName(client.name);
    setPhone(client.phone);
    setEmail(client.email);
    setZalo(client.zalo || '');
    setFacebook(client.facebook || '');
    setInstagram(client.instagram || '');
    setTiktok(client.tiktok || '');
    setAddress(client.address || '');
    setType(client.type);
    setSource(client.source);
    setInterestedServices(client.interestedServices || []);
    setStatus(client.status);
    setPriority(client.priority);
    setNotes(client.notes);
    setShowForm(true);
  };

  // --- Submit form thêm/sửa ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Vui lòng nhập Họ tên hoặc Tên thương hiệu!');
    if (!phone.trim()) return alert('Vui lòng nhập Số điện thoại!');

    const clientData: Omit<Client, 'id' | 'createdAt'> = {
      name,
      phone,
      email,
      zalo: zalo || undefined,
      facebook: facebook || undefined,
      instagram: instagram || undefined,
      tiktok: tiktok || undefined,
      address: address || undefined,
      type,
      source,
      interestedServices,
      status,
      priority,
      notes
    };

    if (isEditing && editingClient) {
      onEditClient({
        ...editingClient,
        ...clientData
      });
    } else {
      onAddClient(clientData);
    }
    setShowForm(false);
  };

  // Tăng hoặc giảm danh sách dịch vụ quan tâm trong form
  const handleToggleInterestedService = (service: ClientInterestedServiceType) => {
    if (interestedServices.includes(service)) {
      setInterestedServices(prev => prev.filter(s => s !== service));
    } else {
      setInterestedServices(prev => [...prev, service]);
    }
  };

  // --- Lấy màu sắc phù hợp cho nhãn Trạng thái Khách hàng ---
  const getStatusBadgeStyles = (statusVal: ClientStatusType) => {
    switch (statusVal) {
      case 'lead mới':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'đang tư vấn':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'đã báo giá':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'đã chốt':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse';
      case 'đang làm việc':
        return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'khách cũ':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'không tiềm năng':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  // --- Lấy màu sắc phù hợp cho nhãn Loại Khách hàng ---
  const getTypeBadgeStyles = (typeVal: ClientCategoryType) => {
    switch (typeVal) {
      case 'doanh nghiệp':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'agency':
        return 'bg-purple-50 text-purple-700 border-purple-150';
      case 'studio đối tác':
        return 'bg-pink-50 text-pink-700 border-pink-100';
      case 'khách quen':
        return 'bg-emerald-50 text-emerald-700 border-emerald-150 font-bold';
      case 'khách tiềm năng':
        return 'bg-orange-50 text-orange-700 border-orange-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // --- Lấy màu mức độ ưu tiên ---
  const getPriorityStyles = (p: ClientPriorityType) => {
    switch (p) {
      case 'cao':
        return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'trung bình':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'thấp':
        return 'text-slate-500 bg-slate-100 border-slate-200';
    }
  };

  // --- Lọc dữ liệu cho Khách đang được Xem Chi Tiết ---
  const viewingClientHistory = useMemo(() => {
    if (!viewingClient) return { relatedProjects: [], relatedTransactions: [] };

    // Lọc các dự án thuộc về client
    const relatedProjects = projects.filter(p => p.clientId === viewingClient.id);
    const projIds = new Set(relatedProjects.map(p => p.id));

    // Lọc các giao dịch liên kết với dự án đó
    const relatedTransactions = transactions.filter(t => t.projectId && projIds.has(t.projectId));

    return {
      relatedProjects,
      relatedTransactions
    };
  }, [viewingClient, projects, transactions]);

  return (
    <div className="space-y-6 pb-6">
      
      {/* 1. TIÊU ĐỀ MODULE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-semibold text-brand-green-mid uppercase tracking-wider block">
            Hồ sơ khách hàng & quản lý liên hệ (CRM Hub)
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
            Mạng Lưới Khách Hàng
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Theo dõi chi tiết trọn vẹn vòng đời khách hàng, ghi chú thói quen làm việc, doanh thu và công nợ.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-brand-green-mid hover:bg-brand-green-dark text-white rounded-xl px-5 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto shadow-xs"
          id="btn-add-client-crm"
        >
          <Plus size={16} /> Thêm khách hàng mới
        </button>
      </div>

      {/* 2. THẺ CHỈ SỐ DASHBOARD CRM CHUYÊN NGHIỆP */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 font-sans">
        
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tổng Liên Hệ</span>
            <span className="p-1 px-1.5 bg-slate-50 text-slate-700 text-[10px] rounded-lg font-mono font-bold">{kpis.totalClients}</span>
          </div>
          <div className="mt-3">
            <h4 className="text-xl md:text-2xl font-black text-slate-900 leading-none">{clients.length}</h4>
            <p className="text-[10px] text-slate-400 mt-1.5">Khách hàng được mã hóa lưu trữ</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-blue-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cơ Hội Mới (Leads)</span>
            <Users size={14} />
          </div>
          <div className="mt-3">
            <h4 className="text-xl md:text-2xl font-black text-blue-600 leading-none">{kpis.totalLeads}</h4>
            <p className="text-[10px] text-slate-400 mt-1.5">Đang tiếp cận, tư vấn & báo giá</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-emerald-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Đã Ký Kết & Chốt</span>
            <TrendingUp size={14} />
          </div>
          <div className="mt-3">
            <h4 className="text-xl md:text-2xl font-black text-emerald-600 leading-none">{kpis.totalActiveClients}</h4>
            <p className="text-[10px] text-slate-400 mt-1.5">Đơn hàng kích hoạt & khách cũ</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-rose-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Khách Hàng Trọng Tâm</span>
            <Flag size={14} />
          </div>
          <div className="mt-3">
            <h4 className="text-xl md:text-2xl font-black text-rose-600 leading-none">{kpis.highPriorityCount}</h4>
            <p className="text-[10px] text-slate-400 mt-1.5">Được xếp hạng mức ưu tiên CAO</p>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center text-amber-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng Giá Trị Đơn Booker</span>
            <Coins size={14} />
          </div>
          <div className="mt-3">
            <h4 className="text-md md:text-lg font-black text-slate-900 truncate tracking-tight">{formatShortVND(kpis.grandRevenue)}</h4>
            <p className="text-[10px] text-slate-400 mt-1.5">Doanh số luỹ kế (không tính nháp)</p>
          </div>
        </div>

      </div>

      {/* 3. ĐIỀU KHIỂN TRA CỨU TIỆN ÍCH */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Tìm khách hàng theo Tên, SĐT, Email, Nhãn Zalo, Địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light"
            id="search-client-full"
          />
        </div>

        {/* Bộ lọc 1: Loại khách */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light text-slate-700"
            id="crm-filter-type"
          >
            <option value="all">Mọi loại khách</option>
            <option value="cá nhân">Cá nhân</option>
            <option value="doanh nghiệp">Doanh nghiệp</option>
            <option value="agency">Agency</option>
            <option value="studio đối tác">Studio đối tác</option>
            <option value="khách quen">Khách quen</option>
            <option value="khách tiềm năng">Khách tiềm năng</option>
          </select>

          {/* Bộ lọc 2: Trạng thái */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light text-slate-700"
            id="crm-filter-status"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="lead mới">Lead mới</option>
            <option value="đang tư vấn">Đang tư vấn</option>
            <option value="đã báo giá">Đã báo giá</option>
            <option value="đã chốt">Đã chốt</option>
            <option value="đang làm việc">Đang làm việc</option>
            <option value="khách cũ">Khách cũ</option>
            <option value="không tiềm năng">Không tiềm năng</option>
          </select>

          {/* Bộ lọc 3: Nguồn khách */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light text-slate-700"
            id="crm-filter-source"
          >
            <option value="all">Mọi nguồn khách</option>
            <option value="facebook">Nguồn Facebook</option>
            <option value="tiktok">Nguồn TikTok</option>
            <option value="instagram">Nguồn Instagram</option>
            <option value="giới thiệu">Được giới thiệu</option>
            <option value="website">Từ Website</option>
            <option value="người quen">Người quen</option>
            <option value="agency">Từ Agency</option>
            <option value="khác">Nguồn khác</option>
          </select>

          {/* Bộ lọc 4: Mức độ ưu tiên */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light text-slate-700 animate-fade-in"
            id="crm-filter-priority"
          >
            <option value="all">Mọi độ ưu tiên</option>
            <option value="cao">Ưu tiên Cao</option>
            <option value="trung bình">Ưu tiên Trung bình</option>
            <option value="thấp">Ưu tiên Thấp</option>
          </select>
        </div>
      </div>

      {/* 4. RENDER DANH SÁCH LƯỚI KHÁCH HÀNG (CRM CARDS) */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full inline-block">
            <User size={36} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Không tìm thấy đối tác nào trùng khớp</h4>
            <p className="text-xs text-slate-450 mt-1 max-w-md">Hãy thử kiểm tra lại từ khóa tìm kiếm nâng cao hoặc thay đổi các bộ lọc loại khách, trạng thái lead của bạn.</p>
          </div>
          <button
            onClick={openAddForm}
            className="bg-brand-green-mid hover:bg-brand-green-light text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            id="crm-add-client-empty-btn"
          >
            Thêm mới khách hàng ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const financials = clientFinancials[client.id] || { totalRevenue: 0, outstandingDebt: 0, projectCount: 0 };
            
            return (
              <div 
                key={client.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                id={`crm-client-card-${client.id}`}
              >
                <div>
                  
                  {/* Dòng 1: Loại khách, Trạng thái & Mức ưu tiên */}
                  <div className="flex items-start justify-between gap-1.5 pb-2.5 border-b border-dashed border-slate-100">
                    <div className="flex flex-wrap gap-1 md:gap-1.5 items-center">
                      <span className={`inline-block text-[9px] uppercase font-black px-2 py-0.5 rounded-md border ${getTypeBadgeStyles(client.type)}`}>
                        {client.type}
                      </span>
                      <span className={`inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border ${getStatusBadgeStyles(client.status)}`}>
                        {client.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border text-center flex items-center gap-1 ${getPriorityStyles(client.priority)}`} title="Mức độ phục vụ ưu tiên">
                        <Flag size={10} />
                        {client.priority}
                      </span>
                    </div>
                  </div>

                  {/* Dòng 2: Họ tên & Công cụ tác vụ */}
                  <div className="mt-3 flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        {client.name}
                        <span className="text-[10px] font-mono text-slate-300">({client.id})</span>
                      </h3>
                      {client.address && (
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin size={10} />
                          {client.address}
                        </p>
                      )}
                    </div>
                    
                    {/* Thao tác cơ bản: Xem, Sửa, Xóa */}
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-150">
                      <button
                        onClick={() => setViewingClient(client)}
                        className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-brand-green-mid transition-all"
                        title="Xem lịch sử & chi tiết"
                        id={`btn-view-c-${client.id}`}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => openEditForm(client)}
                        className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-slate-900 transition-all"
                        title="Sửa thông tin"
                        id={`btn-edit-c-${client.id}`}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa khách hàng "${client.name}" khỏi CRM không? Việc này không xóa lịch sử các dự án và hạch toán dòng tiền liên quan.`)) {
                            onDeleteClient(client.id);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-450 hover:text-rose-600 transition-all"
                        title="Xóa"
                        id={`btn-delete-c-${client.id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Dòng 3: Số điện thoại, mạng xã hội, dịch vụ quan tâm */}
                  <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        {client.phone}
                      </span>
                      {client.email && (
                        <span className="text-[11px] text-slate-500 truncate max-w-[150px]" title={client.email}>
                          {client.email}
                        </span>
                      )}
                    </div>

                    {/* Mạng xã hội */}
                    {(client.zalo || client.facebook || client.instagram || client.tiktok) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                        <span>Liên kết:</span>
                        {client.zalo && (
                          <span className="bg-white border border-slate-150 px-1.5 py-0.5 rounded-md text-slate-600 font-medium">Zalo</span>
                        )}
                        {client.facebook && (
                          <a href={client.facebook} target="_blank" rel="noreferrer" className="bg-white border border-slate-150 px-1.5 py-0.5 rounded-md text-blue-600 font-medium hover:bg-blue-50 flex items-center gap-0.5">
                            <Facebook size={9} /> FB
                          </a>
                        )}
                        {client.instagram && (
                          <a href={client.instagram} target="_blank" rel="noreferrer" className="bg-white border border-slate-150 px-1.5 py-0.5 rounded-md text-pink-600 font-medium hover:bg-pink-50 flex items-center gap-0.5">
                            <Instagram size={9} /> Insta
                          </a>
                        )}
                        {client.tiktok && (
                          <a href={client.tiktok} target="_blank" rel="noreferrer" className="bg-white border border-slate-150 px-1.5 py-0.5 rounded-md text-slate-850 font-medium hover:bg-slate-50 flex items-center gap-0.5">
                            TikTok
                          </a>
                        )}
                      </div>
                    )}

                    {/* Dịch vụ quan tâm */}
                    {client.interestedServices && client.interestedServices.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-100">
                        {client.interestedServices.map(service => (
                          <span key={service} className="bg-slate-200 text-slate-800 text-[9px] px-1.5 py-0.5 rounded font-mono font-medium">
                            #{service}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dòng 4: Chỉ số tài chính độc lập */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-slate-50/20 border border-slate-100 p-2 rounded-xl text-left">
                      <span className="text-[9px] text-slate-400 uppercase block font-semibold">Tích lũy doanh số</span>
                      <strong className="text-slate-900 font-mono text-xs">{formatVND(financials.totalRevenue)}</strong>
                    </div>
                    <div className="bg-slate-50/20 border border-slate-100 p-2 rounded-xl text-left relative overflow-hidden">
                      <span className="text-[9px] text-slate-400 uppercase block font-semibold">Công nợ còn nợ</span>
                      <strong className={`font-mono text-xs ${financials.outstandingDebt > 0 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                        {financials.outstandingDebt > 0 ? formatVND(financials.outstandingDebt) : 'Đã thu hốc'}
                      </strong>
                    </div>
                  </div>

                </div>

                {/* Chân Card: Thống kê và NÚT TẠO NHANH JOB/QUOTES */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-[10px] text-slate-400 w-full sm:w-auto text-center sm:text-left">
                    Booked: <strong className="text-slate-800">{financials.projectCount} Jobs</strong> | Nguồn: <span className="font-semibold text-slate-700 capitalize">{client.source}</span>
                  </div>

                  {/* Nút Tạo Nhanh */}
                  {onQuickAddProject && (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => onQuickAddProject(client.id, 'draft')}
                        className="flex-1 sm:flex-none text-[10px] font-bold text-slate-700 border border-slate-250 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="Tạo báo giá nháp mới cho vị khách này"
                      >
                        <FileText size={11} className="text-slate-500" /> Báo giá
                      </button>
                      <button
                        onClick={() => onQuickAddProject(client.id, 'deposited')}
                        className="flex-1 sm:flex-none text-[10px] font-bold text-white bg-brand-green-mid hover:bg-brand-green-dark px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="Tạo dự án đã chuyển tiền đặt cọc cho vị khách này"
                      >
                        <Briefcase size={11} /> Nhận Job
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}


      {/* ========================================================== */}
      {/* 5. MODAL FORM: THÊM / CẬP NHẬT THÔNG TIN KHÁCH HÀNG (DRAWER / OVERLAY) */}
      {/* ========================================================== */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 my-8"
            >
              {/* Header form */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isEditing ? 'Cập nhật hồ sơ đối tác' : 'Khai hồ sơ khách hàng mới'}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Mọi thông tin liên hệ được lưu trữ cục bộ bảo mật cao</p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-all"
                  id="btn-close-crm-form"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                
                {/* 1. Tên & Phân loại & Mức độ ưu tiên */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Tên đối tác / Họ tên cá nhân / Tên thương hiệu *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Anh Nguyễn Huy Hoàng, Agency Media Vàng..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light"
                    id="form-crm-name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Loại đối tác</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as ClientCategoryType)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light text-slate-700"
                      id="form-crm-type"
                    >
                      <option value="cá nhân">Cá nhân</option>
                      <option value="doanh nghiệp">Doanh nghiệp</option>
                      <option value="agency">Agency</option>
                      <option value="studio đối tác">Studio đối tác</option>
                      <option value="khách quen">Khách quen</option>
                      <option value="khách tiềm năng">Khách tiềm năng</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Độ ưu tiên chăm sóc</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as ClientPriorityType)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light text-slate-700"
                      id="form-crm-priority"
                    >
                      <option value="cao">🔥 Mức Cao</option>
                      <option value="trung bình">⚡ Trung bình</option>
                      <option value="thấp">☕ Thấp</option>
                    </select>
                  </div>
                </div>

                {/* 2. SĐT, Zalo & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      placeholder="09..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light"
                      id="form-crm-phone"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Zalo riêng</label>
                    <input
                      type="tel"
                      placeholder="Ghi SĐT hoặc tên hiệu"
                      value={zalo}
                      onChange={(e) => setZalo(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light"
                      id="form-crm-zalo"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Email</label>
                    <input
                      type="email"
                      placeholder="ví_dụ@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light"
                      id="form-crm-email"
                    />
                  </div>
                </div>

                {/* 3. Mạng xã hội khác */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Lịch sử trang cá nhân mạng xã hội (Links)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input 
                      type="text" 
                      placeholder="Facebook URL" 
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      className="px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none text-slate-650"
                    />
                    <input 
                      type="text" 
                      placeholder="Instagram URL" 
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none text-slate-650"
                    />
                    <input 
                      type="text" 
                      placeholder="TikTok URL" 
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      className="px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none text-slate-650"
                    />
                  </div>
                </div>

                {/* 4. Địa chỉ & Nguồn khách & Trạng thái Lead */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Địa chỉ cơ sở / Nhà riêng</label>
                  <input
                    type="text"
                    placeholder="Quận, huyện, thành phố cư trú..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light"
                    id="form-crm-address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Nguồn khách đến từ</label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value as ClientSourceType)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light text-slate-700"
                      id="form-crm-source"
                    >
                      <option value="facebook">Mạng xã hội Facebook</option>
                      <option value="tiktok">Mạng xã hội TikTok</option>
                      <option value="instagram">Mạng xã hội Instagram</option>
                      <option value="giới thiệu">Được giới thiệu</option>
                      <option value="website">Từ Website</option>
                      <option value="người quen">Người quen</option>
                      <option value="agency">Agency phân mối</option>
                      <option value="khác">Nguồn khác</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Trạng thái quan hệ</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ClientStatusType)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green-light text-slate-700"
                      id="form-crm-status"
                    >
                      <option value="lead mới">🆕 Lead mới</option>
                      <option value="đang tư vấn">💬 Đang tư vấn</option>
                      <option value="đã báo giá">📑 Đã báo giá</option>
                      <option value="đã chốt">🤝 Đã chốt (Hợp đồng sẵn sàng)</option>
                      <option value="đang làm việc">🎬 Đang làm việc / Bấm máy</option>
                      <option value="khách cũ">☕ Khách cũ / Đã xong việc</option>
                      <option value="không tiềm năng">❌ Không tiềm năng</option>
                    </select>
                  </div>
                </div>

                {/* 5. Nhóm dịch vụ quan tâm (MULTIPLE CHECKBOXES) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Nhóm dịch vụ quan tâm</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {(['Chụp ảnh', 'Quay video', 'Dựng video', 'Thiết kế', 'Content', 'Makeup', 'Livestream', 'Combo dịch vụ'] as ClientInterestedServiceType[]).map((service) => (
                      <label key={service} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={interestedServices.includes(service)}
                          onChange={() => handleToggleInterestedService(service)}
                          className="rounded text-brand-green-mid focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
                        />
                        <span>{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 6. Ghi chú cá nhân */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Ghi chú sâu sắc về khách hàng (Sở thích, lưu ý...)</label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Chỉ gọi điện buổi chiều, thích edit tone xanh lá ấm cổ điển, rất khó tính về bố cục..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                    id="form-crm-notes"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold text-slate-600 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs bg-brand-green-mid hover:bg-brand-green-light text-white rounded-lg font-bold shadow-xs cursor-pointer"
                  >
                    {isEditing ? 'Lưu chỉnh sửa' : 'Khai hồ sơ mới'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ========================================================== */}
      {/* 6. MODAL XEM CHI TIẾT ĐỐI TÁC (VIEW DETAILS - CLIENT HQ CARD) */}
      {/* ========================================================== */}
      <AnimatePresence>
        {viewingClient && (
          <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-150 my-5"
            >
              
              {/* Header chi tiết */}
              <div className="bg-brand-green-dark p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
                
                {/* Background decorative accent lines */}
                <div className="absolute inset-0 bg-linear-to-r from-teal-500/10 to-transparent pointer-events-none" />
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-brand-accent text-white font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-widest border border-white/20">
                      Hộ sơ khách hàng: {viewingClient.id}
                    </span>
                    <span className={`text-[10px] border border-white/20 bg-white/10 text-white font-bold px-2 py-0.5 rounded-md`}>
                      Nguồn: {viewingClient.source}
                    </span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-black mt-2 tracking-tight flex items-center gap-2">
                    {viewingClient.name}
                    <span className="text-xs text-white/55 font-normal">({formatDate(viewingClient.createdAt)})</span>
                  </h2>

                  {viewingClient.address && (
                    <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                      <MapPin size={13} />
                      {viewingClient.address}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setViewingClient(null)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white transition-all cursor-pointer absolute top-4 right-4"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto font-sans">
                
                {/* Grid 1: Basic Info & Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Cột 1: Thông tin cấu hình */}
                  <div className="space-y-4 md:col-span-1 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b pb-2">
                      Thông tin hồ sơ
                    </h3>
                    
                    <div className="space-y-2.5 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Phân khúc đối tác</span>
                        <span className="font-bold text-slate-900 text-sm capitalize">{viewingClient.type}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Trạng thái quan hệ</span>
                        <span className="font-bold text-slate-900 border px-2 py-0.5 rounded-md bg-white border-slate-200 mt-1 inline-block capitalize">{viewingClient.status}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Mức độ ưu tiên</span>
                        <span className={`font-bold px-2 py-0.5 rounded-md border mt-1 inline-block capitalize ${getPriorityStyles(viewingClient.priority)}`}>{viewingClient.priority}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Số điện thoại liên hệ</span>
                        <span className="font-bold text-slate-900 text-sm font-mono block">{viewingClient.phone}</span>
                        {viewingClient.zalo && <span className="text-[11px] text-slate-500 font-semibold">(Zalo: {viewingClient.zalo})</span>}
                      </div>

                      {viewingClient.email && (
                        <div>
                          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Hộp thư điện tử</span>
                          <span className="font-bold text-slate-950 font-mono select-all block break-all">{viewingClient.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cột 2: Ghi chú sở thích & sở ghét + Dịch vụ quan tâm */}
                  <div className="space-y-4 md:col-span-2 flex flex-col justify-between">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b pb-2">
                          Ghi chú thói quen & thói quen thanh toán
                        </h3>
                        <p className="text-xs text-slate-600 italic leading-relaxed mt-3 whitespace-pre-line bg-white p-3 rounded-xl border border-slate-150">
                          {viewingClient.notes ? `"${viewingClient.notes}"` : '"Chưa cập nhật ghi chú về hành vi, thói quen phối màu hay yêu cầu thời gian chụp của đối tác."'}
                        </p>
                      </div>

                      {/* Dịch vụ quan tâm */}
                      {viewingClient.interestedServices && viewingClient.interestedServices.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200">
                          <span className="text-slate-400 block font-semibold text-[10px] uppercase mb-1.5">Mảng dịch vụ đặc biệt quan tâm</span>
                          <div className="flex flex-wrap gap-2">
                            {viewingClient.interestedServices.map(service => (
                              <span key={service} className="bg-brand-green-mid/10 text-brand-green-dark border border-brand-green-mid/20 text-xs px-2.5 py-0.5 rounded-lg font-mono font-bold">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Tài chính riêng của Khách hàng */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">
                    Phân tích tài chính quan hệ
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-150 text-left">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block shrink-0">Báo giá tích lũy</span>
                      <strong className="text-slate-900 text-lg font-mono tracking-tight block mt-1">{formatVND(clientFinancials[viewingClient.id]?.totalRevenue || 0)}</strong>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-150 text-left">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block shrink-0">Thực nhận (Giá trị đã chốt)</span>
                      <strong className="text-slate-900 text-lg font-mono tracking-tight block mt-1 text-emerald-600">
                        {formatVND(
                          (clientFinancials[viewingClient.id]?.totalRevenue || 0) - (clientFinancials[viewingClient.id]?.outstandingDebt || 0)
                        )}
                      </strong>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-150 text-left">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block shrink-0">Tổng công nợ còn kẹt lại</span>
                      <strong className={`text-lg font-mono tracking-tight block mt-1 ${
                        (clientFinancials[viewingClient.id]?.outstandingDebt || 0) > 0 ? 'text-rose-500 font-extrabold animate-pulse' : 'text-slate-305'
                      }`}>
                        {formatVND(clientFinancials[viewingClient.id]?.outstandingDebt || 0)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Tab Lịch sử dự án đặt lịch (Jobs) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Briefcase size={14} className="text-slate-400" />
                      Lịch sử Dự án & Sổ việc ({viewingClientHistory.relatedProjects.length})
                    </h3>
                    <span className="text-[11px] text-slate-450 font-semibold font-mono">Xếp hạng thời gian chốt</span>
                  </div>

                  {viewingClientHistory.relatedProjects.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">Đối tác này chưa được lưu vết dự án nào trên Freelance OS.</p>
                  ) : (
                    <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-150">
                      {viewingClientHistory.relatedProjects.map(p => {
                        const statusInfo = p.status;
                        
                        return (
                          <div key={p.id} className="p-4 bg-slate-50/30 hover:bg-slate-50 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400">#{p.id}</span>
                                <span className="text-[10px] bg-slate-200 text-slate-800 font-semibold px-2 rounded">{p.serviceType}</span>
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 rounded-sm ${
                                  p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {p.status}
                                </span>
                              </div>
                              <h4 className="text-xs md:text-sm font-bold text-slate-900 mt-2 hover:underline cursor-pointer" onClick={() => {
                                if (onSelectProject) {
                                  onSelectProject(p.id);
                                  setViewingClient(null);
                                }
                              }}>
                                {p.title}
                              </h4>
                              {p.shootDate && <p className="text-[10px] text-slate-400 mt-1">Lịch bấm máy: {formatDate(p.shootDate)}</p>}
                            </div>

                            <div className="text-left sm:text-right">
                              <span className="text-xs font-mono font-black text-slate-950 block">Trị giá: {formatVND(p.price)}</span>
                              <span className="text-[10px] text-slate-500 block mt-1">Đặt cọc: {formatVND(p.deposit)} | Còn nợ: {formatVND(p.finalPayment)}</span>
                              {onSelectProject && (
                                <button
                                  onClick={() => {
                                    onSelectProject(p.id);
                                    setViewingClient(null);
                                  }}
                                  className="text-[10px] font-bold text-brand-green-mid hover:underline mt-2 flex items-center gap-0.5 sm:justify-end cursor-pointer"
                                >
                                  Mở trang quản trị dự án <ChevronRight size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tab Lịch sử giao dịch liên kết (Transactions) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <DollarSign size={14} className="text-slate-400" />
                      Lịch sử Chuyển khoản & hạch toán liên đới ({viewingClientHistory.relatedTransactions.length})
                    </h3>
                    <span className="text-[11px] text-slate-450 font-semibold font-mono">Dữ liệu từ sổ quỹ</span>
                  </div>

                  {viewingClientHistory.relatedTransactions.length === 0 ? (
                    <p className="text-xs text-slate-450 text-center py-8">Chưa ghi nhận bất kỳ chứng từ giao dịch thực tế nào cho các job của khách hàng này.</p>
                  ) : (
                    <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-150">
                      {viewingClientHistory.relatedTransactions.map(t => (
                        <div key={t.id} className="p-3 bg-white hover:bg-slate-50 transition-all flex items-center justify-between text-xs gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-mono text-slate-400 block">MÃ GD: {t.id} | Ngày: {formatDate(t.date)}</span>
                            <p className="font-bold text-slate-800 truncate mt-1">{t.description}</p>
                            <span className="text-[10px] bg-sky-50 text-sky-850 px-1.5 rounded">{t.category}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`font-mono font-black text-sm block ${
                              t.type === 'thu' ? 'text-emerald-600' : 'text-rose-500'
                            }`}>
                              {t.type === 'thu' ? '+' : '-'}{formatVND(t.amount)}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1 capitalize">Loại: {t.type === 'thu' ? 'Khách chuyển' : 'Chi ngoài'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Footer chi tiết */}
              <div className="bg-slate-50 p-4 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Mã hóa cục bộ tự động | Freelance OS CRM</span>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      if (onQuickAddProject) {
                        onQuickAddProject(viewingClient.id, 'draft');
                        setViewingClient(null);
                      }
                    }}
                    className="flex-1 sm:flex-none text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileText size={13} /> Tạo báo giá tư vấn
                  </button>
                  <button
                    onClick={() => {
                      if (onQuickAddProject) {
                        onQuickAddProject(viewingClient.id, 'deposited');
                        setViewingClient(null);
                      }
                    }}
                    className="flex-1 sm:flex-none text-xs font-bold text-white bg-brand-green-mid hover:bg-brand-green-dark px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <PlusCircle size={13} /> Bắt đầu job mới
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
