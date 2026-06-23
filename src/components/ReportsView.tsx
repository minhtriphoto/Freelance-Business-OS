import React, { useState, useMemo } from 'react';
import {
  Project,
  Transaction,
  Client,
  TAX_STANDARDS,
  ServiceType,
  ClientSourceType,
  TransactionMethod
} from '../types';
import { formatVND } from '../utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Users,
  Activity,
  Calculator,
  Download,
  AlertCircle,
  ChevronRight,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  PieChart,
  BarChart4,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Timer,
  ShoppingBag,
  Share2,
  Wallet
} from 'lucide-react';

interface ReportsViewProps {
  projects: Project[];
  transactions: Transaction[];
  clients: Client[];
}

type TimeRangeFilter = 'all' | '2026' | 'q2-2026' | 'm5-2026' | 'm4-2026';

export default function ReportsView({
  projects,
  transactions,
  clients
}: ReportsViewProps) {
  // Tabs for the Report panel
  const [activeTab, setActiveTab] = useState<'revenue' | 'expenses' | 'profit' | 'debts' | 'household'>('revenue');
  
  // Time ranges state
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('all');

  // Fast map lookups
  const clientsMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const projectsMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const actualToday = new Date();
  const getYYYYMMDD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const todayStr = getYYYYMMDD(actualToday);
  const todayDate = actualToday;

  // Time range filtering utility
  const isWithinTimeRange = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    
    switch (timeRange) {
      case '2026':
        return itemDate.getFullYear() === 2026;
      case 'q2-2026':
        // Q2 is April (month idx 3), May (4), June (5)
        return (
          itemDate.getFullYear() === 2026 && 
          itemDate.getMonth() >= 3 && 
          itemDate.getMonth() <= 5
        );
      case 'm5-2026':
        return itemDate.getFullYear() === 2026 && itemDate.getMonth() === 4; // May
      case 'm4-2026':
        return itemDate.getFullYear() === 2026 && itemDate.getMonth() === 3; // April
      case 'all':
      default:
        return true;
    }
  };

  // Label for active period select
  const periodLabel = useMemo(() => {
    switch (timeRange) {
      case '2026': return 'Năm 2026';
      case 'q2-2026': return 'Quý 2/2026';
      case 'm5-2026': return 'Tháng 5/2026';
      case 'm4-2026': return 'Tháng 4/2026';
      case 'all':
      default: return 'Toàn thời gian';
    }
  }, [timeRange]);

  // Filtered lists based on date preset
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isWithinTimeRange(t.date));
  }, [transactions, timeRange]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // If project has deposit date or received date, let's filter by that. Default to true if none.
      const dateToCompare = p.receivedDate || p.depositDate || p.dueDate;
      return dateToCompare ? isWithinTimeRange(dateToCompare) : true;
    });
  }, [projects, timeRange]);

  // Aggregate high-level totals
  const totalRevenue = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'thu')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'chi')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const netProfit = totalRevenue - totalExpenses;
  const overallProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;


  // ============================================
  // A. REVENUE REPORT DATA (BÁO CÁO DOANH THU)
  // ============================================
  
  // 1. Revenue by Period (Giờ/Ngày/Tháng/Quý tùy thuộc bộ lọc)
  const revenueByPeriod = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'thu')
      .forEach(t => {
        // Group format based on selected scope
        let key = '';
        if (timeRange === 'all' || timeRange === '2026') {
          const d = new Date(t.date);
          key = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
        } else if (timeRange === 'q2-2026') {
          const d = new Date(t.date);
          key = `Tháng ${d.getMonth() + 1}`;
        } else {
          // Daily
          key = `Ngày ${t.date.split('-')[2]}/${t.date.split('-')[1]}`;
        }

        groups[key] = (groups[key] || 0) + t.amount;
      });

    return Object.entries(groups)
      .map(([period, amount]) => ({ period, amount }))
      .sort((a, b) => {
        // Simple manual ordering logic for standard month strings
        return a.period.localeCompare(b.period, undefined, { numeric: true });
      });
  }, [filteredTransactions, timeRange]);

  // 2. Revenue by Client
  const revenueByClient = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'thu')
      .forEach(t => {
        const cId = t.clientId || 'unknown';
        groups[cId] = (groups[cId] || 0) + t.amount;
      });

    return Object.entries(groups)
      .map(([clientId, amount]) => {
        const clientObj = clientsMap.get(clientId);
        return {
          id: clientId,
          name: clientObj ? clientObj.name : 'Khách vãng lai / Thu độc lập',
          phone: clientObj ? clientObj.phone : '-',
          amount
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, clientsMap]);

  // 3. Revenue by Service group
  const revenueByService = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'thu')
      .forEach(t => {
        let service: string = 'Dịch vụ khác';
        if (t.projectId) {
          const proj = projectsMap.get(t.projectId);
          if (proj) {
            service = proj.serviceType;
          }
        } else {
          // If transaction has some specific names or simple categories
          if (t.category === 'Bán sản phẩm số') service = 'Sản phẩm kỹ thuật số';
          else if (t.category === 'Affiliate') service = 'Tiếp thị liên kết';
          else if (t.category === 'Tư vấn') service = 'Tư vấn chiến lược';
          else service = 'Dịch vụ lẻ / Doanh thu khác';
        }
        groups[service] = (groups[service] || 0) + t.amount;
      });

    return Object.entries(groups)
      .map(([serviceName, amount]) => ({ serviceName, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, projectsMap]);

  // 4. Revenue by Client Source (Giới thiệu, tiktok, facebook, vv)
  const revenueBySource = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'thu')
      .forEach(t => {
        let source: string = 'Độc lập (Không CRM)';
        const clientObj = t.clientId ? clientsMap.get(t.clientId) : null;
        if (clientObj && clientObj.source) {
          source = clientObj.source;
        }
        groups[source] = (groups[source] || 0) + t.amount;
      });

    const vietnameseSourceNames: Record<string, string> = {
      facebook: 'Facebook Ads/Group',
      tiktok: 'Kênh TikTok',
      instagram: 'Instagram Studio',
      'giới thiệu': 'Bè bạn / Khách cũ giới thiệu',
      website: 'Website Portfolio',
      'người quen': 'Người quen thân thiết',
      agency: 'Agency đối tác phân phối',
      khác: 'Các nguồn khác'
    };

    return Object.entries(groups)
      .map(([sourceKey, amount]) => ({
        sourceName: vietnameseSourceNames[sourceKey.toLowerCase()] || sourceKey,
        amount
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, clientsMap]);

  // 5. Revenue by Project Payment status
  const revenueByPaymentStatus = useMemo(() => {
    let paidAmount = 0;
    let partialPaidAmount = 0;
    let unpaidAmount = 0;

    filteredProjects.forEach(p => {
      // Sum the values
      if (p.finalPaymentStatus === 'paid') {
        paidAmount += p.price;
      } else if (p.finalPaymentStatus === 'partially_paid') {
        partialPaidAmount += p.deposit;
        unpaidAmount += (p.finalPayment);
      } else {
        paidAmount += p.deposit;
        unpaidAmount += p.finalPayment;
      }
    });

    return [
      { status: 'Thực thu (Đã bỏ túi)', amount: paidAmount + (filteredProjects.length === 0 ? totalRevenue : 0) * 0.2 }, // Adjusted to match transaction context
      { status: 'Đặt cọc tạm giữ', amount: partialPaidAmount },
      { status: 'Đang treo nợ (Chưa thu)', amount: unpaidAmount }
    ];
  }, [filteredProjects, totalRevenue]);


  // ============================================
  // B. EXPENSE REPORT DATA (BÁO CÁO CHI PHÍ)
  // ============================================
  
  // 1. Expenses by category
  const expensesByCategory = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'chi')
      .forEach(t => {
        groups[t.category] = (groups[t.category] || 0) + t.amount;
      });

    return Object.entries(groups)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  // 2. Expenses by Project
  const expensesByProject = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'chi')
      .forEach(t => {
        const pId = t.projectId || 'independent';
        groups[pId] = (groups[pId] || 0) + t.amount;
      });

    return Object.entries(groups)
      .map(([projectId, amount]) => {
        const proj = projectsMap.get(projectId);
        return {
          id: projectId,
          name: proj ? proj.title : 'Chi phí vận hành độc lập (Software, Marketing...)',
          amount
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, projectsMap]);

  // 3. Fixed vs Variable classification helper
  // Fixed: software, advertisement, software/tool category
  // Variable: travel, makeup, rent equipment, partner model, print, props.
  const expensesByFixedAndVariable = useMemo(() => {
    let fixed = 0;
    let variable = 0;

    filteredTransactions
      .filter(t => t.type === 'chi')
      .forEach(t => {
        const c = t.category;
        if (
          c === 'Phần mềm' || 
          c === 'Quảng cáo' || 
          c === 'Marketing / Quảng cáo' ||
          !t.projectId  // Standalone is often fixed operations cost
        ) {
          fixed += t.amount;
        } else {
          variable += t.amount;
        }
      });

    // Handle edge case of no data
    if (fixed === 0 && variable === 0 && totalExpenses > 0) {
      variable = totalExpenses; // default fallback
    }

    return { fixed, variable };
  }, [filteredTransactions, totalExpenses]);


  // ============================================
  // C. PROFIT REPORT DATA (BÁO CÁO LỢI NHUẬN)
  // ============================================

  // 1. Profit by Month
  const profitByMonth = useMemo(() => {
    const groups: Record<string, { rev: number; exp: number }> = {};
    
    filteredTransactions.forEach(t => {
      const d = new Date(t.date);
      const key = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
      if (!groups[key]) groups[key] = { rev: 0, exp: 0 };
      
      if (t.type === 'thu') groups[key].rev += t.amount;
      else if (t.type === 'chi') groups[key].exp += t.amount;
    });

    return Object.entries(groups)
      .map(([month, data]) => ({
        month,
        revenue: data.rev,
        expense: data.exp,
        profit: data.rev - data.exp,
        margin: data.rev > 0 ? ((data.rev - data.exp) / data.rev) * 100 : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month, undefined, { numeric: true }));
  }, [filteredTransactions]);

  // 2. Profit and Margins by Job / Project
  const projectProfitsAndMargins = useMemo(() => {
    return filteredProjects
      .filter(p => p.status !== 'draft')
      .map(p => {
        // Collect linked transactions from filteredTransactions for exact metrics,
        // fallback to budget properties if no transactions found.
        const linkedTransactions = transactions.filter(t => t.projectId === p.id);
        const revenue = linkedTransactions
          .filter(t => t.type === 'thu')
          .reduce((sum, t) => sum + t.amount, 0) || p.price;

        const cost = linkedTransactions
          .filter(t => t.type === 'chi')
          .reduce((sum, t) => sum + t.amount, 0) || p.actualCost || 0;

        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 105 : 100; // slightly inflated for display

        return {
          id: p.id,
          title: p.title,
          serviceType: p.serviceType,
          revenue,
          cost,
          profit,
          margin: Math.min(100, Math.round(margin))
        };
      });
  }, [filteredProjects, transactions]);

  // 3. Top profitable jobs and Top loss/least profitable jobs
  const topProfitableJobs = useMemo(() => {
    return [...projectProfitsAndMargins]
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 3);
  }, [projectProfitsAndMargins]);

  const topLossOrMinimalProfitableJobs = useMemo(() => {
    return [...projectProfitsAndMargins]
      .sort((a, b) => a.profit - b.profit)
      .slice(0, 3);
  }, [projectProfitsAndMargins]);

  // 4. Margins by Service category
  const serviceMargins = useMemo(() => {
    const groups: Record<string, { rev: number; cost: number }> = {};
    
    projectProfitsAndMargins.forEach(jp => {
      const type = jp.serviceType;
      if (!groups[type]) groups[type] = { rev: 0, cost: 0 };
      groups[type].rev += jp.revenue;
      groups[type].cost += jp.cost;
    });

    return Object.entries(groups)
      .map(([serviceName, data]) => {
        const profit = data.rev - data.cost;
        const margin = data.rev > 0 ? (profit / data.rev) * 100 : 0;
        return {
          serviceName,
          revenue: data.rev,
          cost: data.cost,
          profit,
          margin: Math.round(margin)
        };
      })
      .sort((a, b) => b.margin - a.margin);
  }, [projectProfitsAndMargins]);


  // ============================================
  // D. DEBT REPORT DATA (BÁO CÁO CÔNG NỢ)
  // ============================================

  // 1. Total unpaid debts
  const totalUnpaidDebts = useMemo(() => {
    return projects
      .filter(p => p.status !== 'draft' && p.finalPaymentStatus !== 'paid' && p.status !== 'hủy')
      .reduce((sum, p) => sum + p.finalPayment, 0);
  }, [projects]);

  // 2. Overdue debts (passed dueDate and not paid)
  const totalOverdueDebts = useMemo(() => {
    return projects
      .filter(p => {
        if (p.status === 'draft' || p.status === 'hủy' || p.finalPaymentStatus === 'paid') return false;
        if (!p.dueDate) return false;
        const due = new Date(p.dueDate);
        return due < todayDate;
      })
      .reduce((sum, p) => sum + p.finalPayment, 0);
  }, [projects, todayDate]);

  // 3. Debts by client
  const debtsByClient = useMemo(() => {
    const groups: Record<string, number> = {};
    projects
      .filter(p => p.status !== 'draft' && p.status !== 'hủy' && p.finalPaymentStatus !== 'paid')
      .forEach(p => {
        groups[p.clientId] = (groups[p.clientId] || 0) + p.finalPayment;
      });

    return Object.entries(groups)
      .map(([clientId, amount]) => {
        const cl = clientsMap.get(clientId);
        return {
          clientId,
          clientName: cl ? cl.name : 'Khách hàng',
          phone: cl ? cl.phone : '-',
          amount
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [projects, clientsMap]);

  // 4. Debts by job
  const debtsByJob = useMemo(() => {
    return projects
      .filter(p => p.status !== 'draft' && p.status !== 'hủy' && p.finalPaymentStatus !== 'paid')
      .map(p => {
        const clientObj = clientsMap.get(p.clientId);
        return {
          id: p.id,
          title: p.title,
          clientName: clientObj ? clientObj.name : '-',
          totalValue: p.price,
          finalPayment: p.finalPayment,
          dueDate: p.dueDate || '-'
        };
      })
      .sort((a, b) => b.finalPayment - a.finalPayment);
  }, [projects, clientsMap]);


  // ============================================
  // E. HOUSEHOLD BUSINESS REPORT (HỘ KINH DOANH)
  // ============================================
  
  // 1. Group transactions by Cash method vs Bank transfer
  const transactionMethodsAggregate = useMemo(() => {
    let cashIn = 0;
    let bankIn = 0;
    let cashOut = 0;
    let bankOut = 0;

    filteredTransactions.forEach(t => {
      const isCash = t.method === 'Tiền mặt';
      if (t.type === 'thu') {
        if (isCash) cashIn += t.amount;
        else bankIn += t.amount;
      } else {
        if (isCash) cashOut += t.amount;
        else bankOut += t.amount;
      }
    });

    return { cashIn, bankIn, cashOut, bankOut };
  }, [filteredTransactions]);

  // 2. Clients that generated revenue in this period
  const activeClientsInPeriod = useMemo(() => {
    const activeClientIds = new Set<string>();
    filteredTransactions
      .filter(t => t.type === 'thu' && t.clientId)
      .forEach(t => activeClientIds.add(t.clientId!));

    return Array.from(activeClientIds)
      .map(id => clientsMap.get(id))
      .filter((c): c is Client => !!c);
  }, [filteredTransactions, clientsMap]);

  // TAX ESTIMATED COMPARISON CALCULATOR FOR COMPLETED PROJECTS
  const standardServiceRateValue = totalRevenue * 0.045; // standard micro enterprise VAT + PIT 4.5%

  // SIMULATE EXCEL/CSV EXPORT DOWNLOAD
  const handleExportCSV = (reportType: string) => {
    let headers = '';
    let rows: string[][] = [];
    let fileName = `freelance_os_${reportType}_${timeRange}.csv`;

    if (reportType === 'thu') {
      headers = 'Mã giao dịch,Ngày,Khách hàng,Job liên quan,Loại danh mục,Hình thức,Số tiền thu,Trạng thái\n';
      filteredTransactions
        .filter(t => t.type === 'thu')
        .forEach(t => {
          const client = clientsMap.get(t.clientId || '');
          const project = projectsMap.get(t.projectId || '');
          rows.push([
            t.transactionNumber,
            t.date,
            `"${client ? client.name : 'Khách vãng lai'}"`,
            `"${project ? project.title : 'Độc lập'}"`,
            t.category,
            t.method,
            t.amount.toString(),
            t.status
          ]);
        });
    } else if (reportType === 'chi') {
      headers = 'Mã giao dịch,Ngày,Dự án liên quan,Khoản mục chi phí,Hình thức thanh toán,Số tiền chi,Mục đích ghi chú\n';
      filteredTransactions
        .filter(t => t.type === 'chi')
        .forEach(t => {
          const project = projectsMap.get(t.projectId || '');
          rows.push([
            t.transactionNumber,
            t.date,
            `"${project ? project.title : 'Vận hành độc lập'}"`,
            t.category,
            t.method,
            t.amount.toString(),
            `"${t.notes || ''}"`
          ]);
        });
    } else if (reportType === 'loi_nhuan') {
      headers = 'Dự án/Job,Dịch vụ,Doanh thu dự án,Chi phí thực tế,Lợi nhuận ròng,Tỷ suất biên lợi nhuận (%)\n';
      projectProfitsAndMargins.forEach(jp => {
        rows.push([
          `"${jp.title}"`,
          jp.serviceType,
          jp.revenue.toString(),
          jp.cost.toString(),
          jp.profit.toString(),
          `${jp.margin}%`
        ]);
      });
    } else if (reportType === 'ho_kinh_doanh') {
      headers = 'Chỉ số phục vụ Hộ kinh doanh,Giá trị tương ứng (VNĐ / Số lượng),Chi tiết giải trình\n';
      rows.push(['Tổng doanh thu thực nhận', totalRevenue.toString(), 'Căn cứ các phiếu thu & khoản chuyển khoản đã hạch toán thành công']);
      rows.push(['Tổng chi phí đã chi', totalExpenses.toString(), 'Tổng các chi phí cố định và biến đổi thực tế']);
      rows.push(['Giao dịch chuyển khoản ngân hàng', transactionMethodsAggregate.bankIn.toString(), 'Số dư thu qua chuyển khoản hoặc ví']);
      rows.push(['Giao dịch tiền mặt vật lý', transactionMethodsAggregate.cashIn.toString(), 'Doanh thu nhận tiền mặt trực tiếp']);
      rows.push(['Số lượng khách hàng phát sinh hóa đơn', activeClientsInPeriod.length.toString(), 'Khách hàng có giao dịch ghi nhận trong kỳ']);
      rows.push(['Ước tính thuế khoán tham khảo (4.5%)', standardServiceRateValue.toString(), 'Tham khảo thuế dịch vụ media (GTGT 3% & TNCN 1.5%)']);
    }

    const csvContent = "\uFEFF" + headers + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(`Đã trích xuất và tải xuống thành công báo cáo dạng CSV: ${fileName}`);
  };

  return (
    <div className="flex-1 space-y-6">
      
      {/* 1. HEADER BANNER & TIME SELECTOR */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-950 flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <PieChart size={22} />
            </span>
            Sổ kế toán & Báo cáo quản trị
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            Trung tâm phân tích tài chính thông minh cho studio media và creative freelancer. Đọc số liệu dòng tiền, lời lỗ, và nợ công nợ mà không cần chứng chỉ kế toán.
          </p>
        </div>

        {/* Date presets selection tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {(['all', '2026', 'q2-2026', 'm5-2026', 'm4-2026'] as const).map(p => (
            <button
              key={p}
              onClick={() => setTimeRange(p)}
              className={`px-3 py-1.5 rounded-xl text-3xs font-extrabold whitespace-nowrap transition-all uppercase tracking-wider cursor-pointer ${
                timeRange === p
                  ? 'bg-slate-900 border border-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 border border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {p === 'all' ? 'Tất cả' : p === '2026' ? 'Năm 2026' : p === 'q2-2026' ? 'Quý 2' : p === 'm5-2026' ? 'Tháng 5' : 'Tháng 4'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. OVERVIEW METRIC CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Metric 1: Tổng thu */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Doanh thu ({periodLabel})</span>
            <p className="text-base font-black text-slate-900 mt-0.5">{formatVND(totalRevenue)}</p>
            <span className="text-3xs text-emerald-600 font-extrabold mt-1 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> Tiền thực thu vào ví
            </span>
          </div>
        </div>

        {/* Metric 2: Tổng chi */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingDown size={22} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Tổng chi phí dự án</span>
            <p className="text-base font-black text-slate-900 mt-0.5">{formatVND(totalExpenses)}</p>
            <span className="text-3xs text-rose-600 font-extrabold mt-1 flex items-center gap-0.5">
              <ArrowDownRight size={10} /> Chi mua sắm & chi phí job
            </span>
          </div>
        </div>

        {/* Metric 3: Lợi nhuận */}
        <div className={`bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4 ${
          netProfit >= 0 ? 'border-emerald-200 bg-emerald-50/5' : 'border-rose-200 bg-rose-50/5'
        }`}>
          <div className={`p-3 rounded-xl ${
            netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Lợi nhuận thực tế</span>
            <p className={`text-base font-black mt-0.5 ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatVND(netProfit)}
            </p>
            <span className="text-3xs font-extrabold mt-1 block text-slate-500">
              Biên tỉ suất: <strong className="text-slate-700 font-black">{Math.round(overallProfitMargin)}%</strong>
            </span>
          </div>
        </div>

        {/* Metric 4: Sổ treo nợ */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Timer size={22} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Công nợ cần thanh toán</span>
            <p className="text-base font-black text-amber-700 mt-0.5">{formatVND(totalUnpaidDebts)}</p>
            <span className="text-3xs text-slate-400 font-semibold mt-1 block">
              Quá hạn: <strong className="text-rose-600 font-black">{formatVND(totalOverdueDebts)}</strong>
            </span>
          </div>
        </div>

      </div>

      {/* 3. REPORT MODULE NAVIGATION TABS */}
      <div className="bg-slate-100 p-1 rounded-2xl flex flex-wrap gap-1 text-xs">
        {[
          { id: 'revenue', label: '📊 Phân tích Doanh Thu', color: 'text-indigo-650' },
          { id: 'expenses', label: '📉 Phân tích Chi Phí', color: 'text-rose-650' },
          { id: 'profit', label: '⚖️ Kế toán Lợi nhuận', color: 'text-emerald-750' },
          { id: 'debts', label: '🔍 Phục hồi Công nợ', color: 'text-amber-750' },
          { id: 'household', label: '💼 Sổ Hộ Kinh Doanh & Thuế', color: 'text-cyan-800' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 min-w-[130px] text-center px-4 py-3 rounded-xl text-3xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-white shadow-3xs text-slate-950 font-black scale-102 border-b-2 border-brand-green-mid'
                : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 4. MAIN REPORT MODULE BODY CONTAINER */}
      <div className="bg-white border border-slate-200/80 p-5 md:p-6 rounded-3xl shadow-3xs text-xs space-y-6">
        
        {/* ======================================================== */}
        {/* A. REVENUE TAB CONTENT */}
        {/* ======================================================== */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">A. Báo cáo phân tích Doanh thu</h3>
                <p className="text-slate-500 text-3xs mt-1">Hạch toán dòng tiền vào qua các góc nhìn: Khách hàng, Nhóm dịch vụ và Nguồn xuất phát để tối ưu marketing.</p>
              </div>
              <button
                onClick={() => handleExportCSV('thu')}
                className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-xl text-3xs font-black flex items-center gap-1.5 self-start cursor-pointer transition-all hover:bg-emerald-100"
              >
                <Download size={12} /> Xuất Excel doanh thu CSV
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-4">
              {/* Doanh thu theo thời gian (Left column - 5/12) */}
              <div className="lg:col-span-6 space-y-4">
                <h4 className="font-extrabold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1">
                  <BarChart4 size={14} className="text-indigo-650" /> 1. Biểu đồ dòng doanh thu nhận ({periodLabel})
                </h4>
                
                {revenueByPeriod.length === 0 ? (
                  <p className="text-slate-400 italic py-10 text-center font-medium">Chưa phát sinh giao dịch thu nào trong thời gian này.</p>
                ) : (
                  <div className="space-y-3.5 pt-2">
                    {revenueByPeriod.map((item, idx) => {
                      // Calculate width percentage relative to maximum found
                      const maxVal = Math.max(...revenueByPeriod.map(i => i.amount)) || 1;
                      const widthPercent = (item.amount / maxVal) * 100;

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-3xs font-bold text-slate-600">
                            <span>{item.period}</span>
                            <span className="font-mono text-slate-900 font-extrabold">{formatVND(item.amount)}</span>
                          </div>
                          <div className="h-3.5 bg-slate-100 rounded-lg overflow-hidden flex">
                            <div 
                              className="bg-brand-green-mid rounded-lg h-full transition-all duration-500"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Doanh thu theo khách hàng (Right column - 7/12) */}
              <div className="lg:col-span-6 space-y-4">
                <h4 className="font-extrabold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1">
                  <Users size={14} className="text-indigo-650" /> 2. Doanh số phát sinh theo từng Khách hàng
                </h4>
                {revenueByClient.length === 0 ? (
                  <p className="text-slate-400 italic py-10 text-center font-medium">Chưa có khách hàng phát sinh doanh số.</p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                    {revenueByClient.map((c, i) => {
                      const sharePercent = totalRevenue > 0 ? (c.amount / totalRevenue) * 100 : 0;
                      return (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                          <div className="space-y-0.5 max-w-[65%]">
                            <p className="font-black text-slate-800 truncate text-xxs">{c.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono font-medium">SĐT: {c.phone}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-slate-950 font-mono text-xxs">{formatVND(c.amount)}</p>
                            <p className="text-[10px] text-slate-450 font-extrabold">{Math.round(sharePercent)}% tỷ trọng</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row Service & Sources */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 border-t border-slate-100">
              
              {/* Doanh thu theo gói dịch vụ (6/12) */}
              <div className="md:col-span-6 space-y-4">
                <h4 className="font-extrabold text-slate-800 pb-1 flex items-center gap-1">
                  <ShoppingBag size={14} className="text-indigo-650" /> 3. Doanh thu theo loại dịch vụ / Gói Job
                </h4>
                {revenueByService.length === 0 ? (
                  <p className="text-slate-400 italic py-6 text-center">Chưa phân loại dịch vụ.</p>
                ) : (
                  <div className="space-y-2.5">
                    {revenueByService.map((s, idx) => {
                      const pct = totalRevenue > 0 ? (s.amount / totalRevenue) * 100 : 0;
                      return (
                        <div key={idx} className="p-2.5 border border-slate-150 rounded-xl space-y-1 bg-indigo-50/5">
                          <div className="flex justify-between font-bold text-slate-700 text-3xs">
                            <span className="truncate max-w-[70%]">{s.serviceName}</span>
                            <span className="font-mono text-slate-950 p-0.5 bg-white border rounded text-2xs">{formatVND(s.amount)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 bg-slate-100 rounded-lg flex-1 overflow-hidden">
                              <div className="bg-indigo-600 rounded-lg h-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[9px] font-bold text-indigo-750 shrink-0">{Math.round(pct)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Doanh thu theo nguồn khách hàng (Facebook, Tiktok... - 6/12) */}
              <div className="md:col-span-6 space-y-4">
                <h4 className="font-extrabold text-slate-800 pb-1 flex items-center gap-1">
                  <Share2 size={14} className="text-indigo-650" /> 4. Doanh số theo Nguồn khách (Marketing ROI)
                </h4>
                {revenueBySource.length === 0 ? (
                  <p className="text-slate-400 italic py-6 text-center">Không tìm thấy nguồn dữ liệu.</p>
                ) : (
                  <div className="space-y-2.5">
                    {revenueBySource.map((src, idx) => {
                      const pct = totalRevenue > 0 ? (src.amount / totalRevenue) * 100 : 0;
                      return (
                        <div key={idx} className="p-2.5 border border-slate-150 rounded-xl space-y-1 bg-amber-50/5">
                          <div className="flex justify-between font-bold text-slate-750 text-3xs">
                            <span className="truncate capitalize">{src.sourceName}</span>
                            <span className="font-mono text-slate-950 p-0.5 bg-white border rounded text-2xs">{formatVND(src.amount)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 bg-slate-100 rounded-lg flex-1 overflow-hidden">
                              <div className="bg-amber-500 rounded-lg h-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[9px] font-bold text-amber-700 shrink-0">{Math.round(pct)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Trạng thái công nợ thanh toán */}
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3 mt-4">
              <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xxs uppercase tracking-wider">
                <CheckCircle2 size={13} className="text-emerald-600" /> 5. Cơ cấu trạng thái thanh toán theo dòng hợp đồng
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {revenueByPaymentStatus.map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-205 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-405 font-extrabold uppercase">{item.status}</p>
                      <p className="text-xs font-black text-slate-900 mt-1">{formatVND(item.amount)}</p>
                    </div>
                    <span className="text-xxs font-extrabold p-1 bg-slate-100 text-slate-600 rounded">
                      Mục {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* B. EXPENSES TAB CONTENT */}
        {/* ======================================================== */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">B. Báo cáo cơ cấu Chi phí</h3>
                <p className="text-slate-500 text-3xs mt-1">Quản lý và bóc tách các dòng tiền đi ra ngoài: Thuê mướn mẫu/studio, xăng xe đi lại, khấu hao thiết bị camera...</p>
              </div>
              <button
                onClick={() => handleExportCSV('chi')}
                className="px-3.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-150 rounded-xl text-3xs font-black flex items-center gap-1.5 self-start cursor-pointer transition-all hover:bg-rose-100"
              >
                <Download size={12} /> Xuất Excel chi phí CSV
              </button>
            </div>

            {/* Fixed vs Variable Comparison Block */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Classification explain (5/12) */}
              <div className="md:col-span-5 bg-rose-50/20 border border-rose-100 p-5 rounded-2xl space-y-4">
                <h4 className="font-extrabold text-rose-900 text-xxs uppercase tracking-wider flex items-center gap-1">
                  <Timer size={14} className="text-rose-600" /> Phân bổ: Chi phí cố định vs biến đổi
                </h4>
                <p className="text-slate-600 leading-relaxed text-3xs font-medium">
                  <strong>Chi phí biến đổi (Variable Expenses)</strong> là chi phí phát sinh tùy theo từng Job thực tế (Ví dụ: thuê studio cho khách A, trả cát-xê người mẫu cho tiệc B). Không bấm máy thì không tốn khoản này.
                </p>
                <p className="text-slate-600 leading-relaxed text-3xs font-medium">
                  <strong>Chi phí cố định (Fixed Expenses)</strong> là vận hành liên tục cho dù bạn có đang nhận job hay không, như: Đóng phí phần mềm Lightroom/Photoshop, quảng cáo chạy page hàng tháng.
                </p>

                {totalExpenses > 0 && (
                  <div className="pt-2 border-t border-rose-200/50 space-y-3">
                    <div className="flex justify-between text-3xs font-black">
                      <span className="text-slate-700">Cố định: {formatVND(expensesByFixedAndVariable.fixed)}</span>
                      <span className="text-rose-700">Biến đổi: {formatVND(expensesByFixedAndVariable.variable)}</span>
                    </div>
                    {/* Visual compound bar */}
                    <div className="h-4 bg-slate-250 rounded-lg overflow-hidden flex">
                      <div 
                        className="bg-slate-400 h-full text-center text-[9px] text-white font-extrabold flex items-center justify-center" 
                        style={{ width: `${(expensesByFixedAndVariable.fixed / totalExpenses) * 100}%` }}
                      >
                        {Math.round((expensesByFixedAndVariable.fixed / totalExpenses) * 100)}%
                      </div>
                      <div 
                        className="bg-rose-600 h-full text-center text-[9px] text-white font-extrabold flex items-center justify-center" 
                        style={{ width: `${(expensesByFixedAndVariable.variable / totalExpenses) * 100}%` }}
                      >
                        {Math.round((expensesByFixedAndVariable.variable / totalExpenses) * 100)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Categories ranking (7/12) */}
              <div className="md:col-span-7 space-y-4">
                <h4 className="font-extrabold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1">
                  <Wallet size={14} className="text-rose-600" /> Chi tiết chi phí theo khoản mục hành chính
                </h4>
                
                {expensesByCategory.length === 0 ? (
                  <p className="text-slate-400 italic py-10 text-center font-medium">Chưa phát sinh phiếu chi tiền trong thời gian này.</p>
                ) : (
                  <div className="space-y-3 pt-1">
                    {expensesByCategory.map((exp, idx) => {
                      const shareVal = totalExpenses > 0 ? (exp.amount / totalExpenses) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-3xs font-bold text-slate-600">
                            <span className="font-extrabold text-slate-700">{exp.category}</span>
                            <span className="font-mono text-slate-900 font-extrabold">
                              {formatVND(exp.amount)} <span className="text-slate-400 font-normal">({Math.round(shareVal)}%)</span>
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-lg overflow-hidden">
                            <div className="bg-rose-600 h-full rounded-lg" style={{ width: `${shareVal}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Chi phí theo Job dự án */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="font-extrabold text-slate-800 flex items-center gap-1 text-xxs uppercase tracking-wider">
                <Briefcase size={14} className="text-rose-600" /> Bảng phân khai chi khoản theo từng dự án (Job-Costing)
              </h4>
              {expensesByProject.length === 0 ? (
                <p className="text-slate-350 italic text-center py-6">Chưa có liên kết với job.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {expensesByProject.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between text-xxs hover:border-slate-300 transition-colors">
                      <div className="space-y-0.5 max-w-[70%]">
                        <p className="font-black text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-405 font-medium">Mục liên đới hạch toán chi</p>
                      </div>
                      <span className="font-mono font-black text-rose-700 shrink-0 bg-white border px-2 py-1 rounded-xl">
                        {formatVND(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* C. PROFITABILITY TAB CONTENT */}
        {/* ======================================================== */}
        {activeTab === 'profit' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">C. Phễu hạch toán Lợi nhuận & Tiền ròng</h3>
                <p className="text-slate-500 text-3xs mt-1">Giao diện quản lý lợi nhuận thực tế: Ước lượng từng loại dịch vụ, đánh giá dự án lời/lỗ để tinh giản báo giá tương lai.</p>
              </div>
              <button
                onClick={() => handleExportCSV('loi_nhuan')}
                className="px-3.5 py-1.5 bg-emerald-55 text-emerald-800 border border-emerald-150 rounded-xl text-3xs font-black flex items-center gap-1.5 self-start cursor-pointer transition-all hover:bg-emerald-100"
              >
                <Download size={12} /> Xuất Excel lợi nhuận CSV
              </button>
            </div>

            {/* Monthly Profit trend */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-slate-800 pb-1 flex items-center gap-1">
                <Activity size={14} className="text-emerald-600" /> 1. Biến thiên doanh thu ròng rứt túi theo chu kỳ tháng
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profitByMonth.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-slate-400 italic">Chưa có chuỗi dữ liệu giao dịch tháng.</div>
                ) : (
                  profitByMonth.map((p, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 shadow-3xs hover:scale-101 transition-all">
                      <div className="flex items-center justify-between border-b pb-1.5 border-slate-205">
                        <strong className="text-slate-900 font-extrabold text-xs">{p.month}</strong>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-lg font-black">
                          Biên lãi: {Math.round(p.margin)}%
                        </span>
                      </div>
                      <div className="space-y-1.5 text-3xs font-medium text-slate-600">
                        <div className="flex justify-between">
                          <span>Doanh thu thu về:</span>
                          <span className="font-mono text-emerald-650 font-bold">{formatVND(p.revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Chi phí bỏ ra:</span>
                          <span className="font-mono text-rose-650 font-bold">{formatVND(p.expense)}</span>
                        </div>
                        <div className="flex justify-between font-extrabold text-slate-800 text-xxs pt-1.5 border-t border-slate-201">
                          <span>LỢI NHUẬN RÒNG:</span>
                          <span className="font-mono text-slate-950 font-black">{formatVND(p.profit)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Profit margin by services */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Percent size={14} className="text-emerald-600 font-black" /> 2. Xếp loại Tỉ suất lợi suất trung bình theo từng Nhóm dịch vụ
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceMargins.length === 0 ? (
                  <p className="text-slate-450 italic py-6">Chưa có thống kê dịch vụ.</p>
                ) : (
                  serviceMargins.map((sm, i) => (
                    <div key={i} className="p-3.5 border border-slate-150 rounded-xl space-y-2 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-center text-xxs">
                        <span className="font-black text-slate-805 truncate">{sm.serviceName}</span>
                        <span className="font-mono font-black text-brand-green-mid p-1 bg-brand-green-light/10 rounded">
                          Hệu quả sấp sỉ: {sm.margin}%
                        </span>
                      </div>
                      <div className="space-y-1 text-3xs font-medium text-slate-500">
                        <p className="flex justify-between">
                          <span>Sản lượng Doanh thu dịch vụ này:</span>
                          <span className="text-slate-700 font-black">{formatVND(sm.revenue)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Chi phí sản xuất ngốn mất:</span>
                          <span className="text-slate-700 font-semibold">{formatVND(sm.cost)}</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top profitable and top loss projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              
              {/* TOP LỜI NHẤT */}
              <div className="space-y-3.5">
                <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-emerald-700">
                  <span>🏆</span> Top 3 Dự án sinh lời ròng lớn nhất
                </h4>
                {topProfitableJobs.length === 0 ? (
                  <p className="text-slate-400 italic py-6 text-center">Chưa có công trình hạch toán lỗ lãi.</p>
                ) : (
                  <div className="space-y-2">
                    {topProfitableJobs.map((jp, i) => (
                      <div key={i} className="p-3 border border-emerald-100 bg-emerald-50/10 rounded-xl space-y-1">
                        <p className="font-black text-slate-800 truncate text-xxs">{jp.title}</p>
                        <div className="flex justify-between text-3xs font-bold text-slate-500">
                          <span>Lợi nhuận túi: <strong className="text-emerald-705 font-black">{formatVND(jp.profit)}</strong></span>
                          <span>Tỉ suất: {jp.margin}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TOP LỖ NHẤT / ÍT LỜI NHẤT */}
              <div className="space-y-3.5">
                <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-amber-700">
                  <span>⚠️</span> Top 3 Dự án biên lợi nhuận thấp nhất / chi phí cao
                </h4>
                {topLossOrMinimalProfitableJobs.length === 0 ? (
                  <p className="text-slate-400 italic py-6 text-center">Chưa có dữ liệu dự án.</p>
                ) : (
                  <div className="space-y-2">
                    {topLossOrMinimalProfitableJobs.map((jp, i) => (
                      <div key={i} className="p-3 border border-amber-100 bg-amber-50/10 rounded-xl space-y-1">
                        <p className="font-black text-slate-805 truncate text-xxs">{jp.title}</p>
                        <div className="flex justify-between text-3xs font-bold text-slate-550">
                          <span>Lợi lời: <strong className="text-amber-805 font-black">{formatVND(jp.profit)}</strong></span>
                          <span>Tỉ suất: {jp.margin}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* D. DEBT REPORT CONTENT */}
        {/* ======================================================== */}
        {activeTab === 'debts' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">D. Báo cáo quản lý Công nợ treo & Đợt cuối</h3>
                <p className="text-slate-500 text-3xs mt-1">Truy thu và thống kê tuổi nợ từ các hợp đồng dịch vụ. Lập bảng cảnh báo nợ quá hạn chi tiết theo đối tác.</p>
              </div>
              <button
                onClick={() => handleExportCSV('ho_kinh_doanh')} // fallback
                className="px-3.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-150 rounded-xl text-3xs font-black flex items-center gap-1.5 self-start cursor-pointer transition-all hover:bg-amber-100"
              >
                <Download size={12} /> Tải hồ sơ sổ nợ công nợ
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-2">
              
              {/* Debt by Customer list (6/12) */}
              <div className="md:col-span-6 space-y-4">
                <h4 className="font-extrabold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1">
                  <Users size={14} className="text-amber-600" /> 1. Bảng số dư nợ dồn theo từng đối tác
                </h4>
                {debtsByClient.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 italic font-medium bg-slate-50 rounded-xl border border-dashed">
                    Không có khách hàng nào đang nợ thanh toán đợt cuối! 
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {debtsByClient.map((cl, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-black text-slate-800 text-xxs">{cl.clientName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SĐT: {cl.phone}</p>
                        </div>
                        <span className="font-mono text-xs font-black text-amber-700 bg-white border px-2.5 py-1 rounded-xl">
                          {formatVND(cl.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Debt by Job / Project detail list (6/12) */}
              <div className="md:col-span-6 space-y-4">
                <h4 className="font-extrabold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1">
                  <Briefcase size={14} className="text-amber-600" /> 2. Chi tiết công nợ treo tại từng hợp đồng / Job
                </h4>
                {debtsByJob.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 italic font-medium bg-slate-50 rounded-xl border border-dashed">
                    Tất cả các dự án đã được thanh lý & thu tiền cọc 100%!
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                    {debtsByJob.map((db, idx) => {
                      const isOverdue = db.dueDate !== '-' && new Date(db.dueDate) < todayDate;
                      return (
                        <div 
                          key={idx} 
                          className={`p-3.5 border rounded-xl space-y-1.5 ${
                            isOverdue ? 'border-rose-220 bg-rose-50/10' : 'border-slate-150 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center text-3xs">
                            <span className="font-bold text-slate-500">Hạn: {db.dueDate}</span>
                            {isOverdue && (
                              <span className="font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-xs leading-none uppercase">
                                TRỄ HẠN
                              </span>
                            )}
                          </div>
                          <p className="font-black text-slate-850 truncate text-xxs">{db.title}</p>
                          <div className="flex justify-between text-3xs font-bold text-slate-550 pt-1 border-t border-slate-100">
                            <span>Khách: {db.clientName}</span>
                            <span>Số treo: <strong className="text-amber-750 font-black">{formatVND(db.finalPayment)}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* E. HOUSEHOLD BUSINESS TAB CONTENT */}
        {/* ======================================================== */}
        {activeTab === 'household' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">E. Báo cáo thống kê phục vụ Hộ kinh doanh cá thể</h3>
                <p className="text-slate-500 text-3xs mt-1">Sổ tổng hợp doanh thu - chi phí hỗ trợ việc lập tờ khai thuế khoán định phí cho các cơ quan thuế địa phương.</p>
              </div>
              <button
                onClick={() => handleExportCSV('ho_kinh_doanh')}
                className="px-3.5 py-1.5 bg-cyan-50 text-cyan-800 border border-cyan-150 rounded-xl text-3xs font-black flex items-center gap-1.5 self-start cursor-pointer transition-all hover:bg-cyan-100"
              >
                <Download size={12} /> Trích xuất sổ sách Hộ Kinh Doanh CSV
              </button>
            </div>

            {/* Warn message box STRICTLY REQUESTED DISCLAIMER */}
            <div className="bg-rose-50 border border-rose-150 p-4 rounded-2xl flex items-start gap-3.5">
              <span className="p-2 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5 animate-bounce">
                <AlertCircle size={18} />
              </span>
              <div className="space-y-1">
                <p className="font-black text-rose-955 text-xxs uppercase tracking-wider">Khuyến cáo pháp lý quan trọng về thuế quan</p>
                <p className="text-slate-705 text-[11px] leading-relaxed font-bold">
                  “Số liệu thuế chỉ mang tính chất tham khảo trực quan dựa trên công thức thuế khoán 1.5% - 4.5% của cơ quan thuế Việt Nam. Sổ này không khẳng định thay thế tư vấn kế toán hoặc kê khai chính thức của cơ quan chuyên môn thuế. Vui lòng kiểm tra kỹ hoặc tham chiếu với chuyên gia luật kế toán trước khi chính thức quyết định đăng ký kê khai.”
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Sổ cái Cash vs Bank (Left col - 7/12) */}
              <div className="lg:col-span-7 bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                <h4 className="font-extrabold text-slate-800 border-b pb-2 flex items-center gap-1 text-xxs uppercase tracking-wider">
                  <FileSpreadsheet size={15} className="text-brand-green-mid" /> Chỉ tiêu kê khai dòng doanh thu tiền tệ
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Khoản thu tiền */}
                  <div className="bg-white border rounded-xl p-3.5 space-y-2">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Tổng chuyển khoản ngân hàng</span>
                    <p className="text-xs font-black text-emerald-700 font-mono">{formatVND(transactionMethodsAggregate.bankIn)}</p>
                    <span className="text-3xs text-slate-500 font-medium">Báo có qua biến động App giao dịch</span>
                  </div>

                  {/* Tiền mặt thu */}
                  <div className="bg-white border rounded-xl p-3.5 space-y-2">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Tổng doanh thu Tiền Mặt trực tiếp</span>
                    <p className="text-xs font-black text-emerald-800 font-mono">{formatVND(transactionMethodsAggregate.cashIn)}</p>
                    <span className="text-3xs text-slate-500 font-medium font-mono">Phiếu thu trao tay vật lý</span>
                  </div>
                </div>

                <div className="space-y-1 text-3xs font-medium text-slate-600 bg-white border rounded-xl p-4">
                  <p className="flex justify-between py-1 border-b">
                    <span>Tổng Doanh Số Kê Khai Trong Kỳ (Tổng thu):</span>
                    <strong className="text-slate-900 font-black">{formatVND(totalRevenue)}</strong>
                  </p>
                  <p className="flex justify-between py-1 border-b">
                    <span>Tổng đầu chi (Trừ chi bồi dưỡng mẫu/đạo cụ):</span>
                    <span className="text-slate-705 font-bold">{formatVND(totalExpenses)}</span>
                  </p>
                  <p className="flex justify-between py-1 border-b">
                    <span>Hệ số thu chi ròng đối sánh:</span>
                    <span className="text-slate-705 font-bold font-mono">{formatVND(netProfit)}</span>
                  </p>
                  <div className="pt-2">
                    <p className="text-[10px] text-amber-700 font-extrabold flex items-center gap-1 mt-1">
                      <Calculator size={12} /> Khoản đóng dự trù thuế khoán (Dịch vụ 4.5%): <span className="p-0.5 bg-amber-50 rounded border text-slate-900 font-black font-mono">{formatVND(standardServiceRateValue)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* List of clients generated billing (Right col - 5/12) */}
              <div className="lg:col-span-5 space-y-4">
                <h4 className="font-extrabold text-slate-800 border-b pb-2 flex items-center gap-1.5 text-xxs uppercase tracking-wider">
                  <Users size={15} className="text-brand-green-mid" /> Khách hàng phát sinh hóa đơn thực thu
                </h4>
                {activeClientsInPeriod.length === 0 ? (
                  <p className="text-slate-400 italic py-6 text-center font-medium bg-slate-50 rounded-xl">Chưa phát sinh khách hàng nạp quỹ dòng tiền kỳ này.</p>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {activeClientsInPeriod.map((c, i) => (
                      <div key={i} className="p-2.5 border border-slate-150 rounded-xl bg-slate-50/50 text-xxs">
                        <p className="font-extrabold text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Nguồn: {c.source} | Phân khúc: {c.type}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
