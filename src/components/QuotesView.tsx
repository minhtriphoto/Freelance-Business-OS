import React, { useState, useMemo } from 'react';
import { Client, Project, Quotation, QuotationItem, QuotationStatus, ServiceType } from '../types';
import { formatDate, formatVND } from '../utils';
import {
  FileText,
  Search,
  Plus,
  ArrowRight,
  Copy,
  Printer,
  ChevronDown,
  Edit2,
  Trash2,
  Sparkles,
  UserPlus,
  Compass,
  ArrowRightLeft,
  X,
  FileCheck,
  Percent,
  Check,
  Maximize2,
  Calendar,
  AlertTriangle,
  Send,
  FileSignature
} from 'lucide-react';

interface QuotesViewProps {
  quotations: Quotation[];
  clients: Client[];
  projects: Project[];
  onAddQuotation: (q: Omit<Quotation, 'id'>) => void;
  onEditQuotation: (q: Quotation) => void;
  onDeleteQuotation: (id: string) => void;
  onAddClient: (newClientData: Omit<Client, 'id' | 'createdAt'>) => string; // returns created client id
  onAddProject: (newProjectData: Omit<Project, 'id'>) => void;
}

// Định nghĩa cấu trúc mẫu báo giá nhanh
interface FastTemplate {
  name: string;
  theme: string;
  items: Omit<QuotationItem, 'id' | 'total'>[];
  paymentTerms: string;
  proposedDepositRate: number;
  deliveryTimeframe: string;
  notes: string;
}

const FAST_TEMPLATES: Record<string, FastTemplate> = {
  ca_nhan: {
    name: 'Gói chụp ảnh cá nhân',
    theme: 'Chân dung / Nghệ thuật cá nhân',
    items: [
      {
        name: 'Chụp ảnh chân dung nghệ thuật ngoại cảnh / indoor',
        description: 'Buổi chụp 1 buổi (3 tiếng), bàn giao toàn bộ file thô đã resize, hỗ trợ chọn 15 ảnh để retouch cao cấp.',
        quantity: 1,
        price: 2500000
      },
      {
        name: 'Dịch vụ trang điểm & làm tóc chuyên nghiệp',
        description: 'Makeup 1 layout chính phù hợp concept trang phục nghệ thuật chụp ngoại cảnh.',
        quantity: 1,
        price: 1000000
      }
    ],
    paymentTerms: 'Đặt cọc tạm ứng trước 50% để giữ lịch bấm máy. 50% còn lại tất toán ngay khi bàn giao tệp ảnh photoshop hoàn thiện.',
    proposedDepositRate: 50,
    deliveryTimeframe: 'Bàn giao file ảnh thô trong vòng 24h sau chụp. Ảnh chỉnh sửa hoàn thành trong vòng 3 ngày kể từ lúc khách chốt số ảnh retouch.',
    notes: 'Báo giá đã bao gồm trang thiết bị đèn di động, chưa bao gồm vé vào cổng hoặc chi phí thuê trang phục riêng.'
  },
  san_pham: {
    name: 'Gói chụp ảnh sản phẩm',
    theme: 'Lookbook / Thương mại sản phẩm',
    items: [
      {
        name: 'Sản xuất hình ảnh Lookbook sản phẩm BST thời trang phim trường',
        description: 'Chụp mẫu Lookbook trong vòng 1 buổi (4 tiếng). Bàn giao 40 ảnh đã qua chỉnh sửa tối ưu màu sắc bối cảnh.',
        quantity: 1,
        price: 5500000
      },
      {
        name: 'Chi phí Setup đạo cụ & Phối bối cảnh studio',
        description: 'Mua hoa tươi bối cảnh, dàn dựng ánh sáng phông nền theo moodboard thống nhất.',
        quantity: 1,
        price: 2000000
      }
    ],
    paymentTerms: 'Tạm ứng trước 40% để giữ chỗ ekip & mua sắm chuẩn bị đạo cụ bối cảnh. 60% còn lại thanh toán khi ký nhận bàn giao tệp ảnh sản phẩm cuối.',
    proposedDepositRate: 40,
    deliveryTimeframe: 'Gửi link lựa ảnh thô sau 24h thực hiện. Bàn giao album chỉnh sửa sau 5-7 ngày làm việc.',
    notes: 'Báo giá chưa bao gồm chi phí thuê mẫu chụp (Model) và chi phí thuê trọn phim trường phim ảnh.'
  },
  quay_reels: {
    name: 'Gói sản xuất video ngắn (Reels/TikTok)',
    theme: 'Sáng tạo chuỗi Reels / Video ngắn',
    items: [
      {
        name: 'Lên Kịch bản chi tiết & Biên kịch nội dung loạt video ngắn',
        description: 'Phát triển outline, xây dựng kịch bản thoại chi tiết cho loạt 5 video ngắn định vị thương hiệu.',
        quantity: 5,
        price: 500000
      },
      {
        name: 'Quay video hiện trường Full combo camera & âm thanh chuyên dụng',
        description: '1 ngày bấm máy thực tế với Sony A7S3/FX3, hệ thống mic thu âm hiện trường không dây, đèn chiếu di động.',
        quantity: 1,
        price: 4500000
      },
      {
        name: 'Hậu kỳ, dựng phim hoàn chỉnh, chèn hiệu ứng, phụ đề & sound design',
        description: 'Dựng ghép video, chỉnh màu cinematic, mix nhạc bản quyền, lồng sub chữ chạy động đẹp mắt.',
        quantity: 5,
        price: 1000000
      }
    ],
    paymentTerms: 'Đợt 1 thanh toán tạm ứng 30% sau khi chốt hoàn toàn kịch bản giấy. Đợt 2 tất toán nốt 70% khi duyệt video thô cuối cùng.',
    proposedDepositRate: 30,
    deliveryTimeframe: 'Bàn giao kịch bản sau 3 ngày. Bàn giao 5 video demo sau 10 ngày kể từ ngày quay thực tế.',
    notes: 'Báo giá hỗ trợ khách sửa đổi hậu kỳ tối đa 2 lần/video hoàn toàn miễn phí.'
  },
  dung_video: {
    name: 'Gói hậu kỳ / Dựng video chuyên sâu',
    theme: 'Hậu kỳ / Edit video',
    items: [
      {
        name: 'Dựng video tư liệu doanh nghiệp / Video Youtube / Vlog',
        description: 'Cắt dựng kết cấu mạch truyện, lồng âm thanh nền bối cảnh, sắp xếp nguồn video tư liệu thô có sẵn của khách.',
        quantity: 1,
        price: 3000000
      },
      {
        name: 'Thiết kế Ảnh Thumbnail Youtube & Subtitle chi tiết đồng bộ',
        description: 'Thiết kế ảnh đại diện nổi bật kích thích tỷ lệ click, chèn Vietsub tỉ mỉ chính xác toàn bộ clip.',
        quantity: 1,
        price: 1000000
      }
    ],
    paymentTerms: 'Thanh toán tạm ứng 50% khi bàn giao kho tư liệu thô đầu vào. 50% tất toán ngay khi xuất file gốc 4K bàn giao.',
    proposedDepositRate: 50,
    deliveryTimeframe: 'Bàn giao bản demo dựng số 1 sau 4 ngày nhận đủ học liệu. Bản cuối cùng sau 2 ngày xử lý phản hồi sửa đổi.',
    notes: 'Khách hàng gửi file qua Google Drive chất lượng cao ổn định.'
  },
  social_design: {
    name: 'Gói thiết kế nhận Social Media Pack',
    theme: 'Thiết kế Social thương hiệu',
    items: [
      {
        name: 'Thiết kế bộ ấn phẩm Facebook/Instagram Grid (Bento Grid)',
        description: 'Gói thiết kế bộ 9 ô vuông layout đồng bộ giúp trang fanpage có thẩm mỹ nhận diện thương hiệu tuyệt vời.',
        quantity: 1,
        price: 4500000
      },
      {
        name: 'Thiết kế Banner bìa Page & Avatar nhận diện kết hợp',
        description: 'Bản thiết kế chuẩn kích thước máy tính và điện thoại, đồng bộ thông điệp mùa chiến dịch thương mại.',
        quantity: 1,
        price: 1000000
      }
    ],
    paymentTerms: 'Thanh toán chuyển khoản cọc 50% sau khi thống nhất Phong cách thiết kế (Moodboard). 50% tất toán trước khi xuất tệp thiết kế gốc (.Ai / .Psd).',
    proposedDepositRate: 50,
    deliveryTimeframe: 'Gửi phương án thiết kế mẫu sau 4 ngày. Đóng gói bàn giao toàn bộ sản phẩm sau 6 ngày.',
    notes: 'Cung cấp file thiết kế gốc chất lượng cao kèm đường dẫn sử dụng Canva tiện lợi.'
  },
  media_tron_goi: {
    name: 'Gói dịch vụ Combo Media trọn gói',
    theme: 'Phóng sự cưới / Sự kiện Studio trọn gói',
    items: [
      {
        name: 'Quay chụp phóng sự sự kiện trọng đại trọn gói 2 ngày',
        description: 'Ekip 1 camera chính + 1 thợ chụp chuyên nghiệp bám sát sự kiện, trang bị đầy đủ gimbal, đèn flash công suất lớn.',
        quantity: 1,
        price: 18000000
      },
      {
        name: 'Thiết kế cuốn album kỷ niệm Photobook & Hậu kỳ phim Highlight',
        description: 'Album photobook cứng 30 trang cao cấp ép photorag giấy lụa, phim Highlight 3-5 phút chất lượng điện ảnh màu cực chất.',
        quantity: 1,
        price: 7000000
      }
    ],
    paymentTerms: 'Thanh toán làm 3 đợt. Đợt 1 đặt cọc giữ ekip 30% ngay khi ký báo giá. Đợt 2 thanh toán 40% trực tiếp tại ngày diễn ra sự kiện. Đợt 3 cọc nốt 30% khi nhận link duyệt ảnh album.',
    proposedDepositRate: 30,
    deliveryTimeframe: 'Bàn giao link 100 tấm ảnh thô chỉnh màu sau 48h. Album thiết kế photobook cứng và Video Highlight bàn giao sau 15 ngày làm việc.',
    notes: 'Bao gồm chi phí ăn ở di chuyển của ekip trong phạm vi bán kính 15km nội thành.'
  }
};

export default function QuotesView({
  quotations,
  clients,
  projects,
  onAddQuotation,
  onEditQuotation,
  onDeleteQuotation,
  onAddClient,
  onAddProject
}: QuotesViewProps) {
  // Bộ lọc tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  // Trạng thái điều hướng chế độ xem
  // 'list' | 'create' | 'edit' | 'preview_client' | 'contract_view'
  const [activeSubView, setActiveSubView] = useState<'list' | 'create' | 'edit' | 'preview_client' | 'contract_view'>('list');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // States dành cho Form Báo giá
  const [formQuoteNumber, setFormQuoteNumber] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formCreatedDate, setFormCreatedDate] = useState('');
  const [formExpiredDate, setFormExpiredDate] = useState('');
  const [formItems, setFormItems] = useState<QuotationItem[]>([]);
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formPaymentTerms, setFormPaymentTerms] = useState('');
  const [formProposedDepositRate, setFormProposedDepositRate] = useState<number>(30);
  const [formDeliveryTimeframe, setFormDeliveryTimeframe] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<QuotationStatus>('nháp');

  // Thêm nhanh khách hàng mới trong form
  const [showQuickClientModal, setShowQuickClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientType, setNewClientType] = useState<'cá nhân' | 'doanh nghiệp' | 'khách quen' | 'khách tiềm năng'>('cá nhân');

  // States phục vụ cho Đổi từ Báo giá thành Dự án/Job
  const [showConvertToProjectModal, setShowConvertToProjectModal] = useState(false);
  const [convertProjectTitle, setConvertProjectTitle] = useState('');
  const [convertProjectService, setConvertProjectService] = useState<ServiceType>('Combo media');
  const [convertProjectShootDate, setConvertProjectShootDate] = useState('');
  const [convertProjectDueDate, setConvertProjectDueDate] = useState('');

  // Tải mẫu nhanh vào form
  const applyFastTemplate = (key: keyof typeof FAST_TEMPLATES) => {
    const template = FAST_TEMPLATES[key];
    const loadedItems: QuotationItem[] = template.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price
    }));

    setFormItems(loadedItems);
    setFormPaymentTerms(template.paymentTerms);
    setFormProposedDepositRate(template.proposedDepositRate);
    setFormDeliveryTimeframe(template.deliveryTimeframe);
    setFormNotes(template.notes);
  };

  // Tính tiền tự động trong form
  const quoteTotals = useMemo(() => {
    const totalBefore = formItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = Number(formDiscount) || 0;
    const totalAfter = Math.max(0, totalBefore - discount);
    const depositAmount = Math.round((totalAfter * formProposedDepositRate) / 100);

    return {
      before: totalBefore,
      after: totalAfter,
      deposit: depositAmount
    };
  }, [formItems, formDiscount, formProposedDepositRate]);

  // Sinh mã báo giá tự động
  const generateQuoteNumber = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    return `BG-${year}-${rand}`;
  };

  // Khởi phom tạo mới
  const initCreateQuote = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultExpired = new Date();
    defaultExpired.setDate(defaultExpired.getDate() + 14); // Mặc định hết hạn sau 14 ngày
    const expiredStr = defaultExpired.toISOString().split('T')[0];

    setFormQuoteNumber(generateQuoteNumber());
    setFormClientId('');
    setFormProjectId('');
    setFormCreatedDate(today);
    setFormExpiredDate(expiredStr);
    setFormItems([{ id: `qi-init-${Date.now()}`, name: '', description: '', quantity: 1, price: 0, total: 0 }]);
    setFormDiscount(0);
    setFormPaymentTerms('Đặt cọc trước % để triển khai hợp đồng. Phần còn lại thanh toán dứt điểm khi nghiệm thu bàn giao.');
    setFormProposedDepositRate(30);
    setFormDeliveryTimeframe('Sau 5-7 ngày làm việc kể từ thời điểm chốt concept và quay chụp thực tế.');
    setFormNotes('');
    setFormStatus('nháp');

    setActiveSubView('create');
  };

  // Khởi phom chỉnh sửa
  const initEditQuote = (q: Quotation) => {
    setSelectedQuotation(q);
    setFormQuoteNumber(q.quoteNumber);
    setFormClientId(q.clientId);
    setFormProjectId(q.projectId || '');
    setFormCreatedDate(q.createdDate);
    setFormExpiredDate(q.expiredDate);
    setFormItems(q.items.map(item => ({ ...item })));
    setFormDiscount(q.discount);
    setFormPaymentTerms(q.paymentTerms);
    setFormProposedDepositRate(q.proposedDepositRate);
    setFormDeliveryTimeframe(q.deliveryTimeframe);
    setFormNotes(q.notes);
    setFormStatus(q.status);

    setActiveSubView('edit');
  };

  // Quản trị danh sách hạng mục trong form
  const addFormItem = () => {
    setFormItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: '',
        description: '',
        quantity: 1,
        price: 0,
        total: 0
      }
    ]);
  };

  const updateFormItem = (itemId: string, field: keyof QuotationItem, value: any) => {
    setFormItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          const q = field === 'quantity' ? Number(value) : item.quantity;
          const p = field === 'price' ? Number(value) : item.price;
          updatedItem.total = q * p;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removeFormItem = (itemId: string) => {
    if (formItems.length <= 1) {
      alert('Báo giá tối thiểu phải chứa 1 hạng mục dịch vụ.');
      return;
    }
    setFormItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Lưu nhanh khách hàng mới
  const handleSaveQuickClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newCId = onAddClient({
      name: newClientName,
      phone: newClientPhone,
      email: newClientEmail,
      type: newClientType as any,
      source: 'khác',
      interestedServices: ['Combo dịch vụ'],
      status: 'lead mới',
      priority: 'trung bình',
      notes: 'Khách hàng tạo nhanh trực tiếp trong Module Báo giá.'
    });

    setFormClientId(newCId);
    setShowQuickClientModal(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
  };

  // Lưu Báo Giá
  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId) {
      alert('Vui lòng chọn khách hàng thụ hưởng báo giá.');
      return;
    }

    const invalidItems = formItems.filter(item => !item.name.trim() || item.price <= 0);
    if (invalidItems.length > 0) {
      alert('Vui lòng điền đầy đủ Tên hạng mục và Đơn giá > 0 cho toàn bộ danh sách dịch vụ.');
      return;
    }

    const compiledQuoteData = {
      quoteNumber: formQuoteNumber,
      clientId: formClientId,
      projectId: formProjectId || undefined,
      createdDate: formCreatedDate,
      expiredDate: formExpiredDate,
      items: formItems,
      discount: Number(formDiscount) || 0,
      totalBeforeDiscount: quoteTotals.before,
      totalAfterDiscount: quoteTotals.after,
      paymentTerms: formPaymentTerms,
      proposedDepositRate: formProposedDepositRate,
      depositAmount: quoteTotals.deposit,
      deliveryTimeframe: formDeliveryTimeframe,
      notes: formNotes,
      status: formStatus
    };

    if (activeSubView === 'create') {
      onAddQuotation(compiledQuoteData);
      alert(`Đã lưu thành công báo giá mới mang số hiệu ${formQuoteNumber}!`);
    } else if (activeSubView === 'edit' && selectedQuotation) {
      onEditQuotation({
        ...compiledQuoteData,
        id: selectedQuotation.id
      });
      alert(`Đã cập nhật thành công báo giá ${selectedQuotation.quoteNumber}!`);
    }

    setActiveSubView('list');
    setSelectedQuotation(null);
  };

  // Copy Báo giá dạng text truyền thông (Zalo/Facebook)
  const handleCopyQuoteToClipboard = (quote: Quotation) => {
    const clientObj = clients.find(c => c.id === quote.clientId);
    const clientName = clientObj ? clientObj.name : 'Quý đối tác';
    const clientPhone = clientObj ? ` (${clientObj.phone})` : '';

    let text = `====================================\n`;
    text += `   📄 BÁO GIÁ DỊCH VỤ SÁNG TẠO SỐ HỆ\n`;
    text += `====================================\n\n`;
    text += `Mã báo giá: ${quote.quoteNumber}\n`;
    text += `Ngày tạo: ${formatDate(quote.createdDate)}\n`;
    text += `Hết hạn: ${formatDate(quote.expiredDate)}\n`;
    text += `Khách hàng: ${clientName}${clientPhone}\n\n`;
    text += `------------------------------------\n`;
    text += `HẠNG MỤC CHI TIẾT:\n`;

    quote.items.forEach((item, index) => {
      text += `${index + 1}. ${item.name}\n`;
      if (item.description) text += `   - Mô tả: ${item.description}\n`;
      text += `   - SL: ${item.quantity} | Đơn giá: ${formatVND(item.price)} | Thành tiền: ${formatVND(item.total)}\n`;
    });

    text += `------------------------------------\n`;
    text += `Tổng chi phí gộp: ${formatVND(quote.totalBeforeDiscount)}\n`;
    if (quote.discount > 0) {
      text += `Khuyến mãi chiết khấu: -${formatVND(quote.discount)}\n`;
    }
    text += `TỔNG TẤT ĐƯỢC CHỐT: ${formatVND(quote.totalAfterDiscount)}\n\n`;
    text += `💵 ĐỀ XUẤT ĐẶT CỌC: ${quote.proposedDepositRate}% (~${formatVND(quote.depositAmount)})\n`;
    text += `⏳ THỜI GIAN BÀN GIAO: ${quote.deliveryTimeframe}\n`;
    text += `💳 ĐIỀU KIỆN THANH TOÁN:\n   ${quote.paymentTerms}\n\n`;
    if (quote.notes) {
      text += `📌 GHI CHÚ BỔ SUNG:\n   ${quote.notes}\n\n`;
    }
    text += `Xin chân thành cảm ơn quý khách hàng đã đón xem & ủng hộ dịch vụ!\n`;
    text += `====================================`;

    navigator.clipboard.writeText(text);
    alert('Đã sao chép nội dung báo giá thu gọn vào Clipboard! Bạn có thể dán (Ctrl+V) sang Zalo/Facebook để gửi khách.');
  };

  // Mở Pop đổi báo giá sang Job
  const handleOpenConvertToProject = (quote: Quotation) => {
    const clientObj = clients.find(c => c.id === quote.clientId);
    setSelectedQuotation(quote);
    setConvertProjectTitle(`Sản xuất từ Báo giá ${quote.quoteNumber} - ${clientObj?.name || ''}`);
    setConvertProjectShootDate('');
    setConvertProjectDueDate('');
    setShowConvertToProjectModal(true);
  };

  // Xác nhận đổi báo giá sang Job/Project
  const handleConfirmConvertToProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotation) return;

    // 1. Tạo project mới
    const briefText = selectedQuotation.items.map(it => `+ ${it.name} (SL: ${it.quantity}): ${it.description}`).join('\n');
    onAddProject({
      title: convertProjectTitle,
      clientId: selectedQuotation.clientId,
      serviceType: convertProjectService,
      price: selectedQuotation.totalAfterDiscount,
      deposit: selectedQuotation.depositAmount,
      depositDate: new Date().toISOString().split('T')[0],
      finalPayment: selectedQuotation.totalAfterDiscount - selectedQuotation.depositAmount,
      finalPaymentStatus: 'unpaid',
      shootDate: convertProjectShootDate || undefined,
      dueDate: convertProjectDueDate || undefined,
      status: 'đang chuẩn bị',
      notes: `Sinh tự động từ Báo giá ${selectedQuotation.quoteNumber} đã ký duyệt.\nĐiều khoản thanh toán: ${selectedQuotation.paymentTerms}\nBàn giao: ${selectedQuotation.deliveryTimeframe}\nGhi chú báo giá: ${selectedQuotation.notes}`,
      brief: briefText,
      contractNumber: selectedQuotation.quoteNumber,
      priority: 'trung bình',
      receivedDate: new Date().toISOString().split('T')[0],
      taxDeclared: false
    });

    // 2. Chuyển trạng thái báo giá sang 'đã duyệt' đề phòng trường hợp quên chốt
    onEditQuotation({
      ...selectedQuotation,
      status: 'đã duyệt'
    });

    alert(`Đã khởi tạo Job dự án mới thành công dựa trên Báo giá ${selectedQuotation.quoteNumber}! Bạn có thể chuyển qua tab Dự án để quản lý tiến độ.`);
    setShowConvertToProjectModal(false);
    setSelectedQuotation(null);
  };

  // Khôi phục bản in tự nhiên của trình duyệt
  const triggerPrint = () => {
    window.print();
  };

  // Lọc dữ liệu hiển thị
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchSearch = q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      const matchClient = clientFilter === 'all' || q.clientId === clientFilter;

      return matchSearch && matchStatus && matchClient;
    });
  }, [quotations, searchTerm, statusFilter, clientFilter]);

  // Thống kê sơ bộ
  const summaryCounters = useMemo(() => {
    return {
      draft: quotations.filter(q => q.status === 'nháp').length,
      sent: quotations.filter(q => q.status === 'đã gửi').length,
      underReview: quotations.filter(q => q.status === 'khách đang xem xét').length,
      approved: quotations.filter(q => q.status === 'đã duyệt').length,
      rejected: quotations.filter(q => q.status === 'bị từ chối').length,
      expired: quotations.filter(q => q.status === 'hết hạn').length,
      totalValue: quotations.filter(q => q.status === 'đã duyệt').reduce((sum, q) => sum + q.totalAfterDiscount, 0)
    };
  }, [quotations]);

  return (
    <div className="space-y-6" id="quotes-view-module">
      {/* ----------------- TRANG CHỦ / DANH SÁCH BÁO GIÁ ----------------- */}
      {activeSubView === 'list' && (
        <>
          {/* Header hành động */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                <FileText className="text-emerald-500" size={22} /> Quản lý Báo giá Freelancer
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Lập báo giá nhanh, gửi liên kết Zalo/Facebook, xuất biên bản in PDF hoặc chuyển giao trực tiếp thành Hợp đồng & Job đang làm việc.
              </p>
            </div>
            <button
              onClick={initCreateQuote}
              className="bg-brand-green-mid hover:bg-brand-green-dark text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all self-stretch sm:self-auto justify-center cursor-pointer shadow-sm"
              id="btn-create-quote"
            >
              <Plus size={16} /> Lập báo giá mới
            </button>
          </div>

          {/* Grid thống kê mini */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Đã ký duyệt</span>
              <p className="text-base font-black text-emerald-600 mt-1">{summaryCounters.approved}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Đang xem xét</span>
              <p className="text-base font-black text-amber-500 mt-1">{summaryCounters.underReview}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Bản nháp</span>
              <p className="text-base font-black text-slate-500 mt-1">{summaryCounters.draft}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Đã gửi</span>
              <p className="text-base font-black text-indigo-500 mt-1">{summaryCounters.sent}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-500 mt-0.5 block font-medium font-semibold red">Bị từ chối</span>
              <p className="text-base font-black text-rose-500 mt-1">{summaryCounters.rejected}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Hết hiệu lực</span>
              <p className="text-base font-black text-zinc-400 mt-1">{summaryCounters.expired}</p>
            </div>
            <div className="col-span-2 md:col-span-4 lg:col-span-1 bg-brand-green-dark p-3.5 rounded-xl text-white">
              <span className="text-[9px] uppercase tracking-wider text-slate-300 font-bold block">Tổng tiền duyệt</span>
              <p className="text-sm font-bold text-brand-accent mt-1 text-nowrap">{formatVND(summaryCounters.totalValue)}</p>
            </div>
          </div>

          {/* Tìm kiếm & Bộ lọc */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm tên dịch vụ, mã báo giá..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green-mid outline-hidden"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-brand-green-mid bg-slate-50 flex-1 md:flex-initial"
              >
                <option value="all">Mọi trạng thái</option>
                <option value="nháp">Bản nháp</option>
                <option value="đã gửi">Đã gửi khách</option>
                <option value="khách đang xem xét">Khách đang xem xét</option>
                <option value="đã duyệt">Đã duyệt</option>
                <option value="bị từ chối">Bị từ chối</option>
                <option value="hết hạn">Lịch hết hạn</option>
              </select>

              <select
                value={clientFilter}
                onChange={e => setClientFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-brand-green-mid bg-slate-50 flex-1 md:flex-initial max-w-[150px] md:max-w-xs"
              >
                <option value="all">Mọi khách hàng</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Danh sách Báo Giá */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            {filteredQuotations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <FileText size={40} className="mx-auto text-slate-300" />
                <p className="text-xs">Không tìm thấy báo giá nào phù hợp bộ lọc.</p>
                <button
                  onClick={initCreateQuote}
                  className="text-xs font-bold text-brand-green-mid hover:underline"
                >
                  Nhấp để lập báo giá đầu tiên
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-150 text-slate-500 font-bold">
                      <th className="p-4">Mã / Ngày tạo</th>
                      <th className="p-4">Khách hàng hưởng thụ</th>
                      <th className="p-4">Hạng mục chính</th>
                      <th className="p-4 text-right">Tổng tiền trị</th>
                      <th className="p-4 text-center">Trạng thái</th>
                      <th className="p-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQuotations.map(q => {
                      const clientObj = clients.find(c => c.id === q.clientId);
                      const relatedProject = q.projectId ? projects.find(p => p.id === q.projectId) : null;
                      
                      const statusStyles = (() => {
                        switch (q.status) {
                          case 'nháp': return 'bg-slate-50 text-slate-650 ring-slate-200/50';
                          case 'đã gửi': return 'bg-indigo-50 text-indigo-700 ring-indigo-100';
                          case 'khách đang xem xét': return 'bg-amber-50 text-amber-700 ring-amber-100';
                          case 'đã duyệt': return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
                          case 'bị từ chối': return 'bg-rose-50 text-rose-700 ring-rose-100';
                          case 'hết hạn': return 'bg-slate-100 text-slate-450 ring-slate-200';
                          default: return 'bg-gray-50';
                        }
                      })();

                      return (
                        <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-slate-800 tracking-tight block">
                              {q.quoteNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Tạo: {formatDate(q.createdDate)}
                            </span>
                            {q.expiredDate && (
                              <span className="text-[9px] text-rose-400 font-medium block">
                                Hạn: {formatDate(q.expiredDate)}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {clientObj ? (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-700 block">{clientObj.name}</span>
                                <span className="text-[11px] text-slate-400">{clientObj.phone}</span>
                              </div>
                            ) : (
                              <span className="text-rose-400 font-medium italic">Khách hàng bị xóa</span>
                            )}
                          </td>
                          <td className="p-4 max-w-xs">
                            <div className="text-slate-700 font-medium truncate">
                              {q.items[0]?.name || 'Không khả dụng'}
                            </div>
                            {q.items.length > 1 && (
                              <div className="text-[10px] text-slate-450 mt-1">
                                và {q.items.length - 1} hạng mục thương lượng khác
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right font-black text-slate-850">
                            {formatVND(q.totalAfterDiscount)}
                            {q.discount > 0 && (
                              <span className="text-[9px] text-red-400 line-through font-normal block">
                                {formatVND(q.totalBeforeDiscount)}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ring-1 ${statusStyles}`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-y-2 lg:space-y-0">
                            <div className="flex justify-end gap-1.5 flex-wrap">
                              <button
                                onClick={() => {
                                  setSelectedQuotation(q);
                                  setActiveSubView('preview_client');
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                                title="Xem dạng đẹp gửi khách"
                              >
                                <Maximize2 size={11} /> Gửi khách
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedQuotation(q);
                                  setActiveSubView('contract_view');
                                }}
                                className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                                title="Mẫu hợp đồng pháp lý"
                              >
                                <FileSignature size={11} /> Hợp đồng
                              </button>

                              <button
                                onClick={() => handleCopyQuoteToClipboard(q)}
                                className="px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-650 transition-all cursor-pointer"
                                title="Sao chép văn bản gửi Zalo nhanh"
                              >
                                <Copy size={12} />
                              </button>

                              <button
                                onClick={() => initEditQuote(q)}
                                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-650 transition-all cursor-pointer"
                                title="Sửa báo giá"
                              >
                                <Edit2 size={12} />
                              </button>

                              {q.status === 'đã duyệt' && !q.projectId && (
                                <button
                                  onClick={() => handleOpenConvertToProject(q)}
                                  className="px-2.5 py-1.5 bg-emerald-605 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                                  title="Chuyển báo giá này thành Job sản xuất thực tế"
                                >
                                  <ArrowRightLeft size={11} /> Tạo Job
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn xóa báo giá ${q.quoteNumber}? Hành động này không thể khôi phục.`)) {
                                    onDeleteQuotation(q.id);
                                  }
                                }}
                                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                                title="Xóa báo giá"
                              >
                                <Trash2 size={12} />
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
        </>
      )}

      {/* ----------------- SUBVIEW: TẠO MỚI / CHỈNH SỬA BÁO GIÁ ----------------- */}
      {(activeSubView === 'create' || activeSubView === 'edit') && (
        <form onSubmit={handleSaveQuotation} className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-150">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Sparkles className="text-amber-500 animate-pulse" size={18} />
              {activeSubView === 'create' ? 'Lập báo giá mới' : `Chỉnh sửa báo giá ${formQuoteNumber}`}
            </h3>
            <button
              type="button"
              onClick={() => {
                setActiveSubView('list');
                setSelectedQuotation(null);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột trái: Form thông tin chung & dịch vụ */}
            <div className="lg:col-span-2 space-y-6">
              {/* Box 1: Chọn gói mẫu nhanh */}
              <div className="bg-gradient-to-br from-brand-green-dark via-emerald-950 to-teal-950 text-white p-5 rounded-2xl space-y-3 shadow-md">
                <div className="flex items-center gap-2 text-brand-accent text-xs font-black uppercase tracking-wider">
                  <Sparkles size={14} /> Trợ lý tạo mẫu báo giá nhanh
                </div>
                <p className="text-[11px] text-slate-300">
                  Chọn một trong các mẫu truyền thông phổ biến ở dưới để điền tự động kịch bản dịch vụ, đơn giá tối ưu và các điều kiện nghiệm thu.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {Object.entries(FAST_TEMPLATES).map(([key, temp]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyFastTemplate(key as any)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/5 rounded-xl text-left text-[11px] transition-all space-y-0.5 cursor-pointer"
                    >
                      <span className="font-bold block text-white">{temp.name}</span>
                      <span className="text-[9px] text-slate-400 block">{temp.theme}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Box 2: Thông tin khách hàng & Báo giá */}
              <div className="bg-white p-6 rounded-2xl border border-slate-150 space-y-4 shadow-2xs">
                <h4 className="font-bold text-xs text-slate-700 border-b border-slate-100 pb-2">I. THÔNG TIN PHÁP DANH & NGÀY THUẬT</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Khách hàng */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 block">Khách hàng thụ nhận *</label>
                    <div className="flex gap-2">
                      <select
                        required
                        value={formClientId}
                        onChange={e => setFormClientId(e.target.value)}
                        className="flex-1 p-2.5 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-brand-green-mid"
                      >
                        <option value="">-- Chọn khách hàng sẵn có --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowQuickClientModal(true)}
                        className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-650 flex items-center justify-center cursor-pointer"
                        title="Tạo nhanh khách mới"
                      >
                        <UserPlus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Mã báo giá */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 block">Mã số báo giá (Tự động)</label>
                    <input
                      type="text"
                      required
                      value={formQuoteNumber}
                      onChange={e => setFormQuoteNumber(e.target.value)}
                      placeholder="Mã báo giá"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 outline-hidden"
                    />
                  </div>

                  {/* Ngày lập */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 block">Ngày lập báo giá</label>
                    <input
                      type="date"
                      required
                      value={formCreatedDate}
                      onChange={e => setFormCreatedDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-brand-green-mid"
                    />
                  </div>

                  {/* Ngày hết hạn */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 block">Có giá trị hiệu lực đến ngày</label>
                    <input
                      type="date"
                      required
                      value={formExpiredDate}
                      onChange={e => setFormExpiredDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-brand-green-mid"
                    />
                  </div>
                </div>
              </div>

              {/* Box 3: Danh sách hạng mục */}
              <div className="bg-white p-6 rounded-2xl border border-slate-150 space-y-4 shadow-2xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-xs text-slate-700">II. THUYẾT MINH HẠNG MỤC DỊCH VỤ</h4>
                  <button
                    type="button"
                    onClick={addFormItem}
                    className="text-xs font-bold text-brand-green-mid hover:text-brand-green-dark flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Thêm khoản dịch vụ
                  </button>
                </div>

                <div className="space-y-4 divide-y divide-slate-105">
                  {formItems.map((item, index) => (
                    <div key={item.id} className="pt-4 first:pt-0 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          Hạng mục #{index + 1}
                        </span>
                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFormItem(item.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div className="md:col-span-3 space-y-1">
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: Chụp ảnh Lookbook BST hè..."
                            value={item.name}
                            onChange={e => updateFormItem(item.id, 'name', e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green-mid font-semibold outline-hidden"
                            id={`input-item-name-${index}`}
                          />
                        </div>
                        <div className="md:col-span-1 space-y-1">
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Số lượng"
                            value={item.quantity}
                            onChange={e => updateFormItem(item.id, 'quantity', e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green-mid outline-hidden"
                            id={`input-item-qty-${index}`}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="Đơn giá (VNĐ)"
                            value={item.price}
                            onChange={e => updateFormItem(item.id, 'price', e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green-mid font-bold text-slate-800 outline-hidden"
                            id={`input-item-price-${index}`}
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Mô tả kỹ thuật, đạo cụ, cam kết số lượng files bàn giao..."
                        value={item.description}
                        onChange={e => updateFormItem(item.id, 'description', e.target.value)}
                        className="w-full p-2 border border-slate-150 rounded-lg text-[11px] text-slate-500 focus:ring-1 focus:ring-brand-green-mid outline-hidden"
                        id={`input-item-desc-${index}`}
                      />

                      <div className="text-right text-[11px] text-slate-450">
                        Thành tiền: <span className="font-bold text-slate-700">{formatVND(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 4: Điều kiện & Ghi chú */}
              <div className="bg-white p-6 rounded-2xl border border-slate-150 space-y-4 shadow-2xs">
                <h4 className="font-bold text-xs text-slate-700 border-b border-slate-100 pb-2">III. ĐIỀU KHOẢN GIAO DỊCH & BÀN GIAO</h4>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">Điều kiện thanh toán chi tiết</label>
                    <textarea
                      rows={2}
                      value={formPaymentTerms}
                      onChange={e => setFormPaymentTerms(e.target.value)}
                      placeholder="Ví dụ: Đặt cọc 30% giữ chân ekip, phần còn lại thanh toán dứt điểm khi duyệt file watermark cuối..."
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green-mid outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 block">Tiến độ cọc đề xuất (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formProposedDepositRate}
                        onChange={e => setFormProposedDepositRate(Number(e.target.value))}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green-mid outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 block">Thời gian bàn giao sản phẩm</label>
                      <input
                        type="text"
                        value={formDeliveryTimeframe}
                        onChange={e => setFormDeliveryTimeframe(e.target.value)}
                        placeholder="Ví dụ: Sau 5 ngày chụp"
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green-mid outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">Ghi chú bổ sung khác</label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      placeholder="Ví dụ: Chưa bao gồm phí trang phục hoặc phát sinh giờ ngoài dự tính..."
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-green-mid outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải: Tổng hợp chi phí & Trạng thái lưu trữ */}
            <div className="space-y-6">
              {/* Box tổng kết tài chính */}
              <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4 sticky top-6">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-2">
                  Tóm tắt báo giá tài chính
                </h4>
                
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tiền hàng thuần:</span>
                    <span className="font-semibold text-slate-850">{formatVND(quoteTotals.before)}</span>
                  </div>

                  {/* Nhập giảm giá */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Chiết khấu / Giảm giá (VNĐ)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formDiscount}
                        onChange={e => setFormDiscount(Number(e.target.value))}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-rose-600 outline-hidden focus:ring-1 focus:ring-brand-green-mid"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 my-2 pt-2"></div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">TỔNG SAU CHIẾT KHẤU:</span>
                    <span className="text-base font-black text-brand-green-dark">{formatVND(quoteTotals.after)}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl space-y-2 mt-2 border border-slate-100">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Cọc đề nghị ({formProposedDepositRate}%):</span>
                      <span className="font-bold text-slate-705 text-right">{formatVND(quoteTotals.deposit)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Số tiền đợt cuối:</span>
                      <span className="text-slate-600">{formatVND(quoteTotals.after - quoteTotals.deposit)}</span>
                    </div>
                  </div>

                  {/* Trạng thái duyệt của báo giá */}
                  <div className="space-y-1 pt-3">
                    <label className="text-[11px] font-bold text-slate-500 block">Xét duyệt trạng thái</label>
                    <select
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value as QuotationStatus)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-brand-green-mid font-bold bg-slate-50 text-slate-800"
                    >
                      <option value="nháp">Bản nháp</option>
                      <option value="đã gửi">Đã gửi cho khách hàng</option>
                      <option value="khách đang xem xét">Khách đang thương lượng</option>
                      <option value="đã duyệt">Khách đã chốt duyệt</option>
                      <option value="bị từ chối">Khách từ chối báo giá</option>
                      <option value="hết hạn">Hết hiệu lực báo giá</option>
                    </select>
                  </div>

                  {/* Nút lưu */}
                  <div className="pt-4 flex flex-col gap-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-brand-green-mid hover:bg-brand-green-dark text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      id="form-btn-submit"
                    >
                      <FileCheck size={15} />
                      {activeSubView === 'create' ? 'Cấp phát Báo giá' : 'Cập nhật thay đổi'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubView('list');
                        setSelectedQuotation(null);
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ----------------- SUBVIEW: PREVIEW DÀNG ĐẸP ĐỂ GỬI KHÁCH ----------------- */}
      {activeSubView === 'preview_client' && selectedQuotation && (
        <div className="space-y-6">
          {/* Thanh tác vụ đầu trang */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-150 print:hidden shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveSubView('list');
                  setSelectedQuotation(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Trở về
              </button>
              <span className="text-xs text-slate-400">|</span>
              <p className="text-xs font-bold text-slate-500">BẢN XEM TRƯỚC HÓA ĐƠN BÁO GIÁ ĐỂ GỬI KHÁCH hàng</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                selectedQuotation.status === 'đã duyệt' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedQuotation.status}
              </span>
              <button
                onClick={triggerPrint}
                className="bg-brand-green-mid hover:bg-brand-green-dark text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer size={13} /> In / Xuất PDF
              </button>
              <button
                onClick={() => handleCopyQuoteToClipboard(selectedQuotation)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy size={13} /> Copy gửi nhanh
              </button>
            </div>
          </div>

          {/* CHÍNH THỂ BẢN IN / BÁO GIÁ TRỰC QUAN ĐẸP MẮT */}
          <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-lg max-w-4xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0">
            {/* Logo, Thương hiệu & Số báo giá */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-600 p-2 rounded-xl text-white">
                    <FileText size={22} />
                  </span>
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-800">FREELANCE OS STUDIO</h1>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Nền tảng sáng tạo media chuyên nghiệp</p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-450 space-y-0.5">
                  <p>Email: contact@freelanceos.vn | Hotline: +(84) 93 123 456</p>
                  <p>Địa chỉ văn phòng: Tòa nhà Sáng tạo Số, Quận 1, TPHCM</p>
                </div>
              </div>

              <div className="text-left md:text-right space-y-1 md:self-end">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Hóa đơn báo giá ý</span>
                <p className="text-xl font-bold font-mono tracking-tight text-slate-800">{selectedQuotation.quoteNumber}</p>
                <p className="text-[11px] text-slate-450">Ngày ban hành: {formatDate(selectedQuotation.createdDate)}</p>
                {selectedQuotation.expiredDate && (
                  <p className="text-[11px] text-rose-500 font-semibold">Hiệu lực chốt đến: {formatDate(selectedQuotation.expiredDate)}</p>
                )}
              </div>
            </div>

            {/* Thông tin đối tác */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">ĐƠN VỊ THỤ HƯỞNG</span>
                {(() => {
                  const clientObj = clients.find(c => c.id === selectedQuotation.clientId);
                  if (clientObj) {
                    return (
                      <>
                        <h3 className="font-bold text-sm text-slate-800">{clientObj.name}</h3>
                        <p className="text-xs text-slate-500">Điện thoại: {clientObj.phone || 'Chưa cung cấp'}</p>
                        <p className="text-xs text-slate-500">Email: {clientObj.email || 'Chưa cung cấp'}</p>
                        <p className="text-xs text-slate-500">Loại hình: <span className="capitalize">{clientObj.type}</span></p>
                      </>
                    );
                  }
                  return <p className="text-xs text-rose-400 font-medium">Khách hàng không khả dụng / Đã xóa khỏi máy</p>;
                })()}
              </div>
              <div className="space-y-1 md:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">ĐƠN VỊ CUNG CẤP</span>
                <h3 className="font-bold text-sm text-slate-850">Freelancer Creator Minh Tri</h3>
                <p className="text-xs text-slate-500">Số tài khoản: 19035123456011 - Techcombank</p>
                <p className="text-xs text-slate-500">Chủ tài khoản: NGUYEN VAN MINH TRI</p>
              </div>
            </div>

            {/* Bảng hạng mục chính */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-650 border-b border-slate-100 pb-1">
                Danh sách chi phí hạng mục thương thảo
              </h4>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5">Tên dịch vụ / Hạng mục</th>
                    <th className="py-2.5 text-center w-16">SL</th>
                    <th className="py-2.5 text-right w-36">Đơn giá</th>
                    <th className="py-2.5 text-right w-36">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedQuotation.items.map((item, id) => (
                    <tr key={item.id} className="align-top py-3">
                      <td className="py-3 pr-4">
                        <div className="font-bold text-slate-800">{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-450 mt-1 whitespace-pre-line leading-relaxed">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-center text-slate-650">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-700">{formatVND(item.price)}</td>
                      <td className="py-3 text-right font-bold text-slate-805">{formatVND(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Khối tổng kết dòng tiền */}
            <div className="border-t border-slate-200 pt-5 flex justify-end">
              <div className="w-full md:w-80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Chi phí thuần gộp:</span>
                  <span className="text-slate-800 font-semibold">{formatVND(selectedQuotation.totalBeforeDiscount)}</span>
                </div>
                {selectedQuotation.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Khấu trừ khuyến mãi:</span>
                    <span className="font-medium">-{formatVND(selectedQuotation.discount)}</span>
                  </div>
                )}
                <div className="border-b border-dashed border-slate-205 my-1"></div>
                <div className="flex justify-between items-center text-sm font-black text-slate-900">
                  <span>TỔNG ĐƯỢC CHỐT:</span>
                  <span className="text-base text-emerald-600">{formatVND(selectedQuotation.totalAfterDiscount)}</span>
                </div>
                
                <div className="bg-emerald-50/50 rounded-xl p-3 mt-4 space-y-1.5 border border-emerald-100/50">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span>Cọc Đợt 1 đề xuất ({selectedQuotation.proposedDepositRate}%):</span>
                    <span>{formatVND(selectedQuotation.depositAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Thanh toán đợt cuối (Nghiệm thu):</span>
                    <span>{formatVND(selectedQuotation.totalAfterDiscount - selectedQuotation.depositAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Các điều khoản pháp lý đính kèm */}
            <div className="border-t border-slate-200 pt-6 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400">Các quy ước thực hiện & thanh toán</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] text-slate-600 leading-relaxed">
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Calendar size={13} className="text-emerald-600" /> Tiến độ & Thời gian bàn giao
                  </span>
                  <p>{selectedQuotation.deliveryTimeframe}</p>
                </div>
                
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Check size={13} className="text-emerald-600" /> Điều khoản thanh toán
                  </span>
                  <p>{selectedQuotation.paymentTerms}</p>
                </div>

                {selectedQuotation.notes && (
                  <div className="md:col-span-2 space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      📌 Chỉ dẫn kĩ thuật bổ sung
                    </span>
                    <p className="italic text-slate-500 whitespace-pre-line">{selectedQuotation.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chữ ký hai bên */}
            <div className="border-t border-slate-100 pt-12 pb-6 grid grid-cols-2 text-center text-xs">
              <div className="space-y-12">
                <span className="font-semibold text-slate-500 uppercase tracking-wider block">ĐẠI DIỆN KHÁCH HÀNG</span>
                <div className="italic text-slate-300">Nhấp duyệt để điện tử ký</div>
              </div>
              <div className="space-y-12">
                <span className="font-semibold text-slate-500 uppercase tracking-wider block">ĐẠI DIỆN NHÀ SÁNG TẠO</span>
                <div className="font-mono text-emerald-600 font-bold underline decoration-wavy decoration-emerald-400 tracking-wider">
                  Minh Tri Studio
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUBVIEW: MẪU HỢP ĐỒNG PHÁP LÝ CHUYÊN NGHIỆP ----------------- */}
      {activeSubView === 'contract_view' && selectedQuotation && (
        <div className="space-y-6">
          {/* Thanh tác vụ */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-150 print:hidden shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveSubView('list');
                  setSelectedQuotation(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Trở về
              </button>
              <span className="text-xs text-slate-400">|</span>
              <p className="text-xs font-bold text-slate-500">MẪU DỰ THẢO HỢP ĐỒNG DỊCH VỤ SÁNG TẠO SỐ</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={triggerPrint}
                className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer size={13} /> In Hợp đồng (.pdf)
              </button>
            </div>
          </div>

          <div className="bg-white p-8 md:p-14 rounded-2xl border border-slate-200 shadow-md max-w-4xl mx-auto space-y-6 text-slate-800 leading-relaxed font-sans print:border-none print:shadow-none print:p-0 text-xs">
            {/* Quốc hiệu */}
            <div className="text-center space-y-1 border-b border-slate-200 pb-4">
              <h1 className="font-black text-sm uppercase tracking-widest text-slate-900">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
              <p className="font-bold text-[11px] tracking-wider text-slate-700">Độc lập - Tự do - Hạnh phúc</p>
              <div className="w-32 h-0.5 bg-slate-400 mx-auto mt-2"></div>
            </div>

            <div className="text-center py-4 space-y-1">
              <h2 className="text-base font-black text-slate-900">HỢP ĐỒNG DỊCH VỤ SÁNG TẠO MEDIA</h2>
              <p className="font-mono text-slate-500">Số hiệu căn chiếu: HĐ-DVSG/{selectedQuotation.quoteNumber}</p>
              <p className="italic text-[11px] text-slate-450">Hôm nay, ngày {formatDate(new Date().toISOString().split('T')[0])}, tại TPHCM, hai bên chúng tôi gồm:</p>
            </div>

            {/* Chủ thể hợp đồng */}
            <div className="space-y-4">
              {/* Bên A */}
              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase">BÊN KHÁCH HÀNG (Bên A):</span>
                {(() => {
                  const clientObj = clients.find(c => c.id === selectedQuotation.clientId);
                  if (clientObj) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                        <p><strong>Họ và tên / Pháp nhân:</strong> {clientObj.name}</p>
                        <p><strong>Số điện thoại:</strong> {clientObj.phone || 'Chưa cung cấp'}</p>
                        <p><strong>Địa chỉ liên kết:</strong> {clientObj.address || 'Hành chính doanh nghiệp Quận 1, TPHCM'}</p>
                        <p><strong>Email chính thức:</strong> {clientObj.email || 'Chưa cung cấp'}</p>
                      </div>
                    );
                  }
                  return <p className="text-rose-500 italic">Thông tin khách hàng không tồn tại.</p>;
                })()}
              </div>

              {/* Bên B */}
              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase">BÊN CUNG CẤP DỊCH VỤ (Bên B):</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                  <p><strong>Đại diện:</strong> Freelancer Minh Tri Studio</p>
                  <p><strong>Số điện thoại:</strong> 093 123 456</p>
                  <p><strong>Email:</strong> contact@freelanceos.vn</p>
                  <p><strong>Tài khoản ngân hàng:</strong> Techcombank - 19035123456011 (NGUYEN VAN MINH TRI)</p>
                </div>
              </div>
            </div>

            {/* Điều khoản chung */}
            <div className="space-y-4 pt-4 text-justify">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">ĐIỀU 1: PHẠM VI CÔNG VIỆC VÀ SẢN PHẨM BÀN GIAO</h4>
                <p className="pl-4">Bên A thuê bên B triển khai thực hiện gói dịch vụ sáng tạo truyền thông có thông số chi tiết dưới đây:</p>
                <div className="pl-6 pt-2">
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold">
                        <th className="p-2">Hạng mục dịch vụ</th>
                        <th className="p-2 text-center w-12">SL</th>
                        <th className="p-2 text-right">Đơn giá</th>
                        <th className="p-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedQuotation.items.map(item => (
                        <tr key={item.id} className="align-top">
                          <td className="p-2 font-bold">{item.name}</td>
                          <td className="p-2 text-center">{item.quantity}</td>
                          <td className="p-2 text-right">{formatVND(item.price)}</td>
                          <td className="p-2 text-right">{formatVND(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">ĐIỀU 2: TRỊ GIÁ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</h4>
                <p className="pl-4">
                  1. Tổng giá trị dịch vụ quy chuẩn: <strong>{formatVND(selectedQuotation.totalAfterDiscount)}</strong> (Bằng chữ: Chữ số tiền VNĐ thực tế tự đông).
                </p>
                <p className="pl-4">
                  2. Phương thức thanh toán: Chuyển khoản trực tiếp sang tài khoản ngân hàng Bên B cung cấp.
                </p>
                <p className="pl-4">
                  3. Lộ trình cọc đề xuất giữ chân ekip: Đợt 1 Bên A tạm ứng chuyển khoản <strong>{formatVND(selectedQuotation.depositAmount)}</strong> (~{selectedQuotation.proposedDepositRate}% Tổng trị giá) ngay khi đặt lịch. Đợt 2 tất toán nốt 100% phần còn lại sau khi xuất file nháp và duyệt sửa đổi.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">ĐIỀU 3: QUYỀN VÀ NGHĨA VỤ CỦA HAI BÊN</h4>
                <p className="pl-4">
                  - <strong>Đối với Bên A:</strong> Cung cấp đầy đủ mẫu sản phẩm, trang phục, outline bối cảnh và thanh toán đúng hạn quy ước tại Điều 2.
                </p>
                <p className="pl-4">
                  - <strong>Đối với Bên B:</strong> Thực hiện ghi hình quay dựng đúng chất lượng phong cách cinematic cam kết. Đảm bảo đúng thời hạn thỏa toán bàn giao tệp tin.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">ĐIỀU 4: THỜI LƯỢNG BẤM MÁY VÀ ĐIỀU KHOẢN DUYỆT SỬA</h4>
                <p className="pl-4">
                  - Tiến độ thiết lập sản phẩm: <strong>{selectedQuotation.deliveryTimeframe}</strong>.
                </p>
                <p className="pl-4">
                  - Quy chuẩn duyệt sửa đổi: Khách hàng được quyền sửa đổi miễn phí tối đa 2 lần cho mỗi một video/ảnh chỉnh sửa gốc. Phát sinh giờ thuê studio hoặc công tác ngoài tỉnh sẽ được lập phụ lục bổ sung.
                </p>
              </div>
            </div>

            {/* Phê chuẩn quy tắc ký kết */}
            <div className="grid grid-cols-2 text-center pt-8 font-bold border-t border-slate-200">
              <div className="space-y-14">
                <p>ĐẠI DIỆN BÊN A (KHÁCH HÀNG)</p>
                <p className="font-normal italic text-slate-400 font-sans">(Ký, ghi rõ họ tên)</p>
              </div>
              <div className="space-y-14">
                <p>ĐẠI DIỆN BÊN B (BÊN ĐỐI TÁC SÁNG TẠO)</p>
                <p className="font-mono text-emerald-600 font-bold underline decoration-wavy underline-offset-4 pointer-events-none">NGUYEN VAN MINH TRI</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: TẠO KHÁCH HÀNG NHANH INLINE ----------------- */}
      {showQuickClientModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-55 animate-fade-in print:hidden">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1">
                <UserPlus size={15} className="text-brand-green-mid" /> Thêm nhanh khách hàng mới
              </h4>
              <button
                onClick={() => setShowQuickClientModal(false)}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-400"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickClient} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Tên hiển thị khách hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Anh Nguyễn Hoàng Long"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-hidden focus:ring-1 focus:ring-brand-green-mid"
                  id="quick-client-name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Số điện thoại / Zalo</label>
                <input
                  type="tel"
                  placeholder="Ví dụ: 0914xxxxxx"
                  value={newClientPhone}
                  onChange={e => setNewClientPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-hidden focus:ring-1 focus:ring-brand-green-mid"
                  id="quick-client-phone"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Hộp thư điện tử (Email)</label>
                <input
                  type="email"
                  placeholder="vi_du@yahoo.com"
                  value={newClientEmail}
                  onChange={e => setNewClientEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-hidden focus:ring-1 focus:ring-brand-green-mid"
                  id="quick-client-email"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Nhóm khách hàng phân loại</label>
                <select
                  value={newClientType}
                  onChange={e => setNewClientType(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-hidden focus:ring-1 focus:ring-brand-green-mid"
                >
                  <option value="cá nhân">Cá nhân tự do</option>
                  <option value="doanh nghiệp">Đại diện Công ty / Doanh nghiệp</option>
                  <option value="khách quen">Đối tác / Khách quay lại</option>
                  <option value="khách tiềm năng">Khách mới hỏi thăm (Lead tiềm năng)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowQuickClientModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-green-mid hover:bg-brand-green-dark text-white rounded-lg font-bold cursor-pointer"
                  id="btn-save-quick-client"
                >
                  Khởi tạo khách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: CHUYỂN BÁO GIÁ ĐÃ DUYỆT THÀNH JOB/PROJECT ----------------- */}
      {showConvertToProjectModal && selectedQuotation && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-55 animate-fade-in print:hidden">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5">
                <ArrowRightLeft size={15} className="text-emerald-600" /> Khởi tạo Job thực tế từ báo giá {selectedQuotation.quoteNumber}
              </h4>
              <button
                onClick={() => {
                  setShowConvertToProjectModal(false);
                  setSelectedQuotation(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-400"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn đang chuyển báo giá đã duyệt trị giá thương lượng <strong>{formatVND(selectedQuotation.totalAfterDiscount)}</strong> thành một Job sản xuất chủ động. Hệ thống sẽ tự tạo hồ sơ khách hàng liên đới, phân bổ số tiền gộp, tiền đặt cọc tương thích.
            </p>

            <form onSubmit={handleConfirmConvertToProject} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Tiêu đề dự án công việc</label>
                <input
                  type="text"
                  required
                  value={convertProjectTitle}
                  onChange={e => setConvertProjectTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-hidden focus:ring-1 focus:ring-brand-green-mid font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">Phân loại dịch vụ cốt lõi</label>
                  <select
                    value={convertProjectService}
                    onChange={e => setConvertProjectService(e.target.value as ServiceType)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-hidden focus:ring-1 focus:ring-brand-green-mid"
                  >
                    <option value="Combo media">Combo media trọn gói</option>
                    <option value="Chụp ảnh sản phẩm">Chụp ảnh sản phẩm</option>
                    <option value="Chụp ảnh cá nhân">Chụp ảnh cá nhân</option>
                    <option value="Reels/TikTok">Sáng tạo Reels / TikTok</option>
                    <option value="Dựng video">Dựng video / Hậu kỳ</option>
                    <option value="Thiết kế social post">Thiết kế social post</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">Giá trị quyết toán</label>
                  <input
                    type="text"
                    disabled
                    value={formatVND(selectedQuotation.totalAfterDiscount)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-xs outline-hidden font-mono font-bold text-slate-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">Thời gian thực hiện bấm máy / Khai tác</label>
                  <input
                    type="date"
                    value={convertProjectShootDate}
                    onChange={e => setConvertProjectShootDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-hidden focus:ring-1 focus:ring-brand-green-mid"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">Thời gian hạn nộp bàn giao hàng</label>
                  <input
                    type="date"
                    value={convertProjectDueDate}
                    onChange={e => setConvertProjectDueDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-hidden focus:ring-1 focus:ring-brand-green-mid"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Đặt cọc ghi nhận:</span>
                  <span className="font-bold text-slate-700">{formatVND(selectedQuotation.depositAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Tất toán còn nợ:</span>
                  <span className="font-bold text-slate-700">{formatVND(selectedQuotation.totalAfterDiscount - selectedQuotation.depositAmount)}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowConvertToProjectModal(false);
                    setSelectedQuotation(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-green-mid hover:bg-brand-green-dark text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  id="btn-confirm-convert-job"
                >
                  Khởi tạo Job mới <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
