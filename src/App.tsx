/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, Project, Transaction, Quotation, Contract, DebtStatus, DebtMetadata, Appointment } from './types';
import { INITIAL_CLIENTS, INITIAL_PROJECTS, INITIAL_TRANSACTIONS, INITIAL_QUOTATIONS, INITIAL_CONTRACTS, INITIAL_APPOINTMENTS } from './mockData';
import { formatVND } from './utils';
import DashboardView from './components/DashboardView';
import ProjectsView from './components/ProjectsView';
import ClientsView from './components/ClientsView';
import TransactionsView from './components/TransactionsView';
import TaxView from './components/TaxView';
import QuotesView from './components/QuotesView';
import ContractsView from './components/ContractsView';
import DebtsView from './components/DebtsView';
import AppointmentsView from './components/AppointmentsView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import AiAssistant from './components/AiAssistant';
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  Calculator, 
  Layers, 
  Plus, 
  RefreshCw, 
  FileCode,
  Compass,
  Laptop,
  CheckCircle2,
  Trash2,
  Lock,
  Menu,
  X,
  FileText,
  FileSignature,
  Scale,
  Calendar,
  PieChart,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Custom Confirmation & Alert Dialog States
  const [customConfirm, setCustomConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    isDanger: boolean;
    onConfirm: () => void;
  } | null>(null);

  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  } | null>(null);

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger = false,
    confirmText = 'Đồng ý',
    cancelText = 'Hủy bỏ'
  ) => {
    setCustomConfirm({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      isDanger,
      onConfirm: () => {
        onConfirm();
        setCustomConfirm(null);
      }
    });
  };

  const triggerAlert = (title: string, message: string) => {
    setCustomAlert({
      isOpen: true,
      title,
      message
    });
  };




  // State quản lý dự án được nhắm mục tiêu để sửa nhanh từ dashboard alert
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // State để tạo nhanh dự án hoặc báo giá từ tab Khách hàng
  const [quickAddConfig, setQuickAddConfig] = useState<{ clientId: string; status: any } | null>(null);

  // Responsive state cho mobile menu drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Khởi tạo trạng thái ứng dụng đồng bộ
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('freelance_os_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('freelance_os_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('freelance_os_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('freelance_os_quotations');
    return saved ? JSON.parse(saved) : INITIAL_QUOTATIONS;
  });

  const [contracts, setContracts] = useState<Contract[]>(() => {
    const saved = localStorage.getItem('freelance_os_contracts');
    return saved ? JSON.parse(saved) : INITIAL_CONTRACTS;
  });

  const [debtMetadatas, setDebtMetadatas] = useState<DebtMetadata[]>(() => {
    const saved = localStorage.getItem('freelance_os_debt_metadatas');
    return saved ? JSON.parse(saved) : [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('freelance_os_appointments');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  // 2. Tự động đồng bộ hóa localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem('freelance_os_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('freelance_os_appointments', JSON.stringify(appointments));
  }, [appointments]);

  // Make handleAddClient return the created client ID so interactive components like Quote Form can use it inline
  const handleAddClient = (newClientData: Omit<Client, 'id' | 'createdAt'>): string => {
    const clientId = `c-${Date.now()}`;
    const newClient: Client = {
      ...newClientData,
      id: clientId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setClients(prev => [newClient, ...prev]);
    return clientId;
  };

  useEffect(() => {
    localStorage.setItem('freelance_os_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('freelance_os_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('freelance_os_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('freelance_os_contracts', JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem('freelance_os_debt_metadatas', JSON.stringify(debtMetadatas));
  }, [debtMetadatas]);


  const handleUpdateDebtMetadata = (projectId: string, statusOverride?: DebtStatus, remindNotes?: string) => {
    setDebtMetadatas(prev => {
      const exists = prev.find(m => m.projectId === projectId);
      if (exists) {
        return prev.map(m => m.projectId === projectId ? {
          ...m,
          statusOverride: statusOverride !== undefined ? statusOverride : m.statusOverride,
          remindNotes: remindNotes !== undefined ? remindNotes : m.remindNotes
        } : m);
      } else {
        return [...prev, {
          projectId,
          statusOverride,
          remindNotes
        }];
      }
    });
  };

  const handleAddAppointment = (newAptData: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = {
      ...newAptData,
      id: `apt-${Date.now()}`
    };
    setAppointments(prev => [newApt, ...prev]);
  };

  const handleUpdateAppointment = (updatedApt: Appointment) => {
    setAppointments(prev => prev.map(apt => apt.id === updatedApt.id ? updatedApt : apt));
  };

  const handleDeleteAppointment = (id: string) => {

    const apt = appointments.find(a => a.id === id);
    const title = apt ? `"${apt.title}"` : 'lịch hẹn này';
    triggerConfirm(
      'Xác nhận xóa lịch hẹn',
      `Bạn có chắc chắn muốn xóa ${title}? Thao tác này sẽ xóa vĩnh viễn dữ liệu khỏi lịch trình.`,
      () => {
        setAppointments(prev => prev.filter(item => item.id !== id));
      },
      true
    );
  };

  // 3. CÁC HÀM XỬ LÝ KHÁCH HÀNG (CLIENT CRUD)

  const handleEditClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleDeleteClient = (id: string) => {

    const client = clients.find(c => c.id === id);
    const name = client ? `"${client.name}"` : 'khách hàng này';
    triggerConfirm(
      'Kiểm duyệt xóa khách hàng',
      `Bạn có thực sự muốn xóa khách hàng ${name}? Mọi thông tin liên hệ và ghi chú sẽ bị mất sạch.`,
      () => {
        setClients(prev => prev.filter(c => c.id !== id));
      },
      true
    );
  };

  // CÁC HÀM XỬ LÝ BÁO GIÁ (QUOTATION CRUD)
  const handleAddQuotation = (newQuoteData: Omit<Quotation, 'id'>) => {
    const newQuote: Quotation = {
      ...newQuoteData,
      id: `q-${Date.now()}`
    };
    setQuotations(prev => [newQuote, ...prev]);
  };

  const handleEditQuotation = (updatedQuote: Quotation) => {
    setQuotations(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
  };

  const handleDeleteQuotation = (id: string) => {

    const q = quotations.find(item => item.id === id);
    const label = q ? `"${q.quoteNumber}"` : 'báo giá này';
    triggerConfirm(
      'Kiểm duyệt xóa báo giá',
      `Xác nhận bạn muốn xóa báo giá ${label}?`,
      () => {
        setQuotations(prev => prev.filter(item => item.id !== id));
      },
      true
    );
  };

  // CÁC HÀM XỬ LÝ HỢP ĐỒNG (CONTRACT CRUD)
  const handleAddContract = (newContractData: Omit<Contract, 'id'>) => {
    const newContract: Contract = {
      ...newContractData,
      id: `hd-${Date.now()}`
    };
    setContracts(prev => [newContract, ...prev]);
  };

  const handleEditContract = (updatedContract: Contract) => {
    setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
  };

  const handleDeleteContract = (id: string) => {

    const c = contracts.find(item => item.id === id);
    const label = c ? `"${c.contractNumber || c.title}"` : 'hợp đồng này';
    triggerConfirm(
      'Kiểm duyệt xóa hợp đồng',
      `Bạn có chắc chắn muốn xóa hợp đồng ${label}? Các điều khoản số dư bổ sung sẽ biến mất.`,
      () => {
        setContracts(prev => prev.filter(item => item.id !== id));
      },
      true
    );
  };

  // 4. CÁC HÀM XỬ LÝ DỰ ÁN (PROJECT CRUD)
  const handleAddProject = (newProjectData: Omit<Project, 'id'>) => {
    const projectId = `p-${Date.now()}`;
    const newProject: Project = {
      ...newProjectData,
      id: projectId
    };
    setProjects(prev => [newProject, ...prev]);

    // Tự động hạch toán tiền cọc vào Sổ quỹ nếu cọc lớn hơn 0
    if (newProjectData.deposit > 0) {
      const autoDepositTrans: Transaction = {
        id: `t-auto-${Date.now()}`,
        transactionNumber: `TX-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
        projectId: projectId,
        clientId: newProjectData.clientId || undefined,
        type: 'thu',
        amount: newProjectData.deposit,
        category: 'Cọc dự án',
        date: newProjectData.depositDate || new Date().toISOString().split('T')[0],
        method: 'Chuyển khoản',
        notes: `Nhận tiền cọc dự án "${newProjectData.title}"`,
        status: 'Đã ghi nhận',
        description: `Nhận tiền cọc dự án "${newProjectData.title}"`
      };
      setTransactions(prev => [autoDepositTrans, ...prev]);
    }
  };

  const handleEditProject = (updatedProject: Project) => {
    // Lấy thông tin dự án cũ trước khi sửa đổi để xem có sự vụ thay đổi tiền cọc
    const orig = projects.find(p => p.id === updatedProject.id);
    
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));

    // Nếu tiền cọc thay đổi từ 0 lên một số mới, tự động gợi ý lưu vết cọc vào Sổ Quỹ
    if (orig && orig.deposit === 0 && updatedProject.deposit > 0) {
      const autoDepositTrans: Transaction = {
        id: `t-auto-${Date.now()}`,
        transactionNumber: `TX-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
        projectId: updatedProject.id,
        clientId: updatedProject.clientId || undefined,
        type: 'thu',
        amount: updatedProject.deposit,
        category: 'Cọc dự án',
        date: updatedProject.depositDate || new Date().toISOString().split('T')[0],
        method: 'Chuyển khoản',
        notes: `Bổ sung tiền cọc dự án "${updatedProject.title}"`,
        status: 'Đã ghi nhận',
        description: `Bổ sung tiền cọc dự án "${updatedProject.title}"`
      };
      setTransactions(prev => [autoDepositTrans, ...prev]);
    }

    // Nếu chuyển sang trạng thái hoàn thành hoàn toàn và người dùng tất toán nốt số tiền còn lại
    if (orig && orig.status !== 'completed' && updatedProject.status === 'completed' && updatedProject.finalPayment > 0) {
      const autoFinalTrans: Transaction = {
        id: `t-auto-final-${Date.now()}`,
        transactionNumber: `TX-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
        projectId: updatedProject.id,
        clientId: updatedProject.clientId || undefined,
        type: 'thu',
        amount: updatedProject.finalPayment,
        category: 'Thanh toán đợt cuối',
        date: new Date().toISOString().split('T')[0],
        method: 'Chuyển khoản',
        notes: `Tất toán đợt cuối dự án "${updatedProject.title}"`,
        status: 'Đã ghi nhận',
        description: `Tất toán đợt cuối dự án "${updatedProject.title}"`
      };
      setTransactions(prev => [autoFinalTrans, ...prev]);
    }
  };

  const handleDeleteProject = (id: string) => {

    const p = projects.find(item => item.id === id);
    const label = p ? `"${p.title}"` : 'dự án này';
    triggerConfirm(
      'Cảnh báo nghiêm trọng',
      `Bạn đang thực hiện xóa hoàn toàn Job ${label} và toàn bộ thông tin thanh toán mỏ neo liên quan. Bạn có chắc chắn muốn tiếp tục không?`,
      () => {
        setProjects(prev => prev.filter(item => item.id !== id));
      },
      true
    );
  };

  // 5. CÁC HÀM XỬ LÝ GIAO DỊCH (TRANSACTION CRUD)
  const syncProjectsWithTransactions = (projectIdsToSync: string[], allTrans: Transaction[]) => {
    const uniqueIds = Array.from(new Set(projectIdsToSync.filter(Boolean)));
    if (uniqueIds.length === 0) return;

    setProjects(prevProjects => prevProjects.map(p => {
      if (!uniqueIds.includes(p.id)) return p;

      const projectTx = allTrans.filter(t => t.projectId === p.id);

      const totalPaid = projectTx
        .filter(t => t.type === 'thu')
        .reduce((sum, t) => sum + t.amount, 0);

      const actualCost = projectTx
        .filter(t => t.type === 'chi')
        .reduce((sum, t) => sum + t.amount, 0);

      const remaining = Math.max(0, p.price - totalPaid);

      let finalPaymentStatus: 'unpaid' | 'partially_paid' | 'paid' = 'unpaid';
      if (totalPaid >= p.price) {
        finalPaymentStatus = 'paid';
      } else if (totalPaid > 0) {
        finalPaymentStatus = 'partially_paid';
      }

      const depositTx = projectTx.find(t => t.type === 'thu' && (t.category === 'Tiền cọc' || t.category === 'Cọc dự án'));
      const depositVal = depositTx ? depositTx.amount : p.deposit;

      return {
        ...p,
        deposit: depositVal,
        otherPayments: Math.max(0, totalPaid - depositVal),
        finalPayment: remaining,
        finalPaymentStatus,
        actualCost
      };
    }));
  };

  const handleAddTransaction = (newTransData: Omit<Transaction, 'id'>) => {
    const year = new Date().getFullYear();
    const count = transactions.length + 101;
    const autoNumber = `TX-${year}-${count}`;

    const newTrans: Transaction = {
      transactionNumber: autoNumber,
      method: 'Chuyển khoản',
      status: 'Đã ghi nhận',
      description: newTransData.notes || '',
      ...newTransData,
      id: `t-${Date.now()}`
    };

    // Ensure description is synced for compatibility
    if (!newTrans.description) {
      newTrans.description = newTrans.notes || '';
    }
    if (!newTrans.notes) {
      newTrans.notes = newTrans.description || '';
    }

    const updated = [newTrans, ...transactions];
    setTransactions(updated);

    const projectIds = [];
    if (newTrans.projectId) {
      projectIds.push(newTrans.projectId);
    }
    syncProjectsWithTransactions(projectIds, updated);
  };

  const handleEditTransaction = (editedTrans: Transaction) => {
    const prevTrans = transactions.find(t => t.id === editedTrans.id);
    const updated = transactions.map(t => t.id === editedTrans.id ? editedTrans : t);
    setTransactions(updated);

    const projectsToSync: string[] = [];
    if (prevTrans?.projectId) projectsToSync.push(prevTrans.projectId);
    if (editedTrans.projectId) projectsToSync.push(editedTrans.projectId);

    syncProjectsWithTransactions(projectsToSync, updated);
  };

  const handleDeleteTransaction = (id: string) => {

    const t = transactions.find(item => item.id === id);
    const label = t ? `"${t.transactionNumber} - ${formatVND(t.amount)}"` : 'giao dịch này';
    triggerConfirm(
      'Kiểm duyệt hạch toán',
      `Bạn có chắc chắn muốn xóa phát sinh tài chính ${label}? Cân đối Sổ quỹ sẽ bị thay đổi.`,
      () => {
        const transToDelete = transactions.find(item => item.id === id);
        const updated = transactions.filter(item => item.id !== id);
        setTransactions(updated);

        if (transToDelete?.projectId) {
          syncProjectsWithTransactions([transToDelete.projectId], updated);
        }
      },
      true
    );
  };

  // 6. XỬ LÝ KHAI THUẾ JOB (TAX TOGGLE)
  const handleToggleProjectTax = (projectId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, taxDeclared: !p.taxDeclared };
      }
      return p;
    }));
  };

  // 7. TIỆN ÍCH DỮ LIỆU (RESET / CLEANUP)
  const handleResetToDemo = () => {
    triggerConfirm(
      'Khôi phục dữ liệu mẫu',
      'Bạn có chắc chắn muốn khôi phục lại dữ liệu mẫu Sandbox ban đầu không? Mọi thay đổi hiện tại của bạn sẽ bị ghi đè, và các thiết lập thương hiệu/dịch vụ cũng được đưa về mặc định.',
      () => {
        // Clear all local storages first to ensure it fully boots up afresh
        localStorage.removeItem('freelance_os_clients');
        localStorage.removeItem('freelance_os_projects');
        localStorage.removeItem('freelance_os_transactions');
        localStorage.removeItem('freelance_os_quotations');
        localStorage.removeItem('freelance_os_contracts');
        localStorage.removeItem('freelance_os_debt_metadatas');
        localStorage.removeItem('freelance_os_appointments');
        
        // Clear settings states too
        localStorage.removeItem('freelance_os_profile_settings');
        localStorage.removeItem('freelance_os_services_settings');
        localStorage.removeItem('freelance_os_templates_settings');
        localStorage.removeItem('freelance_os_statuses_settings');

        setClients(JSON.parse(JSON.stringify(INITIAL_CLIENTS)));
        setProjects(JSON.parse(JSON.stringify(INITIAL_PROJECTS)));
        setTransactions(JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS)));
        setQuotations(JSON.parse(JSON.stringify(INITIAL_QUOTATIONS)));
        setContracts(JSON.parse(JSON.stringify(INITIAL_CONTRACTS)));
        setDebtMetadatas([]);
        setAppointments(JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS)));
        setCurrentTab('dashboard');

        // Let it reload gracefully to avoid state mismatch or stale values
        setTimeout(() => {
          window.location.reload();
        }, 150);
      },
      false,
      'Khôi phục ngay',
      'Đóng'
    );
  };

  const handleCleanSlate = () => {
    triggerConfirm(
      'Cảnh báo: Xóa trống toàn bộ dữ liệu',
      'Thao tác này sẽ xóa sạch toàn bộ khách hàng, dự án, sổ quỹ, báo giá và lịch hẹn để bạn thiết lập hệ điều hành từ đầu. Bạn có chắc chắn muốn xóa không?',
      () => {
        localStorage.setItem('freelance_os_clients', JSON.stringify([]));
        localStorage.setItem('freelance_os_projects', JSON.stringify([]));
        localStorage.setItem('freelance_os_transactions', JSON.stringify([]));
        localStorage.setItem('freelance_os_quotations', JSON.stringify([]));
        localStorage.setItem('freelance_os_contracts', JSON.stringify([]));
        localStorage.setItem('freelance_os_debt_metadatas', JSON.stringify([]));
        localStorage.setItem('freelance_os_appointments', JSON.stringify([]));

        setClients([]);
        setProjects([]);
        setTransactions([]);
        setQuotations([]);
        setContracts([]);
        setDebtMetadatas([]);
        setAppointments([]);
        setCurrentTab('dashboard');

        setTimeout(() => {
          window.location.reload();
        }, 150);
      },
      true,
      'Xóa sạch',
      'Hủy'
    );
  };

  // Trực quan tab nội dung
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            projects={projects}
            clients={clients}
            transactions={transactions}
                                    onEditProject={handleEditProject}
            onNavigate={(tab) => {
              setCurrentTab(tab);
              setIsMobileMenuOpen(false);
            }}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              setCurrentTab('projects');
              setIsMobileMenuOpen(false);
            }}
          />
        );
      case 'projects':
        return (
          <ProjectsView
            projects={projects}
            clients={clients}
            transactions={transactions}
                        onAddTransaction={handleAddTransaction}
            onAddProject={handleAddProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            selectedProjectId={selectedProjectId}
            onClearSelectedProject={() => setSelectedProjectId(null)}
            quickAddConfig={quickAddConfig}
            onClearQuickAddConfig={() => setQuickAddConfig(null)}
          />
        );
      case 'clients':
        return (
          <ClientsView
            clients={clients}
            projects={projects}
            transactions={transactions}
            onAddClient={handleAddClient}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
            onQuickAddProject={(cId, stat) => {
              setQuickAddConfig({ clientId: cId, status: stat });
              setCurrentTab('projects');
            }}
            onSelectProject={(pId) => {
              setSelectedProjectId(pId);
              setCurrentTab('projects');
            }}
          />
        );
      case 'transactions':
        return (
          <TransactionsView
            transactions={transactions}
            projects={projects}
            clients={clients}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'tax':
        return (
          <TaxView
            projects={projects}
            onToggleProjectTax={handleToggleProjectTax}
          />
        );
      case 'quotes':
        return (
          <QuotesView
            quotations={quotations}
            clients={clients}
            projects={projects}
            onAddQuotation={handleAddQuotation}
            onEditQuotation={handleEditQuotation}
            onDeleteQuotation={handleDeleteQuotation}
            onAddClient={handleAddClient}
            onAddProject={handleAddProject}
          />
        );
      case 'contracts':
        return (
          <ContractsView
            contracts={contracts}
            clients={clients}
            projects={projects}
            quotations={quotations}
            onAddContract={handleAddContract}
            onEditContract={handleEditContract}
            onDeleteContract={handleDeleteContract}
            onAddClient={handleAddClient}
            onAddProject={handleAddProject}
          />
        );
      case 'debts':
        return (
          <DebtsView
            projects={projects}
            clients={clients}
            transactions={transactions}
            contracts={contracts}
            quotations={quotations}
            debtMetadatas={debtMetadatas}
            onUpdateDebtMetadata={handleUpdateDebtMetadata}
            onAddTransaction={handleAddTransaction}
          />
        );
      case 'appointments':
        return (
          <AppointmentsView
            appointments={appointments}
            projects={projects}
            clients={clients}
                        onAddAppointment={handleAddAppointment}
            onUpdateAppointment={handleUpdateAppointment}
            onDeleteAppointment={handleDeleteAppointment}
          />
        );
      case 'reports':
        return (
          <ReportsView
            projects={projects}
            transactions={transactions}
            clients={clients}
          />
        );
      case 'settings':
        return (
          <SettingsView />
        );
      default:
        return <div className="p-8 text-center text-slate-500">Đang cập nhật phân hệ...</div>;
    }
  };

  const totalUnpaidDebts = projects
    .filter((p) => p.status !== 'draft' && p.finalPaymentStatus !== 'paid')
    .reduce((sum, p) => sum + p.finalPayment, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row antialiased">
      
      {/* 1. SIDEBAR CHO DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 md:w-72 bg-brand-green-dark text-white p-6 justify-between border-r border-brand-green-light/20 shrink-0">
        <div className="space-y-8">
          {/* Logo & Slogan */}
          <div className="space-y-1.5 pb-4 border-b border-white/10">
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span className="bg-brand-accent p-1.5 rounded-lg text-white">
                <Layers size={18} />
              </span> Freelance OS
            </h1>
            <p className="text-[10px] uppercase font-bold text-slate-300 tracking-widest leading-relaxed">
              Media & Creative Studio OS
            </p>
          </div>

          {/* Hộp chỉ số Đóng cọc nhanh & Nợ phải thu */}
          {totalUnpaidDebts > 0 && (
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-1 bg-amber-50/5 border-amber-500/20">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Nợ cần thu</span>
              <p className="text-sm font-black text-brand-accent">{formatVND(totalUnpaidDebts)}</p>
            </div>
          )}

          {/* Menus */}
          <nav className="space-y-1.5 flex flex-col">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                currentTab === 'dashboard' 
                  ? 'bg-brand-green-light text-white shadow-xs' 
                  : 'text-slate-300 hover:bg-white/5'
              }`}
              id="sidebar-tab-board"
            >
              <Compass size={16} /> Bàn tổng quan (Dashboard)
            </button>
            <button
              onClick={() => setCurrentTab('projects')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                currentTab === 'projects' 
                  ? 'bg-brand-green-light text-white shadow-xs' 
                  : 'text-slate-300 hover:bg-white/5'
              }`}
              id="sidebar-tab-jobs"
            >
              <Briefcase size={16} /> Dự án & Sổ việc (Jobs)
            </button>
            <button
              onClick={() => setCurrentTab('clients')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                currentTab === 'clients' 
                  ? 'bg-brand-green-light text-white shadow-xs' 
                  : 'text-slate-300 hover:bg-white/5'
              }`}
              id="sidebar-tab-clients"
            >
              <Users size={16} /> Sổ Khách hàng (CRM)
            </button>
            <button
              onClick={() => setCurrentTab('quotes')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                currentTab === 'quotes' 
                  ? 'bg-brand-green-light text-white shadow-xs' 
                  : 'text-slate-300 hover:bg-white/5'
              }`}
              id="sidebar-tab-quotes"
            >
              <FileText size={16} /> Sổ Báo giá (Quotes)
            </button>
            <button
              onClick={() => setCurrentTab('contracts')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                currentTab === 'contracts' 
                  ? 'bg-brand-green-light text-white shadow-xs' 
                  : 'text-slate-300 hover:bg-white/5'
              }`}
              id="sidebar-tab-contracts"
            >
              <FileSignature size={16} /> Quản lý Hợp đồng
            </button>
            <button
              onClick={() => setCurrentTab('debts')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                currentTab === 'debts' 
                  ? 'bg-brand-green-light text-white shadow-xs' 
                  : 'text-slate-300 hover:bg-white/5'
              }`}
              id="sidebar-tab-debts"
            >
              <Scale size={16} /> Quản lý Công nợ
            </button>
            <button
              onClick={() => setCurrentTab('appointments')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                currentTab === 'appointments' 
                  ? 'bg-brand-green-light text-white shadow-xs' 
                  : 'text-slate-300 hover:bg-white/5'
              }`}
              id="sidebar-tab-appointments"
            >
              <Calendar size={16} /> Lịch hẹn & Công tác
            </button>
            <button
              onClick={() => setCurrentTab('transactions')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                currentTab === 'transactions' 
                  ? 'bg-brand-green-light text-white shadow-xs' 
                  : 'text-slate-300 hover:bg-white/5'
              }`}
              id="sidebar-tab-cash"
            >
              <DollarSign size={16} /> Sổ quỹ & Ghi thu chi
            </button>
            <button
              onClick={() => setCurrentTab('tax')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                currentTab === 'tax' 
                  ? 'bg-brand-green-light text-white shadow-xs' 
                  : 'text-slate-300 hover:bg-white/5'
              }`}
              id="sidebar-tab-tax"
            >
              <Calculator size={16} /> Tài liệu & Khai thuế
            </button>
            <button
              onClick={() => setCurrentTab('reports')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                currentTab === 'reports' 
                  ? 'bg-brand-green-light text-white shadow-xs' 
                  : 'text-slate-300 hover:bg-white/5'
              }`}
              id="sidebar-tab-reports"
            >
              <PieChart size={16} /> Báo cáo & Phân tích
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                currentTab === 'settings' 
                  ? 'bg-brand-green-light text-white shadow-xs' 
                  : 'text-slate-300 hover:bg-white/5'
              }`}
              id="sidebar-tab-settings"
            >
              <Settings size={16} /> Cài đặt & Thiết lập
            </button>
          </nav>
        </div>

        {/* Cấu hình & Backup dữ liệu ở cuối Sidebar */}
        <div className="pt-6 border-t border-white/10 space-y-2 text-xs">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Lock size={10} />
            <span>Mã hóa thiết bị (localStorage-ready)</span>
          </div>
          <button
            onClick={handleResetToDemo}
            className="w-full text-left py-2 px-3 hover:bg-white/5 text-[11px] text-slate-300 flex items-center gap-2 rounded-lg transition-colors"
            id="sidebar-btn-demoreset"
          >
            <RefreshCw size={12} /> Khôi phục dữ liệu mẫu
          </button>
          <button
            onClick={handleCleanSlate}
            className="w-full text-left py-2 px-3 hover:bg-rose-500/10 hover:text-rose-400 text-[11px] text-slate-400 flex items-center gap-2 rounded-lg transition-colors"
            id="sidebar-btn-empty"
          >
            <Trash2 size={12} /> Xóa trống tự thiết lập
          </button>
        </div>
      </aside>

      {/* 2. TOP BAR TRÊN MOBILE (ẨN TRÊN DESKTOP) */}
      <header className="md:hidden bg-brand-green-dark text-white h-14 px-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <span className="bg-brand-accent p-1.5 rounded-lg text-white">
            <Layers size={16} />
          </span>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Freelance OS</h1>
            <p className="text-[8px] uppercase font-bold text-slate-300 tracking-wider">Việt Nam Studio</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 hover:bg-white/10 rounded-lg"
          id="btn-mobile-toggle"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* 3. MOBILE MENU BACKDROP-DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-brand-green-dark text-white border-b border-brand-green-light/20 fixed top-14 left-0 right-0 z-30 shadow-xl max-h-[calc(100dvh-3.5rem)] overflow-y-auto pb-4"
          >
            <nav className="p-4 pb-8 space-y-1">
              <button
                onClick={() => { setCurrentTab('dashboard'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 ${
                  currentTab === 'dashboard' ? 'bg-brand-green-light' : 'hover:bg-white/5'
                }`}
              >
                <Compass size={15} /> Bàn tổng quan (Dashboard)
              </button>
              <button
                onClick={() => { setCurrentTab('projects'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 ${
                  currentTab === 'projects' ? 'bg-brand-green-light' : 'hover:bg-white/5'
                }`}
              >
                <Briefcase size={15} /> Dự án & Sổ việc (Jobs)
              </button>
              <button
                onClick={() => { setCurrentTab('clients'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 ${
                  currentTab === 'clients' ? 'bg-brand-green-light' : 'hover:bg-white/5'
                }`}
              >
                <Users size={15} /> Sổ Khách hàng (CRM)
              </button>
              <button
                onClick={() => { setCurrentTab('quotes'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 ${
                  currentTab === 'quotes' ? 'bg-brand-green-light' : 'hover:bg-white/5'
                }`}
              >
                <FileText size={15} /> Sổ Báo giá (Quotes)
              </button>
              <button
                onClick={() => { setCurrentTab('contracts'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 ${
                  currentTab === 'contracts' ? 'bg-brand-green-light' : 'hover:bg-white/5'
                }`}
              >
                <FileSignature size={15} /> Quản lý Hợp đồng
              </button>
               <button
                onClick={() => { setCurrentTab('debts'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 ${
                  currentTab === 'debts' ? 'bg-brand-green-light' : 'hover:bg-white/5'
                }`}
              >
                <Scale size={15} /> Sổ nợ & Công nợ
              </button>
              <button
                onClick={() => { setCurrentTab('appointments'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 ${
                  currentTab === 'appointments' ? 'bg-brand-green-light' : 'hover:bg-white/5'
                }`}
              >
                <Calendar size={15} /> Sổ lịch & Hẹn khách
              </button>
              <button
                onClick={() => { setCurrentTab('transactions'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 ${
                  currentTab === 'transactions' ? 'bg-brand-green-light' : 'hover:bg-white/5'
                }`}
              >
                <DollarSign size={15} /> Sổ quỹ & Ghi thu chi
              </button>
              <button
                onClick={() => { setCurrentTab('tax'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 ${
                  currentTab === 'tax' ? 'bg-brand-green-light' : 'hover:bg-white/5'
                }`}
              >
                <Calculator size={15} /> Tài liệu & Khai thuế
              </button>
              <button
                onClick={() => { setCurrentTab('reports'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 ${
                  currentTab === 'reports' ? 'bg-brand-green-light' : 'hover:bg-white/5'
                }`}
              >
                <PieChart size={15} /> Báo cáo & Phân tích
              </button>
              <button
                onClick={() => { setCurrentTab('settings'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 ${
                  currentTab === 'settings' ? 'bg-brand-green-light' : 'hover:bg-white/5'
                }`}
              >
                <Settings size={15} /> Cài đặt & Thiết lập
              </button>


              <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-center text-[10px]">
                <button
                  onClick={handleResetToDemo}
                  className="py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-slate-300"
                >
                  Khôi phục mẫu
                </button>
                <button
                  onClick={handleCleanSlate}
                  className="py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-colors text-rose-400"
                >
                  Xóa tất cả dữ liệu
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MAIN WORKSPACE CONTENT CONTAINER */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 5. BOTTOM NAVIGATION FOR MOBILE ONLY */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 grid grid-cols-5 py-2 px-1 z-40 shadow-lg text-center gap-1">
        <button
          onClick={() => { setCurrentTab('dashboard'); setIsMobileMenuOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            currentTab === 'dashboard' ? 'text-brand-green-mid font-bold scale-105' : 'text-slate-400'
          }`}
          id="mobile-nav-board"
        >
          <Compass size={18} />
          <span className="text-[9px] mt-0.5 tracking-tighter">Tổng quan</span>
        </button>
        <button
          onClick={() => { setCurrentTab('projects'); setIsMobileMenuOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            currentTab === 'projects' ? 'text-brand-green-mid font-bold scale-105' : 'text-slate-400'
          }`}
          id="mobile-nav-jobs"
        >
          <Briefcase size={18} />
          <span className="text-[9px] mt-0.5 tracking-tighter">Dự án</span>
        </button>
        <button
          onClick={() => { setCurrentTab('clients'); setIsMobileMenuOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            currentTab === 'clients' ? 'text-brand-green-mid font-bold scale-105' : 'text-slate-400'
          }`}
          id="mobile-nav-clients"
        >
          <Users size={18} />
          <span className="text-[9px] mt-0.5 tracking-tighter">Khách hàng</span>
        </button>
        <button
          onClick={() => { setCurrentTab('transactions'); setIsMobileMenuOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            currentTab === 'transactions' ? 'text-brand-green-mid font-bold scale-105' : 'text-slate-400'
          }`}
          id="mobile-nav-cash"
        >
          <DollarSign size={18} />
          <span className="text-[9px] mt-0.5 tracking-tighter">Sổ quỹ</span>
        </button>
        <button
          onClick={() => { setCurrentTab('tax'); setIsMobileMenuOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            currentTab === 'tax' ? 'text-brand-green-mid font-bold scale-105' : 'text-slate-400'
          }`}
          id="mobile-nav-tax"
        >
          <Calculator size={18} />
          <span className="text-[9px] mt-0.5 tracking-tighter text-nowrap">Hồ sơ thuế</span>
        </button>
      </footer>

      {/* To ensure the bottom nav doesn't overlap on mobile layout */}
      <div className="md:hidden h-16 shrink-0 pointer-events-none"></div>

      {/* 6. CUSTOM CONFIRM DIALOG MODAL */}
      {customConfirm && customConfirm.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm md:max-w-md w-full shadow-2.5xl space-y-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${customConfirm.isDanger ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-brand-green-mid border border-slate-200'}`}>
                {customConfirm.isDanger ? <Trash2 size={20} /> : <RefreshCw size={20} className="animate-spin" style={{ animationDuration: '3s' }} />}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{customConfirm.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">{customConfirm.message}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCustomConfirm(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 bg-white rounded-xl transition-all cursor-pointer"
              >
                {customConfirm.cancelText || 'Hủy bỏ'}
              </button>
              <button
                type="button"
                onClick={customConfirm.onConfirm}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer ${
                  customConfirm.isDanger
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-200 shadow-md'
                    : 'bg-brand-green-dark hover:bg-brand-green-mid shadow-slate-100 shadow-md'
                }`}
              >
                {customConfirm.confirmText || 'Đồng ý'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CUSTOM ALERT DIALOG MODAL */}
      {customAlert && customAlert.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-sm w-full shadow-2.5xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-100">
              <Lock size={22} className="animate-bounce" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-slate-950 uppercase tracking-tight">{customAlert.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{customAlert.message}</p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCustomAlert(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Chat Component */}
      <AiAssistant />

    </div>
  );
}
