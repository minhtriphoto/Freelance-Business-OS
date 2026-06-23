/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Project, Client, ServiceType, ProjectStatus, Transaction, TransactionCategory } from '../types';
import { 
  formatVND, 
  formatDate, 
  getProjectStatusInfo, 
  getServiceColor 
} from '../utils';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  ExternalLink, 
  FileText, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  AlertTriangle,
  Clock, 
  Link as LinkIcon, 
  User, 
  AlertCircle,
  Bookmark,
  ChevronRight,
  Printer,
  Coins,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  LayoutGrid,
  List,
  KanbanSquare,
  FileCheck,
  ChevronLeft,
  Users,
  MapPin,
  HelpCircle,
  FileBadge,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  transactions?: Transaction[];
  onAddTransaction?: (transaction: Omit<Transaction, 'id'>) => void;
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  selectedProjectId: string | null;
  onClearSelectedProject: () => void;
  quickAddConfig?: { clientId: string; status: ProjectStatus } | null;
  onClearQuickAddConfig?: () => void;
}

export default function ProjectsView({
  projects,
  clients,
  transactions = [],
  onAddTransaction,
  onAddProject,
  onEditProject,
  onDeleteProject,
  selectedProjectId,
  onClearSelectedProject,
  quickAddConfig,
  onClearQuickAddConfig
}: ProjectsViewProps) {
  // 1. STATE BỘ LỌC & GIAO DIỆN
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [filterDeadline, setFilterDeadline] = useState<string>('all'); // 'all', 'today', 'this_week', 'overdue', 'near'
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'calendar' | 'grid'>('table');

  // FORM MODAL STATE
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // XEM CHI TIẾT MODAL STATE
  const [selectedDetailProject, setSelectedDetailProject] = useState<Project | null>(null);

  // QUOTE/CONTRACT PREVIEW MODAL STATE
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [previewType, setPreviewType] = useState<'quote' | 'contract'>('quote');

  // QUICK FINANCIAL TRANSACTION STATE (MODAL GHI NHẬN THU/CHI NHANH)
  const [activeFinanceProject, setActiveFinanceProject] = useState<Project | null>(null);
  const [financeType, setFinanceType] = useState<'thu' | 'chi'>('thu');
  const [financeAmount, setFinanceAmount] = useState<number>(0);
  const [financeCategory, setFinanceCategory] = useState<string>('');
  const [financeDesc, setFinanceDesc] = useState<string>('');
  const [financeDate, setFinanceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // DATE ANCHOR FOR CALENDAR VIEW
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(4); // May (0-indexed, so 4 is May)

  // CHỈ THÀNH PHẦN FORM FIELDS
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Chụp ảnh cá nhân');
  const [price, setPrice] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [depositDate, setDepositDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [shootDate, setShootDate] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('lead');
  const [notes, setNotes] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [taxDeclared, setTaxDeclared] = useState(false);

  // New detailed fields
  const [brief, setBrief] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [location, setLocation] = useState('');
  const [otherPayments, setOtherPayments] = useState(0);
  const [expectedCost, setExpectedCost] = useState(0);
  const [actualCost, setActualCost] = useState(0);
  const [priority, setPriority] = useState<'cao' | 'trung bình' | 'thấp'>('trung bình');
  const [assignee, setAssignee] = useState('');
  const [collaborators, setCollaborators] = useState('');
  const [deliverablesLink, setDeliverablesLink] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // 2. MAP CLIENTS TO DICTIONARY FOR RAPID LOOKUPS
  const clientsMap = useMemo(() => {
    return new Map(clients.map(c => [c.id, c]));
  }, [clients]);

  // Handle client selection form & sync from app dashboard selected project.
  useEffect(() => {
    if (selectedProjectId) {
      const match = projects.find(p => p.id === selectedProjectId);
      if (match) {
        setSelectedDetailProject(match);
        onClearSelectedProject();
      }
    }
  }, [selectedProjectId, projects, onClearSelectedProject]);

  // Quick add trigger
  useEffect(() => {
    if (quickAddConfig) {
      resetFormWithDefaults();
      setClientId(quickAddConfig.clientId);
      setStatus(quickAddConfig.status);
      setShowForm(true);
      if (onClearQuickAddConfig) {
        onClearQuickAddConfig();
      }
    }
  }, [quickAddConfig, onClearQuickAddConfig]);

  const serviceTypes: ServiceType[] = [
    'Chụp ảnh cá nhân',
    'Chụp ảnh sản phẩm',
    'Chụp ảnh sự kiện',
    'Quay video',
    'Dựng video',
    'TVC',
    'Reels/TikTok',
    'Thiết kế nhận diện',
    'Thiết kế social post',
    'Content marketing',
    'Makeup',
    'Combo media',
    'Khác'
  ];

  const projectStatuses: { key: ProjectStatus; label: string }[] = [
    { key: 'lead', label: 'Lead' },
    { key: 'đã báo giá', label: 'Đã báo giá' },
    { key: 'đã nhận cọc', label: 'Đã nhận cọc' },
    { key: 'đang chuẩn bị', label: 'Đang chuẩn bị' },
    { key: 'đang thực hiện', label: 'Đang thực hiện' },
    { key: 'chờ khách duyệt', label: 'Chờ khách duyệt' },
    { key: 'cần chỉnh sửa', label: 'Cần chỉnh sửa / Hậu kỳ' },
    { key: 'đã bàn giao', label: 'Đã bàn giao SP' },
    { key: 'chờ thanh toán', label: 'Chờ thanh toán' },
    { key: 'hoàn thành', label: 'Đóng / Hoàn thành' },
    { key: 'hủy', label: 'Đóng / Hủy bỏ' }
  ];

  // Helper date diff calculation (using sample timeline today as May 26, 2026)
  const getDaysDiff = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // 3. COMPLETE FINANCIAL CALCULATIONS FOR EACH PROJECT
  const getProjectFinancials = (p: Project) => {
    const projectTx = transactions.filter(t => t.projectId === p.id);
    
    // Total income from ledger
    const ledgerIncome = projectTx
      .filter(t => t.type === 'thu')
      .reduce((sum, t) => sum + t.amount, 0);

    // Deposit transactions
    const ledgerDeposit = projectTx
      .filter(t => t.type === 'thu' && t.category === 'Cọc dự án')
      .reduce((sum, t) => sum + t.amount, 0);

    // Deduct otherpayments
    const extraPaidFromTx = projectTx
      .filter(t => t.type === 'thu' && t.category !== 'Cọc dự án')
      .reduce((sum, t) => sum + t.amount, 0);

    // Fallbacks
    const depositAmount = ledgerDeposit > 0 ? ledgerDeposit : p.deposit;
    const additionalPaid = extraPaidFromTx > 0 ? extraPaidFromTx : (p.otherPayments || 0);
    const totalPaid = ledgerIncome > 0 ? ledgerIncome : (p.deposit + additionalPaid);

    const remaining = Math.max(0, p.price - totalPaid);

    // Total cost
    const ledgerCost = projectTx
      .filter(t => t.type === 'chi')
      .reduce((sum, t) => sum + t.amount, 0);
    const actualCost = ledgerCost > 0 ? ledgerCost : (p.actualCost || 0);

    // Profit
    const profit = p.price - actualCost;

    return {
      depositAmount,
      extraPaid: additionalPaid,
      totalPaid,
      remaining,
      actualCost,
      profit
    };
  };

  // 4. RESET FORM CLEANLY
  const resetFormWithDefaults = (p?: Project) => {
    if (p) {
      setEditingProject(p);
      setIsEditing(true);
      setTitle(p.title);
      setClientId(p.clientId);
      setServiceType(p.serviceType);
      setPrice(p.price);
      setDeposit(p.deposit);
      setDepositDate(p.depositDate || '');
      setDueDate(p.dueDate || '');
      setShootDate(p.shootDate || '');
      setDriveLink(p.driveLink || '');
      setStatus(p.status);
      setNotes(p.notes || '');
      setContractNumber(p.contractNumber || `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setTaxDeclared(p.taxDeclared || false);

      setBrief(p.brief || '');
      setReceivedDate(p.receivedDate || '');
      setLocation(p.location || '');
      setOtherPayments(p.otherPayments || 0);
      setExpectedCost(p.expectedCost || 0);
      setActualCost(p.actualCost || 0);
      setPriority(p.priority || 'trung bình');
      setAssignee(p.assignee || '');
      setCollaborators(p.collaborators || '');
      setDeliverablesLink(p.deliverablesLink || '');
      setInternalNotes(p.internalNotes || '');
    } else {
      setEditingProject(null);
      setIsEditing(false);
      setTitle('');
      setClientId(clients[0]?.id || '');
      setServiceType('Chụp ảnh cá nhân');
      setPrice(0);
      setDeposit(0);
      setDepositDate('');
      setDueDate('');
      setShootDate('');
      setDriveLink('');
      setStatus('lead');
      setNotes('');
      setContractNumber(`JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setTaxDeclared(false);

      setBrief('');
      setReceivedDate(new Date().toISOString().split('T')[0]);
      setLocation('');
      setOtherPayments(0);
      setExpectedCost(0);
      setActualCost(0);
      setPriority('trung bình');
      setAssignee('');
      setCollaborators('');
      setDeliverablesLink('');
      setInternalNotes('');
    }
  };

  const openAddForm = () => {
    resetFormWithDefaults();
    setShowForm(true);
  };

  const openEditForm = (p: Project) => {
    resetFormWithDefaults(p);
    setShowForm(true);
  };

  // 5. PROCESS FORM SUBMISSION
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('Vui lòng điền tên Job!');
    if (!clientId) return alert('Vui lòng chọn khách hàng liên quan!');

    const projectFinancials = {
      price,
      deposit,
      otherPayments,
      expectedCost,
      actualCost,
    };

    const calculatedPay = Math.max(0, price - deposit - otherPayments);
    const tempPayStatus: 'paid' | 'partially_paid' | 'unpaid' = 
      (deposit + otherPayments) >= price ? 'paid' : ((deposit + otherPayments) > 0 ? 'partially_paid' : 'unpaid');
    
    const finalPaymentStatus = status === 'hoàn thành' ? 'paid' as const : tempPayStatus;

    const projectData: Omit<Project, 'id'> = {
      title,
      clientId,
      serviceType,
      price,
      deposit,
      depositDate: deposit > 0 ? (depositDate || new Date().toISOString().split('T')[0]) : undefined,
      finalPayment: status === 'hoàn thành' ? 0 : calculatedPay,
      finalPaymentStatus,
      dueDate: dueDate || undefined,
      shootDate: shootDate || undefined,
      driveLink: driveLink || undefined,
      status,
      notes,
      contractNumber,
      taxDeclared,

      // Detailed specs
      brief: brief || undefined,
      receivedDate: receivedDate || undefined,
      location: location || undefined,
      otherPayments: otherPayments || 0,
      expectedCost: expectedCost || 0,
      actualCost: actualCost || 0,
      priority,
      assignee: assignee || undefined,
      collaborators: collaborators || undefined,
      deliverablesLink: deliverablesLink || undefined,
      internalNotes: internalNotes || undefined,
    };

    if (isEditing && editingProject) {
      onEditProject({
        ...editingProject,
        ...projectData,
        id: editingProject.id
      });
    } else {
      onAddProject(projectData);
    }
    setShowForm(false);
  };

  // 6. PROCESS FILTER CRITERIA
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Search Box Match
      const client = clientsMap.get(p.clientId);
      const clientName = client ? client.name.toLowerCase() : '';
      const matchSearch = 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientName.includes(searchTerm.toLowerCase()) ||
        (p.contractNumber && p.contractNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.assignee && p.assignee.toLowerCase().includes(searchTerm.toLowerCase()));

      // Dropdown Filters
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchService = filterService === 'all' || p.serviceType === filterService;
      const matchClient = filterClientId === 'all' || p.clientId === filterClientId;

      // Special Deadline Filters
      let matchDeadline = true;
      const days = getDaysDiff(p.dueDate);
      if (filterDeadline !== 'all') {
        if (filterDeadline === 'today') {
          matchDeadline = days === 0;
        } else if (filterDeadline === 'this_week') {
          matchDeadline = days !== null && days >= 0 && days <= 7;
        } else if (filterDeadline === 'overdue') {
          matchDeadline = days !== null && days < 0 && p.status !== 'hoàn thành' && p.status !== 'hủy';
        } else if (filterDeadline === 'near') {
          matchDeadline = days !== null && days >= 0 && days <= 3 && p.status !== 'hoàn thành' && p.status !== 'hủy';
        }
      }

      return matchSearch && matchStatus && matchService && matchClient && matchDeadline;
    });
  }, [projects, searchTerm, filterStatus, filterService, filterClientId, filterDeadline, clientsMap]);

  // 7. IN-DEPHT ACTION: RECORD TRANSACTION (FAST BOOK INCOME/COST)
  const openFinanceAction = (p: Project, type: 'thu' | 'chi') => {
    setActiveFinanceProject(p);
    setFinanceType(type);
    setFinanceAmount(0);
    setFinanceDate(new Date().toISOString().split('T')[0]);
    
    if (type === 'thu') {
      setFinanceCategory('Thanh toán đợt cuối');
      setFinanceDesc(`Thu tiền thanh toán thêm cho Job "${p.title}"`);
    } else {
      setFinanceCategory('Thuê thiết bị');
      setFinanceDesc(`Chi phí thực hiện Job "${p.title}"`);
    }
  };

  const handleCreateFinanceTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFinanceProject || financeAmount <= 0) return alert('Vui lòng điền số tiền hợp lý!');
    if (!onAddTransaction) {
      alert('Không tìm thấy chức năng lập sổ quỹ!');
      return;
    }

    onAddTransaction({
      transactionNumber: '',
      projectId: activeFinanceProject.id,
      clientId: activeFinanceProject.clientId || undefined,
      type: financeType,
      amount: financeAmount,
      category: financeCategory as any,
      date: financeDate,
      method: 'Chuyển khoản',
      notes: financeDesc || (financeType === 'thu' ? 'Thu bổ sung' : 'Chi phí bổ sung'),
      status: 'Đã ghi nhận',
      description: financeDesc || (financeType === 'thu' ? 'Thu bổ sung' : 'Chi phí bổ sung')
    });

    // Update project attributes dynamically for the state fallback
    const financials = getProjectFinancials(activeFinanceProject);
    const updatedProject = { ...activeFinanceProject };
    
    if (financeType === 'thu') {
      updatedProject.otherPayments = (updatedProject.otherPayments || 0) + financeAmount;
    } else {
      updatedProject.actualCost = (updatedProject.actualCost || 0) + financeAmount;
    }
    onEditProject(updatedProject);

    setActiveFinanceProject(null);
    alert(`Đã ghi nhận giao dịch thành công cho Job: "${activeFinanceProject.title}"!`);
  };

  // 8. SOẠN BÁO GIÁ / HỢP ĐỒNG DOC PREVIEWS
  const triggerDocPreview = (project: Project, type: 'quote' | 'contract') => {
    setPreviewProject(project);
    setPreviewType(type);
  };

  // 9. DỰNG CALENDAR SLOTS
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay(); // 0 is Sunday

  const monthsList = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const calendarDays = useMemo(() => {
    const totalDays = daysInMonth(calendarMonth, calendarYear);
    const firstDay = startDayOfMonth(calendarMonth, calendarYear);
    
    // Day objects to populate the calendar matrix
    const matrix: Array<{ day: number | null; dateString: string | null }> = [];
    
    // Padding for blank days before day 1
    const padCount = firstDay === 0 ? 6 : firstDay - 1; // Align Mon starts
    for (let i = 0; i < padCount; i++) {
      matrix.push({ day: null, dateString: null });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(calendarMonth + 1).padStart(2, '0');
      matrix.push({
        day: d,
        dateString: `${calendarYear}-${monthStr}-${dayStr}`
      });
    }

    return matrix;
  }, [calendarMonth, calendarYear]);

  // Map calendar events dynamically
  const getDayEvents = (dateStr: string) => {
    const events: Array<{ type: 'received' | 'shoot' | 'due'; project: Project; label: string }> = [];
    
    projects.forEach(p => {
      if (p.receivedDate === dateStr) {
        events.push({ type: 'received', project: p, label: `🟢 Nhận: ${p.title}` });
      }
      if (p.shootDate === dateStr) {
        events.push({ type: 'shoot', project: p, label: `🔵 Diễn: ${p.title}` });
      }
      if (p.dueDate === dateStr) {
        events.push({ type: 'due', project: p, label: `🔴 Hạn giao: ${p.title}` });
      }
    });

    return events;
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION WITH STAT OVERLAYS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="space-y-1 z-10">
          <span className="text-[10px] bg-brand-green-mid text-white px-2 py-0.5 rounded-full font-bold tracking-wider uppercase">Module cốt lõi</span>
          <h1 className="text-2xl md:text-3xl font-extrabold font-sans">Quản lý Job & Dự án</h1>
          <p className="text-xs text-slate-350 max-w-xl">Hệ điều hành theo dõi vòng đời dự án tự động: nhận brief, giám sát tiến độ bấm máy, tự động hoạch toán dòng tiền cọc và công nợ.</p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-brand-green-mid hover:bg-brand-green-light active:scale-95 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 self-start lg:self-auto shadow-lg z-10"
          id="btn-add-project-header"
        >
          <Plus size={16} /> Tạo Job Mới
        </button>

        {/* Backdrop visual accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
      </div>

      {/* FILTER CONTROLS GRID */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase">Bộ lọc nâng cao</span>
          </div>
          
          {/* VIEW MODE SWITCHER */}
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              title="Xem dạng bảng"
            >
              <List size={14} /> Bảng
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              title="Xem dạng Kanban"
            >
              <KanbanSquare size={14} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              title="Xem dạng lịch"
            >
              <CalendarIcon size={14} /> Lịch biểu
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              title="Xem dạng lưới"
            >
              <LayoutGrid size={14} /> Thẻ (Grid)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Text search */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" size={15} />
            <input
              type="text"
              placeholder="Tìm tên Job, khách hàng, người phụ trách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Status Select */}
          <div className="md:col-span-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700"
            >
              <option value="all">Tất cả trạng thái</option>
              {projectStatuses.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Service Select */}
          <div className="md:col-span-2">
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700"
            >
              <option value="all">Tất cả dịch vụ</option>
              {serviceTypes.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Client Select */}
          <div className="md:col-span-2">
            <select
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700"
            >
              <option value="all">Mọi khách hàng</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Deadline Select */}
          <div className="md:col-span-2">
            <select
              value={filterDeadline}
              onChange={(e) => setFilterDeadline(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium text-slate-800"
            >
              <option value="all">Mọi kỳ hạn</option>
              <option value="today" className="text-red-700 font-bold">⚠️ Hôm nay</option>
              <option value="near" className="text-amber-700 font-bold">⏳ Sắp tới hạn (3 ngày)</option>
              <option value="this_week" className="text-indigo-700">🗓️ Tuần này (7 ngày)</option>
              <option value="overdue" className="text-rose-800 font-semibold">❌ Quá hạn chưa xong</option>
            </select>
          </div>
        </div>
      </div>

      {/* JOBS RENDER CONTAINER */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center space-y-4 max-w-4xl mx-auto">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full inline-block">
            <Bookmark size={36} className="text-slate-350" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-800 text-base">Không tìm thấy Job nào</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">Không có kết quả nào khớp với điều kiện tìm kiếm và lọc của bạn. Thử khởi lập bộ lọc hoặc tạo một Job mới!</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterService('all');
                setFilterClientId('all');
                setFilterDeadline('all');
              }}
              className="border border-slate-200 text-slate-700 text-xs px-4 py-2 rounded-xl hover:bg-slate-50"
            >
              Xóa Bộ Lọc
            </button>
            <button
              onClick={openAddForm}
              className="bg-brand-green-mid hover:bg-brand-green-light text-white text-xs font-semibold px-4 py-2 rounded-xl"
            >
              Tạo Thử Job Mới
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ==================== A. VIEW MODE: TABLE ==================== */}
          {viewMode === 'table' && (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-4 px-4 w-18">Mã Job</th>
                        <th className="py-4 px-4">Tên Job / Dịch Vụ</th>
                        <th className="py-4 px-4">Khách Hàng</th>
                        <th className="py-4 px-4 text-right">Giá Trị / Đã Trả</th>
                        <th className="py-4 px-4 text-right">Số Còn Lại</th>
                        <th className="py-4 px-4 text-center">Trạng Thái / Ưu Tiên</th>
                        <th className="py-4 px-4">Hạn bàn giao</th>
                        <th className="py-4 px-4 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProjects.map((project) => {
                        const client = clientsMap.get(project.clientId);
                        const statusInfo = getProjectStatusInfo(project.status);
                        const fin = getProjectFinancials(project);
                        const serviceColor = getServiceColor(project.serviceType);
                        
                        const daysLeft = getDaysDiff(project.dueDate);
                        const isNearDeadline = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && project.status !== 'hoàn thành' && project.status !== 'hủy';
                        const isOverdue = daysLeft !== null && daysLeft < 0 && project.status !== 'hoàn thành' && project.status !== 'hủy';
                        const isDeliveredAndUnpaid = (project.status === 'đã bàn giao' || project.status === 'delivered') && fin.remaining > 0;

                        return (
                          <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Mã Job */}
                            <td className="py-4 px-4 font-mono font-semibold text-slate-600">
                              {project.contractNumber || `JOB-${project.id}`}
                            </td>

                            {/* Tên & dịch vụ */}
                            <td className="py-4 px-4 max-w-xs">
                              <span className="font-bold text-slate-900 block truncate">{project.title}</span>
                              <span className={`text-[10px] font-medium ${serviceColor} flex items-center gap-1 mt-0.5`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {project.serviceType}
                              </span>
                            </td>

                            {/* Khách hàng */}
                            <td className="py-4 px-4">
                              <span className="font-semibold text-slate-800 block">{client?.name || 'Khách thô'}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">{client?.phone || '-'}</span>
                            </td>

                            {/* Giá trị / Đã trả */}
                            <td className="py-4 px-4 text-right">
                              <span className="font-bold text-slate-900 block">{formatVND(project.price)}</span>
                              <span className="text-[10px] text-emerald-600 font-medium">Đã trả: {formatVND(fin.totalPaid)}</span>
                            </td>

                            {/* Công nợ còn lại */}
                            <td className="py-4 px-4 text-right">
                              <span className={`font-bold block ${fin.remaining > 0 ? 'text-orange-650' : 'text-slate-400'}`}>
                                {formatVND(fin.remaining)}
                              </span>
                              {isDeliveredAndUnpaid && (
                                <span className="inline-block bg-amber-100 text-amber-800 text-[8px] px-1 py-0.2 rounded font-bold uppercase mt-0.5 tracking-wide">🔥 Chưa thanh toán</span>
                              )}
                            </td>

                            {/* Trạng thái / Ưu tiên */}
                            <td className="py-4 px-4 text-center space-y-1">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold border text-[9px] tracking-wide ${statusInfo.bgClass}`}>
                                {statusInfo.label}
                              </span>
                              <div className="flex justify-center">
                                {project.priority === 'cao' ? (
                                  <span className="bg-red-50 text-red-700 text-[8px] px-1.5 py-0.2 rounded font-bold uppercase">Cao</span>
                                ) : project.priority === 'thấp' ? (
                                  <span className="bg-slate-50 text-slate-500 text-[8px] px-1.5 py-0.2 rounded font-semibold uppercase">Thấp</span>
                                ) : (
                                  <span className="bg-indigo-50 text-indigo-700 text-[8px] px-1.5 py-0.2 rounded font-semibold uppercase">T.Bình</span>
                                )}
                              </div>
                            </td>

                            {/* Hạn / Warning */}
                            <td className="py-4 px-4">
                              <span className="font-medium text-slate-700 block">{formatDate(project.dueDate)}</span>
                              {isOverdue && (
                                <span className="inline-flex items-center gap-0.5 text-red-600 font-semibold text-[10px]" title="Quá hạn!">
                                  <AlertCircle size={10} /> Quá {Math.abs(daysLeft || 0)} ngày
                                </span>
                              )}
                              {isNearDeadline && (
                                <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold text-[10px] animate-pulse" title="Sắp deadline!">
                                  <AlertTriangle size={10} /> Trả trong {daysLeft} ngày
                                </span>
                              )}
                            </td>

                            {/* Thao tác */}
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedDetailProject(project)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                                  title="Xem chi tiết"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  onClick={() => openEditForm(project)}
                                  className="p-1.5 text-teal-600 hover:text-teal-900 hover:bg-teal-50 rounded-lg"
                                  title="Sửa"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Bạn có chắc muốn xóa Job: "${project.title}" không?`)) {
                                      onDeleteProject(project.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg"
                                  title="Xóa"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE CARD VIEW (Equivalent of Table but for Mobile) */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {filteredProjects.map((project) => {
                  const client = clientsMap.get(project.clientId);
                  const statusInfo = getProjectStatusInfo(project.status);
                  const fin = getProjectFinancials(project);
                  const serviceColor = getServiceColor(project.serviceType);
                  
                  const daysLeft = getDaysDiff(project.dueDate);
                  const isNearDeadline = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && project.status !== 'hoàn thành' && project.status !== 'hủy';
                  const isOverdue = daysLeft !== null && daysLeft < 0 && project.status !== 'hoàn thành' && project.status !== 'hủy';
                  const isDeliveredAndUnpaid = (project.status === 'đã bàn giao' || project.status === 'delivered') && fin.remaining > 0;

                  return (
                    <div
                      key={project.id}
                      className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400">Code: {project.contractNumber}</span>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">{project.title}</h3>
                          <p className={`text-[10px] font-bold ${serviceColor}`}>{project.serviceType}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold border text-[8px] uppercase tracking-wide shrink-0 ${statusInfo.bgClass}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg space-y-1.5 text-xs text-slate-650">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Khách hàng:</span>
                          <strong className="text-slate-800 truncate pl-2">{client?.name || 'Khách thô'}</strong>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                          <span className="text-slate-500">Giá trị:</span>
                          <strong className="text-slate-900">{formatVND(project.price)}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Còn nợ:</span>
                          <strong className={`font-bold ${fin.remaining > 0 ? 'text-orange-650' : 'text-slate-400'}`}>{formatVND(fin.remaining)}</strong>
                        </div>
                      </div>

                      <div className="flex gap-2 text-xs pt-1">
                        <button
                          onClick={() => setSelectedDetailProject(project)}
                          className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-bold py-2 rounded-xl text-center"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => openEditForm(project)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-center"
                        >
                          Sửa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ==================== B. VIEW MODE: KANBAN ==================== */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 overflow-x-auto select-none py-1">
              <div className="flex gap-4 pb-4">
                {projectStatuses.map((col) => {
                  const colJobs = filteredProjects.filter(p => p.status === col.key);
                  return (
                    <div key={col.key} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl w-72 shrink-0 space-y-3 flex flex-col justify-between max-h-[75vh]">
                      {/* Column Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 block truncate pr-2">{col.label}</span>
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          {colJobs.length}
                        </span>
                      </div>

                      {/* Cards loop */}
                      <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
                        {colJobs.length === 0 ? (
                          <div className="bg-white/50 border border-dashed border-slate-200 p-8 rounded-xl text-center text-[10px] text-slate-400 font-medium">
                            Kéo thả hoặc chuyển Job vào đây
                          </div>
                        ) : (
                          colJobs.map(project => {
                            const client = clientsMap.get(project.clientId);
                            const fin = getProjectFinancials(project);
                            const serviceColor = getServiceColor(project.serviceType);
                            const daysLeft = getDaysDiff(project.dueDate);
                            const isNearDeadline = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && project.status !== 'hoàn thành' && project.status !== 'hủy';
                            const isOverdue = daysLeft !== null && daysLeft < 0 && project.status !== 'hoàn thành' && project.status !== 'hủy';
                            const isDeliveredAndUnpaid = (project.status === 'đã bàn giao' || project.status === 'delivered') && fin.remaining > 0;

                            return (
                              <div
                                key={project.id}
                                className={`bg-white border rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all space-y-2 ${
                                  isNearDeadline ? 'border-amber-300' : 'border-slate-150'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="text-[9px] font-mono text-slate-450 block">{project.contractNumber}</span>
                                  {project.priority === 'cao' && (
                                    <span className="bg-red-50 text-red-700 text-[8px] px-1 py-0.2 rounded font-bold">Cao</span>
                                  )}
                                </div>

                                <div>
                                  <span 
                                    onClick={() => setSelectedDetailProject(project)}
                                    className="font-bold text-xs text-slate-900 block hover:text-indigo-650 cursor-pointer line-clamp-2"
                                  >
                                    {project.title}
                                  </span>
                                  <span className={`text-[9px] font-medium block mt-1 ${serviceColor}`}>{project.serviceType}</span>
                                </div>

                                <div className="text-[10px] text-slate-650 flex items-center gap-1 bg-slate-50 p-1.5 rounded-lg">
                                  <User size={10} className="text-slate-400 shrink-0" />
                                  <span className="truncate pr-1">KH: <strong>{client?.name || 'Chưa rõ'}</strong></span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                                  <span className="text-slate-500 font-mono">Dư: <strong className="text-slate-800 font-bold">{formatVND(fin.remaining)}</strong></span>
                                  <span className="text-slate-405 text-[9px]">{formatDate(project.dueDate)}</span>
                                </div>

                                {/* Warning Badges */}
                                {isNearDeadline && (
                                  <div className="bg-amber-100 text-amber-800 text-[8px] font-bold p-1 rounded text-center animate-pulse flex items-center justify-center gap-0.5">
                                    <AlertTriangle size={10} /> Deadline {daysLeft} ngày!
                                  </div>
                                )}
                                {isOverdue && (
                                  <div className="bg-rose-100 text-rose-800 text-[8px] font-bold p-1 rounded text-center flex items-center justify-center gap-0.5">
                                    <AlertCircle size={10} /> Trễ {Math.abs(daysLeft || 0)} ngày!
                                  </div>
                                )}
                                {isDeliveredAndUnpaid && (
                                  <div className="bg-orange-100 text-orange-850 text-[8px] font-bold p-0.5 rounded text-center uppercase tracking-wide">
                                    ⚠️ Giao SP - Chưa thanh toán
                                  </div>
                                )}

                                {/* Rapid Quick Actions bar */}
                                <div className="flex items-center justify-end gap-1.5 pt-1">
                                  <button
                                    onClick={() => setSelectedDetailProject(project)}
                                    className="px-2 py-1 text-[9px] bg-indigo-50 text-indigo-750 hover:bg-indigo-100 rounded"
                                  >
                                    Xem
                                  </button>
                                  <button
                                    onClick={() => openEditForm(project)}
                                    className="px-2 py-1 text-[9px] bg-slate-100 text-slate-700 hover:bg-slate-200 rounded"
                                  >
                                    Sửa
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== C. VIEW MODE: CALENDAR ==================== */}
          {viewMode === 'calendar' && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="text-indigo-600" size={18} />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Lịch biểu hoạt động</h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <button onClick={handlePrevMonth} className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="w-28 text-center uppercase">{monthsList[calendarMonth]} - {calendarYear}</span>
                  <button onClick={handleNextMonth} className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Day header */}
                  <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-slate-500 text-[10px] uppercase pt-4">
                    <span>Thứ 2</span>
                    <span>Thứ 3</span>
                    <span>Thứ 4</span>
                    <span>Thứ 5</span>
                    <span>Thứ 6</span>
                    <span>Thứ 7</span>
                    <span className="text-rose-600">Chủ Nhật</span>
                  </div>

                  {/* Grid matrix */}
                  <div className="grid grid-cols-7 gap-1.5 min-h-[420px] mt-2">
                {calendarDays.map((dateObj, i) => {
                  const events = dateObj.dateString ? getDayEvents(dateObj.dateString) : [];
                  
                  return (
                    <div
                      key={i}
                      className={`border rounded-xl p-1.5 flex flex-col justify-between min-h-[70px] ${
                        dateObj.day ? 'bg-white border-slate-100' : 'bg-slate-50/50 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-mono font-bold ${i % 7 === 6 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {dateObj.day || ''}
                        </span>
                        {events.length > 0 && (
                          <span className="bg-indigo-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {events.length}
                          </span>
                        )}
                      </div>

                      {/* Display small dots / rows */}
                      <div className="space-y-1 mt-1">
                        {events.slice(0, 2).map((ev, index) => (
                          <div
                            key={index}
                            onClick={() => setSelectedDetailProject(ev.project)}
                            className={`text-[8px] p-0.5 rounded font-bold cursor-pointer truncate ${
                              ev.type === 'received' ? 'bg-emerald-50 text-emerald-800' : 
                              ev.type === 'shoot' ? 'bg-sky-50 text-sky-850' : 
                              'bg-rose-50 text-rose-850'
                            }`}
                            title={ev.label}
                          >
                            {ev.project.title}
                          </div>
                        ))}
                        {events.length > 2 && (
                          <div className="text-[7px] text-slate-400 font-bold text-center">+{events.length - 2} sự kiện khác</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-650 justify-center pt-2.5 border-t border-slate-50">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> 🟢 Ngày nhận job</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span> 🔵 Ngày thực hiện / quay chụp</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> 🔴 Hạn trả / Bàn giao sản phẩm</span>
              </div>
            </div>
          )}

          {/* ==================== D. VIEW MODE: GRID (EXISTING REFINED CARD) ==================== */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((project) => {
                const client = clientsMap.get(project.clientId);
                const statusInfo = getProjectStatusInfo(project.status);
                const fin = getProjectFinancials(project);
                const serviceColor = getServiceColor(project.serviceType);
                
                const daysLeft = getDaysDiff(project.dueDate);
                const isNearDeadline = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && project.status !== 'hoàn thành' && project.status !== 'hủy';
                const isOverdue = daysLeft !== null && daysLeft < 0 && project.status !== 'hoàn thành' && project.status !== 'hủy';
                const isDeliveredAndUnpaid = (project.status === 'đã bàn giao' || project.status === 'delivered') && fin.remaining > 0;

                return (
                  <div
                    key={project.id}
                    className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className={`px-2 py-0.5 rounded-full font-bold border text-[8px] uppercase tracking-wide ${statusInfo.bgClass}`}>
                          {statusInfo.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Code: {project.contractNumber}</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 pt-2 leading-snug">{project.title}</h3>
                      <p className={`text-[10px] font-bold mt-1 ${serviceColor}`}>{project.serviceType}</p>

                      <div className="mt-3 bg-slate-50 p-3 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <User size={12} className="text-slate-400" />
                          <span className="text-slate-600">Khách: <strong>{client?.name || 'Khách thô'}</strong></span>
                        </div>
                        {project.shootDate && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-650">
                            <Clock size={12} className="text-slate-400" />
                            <span>Diễn ngày: {formatDate(project.shootDate)}</span>
                          </div>
                        )}
                        {project.location && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-650">
                            <MapPin size={12} className="text-slate-400" />
                            <span className="truncate">Địa điểm: {project.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs pt-2 border-t border-slate-100">
                        <span className="text-slate-500 font-semibold">Giá trị hợp đồng:</span>
                        <strong className="text-slate-900">{formatVND(project.price)}</strong>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-semibold">Còn lại thu nợ:</span>
                        <strong className={`font-bold ${fin.remaining > 0 ? 'text-orange-650' : 'text-slate-400'}`}>{formatVND(fin.remaining)}</strong>
                      </div>

                      {isNearDeadline && (
                        <div className="bg-amber-50 text-amber-800 text-[10px] font-bold p-2 rounded-xl text-center border border-amber-200">
                          ⌛ Còn {daysLeft} ngày đến deadline bàn giao sản phẩm!
                        </div>
                      )}
                      {isOverdue && (
                        <div className="bg-rose-50 text-rose-800 text-[10px] font-bold p-2 rounded-xl text-center border border-rose-200">
                          ❌ Dự án quá hạn bàn giao {Math.abs(daysLeft || 0)} ngày!
                        </div>
                      )}
                      {isDeliveredAndUnpaid && (
                        <div className="bg-orange-50 text-orange-850 text-[10px] font-bold p-2 rounded-xl text-center border border-orange-200 uppercase">
                          ⚠️ Đã bàn giao sản phẩm nhưng chưa thanh toán đủ!
                        </div>
                      )}

                      <div className="flex gap-2 pt-1 border-t border-slate-50">
                        <button
                          onClick={() => setSelectedDetailProject(project)}
                          className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 text-xs font-bold py-2 rounded-xl text-center"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => openEditForm(project)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl text-center"
                        >
                          Sửa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ======================================================= */}
      {/* 10. MODAL: DETAILED VIEW DRAWER (CHI TIẾT JOB)           */}
      {/* ======================================================= */}
      {selectedDetailProject && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-6 relative shadow-2xl">
            <button 
              onClick={() => setSelectedDetailProject(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1 bg-slate-50 rounded-full"
            >
              <X size={18} />
            </button>

            {/* Header specifications of job */}
            <div className="border-b border-slate-100 pb-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[9px] uppercase tracking-wide ${getProjectStatusInfo(selectedDetailProject.status).bgClass}`}>
                  Trạng thái: {getProjectStatusInfo(selectedDetailProject.status).label}
                </span>
                <span className="bg-slate-100 text-slate-700 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                  Mã Job: {selectedDetailProject.contractNumber || `JOB-${selectedDetailProject.id}`}
                </span>
                {selectedDetailProject.priority === 'cao' && (
                  <span className="bg-rose-100 text-rose-800 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase">Mức ưu tiên: Cao</span>
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-950 font-sans tracking-tight">{selectedDetailProject.title}</h2>
              <p className="text-xs text-indigo-700 font-bold">Mảng: {selectedDetailProject.serviceType}</p>
            </div>

            {/* Information tabs grid / widgets */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Left Column: Stats & Operations */}
              <div className="md:col-span-8 space-y-5">
                {/* 1. Brief / mô tả chi tiết */}
                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                    <FileBadge size={14} className="text-indigo-600" /> Mô tả & Brief yêu cầu
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line bg-white/80 p-3 rounded-lg border border-slate-100">
                    {selectedDetailProject.brief || selectedDetailProject.notes || 'Chưa cung cấp mô tả brief.'}
                  </p>
                </div>

                {/* 2. Job specifications schedule */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tiến độ thực hiện</span>
                    <div className="space-y-1.5 text-xs text-slate-705 font-medium">
                      <p>🗓️ Ngày nhận job: <strong>{formatDate(selectedDetailProject.receivedDate)}</strong></p>
                      <p>🎬 Ngày thực hiện: <strong className="text-sky-700">{formatDate(selectedDetailProject.shootDate)}</strong></p>
                      <p>💥 Deadline bàn giao: <strong className="text-rose-700">{formatDate(selectedDetailProject.dueDate)}</strong></p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Địa điểm & Nhân sự</span>
                    <div className="space-y-1.5 text-xs text-slate-705 font-medium">
                      <p>📍 Địa điểm: <strong>{selectedDetailProject.location || 'Chưa thiết lập'}</strong></p>
                      <p>👤 Người phụ trách: <strong className="text-slate-855">{selectedDetailProject.assignee || 'Chưa định danh'}</strong></p>
                      <p>👥 CTV liên quan: <strong>{selectedDetailProject.collaborators || 'Không có'}</strong></p>
                    </div>
                  </div>
                </div>

                {/* 3. Deliverables Drive links widgets */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-805 uppercase tracking-wide">Tài nguyên & Tài liệu đính kèm</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <a
                      href={selectedDetailProject.driveLink || '#'}
                      target={selectedDetailProject.driveLink ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between p-3 rounded-xl border font-bold ${
                        selectedDetailProject.driveLink 
                          ? 'bg-emerald-50 text-emerald-805 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-zinc-50 text-zinc-400 border-zinc-200 cursor-not-allowed'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">📁 Link Google Drive</span>
                      <ExternalLink size={14} />
                    </a>
                    
                    <a
                      href={selectedDetailProject.deliverablesLink || '#'}
                      target={selectedDetailProject.deliverablesLink ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between p-3 rounded-xl border font-bold ${
                        selectedDetailProject.deliverablesLink 
                          ? 'bg-violet-50 text-violet-805 border-violet-200 hover:bg-violet-100' 
                          : 'bg-zinc-50 text-zinc-400 border-zinc-200 cursor-not-allowed'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">🔗 Link file bàn giao</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                {/* Internal notes */}
                {selectedDetailProject.internalNotes && (
                  <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/50 space-y-1">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Ghi chú nội bộ</span>
                    <p className="text-xs leading-relaxed text-amber-900">{selectedDetailProject.internalNotes}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Financial Calculation Card */}
              <div className="md:col-span-4 bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                    <Coins size={12} className="text-amber-500" /> Sổ quỹ tài chính Job
                  </span>
                </div>

                {/* Calculations details */}
                {(() => {
                  const fin = getProjectFinancials(selectedDetailProject);
                  return (
                    <div className="space-y-3.5 text-xs text-slate-700">
                      <div className="flex justify-between font-medium">
                        <span>Giá trị h.đồng:</span>
                        <strong className="text-slate-900 text-sm">{formatVND(selectedDetailProject.price)}</strong>
                      </div>
                      <div className="flex justify-between text-slate-505 font-medium">
                        <span>Đặt cọc đã thu:</span>
                        <strong className="text-slate-800">-{formatVND(fin.depositAmount)}</strong>
                      </div>
                      <div className="flex justify-between text-slate-505 font-medium">
                        <span>Thu thêm đợt cuối:</span>
                        <strong className="text-slate-800">-{formatVND(fin.extraPaid)}</strong>
                      </div>

                      <div className="flex justify-between font-bold border-t border-slate-200 pt-2 text-slate-900">
                        <span>Công nợ còn lại:</span>
                        <span className={fin.remaining > 0 ? 'text-orange-650' : 'text-slate-400'}>
                          {formatVND(fin.remaining)}
                        </span>
                      </div>

                      {/* Expected vs Actual Cost */}
                      <div className="border-t border-slate-200 pt-3 space-y-2">
                        <div className="flex justify-between">
                          <span>Dự kiến chi phí:</span>
                          <span className="font-mono">{formatVND(selectedDetailProject.expectedCost || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Chi phí thực tế:</span>
                          <span className="font-mono font-bold text-rose-700">{formatVND(fin.actualCost)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                          <span>Lợi nhuận tạm tính:</span>
                          <span className={fin.profit >= 0 ? 'text-teal-605' : 'text-red-700'}>
                            {formatVND(fin.profit)}
                          </span>
                        </div>
                      </div>

                      {/* Transaction Recording Fast triggers */}
                      <div className="pt-2 flex flex-col gap-2">
                        <button
                          onClick={() => openFinanceAction(selectedDetailProject, 'thu')}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2 rounded-xl text-center text-[11px] flex items-center justify-center gap-1 shadow-xs"
                        >
                          💸 Ghi nhận thanh toán (+ thu)
                        </button>
                        <button
                          onClick={() => openFinanceAction(selectedDetailProject, 'chi')}
                          className="w-full border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold py-2 rounded-xl text-center text-[11px] flex items-center justify-center gap-1"
                        >
                          💸 Thêm chi phí cho Job (- chi)
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* DOCTUMENT EXPORTS AND TRIGGERS */}
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mẫu tài liệu nhanh</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerDocPreview(selectedDetailProject, 'quote')}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 font-bold py-1.5 rounded-lg text-center text-[10px] text-slate-800"
                    >
                      📄 Tạo Báo Giá
                    </button>
                    <button
                      onClick={() => triggerDocPreview(selectedDetailProject, 'contract')}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-150 font-bold py-1.5 rounded-lg text-center text-[10px] text-indigo-750"
                    >
                      🖋️ Tạo Hợp Đồng
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 text-xs">
              <button
                onClick={() => {
                  openEditForm(selectedDetailProject);
                  setSelectedDetailProject(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl"
              >
                Chỉnh sửa thông số Job
              </button>
              <button
                onClick={() => setSelectedDetailProject(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 11. QUICK FINANCE ACTION MODAL                           */}
      {/* ======================================================= */}
      {activeFinanceProject && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-55 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 w-full max-w-md space-y-4 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setActiveFinanceProject(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-850"
            >
              <X size={16} />
            </button>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                {financeType === 'thu' ? '💎 Thu tiền thanh toán' : '💼 Ghi nhận chi phí cho Job'}
              </h3>
              <p className="text-xs text-slate-400">Dữ liệu sẽ được tự động đồng bộ hóa nợ nần & cập nhật thẳng vào Sổ Sách quỹ chung.</p>
            </div>

            <form onSubmit={handleCreateFinanceTransaction} className="space-y-3 text-xs text-slate-700">
              <div className="space-y-1">
                <span className="font-semibold text-slate-805">Số tiền giao dịch (VND):</span>
                <input
                  type="number"
                  value={financeAmount || ''}
                  onChange={(e) => setFinanceAmount(Number(e.target.value))}
                  placeholder="e.g. 5000000"
                  className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-805">Hạng mục:</span>
                <select
                  value={financeCategory}
                  onChange={(e) => setFinanceCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                >
                  {financeType === 'thu' ? (
                    <>
                      <option value="Thanh toán đợt cuối">Thanh toán đợt cuối</option>
                      <option value="Cọc dự án">Đặt cọc bổ sung</option>
                      <option value="Doanh thu ngoài">Khoản thu ngoài chi tiết</option>
                    </>
                  ) : (
                    <>
                      <option value="Thuê thiết bị">Thuê thiết bị</option>
                      <option value="Thuê studio / bối cảnh">Thuê studio / bối cảnh</option>
                      <option value="Thuê nhân sự ngoài (Model/Trợ lý/...)">Thuê nhân sự ngoài</option>
                      <option value="Trang điểm / Trang phục">Trang điểm / Trang phục</option>
                      <option value="Di chuyển / Xăng xe">Di chuyển / Xăng xe</option>
                      <option value="Ăn uống / Tiếp khách">Ăn uống / Tiếp khách</option>
                      <option value="Khác">Phụ phí phát sinh khác</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-805">Ngày hạch toán:</span>
                <input
                  type="date"
                  value={financeDate}
                  onChange={(e) => setFinanceDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-805">Mô tả giao dịch:</span>
                <textarea
                  value={financeDesc}
                  onChange={(e) => setFinanceDesc(e.target.value)}
                  placeholder="e.g. Ghi nhận thanh toán qua Zalo Pay"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className={`flex-1 py-1.5 rounded-lg text-white font-bold text-center ${
                    financeType === 'thu' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Xác nhận lưu Ghi chép
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFinanceProject(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 12. FULL FORM MODAL (TẠO MỚI / SỬA JOB)                   */}
      {/* ======================================================= */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-6 relative shadow-2xl">
            <button 
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-slate-405 hover:text-slate-800 p-1.5 bg-slate-50 rounded-full"
            >
              <X size={18} />
            </button>

            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-xl font-extrabold text-slate-950 font-sans">
                {isEditing ? '🖊️ Hiệu chỉnh thông số Job / Dự án' : '🚀 Setup & Bấm lịch Job mới'}
              </h2>
              <p className="text-xs text-slate-450 mt-1">Lập kế hoạch công việc, chỉ định người phụ trách và kiểm soát nợ nần.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-700">
              {/* SECTION 1: CÁC THÔNG SỐ CƠ BẢN */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">1.. Thông tin cốt lõi</h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3 space-y-1">
                    <span className="font-semibold text-slate-805">Mã Job / Dự án (Tự động):</span>
                    <input
                      type="text"
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 placeholder-slate-400 font-mono font-bold"
                      placeholder="e.g. BG-2026-001"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-5 space-y-1">
                    <span className="font-semibold text-slate-805">Tên Job / Dự án: *</span>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900 placeholder-slate-400"
                      placeholder="e.g. Chụp Lookbook BST Hè - ThuyDesign"
                      required
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-805 font-sans">Khách hàng liên quan: *</span>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium"
                      required
                    >
                      <option value="" disabled>--- Vui lòng chọn khách hàng ---</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-805">Loại dịch vụ:</span>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value as ServiceType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium"
                    >
                      {serviceTypes.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-805">Trạng thái Job:</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-805 font-bold uppercase tracking-wider"
                    >
                      {projectStatuses.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-805">Mức độ ưu tiên:</span>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'cao' | 'trung bình' | 'thấp')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800"
                    >
                      <option value="thấp">Thấp</option>
                      <option value="trung bình">Trung bình</option>
                      <option value="cao">Cao</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SCHEDULE & PERSONNEL */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">2.. Kế hoạch thời gian & Phân công</h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-805">Ngày nhận Job:</span>
                    <input
                      type="date"
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-805 text-sky-700 font-sans">Ngày thực hiện / quay chụp:</span>
                    <input
                      type="date"
                      value={shootDate}
                      onChange={(e) => setShootDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-sky-200"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-805 text-rose-750">Deadline bàn giao sản phẩm:</span>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-805">Địa điểm thực hiện:</span>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                      placeholder="e.g. Phim trường Quận 9"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-805">Người phụ trách (Assignee):</span>
                    <input
                      type="text"
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                      placeholder="e.g. Nguyễn Minh Trí"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-805">Cộng tác viên liên quan:</span>
                    <input
                      type="text"
                      value={collaborators}
                      onChange={(e) => setCollaborators(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                      placeholder="e.g. Model Linh, Ánh sáng Huy"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: FINANCES BUDGET */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">3.. Dự chi & Tài chính hợp đồng</h3>
                  <HelpCircle size={12} className="text-slate-400" title="Hệ thống tự động tính số tiền còn lại và lợi nhuận tạm tính" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-855 text-emerald-800">Giá trị hợp đồng (Doanh thu):</span>
                    <input
                      type="number"
                      value={price || ''}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-202 rounded-lg px-3 py-2 font-bold font-mono text-slate-900"
                      placeholder="e.g. 15000000"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-855 text-slate-600">Số tiền cọc đã trả:</span>
                    <input
                      type="number"
                      value={deposit || ''}
                      onChange={(e) => setDeposit(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-202 rounded-lg px-3 py-2 font-mono"
                      placeholder="e.g. 5000000"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-855">Thanh toán thêm (nếu có):</span>
                    <input
                      type="number"
                      value={otherPayments || ''}
                      onChange={(e) => setOtherPayments(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-202 rounded-lg px-3 py-2 font-mono"
                      placeholder="e.g. 3000000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-855">Chi phí dự kiến (Budget):</span>
                    <input
                      type="number"
                      value={expectedCost || ''}
                      onChange={(e) => setExpectedCost(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-202 rounded-lg px-3 py-2 font-mono"
                      placeholder="e.g. 2000000"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <span className="font-semibold text-slate-855">Chi phí thực tế:</span>
                    <input
                      type="number"
                      value={actualCost || ''}
                      onChange={(e) => setActualCost(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-202 rounded-lg px-3 py-2 font-mono"
                      placeholder="e.g. 2500000"
                    />
                  </div>

                  <div className="md:col-span-4 flex items-end">
                    <div className="w-full bg-slate-100 p-2 text-[11px] rounded-lg font-bold text-slate-700 flex flex-col justify-center">
                      <p>📉 Số tiền còn lại: <strong className="text-rose-700">{formatVND(Math.max(0, price - deposit - otherPayments))}</strong></p>
                      <p className="mt-1">🍀 Lợi nhuận tạm tính: <strong className="text-teal-700">{formatVND(price - actualCost)}</strong></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: BRIEF & DOCUMENTS LINKS */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">4.. Brief & Tư liệu đính kèm</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6 space-y-1">
                    <span className="font-semibold text-slate-805">Mô tả Brief (Yêu cầu/Kịch bản):</span>
                    <textarea
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      placeholder="Mô tả kỹ thuật: bối cảnh, style màu, số lượng hình thô, số hình retouch..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 placeholder-slate-400"
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1">
                    <span className="font-semibold text-slate-805">Link thư mục thô (Google Drive / Dropbox):</span>
                    <input
                      type="text"
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder-slate-400 font-mono"
                      placeholder="e.g. https://drive.google.com/drive/folders/..."
                    />
                    <span className="text-[9px] text-slate-400 font-medium">Link lưu trữ video, ảnh RAW để khách gửi lựa hoặc tải về</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6 space-y-1">
                    <span className="font-semibold text-slate-805">Link sản phẩm bàn giao hoàn thiện:</span>
                    <input
                      type="text"
                      value={deliverablesLink}
                      onChange={(e) => setDeliverablesLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono"
                      placeholder="e.g. https://google.drive/deliverables..."
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1">
                    <span className="font-semibold text-slate-805">Ghi chú nội bộ (Mẹo, lưu ý ekip...):</span>
                    <textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Chỉ hiển thị với Studio, không in trên báo giá hay hợp đồng gửi cho khách..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* TAX INCLUSION ACCENTS */}
              <div className="bg-slate-55 p-3.5 rounded-xl border border-slate-150 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Kê khai thuế khoán / VAT cho Job này?</span>
                  <p className="text-[9px] text-slate-400 mt-0.5">Nếu kích hoạt, hệ thống sẽ tự động tổng hợp kê khai thuế trong bảng Kê Khai chung của Dashboard.</p>
                </div>
                <input
                  type="checkbox"
                  checked={taxDeclared}
                  onChange={(e) => setTaxDeclared(e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* ACTION TRIGGER BUTTONS */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="bg-brand-green-mid hover:bg-brand-green-light text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md transition-colors"
                >
                  {isEditing ? 'Lưu chỉnh sửa' : 'Setup & Bấm Lịch Job'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-3 rounded-xl transition-colors"
                >
                  Hủy / Hồi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 13. PREVIEW MODAL FOR QUOTES AND CONTRACTS               */}
      {/* ======================================================= */}
      {previewProject && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-55 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-3xl hover:shadow-2xl transition-all max-h-[90vh] overflow-y-auto space-y-6 relative border border-slate-100">
            <button
              onClick={() => setPreviewProject(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1 bg-slate-50 rounded-full"
            >
              <X size={16} />
            </button>

            {/* Print Area layout */}
            <div className="p-4 md:p-6 border border-slate-100 rounded-xl space-y-6 print:border-none print:p-0">
              <div className="flex justify-between items-start border-b border-neutral-100 pb-4">
                <div className="space-y-1">
                  <span className="text-xs bg-indigo-50 text-indigo-750 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">CREATIVE STUDIO PHÁT HÀNH</span>
                  <h2 className="text-base md:text-lg font-extrabold text-neutral-800">
                    {previewType === 'quote' ? 'Bản Báo giá / Đề xuất dịch vụ' : 'Hợp đồng lao động tự do / Freelance Contract'}
                  </h2>
                </div>
                <div className="text-right text-[10px] text-neutral-400 font-mono space-y-0.5">
                  <p className="font-bold">Mã văn bản: {previewProject.contractNumber}</p>
                  <p>Ngày lập: {formatDate(new Date().toISOString().split('T')[0])}</p>
                </div>
              </div>

              {/* Customer and scope blocks */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-neutral-50 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold">BÊN NHẬN (KHÁCH HÀNG):</span>
                  <p className="font-bold text-slate-900 mt-1">{(clients.find(c => c.id === previewProject.clientId))?.name || 'Khách hàng ẩn'}</p>
                  <p className="text-slate-500 mt-0.5">SĐT: {(clients.find(c => c.id === previewProject.clientId))?.phone || 'Chưa cung cấp'}</p>
                  <p className="text-slate-500 mt-0.5 font-mono">Mail: {(clients.find(c => c.id === previewProject.clientId))?.email || '-'}</p>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold">NỘI DUNG THỰC THI (JOB SPEC):</span>
                  <p className="font-bold text-slate-900 mt-1">{previewProject.title}</p>
                  <p className="text-slate-500 mt-0.5">Mảng dịch vụ: {previewProject.serviceType}</p>
                  <p className="text-slate-500 mt-0.5">Hạn bàn giao: {formatDate(previewProject.dueDate)}</p>
                </div>
              </div>

              {/* Interactive quote breakdown / Adjust rules */}
              {previewType === 'quote' ? (
                <div className="space-y-4">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-200 font-bold text-[10px] uppercase text-slate-400 pb-1">
                        <th className="py-2">MÔ TẢ CHI TIẾT GÓI DỊCH VỤ</th>
                        <th className="py-2 text-right">THÀNH TIỀN (VND)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-neutral-100">
                        <td className="py-2.5 font-medium">Báo giá dịch vụ trọn gói ({previewProject.serviceType})</td>
                        <td className="py-2.5 text-right font-bold">{formatVND(previewProject.price)}</td>
                      </tr>
                      <tr className="border-b border-neutral-100">
                        <td className="py-2.5 text-slate-400">Đặt cọc giữ lịch bảo đảm chỗ trước (Min cọc)</td>
                        <td className="py-2.5 text-right text-emerald-700 font-semibold">-{formatVND(previewProject.deposit)}</td>
                      </tr>
                      <tr className="bg-neutral-50 font-bold border-b border-neutral-200">
                        <td className="py-3 px-2 text-slate-800">CÒN LẠI SAU KHI BÀN GIAO SẢN PHẨM:</td>
                        <td className="py-3 px-2 text-right text-brand-green-mid">{formatVND(Math.max(0, previewProject.price - previewProject.deposit - (previewProject.otherPayments || 0)))}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="bg-amber-50/20 border border-amber-100 p-3 rounded-xl space-y-1">
                    <span className="text-[9px] text-amber-800 font-bold uppercase block tracking-wider">HƯỚNG DẪN THỦ TỤC & ĐẶT CỌC:</span>
                    <p className="text-[10px] text-neutral-600 leading-relaxed">
                      1. Quý khách vui lòng thanh toán khoản cọc <strong>{formatVND(previewProject.deposit)}</strong> để giữ lịch thực hiện.<br />
                      2. Số tiền thanh toán thêm (sau cọc và thù lao phát sinh): <strong>{formatVND(previewProject.otherPayments || 0)}</strong>.<br />
                      3. Khoản công nợ còn lại sau cuối sẽ thanh toán ngay sau khi nhận file hoàn thiện bàn giao.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs font-sans leading-relaxed text-slate-700">
                  <div className="font-bold text-slate-900 border-b border-neutral-100 pb-1 uppercase font-mono">ĐIỀU KHOẢN HỢP ĐỒNG FREELANCE CHUNG</div>
                  <p>
                    <strong>Điều 1. Phạm vi công việc:</strong> Bên cung cấp cam kết thực hiện đúng mô tả kỹ thuật của gói <strong>{previewProject.title}</strong>, đảm bảo chất lượng sắc nét, đúng thời gian thỏa thuận.
                  </p>
                  <p>
                    <strong>Điều 2. Thanh toán & Tiền cọc:</strong> Bên A đặt cọc trước số tiền <strong>{formatVND(previewProject.deposit)}</strong> vào ngày ký duyệt để khóa lịch. Số tiền còn lại là <strong>{formatVND(Math.max(0, previewProject.price - previewProject.deposit - (previewProject.otherPayments || 0)))}</strong> sẽ được trả ngay khi bên cung cấp gửi file ảnh/video thô hoặc demo kết quả để duyệt sửa.
                  </p>
                  <p>
                    <strong>Điều 3. Trách nhiệm bản quyền:</strong> Bên khách hàng chịu hoàn toàn trách nhiệm đối với bản quyền hình ảnh thương hiệu gốc được cấp. Bên creative giữ quyền tác giả và được phép trưng bày tác phẩm trong portfolio cá nhân để marketing định kỳ (trừ phi có thỏa thuận bảo mật bằng văn bản riêng).
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-6 text-center text-[10px] font-mono border-t border-neutral-100 mt-4">
                    <div className="space-y-10">
                      <span>BÊN KHÁCH HÀNG (KÝ TÊN)</span>
                      <p className="text-slate-405 italic">(Đã duyệt ký điện tử qua Zalo)</p>
                    </div>
                    <div className="space-y-10">
                      <span>ĐƠN VỊ THỰC HIỆN CREATIVE</span>
                      <p className="text-brand-green-light font-bold">CREATIVE STUDIO</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Print and clipboard copying triggers */}
            <div className="pt-2 flex justify-between gap-3 text-xs">
              <span className="text-slate-400 mt-2 text-[10px]">Mẹo: Nhấn Ctrl+P hoặc nút để xuất PDF gửi trực tiếp cho khách.</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-slate-202 text-slate-700 font-bold rounded-xl flex items-center gap-1 hover:bg-slate-50"
                >
                  <Printer size={13} /> In / Xuất PDF
                </button>
                <button
                  onClick={() => {
                    const txt = previewType === 'quote' 
                      ? `[BÁO GIÁ DỰ ÁN] \nMã: ${previewProject.contractNumber}\nJob: ${previewProject.title}\nTổng thành tiền: ${formatVND(previewProject.price)}\nĐã cọc: ${formatVND(previewProject.deposit)}\nCòn lại thanh toán: ${formatVND(Math.max(0, previewProject.price - previewProject.deposit - (previewProject.otherPayments || 0)))}\nDeadline giao SP: ${formatDate(previewProject.dueDate)}`
                      : `[HỢP ĐỒNG FREELANCE PO] \nMã: ${previewProject.contractNumber}\nDự án thực thi: ${previewProject.title}\nTiền cọc giữ chỗ: ${formatVND(previewProject.deposit)}\nThanh toán khi bàn giao: ${formatVND(Math.max(0, previewProject.price - previewProject.deposit - (previewProject.otherPayments || 0)))}`;
                    
                    navigator.clipboard.writeText(txt);
                    alert('Đã lưu text báo giá/hợp đồng vào bộ nhớ clipboard! Bạn hoàn toàn có thể dán sang ứng dụng khác.');
                  }}
                  className="bg-brand-green-mid hover:bg-brand-green-light text-white font-bold px-4 py-2 rounded-xl"
                >
                  Copy gửi Zalo khách
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
