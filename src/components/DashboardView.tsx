/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { 
  Project, 
  Client, 
  Transaction, 
  TAX_STANDARDS
} from '../types';
import { 
  formatVND, 
  formatShortVND, 
  formatDate, 
  getProjectStatusInfo 
} from '../utils';
import { 
  TrendingUp, 
  DollarSign, 
  Briefcase, 
  Users, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Layers,
  ChevronRight,
  Calculator,
  UserCheck,
  Percent,
  FileSpreadsheet,
  AlertOctagon,
  Bell,
  Sparkles,
  Search,
  CheckCircle,
  FileText,
  UserPlus,
  Coins
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  projects: Project[];
  clients: Client[];
  transactions: Transaction[];
  onNavigate: (tab: string) => void;
  onSelectProject: (projectId: string) => void;
  onEditProject?: (p: Project) => void;
}

export default function DashboardView({
  projects,
  clients,
  transactions,
  onNavigate,
  onSelectProject,
  onEditProject
}: DashboardViewProps) {
  // 1. CHUẨN BỊ MỐC THỜI GIAN ĐỘNG
  // Sử dụng dữ liệu năm 2026 để khớp hoàn hảo với mockData có sẵn
  const [today, setToday] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setToday(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => {
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [today]);

  const currentMonthStr = useMemo(() => {
    return todayStr.slice(0, 7); // "2026-05"
  }, [todayStr]);

  const currentMonthLabel = useMemo(() => {
    const [year, month] = currentMonthStr.split('-');
    return `tháng ${parseInt(month)}/${year}`;
  }, [currentMonthStr]);

  // Hàm tính khoảng cách ngày tiện ích
  const getDaysDiff = (dateStr: string) => {
    const todayDate = new Date(todayStr);
    todayDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - todayDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };


  // ==========================================
  // A. THỐNG KÊ CHỈ SỐ TỔNG QUAN (KPIs)
  // ==========================================
  
  // 1. Doanh thu tháng này
  const monthlyRevenue = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'thu' && t.date && t.date.slice(0, 7) === currentMonthStr)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonthStr]);

  // 2. Chi phí tháng này
  const monthlyExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'chi' && t.date && t.date.slice(0, 7) === currentMonthStr)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonthStr]);

  // 3. Lợi nhuận tạm tính tháng này
  const monthlyProfit = monthlyRevenue - monthlyExpense;

  // 4. Tổng công nợ chưa thu (Phần thanh toán cuối chưa hoàn thành của các dự án đã chạy)
  const outstandingDebtsTotal = useMemo(() => {
    return projects
      .filter((p) => p.status !== 'draft' && p.finalPaymentStatus !== 'paid')
      .reduce((sum, p) => sum + p.finalPayment, 0);
  }, [projects]);

  // 5. Số job đang thực hiện (deposited, in_progress, editing, delivered)
  const jobsInProgressCount = useMemo(() => {
    return projects.filter((p) => ['deposited', 'in_progress', 'editing', 'delivered'].includes(p.status)).length;
  }, [projects]);

  // 6. Số job đã hoàn thành
  const jobsCompletedCount = useMemo(() => {
    return projects.filter((p) => p.status === 'completed').length;
  }, [projects]);

  // 7. Số khách hàng mới trong tháng
  const newClientsInMonthCount = useMemo(() => {
    return clients.filter((c) => c.createdAt && c.createdAt.slice(0, 7) === currentMonthStr).length;
  }, [clients, currentMonthStr]);

  // 8. Số lịch hẹn sắp tới (shootDate >= hôm nay, dự án chưa hoàn thành)
  const upcomingAppointmentsCount = useMemo(() => {
    return projects.filter((p) => p.shootDate && p.shootDate >= todayStr && p.status !== 'completed' && p.status !== 'draft').length;
  }, [projects, todayStr]);


  // ==========================================
  // B. HỆ THỐNG CẢNH BÁO NHANH (ALERTS)
  // ==========================================
  const alerts = useMemo(() => {
    const list: Array<{ 
      id: string; 
      type: 'danger' | 'warning' | 'info' | 'success'; 
      title: string; 
      desc: string; 
      category: string;
      actionText?: string; 
      projectId?: string;
    }> = [];

    // B1. Cảnh báo quá hạn hoặc sắp đến deadline trong 3 ngày tới
    projects.forEach((p) => {
      const clientName = clients.find((c) => c.id === p.clientId)?.name || 'Khách hàng';
      
      if (p.dueDate && p.status !== 'completed' && p.status !== 'draft') {
        const days = getDaysDiff(p.dueDate);
        if (days < 0) {
          list.push({
            id: `deadline-overdue-${p.id}`,
            type: 'danger',
            title: `Trễ hạn bàn giao: ${p.title}`,
            desc: `Đã quá hạn bàn giao ${Math.abs(days)} ngày (Hạn: ${formatDate(p.dueDate)}). Cần gửi file gấp cho khách.`,
            category: 'Deadline',
            actionText: 'Kiểm tra',
            projectId: p.id
          });
        } else if (days >= 0 && days <= 3) {
          list.push({
            id: `deadline-urgent-${p.id}`,
            type: 'danger',
            title: `Sắp đến hạn bàn giao (${days} ngày): ${p.title}`,
            desc: `Hạn bàn giao vào ngày ${formatDate(p.dueDate)}. Đang ở trạng thái "${getProjectStatusInfo(p.status).label}".`,
            category: 'Deadline',
            actionText: 'Xử lý ngay',
            projectId: p.id
          });
        }
      }

      // B2. Khách chưa thanh toán đủ công nợ lớn (Dự án đã bàn giao nhưng nợ cuối chưa trả)
      if (p.status === 'delivered' && p.finalPaymentStatus !== 'paid' && p.finalPayment > 0) {
        list.push({
          id: `unpaid-final-${p.id}`,
          type: 'warning',
          title: `Chưa thu nốt tiền: ${p.title}`,
          desc: `Đã bàn giao sản phẩm nhưng còn ${formatVND(p.finalPayment)} công nợ chưa thu từ ${clientName}.`,
          category: 'Công nợ',
          actionText: 'Thu nợ',
          projectId: p.id
        });
      }

      // B3. Hợp đồng chưa ký
      // Các hoạt động đã đặt cọc hoặc triển khai nhưng chưa ghi mã hợp đồng chính thức (không bắt đầu bằng HD)
      if (['deposited', 'in_progress', 'editing'].includes(p.status) && (!p.contractNumber || !p.contractNumber.startsWith('HD'))) {
        list.push({
          id: `no-contract-${p.id}`,
          type: 'warning',
          title: `Chưa ký hợp đồng chính thức: ${p.title}`,
          desc: `Dự án sáng tạo đã triển khai hoặc nhận cọc nhưng chỉ có báo giá "${p.contractNumber || 'Chưa lập'}" mà chưa ký HĐ để ràng buộc pháp lý.`,
          category: 'Hợp đồng',
          actionText: 'Lập HĐ',
          projectId: p.id
        });
      }

      // B4. Báo giá chưa được duyệt (Các job ở trạng thái nháp/chờ duyệt)
      if (p.status === 'draft') {
        list.push({
          id: `draft-quote-${p.id}`,
          type: 'info',
          title: `Báo giá chờ duyệt: ${p.title}`,
          desc: `Gói dịch vụ ${formatVND(p.price)} gửi cho ${clientName} đang ở trạng thái Nháp/Chờ đối tác duyệt ngân sách.`,
          category: 'Báo giá',
          actionText: 'Gửi lại khách',
          projectId: p.id
        });
      }

      // B5. Lịch hẹn hôm nay (Lịch bấm máy/đi sự kiện thiết lập trùng ngày ngày hôm nay)
      if (p.shootDate && p.shootDate === todayStr) {
        list.push({
          id: `shoot-today-${p.id}`,
          type: 'success',
          title: `Lịch bấm máy HÔM NAY 🎥: ${p.title}`,
          desc: `Thời gian bấm máy/quay phim sự kiện diễn ra hôm nay. Liên hệ ${clientName} để chuẩn bị nhân sự và máy móc.`,
          category: 'Lịch hẹn',
          actionText: 'Xem lịch',
          projectId: p.id
        });
      }
    });

    // B6. Khoản chi lớn bất thường (Chi phí độc lập hoặc trong dự án lớn hơn 1,500,000 VNĐ)
    transactions.forEach((t) => {
      if (t.type === 'chi' && t.amount >= 1500000 && t.date && t.date.slice(0, 7) === currentMonthStr) {
        list.push({
          id: `huge-expense-${t.id}`,
          type: 'warning',
          title: `Khoản chi lớn bất thường: Chịu chi ${formatVND(t.amount)}`,
          desc: `Chi phí "${t.description}" (${t.category}) vượt ngưỡng 1.5M phát sinh trong tháng này.`,
          category: 'Sổ quỹ'
        });
      }
    });

    return list;
  }, [projects, clients, transactions, todayStr, currentMonthStr]);


  // ==========================================
  // C. DỮ LIỆU BIỂU ĐỒ (CHARTS) DỰ TRÊN TRANSACTION VÀ DỰ ÁN
  // ==========================================

  // 1. Tổ chức dữ liệu tài chính theo tháng (Doanh thu, Chi phí, Lợi nhuận)
  const monthlyChartData = useMemo(() => {
    const map = new Map<string, { revenue: number; expense: number; profit: number }>();
    
    // Khởi tạo trước một số tháng cơ bản gần đây để biểu đồ không bị rỗng
    const years = [2026];
    const months = ['03', '04', '05', '06'];
    years.forEach(yr => {
      months.forEach(m => {
        map.set(`${yr}-${m}`, { revenue: 0, expense: 0, profit: 0 });
      });
    });

    // Cộng dồn thu chi vào các tháng phù hợp
    transactions.forEach((t) => {
      if (t.date) {
        const monthKey = t.date.slice(0, 7); // yyyy-mm
        const currentData = map.get(monthKey) || { revenue: 0, expense: 0, profit: 0 };
        
        if (t.type === 'thu') {
          currentData.revenue += t.amount;
        } else {
          currentData.expense += t.amount;
        }
        currentData.profit = currentData.revenue - currentData.expense;
        map.set(monthKey, currentData);
      }
    });

    // Chuyển map thành mảng đã sắp xếp thời gian tăng dần
    return Array.from(map.entries())
      .map(([monthKey, val]) => {
        const [year, month] = monthKey.split('-');
        return {
          key: monthKey,
          label: `T${parseInt(month)}/${year.slice(2)}`,
          revenue: val.revenue,
          expense: val.expense,
          profit: val.profit
        };
      })
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [transactions]);

  // Tìm giá trị lớn nhất trong biểu đồ cột để làm tỉ lệ chiều cao cột
  const chartMaxVal = useMemo(() => {
    let max = 1000000; // Mặc định tối thiểu để tránh chia cho 0
    monthlyChartData.forEach(d => {
      const highest = Math.max(d.revenue, d.expense, Math.abs(d.profit));
      if (highest > max) {
        max = highest;
      }
    });
    return max * 1.1; // Chừa khoảng trống 10% ở đỉnh
  }, [monthlyChartData]);

  // 2. Tỷ trọng doanh thu theo loại dịch vụ (Lấy từ báo giá các dự án active hoặc complete)
  const serviceShareStats = useMemo(() => {
    const stats: Record<string, number> = {};
    projects.forEach((p) => {
      if (p.status !== 'draft') {
        const rev = p.price;
        stats[p.serviceType] = (stats[p.serviceType] || 0) + rev;
      }
    });

    const total = Object.values(stats).reduce((sum, v) => sum + v, 0);
    return Object.entries(stats).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [projects]);

  // 3. Top 5 khách hàng mang lại doanh thu cao nhất
  const topClientsStats = useMemo(() => {
    const stats: Record<string, number> = {};
    projects.forEach((p) => {
      if (p.status !== 'draft') {
        stats[p.clientId] = (stats[p.clientId] || 0) + p.price;
      }
    });

    return Object.entries(stats).map(([clientId, value]) => {
      const client = clients.find(c => c.id === clientId);
      return {
        id: clientId,
        name: client ? client.name : 'Khách hàng vãng lai',
        phone: client ? client.phone : 'Chưa cập nhật',
        type: client ? client.type : 'Cá nhân',
        value
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  }, [projects, clients]);


  // ==========================================
  // D. CÁC DANH SÁCH NHANH (QUICK LISTS)
  // ==========================================

  // 1. Danh sách 5 job gần deadline nhất (loại trừ đã xong và nháp)
  const quickJobsDeadline = useMemo(() => {
    return projects
      .filter((p) => p.dueDate && p.status !== 'completed' && p.status !== 'draft')
      .map((p) => {
        const client = clients.find(c => c.id === p.clientId);
        return {
          ...p,
          clientName: client ? client.name : 'Ẩn danh',
          daysLeft: getDaysDiff(p.dueDate!)
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);
  }, [projects, clients]);

  // 2. Danh sách 5 khoản công nợ lớn nhất
  const quickLargestDebts = useMemo(() => {
    return projects
      .filter((p) => p.finalPayment > 0 && p.finalPaymentStatus !== 'paid' && p.status !== 'draft')
      .map((p) => {
        const client = clients.find(c => c.id === p.clientId);
        return {
          ...p,
          clientName: client ? client.name : 'Ẩn danh'
        };
      })
      .sort((a, b) => b.finalPayment - a.finalPayment)
      .slice(0, 5);
  }, [projects, clients]);

  // 3. Danh sách 5 khách hàng mới nhất trong CRM
  const quickNewestClients = useMemo(() => {
    return [...clients]
      .sort((a, b) => {
        const cA = a.createdAt || '';
        const cB = b.createdAt || '';
        return cB.localeCompare(cA);
      })
      .slice(0, 5);
  }, [clients]);

  // 4. Danh sách 5 giao dịch thu/chi mới ghi nhận nhất
  const quickNewestTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const dA = a.date || '';
        const dB = b.date || '';
        if (dA !== dB) return dB.localeCompare(dA);
        return b.id.localeCompare(a.id);
      })
      .slice(0, 5);
  }, [transactions]);


  // Quản lý trạng thái lọc nhanh cảnh báo ngay trên UI
  const [activeAlertFilter, setActiveAlertFilter] = useState<string>('all');
  const filteredAlerts = useMemo(() => {
    if (activeAlertFilter === 'all') return alerts;
    if (activeAlertFilter === 'danger') return alerts.filter(a => a.type === 'danger');
    if (activeAlertFilter === 'warning') return alerts.filter(a => a.type === 'warning');
    if (activeAlertFilter === 'info') return alerts.filter(a => a.type === 'info');
    return alerts;
  }, [alerts, activeAlertFilter]);



  return (
    <div className="space-y-8 pb-10">

      {/* HEADER Giao diện tích hợp thông tin và ngày giờ hệ thống */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-green-mid uppercase tracking-wide">
            <Sparkles size={13} className="text-brand-accent animate-pulse" />
            Hệ điều hành tài chính Freelance OS
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            HQ Kinh Doanh Tổng Quan
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Dữ liệu tính toán thời gian thực đối soát đến ngày <span className="font-semibold text-slate-800">{formatDate(todayStr)}</span> ({currentMonthLabel})
          </p>
        </div>

        {/* Đồng hồ UTC & Phím tắt Sổ quỹ / Job */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 font-mono block">MÚI GIỜ HỆ THỐNG</span>
            <span className="text-xs font-bold text-slate-700 font-mono">{today.toLocaleTimeString('vi-VN')} (GMT+7)</span>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="bg-brand-green-mid hover:bg-brand-green-dark text-white rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            id="dash-quick-p-create"
          >
            <Briefcase size={14} /> Thêm Job
          </button>
          <button
            onClick={() => onNavigate('transactions')}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            id="dash-quick-t-create"
          >
            <DollarSign size={14} className="text-emerald-500" /> Báo Cáo Thu Chi
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* A. THẺ CHỈ SỐ TỔNG QUAN (INDEX INTEGRATORS) */}
      {/* ========================================================== */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">
          A. Thẻ chỉ số tổng quan ({currentMonthLabel})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Doanh thu tháng này */}
          <div className="bg-white border border-slate-100 p-4 md:p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-emerald-200 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 opacity-80" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh Thu Tháng Này</p>
                <h4 className="text-lg md:text-2xl font-black text-slate-900 mt-2 font-mono tracking-tight">
                  {formatVND(monthlyRevenue)}
                </h4>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1">
              <Coins size={11} className="text-emerald-500" />
              Tổng các khoản thu mới ghi nhận
            </p>
          </div>

          {/* Card 2: Chi phí tháng này */}
          <div className="bg-white border border-slate-100 p-4 md:p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-rose-200 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 opacity-80" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">Chi Phí Tháng Này</p>
                <h4 className="text-lg md:text-2xl font-black text-slate-900 mt-2 font-mono tracking-tight">
                  {formatVND(monthlyExpense)}
                </h4>
              </div>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <ArrowDownRight size={18} />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1">
              <Clock size={11} className="text-rose-500" />
              Thuê thiết bị, địa điểm, ê-kíp ngoài
            </p>
          </div>

          {/* Card 3: Lợi nhuận tạm tính */}
          <div className="bg-white border border-slate-100 p-4 md:p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-brand-green-mid/35 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-green-mid opacity-80" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">Lợi Nhuận Tạm Tính</p>
                <h4 className={`text-lg md:text-2xl font-black mt-2 font-mono tracking-tight ${monthlyProfit >= 0 ? 'text-brand-green-mid' : 'text-rose-600'}`}>
                  {formatVND(monthlyProfit)}
                </h4>
              </div>
              <div className={`p-2 rounded-xl ${monthlyProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2.5">
              Hiệu suất thu về: <span className="font-bold text-slate-700">{monthlyRevenue > 0 ? ((monthlyProfit / monthlyRevenue) * 100).toFixed(0) : 0}%</span> doanh thu
            </p>
          </div>

          {/* Card 4: Tổng công nợ chưa thu */}
          <div className="bg-white border border-slate-100 p-4 md:p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-amber-400 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-accent opacity-80" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider text-brand-accent font-bold">Nợ Phải Thu Phía Trước</p>
                <h4 className="text-lg md:text-2xl font-black text-slate-900 mt-2 font-mono tracking-tight text-brand-accent">
                  {formatVND(outstandingDebtsTotal)}
                </h4>
              </div>
              <div className="p-2 bg-amber-50 text-brand-accent rounded-xl">
                <AlertTriangle size={18} />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2.5">
              Tồn đọng từ các job đã kích hoạt
            </p>
          </div>

          {/* Card 5: Số job đang thực hiện */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center gap-3">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl shrink-0">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Job Đang Thực Hiện</p>
              <h4 className="text-base md:text-xl font-bold text-slate-800">{jobsInProgressCount} Dự án hoạt động</h4>
            </div>
          </div>

          {/* Card 6: Số job đã hoàn thành */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Đơn Hoàn Thành Toàn Diện</p>
              <h4 className="text-base md:text-xl font-bold text-slate-800">{jobsCompletedCount} Job hoàn tất kỹ</h4>
            </div>
          </div>

          {/* Card 7: Số khách hàng mới trong tháng */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Khách Hàng Mới Trong Tháng</p>
              <h4 className="text-base md:text-xl font-bold text-slate-800">{newClientsInMonthCount} liên hệ mới</h4>
            </div>
          </div>

          {/* Card 8: Số lịch hẹn sắp tới */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Lịch Quay / Chụp Sắp Tới</p>
              <h4 className="text-base md:text-xl font-bold text-slate-800">{upcomingAppointmentsCount} buổi đặt lịch</h4>
            </div>
          </div>

        </div>
      </div>


      {/* ========================================================== */}
      {/* B. HỆ THỐNG CẢNH BÁO NHANH (ALERTS HUB) */}
      {/* ========================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-amber-500" />
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              B. Cảnh báo & Nhắc việc khẩn (Alarms)
            </h3>
            <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
              {alerts.length} Sự vụ cần xử lý
            </span>
          </div>

          {/* Bộ lọc cảnh báo */}
          <div className="flex bg-slate-100 p-1 rounded-lg gap-1 shrink-0 self-start text-xs">
            <button
              onClick={() => setActiveAlertFilter('all')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${activeAlertFilter === 'all' ? 'bg-white shadow-xs text-slate-800 font-bold' : 'text-slate-500'}`}
            >
              Tất cả ({alerts.length})
            </button>
            <button
              onClick={() => setActiveAlertFilter('danger')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${activeAlertFilter === 'danger' ? 'bg-red-500 text-white shadow-xs font-bold' : 'text-slate-500'}`}
            >
              Nguy cấp ({alerts.filter(a => a.type === 'danger').length})
            </button>
            <button
              onClick={() => setActiveAlertFilter('warning')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${activeAlertFilter === 'warning' ? 'bg-amber-400 text-slate-900 shadow-xs font-bold' : 'text-slate-500'}`}
            >
              Cần lưu ý ({alerts.filter(a => a.type === 'warning').length})
            </button>
            <button
              onClick={() => setActiveAlertFilter('info')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${activeAlertFilter === 'info' ? 'bg-blue-500 text-white shadow-xs font-bold' : 'text-slate-500'}`}
            >
              Chờ duyệt ({alerts.filter(a => a.type === 'info').length})
            </button>
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3">
              <CheckCircle size={32} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Mọi sự vụ đều đã được giải quyết!</h4>
            <p className="text-xs text-slate-400 mt-1">Hệ thống không phát hiện bất kỳ nguy cơ trễ hạn, nợ đọng lâu ngày hay báo giá treo nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex flex-col justify-between border rounded-2xl p-4 transition-all relative overflow-hidden group hover:shadow-xs ${
                  alert.type === 'danger' 
                    ? 'bg-red-50/20 border-red-100 hover:border-red-200' 
                    : alert.type === 'warning'
                    ? 'bg-amber-50/15 border-amber-200 hover:border-amber-300'
                    : alert.type === 'success'
                    ? 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200'
                    : 'bg-blue-50/20 border-blue-100 hover:border-blue-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-dashed border-slate-200/50">
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                      alert.type === 'danger' 
                        ? 'bg-red-100 text-red-800' 
                        : alert.type === 'warning'
                        ? 'bg-amber-100 text-amber-900'
                        : alert.type === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Đối soát hệ thống</span>
                  </div>
                  
                  <h4 className="text-sm font-bold text-slate-800 flex items-start gap-1.5 leading-tight">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                      alert.type === 'danger' 
                        ? 'bg-red-500' 
                        : alert.type === 'warning'
                        ? 'bg-amber-500'
                        : alert.type === 'success'
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                    }`} />
                    {alert.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {alert.desc}
                  </p>
                </div>

                {alert.projectId && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => onSelectProject(alert.projectId!)}
                      className="text-xs font-bold text-brand-green-mid hover:text-brand-green-dark flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-all"
                    >
                      {alert.actionText || 'Xử lý ngay'} <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>


      {/* ========================================================== */}
      {/* C. PHẦN TRỰC QUAN BIỂU ĐỒ TÀI CHÍNH & TỶ TRỌNG (CHARTS) */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Biểu đồ 1 (7/12): Lịch sử Tài chính Hàng Tháng (Doanh thu vs Chi phí vs Lợi nhuận) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 mb-4 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Diễn Biến Thu Chi & Lợi Nhuận</h3>
                <p className="text-xs text-slate-400 mt-0.5">Thống kê so sánh thực tế theo từng tháng trong năm 2026</p>
              </div>

              {/* Legends */}
              <div className="flex gap-3 text-[10px] md:text-xs">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" /> Thu (Doanh thu)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block" /> Chi (Chi phí)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" /> Lợi nhuận ròng</span>
              </div>
            </div>

            {/* Render Biểu đồ Cột SVG phối hợp tự vẽ để đảm bảo tính responsive và chất lượng cao */}
            <div className="w-full relative px-2">
              <div className="absolute right-0 top-0 text-[10px] text-slate-400 font-mono italic">
                Độ cao cột tỉ lệ với {formatShortVND(chartMaxVal)}
              </div>
              
              <div className="flex h-56 items-end gap-3 md:gap-7 pt-4 border-b border-slate-200">
                {monthlyChartData.map((d) => {
                  const rHeight = `${Math.max(3, (d.revenue / chartMaxVal) * 100)}%`;
                  const eHeight = `${Math.max(3, (d.expense / chartMaxVal) * 100)}%`;
                  const pHeight = `${Math.max(3, (Math.max(0, d.profit) / chartMaxVal) * 100)}%`;

                  // Highlight tháng hiện tại
                  const isCurrent = d.key === currentMonthStr;

                  return (
                    <div key={d.key} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      
                      {/* Tooltip Hoạt họa khi Hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-950 text-white text-[11px] p-3 rounded-xl shadow-2xl z-30 min-w-[170px] pointer-events-none border border-slate-800">
                        <p className="font-extrabold text-slate-300 border-b border-slate-800 pb-1 mb-1">{d.key === currentMonthStr ? `${d.label} (Tháng này)` : d.label}</p>
                        <div className="flex justify-between gap-4 mt-1">
                          <span className="text-emerald-400 font-semibold">Thu thực tế:</span>
                          <span className="font-mono font-bold text-right">{formatVND(d.revenue)}</span>
                        </div>
                        <div className="flex justify-between gap-4 mt-0.5">
                          <span className="text-rose-400 font-semibold">Chi phí phát sinh:</span>
                          <span className="font-mono font-bold text-right">{formatVND(d.expense)}</span>
                        </div>
                        <div className="flex justify-between gap-4 mt-1 border-t border-slate-800 pt-1 text-teal-400 font-extrabold">
                          <span>Lợi nhuận ròng:</span>
                          <span className="font-mono font-bold text-right">{formatVND(d.profit)}</span>
                        </div>
                      </div>

                      {/* Các cột chỉ số chính */}
                      <div className="flex items-end gap-1 w-full h-full pb-1 relative">
                        {/* Cột Thu */}
                        <div 
                          style={{ height: rHeight }}
                          className={`flex-1 bg-emerald-500/80 group-hover:bg-emerald-500 rounded-t-sm transition-all duration-300`}
                        />
                        {/* Cột Chi */}
                        <div 
                          style={{ height: eHeight }}
                          className={`flex-1 bg-rose-500/80 group-hover:bg-rose-500 rounded-t-sm transition-all duration-300`}
                        />
                        {/* Cột Lợi Nhuận */}
                        <div 
                          style={{ height: pHeight }}
                          className={`flex-1 bg-blue-500/80 group-hover:bg-blue-500 rounded-t-sm transition-all duration-300`}
                        />
                      </div>

                      {/* Trục X nhãn tháng */}
                      <div className={`text-[10px] font-mono mt-2 text-center select-none py-1 px-1.5 rounded-sm ${isCurrent ? 'bg-brand-green-mid text-white font-bold' : 'text-slate-500'}`}>
                        {d.label}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tóm tắt nhanh dòng tiền */}
            <div className="mt-4 text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block shrink-0"></span>
                Hiệu suất dòng tiền hiện đạt hiệu quả cao nhất nhờ tối ưu hóa chi tiêu nhân sự freelancer phụ.
              </span>
              <button 
                onClick={() => onNavigate('transactions')}
                className="font-bold text-brand-green-light hover:underline text-[11px] shrink-0 self-end sm:self-center"
              >
                Đối chiếu bảng cân đối kế toán &gt;
              </button>
            </div>

          </div>
        </div>

        {/* Biểu đồ 2 (5/12): Gồm phân loại dịch vụ + Top 5 khách hàng vàng */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* A. Phân loại dịch vụ và cơ cấu doanh thu */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900">Mảng Doanh Thu Chủ Lực</h3>
              <span className="text-[10px] text-slate-400">Tỷ trọng báo giá (%)</span>
            </div>

            {serviceShareStats.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Chưa có dữ liệu dự án hoạt động.</p>
            ) : (
              <div className="space-y-3.5">
                {/* Thanh tỉ lệ gộp (Apple Health style) */}
                <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden">
                  {serviceShareStats.map((stat, idx) => {
                    const colors = [
                      'bg-emerald-500', 
                      'bg-amber-400', 
                      'bg-sky-400', 
                      'bg-indigo-500', 
                      'bg-rose-500', 
                      'bg-purple-500', 
                      'bg-pink-400', 
                      'bg-stone-500'
                    ];
                    const colorClass = colors[idx % colors.length];
                    return (
                      <div 
                        key={stat.name}
                        style={{ width: `${stat.percentage}%` }}
                        className={`${colorClass} h-full tooltip-target transition-all`}
                        title={`${stat.name}: ${formatVND(stat.value)} (${stat.percentage.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Danh sách loại dịch vụ xếp hạng chi tiết */}
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {serviceShareStats.map((stat, idx) => {
                    const colors = [
                      'bg-emerald-500', 
                      'bg-amber-400', 
                      'bg-sky-400', 
                      'bg-indigo-500', 
                      'bg-rose-500', 
                      'bg-purple-500', 
                      'bg-pink-400', 
                      'bg-stone-500'
                    ];
                    const colorClass = colors[idx % colors.length];
                    const textClass = colors[idx % colors.length].replace('bg-', 'text-');

                    return (
                      <div key={stat.name} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                          <span className={`w-2 h-2 rounded-full ${colorClass} shrink-0`}></span>
                          <span className="font-semibold text-slate-700 truncate">{stat.name}</span>
                        </div>
                        <span className="font-mono text-slate-500 space-x-1">
                          <strong className="text-slate-900">{stat.percentage.toFixed(1)}%</strong>
                          <span>({formatShortVND(stat.value)})</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* B. Top 5 khách hàng VIP mang lại doanh thu cao nhất */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                <h3 className="text-sm font-bold text-slate-900">Top 5 Khách Hàng Tri Kỷ</h3>
                <span className="text-[10px] text-brand-green-mid font-semibold">Tích lũy doanh số</span>
              </div>

              {topClientsStats.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Chưa ghi nhận doanh thu từ khách hàng.</p>
              ) : (
                <div className="space-y-3">
                  {topClientsStats.map((c, idx) => {
                    const topVal = topClientsStats[0]?.value || 1;
                    const pctOfMax = `${Math.max(10, (c.value / topVal) * 100)}%`;

                    return (
                      <div key={c.id} className="flex items-center gap-2.5">
                        {/* Huy hiệu thứ hạng */}
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                          idx === 0 ? 'bg-amber-100 text-amber-700 font-extrabold border border-amber-200' :
                          idx === 1 ? 'bg-slate-200 text-slate-800' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {idx + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-slate-800 truncate" title={c.name}>{c.name}</span>
                            <span className="font-mono font-bold text-slate-950">{formatShortVND(c.value)}</span>
                          </div>
                          {/* Visual Row Bar */}
                          <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden border border-slate-100">
                            <div style={{ width: pctOfMax }} className="bg-brand-green-mid h-full rounded-full transition-all" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between items-center">
              <span>Hạng thành viên tính trên tổng đơn booked</span>
              <button 
                onClick={() => onNavigate('clients')} 
                className="font-bold text-brand-green-light hover:underline"
              >
                Xem CRM
              </button>
            </div>
          </div>

        </div>
      </div>


      {/* ========================================================== */}
      {/* D. DANH SÁCH DUYỆT NHANH (QUICK LISTS SECTION) */}
      {/* ========================================================== */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">
          D. Bảng tra cứu & Phân tích nhanh (Quick Tables)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LIST 1: 5 Job gần deadline nhất */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3.5">
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-red-500" />
                  <h4 className="text-sm font-bold text-slate-800">5 Job Sắp Đến Deadline</h4>
                </div>
                <button
                  onClick={() => onNavigate('projects')}
                  className="text-[11px] font-bold text-brand-green-mid hover:underline"
                >
                  Xem hết
                </button>
              </div>

              {quickJobsDeadline.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">Không có job nào sắp đến deadline bàn giao.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {quickJobsDeadline.map((p) => {
                    const hasOverdue = p.daysLeft < 0;
                    const isUrgent = p.daysLeft >= 0 && p.daysLeft <= 3;

                    return (
                      <div key={p.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <p onClick={() => onSelectProject(p.id)} className="font-bold text-slate-800 truncate hover:text-brand-green-light cursor-pointer">
                            {p.title}
                          </p>
                          <p className="text-slate-400 text-[11px] truncate mt-0.5">Khách: {p.clientName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold block ${
                            hasOverdue 
                              ? 'bg-rose-100 text-rose-700' 
                              : isUrgent 
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {hasOverdue 
                              ? `Quá hạn ${Math.abs(p.daysLeft)} ngày` 
                              : p.daysLeft === 0 
                              ? 'Hạn HÔM NAY!' 
                              : `Còn ${p.daysLeft} ngày`
                            }
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">Giao: {formatDate(p.dueDate!)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* LIST 2: 5 Khoản công nợ lớn nhất */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <h4 className="text-sm font-bold text-slate-800">5 Khoản Công Nợ Lớn Nhất</h4>
                </div>
                <button
                  onClick={() => onNavigate('projects')}
                  className="text-[11px] font-bold text-brand-green-mid hover:underline"
                >
                  Giải ngân
                </button>
              </div>

              {quickLargestDebts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">Tất cả nợ đã được thu hồi đầy đủ.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {quickLargestDebts.map((p) => {
                    return (
                      <div key={p.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <p onClick={() => onSelectProject(p.id)} className="font-bold text-slate-800 truncate hover:text-brand-green-light cursor-pointer">
                            {p.title}
                          </p>
                          <p className="text-slate-400 text-[11px] truncate mt-0.5">Khách: {p.clientName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-brand-accent text-right block">
                            {formatVND(p.finalPayment)}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mt-0.5">
                            {p.finalPaymentStatus === 'unpaid' ? 'Chưa thu đợt cuối' : 'Thiếu một phần'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* LIST 3: 5 Khách hàng mới nhất */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3.5">
                <div className="flex items-center gap-1.5">
                  <UserPlus size={16} className="text-purple-500" />
                  <h4 className="text-sm font-bold text-slate-800">5 Liên Hệ Mới Nhất</h4>
                </div>
                <button
                  onClick={() => onNavigate('clients')}
                  className="text-[11px] font-bold text-brand-green-mid hover:underline"
                >
                  Danh bạ CRM
                </button>
              </div>

              {quickNewestClients.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">Chưa ghi nhận khách hàng nào trong hệ thống.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {quickNewestClients.map((c) => {
                    return (
                      <div key={c.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">{c.name}</p>
                          <p className="text-slate-400 text-[11px] truncate mt-0.5">{c.phone} / {c.email || 'Không có email'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md uppercase block">
                            {c.type}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">Tạo: {formatDate(c.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* LIST 4: 5 Giao dịch thu/chi mới nhất */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3.5">
                <div className="flex items-center gap-1.5">
                  <FileText size={16} className="text-emerald-500" />
                  <h4 className="text-sm font-bold text-slate-800">5 Giao Dịch Thu / Chi Gần Nhất</h4>
                </div>
                <button
                  onClick={() => onNavigate('transactions')}
                  className="text-[11px] font-bold text-brand-green-mid hover:underline"
                >
                  Sổ quỹ chính
                </button>
              </div>

              {quickNewestTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">Chưa ghi nhận giao dịch tài chính nào.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {quickNewestTransactions.map((t) => {
                    const isIncome = t.type === 'thu';
                    return (
                      <div key={t.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">{t.description}</p>
                          <p className="text-slate-400 text-[11px] truncate mt-0.5">{t.category}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-mono font-black text-right block ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'}{formatShortVND(t.amount)}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{formatDate(t.date)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
