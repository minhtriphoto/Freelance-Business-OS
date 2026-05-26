/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Project, TAX_STANDARDS } from '../types';
import { formatVND } from '../utils';
import { 
  Calculator, 
  HelpCircle, 
  FileText, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Compass, 
  ShieldCheck, 
  BookOpen, 
  Printer,
  ChevronDown,
  Info
} from 'lucide-react';

interface TaxViewProps {
  projects: Project[];
  onToggleProjectTax: (projectId: string) => void;
}

export default function TaxView({
  projects,
  onToggleProjectTax
}: TaxViewProps) {
  const [selectedStandard, setSelectedStandard] = useState<string>('dich_vu');
  const [faqOpen, setFaqOpen] = useState<Record<string, boolean>>({
    'whocares': true,
    'howtoregister': false,
    'howtodeclare': false
  });

  const toggleFaq = (key: string) => {
    setFaqOpen(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Lọc lấy các dự án đã hoàn tất & được chọn kê khai
  const completedProjects = useMemo(() => {
    return projects.filter(p => p.status === 'completed');
  }, [projects]);

  const projectsToCalculate = useMemo(() => {
    return completedProjects.filter(p => p.taxDeclared);
  }, [completedProjects]);

  // Doanh số chịu thuế
  const totalTaxableRevenue = useMemo(() => {
    return projectsToCalculate.reduce((sum, p) => sum + p.price, 0);
  }, [projectsToCalculate]);

  // Doanh số chưa kê khai thuế
  const nonDeclaredRevenue = useMemo(() => {
    return completedProjects
      .filter(p => !p.taxDeclared)
      .reduce((sum, p) => sum + p.price, 0);
  }, [completedProjects]);

  // Tính thuế chi tiết theo tỷ lệ đang chọn
  const standard = TAX_STANDARDS[selectedStandard] || TAX_STANDARDS.dich_vu;
  const vatAmount = totalTaxableRevenue * standard.rateVAT;
  const pitAmount = totalTaxableRevenue * standard.ratePIT;
  const totalTax = vatAmount + pitAmount;

  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="bg-stone-100 border border-stone-200/60 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Calculator size={24} className="text-amber-700" />
            Hồ sơ & Thuế Hộ Kinh Doanh
          </h1>
          <p className="text-xs text-stone-600">Công cụ hỗ trợ hạch toán, dự trù thuế giá trị gia tăng & thuế thu nhập cá nhân theo tiêu chuẩn tổng cục Thuế Việt Nam.</p>
        </div>
        <div className="bg-white border border-stone-200 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 shrink-0">
          📍 Doanh thu bắt buộc nộp thuế: <strong className="text-amber-700 font-extrabold">&gt; 100M VNĐ/năm</strong>
        </div>
      </div>

      {/* Grid: 2 Cột - Cột Máy tính Thuế (7/12) và Cột Cẩm nang Luật (5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CỘT TÍNH THUẾ TỰ ĐỘNG (7/12) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 p-5 md:p-6 rounded-2xl shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Mô hình Dự trù Thuế Khoán</h2>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              id="tax-standard-selector"
            >
              <option value="dich_vu">Dịch vụ media (4.5%)</option>
              <option value="san_xuat">Sản xuất & Vật tư (3%)</option>
              <option value="phan_phoi">Phân phối đơn giản (1.5%)</option>
              <option value="khac">Phân loại khác (3%)</option>
            </select>
          </div>

          {/* Chọn dự án để tính thuế */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">Chọn dự án Đã Xong để đưa vào kỳ tính thuế này:</span>
              <span className="text-slate-400">{completedProjects.length} hợp đồng hoàn thành</span>
            </div>

            {completedProjects.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/50 text-xs text-slate-400 text-center">
                Chưa có dự án nào chuyển sang trạng thái "Đóng/Hoàn thành". Vui lòng cập nhật trạng thái job tại sổ dự án để bắt đầu tính.
              </div>
            ) : (
              <div className="space-y-2 border border-slate-100/60 p-3 rounded-xl bg-slate-50/30 max-h-48 overflow-y-auto">
                {completedProjects.map((p) => (
                  <label 
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 hover:border-slate-200 cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={p.taxDeclared}
                        onChange={() => onToggleProjectTax(p.id)}
                        className="rounded border-slate-300 text-brand-green-mid w-4 h-4"
                        id={`check-tax-${p.id}`}
                      />
                      <div className="font-semibold text-slate-800">{p.title}</div>
                    </div>
                    <span className="font-bold text-slate-900">{formatVND(p.price)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Phân rã dữ liệu tỷ lệ */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100/50">
            <div className="text-xs text-slate-500 font-semibold">{standard.label}</div>
            <p className="text-[11px] text-slate-400 leading-normal">{standard.description}</p>
            
            <hr className="border-slate-200/50" />

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng doanh thu chọn tính thuế:</span>
                <strong className="text-slate-900">{formatVND(totalTaxableRevenue)}</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Thuế giá trị gia tăng (GTGT) - rate {(standard.rateVAT * 100).toFixed(1)}%:</span>
                <span>{formatVND(vatAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Thuế thu nhập cá nhân (TNCN) - rate {(standard.ratePIT * 100).toFixed(1)}%:</span>
                <span>{formatVND(pitAmount)}</span>
              </div>
              <hr className="border-dashed border-slate-200" />
              <div className="flex justify-between text-sm">
                <span className="font-extrabold text-slate-800 uppercase">TỔNG THUẾ ĐÓNG TRONG KỲ:</span>
                <span className="font-black text-amber-700 text-base">{formatVND(totalTax)}</span>
              </div>
            </div>
          </div>

          {/* Cảnh báo doanh thu ngoài luồng */}
          {nonDeclaredRevenue > 0 && (
            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <Info size={16} className="text-brand-accent shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Nhắc nhở:</span>
                <p className="leading-relaxed">
                  Có <strong>{formatVND(nonDeclaredRevenue)}</strong> từ doanh thu đã hoàn thành trong hệ thống chưa được tích chọn "Khai thuế". Hãy cân nhắc tích khai báo trước quý III để tránh bị thanh tra thuế môn bài phạt nộp chậm.
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 text-center">
            <p className="text-[10px] text-slate-400 italic">Công OS tự động lưu trữ và ước lượng, không thay thế tờ khai nộp thuế thực tế trên hệ thống Tổng cục Thuế.</p>
          </div>
        </div>

        {/* CỘT CẨM NANG & FAQ PHỔ BIẾN (5/12) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Cẩm nang Hộ Kinh Doanh */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="text-brand-green-light" size={18} />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Sổ tay Đăng ký & Kê khai</h2>
            </div>

            {/* Accordion 1: Ai cần đóng thuế */}
            <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
              <button
                onClick={() => toggleFaq('whocares')}
                className="w-full bg-slate-50 hover:bg-slate-100 p-3 text-left font-bold text-slate-800 flex items-center justify-between"
              >
                <span>1. Freelancer nào bắt buộc đóng thuế?</span>
                <ChevronDown size={14} className={`transform transition-transform ${faqOpen.whocares ? 'rotate-180' : ''}`} />
              </button>
              {faqOpen.whocares && (
                <div className="p-3 bg-white text-slate-600 leading-relaxed space-y-2 border-t border-slate-100">
                  <p>Mọi cá nhân/hộ kinh doanh tại Việt Nam đạt tổng doanh thu làm việc tự do vượt quá <strong>100 triệu VNĐ/năm dương lịch</strong> có trách nhiệm tự khai thuế môn bài, thuế GTGT & TNCN.</p>
                  <p className="text-stone-500 italic">Mẹo: Nếu khách hàng là doanh nghiệp lớn thường họ đã tự khấu trừ 10% thuế TNCN tại nguồn trước khi trả tiền cho bạn. Hãy xin lại Biên lai chứng từ khấu trừ đó để nộp khấu trừ lại khi quyết toán năm.</p>
                </div>
              )}
            </div>

            {/* Accordion 2: Cách đăng ký HKD */}
            <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
              <button
                onClick={() => toggleFaq('howtoregister')}
                className="w-full bg-slate-50 hover:bg-slate-100 p-3 text-left font-bold text-slate-800 flex items-center justify-between"
              >
                <span>2. Đăng ký Hộ Kinh Doanh thế nào?</span>
                <ChevronDown size={14} className={`transform transition-transform ${faqOpen.howtoregister ? 'rotate-180' : ''}`} />
              </button>
              {faqOpen.howtoregister && (
                <div className="p-3 bg-white text-slate-600 leading-relaxed space-y-2 border-t border-slate-100">
                  <span className="font-semibold block">Quy trình 3 bước tại Ủy ban quận/huyện:</span>
                  <ul className="list-decimal pl-4 space-y-1">
                    <li>Gửi giấy đề nghị đăng ký hộ kinh doanh cá thể lên Phòng ĐKKD Quận/Huyện sở tại (hoặc online qua cổng Dịchvụ công).</li>
                    <li>Nộp kèm CCCD photo công chứng, Hợp đồng thuê nhà/phòng studio nếu có.</li>
                    <li>Sau 3 ngày làm việc để nhận Giấy Chứng nhận đăng ký hộ kinh doanh, tiếp tục ghé chi cục thuế để kích hoạt Mã số thuế hộ cá thể.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Accordion 3: Sổ sách kế toán tối giản */}
            <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
              <button
                onClick={() => toggleFaq('howtodeclare')}
                className="w-full bg-slate-50 hover:bg-slate-100 p-3 text-left font-bold text-slate-800 flex items-center justify-between"
              >
                <span>3. Sổ sách kế toán hộ kinh doanh?</span>
                <ChevronDown size={14} className={`transform transition-transform ${faqOpen.howtodeclare ? 'rotate-180' : ''}`} />
              </button>
              {faqOpen.howtodeclare && (
                <div className="p-3 bg-white text-slate-600 leading-relaxed space-y-2 border-t border-slate-100">
                  <p>Từ năm 2022, hộ kinh doanh mới không cần thuê kế toán định kỳ cồng kềnh. Chỉ cần lưu trữ đầy đủ 3 loại sổ:</p>
                  <ul className="list-disc pl-4 space-y-1 font-mono text-[11px]">
                    <li>Sổ danh mục doanh thu bán dịch vụ</li>
                    <li>Sổ chứng từ thu tiền, biên lai đặt cọc</li>
                    <li>Sổ hạch toán các khoản chi thô (thuê studio, thuê gear, thuê mẫu)</li>
                  </ul>
                  <p className="mt-1">App Freelance Business OS này được thiết kế dựa trên chính 3 loại sổ trên để giúp bạn nộp báo cáo thuế khoán tức thì.</p>
                </div>
              )}
            </div>

          </div>

          <div className="bg-stone-50 border border-stone-200/50 p-4 rounded-2xl space-y-3">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Lời khuyên tác nghiệp:</span>
            <p className="text-xs text-stone-600 leading-relaxed">
              Hãy đặt tên các Hợp đồng khớp với tên trong nội dung chuyển khoản để khi cơ quan Kiểm tra Thuế kiểm đối chiếu sao kê tài khoản ngân hàng cá nhân, bạn dễ dàng cung cấp và giải trình dòng tiền.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
