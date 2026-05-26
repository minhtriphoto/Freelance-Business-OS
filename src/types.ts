/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ClientCategoryType = 'cá nhân' | 'doanh nghiệp' | 'agency' | 'studio đối tác' | 'khách quen' | 'khách tiềm năng';

export type ClientSourceType = 'facebook' | 'tiktok' | 'instagram' | 'giới thiệu' | 'website' | 'người quen' | 'agency' | 'khác';

export type ClientInterestedServiceType = 
  | 'Chụp ảnh'
  | 'Quay video'
  | 'Dựng video'
  | 'Thiết kế'
  | 'Content'
  | 'Makeup'
  | 'Livestream'
  | 'Combo dịch vụ';

export type ClientStatusType = 
  | 'lead mới'
  | 'đang tư vấn'
  | 'đã báo giá'
  | 'đã chốt'
  | 'đang làm việc'
  | 'khách cũ'
  | 'không tiềm năng';

export type ClientPriorityType = 'cao' | 'trung bình' | 'thấp';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  zalo?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  address?: string;
  type: ClientCategoryType;
  source: ClientSourceType;
  interestedServices: ClientInterestedServiceType[];
  status: ClientStatusType;
  priority: ClientPriorityType;
  notes: string;
  createdAt: string;
}

export type ServiceType =
  | 'Chụp ảnh cá nhân'
  | 'Chụp ảnh sản phẩm'
  | 'Chụp ảnh sự kiện'
  | 'Quay video'
  | 'Dựng video'
  | 'TVC'
  | 'Reels/TikTok'
  | 'Thiết kế nhận diện'
  | 'Thiết kế social post'
  | 'Content marketing'
  | 'Makeup'
  | 'Combo media'
  | 'Khác'
  | 'Chụp ảnh (Photography)'
  | 'Quay phim (Videography)'
  | 'Dựng phim (Editing)'
  | 'Thiết kế (Design)'
  | 'Sáng tạo nội dung (Content)'
  | 'Trang điểm (Makeup)'
  | 'Trọn gói / Studio'
  | 'Dịch vụ khác';

export type ProjectStatus =
  | 'lead'
  | 'đã báo giá'
  | 'đã nhận cọc'
  | 'đang chuẩn bị'
  | 'đang thực hiện'
  | 'chờ khách duyệt'
  | 'cần chỉnh sửa'
  | 'đã bàn giao'
  | 'chờ thanh toán'
  | 'hoàn thành'
  | 'hủy'
  | 'draft'
  | 'deposited'
  | 'in_progress'
  | 'editing'
  | 'delivered'
  | 'completed';

export interface Project {
  id: string;
  title: string;
  clientId: string;
  serviceType: ServiceType;
  price: number;              // Gói báo giá / Giá trị hợp đồng
  deposit: number;            // Tiền đặt cọc đã nhận
  depositDate?: string;
  finalPayment: number;       // Số tiền thực tế còn lại cần thu
  finalPaymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  dueDate?: string;           // Hạn bàn giao sản phẩm
  shootDate?: string;         // Ngày bấm máy / thực hiện dự án
  driveLink?: string;         // Link Google Drive / Dropbox
  status: ProjectStatus;
  notes: string;
  contractNumber?: string;    // Số hợp đồng / báo giá
  taxDeclared: boolean;       // Kê khai thuế cho job này chưa
  
  // Các trường mới bổ sung theo yêu cầu Module Job chi tiết:
  brief?: string;             // Mô tả brief
  receivedDate?: string;      // Ngày nhận job
  location?: string;          // Địa điểm thực hiện
  otherPayments?: number;     // Số tiền đã thanh toán thêm
  expectedCost?: number;      // Chi phí dự kiến
  actualCost?: number;        // Chi phí thực tế
  priority?: 'cao' | 'trung bình' | 'thấp'; // Mức độ ưu tiên
  assignee?: string;          // Người phụ trách
  collaborators?: string;     // Cộng tác viên liên quan
  deliverablesLink?: string;  // Link sản phẩm bàn giao
  internalNotes?: string;     // Ghi chú nội bộ
}

export type TransactionType = 'thu' | 'chi';

export type TransactionMethod = 'Tiền mặt' | 'Chuyển khoản' | 'Ví điện tử' | 'Nền tảng online' | 'Khác';

export type IncomeCategory =
  | 'Tiền cọc'
  | 'Thanh toán job'
  | 'Thanh toán còn lại'
  | 'Bán sản phẩm số'
  | 'Affiliate'
  | 'Tư vấn'
  | 'Khác'
  | 'Cọc dự án'
  | 'Thanh toán đợt cuối'
  | 'Doanh thu ngoài';

export type ExpenseCategory =
  | 'Thuê studio'
  | 'Thuê thiết bị'
  | 'Makeup'
  | 'Di chuyển'
  | 'Ăn uống'
  | 'Quảng cáo'
  | 'Phần mềm'
  | 'Cộng tác viên'
  | 'In ấn'
  | 'Đạo cụ'
  | 'Thuế/phí'
  | 'Khác'
  | 'Thuê studio / bối cảnh'
  | 'Thuê nhân sự ngoài (Model/Trợ lý/...)'
  | 'Trang điểm / Trang phục'
  | 'Di chuyển / Xăng xe'
  | 'Ăn uống / Tiếp khách'
  | 'Thiết bị mua mới / Sửa chữa'
  | 'Marketing / Quảng cáo';

export type TransactionCategory = IncomeCategory | ExpenseCategory;

export type TransactionStatus = 'Đã ghi nhận' | 'Cần kiểm tra' | 'Đã đối soát';

export interface Transaction {
  id: string;
  transactionNumber: string; // Mã giao dịch tự động
  projectId?: string; // Giao dịch này có thuộc dự án nào không
  clientId?: string;  // Khách hàng liên quan
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  date: string;
  method: TransactionMethod;
  notes?: string;
  documentLink?: string; // File/ảnh chứng từ nếu có
  status: TransactionStatus;
  description: string; // Tương thích ngược mô tả
}

// Đối với hộ kinh doanh/freelancer đóng thuế khoán hoặc kê khai định kỳ
export interface TaxStandard {
  rateVAT: number;  // Tỷ lệ thuế GTGT
  ratePIT: number;  // Tỷ lệ thuế TNCN
  totalRate: number; // Tổng tỷ lệ
  label: string;
  description: string;
}

export const TAX_STANDARDS: Record<string, TaxStandard> = {
  dich_vu: {
    rateVAT: 0.03,
    ratePIT: 0.015,
    totalRate: 0.045,
    label: "Dịch vụ sáng tạo, sản xuất truyền thông không bao thầu phụ kiện/vật tư",
    description: "Áp dụng cho chụp ảnh, quay phim, dựng phim, thiết bị tự cung cấp, tư vấn sáng tạo. Tổng đóng 4.5% (VAT 3% & TNCN 1.5%)."
  },
  phan_phoi: {
    rateVAT: 0.01,
    ratePIT: 0.005,
    totalRate: 0.015,
    label: "Phân phối, bán lẻ thiết bị, vật phẩm kèm dịch vụ quảng cáo/in ấn thành phẩm",
    description: "Nhà in ảnh, cung cấp trang album quà tặng, mua bán hộ máy ảnh dụng cụ kèm theo. Tổng đóng 1.5%."
  },
  san_xuat: {
    rateVAT: 0.02,
    ratePIT: 0.01,
    totalRate: 0.03,
    label: "Sản xuất, gia công, vận tải hoặc dịch vụ có gắn với hàng hóa cung cấp",
    description: "Freelancer bao thầu in ấn photobook trọn gói, cho thuê đồ decor tiệc cưới, vận chuyển thiết bị studio. Tổng đóng 3%."
  },
  khac: {
    rateVAT: 0.02,
    ratePIT: 0.01,
    totalRate: 0.03,
    label: "Mức bình quân / Khác",
    description: "Doanh thu trọn gói nhiều hoạt động không thể tách rời sổ sách. Tổng đóng khoảng 3%."
  }
};

export type QuotationStatus =
  | 'nháp'
  | 'đã gửi'
  | 'khách đang xem xét'
  | 'đã duyệt'
  | 'bị từ chối'
  | 'hết hạn';

export interface QuotationItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  clientId: string;
  projectId?: string; // Job liên quan nếu có
  createdDate: string;
  expiredDate: string;
  items: QuotationItem[];
  discount: number;
  totalBeforeDiscount: number;
  totalAfterDiscount: number;
  paymentTerms: string;
  proposedDepositRate: number; // e.g. 30 hoặc 50 (%)
  depositAmount: number;
  deliveryTimeframe: string;
  notes: string;
  status: QuotationStatus;
}

export type ContractStatus =
  | 'nháp'
  | 'chờ khách xác nhận'
  | 'đã ký'
  | 'đang thực hiện'
  | 'hoàn thành'
  | 'thanh lý'
  | 'hủy';

export interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  clientId: string;
  projectId?: string;
  quotationId?: string;
  createdDate: string;
  signedDate?: string;
  totalValue: number;
  deposit: number;
  remainingAmount: number;
  scopeOfWork: string;
  freeRevisions: number;
  extraRevisionCost: number;
  deliveryTimeframe: string;
  paymentTerms: string;
  cancellationTerms: string;
  copyrightTerms: string;
  confidentialityTerms?: string;
  externalSignedLink?: string;
  status: ContractStatus;
}

export type DebtStatus = 'Chưa đến hạn' | 'Đến hạn hôm nay' | 'Quá hạn' | 'Đã thu đủ' | 'Khó thu';

export interface DebtMetadata {
  projectId: string;
  statusOverride?: DebtStatus;
  remindNotes?: string;
}

export type AppointmentType = 
  | 'Tư vấn' 
  | 'Chụp ảnh' 
  | 'Quay video' 
  | 'Họp brief' 
  | 'Họp duyệt sản phẩm' 
  | 'Deadline bàn giao' 
  | 'Nhắc thanh toán' 
  | 'Khác';

export type AppointmentStatus = 'Sắp diễn ra' | 'Hoàn thành' | 'Dời lịch' | 'Hủy';

export interface Appointment {
  id: string;
  title: string;
  clientId?: string;
  projectId?: string;
  type: AppointmentType;
  startDate: string; // ISO yyyy-MM-ddThh:mm
  endDate: string; // ISO yyyy-MM-ddThh:mm
  location?: string;
  onlineMeetingLink?: string;
  notes?: string;
  status: AppointmentStatus;
}



