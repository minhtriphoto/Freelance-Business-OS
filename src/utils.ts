/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, ProjectStatus, ServiceType, QuotationStatus, ContractStatus } from './types';

// Format tiền tệ VNĐ: e.g. 15.000.000 ₫
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

// Format ngắn gọn để hiển thị biểu đồ: e.g. 15M, 850K
export function formatShortVND(amount: number): string {
  if (amount >= 1e9) {
    return `${(amount / 1e9).toFixed(1).replace(/\.0$/, '')} tỷ`;
  }
  if (amount >= 1e6) {
    return `${(amount / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (amount >= 1e3) {
    return `${(amount / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return amount.toString();
}

// Format ngày tháng tiếng Việt: e.g. 26 Th05, 2026
export function formatDate(dateString?: string): string {
  if (!dateString) return 'Chưa tạo';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// Chuyển trạng thái dự án sang tiếng Việt và màu sắc tương ứng
export interface StatusDisplay {
  label: string;
  bgClass: string;
  textClass: string;
}

export function getProjectStatusInfo(status: ProjectStatus): StatusDisplay {
  switch (status) {
    case 'lead':
      return {
        label: 'Lead',
        bgClass: 'bg-slate-105 text-slate-700 border-slate-200',
        textClass: 'text-slate-500'
      };
    case 'đã báo giá':
    case 'draft':
      return {
        label: 'Đã báo giá / Nháp',
        bgClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        textClass: 'text-zinc-600'
      };
    case 'đã nhận cọc':
    case 'deposited':
      return {
        label: 'Đã nhận cọc',
        bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        textClass: 'text-emerald-600'
      };
    case 'đang chuẩn bị':
      return {
        label: 'Đang chuẩn bị',
        bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        textClass: 'text-indigo-600'
      };
    case 'đang thực hiện':
    case 'in_progress':
      return {
        label: 'Đang thực hiện',
        bgClass: 'bg-sky-50 text-sky-700 border-sky-200',
        textClass: 'text-sky-600'
      };
    case 'chờ khách duyệt':
      return {
        label: 'Chờ khách duyệt',
        bgClass: 'bg-pink-50 text-pink-700 border-pink-200',
        textClass: 'text-pink-600'
      };
    case 'cần chỉnh sửa':
    case 'editing':
      return {
        label: 'Hậu kỳ / Chỉnh sửa',
        bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
        textClass: 'text-amber-600'
      };
    case 'đã bàn giao':
    case 'delivered':
      return {
        label: 'Đã bàn giao SP',
        bgClass: 'bg-violet-50 text-violet-700 border-violet-200',
        textClass: 'text-violet-600'
      };
    case 'chờ thanh toán':
      return {
        label: 'Chờ thanh toán',
        bgClass: 'bg-orange-50 text-orange-700 border-orange-200',
        textClass: 'text-orange-600'
      };
    case 'hoàn thành':
    case 'completed':
      return {
        label: 'Hoàn thành',
        bgClass: 'bg-teal-50 text-teal-700 border-teal-200',
        textClass: 'text-teal-600'
      };
    case 'hủy':
      return {
        label: 'Đã hủy',
        bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
        textClass: 'text-rose-600'
      };
    default:
      return {
        label: 'Không xác định',
        bgClass: 'bg-gray-100 text-gray-700 border-gray-200',
        textClass: 'text-gray-500'
      };
  }
}

// Biểu tượng (Lucide) liên quan đến loại dịch vụ
export function getServiceColor(service: ServiceType): string {
  switch (service) {
    case 'Chụp ảnh cá nhân':
    case 'Chụp ảnh sản phẩm':
    case 'Chụp ảnh sự kiện':
    case 'Chụp ảnh (Photography)':
      return 'text-emerald-600';
    case 'Quay video':
    case 'TVC':
    case 'Reels/TikTok':
    case 'Quay phim (Videography)':
      return 'text-rose-600';
    case 'Dựng video':
    case 'Dựng phim (Editing)':
      return 'text-amber-600';
    case 'Thiết kế nhận diện':
    case 'Thiết kế social post':
    case 'Thiết kế (Design)':
      return 'text-indigo-600';
    case 'Content marketing':
    case 'Sáng tạo nội dung (Content)':
      return 'text-violet-605';
    case 'Makeup':
    case 'Trang điểm (Makeup)':
      return 'text-pink-600';
    case 'Combo media':
    case 'Trọn gói / Studio':
      return 'text-cyan-600';
    default:
      return 'text-zinc-600';
  }
}

export function getQuotationStatusInfo(status: QuotationStatus): StatusDisplay {
  switch (status) {
    case 'nháp':
      return {
        label: 'Bản nháp',
        bgClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        textClass: 'text-zinc-500'
      };
    case 'đã gửi':
      return {
        label: 'Đã gửi khách',
        bgClass: 'bg-indigo-50 text-indigo-750 border-indigo-200',
        textClass: 'text-indigo-600'
      };
    case 'khách đang xem xét':
      return {
        label: 'Khách đang xem xét',
        bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
        textClass: 'text-amber-600'
      };
    case 'đã duyệt':
      return {
        label: 'Đã duyệt',
        bgClass: 'bg-emerald-50 text-emerald-750 border-emerald-200',
        textClass: 'text-emerald-600'
      };
    case 'bị từ chối':
      return {
        label: 'Bị từ chối',
        bgClass: 'bg-rose-50 text-rose-750 border-rose-250',
        textClass: 'text-rose-600'
      };
    case 'hết hạn':
      return {
        label: 'Lịch hết hạn',
        bgClass: 'bg-slate-100 text-slate-500 border-slate-200',
        textClass: 'text-slate-400'
      };
    default:
      return {
        label: 'Chưa rõ',
        bgClass: 'bg-gray-100 text-gray-700 border-gray-200',
        textClass: 'text-gray-500'
      };
  }
}

export function getContractStatusInfo(status: ContractStatus): StatusDisplay {
  switch (status) {
    case 'nháp':
      return {
        label: 'Nháp',
        bgClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        textClass: 'text-zinc-500'
      };
    case 'chờ khách xác nhận':
      return {
        label: 'Chờ khách xác nhận',
        bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
        textClass: 'text-amber-600'
      };
    case 'đã ký':
      return {
        label: 'Đã ký',
        bgClass: 'bg-indigo-50 text-indigo-750 border-indigo-200',
        textClass: 'text-indigo-600'
      };
    case 'đang thực hiện':
      return {
        label: 'Đang thực hiện',
        bgClass: 'bg-sky-50 text-sky-850 border-sky-200',
        textClass: 'text-sky-600'
      };
    case 'hoàn thành':
      return {
        label: 'Hoàn thành',
        bgClass: 'bg-emerald-50 text-emerald-750 border-emerald-200',
        textClass: 'text-emerald-600'
      };
    case 'thanh lý':
      return {
        label: 'Thanh lý',
        bgClass: 'bg-purple-50 text-purple-750 border-purple-200',
        textClass: 'text-purple-600'
      };
    case 'hủy':
      return {
        label: 'Đã hủy',
        bgClass: 'bg-rose-50 text-rose-750 border-rose-250',
        textClass: 'text-rose-600'
      };
    default:
      return {
        label: 'Chưa rõ',
        bgClass: 'bg-gray-100 text-gray-700 border-gray-200',
        textClass: 'text-gray-500'
      };
  }
}


