import React, { useState, useMemo, useEffect } from 'react';
import { Client, Project, Quotation, Contract, ContractStatus } from '../types';
import { formatDate, formatVND, getContractStatusInfo } from '../utils';
import {
  FileSignature,
  FileText,
  Search,
  Plus,
  Copy,
  Printer,
  Edit2,
  Trash2,
  X,
  Check,
  Building,
  User,
  ExternalLink,
  PlusCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  FolderOpen,
  DollarSign,
  Briefcase,
  Layers,
  StickyNote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContractsViewProps {
  contracts: Contract[];
  clients: Client[];
  projects: Project[];
  quotations: Quotation[];
  onAddContract: (c: Omit<Contract, 'id'>) => void;
  onEditContract: (c: Contract) => void;
  onDeleteContract: (id: string) => void;
  onAddClient: (newClientData: Omit<Client, 'id' | 'createdAt'>) => string;
  onAddProject: (newProjectData: Omit<Project, 'id'>) => void;
}

// Mẫu điều khoản mặc định phù hợp cho freelance media sáng tạo
const DEFAULT_MEDIA_TERMS = {
  freeRevisions: 2,
  extraRevisionCost: 300000,
  scopeOfWork: 'Sản xuất hình ảnh/video theo nội dung kịch bản thỏa thuận trước. Gồm quay chụp tại bối cảnh thống nhất, xử lý hậu kỳ hoàn thiện và chỉnh sửa các chi tiết phát sinh theo yêu cầu.',
  deliveryTimeframe: 'Bàn giao sản phẩm mẫu (demo) sau 7 - 10 ngày làm việc kể từ thời điểm kết thúc buổi bấm máy. Bàn giao file chính thức sau 3 ngày kể từ khi thống nhất duyệt sửa bản demo.',
  paymentTerms: 'Đợt 1: Thanh toán tạm ứng (đặt cọc) %DEPOSIT_RATE%% tổng giá trị hợp đồng để làm cơ sở giữ lịch bấm máy và chuẩn bị trang thiết bị.\nĐợt 2: Thanh toán %REMAINING_RATE%% còn lại ngay khi thống nhất nghiệm thu bàn giao toàn bộ sản phẩm hoàn thiện cuối cùng qua Google Drive/Dropbox.',
  cancellationTerms: 'Trường hợp Bên A thay đổi lịch quay chụp đột ngột:\n- Trước 48 giờ: Hỗ trợ dời lịch miễn phí 01 lần.\n- Trễ dưới 24 giờ: Chịu phạt mất 50% tiền cọc và thanh toán các phát sinh chuẩn bị đạo cụ (nếu có).\n- Bên đơn phương hủy bỏ thỏa thuận không do lý do bất khả kháng chịu bồi thường bồi hoàn theo tỷ lệ 50% tổng dự án.',
  copyrightTerms: 'Toàn bộ bản quyền tài sản sở hữu trí tuệ nguyên bản đối với hình ảnh và mã phim thô thuộc về Bên B (Freelancer). Bên A được quyền sở hữu sử dụng độc quyền sản phẩm hoàn thiện (đã qua hậu kỳ chỉnh chế) cho toàn bộ hoạt động marketing thương mại, truyền thông xã hội. Bên B được quyền sử dụng các sản phẩm đã hoàn thiện này như một phần của danh mục dự án nghệ thuật làm việc (portfolio) hoặc tham gia trình bá thiết kế cá nhân.',
  confidentialityTerms: 'Bảo mật tuyệt đối các thông tin kế hoạch kinh doanh, hồ sơ nội bộ chưa được công bố hoặc các tư liệu bối cảnh riêng tư của Bên A trong quá trình bấm máy thực tế.'
};

export default function ContractsView({
  contracts,
  clients,
  projects,
  quotations,
  onAddContract,
  onEditContract,
  onDeleteContract,
  onAddClient,
  onAddProject
}: ContractsViewProps) {
  // Trạng thái bộ lọc và tìm kiếm ở danh sách
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  // Trạng thái Contract được chọn để xem chi tiết
  const [selectedContractId, setSelectedContractId] = useState<string | null>(() => {
    return contracts.length > 0 ? contracts[0].id : null;
  });

  // Tab biểu mẫu văn bản hiển thị: hợp đồng, biên lai cọc, nghiệm thu, thanh lý
  const [documentTypeTab, setDocumentTypeTab] = useState<'contract' | 'deposit' | 'delivery' | 'terminate'>('contract');

  // Trạng thái modal Thêm/Sửa hợp đồng
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // Nút sao chép văn bản thành công
  const [copySuccess, setCopySuccess] = useState(false);

  // Trường nhập liệu Form
  const [formClientId, setFormClientId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formContractNumber, setFormContractNumber] = useState('');
  const [formtotalValue, setFormTotalValue] = useState(0);
  const [formDeposit, setFormDeposit] = useState(0);
  const [formFreeRevisions, setFormFreeRevisions] = useState(2);
  const [formExtraRevisionCost, setFormExtraRevisionCost] = useState(300000);
  const [formScopeOfWork, setFormScopeOfWork] = useState('');
  const [formDeliveryTimeframe, setFormDeliveryTimeframe] = useState('');
  const [formPaymentTerms, setFormPaymentTerms] = useState('');
  const [formCancellationTerms, setFormCancellationTerms] = useState('');
  const [formCopyrightTerms, setFormCopyrightTerms] = useState('');
  const [formConfidentialityTerms, setFormConfidentialityTerms] = useState('');
  const [formExternalSignedLink, setFormExternalSignedLink] = useState('');
  const [formStatus, setFormStatus] = useState<ContractStatus>('nháp');
  const [formRelatedProject, setFormRelatedProject] = useState('');
  const [formRelatedQuotation, setFormRelatedQuotation] = useState('');

  // Sưu tập nguồn nhập nhanh (Từ báo giá hoặc dự án)
  const [selectedImportSource, setSelectedImportSource] = useState<{ type: 'quote' | 'project' | 'none'; id: string }>({
    type: 'none',
    id: ''
  });

  // Modal tạo khách hàng nhanh trực tiếp khi làm form
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');
  const [quickClientEmail, setQuickClientEmail] = useState('');

  // Đồng bộ hóa trạng thái được chọn nếu bị xóa đột ngột
  useEffect(() => {
    if (contracts.length > 0 && (!selectedContractId || !contracts.some(c => c.id === selectedContractId))) {
      setSelectedContractId(contracts[0].id);
    }
  }, [contracts, selectedContractId]);

  // Hợp đồng được chọn hiện tại
  const selectedContract = useMemo(() => {
    return contracts.find(c => c.id === selectedContractId) || null;
  }, [contracts, selectedContractId]);

  // Bộ lọc danh sách hợp đồng
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchSearch = 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchClient = clientFilter === 'all' || c.clientId === clientFilter;

      return matchSearch && matchStatus && matchClient;
    });
  }, [contracts, searchTerm, statusFilter, clientFilter]);

  // Tìm khách hàng theo ID
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Khách hàng không xác định';
  };

  const getClientInfo = (clientId: string) => {
    return clients.find(c => c.id === clientId) || null;
  };

  // Tự động sinh mã hợp đồng đề xuất
  const suggestContractNumber = () => {
    const year = new Date().getFullYear();
    const count = contracts.length + 101;
    return `HD-${year}-${count}`;
  };

  // Mở form thêm mới hợp đồng
  const handleOpenAddForm = (source?: { type: 'quote' | 'project'; id: string }) => {
    setEditingContract(null);
    setSelectedImportSource(source || { type: 'none', id: '' });

    // Trình tự pre-fill mặc định
    setFormContractNumber(suggestContractNumber());
    setFormTitle('Hợp đồng dịch vụ Media sáng tạo');
    setFormClientId('');
    setFormTotalValue(0);
    setFormDeposit(0);
    setFormFreeRevisions(DEFAULT_MEDIA_TERMS.freeRevisions);
    setFormExtraRevisionCost(DEFAULT_MEDIA_TERMS.extraRevisionCost);
    setFormScopeOfWork(DEFAULT_MEDIA_TERMS.scopeOfWork);
    setFormDeliveryTimeframe(DEFAULT_MEDIA_TERMS.deliveryTimeframe);
    
    // Tạo sẵn điều khoản thanh toán có cọc
    const payTerms = DEFAULT_MEDIA_TERMS.paymentTerms
      .replace('%DEPOSIT_RATE%', '35')
      .replace('%REMAINING_RATE%', '65');
    setFormPaymentTerms(payTerms);
    
    setFormCancellationTerms(DEFAULT_MEDIA_TERMS.cancellationTerms);
    setFormCopyrightTerms(DEFAULT_MEDIA_TERMS.copyrightTerms);
    setFormConfidentialityTerms(DEFAULT_MEDIA_TERMS.confidentialityTerms);
    setFormExternalSignedLink('');
    setFormStatus('nháp');
    setFormRelatedProject('');
    setFormRelatedQuotation('');

    if (source) {
      applyImportSource(source.type, source.id);
    }

    setIsFormOpen(true);
  };

  // Áp dụng nhập thông tin nhanh từ Báo giá / Dự án
  const applyImportSource = (type: 'quote' | 'project', id: string) => {
    if (type === 'quote') {
      const quote = quotations.find(q => q.id === id);
      if (quote) {
        const client = clients.find(c => c.id === quote.clientId);
        const clientLabel = client ? ` - ${client.name}` : '';
        setFormTitle(`Hợp đồng theo Báo giá ${quote.quoteNumber}${clientLabel}`);
        setFormClientId(quote.clientId);
        setFormTotalValue(quote.totalAfterDiscount);
        setFormDeposit(quote.depositAmount);
        setFormRelatedQuotation(quote.id);
        
        // Scope of work từ danh mục tệp báo giá
        const itemsText = quote.items.map((item, index) => 
          `${index + 1}. ${item.name} (${item.quantity} bộ) - ${item.description}`
        ).join('\n');
        setFormScopeOfWork(itemsText || DEFAULT_MEDIA_TERMS.scopeOfWork);
        
        // Cập nhật điều khoản thanh toán
        setFormPaymentTerms(quote.paymentTerms || DEFAULT_MEDIA_TERMS.paymentTerms
          .replace('%DEPOSIT_RATE%', quote.proposedDepositRate.toString())
          .replace('%REMAINING_RATE%', (100 - quote.proposedDepositRate).toString())
        );

        setFormDeliveryTimeframe(quote.deliveryTimeframe || DEFAULT_MEDIA_TERMS.deliveryTimeframe);
        
        // Gắn project liên đới
        if (quote.projectId) {
          setFormRelatedProject(quote.projectId);
        }
      }
    } else if (type === 'project') {
      const proj = projects.find(p => p.id === id);
      if (proj) {
        const client = clients.find(c => c.id === proj.clientId);
        const clientLabel = client ? ` - ${client.name}` : '';
        setFormTitle(`Hợp đồng thực hiện dự án: ${proj.title}`);
        setFormClientId(proj.clientId);
        setFormTotalValue(proj.price);
        setFormDeposit(proj.deposit);
        setFormRelatedProject(proj.id);
        setFormScopeOfWork(proj.brief || `${proj.title}: ${proj.notes || 'Dịch vụ cung cấp hoàn thiện.'}`);
        setFormDeliveryTimeframe(proj.dueDate ? `Dự kiến nghiệm thu bàn giao trước ngày ${formatDate(proj.dueDate)}` : DEFAULT_MEDIA_TERMS.deliveryTimeframe);
        
        if (proj.contractNumber) {
          setFormContractNumber(proj.contractNumber);
        }
      }
    }
  };

  // Mở form chỉnh sửa hợp đồng
  const handleOpenEditForm = (c: Contract) => {
    setEditingContract(c);
    setFormContractNumber(c.contractNumber);
    setFormTitle(c.title);
    setFormClientId(c.clientId);
    setFormTotalValue(c.totalValue);
    setFormDeposit(c.deposit);
    setFormFreeRevisions(c.freeRevisions);
    setFormExtraRevisionCost(c.extraRevisionCost);
    setFormScopeOfWork(c.scopeOfWork);
    setFormDeliveryTimeframe(c.deliveryTimeframe);
    setFormPaymentTerms(c.paymentTerms);
    setFormCancellationTerms(c.cancellationTerms);
    setFormCopyrightTerms(c.copyrightTerms);
    setFormConfidentialityTerms(c.confidentialityTerms || '');
    setFormExternalSignedLink(c.externalSignedLink || '');
    setFormStatus(c.status);
    setFormRelatedProject(c.projectId || '');
    setFormRelatedQuotation(c.quotationId || '');
    
    setIsFormOpen(true);
  };

  // Lưu link hợp đồng ký ngoài
  const handleSaveExternalSignedLink = (id: string) => {
    const currentContract = contracts.find(c => c.id === id);
    if (!currentContract) return;

    const currentUrl = currentContract.externalSignedLink || '';
    const link = prompt('Nhập liên kết tới tệp hợp đồng đã ký quét tay (Google Drive / Dropbox / DocuSign):', currentUrl);
    if (link === null) return; // Nhấn Hủy

    const updated: Contract = {
      ...currentContract,
      externalSignedLink: link,
      status: link ? 'đã ký' : currentContract.status, // Nếu lưu link thành công, tự động chuyển trạng thái "đã ký"
      signedDate: link ? new Date().toISOString().split('T')[0] : currentContract.signedDate
    };
    onEditContract(updated);
  };

  // Đổi nhanh trạng thái hợp đồng (e.g. Khách đã xác nhận -> "đã ký")
  const handleQuickStatusUpdate = (id: string, newStats: ContractStatus) => {
    const currentContract = contracts.find(c => c.id === id);
    if (!currentContract) return;

    const updated: Contract = {
      ...currentContract,
      status: newStats,
      signedDate: newStats === 'đã ký' || newStats === 'đang thực hiện' ? new Date().toISOString().split('T')[0] : currentContract.signedDate
    };
    onEditContract(updated);
  };

  // Lưu Form (Tạo mới hoặc cập nhật)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId) {
      alert('Vui lòng chọn khách hàng!');
      return;
    }
    if (!formTitle.trim()) {
      alert('Vui lòng nhập tên hợp đồng!');
      return;
    }

    const payload: Omit<Contract, 'id'> = {
      contractNumber: formContractNumber,
      title: formTitle,
      clientId: formClientId,
      totalValue: Number(formtotalValue),
      deposit: Number(formDeposit),
      remainingAmount: Math.max(0, Number(formtotalValue) - Number(formDeposit)),
      scopeOfWork: formScopeOfWork,
      freeRevisions: Number(formFreeRevisions),
      extraRevisionCost: Number(formExtraRevisionCost),
      deliveryTimeframe: formDeliveryTimeframe,
      paymentTerms: formPaymentTerms,
      cancellationTerms: formCancellationTerms,
      copyrightTerms: formCopyrightTerms,
      confidentialityTerms: formConfidentialityTerms || undefined,
      externalSignedLink: formExternalSignedLink || undefined,
      status: formStatus,
      projectId: formRelatedProject || undefined,
      quotationId: formRelatedQuotation || undefined,
      createdDate: editingContract ? editingContract.createdDate : new Date().toISOString().split('T')[0],
      signedDate: editingContract ? editingContract.signedDate : (formStatus === 'đã ký' ? new Date().toISOString().split('T')[0] : undefined)
    };

    if (editingContract) {
      onEditContract({
        ...payload,
        id: editingContract.id
      });
      setIsFormOpen(false);
    } else {
      onAddContract(payload);
      setIsFormOpen(false);
    }
  };

  // Tạo nhanh khách hàng ngay trong Form hợp đồng
  const handleQuickAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientName.trim()) {
      alert('Vui lòng nhập tên khách hàng!');
      return;
    }

    const clientId = onAddClient({
      name: quickClientName,
      phone: quickClientPhone,
      email: quickClientEmail,
      type: 'cá nhân',
      source: 'khác',
      interestedServices: ['Chụp ảnh'],
      status: 'đang làm việc',
      priority: 'trung bình',
      notes: 'Tạo nhanh tự động từ tiến trình Hợp đồng.'
    });

    setFormClientId(clientId);
    setIsQuickClientOpen(false);
    setQuickClientName('');
    setQuickClientPhone('');
    setQuickClientEmail('');
  };

  // Xóa hợp đồng
  const handleDelete = (id: string) => {
    if (confirm('Bản ghi hợp đồng này sẽ bị xóa vĩnh viễn khỏi thiết bị. Bạn có đồng ý xóa không?')) {
      onDeleteContract(id);
    }
  };

  // Tải nội dung từng biểu mẫu tương ứng
  const activeDocumentRender = useMemo(() => {
    if (!selectedContract) return null;

    const client = clients.find(c => c.id === selectedContract.clientId);
    const clientName = client ? client.name : 'NGUYỄN VĂN A';
    const clientPhone = client ? client.phone : '09xxxxxxxxx';
    const clientEmail = client ? client.email : 'vanna@gmail.com';
    const clientAddress = client?.address || 'TP. Hồ Chí Minh';

    const numFormat = (val: number) => formatVND(val);

    switch (documentTypeTab) {
      case 'contract':
        // MẪU HỢP ĐỒNG FREELANCE MEDIA
        return `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
---------***---------

HỢP ĐỒNG DỊCH VỤ TRUYỀN THÔNG & MEDIA
(Số: ${selectedContract.contractNumber})

- Căn cứ vào Bộ luật Dân sự nước Cộng hòa Xã hội Chủ nghĩa Việt Nam số 91/2015/QH13 có hiệu lực từ ngày 01/01/2017.
- Căn cứ vào nhu cầu và khả năng thực tế của hai bên.

Hôm nay, ngày ${selectedContract.createdDate.split('-')[2]} tháng ${selectedContract.createdDate.split('-')[1]} năm ${selectedContract.createdDate.split('-')[0]}, chúng tôi gồm các bên dưới đây:

BÊN A: BÊN SỬ DỤNG DỊCH VỤ (KHÁCH HÀNG)
- Đại diện: Ông/Bà ${clientName}
- Số điện thoại: ${clientPhone}
- Email: ${clientEmail}
- Địa chỉ: ${clientAddress}

BÊN B: BÊN CUNG CẤP DỊCH VỤ (FREELANCER)
- Người thực hiện: Ekip Media Freelancer Sáng Tạo
- Số điện thoại liên lạc: Hotline Studio
- Lĩnh vực hoạt động: Sản xuất nội dung Hình ảnh / Video clip quảng bá

Hai bên cùng thống nhất ký kết Hợp đồng dịch vụ media với điều khoản cụ thể sau đây:

ĐIỀU 1: PHẠM VI CÔNG VIỆC & SẢN PHẨM BÀN GIAO
1.1. Tên dự án: ${selectedContract.title}
1.2. Bên B có trách nhiệm triển khai gói dịch vụ sáng tạo nghệ thuật theo nội dung phạm vi công tác:
${selectedContract.scopeOfWork}
1.3. Hạn mức chỉnh sửa bổ sung hỗ trợ tối đa: ${selectedContract.freeRevisions} lần miễn phí đối với các phản hồi chuẩn chỉnh từ Bên A.
1.4. Chi phí cho mỗi lần phát sinh chỉnh sửa phụ thêm ngoài hạn mức thỏa thuận: ${numFormat(selectedContract.extraRevisionCost)} VNĐ/lần sửa đổi.

ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG & PHƯƠNG THỨC THANH TOÁN
2.1. Tổng giá trị thực tế của hợp đồng: ${numFormat(selectedContract.totalValue)} VNĐ
(Bằng chữ: ${selectedContract.totalValue.toLocaleString('vi-VN')} Việt Nam Đồng)
2.2. Khoản đặt cọc giữ lịch bấm máy (Bên A thanh toán ngay sau khi ký hợp đồng): ${numFormat(selectedContract.deposit)} VNĐ.
2.3. Số tiền còn lại Bên A thanh toán dứt điểm khi kết thúc bàn giao chính thức: ${numFormat(selectedContract.remainingAmount)} VNĐ.
2.4. Hình thức thanh toán: Chuyển khoản ngân hàng hoặc thanh toán trực tiếp bằng Tiền mặt.

ĐIỀU 3: THỜI GIAN VÀ ĐỊA ĐIỂM BÀN GIAO
- Thời gian tiến trình thực hiện và bàn giao:
${selectedContract.deliveryTimeframe}
- Định dạng sản phẩm: Toàn bộ thư mục sản phẩm lưu giữ dạng Link Google Drive chất lượng cao hoặc công cụ nén đám mây bảo mật.

ĐIỀU 4: PHẠT HỦY LỊCH & CHẤM DỨT THỎA THUẬN
${selectedContract.cancellationTerms}

ĐIỀU 5: BẢN QUYỀN SỬ DỤNG & SỞ HỮU TRÍ TUỆ
${selectedContract.copyrightTerms}
${selectedContract.confidentialityTerms ? `\nĐIỀU 6: THỎA THUẬN BẢO MẬT\n${selectedContract.confidentialityTerms}` : ''}

ĐIỀU ${selectedContract.confidentialityTerms ? '7' : '6'}: ĐIỀU KHOẢN CHUNG & CAM KẾT
- Hai bên cam kết thực hiện đầy đủ nghiêm túc các điều khoản thỏa ước ghi trên hợp đồng.
- Bất kỳ sửa đổi thay thế bổ sung nào phải thảo bàn qua sự phê chuẩn chung từ cả 2 đại diện bằng văn bản/tin nhắn liên lạc chính thức.
- Hợp đồng có hiệu lực pháp lý xác nhận kể từ ngày hai bên bấm bút văn bản ký chữ hoặc biểu thị ấn xác nhận đồng ý từ xa trên nền tảng quản trị.

ĐẠI DIỆN BÊN A (Ký, ghi rõ họ tên)               ĐẠI DIỆN BÊN B (Ký, ghi rõ họ tên)

${clientName}                                    Freelancer Studio`;

      case 'deposit':
        // MẪU BIÊN NHẬN ĐẶT CỌC
        return `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
---------***---------

BIÊN NHẬN THANH TOÁN TIỀN CỌC DỊCH VỤ
(Mẫu kèm Hợp đồng số: ${selectedContract.contractNumber})

Hôm nay, đại diện Bên B (Cung cấp dịch vụ) chính thức xác nhận đã nhận thành công khoản thanh toán đặt cọc chuẩn lịch của Bên A (Khách hàng) với chi tiết giao dịch dưới đây:

1. THÔNG TIN KHÁCH HÀNG (BÊN THA TOÁN):
- Ông/Bà: ${clientName}
- Số điện thoại: ${clientPhone} | Email: ${clientEmail}

2. CHI TIẾT KHOẢN ĐẶT CỌC NHẬN:
- Số tiền tạm ứng nhận cọc thực tế: ${numFormat(selectedContract.deposit)} VNĐ
- Bằng chữ: ${selectedContract.deposit.toLocaleString('vi-VN')} Việt Nam Đồng.
- Phục vụ cho hạng mục dự án: ${selectedContract.title}
- Trị giá hợp đồng cam kết gốc: ${numFormat(selectedContract.totalValue)} VNĐ
- Số tiền còn lại cần thanh toán khi bàn giao nghiệm thu: ${numFormat(selectedContract.remainingAmount)} VNĐ.

3. HÌNH THỨC THANH TOÁN KÍ BÚT:
- Đã nhận đủ qua Chuyển khoản ngân hàng điện tử / Tiền mặt.
- Trạng thái dòng tiền: Hoàn thành tạm ứng, kích hoạt khởi chạy công việc sáng tạo chuẩn bối cảnh.

Sách biên nhận này đóng vai trò xác thực cam kết dịch vụ giữa hai bên. Bên B chịu hoàn toàn trách nhiệm bố trí trang bị máy móc, nhân sự và triển khai chụp ảnh/quay chụp như thảo luận.

BÊN NHẬN TIỀN (KÝ XÁC THỰC)                     BÊN TRẢ TIỀN ĐẶT CỌC

Freelancer Studio                               ${clientName}`;

      case 'delivery':
        // MẪU BIÊN BẢN NGHIỆM THU BÀN GIAO
        return `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
---------***---------

BIÊN BẢN NGHIỆM THU CHI TIẾT & BÀN GIAO SẢN PHẨM
(Dự án: ${selectedContract.title})

Căn cứ vào thỏa thuận dịch vụ thực hiện truyền thông theo Hợp đồng số: ${selectedContract.contractNumber}.
Hôm nay, hai bên cùng tiến hành lập biên bản nghiệm thu chất lượng kỹ thuật, kỹ xảo hình ảnh và lập thủ tục bàn giao sản phẩm hoàn thiện cuối cùng:

1. DANH MỤC THÀNH PHẨM BÀN GIAO THỰC TẾ:
- Chi tiết đực thu: ${selectedContract.scopeOfWork}
- Trạng thái sửa đổi chỉnh dựng: Đã kiểm duyệt đáp ứng đầy đủ yêu cầu, không phát sinh chỉnh sửa gia tăng.
- Đánh giá chất lượng hình ảnh, âm thanh, màu sắc: Đạt chuẩn thỏa thuận đạt yêu cầu đề xuất ban đầu.

2. CÁC TÀI LIỆU BÀN GIAO ĐÍNH KÈM:
- Link Thư mục lưu trữ: [Bàn giao Google Drive chính thức]
- Tổng số lượng ảnh gốc & làm mịn hoàn thiện bàn giao không đổi.

3. KẾT LUẬN CHI TIẾT ĐỒNG THUẬN:
- Bên A đồng ý nghiệm thu toàn bộ chất lượng sản phẩm do Bên B bàn giao và không có bất kỳ khiếu nại phát sinh sau tiến trình.
- Bên A có nghĩa vụ thanh toán đầy đủ % còn lại giá trị hợp đồng tương đương số tiền: ${numFormat(selectedContract.remainingAmount)} VNĐ cho bên B.

Biên bản bàn giao làm cơ sở đối khoán kế toán và tất toán chấm dứt mọi thỏa thuận phát sinh.

BÊN GIAO (BÊN B)                                 BÊN NHẬN (BÊN A)

Freelancer Studio                               ${clientName}`;

      case 'terminate':
        // MẪU THANH LÝ HỢP ĐỒNG
        return `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
---------***---------

BIÊN BẢN THANH LÝ HỢP ĐỒNG DỊCH VỤ MEDIA
(Liên quan Hợp đồng số: ${selectedContract.contractNumber})

Hôm nay, hai bên đại diện của dự án lập văn bản này cùng xác nhận thanh lý Hợp đồng dịch vụ media số ${selectedContract.contractNumber} được ký kết chính thức vào ngày ${selectedContract.createdDate}:

ĐIỀU 1: XÁC NHẬN HOÀN THÀNH TIẾN TRÌNH
Bên B đã bàn giao đầy đủ, đúng hạn và đạt quy chuẩn kỹ thuật sản phẩm của dự án: "${selectedContract.title}" cho bên A. Bên A đã kiểm nghiệm thu nhận và đồng ý hoàn toàn.

ĐIỀU 2: TẤT TOÁN NGHĨA VỤ THANH TOÁN
- Tổng kinh phí hợp đồng toàn dải: ${numFormat(selectedContract.totalValue)} VNĐ.
- Chi phí cọc Bên A đã trả đợt 1: ${numFormat(selectedContract.deposit)} VNĐ.
- Số tiền dư bồi hoàn thanh toán dứt điểm đợt cuối: ${numFormat(selectedContract.remainingAmount)} VNĐ.
- Hai bên đồng ý xác nhận đã giao nhận đủ số tiền còn lại và không còn bất kỳ nợ nần tài chính nào liên đới.

ĐIỀU 3: CHẤM DỨT TRÁCH NHIỆM PHÁP LÝ
Kể từ thời điểm biên bản thanh lý hợp đồng này được xác nhận, Hợp đồng số ${selectedContract.contractNumber} chính thức dừng hiệu lực. Toàn bộ nghĩa vụ, quyền lợi và cam kết kèm theo được tuyên bố hoàn thành triệt để. 
Mọi điều khoản bản quyền sử dụng hình ảnh của sản phẩm vẫn tiếp tục áp dụng theo thỏa thuận tại Điều khoản bảo quyền gốc của Hợp đồng.

Biên bản được thống nhất lập thành một văn bản số hóa điện tử có giá trị ngang nhau cho mỗi bên lưu trữ.

ĐẠI DIỆN BÊN A (KHÁCH HÀNG)                      ĐẠI DIỆN BÊN B (FREELANCER)

${clientName}                                    Freelancer Studio`;

      default:
        return '';
    }
  }, [selectedContract, documentTypeTab, clients]);

  // Copy nội dung biểu mẫu hiện tại vào clipboard
  const handleCopyContent = () => {
    if (!activeDocumentRender) return;
    navigator.clipboard.writeText(activeDocumentRender);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Trực quan in ấn tài liệu
  const handlePrintDocument = () => {
    if (!selectedContract) return;
    
    // Tạo iframe ẩn hoặc mở một tab in mới sạch sẽ
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép trình duyệt mở popup để thực hiện in ấn!');
      return;
    }

    const docTypeLabel = 
      documentTypeTab === 'contract' ? 'Hợp đồng' :
      documentTypeTab === 'deposit' ? 'Phiếu nhận cọc' :
      documentTypeTab === 'delivery' ? 'Biên bản bàn giao' : 'Thanh lý hợp đồng';

    printWindow.document.write(`
      <html>
        <head>
          <title>${docTypeLabel} - ${selectedContract.contractNumber}</title>
          <style>
            body { 
              font-family: 'Times New Roman', Times, serif, Arial; 
              font-size: 14pt; 
              line-height: 1.6; 
              color: #222; 
              padding: 40px; 
              max-width: 800px; 
              margin: 0 auto; 
              white-space: pre-wrap; 
            }
            h1, h2, h3 { text-align: center; margin-bottom: 5px; }
            .header-sec { text-align: center; margin-bottom: 30px; border-bottom: 1px double #555; padding-bottom: 10px; }
            @media print {
              body { padding: 0; }
              @page { size: A4; margin: 20mm; }
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; word-spacing: 2px; font-weight: bold; margin-bottom: 25px;">
            ${activeDocumentRender.split('----***---------')[0] || ''}
            ---------***---------
          </div>
          <div>
            ${activeDocumentRender.split('----***---------')[1] || activeDocumentRender}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-15 shadow-2xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileSignature className="text-brand-green-light" size={24} />
              Quản lý Hợp đồng & Cam kết
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Quản trị hợp đồng dịch vụ chuẩn media, in biên lai đặt cọc, phiếu nghiệm thu và biên bản thanh lý dứt điểm.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleOpenAddForm()}
              className="bg-brand-green-light hover:bg-brand-green-dark text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md"
              id="btn-create-contract-direct"
            >
              <Plus size={16} /> Tạo hợp đồng mới
            </button>
          </div>
        </div>

        {/* THẺ ĐẾM TRẠNG THÁI */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-center">
            <span className="text-slate-400 text-xxs font-bold uppercase tracking-wider block">Tất cả hợp đồng</span>
            <span className="text-lg font-black text-slate-800 mt-0.5">{contracts.length} bản</span>
          </div>
          <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl flex flex-col justify-center">
            <span className="text-amber-600 text-xxs font-bold uppercase tracking-wider block">Chờ khách ký</span>
            <span className="text-lg font-black text-amber-700 mt-0.5">
              {contracts.filter(c => c.status === 'chờ khách xác nhận').length} bản
            </span>
          </div>
          <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl flex flex-col justify-center">
            <span className="text-indigo-600 text-xxs font-bold uppercase tracking-wider block">Đã ký / Đang thực thi</span>
            <span className="text-lg font-black text-indigo-700 mt-0.5">
              {contracts.filter(c => c.status === 'đã ký' || c.status === 'đang thực hiện').length} bản
            </span>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex flex-col justify-center">
            <span className="text-emerald-600 text-xxs font-bold uppercase tracking-wider block">Đạt hoàn thành</span>
            <span className="text-lg font-black text-emerald-700 mt-0.5">
              {contracts.filter(c => c.status === 'hoàn thành').length} bản
            </span>
          </div>
          <div className="bg-purple-50/40 border border-purple-100 p-3 rounded-xl flex flex-col justify-center col-span-2 md:col-span-1">
            <span className="text-purple-600 text-xxs font-bold uppercase tracking-wider block">Hủy bỏ / Thanh lý</span>
            <span className="text-lg font-black text-purple-700 mt-0.5">
              {contracts.filter(c => c.status === 'thanh lý' || c.status === 'hủy').length} bản
            </span>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE - SPLIT SCREEN */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-visible">
        
        {/* LEFTSIDE COLUMN: SEARCH & LIST OF CONTRACTS - 4 Cols */}
        <div className="lg:col-span-4 border-r border-slate-200 bg-white flex flex-col no-print lg:max-h-[calc(110vh-320px)] lg:overflow-y-auto">
          
          {/* SEARCH & FILTERS CONTAINER */}
          <div className="p-4 border-b border-slate-100 space-y-3 sticky top-0 bg-white z-10 shadow-3xs">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm mã số hoặc tên dự án..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-brand-green-light focus:bg-white transition-all"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xxs text-slate-700 focus:outline-hidden focus:border-brand-green-light"
                >
                  <option value="all">Tấn cả trạng thái</option>
                  <option value="nháp">Nháp</option>
                  <option value="chờ khách xác nhận">Chờ xác nhận</option>
                  <option value="đã ký">Đã ký</option>
                  <option value="đang thực hiện">Đang thực hiện</option>
                  <option value="hoàn thành">Hoàn thành</option>
                  <option value="thanh lý">Thanh lý</option>
                  <option value="hủy">Đã hủy</option>
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Khách hàng</label>
                <select
                  value={clientFilter}
                  onChange={e => setClientFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xxs text-slate-700 focus:outline-hidden focus:border-brand-green-light"
                >
                  <option value="all">Tất cả khách</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* LIST OF CONTRACT CARDS */}
          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
            {filteredContracts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <FolderOpen className="mx-auto text-slate-300" size={32} />
                <p className="text-xs">Không tìm thấy hợp đồng phù hợp nào.</p>
              </div>
            ) : (
              filteredContracts.map(c => {
                const statusInfo = getContractStatusInfo(c.status);
                const isSelected = c.id === selectedContractId;
                
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedContractId(c.id)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-all ${
                      isSelected ? 'border-l-4 border-brand-green-light bg-brand-green-light/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm font-semibold">
                        {c.contractNumber}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusInfo.bgClass}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mb-2">
                      {c.title}
                    </h4>

                    <div className="space-y-1 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <User size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{getClientName(c.clientId)}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono mt-1 pt-1 border-t border-slate-50/50">
                        <span className="text-slate-400">Giá trị:</span>
                        <span className="font-bold text-slate-800">{formatVND(c.totalValue)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHTSIDE COLUMN: CONTRACT PREVIEW & EXPORT DOCUMENTS - 8 Cols */}
        <div className="lg:col-span-8 bg-slate-100 p-4 lg:p-6 overflow-y-auto lg:max-h-[calc(100vh-140px)]">
          {selectedContract ? (
            <div className="space-y-6">
              
              {/* META INFO BANNER CARD */}
              <div className="bg-white rounded-2xl border border-slate-300/60 p-5 shadow-sm no-print">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-50 text-emerald-700 font-mono text-xs font-bold px-2.5 py-0.5 rounded-md border border-emerald-250">
                        {selectedContract.contractNumber}
                      </span>
                      <span className="text-xs text-slate-400">Tạo ngày: {selectedContract.createdDate}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {selectedContract.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Building size={14} className="text-slate-400" /> 
                      Khách hàng: <span className="text-emerald-700 underline">{getClientName(selectedContract.clientId)}</span>
                    </p>
                  </div>

                  {/* QUICK STATS & VALUE */}
                  <div className="text-left md:text-right space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Tổng giá trị</span>
                    <span className="text-lg font-black text-brand-green-light block">{formatVND(selectedContract.totalValue)}</span>
                    <p className="text-3xs text-slate-500 font-bold">
                      Cọc: {formatVND(selectedContract.deposit)} ({Math.round((selectedContract.deposit / selectedContract.totalValue) * 100) || 0}%) | Còn lại: {formatVND(selectedContract.remainingAmount)}
                    </p>
                  </div>
                </div>

                {/* GIAO PHẬN TRẠNG THÁI NHANH */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-xs text-slate-500 mr-1.5 font-bold">Cập nhật nhanh:</span>
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedContract.id, 'chờ khách xác nhận')}
                      className={`px-3 py-1.5 rounded-lg text-xxs font-bold border transition-all ${
                        selectedContract.status === 'chờ khách xác nhận'
                          ? 'bg-amber-100 text-amber-700 border-amber-300'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      Chờ xác nhận
                    </button>
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedContract.id, 'đã ký')}
                      className={`px-3 py-1.5 rounded-lg text-xxs font-bold border transition-all ${
                        selectedContract.status === 'đã ký'
                          ? 'bg-indigo-100 text-indigo-750 border-indigo-300'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      Đã ký
                    </button>
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedContract.id, 'đang thực hiện')}
                      className={`px-3 py-1.5 rounded-lg text-xxs font-bold border transition-all ${
                        selectedContract.status === 'đang thực hiện'
                          ? 'bg-sky-100 text-sky-850 border-sky-300'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      Đang làm
                    </button>
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedContract.id, 'hoàn thành')}
                      className={`px-3 py-1.5 rounded-lg text-xxs font-bold border transition-all ${
                        selectedContract.status === 'hoàn thành'
                          ? 'bg-emerald-100 text-emerald-750 border-emerald-300'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      Hoàn thành
                    </button>
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedContract.id, 'thanh lý')}
                      className={`px-3 py-1.5 rounded-lg text-xxs font-bold border transition-all ${
                        selectedContract.status === 'thanh lý'
                          ? 'bg-purple-100 text-purple-750 border-purple-300'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      Thanh lý
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditForm(selectedContract)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg text-xs font-bold transition-all"
                      title="Chỉnh sửa chi tiết hợp đồng"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedContract.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-lg text-xs font-bold transition-all"
                      title="Xóa hợp đồng này"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* KÝ NGOÀI VÀ CÁC THÔNG SỐ KHÁC */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xxs text-slate-500">
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Hợp đồng liên đới:</span>
                    {selectedContract.quotationId ? (
                      <span className="bg-zinc-100 text-zinc-700 font-mono px-1.5 py-0.5 rounded-sm">
                        Báo giá gốc ({quotations.find(q => q.id === selectedContract.quotationId)?.quoteNumber || 'Liên kết'})
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Không tạo qua báo giá</span>
                    )}
                    {selectedContract.projectId && (
                      <span className="bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded-sm ml-1">
                        Dự án ({projects.find(p => p.id === selectedContract.projectId)?.title || 'Liên kết'})
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedContract.externalSignedLink ? (
                      <a
                        href={selectedContract.externalSignedLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-bold underline flex items-center gap-0.5 hover:text-emerald-950"
                      >
                        <ExternalLink size={12} /> Link File Hợp Đồng Đã Ký (.PDF/.SCAN)
                      </a>
                    ) : (
                      <button
                        onClick={() => handleSaveExternalSignedLink(selectedContract.id)}
                        className="text-indigo-600 font-bold hover:text-indigo-950 underline cursor-pointer flex items-center gap-0.5"
                      >
                        <PlusCircle size={12} /> Đính kèm liên kết PDF đã ký thô ngoài app
                      </button>
                    )}
                    {selectedContract.externalSignedLink && (
                      <button
                        onClick={() => handleSaveExternalSignedLink(selectedContract.id)}
                        className="text-slate-400 hover:text-slate-600 underline"
                      >
                        (Đổi link)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* DOCUMENT VIEW CONTAINER WITH TABS */}
              <div className="space-y-4">
                
                {/* TABS SELECTOR */}
                <div className="flex items-center space-x-1.5 bg-slate-200 p-1 rounded-xl no-print">
                  <button
                    onClick={() => setDocumentTypeTab('contract')}
                    className={`flex-1 py-2 text-xxs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      documentTypeTab === 'contract' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-300/50'
                    }`}
                  >
                    <FileSignature size={12} /> Hợp đồng dịch vụ
                  </button>
                  <button
                    onClick={() => setDocumentTypeTab('deposit')}
                    className={`flex-1 py-2 text-xxs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      documentTypeTab === 'deposit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-300/50'
                    }`}
                  >
                    <DollarSign size={12} /> Phiếu nhận cọc
                  </button>
                  <button
                    onClick={() => setDocumentTypeTab('delivery')}
                    className={`flex-1 py-2 text-xxs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      documentTypeTab === 'delivery' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-300/50'
                    }`}
                  >
                    <Check size={12} /> Nghiệm thu bàn giao
                  </button>
                  <button
                    onClick={() => setDocumentTypeTab('terminate')}
                    className={`flex-1 py-2 text-xxs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      documentTypeTab === 'terminate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-300/50'
                    }`}
                  >
                    <FileText size={12} /> Biên bản thanh lý
                  </button>
                </div>

                {/* THE SIMULATED A4 PAPER SHEET */}
                <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-12 relative overflow-hidden text-slate-800 font-serif leading-relaxed text-sm max-w-4xl mx-auto">
                  
                  {/* UTILITY BAR OVERLAY ON SHEET */}
                  <div className="absolute top-4 right-4 flex gap-1.5 no-print">
                    <button
                      onClick={handleCopyContent}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xxs font-bold flex items-center gap-1 transition-all"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="text-emerald-600 animate-pulse" size={13} />
                          Đã sao chép!
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          Sao chép văn bản
                        </>
                      )}
                    </button>
                    <button
                      onClick={handlePrintDocument}
                      className="bg-slate-150 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xxs font-bold flex items-center gap-1 transition-all"
                    >
                      <Printer size={13} />
                      In ấn / Xuất PDF
                    </button>
                  </div>

                  {/* LOGO SƯU CHỈNH HOẶC THỎA THUẬN LETTERHEAD */}
                  <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-center text-xs font-sans text-slate-400 no-print">
                    <span>HỆ ĐIỀU HÀNH FREELANCE OS</span>
                    <span className="font-mono">Tài liệu số: {selectedContract.contractNumber}</span>
                  </div>

                  {/* CHÍNH TEXT HỢP ĐỒNG */}
                  <div className="whitespace-pre-line text-xs sm:text-sm text-slate-800 tracking-wide font-serif">
                    {activeDocumentRender}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
              <FileSignature className="text-slate-300 animate-pulse" size={48} />
              <h4 className="font-bold text-slate-700 text-sm">Chưa có hợp đồng nào được chọn</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Hãy lựa chọn một hợp đồng bên danh mục bên trái để xem đầy đủ biểu mẫu hoặc thiết lập biểu mẫu mới cho khách hàng.
              </p>
              <button
                onClick={() => handleOpenAddForm()}
                className="bg-brand-green-light text-white font-bold text-xs py-2 px-4 rounded-xl hover:bg-brand-green-dark transition-all"
              >
                Khởi tạo ngay hợp đồng đầu tiên
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FORM MODAL FOR ADD/EDIT CONTRACT */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-8"
              style={{ maxHeight: '90vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* MODAL HEADER */}
              <div className="bg-brand-green-dark text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                    <FileSignature size={20} className="text-brand-accent animate-pulse" />
                    {editingContract ? 'Cập nhật Hợp đồng dịch vụ' : 'Khởi tạo Hợp đồng mới'}
                  </h3>
                  <p className="text-[10px] text-white/70">
                    Bổ sung các điều khoản và thông số dự án trực quan để kết tập văn bản hợp đồng.
                  </p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* MODAL FORM SECTION */}
              <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. NGUỒN NHẬP NHANH (NẾU TẠO MỚI) */}
                {!editingContract && (
                  <div className="bg-emerald-50/50 border border-emerald-150 p-4 rounded-xl">
                    <span className="text-xxs font-bold text-emerald-600 block uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles size={12} />
                      Tính năng nạp nhanh thông tin từ Báo giá hoặc Dự án liên quan
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xxs font-bold text-slate-500 block mb-1">Chọn từ Sổ Báo giá đã duyệt</label>
                        <select
                          onChange={e => {
                            if (e.target.value) {
                              applyImportSource('quote', e.target.value);
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700"
                        >
                          <option value="">-- Không chọn / Tạo từ đầu --</option>
                          {quotations.map(q => {
                            const client = clients.find(c => c.id === q.clientId);
                            return (
                              <option key={q.id} value={q.id}>
                                {q.quoteNumber} - {client ? client.name : 'Khách'} ({formatVND(q.totalAfterDiscount)})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="text-xxs font-bold text-slate-500 block mb-1">Chọn từ Sổ Dự án hiện hữu</label>
                        <select
                          onChange={e => {
                            if (e.target.value) {
                              applyImportSource('project', e.target.value);
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700"
                        >
                          <option value="">-- Không chọn / Tạo từ đầu --</option>
                          {projects.map(p => {
                            const client = clients.find(c => c.id === p.clientId);
                            return (
                              <option key={p.id} value={p.id}>
                                [Job] {p.title} - {client ? client.name : 'Khách'} ({formatVND(p.price)})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. THÔNG TIN PHÁP NHÂN CƠ BẢN */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <Building size={14} className="text-emerald-600" />
                    Thống tin căn bản & Khách hàng
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    
                    {/* KHÁCH HÀNG */}
                    <div className="md:col-span-6 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xxs font-black text-slate-600 uppercase">Khách hàng bên A *</label>
                        <button
                          type="button"
                          onClick={() => setIsQuickClientOpen(true)}
                          className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <PlusCircle size={11} />
                          Tạo khách mới
                        </button>
                      </div>
                      <select
                        required
                        value={formClientId}
                        onChange={e => setFormClientId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                      >
                        <option value="">-- Lựa chọn khách hàng để ký --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.phone || c.email})</option>
                        ))}
                      </select>
                    </div>

                    {/* TÊN HỢP ĐỒNG */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="text-xxs font-black text-slate-600 uppercase">Tên Hợp đồng dịch vụ *</label>
                      <input
                        required
                        type="text"
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        placeholder="Ví dụ: Hợp đồng Quay phim Lookbook hoặc Chụp phóng sự cưới..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                      />
                    </div>

                    {/* MÃ SỐ HỢP ĐỒNG */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-xxs font-black text-slate-600 uppercase">Mã số Hợp đồng (Auto)</label>
                      <input
                        type="text"
                        value={formContractNumber}
                        onChange={e => setFormContractNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-850 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                      />
                    </div>

                    {/* GIÁ TRỊ HỢP ĐỒNG */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-xxs font-black text-slate-600 uppercase">Giá trị hợp đồng (VNĐ) *</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={formtotalValue || ''}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setFormTotalValue(val);
                          // Auto calculate remaining
                        }}
                        placeholder="Nhập tổng số tiền"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                      />
                    </div>

                    {/* TIỀN CỌC ĐÃ PHÂN HẠNH */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-xxs font-black text-slate-600 uppercase">Số tiền cọc thỏa thuận (VNĐ)</label>
                      <input
                        type="number"
                        min="0"
                        value={formDeposit || ''}
                        onChange={e => setFormDeposit(Number(e.target.value))}
                        placeholder="Ví dụ: 3000000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-indigo-700 font-bold focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. CHIẾT TIẾT PHẠM VI & CHỈNH SỬA */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={14} className="text-emerald-600" />
                    Phạm vi tác nghiệp & Sửa đổi
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* SỐ LẦN CHỈNH SỬA MIỄN PHÍ */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-xxs font-black text-slate-600 uppercase">Sửa đổi miễn phí tối đa</label>
                      <input
                        type="number"
                        min="0"
                        value={formFreeRevisions}
                        onChange={e => setFormFreeRevisions(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                      />
                    </div>

                    {/* PHÍ PHÁT SINH KHI QUÁ HẠN MỨC */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-xxs font-black text-slate-600 uppercase">Phí phát sinh sau hạn mức (đ/lần)</label>
                      <input
                        type="number"
                        min="0"
                        value={formExtraRevisionCost}
                        onChange={e => setFormExtraRevisionCost(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                      />
                    </div>

                    {/* TRẠNG THÁI HỢP ĐỒNG CHỐT */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-xxs font-black text-slate-600 uppercase">Trạng thái Hợp đồng</label>
                      <select
                        value={formStatus}
                        onChange={e => setFormStatus(e.target.value as ContractStatus)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand-green-light focus:bg-white font-bold"
                      >
                        <option value="nháp">Nháp</option>
                        <option value="chờ khách xác nhận">Chờ khách xác nhận</option>
                        <option value="đã ký">Đã ký</option>
                        <option value="đang thực hiện">Đang thực hiện</option>
                        <option value="hoàn thành">Hoàn thành</option>
                        <option value="thanh lý">Thanh lý</option>
                        <option value="hủy">Hủy</option>
                      </select>
                    </div>

                    {/* PHẠM VI CÔNG VIỆC CỤ THỂ */}
                    <div className="md:col-span-12 space-y-1">
                      <label className="text-xxs font-black text-slate-600 uppercase">Mô tả Phạm vi công việc & Sản phẩm bàn giao</label>
                      <textarea
                        rows={3}
                        value={formScopeOfWork}
                        onChange={e => setFormScopeOfWork(e.target.value)}
                        placeholder="Nêu chi tiết những gì bạn cung cấp (Số lượng ảnh, độ dài video, layout makeup, file gốc, link bàn giao...)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                      />
                    </div>

                    {/* THỜI GIAN BÀN GIAO */}
                    <div className="md:col-span-12 space-y-1">
                      <label className="text-xxs font-black text-slate-600 uppercase">Thời gian thực hiện & Ngày bàn giao</label>
                      <textarea
                        rows={2}
                        value={formDeliveryTimeframe}
                        onChange={e => setFormDeliveryTimeframe(e.target.value)}
                        placeholder="Mốc thời gian gửi bản demo nháp và tệp tóm tắt chính thức cuối cùng."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. CÁC ĐIỀU KHOẢN PHÁP CHẾ (CÓ SẴN ĐỂ EDIT) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} className="text-emerald-600" />
                    Hệ điều khoản mẫu (Có thể tùy biến lại)
                  </h4>

                  <div className="space-y-4">
                    
                    {/* ĐIỀU KHOẢN THANH TOÁN */}
                    <div className="space-y-1">
                      <label className="text-xxs font-black text-slate-600 uppercase">Chi tiết điều khoản thanh toán</label>
                      <textarea
                        rows={2}
                        value={formPaymentTerms}
                        onChange={e => setFormPaymentTerms(e.target.value)}
                        placeholder="Cách thức chia đợt, số tài khoản của bạn, thời hạn gia hạn..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                      />
                    </div>

                    {/* ĐIỀU KHOẢN PHẠT HỦY LỊCH */}
                    <div className="space-y-1">
                      <label className="text-xxs font-black text-slate-600 uppercase">Điều khoản hủy lịch đột xuất & phạt hủy hợp đồng</label>
                      <textarea
                        rows={3}
                        value={formCancellationTerms}
                        onChange={e => setFormCancellationTerms(e.target.value)}
                        placeholder="Nêu chế tài khi khách hủy đột xuất, bão gió hoặc dời lịch trễ hạn..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                      />
                    </div>

                    {/* SỞ HỮU BẢN QUYỀN */}
                    <div className="space-y-1">
                      <label className="text-xxs font-black text-slate-600 uppercase">bài toán bản quyền sử dụng hình ảnh/video</label>
                      <textarea
                        rows={3}
                        value={formCopyrightTerms}
                        onChange={e => setFormCopyrightTerms(e.target.value)}
                        placeholder="Quyền sử dụng thuộc về khách hay bạn? Được đăng post portfolio không?"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                      />
                    </div>

                    {/* BẢO MẬT (TÙY CHỌN) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* ĐIỀU KHOẢN BẢO MẬT */}
                      <div className="space-y-1">
                        <label className="text-xxs font-black text-slate-600 uppercase">Điều khoản bảo mật đặc thù (Không bắt buộc)</label>
                        <input
                          type="text"
                          value={formConfidentialityTerms}
                          onChange={e => setFormConfidentialityTerms(e.target.value)}
                          placeholder="Cam kết không đăng sản phẩm lên mạng xã hội..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                        />
                      </div>

                      {/* LIÊN KẾT HỢP ĐỒNG ĐÃ KÝ NGOÀI */}
                      <div className="space-y-1">
                        <label className="text-xxs font-black text-slate-600 uppercase">Liên kết hợp đồng đã ký quét ngoài (DocuSign, GDrive...)</label>
                        <input
                          type="text"
                          value={formExternalSignedLink}
                          onChange={e => setFormExternalSignedLink(e.target.value)}
                          placeholder="https://drive.google.com/file/d/..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-805 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                        />
                      </div>

                    </div>
                  </div>
                </div>

                {/* 5. LIÊN KẾT ĐỐI KHÁP JOB NẾU CÓ */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderOpen size={14} className="text-emerald-600" />
                    Liên kết sổ sách nội bộ
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xxs font-bold text-slate-500 block mb-1">Dự án/Job liên quan trực tiếp</label>
                      <select
                        value={formRelatedProject}
                        onChange={e => setFormRelatedProject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700"
                      >
                        <option value="">-- Không có liên kết --</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xxs font-bold text-slate-500 block mb-1">Báo giá liên quan trực tiếp</label>
                      <select
                        value={formRelatedQuotation}
                        onChange={e => setFormRelatedQuotation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700"
                      >
                        <option value="">-- Không có liên kết --</option>
                        {quotations.map(q => (
                          <option key={q.id} value={q.id}>{q.quoteNumber}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-4 border-t border-slate-150 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-brand-green-light hover:bg-brand-green-dark text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Check size={16} />
                    {editingContract ? 'Lưu thay đổi' : 'Khởi ký Hợp đồng'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL INLINE THÊM KHÁCH HÀNG NHANH */}
      <AnimatePresence>
        {isQuickClientOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-55 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <User className="text-brand-green-light" size={18} />
                  Thêm thành viên khách hàng mới
                </h3>
                <button
                  type="button"
                  onClick={() => setIsQuickClientOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleQuickAddClientSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xxs font-black text-slate-500 uppercase">Tên khách hàng / Đại diện *</label>
                  <input
                    required
                    type="text"
                    value={quickClientName}
                    onChange={e => setQuickClientName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xxs font-black text-slate-500 uppercase">Số điện thoại</label>
                  <input
                    type="text"
                    value={quickClientPhone}
                    onChange={e => setQuickClientPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xxs font-black text-slate-500 uppercase">Địa chỉ Email</label>
                  <input
                    type="email"
                    value={quickClientEmail}
                    onChange={e => setQuickClientEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-805 focus:outline-hidden focus:border-brand-green-light focus:bg-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickClientOpen(false)}
                    className="px-4 py-2 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand-green-light hover:bg-brand-green-dark text-white text-xs font-bold rounded-lg transition-all"
                  >
                    Lưu khách
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
