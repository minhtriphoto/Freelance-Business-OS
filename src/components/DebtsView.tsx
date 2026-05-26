import React, { useState, useMemo } from 'react';
import {
  Project,
  Client,
  Transaction,
  Contract,
  Quotation,
  DebtStatus,
  DebtMetadata
} from '../types';
import { formatVND, formatDate } from '../utils';
import {
  Search,
  Users,
  Briefcase,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Copy,
  PlusCircle,
  FileText,
  Filter,
  DollarSign,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  Edit2,
  Trash2,
  TrendingUp,
  CreditCard,
  FileSignature,
  Scale,
  Calendar,
  HelpCircle,
  Activity,
  X
} from 'lucide-react';

interface DebtsViewProps {
  projects: Project[];
  clients: Client[];
  transactions: Transaction[];
  contracts: Contract[];
  quotations: Quotation[];
  debtMetadatas: DebtMetadata[];
  onUpdateDebtMetadata: (projectId: string, statusOverride?: DebtStatus, remindNotes?: string) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
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

export default function DebtsView({
  projects,
  clients,
  transactions,
  contracts,
  quotations,
  debtMetadatas,
  onUpdateDebtMetadata,
  onAddTransaction
}: DebtsViewProps) {
  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOverdueDays, setFilterOverdueDays] = useState('all'); // 'all', 'overdue', 'overdue_7', 'overdue_30'
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  // Ghi nhận thanh toán modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentDebt, setActivePaymentDebt] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Chuyển khoản' | 'Tiền mặt' | 'Ví điện tử' | 'Khác'>('Chuyển khoản');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Nhắc nợ modal state
  const [remindModalOpen, setRemindModalOpen] = useState(false);
  const [activeRemindDebt, setActiveRemindDebt] = useState<any | null>(null);
  const [messageTemplateIndex, setMessageTemplateIndex] = useState<number>(1); // 1, 2, 3

  // Sửa ghi chú nhanh nợ state
  const [editingNotesDebtId, setEditingNotesDebtId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');

  // Sửa trạng thái thủ công (Khó thu) state
  const [editingStatusDebtId, setEditingStatusDebtId] = useState<string | null>(null);

  // Tra cứu clients & projects & contracts nhanh
  const clientsMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const metadataMap = useMemo(() => new Map(debtMetadatas.map(m => [m.projectId, m])), [debtMetadatas]);

  // Today parsing (Fixed mockup date is 2026-05-26 as per local metadata)
  const todayDateStr = '2026-05-26';
  const todayDate = new Date(todayDateStr);

  // Hợp nhất dữ liệu công nợ sinh tự động từ Job (Projects), Hợp đồng (Contracts), Báo giá (Quotations)
  const debtsList = useMemo(() => {
    const list: any[] = [];

    // 1. Công nợ xuất thân từ Projects
    projects.forEach(p => {
      if (p.status === 'draft' || p.status === 'lead') return; // Bỏ các dự án nháp hoặc lead chưa chính thức

      const client = clientsMap.get(p.clientId);
      const meta = metadataMap.get(p.id);

      // Tính tổng tiền đã nhận thực tế dựa vào dòng tiền thu 'thu' liên kết
      const pjTransactions = transactions.filter(t => t.projectId === p.id && t.type === 'thu');
      const transactionSum = pjTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Fallback nếu không có giao dịch nhưng dự án định mức cọc + thanh toán khác
      const totalPaid = transactionSum > 0 ? transactionSum : (p.deposit + (p.otherPayments || 0));
      const remainingAmount = Math.max(0, p.price - totalPaid);

      // Hạn thanh toán (Nhiều job dùng dueDate hoặc shootDate)
      const rawDueDate = p.dueDate || p.shootDate || '';
      let overdueDays = 0;
      let calculatedStatus: DebtStatus = 'Chưa đến hạn';

      if (rawDueDate) {
        const dDate = new Date(rawDueDate);
        const diffMs = todayDate.getTime() - dDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
          overdueDays = diffDays;
          calculatedStatus = 'Quá hạn';
        } else if (diffDays === 0) {
          calculatedStatus = 'Đến hạn hôm nay';
        } else {
          calculatedStatus = 'Chưa đến hạn';
        }
      }

      if (remainingAmount === 0 || p.finalPaymentStatus === 'paid') {
        calculatedStatus = 'Đã thu đủ';
      }

      // Ưu tiên trạng thái do người dùng tự tay ghi đè (ví dụ: Khó thu)
      const finalStatus = (meta && meta.statusOverride) ? meta.statusOverride : calculatedStatus;
      const remindNotes = (meta && meta.remindNotes) ? meta.remindNotes : '';

      list.push({
        id: `debt-pj-${p.id}`,
        projectId: p.id,
        sourceType: 'project',
        sourceTitle: 'Dự án (Job)',
        title: p.title,
        contractNumber: p.contractNumber || 'Chưa lập',
        clientId: p.clientId,
        clientName: client ? client.name : 'Khách vãng lai',
        totalValue: p.price,
        paidAmount: totalPaid,
        remainingAmount: remainingAmount,
        dueDate: rawDueDate,
        overdueDays: remainingAmount > 0 ? overdueDays : 0,
        status: finalStatus,
        remindNotes: remindNotes,
        payments: pjTransactions.map(t => ({
          id: t.id,
          date: t.date,
          amount: t.amount,
          category: t.category,
          method: t.method,
          transactionNumber: t.transactionNumber
        }))
      });
    });

    // 2. Công nợ xuất thân từ Contracts đã ký nhưng chưa chuyển sang dự án
    contracts.forEach(c => {
      if (c.status !== 'đã ký' && c.status !== 'đang thực hiện') return;
      if (c.projectId && list.some(item => item.projectId === c.projectId)) return; // tránh trùng lặp nếu đã ra Project

      const client = clientsMap.get(c.clientId);
      const meta = metadataMap.get(`contract-${c.id}`);

      const pjTransactions = transactions.filter(t => t.notes?.includes(c.contractNumber) && t.type === 'thu');
      const transactionSum = pjTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalPaid = transactionSum > 0 ? transactionSum : c.deposit;
      const remainingAmount = Math.max(0, c.totalValue - totalPaid);

      const rawDueDate = c.createdDate ? new Date(c.createdDate) : new Date();
      // Mặc định thời hạn cho contract chưa dự án là 14 ngày sau tạo hợp đồng
      rawDueDate.setDate(rawDueDate.getDate() + 14);
      const formattedDueDate = rawDueDate.toISOString().split('T')[0];

      let overdueDays = 0;
      let calculatedStatus: DebtStatus = 'Chưa đến hạn';

      const diffMs = todayDate.getTime() - rawDueDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        overdueDays = diffDays;
        calculatedStatus = 'Quá hạn';
      } else if (diffDays === 0) {
        calculatedStatus = 'Đến hạn hôm nay';
      }

      if (remainingAmount === 0) {
        calculatedStatus = 'Đã thu đủ';
      }

      const finalStatus = (meta && meta.statusOverride) ? meta.statusOverride : calculatedStatus;
      const remindNotes = (meta && meta.remindNotes) ? meta.remindNotes : '';

      list.push({
        id: `debt-ct-${c.id}`,
        contractId: c.id,
        sourceType: 'contract',
        sourceTitle: 'Hợp đồng độc lập',
        title: c.title,
        contractNumber: c.contractNumber,
        clientId: c.clientId,
        clientName: client ? client.name : 'Khách hàng',
        totalValue: c.totalValue,
        paidAmount: totalPaid,
        remainingAmount: remainingAmount,
        dueDate: formattedDueDate,
        overdueDays: remainingAmount > 0 ? overdueDays : 0,
        status: finalStatus,
        remindNotes: remindNotes,
        payments: pjTransactions.map(t => ({
          id: t.id,
          date: t.date,
          amount: t.amount,
          category: t.category,
          method: t.method,
          transactionNumber: t.transactionNumber
        }))
      });
    });

    // 3. Công nợ từ Quotations đã được duyệt nhưng chưa ra Project / Contract
    quotations.forEach(q => {
      if (q.status !== 'đã duyệt') return;
      if (q.projectId && list.some(item => item.projectId === q.projectId)) return;

      const client = clientsMap.get(q.clientId);
      const meta = metadataMap.get(`quote-${q.id}`);

      const remainingAmount = q.totalAfterDiscount;
      const overdueDays = 0; // Báo giá đã duyệt chờ bắt đầu, hầu như chưa trễ hạn đóng cọc
      
      const calculatedStatus: DebtStatus = 'Chưa đến hạn';
      const finalStatus = (meta && meta.statusOverride) ? meta.statusOverride : calculatedStatus;
      const remindNotes = (meta && meta.remindNotes) ? meta.remindNotes : '';

      list.push({
        id: `debt-qt-${q.id}`,
        quotationId: q.id,
        sourceType: 'quotation',
        sourceTitle: 'Báo giá đã duyệt',
        title: `Phê duyệt thiết kế / thi công (${q.quoteNumber})`,
        contractNumber: 'Đang thương thảo',
        clientId: q.clientId,
        clientName: client ? client.name : 'Khách hàng',
        totalValue: q.totalAfterDiscount,
        paidAmount: 0,
        remainingAmount: remainingAmount,
        dueDate: q.expiredDate,
        overdueDays: 0,
        status: finalStatus,
        remindNotes: remindNotes,
        payments: []
      });
    });

    return list;
  }, [projects, contracts, quotations, clientsMap, transactions, debtMetadatas, todayDate]);

  // Bộ lọc dữ liệu công nợ
  const filteredDebts = useMemo(() => {
    return debtsList.filter(d => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        d.clientName.toLowerCase().includes(searchLower) ||
        d.title.toLowerCase().includes(searchLower) ||
        d.contractNumber.toLowerCase().includes(searchLower) ||
        d.remindNotes.toLowerCase().includes(searchLower);

      const matchClient = filterClient === 'all' || d.clientId === filterClient;
      const matchStatus = filterStatus === 'all' || d.status === filterStatus;

      let matchOverdue = true;
      if (filterOverdueDays === 'overdue') {
        matchOverdue = d.overdueDays > 0 && d.remainingAmount > 0;
      } else if (filterOverdueDays === 'overdue_7') {
        matchOverdue = d.overdueDays >= 7 && d.remainingAmount > 0;
      } else if (filterOverdueDays === 'overdue_30') {
        matchOverdue = d.overdueDays >= 30 && d.remainingAmount > 0;
      }

      return matchSearch && matchClient && matchStatus && matchOverdue;
    });
  }, [debtsList, searchTerm, filterClient, filterStatus, filterOverdueDays]);

  // Thống kê nhanh kết quả công nợ
  const debtMetrics = useMemo(() => {
    let totalOutstanding = 0;
    let totalCollected = 0;
    let overdueCount = 0;
    let difficultCount = 0;

    debtsList.forEach(d => {
      totalOutstanding += d.remainingAmount;
      totalCollected += d.paidAmount;
      if (d.status === 'Quá hạn' && d.remainingAmount > 0) overdueCount++;
      if (d.status === 'Khó thu') difficultCount++;
    });

    const totalSum = totalOutstanding + totalCollected;
    const collectionRate = totalSum > 0 ? Math.round((totalCollected / totalSum) * 100) : 100;

    return {
      totalOutstanding,
      totalCollected,
      overdueCount,
      difficultCount,
      collectionRate
    };
  }, [debtsList]);

  // Mở modal tạo giao dịch thanh toán (Ghi nhận thu)
  const handleOpenPayment = (debt: any) => {
    setActivePaymentDebt(debt);
    setPaymentAmount(debt.remainingAmount);
    setPaymentNotes(`Thu tất toán dư nợ cho ${debt.sourceTitle}: "${debt.title}"`);
    setPaymentModalOpen(true);
  };

  // Submit phiếu thu ghi nhận thanh toán
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      alert('Vui lòng nhập số tiền thanh toán hợp lệ lớn hơn 0đ!');
      return;
    }

    onAddTransaction({
      transactionNumber: '', // Tự động tạo mã
      projectId: activePaymentDebt.projectId || undefined,
      clientId: activePaymentDebt.clientId,
      type: 'thu',
      amount: paymentAmount,
      category: 'Thanh toán còn lại',
      date: paymentDate,
      method: paymentMethod,
      notes: paymentNotes || `Nhận thanh toán đợt cuối từ ${activePaymentDebt.clientName}`,
      status: 'Đã ghi nhận',
      description: paymentNotes || `Nhận thanh toán đợt cuối từ ${activePaymentDebt.clientName}`
    });

    // Nếu đã thanh toán hết dư nợ, cập nhật luôn trạng thái
    const rest = activePaymentDebt.remainingAmount - paymentAmount;
    if (rest <= 0) {
      onUpdateDebtMetadata(activePaymentDebt.projectId || `manual-${activePaymentDebt.id}`, 'Đã thu đủ', activePaymentDebt.remindNotes);
    }

    setPaymentModalOpen(false);
    alert('Đã ghi nhận thanh toán vào sổ quỹ hạch toán thành công! Công nợ của khách hàng tự động khấu trừ dứt điểm.');
  };

  // Mở modal tin nhắn nhắc nhở thanh toán
  const handleOpenRemind = (debt: any) => {
    setActiveRemindDebt(debt);
    setMessageTemplateIndex(1);
    setRemindModalOpen(true);
  };

  // Tạo nội dung tin nhắn nhắc thanh toán động
  const renderedMessageText = useMemo(() => {
    if (!activeRemindDebt) return '';
    const name = activeRemindDebt.clientName;
    const job = activeRemindDebt.title;
    const formattedAmount = formatVND(activeRemindDebt.remainingAmount);
    const limitDate = activeRemindDebt.dueDate ? formatDate(activeRemindDebt.dueDate) : 'sớm nhất';
    const contract = activeRemindDebt.contractNumber;
    const overdueDays = activeRemindDebt.overdueDays;

    if (messageTemplateIndex === 1) {
      return `Chào anh/chị ${name}, em gửi anh/chị nhắc nhẹ khoản thanh toán còn lại của job ${job} với số tiền ${formattedAmount}. Anh/chị kiểm tra giúp em khi thuận tiện nhé. Em cảm ơn ạ.`;
    } else if (messageTemplateIndex === 2) {
      return `Kính gửi anh/chị ${name}, bên em gửi thông báo nhắc thanh toán đợt tiếp theo cho dự án ${job}. Số tiền cần tất toán là ${formattedAmount}, hạn thanh toán vào ngày ${limitDate}. Anh/chị vui lòng sắp xếp thanh toán trước/trong hạn giúp em để tránh làm gián đoạn khâu chuẩn bị/bàn giao nhé. Trân trọng!`;
    } else {
      return `Thông báo rà soát công nợ: Kính gửi anh/chị ${name}, đại diện tài chính của studio gửi đối soát nhắc nợ lần 3 cho hợp đồng vướng mắc [${contract}] / dự án ${job}. Số dư nợ hiện tại là ${formattedAmount}, đã quá hạn ${overdueDays} ngày so với thỏa ước cam kết. Anh/chị vui lòng chuyển khoản tất toán vào tài khoản của bên em sớm nhất hoặc liên hệ trực tiếp để giải quyết dứt điểm. Xin cảm ơn.`;
    }
  }, [activeRemindDebt, messageTemplateIndex]);

  // Copy tin nhắn vào clipboard
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(renderedMessageText);
    alert('Đã sao chép nội dung tin nhắn nhắc nợ vào bộ nhớ tạm!');
  };

  // Cập nhật ghi chú nhắc nợ nhanh
  const handleSaveNotes = (id: string, projectId: string) => {
    onUpdateDebtMetadata(projectId || id, undefined, editingNotesText);
    setEditingNotesDebtId(null);
  };

  // Cập nhật trạng thái thủ công (Khó thu hoặc Đã thu đủ...)
  const handleUpdateStatusOverride = (id: string, projectId: string, status: DebtStatus) => {
    onUpdateDebtMetadata(projectId || id, status, undefined);
    setEditingStatusDebtId(null);
  };

  return (
    <div className="flex-1 flex flex-col space-y-6">

      {/* HEADER SECTION WITH QUICK METRICS */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-950 flex items-center gap-2">
            <span className="p-2 bg-rose-50 text-rose-700 rounded-lg">
              <Scale size={22} />
            </span>
            Quản lý Sổ nợ & Thu hồi Công nợ
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            Tự động theo dõi các đợt công nợ còn lại của dự án, rà soát nợ quá hạn và cấu hình tin nhắn nhắc thanh toán mẫu tế nhị, chuyên nghiệp.
          </p>
        </div>

        {/* CẢNH BÁO NỢ QUÁ HẠN NHANH */}
        {debtMetrics.overdueCount > 0 && (
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-3 animate-pulse">
            <span className="p-1.5 bg-rose-600 text-white rounded-lg">
              <AlertTriangle size={16} />
            </span>
            <div>
              <p className="text-xs font-black text-rose-950">
                Phát hiện {debtMetrics.overdueCount} tài khoản quá hạn!
              </p>
              <p className="text-[10px] text-rose-750 font-medium">
                Sử dụng các mẫu nhắc nợ lần 2 hoặc lần 3 để đẩy nhanh tốc độ thu hồi.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
            <AlertOctagon size={22} />
          </div>
          <div>
            <span className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">Tổng khoản còn phải thu</span>
            <p className="text-lg font-black text-rose-700 mt-0.5">{formatVND(debtMetrics.totalOutstanding)}</p>
            <span className="text-[10px] text-slate-400">{debtsList.filter(d => d.remainingAmount > 0).length} khách chưa hoàn tất</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-brand-green-light/10 text-brand-green-mid rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">Đã thu hồi thành công</span>
            <p className="text-lg font-black text-emerald-800 mt-0.5">{formatVND(debtMetrics.totalCollected)}</p>
            <span className="text-[10px] text-slate-400">Tự động cộng dồn từ Sổ quỹ</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">Tỷ lệ thu hồi công nợ</span>
            <p className="text-lg font-black text-slate-900 mt-0.5">{debtMetrics.collectionRate}%</p>
            
            {/* Tiny progress status bar */}
            <div className="w-24 bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-brand-green-mid h-full rounded-full"
                style={{ width: `${debtMetrics.collectionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-500 rounded-xl">
            <Activity size={22} />
          </div>
          <div>
            <span className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">Phân loại nợ xấu</span>
            <p className="text-lg font-black text-slate-800 mt-0.5">{debtMetrics.difficultCount} Hồ sơ</p>
            <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-extrabold"> Đang thu hồi đặc biệt</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm công nợ theo tên khách hàng, job, số hợp đồng, ghi chú..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-brand-green-light focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="flex gap-2 text-xs shrink-0 overflow-x-auto pb-1 md:pb-0">
            <select
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Khách hàng: Tất cả</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Trạng thái: Tất cả</option>
              <option value="Chưa đến hạn">Chưa đến hạn</option>
              <option value="Đến hạn hôm nay">Đến hạn hôm nay</option>
              <option value="Quá hạn">Quá hạn</option>
              <option value="Khó thu">Khó thu (Nợ xấu)</option>
              <option value="Đã thu đủ">Đã tất toán (Đã thu đủ)</option>
            </select>

            <select
              value={filterOverdueDays}
              onChange={e => setFilterOverdueDays(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Khoảng quá hạn: Tất cả</option>
              <option value="overdue">Đang quá hạn (&gt; 0 ngày)</option>
              <option value="overdue_7">Trễ nghiêm trọng (&gt;= 7 ngày)</option>
              <option value="overdue_30">Nợ đọng lâu ngày (&gt;= 30 ngày)</option>
            </select>
          </div>
        </div>
      </div>

      {/* MAIN DEBTS LIST TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-3xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Sổ chi tiết công nợ ({filteredDebts.length} dòng hiển thị)
          </h2>
          <span className="text-3xs text-slate-400 font-extrabold flex items-center gap-1">
             Hạn định tính theo múi giờ Việt Nam
          </span>
        </div>

        {filteredDebts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Scale className="mx-auto text-slate-255 animate-pulse" size={44} />
            <p className="text-sm font-extrabold text-slate-700">Không tìm thấy hồ sơ nợ khớp bộ lọc</p>
            <p className="text-xs max-w-sm mx-auto text-slate-500">
              Vui lòng thay đổi lại từ khóa kéo theo lựa chọn lọc để tiếp tục rà soát sổ hạch toán.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDebts.map(d => {
              const isExpanded = expandedDebtId === d.id;
              const hasRemaining = d.remainingAmount > 0;
              const pctPaid = d.totalValue > 0 ? Math.round((d.paidAmount / d.totalValue) * 100) : 0;

              return (
                <div key={d.id} className="hover:bg-slate-50/20 transition-all">
                  
                  {/* MAIN SUMMARY ROW */}
                  <div className="p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    
                    {/* Customer & Job description */}
                    <div className="flex-1 min-w-[280px] space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1.5 py-0.5 bg-slate-100 rounded">
                          {d.sourceTitle}
                        </span>
                        <div className="text-xxs font-bold text-slate-550 font-mono">
                          Mã hợp đồng: {d.contractNumber}
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {d.title}
                      </h3>

                      <div className="flex items-center gap-4 text-xxs text-slate-500 font-medium">
                        <span className="flex items-center gap-1 font-bold text-slate-750">
                          <Users size={12} className="text-slate-400 shrink-0" />
                          {d.clientName}
                        </span>
                        {d.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400 shrink-0" />
                            Hạn thanh toán: <strong className="text-slate-700">{formatDate(d.dueDate)}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress with Amounts */}
                    <div className="w-full lg:w-72 space-y-2">
                      <div className="flex items-center justify-between text-2xs font-extrabold">
                        <span className="text-slate-500">Tiến trình tất toán:</span>
                        <span className="text-brand-green-mid">{pctPaid}%</span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-full relative flex">
                        <div
                          className="bg-brand-green-mid h-full rounded-full transition-all duration-550"
                          style={{ width: `${pctPaid}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xxs font-semibold">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">ĐÃ THANH TOÁN</p>
                          <p className="font-bold text-emerald-800">{formatVND(d.paidAmount)}</p>
                        </div>
                        <div className="text-right border-l border-slate-100 pl-4">
                          <p className="text-[10px] text-slate-400 uppercase">CÒN PHẢI THU</p>
                          <p className={`font-black ${hasRemaining ? 'text-rose-700 text-xs' : 'text-slate-500'}`}>
                            {formatVND(d.remainingAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status & Overdue Badge */}
                    <div className="lg:w-44 flex flex-col justify-center items-start lg:items-end gap-1.5">
                      
                      {/* Status select dropdown inline or trigger option */}
                      <div className="relative">
                        {editingStatusDebtId === d.id ? (
                          <select
                            autoFocus
                            value={d.status}
                            onChange={(e) => handleUpdateStatusOverride(d.id, d.projectId, e.target.value as DebtStatus)}
                            onBlur={() => setEditingStatusDebtId(null)}
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-2xs font-bold focus:outline-hidden"
                          >
                            <option value="Chưa đến hạn">Chưa đến hạn</option>
                            <option value="Đến hạn hôm nay">Đến hạn hôm nay</option>
                            <option value="Quá hạn">Quá hạn</option>
                            <option value="Đã thu đủ">Đã thu đủ</option>
                            <option value="Khó thu">Khó thu</option>
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingStatusDebtId(d.id)}
                            className="group cursor-pointer"
                            title="Bấm vào để đổi trạng thái"
                          >
                            {d.status === 'Đã thu đủ' && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-1 rounded-sm">
                                <CheckCircle2 size={11} /> ĐÃ THU ĐỦ
                              </span>
                            )}
                            {d.status === 'Chưa đến hạn' && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider bg-slate-50 text-slate-600 border border-slate-200 px-2 py-1 rounded-sm">
                                <Clock size={11} /> CHƯA ĐẾN HẠN
                              </span>
                            )}
                            {d.status === 'Đến hạn hôm nay' && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-sm animate-pulse-once">
                                <AlertTriangle size={11} /> ĐẾN HẠN HÔM NAY
                              </span>
                            )}
                            {d.status === 'Quá hạn' && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider bg-rose-50 text-rose-700 border border-rose-150 px-2 py-1 rounded-sm">
                                <AlertTriangle size={11} /> QUÁ HẠN
                              </span>
                            )}
                            {d.status === 'Khó thu' && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider bg-slate-900 text-slate-100 border border-slate-900 px-2 py-1 rounded-sm">
                                <AlertOctagon size={11} /> KHÓ THU
                              </span>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Overdue day alert badge */}
                      {d.overdueDays > 0 && hasRemaining && (
                        <span className="text-[10px] text-rose-700 font-extrabold bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded mt-0.5">
                           Quá hạn {d.overdueDays} ngày
                        </span>
                      )}
                    </div>

                    {/* Action buttons list */}
                    <div className="lg:w-64 flex lg:flex-col gap-2 shrink-0 md:justify-end">
                      {hasRemaining ? (
                        <>
                          <button
                            onClick={() => handleOpenPayment(d)}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-2xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <PlusCircle size={12} /> Ghi nhận thanh toán
                          </button>
                          
                          <button
                            onClick={() => handleOpenRemind(d)}
                            className="flex-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold rounded-lg text-2xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <MessageSquare size={12} /> Tạo tin nhắn nhắc nợ
                          </button>
                        </>
                      ) : (
                        <div className="py-2.5 px-3 bg-slate-50 text-slate-400 font-bold text-center rounded-lg text-3xs w-full flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600" /> Hồ sơ nợ đã đóng
                        </div>
                      )}

                      {/* Expand details toggler */}
                      <button
                        onClick={() => setExpandedDebtId(isExpanded ? null : d.id)}
                        className="p-1 px-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer text-2s font-bold flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>Thu gọn <ChevronUp size={12} /></>
                        ) : (
                          <>Xem lịch sử & Chi chú <ChevronDown size={12} /></>
                        )}
                      </button>
                    </div>

                  </div>

                  {/* EXPANDABLE DETAILS PANEL */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1.5 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row gap-6 animate-fade-in text-xxs">
                      
                      {/* Remind Notes and Quick Editing */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold uppercase text-slate-400 tracking-wider text-3xs">
                            GHI CHÚ THEO DÕI & NHẮC NỢ RIÊNG BIỆT
                          </h4>
                          {editingNotesDebtId !== d.id && (
                            <button
                              onClick={() => {
                                setEditingNotesDebtId(d.id);
                                setEditingNotesText(d.remindNotes);
                              }}
                              className="text-brand-green-mid hover:underline font-extrabold flex items-center gap-0.5"
                            >
                              <Edit2 size={10} /> Chỉnh sửa nhanh
                            </button>
                          )}
                        </div>

                        {editingNotesDebtId === d.id ? (
                          <div className="space-y-1.5">
                            <textarea
                              rows={2}
                              value={editingNotesText}
                              onChange={e => setEditingNotesText(e.target.value)}
                              placeholder="Thêm các thông tin rà soát như: Gọi điện ngày nào, hẹn chuyển khoản, thông tin trung gian, cam kết gia hạn..."
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden"
                            />
                            <div className="flex gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingNotesDebtId(null)}
                                className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded font-bold"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveNotes(d.id, d.projectId)}
                                className="px-2.5 py-1 bg-brand-green-mid text-white rounded font-bold"
                              >
                                Lưu
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-slate-200/50 p-3 rounded-xl min-h-[50px] flex items-start gap-2">
                            <span className="text-slate-400">✍️</span>
                            <span className="text-slate-600 italic font-medium">
                              {d.remindNotes || 'Chưa ghi chú hành vi rà soát công nợ. Hãy viết nhanh các cam kết, hạn hẹn của khách để tiện liên lạc.'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Payment History Log */}
                      <div className="w-full md:w-96 space-y-2">
                        <h4 className="font-extrabold uppercase text-slate-400 tracking-wider text-3xs">
                          LỊCH SỬ THANH TOÁN THỰC THẾ ({d.payments.length} lượt)
                        </h4>

                        {d.payments.length === 0 ? (
                          <div className="p-4 bg-white/50 border border-slate-150 rounded-xl text-center text-slate-400 font-medium italic">
                            Chưa tìm thấy hồ sơ thanh toán hạch toán.
                          </div>
                        ) : (
                          <div className="bg-white border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[140px] overflow-y-auto">
                            {d.payments.map((p: any) => (
                              <div key={p.id} className="p-2.5 flex items-center justify-between text-2xs">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800 font-mono">
                                    {p.transactionNumber || `Auto-${p.id.slice(-3)}`}
                                  </div>
                                  <div className="text-slate-400 font-medium">
                                    {formatDate(p.date)} • {p.method}
                                  </div>
                                </div>
                                <span className="font-black text-emerald-700">
                                  +{formatVND(p.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL GHI NHẬN HẠCH TOÁN THANH TOÁN CỦA KHÁCH */}
      {paymentModalOpen && activePaymentDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-emerald-800 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Ghi nhận Thanh toán Công nợ
                </h3>
                <p className="text-[10px] text-white/80 font-medium">
                  Hệ thống tự động cộng sổ quỹ thu & khấu trừ số nợ của khách.
                </p>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4 text-xxs">
              
              <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-1">
                <p className="font-bold text-slate-450 uppercase text-[9px]">KHÁCH HÀNG & DỰ ÁN</p>
                <p className="font-black text-slate-800 text-sm">{activePaymentDebt.clientName}</p>
                <p className="text-slate-500 font-medium">{activePaymentDebt.title}</p>
                
                <div className="pt-2 flex justify-between items-center text-xs font-black border-t border-slate-200">
                  <span className="text-slate-500">Dư nợ hiện hữu cần đóng:</span>
                  <span className="text-rose-700">{formatVND(activePaymentDebt.remainingAmount)}</span>
                </div>
              </div>

              {/* Amount & Date Input */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">SỐ TIỀN THỰC THU (VND) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    max={activePaymentDebt.remainingAmount}
                    value={paymentAmount || ''}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-black text-xs"
                    id="debt-payment-amount"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">NGÀY GHI SỔ *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-semibold"
                  />
                </div>
              </div>

              {paymentAmount > 0 && (
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-150 text-[10px] text-slate-600 font-extrabold">
                  ✍️ Số tiền bằng chữ: <em className="text-slate-800 not-italic font-black underline">{numberToVietnameseWords(paymentAmount)}</em>
                </div>
              )}

              {/* Method & Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase">PHƯƠNG THỨC THANH TOÁN</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Chuyển khoản', 'Tiền mặt', 'Ví điện tử', 'Khác'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m as any)}
                      className={`p-2 border rounded-lg font-bold text-center capitalize transition-all ${
                        paymentMethod === m 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-3xs' 
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase">GHI CHÚ HẠCH TOÁN</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="ví dụ: Nhận tất toán chuyển khoản hợp đồng còn lại"
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Hạch toán sổ quỹ
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL TIN NHẮN NHẮC NỢ MẪU - 3 Tiers */}
      {remindModalOpen && activeRemindDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-indigo-900 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5/1 pb-0.5">
                  <Sparkles size={16} className="text-indigo-300" /> Tạo tin nhắn nhắc nợ và đối soát
                </h3>
                <p className="text-[10px] text-indigo-200 font-medium">
                  Soạn thảo tin nhắn tinh tế, tăng tỷ lệ thanh toán của khách lên 70% không gây hiểu lầm.
                </p>
              </div>
              <button
                onClick={() => setRemindModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xxs">
              
              {/* Template Tier Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  CHỌN MỨC ĐỘ THÂN THIỆN / TONE GIỌNG
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setMessageTemplateIndex(1)}
                    className={`p-2 text-center rounded-lg font-bold transition-all ${
                      messageTemplateIndex === 1 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                     🌱 Lịch sự (Nhắc 1)
                  </button>
                  <button
                    onClick={() => setMessageTemplateIndex(2)}
                    className={`p-2 text-center rounded-lg font-bold transition-all ${
                      messageTemplateIndex === 2 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                     💼 Chuyên nghiệp (Nhắc 2)
                  </button>
                  <button
                    onClick={() => setMessageTemplateIndex(3)}
                    className={`p-2 text-center rounded-lg font-bold transition-all ${
                      messageTemplateIndex === 3 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                     ⚠️ Nghiêm túc (Nhắc 3)
                  </button>
                </div>
              </div>

              {/* Interactive preview board */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400">
                  <span>XEM TRƯỚC TIN NHẮN (PREVIEW GỬI KHÁCH)</span>
                  <span className="text-emerald-700 italic">Được điền tự động</span>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-medium text-xs text-slate-700 leading-relaxed font-sans max-h-[160px] overflow-y-auto select-all">
                  {renderedMessageText}
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex items-start gap-2 text-slate-600 leading-tight">
                <span>💡</span>
                <p>
                  <strong>Mách nhỏ Freelancer:</strong> Sao chép tin nhắn này rồi gửi qua Zalo, Messenger hoặc email kèm số tài khoản ngân hàng của bạn để khách xem xét tất toán dứt điểm.
                </p>
              </div>

              {/* CTA action buttons */}
              <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
                <button
                  onClick={() => setRemindModalOpen(false)}
                  className="px-4 py-2 bg-slate-150 text-slate-700 rounded-lg cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={handleCopyMessage}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={13} /> Sao chép tin nhắn
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

interface XProps {
  size?: number;
  className?: string;
}
