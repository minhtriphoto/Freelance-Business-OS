import React, { useState, useMemo } from 'react';
import {
  Transaction,
  Project,
  Client,
  TransactionCategory,
  TransactionType,
  TransactionMethod,
  TransactionStatus,
  IncomeCategory,
  ExpenseCategory
} from '../types';
import { formatVND, formatDate } from '../utils';
import {
  PlusCircle,
  MinusCircle,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  X,
  Briefcase,
  User,
  Filter,
  TrendingUp,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Edit,
  Building,
  Calendar,
  Eye,
  DollarSign,
  Download,
  Paperclip,
  TrendingDown,
  ChevronRight,
  Info
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  projects: Project[];
  clients: Client[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

// Chuyển đổi số sang chữ (Tiếng Việt) phục vụ live feedback cho số tiền chốt sổ
function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không đồng';
  const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const places = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  const convertThreeDigits = (n: number, showZero: boolean): string => {
    let text = '';
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;

    if (hundred > 0 || showZero) {
      text += units[hundred] + ' trăm ';
    }

    if (ten > 0) {
      if (ten === 1) text += 'mười ';
      else text += units[ten] + ' mươi ';
    } else if (hundred > 0 && unit > 0) {
      text += 'lẻ ';
    }

    if (unit > 0) {
      if (unit === 1 && ten > 1) text += 'mốt';
      else if (unit === 5 && ten > 0) text += 'lăm';
      else text += units[unit];
    }

    return text.trim();
  };

  let words = '';
  let temp = num;
  let placeIdx = 0;

  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const chunkText = convertThreeDigits(chunk, temp >= 1000);
      words = chunkText + ' ' + places[placeIdx] + ' ' + words;
    }
    temp = Math.floor(temp / 1000);
    placeIdx++;
  }

  const finalStr = words.trim().replace(/\s+/g, ' ');
  return finalStr.charAt(0).toUpperCase() + finalStr.slice(1) + ' đồng chẵn';
}

const INCOME_CATEGORIES: IncomeCategory[] = [
  'Tiền cọc',
  'Thanh toán job',
  'Thanh toán còn lại',
  'Bán sản phẩm số',
  'Affiliate',
  'Tư vấn',
  'Khác'
];

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Thuê studio',
  'Thuê thiết bị',
  'Makeup',
  'Di chuyển',
  'Ăn uống',
  'Quảng cáo',
  'Phần mềm',
  'Cộng tác viên',
  'In ấn',
  'Đạo cụ',
  'Thuế/phí',
  'Khác'
];

const METHODS: TransactionMethod[] = [
  'Chuyển khoản',
  'Tiền mặt',
  'Ví điện tử',
  'Nền tảng online',
  'Khác'
];

const STATUSES: TransactionStatus[] = [
  'Đã ghi nhận',
  'Cần kiểm tra',
  'Đã đối soát'
];

export default function TransactionsView({
  transactions,
  projects,
  clients,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction
}: TransactionsViewProps) {
  // Bộ lọc và tìm kiếm ở danh sách
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  
  // Lọc theo thời gian
  const [timePeriod, setTimePeriod] = useState<string>('all_time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Sắp xếp
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Trạng thái Form (Thêm / Sửa)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Trường nhập liệu của Form
  const [formType, setFormType] = useState<TransactionType>('thu');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState<TransactionCategory>('Tiền cọc');
  const [formMethod, setFormMethod] = useState<TransactionMethod>('Chuyển khoản');
  const [formClientId, setFormClientId] = useState<string>('');
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formDocumentLink, setFormDocumentLink] = useState<string>('');
  const [formStatus, setFormStatus] = useState<TransactionStatus>('Đã ghi nhận');

  // Chi tiết chứng từ đang xem (Modal voucher preview)
  const [previewVoucherUrl, setPreviewVoucherUrl] = useState<string | null>(null);

  // Quản lý Tabs Tháng của phân tích kết quả kinh doanh
  const [financeYear, setFinanceYear] = useState<number>(2026);

  // Gom nhóm danh sách tháng và năm từ giao dịch thực tế
  const availableMonths = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach(t => {
      const parts = t.date.split('-');
      if (parts.length >= 2) {
        list.add(`${parts[0]}-${parts[1]}`); // e.g. "2026-05"
      }
    });

    // Thêm tháng hiện tại nếu trống
    const nowParts = new Date().toISOString().split('T')[0].split('-');
    list.add(`${nowParts[0]}-${nowParts[1]}`);

    return Array.from(list).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Bộ lọc thời gian chọn cụ thể
  const [selectedMonthYearFilter, setSelectedMonthYearFilter] = useState<string>('all');

  // Trích lọc danh sách dự án & khách hàng tiện tra cứu
  const projectsMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const clientsMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  // Đổi formType -> Đổi tự động category mặc định tương ứng
  const handleFormTypeChange = (type: TransactionType) => {
    setFormType(type);
    if (type === 'thu') {
      setFormCategory('Tiền cọc');
    } else {
      setFormCategory('Thuê studio');
    }
  };

  // Đồng bộ khi chọn Project liên đới trong form -> Tự động điền Client liên quan
  const handleFormProjectChange = (projId: string) => {
    setFormProjectId(projId);
    if (projId) {
      const proj = projectsMap.get(projId);
      if (proj && proj.clientId) {
        setFormClientId(proj.clientId);
      }
    }
  };

  // Lọc luồng giao dịch
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Tìm kiếm text
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        (t.transactionNumber || '').toLowerCase().includes(searchLower) ||
        (t.notes || '').toLowerCase().includes(searchLower) ||
        (t.description || '').toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        t.amount.toString().includes(searchLower);

      // 2. Lọc cơ bản
      const matchType = filterType === 'all' || t.type === filterType;
      const matchCategory = filterCategory === 'all' || t.category === filterCategory;
      const matchMethod = filterMethod === 'all' || t.method === filterMethod;
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchClient = filterClient === 'all' || t.clientId === filterClient;
      const matchProject = filterProject === 'all' || t.projectId === filterProject;

      // 3. Lọc theo chu kỳ tháng năm nhanh
      let matchMonthYear = true;
      if (selectedMonthYearFilter !== 'all') {
        matchMonthYear = t.date.startsWith(selectedMonthYearFilter);
      }

      // 4. Lọc theo mốc thời gian nâng cao
      let matchPeriod = true;
      if (selectedMonthYearFilter === 'all') { // Phối hợp mốc thời gian nếu không chọn phân lọc tháng cố định
        const tDate = new Date(t.date);
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

        if (timePeriod === 'this_month') {
          matchPeriod = tDate >= startOfMonth;
        } else if (timePeriod === 'last_month') {
          matchPeriod = tDate >= startOfLastMonth && tDate <= endOfLastMonth;
        } else if (timePeriod === 'last_90_days') {
          const limitDate = new Date();
          limitDate.setDate(limitDate.getDate() - 90);
          matchPeriod = tDate >= limitDate;
        } else if (timePeriod === 'custom') {
          const sd = customStartDate ? new Date(customStartDate) : null;
          const ed = customEndDate ? new Date(customEndDate) : null;
          if (sd && ed) {
            matchPeriod = tDate >= sd && tDate <= ed;
          } else if (sd) {
            matchPeriod = tDate >= sd;
          } else if (ed) {
            matchPeriod = tDate <= ed;
          }
        }
      }

      return matchSearch && matchType && matchCategory && matchMethod && matchStatus && matchClient && matchProject && matchMonthYear && matchPeriod;
    }).sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      if (sortBy === 'date_desc') return bTime - aTime;
      if (sortBy === 'date_asc') return aTime - bTime;
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [
    transactions,
    searchTerm,
    filterType,
    filterCategory,
    filterMethod,
    filterStatus,
    filterClient,
    filterProject,
    selectedMonthYearFilter,
    timePeriod,
    customStartDate,
    customEndDate,
    sortBy
  ]);

  // Tính toán số liệu phân phối kết quả
  const financialSummary = useMemo(() => {
    // Thống kê trên dữ liệu đang hiển thị (filtered)
    let filteredIncome = 0;
    let filteredExpense = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'thu') filteredIncome += t.amount;
      else filteredExpense += t.amount;
    });

    // Thống kê theo từng tháng trên toàn bộ dữ liệu (Phân tích dòng tiền toàn thời gian)
    const monthlyStats: Record<string, { income: number; expense: number; profit: number }> = {};
    
    // Khởi tạo các tháng thực tế và láng giềng gần
    availableMonths.forEach(m => {
      monthlyStats[m] = { income: 0, expense: 0, profit: 0 };
    });

    transactions.forEach(t => {
      const parts = t.date.split('-');
      if (parts.length >= 2) {
        const mKey = `${parts[0]}-${parts[1]}`;
        if (!monthlyStats[mKey]) {
          monthlyStats[mKey] = { income: 0, expense: 0, profit: 0 };
        }
        if (t.type === 'thu') {
          monthlyStats[mKey].income += t.amount;
        } else {
          monthlyStats[mKey].expense += t.amount;
        }
        monthlyStats[mKey].profit = monthlyStats[mKey].income - monthlyStats[mKey].expense;
      }
    });

    return {
      incomeSum: filteredIncome,
      expenseSum: filteredExpense,
      netProfit: filteredIncome - filteredExpense,
      monthlyBreakdown: monthlyStats
    };
  }, [filteredTransactions, transactions, availableMonths]);

  // Điểm kích hoạt mở modal thêm khoản thu chi
  const handleOpenAddForm = (type: TransactionType) => {
    setEditingTransaction(null);
    setFormType(type);
    setFormAmount(0);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory(type === 'thu' ? 'Tiền cọc' : 'Thuê studio');
    setFormMethod('Chuyển khoản');
    setFormClientId('');
    setFormProjectId('');
    setFormNotes('');
    setFormDocumentLink('');
    setFormStatus('Đã ghi nhận');

    setIsFormOpen(true);
  };

  // Kích hoạt sửa giao dịch
  const handleOpenEditForm = (t: Transaction) => {
    setEditingTransaction(t);
    setFormType(t.type);
    setFormAmount(t.amount);
    setFormDate(t.date);
    setFormCategory(t.category);
    setFormMethod(t.method);
    setFormClientId(t.clientId || '');
    setFormProjectId(t.projectId || '');
    setFormNotes(t.notes || t.description || '');
    setFormDocumentLink(t.documentLink || '');
    setFormStatus(t.status);

    setIsFormOpen(true);
  };

  // Submit tạo mới hay sửa đổi dòng tiền
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formAmount <= 0) {
      alert('Vui lòng điền số tiền hợp lý lớn hơn 0đ!');
      return;
    }

    const payload: Omit<Transaction, 'id'> = {
      transactionNumber: editingTransaction ? editingTransaction.transactionNumber : '', // do App quyết đinh nếu rỗng
      type: formType,
      amount: formAmount,
      date: formDate,
      category: formCategory,
      method: formMethod,
      clientId: formClientId || undefined,
      projectId: formProjectId || undefined,
      notes: formNotes || undefined,
      documentLink: formDocumentLink || undefined,
      status: formStatus,
      description: formNotes || '' // Đồng bộ trường thô cũ
    };

    if (editingTransaction) {
      onEditTransaction({
        ...payload,
        id: editingTransaction.id,
        transactionNumber: editingTransaction.transactionNumber // giữ số mã hiệu
      });
      alert('Cập nhật giao dịch thành công!');
    } else {
      onAddTransaction(payload);
      alert('Ghi nhận giao dịch vào sổ quỹ thành công!');
    }

    setIsFormOpen(false);
  };

  // Trực quan hóa ảnh chứng từ mẫu
  const getSimulatedInvoiceUrl = (t: Transaction) => {
    if (t.documentLink) return t.documentLink;
    // Tạo link thô mẫu cho đẹp mắt nếu không có
    return t.type === 'thu' 
      ? 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=600&auto=format&fit=crop&q=60'
      : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=60';
  };

  return (
    <div className="flex-1 flex flex-col space-y-6">
      
      {/* HEADER SECTION WITH QUICK BUTTONS */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-950 flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingUp size={22} />
            </span>
            Quản lý dòng tiền Thu - Chi
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            Sổ cái tài chính đa chức năng, in hóa đơn/phiếu chi tự động, liên đới doanh thu công nợ và chi phí dứt điểm vào từng Job.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleOpenAddForm('thu')}
            className="flex-1 md:flex-none py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            id="btn-add-income"
          >
            <PlusCircle size={15} /> Thêm Khoản Thu
          </button>
          <button
            onClick={() => handleOpenAddForm('chi')}
            className="flex-1 md:flex-none py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            id="btn-add-expense"
          >
            <MinusCircle size={15} /> Thêm Khoản Chi
          </button>
        </div>
      </div>

      {/* MONTHLY SUMMARY METRICS & CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* MONTHLY OVERVIEW METRICS - 5 cols */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              Kết quả tài chính chọn lọc
            </h3>
            
            <select
              value={selectedMonthYearFilter}
              onChange={e => setSelectedMonthYearFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-2xs font-extrabold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Thời gian: Tất cả</option>
              {availableMonths.map(my => {
                const [y, m] = my.split('-');
                return <option key={my} value={my}>Tháng {m}/{y}</option>;
              })}
            </select>
          </div>

          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <div className="space-y-0.5">
                <span className="text-3xs font-extrabold uppercase text-slate-400">TỔNG THU HẠCH TOÁN</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded-sm ml-2">Doanh thu (+)</span>
              </div>
              <span className="text-base font-black text-emerald-700">{formatVND(financialSummary.incomeSum)}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <div className="space-y-0.5">
                <span className="text-3xs font-extrabold uppercase text-slate-400">TỔNG CHI HÀNG LỢT</span>
                <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-1.5 py-0.2 rounded-sm ml-2">Chi phí (-)</span>
              </div>
              <span className="text-base font-black text-rose-700">{formatVND(financialSummary.expenseSum)}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-brand-green-light/5 rounded-xl border border-brand-green-light/20">
              <div className="space-y-0.5">
                <span className="text-3xs font-extrabold uppercase text-brand-green-mid">LỢI NHUẬN TẠM TÍNH</span>
                <p className="text-[10px] text-slate-400 font-medium">Doanh thu trừ sạch chi phí</p>
              </div>
              <div className="text-right">
                <span className={`text-lg font-black block ${financialSummary.netProfit >= 0 ? 'text-brand-green-mid' : 'text-rose-700'}`}>
                  {formatVND(financialSummary.netProfit)}
                </span>
                {financialSummary.incomeSum > 0 && (
                  <span className="text-3xs text-slate-500 font-extrabold leading-none">
                     Tỷ suất ròng: {Math.round((financialSummary.netProfit / financialSummary.incomeSum) * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-[10px] bg-slate-100 text-slate-500 p-2.5 rounded-lg flex items-start gap-1.5">
            <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-tight">
              Biểu thị thặng dư tài chính thực nhận. Số liệu chi phí của các giao dịch gắn với từng Job sẽ tự động tổng hợp trực diện vào trường chi phí thực tế của Job đó.
            </p>
          </div>
        </div>

        {/* MONTH-BY-MONTH STACK COMPARATIVE VISUALIZER - 7 cols */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              Khảo sát dòng tiền hàng tháng
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold font-mono">Dựa vào lịch sử giao dịch</span>
          </div>

          <div className="py-2 flex-1 flex flex-col justify-end space-y-4 min-h-[160px]">
            {availableMonths.slice(0, 5).reverse().map(my => {
              const stats = financialSummary.monthlyBreakdown[my] || { income: 0, expense: 0, profit: 0 };
              const maxVal = Math.max(...availableMonths.map(m => {
                const cell = financialSummary.monthlyBreakdown[m] || { income: 0, expense: 0 };
                return Math.max(cell.income, cell.expense, 1000000);
              }));

              const incomePct = Math.max(4, Math.round((stats.income / maxVal) * 100));
              const expensePct = Math.max(4, Math.round((stats.expense / maxVal) * 100));

              const [year, month] = my.split('-');

              return (
                <div key={my} className="space-y-1.5">
                  <div className="flex items-center justify-between text-2xs font-extrabold text-slate-800">
                    <span className="font-sans">Tháng {month}/{year}</span>
                    <span className="text-slate-500 font-mono text-xs">
                      Lời: <span className={stats.profit >= 0 ? 'text-brand-green-mid' : 'text-rose-600'}>{formatVND(stats.profit)}</span>
                    </span>
                  </div>
                  
                  {/* Bars Container */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${incomePct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold font-mono text-emerald-700 w-16 text-right">
                        +{formatVND(stats.income)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${expensePct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold font-mono text-rose-700 w-16 text-right font-medium">
                        -{formatVND(stats.expense)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-50 flex items-center justify-end gap-3 text-3xs font-extrabold uppercase text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span> Thu (Inflow)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Chi (Outflow)</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND MULTI-FILTERS EXPANSION DRAWER */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm theo số hiệu (TX-...), ghi chú, hoặc danh mục hạch toán..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-brand-green-light focus:bg-white transition-all font-medium animate-pulse-once"
              id="search-trans"
            />
          </div>

          <div className="flex gap-2 shrink-0 overflow-x-auto pb-1 md:pb-0">
            <select
              value={filterType}
              onChange={e => {
                setFilterType(e.target.value);
                setFilterCategory('all'); // reset category filter
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
              id="filter-trans-type"
            >
              <option value="all">Sổ: Thu & Chi</option>
              <option value="thu">Chỉ Khoản Thu (+)</option>
              <option value="chi">Chỉ Khoản Chi (-)</option>
            </select>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
              id="filter-trans-cat"
            >
              <option value="all">Mọi danh mục hạch toán</option>
              {filterType !== 'chi' && INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              {filterType !== 'thu' && EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="date_desc">Ngày: Mới nhất</option>
              <option value="date_asc">Ngày: Cũ nhất</option>
              <option value="amount_desc">Số tiền: Giảm dần</option>
              <option value="amount_asc">Số tiền: Tăng dần</option>
            </select>
          </div>
        </div>

        {/* COMPREHENSIVE FILTER ROW */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3">
          
          {/* Method Filter */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 block mb-1">Phương thức</label>
            <select
              value={filterMethod}
              onChange={e => setFilterMethod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xxs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Tất cả phương thức</option>
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Client Filter */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 block mb-1">Khách hàng liên đới</label>
            <select
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xxs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Mọi khách hàng</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Project / Job Filter */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 block mb-1">Dự án / Job</label>
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xxs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Mọi dự án / Job</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 block mb-1">Trạng thái ghi nhận</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xxs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Tất cả trạng thái</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* TimePeriod Filter */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 block mb-1">Thời gian (Mở rộng)</label>
            <select
              value={timePeriod}
              onChange={e => setTimePeriod(e.target.value)}
              disabled={selectedMonthYearFilter !== 'all'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xxs font-bold text-slate-700 focus:outline-hidden disabled:opacity-50"
            >
              <option value="all_time">Toàn thời gian</option>
              <option value="this_month">Tháng này</option>
              <option value="last_month">Tháng trước</option>
              <option value="last_90_days">90 ngày trước</option>
              <option value="custom">Mốc tự chọn...</option>
            </select>
          </div>
        </div>

        {/* CUSTOM TIME RANGE DYNAMIC EXPANSION */}
        {timePeriod === 'custom' && selectedMonthYearFilter === 'all' && (
          <div className="pt-3 border-t border-dashed border-slate-150 flex items-center gap-3 animate-fade-in">
            <div className="flex items-center gap-1.5">
              <span className="text-xxs text-slate-500 font-bold">Từ ngày:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xxs font-semibold"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xxs text-slate-500 font-bold">Đến ngày:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xxs font-semibold"
              />
            </div>
          </div>
        )}
      </div>

      {/* LEDGER DETAILS TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-3xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            Chi tiết Sổ quỹ hạch toán ({filteredTransactions.length} bản ghi)
          </h2>
          <span className="text-3xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 font-extrabold"> Sổ cái đóng sổ an tâm</span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <DollarSign className="mx-auto text-slate-250 animate-bounce" size={44} />
            <p className="text-sm font-extrabold text-slate-700">Sổ quỹ chưa khớp dữ liệu hạch toán</p>
            <p className="text-xs max-w-sm mx-auto">Vui lòng điều chỉnh lại bộ lọc hoặc ghi thêm các khoản Thu / Chi mới trên góc màn hình.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-55/40 border-b border-slate-150 text-3xs font-black text-slate-400 uppercase tracking-widest">
                  <th className="py-3 px-4 font-mono w-[100px]">Mã số</th>
                  <th className="py-3 px-3">Ngày hạch toán</th>
                  <th className="py-3 px-3">Luồng tiền</th>
                  <th className="py-3 px-4">Thông tin khoản mục & hạch toán</th>
                  <th className="py-3 px-3">Đối tượng & Job liên quan</th>
                  <th className="py-3 px-3">Phương thức</th>
                  <th className="py-3 px-4 text-right">Số tiền</th>
                  <th className="py-3 px-3 text-center">Chứng từ</th>
                  <th className="py-3 px-3 text-center">Xóa/Sửa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xxs">
                {filteredTransactions.map(t => {
                  const client = t.clientId ? clientsMap.get(t.clientId) : null;
                  const project = t.projectId ? projectsMap.get(t.projectId) : null;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* 1. Transaction Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {t.transactionNumber || `TX-DEMO-${t.id.slice(-3)}`}
                      </td>

                      {/* 2. Date */}
                      <td className="py-3.5 px-3 font-mono text-slate-550">
                        {formatDate(t.date)}
                      </td>

                      {/* 3. Transaction Type Badge */}
                      <td className="py-3.5 px-3">
                        {t.type === 'thu' ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-sm">
                            <ArrowUpRight size={10} strokeWidth={3} /> THU
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black tracking-wider bg-rose-50 text-rose-700 border border-rose-150 px-2 py-0.5 rounded-sm">
                            <ArrowDownRight size={10} strokeWidth={3} /> CHI
                          </span>
                        )}
                      </td>

                      {/* 4. Information and Categories */}
                      <td className="py-3.5 px-4 space-y-1 max-w-[260px]">
                        <div className="font-extrabold text-slate-800 text-xs">
                          {t.category}
                        </div>
                        <p className="text-slate-500 font-medium line-clamp-2 leading-tight">
                          {t.notes || t.description || 'Không có ghi chú cụ thể.'}
                        </p>
                        
                        {/* Status label badge */}
                        <div className="inline-flex">
                          {t.status === 'Đã đối soát' ? (
                            <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-[8px] font-extrabold border border-teal-150 px-1.5 py-0.2 rounded-sm">
                              <CheckCircle2 size={10} /> Đã đối soát
                            </span>
                          ) : t.status === 'Cần kiểm tra' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[8px] font-extrabold border border-amber-150 px-1.5 py-0.2 rounded-sm animate-pulse">
                              <AlertTriangle size={10} /> Cần kiểm tra
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 text-[8px] font-extrabold border border-slate-200 px-1.5 py-0.2 rounded-sm">
                               Đã ghi nhận
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Target Entity and Job linkages */}
                      <td className="py-3.5 px-3 space-y-1 max-w-[180px]">
                        {client ? (
                          <div className="flex items-center gap-1 text-slate-700 font-extrabold">
                            <User size={11} className="text-slate-400" />
                            <span className="truncate">{client.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Tự do / Vãng lai</span>
                        )}
                        {project && (
                          <div className="flex items-center gap-1 text-brand-green-mid font-extrabold text-[9px] truncate">
                            <Briefcase size={10} className="text-brand-green-mid shrink-0" />
                            <span className="truncate max-w-[150px]">{project.title}</span>
                          </div>
                        )}
                      </td>

                      {/* 6. Payment Method */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700">
                          <CreditCard size={11} className="text-slate-450" />
                          {t.method}
                        </span>
                      </td>

                      {/* 7. Value Amount */}
                      <td className={`py-3.5 px-3 text-right font-black text-xs ${t.type === 'thu' ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {t.type === 'thu' ? '+' : '-'}{formatVND(t.amount)}
                      </td>

                      {/* 8. Voucher Attached File */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => setPreviewVoucherUrl(getSimulatedInvoiceUrl(t))}
                          className="p-1.5 bg-slate-50 border border-slate-200 hover:border-brand-green-light rounded-lg text-slate-500 hover:text-brand-green-light transition-all inline-flex items-center gap-1 justify-center cursor-pointer"
                          title="Xem ảnh hóa đơn / Chứng từ thanh toán"
                        >
                          <Paperclip size={12} />
                        </button>
                      </td>

                      {/* 9. Action Buttons */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => handleOpenEditForm(t)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-md transition-colors"
                            title="Sửa giao dịch"
                          >
                            <Edit size={11} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Bản ghi giao dịch này sẽ bị xóa vĩnh viễn khỏi Sổ cái và tự động hoàn trả công nợ liên quan. Bạn có đồng ý xóa không?')) {
                                onDeleteTransaction(t.id);
                              }
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-md transition-colors"
                            title="Xóa giao dịch"
                            id={`btn-del-t-${t.id}`}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILED LEDGER TRANSACTION FORM MODEL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Modal Title Banner */}
            <div className={`p-4 text-white flex items-center justify-between shrink-0 ${formType === 'thu' ? 'bg-emerald-700' : 'bg-rose-700'}`}>
              <div className="space-y-0.5">
                <h3 className="text-sm font-black uppercase tracking-wider">
                  {editingTransaction ? 'Hiệu chỉnh giao dịch dòng tiền' : (formType === 'thu' ? 'Lập phiếu hạch toán khoản thu' : 'Lập phiếu hạch toán khoản chi')}
                </h3>
                <p className="text-[10px] text-white/80 font-medium">Bạn đang cập nhật số liệu trực hệ vào Sổ quỹ hạch toán của đại lý.</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Type Selector (Only editable when creating new) */}
              {!editingTransaction && (
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Loại dòng tiền hạch toán</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleFormTypeChange('thu')}
                      className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                        formType === 'thu' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      KHOẢN THU (+ DOANH THU)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormTypeChange('chi')}
                      className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                        formType === 'chi' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      KHOẢN CHI (- EXPENSES)
                    </button>
                  </div>
                </div>
              )}

              {/* Amount, Date, Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Thời điểm giao dịch *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 font-semibold focus:outline-hidden focus:border-brand-green-light"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Số tiền thanh toán (VND) *</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={formAmount === 0 ? '' : formAmount}
                    onChange={e => setFormAmount(Number(e.target.value))}
                    placeholder="ví dụ: 5000000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 font-black focus:outline-hidden focus:border-brand-green-light"
                    id="form-t-amount"
                  />
                </div>
              </div>

              {/* VIETNAMESE WORDS SPELL-OUT FEEDBACK (Extremely unique for quality) */}
              {formAmount > 0 && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-150 text-[10px] text-slate-600 font-extrabold flex items-start gap-1">
                  <span className="text-brand-green-mid shrink-0">✍️</span>
                  <span>Bằng chữ: <em className="text-slate-800 not-italic font-black underline">{numberToVietnameseWords(formAmount)}</em></span>
                </div>
              )}

              {/* Method and Category SELECTORS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Phương thức thanh toán</label>
                  <select
                    value={formMethod}
                    onChange={e => setFormMethod(e.target.value as TransactionMethod)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden"
                  >
                    {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Danh mục hạch toán</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as TransactionCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden"
                  >
                    {formType === 'thu' ? (
                      INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                    ) : (
                      EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                    )}
                  </select>
                </div>
              </div>

              {/* LÊN QUAN TRỰC TIẾP JOB HOẶC KHÁCH HÀNG */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Liên kết Dự án (Gắn Job)</label>
                    <span className="text-[9px] text-teal-700 italic font-bold">Tự động cộng chi/thu</span>
                  </div>
                  <select
                    value={formProjectId}
                    onChange={e => handleFormProjectChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden"
                  >
                    <option value="">Không liên kết (Giao dịch tự do)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} (Trị giá {formatVND(p.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Khách hàng liên kết</label>
                  <select
                    value={formClientId}
                    onChange={e => setFormClientId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden"
                  >
                    <option value="">Không liên kết (Vãng lai)</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* GHI CHÚ VÀ CHỨNG TỪ */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Nội dung chi tiết / Lý do hạch toán *</label>
                <textarea
                  required
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Ví dụ: Nhận đặt cọc đợt 1 Duy Oanh, hoặc Chi trả tiền thuê Studio bối cảnh..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
                  id="form-t-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Link ảnh hóa đơn / Chứng từ kiểm kê</label>
                  <input
                    type="url"
                    value={formDocumentLink}
                    onChange={e => setFormDocumentLink(e.target.value)}
                    placeholder="ví dụ: https://my-drive.com/invoice.jpg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 font-semibold focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Trạng thái đối soát</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as TransactionStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all hover:bg-slate-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition-all ${
                    formType === 'thu' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                  id="form-t-submit"
                >
                  {editingTransaction ? 'Cập nhật Sổ quỹ' : 'Chốt sổ cái'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT VOUCHER MODAL PREVIEW */}
      {previewVoucherUrl && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl relative">
            <div className="p-4 border-b border-indigo-50 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                📁 Ảnh tệp hóa đơn/Chứng từ hạch toán
              </span>
              <button
                onClick={() => setPreviewVoucherUrl(null)}
                className="p-1 text-slate-500 hover:text-slate-900 focus:outline-hidden"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 flex justify-center bg-slate-900 border-b border-slate-950">
              <img
                src={previewVoucherUrl}
                alt="Document Voucher preview"
                className="max-h-[300px] object-contain rounded-lg border border-white/15"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-4 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold">Tài liệu giả lập chứng thực quy trình</span>
              <div className="flex gap-1.5">
                <a
                  href={previewVoucherUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-2xs font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-1"
                >
                  <ExternalLink size={11} /> Mở tab mới
                </a>
                <button
                  onClick={() => setPreviewVoucherUrl(null)}
                  className="text-2xs font-extrabold bg-brand-green-mid hover:bg-brand-green-light py-1.5 px-3.5 text-white rounded-lg"
                >
                  Đóng lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
