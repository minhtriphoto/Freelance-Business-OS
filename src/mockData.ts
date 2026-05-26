/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Project, Transaction, Quotation, Contract, Appointment } from './types';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c-1',
    name: 'Nguyễn Văn Minh (Hương Sen Wedding)',
    phone: '0903123456',
    email: 'minh.nguyen@huongsenwedding.com',
    zalo: '0903123456',
    facebook: 'https://facebook.com/minh.huongsen',
    type: 'doanh nghiệp',
    source: 'giới thiệu',
    interestedServices: ['Quay video', 'Dựng video'],
    status: 'khách cũ',
    priority: 'cao',
    address: '120/4 Trần Hưng Đạo, Quận 1, TP. HCM',
    notes: 'Khách quen bên mảng quay dựng phóng sự cưới. Trả tiền sòng phẳng, yêu cầu phim màu ấm phong cách tối giản.',
    createdAt: '2026-04-10'
  },
  {
    id: 'c-2',
    name: 'Chị Mai Thu Thủy',
    phone: '0912987654',
    email: 'thuy.mai9x@gmail.com',
    zalo: '0912987654',
    instagram: 'https://instagram.com/thuy.mai9x',
    type: 'khách quen',
    source: 'facebook',
    interestedServices: ['Chụp ảnh'],
    status: 'đang làm việc',
    priority: 'trung bình',
    address: 'Cư xá Đô Thành, Quận 3, TP. HCM',
    notes: 'Chủ shop quần áo thời trang thiết kế @ThuyDesign. Thường booked chụp ngoại cảnh lookbook mỗi tháng một lần.',
    createdAt: '2026-05-01'
  },
  {
    id: 'c-3',
    name: 'Anh Trần Hoàng Nam (CEO Sài Gòn Mộc Co.)',
    phone: '0988555222',
    email: 'nam.tran@saigonmoc.vn',
    zalo: '0988555222',
    tiktok: 'https://tiktok.com/@saigonmoc',
    type: 'doanh nghiệp',
    source: 'tiktok',
    interestedServices: ['Quay video', 'Content'],
    status: 'đang tư vấn',
    priority: 'cao',
    address: 'Đường Số 9, P. Linh Tây, Thủ Đức',
    notes: 'Muốn phát triển kênh TikTok thương hiệu về sản phẩm nội thất gỗ decor tự nhiên. Cần làm video ngắn dạng vlog kể chuyện.',
    createdAt: '2026-05-15'
  },
  {
    id: 'c-4',
    name: 'Lê Thị Thu Trang',
    phone: '0934111222',
    email: 'trangle.makeup@gmail.com',
    zalo: '0934111222',
    type: 'studio đối tác',
    source: 'người quen',
    interestedServices: ['Makeup', 'Combo dịch vụ'],
    status: 'khách cũ',
    priority: 'thấp',
    address: 'Vạn Kiếp, Bình Thạnh, TP. HCM',
    notes: 'Makeup artist tự do hay kết hợp mượn gear hoặc kết hợp quay show cưới chung. Hay chia sẻ khách cho nhau.',
    createdAt: '2026-05-20'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p-1',
    title: 'Phóng sự cưới cặp đôi Duy & Oanh - Hội An',
    clientId: 'c-1',
    serviceType: 'Combo media',
    price: 18000000,
    deposit: 6000000,
    depositDate: '2026-04-12',
    finalPayment: 12000000,
    finalPaymentStatus: 'paid',
    dueDate: '2026-05-10',
    shootDate: '2026-04-25',
    driveLink: 'https://drive.google.com/drive/folders/duy-oanh-hoian-raw',
    status: 'hoàn thành',
    notes: 'Đã hoàn tất toàn bộ video highlight 5 phút, full documentary 45 phút và bàn giao album photobook. Khách rất hài lòng và đã thanh toán đủ.',
    contractNumber: 'HD-2026-001',
    taxDeclared: true,
    brief: 'Quay chụp highlight phóng sự đám cưới Hội An 2 ngày 1 đêm. Yêu cầu tone màu mộc mạc ấm áp cinematic.',
    receivedDate: '2026-04-10',
    location: 'Hội An, Quảng Nam',
    priority: 'cao',
    assignee: 'Nguyễn Văn Minh',
    collaborators: 'Phúc Lê (Trợ lý)',
    deliverablesLink: 'https://drive.google.com/drive/folders/duy-oanh-deliverables'
  },
  {
    id: 'p-2',
    title: 'Chụp lookbook Bộ sưu tập hè 2026 - ThuyDesign',
    clientId: 'c-2',
    serviceType: 'Chụp ảnh sản phẩm',
    price: 8500000,
    deposit: 3000000,
    depositDate: '2026-05-02',
    finalPayment: 5500000,
    finalPaymentStatus: 'unpaid',
    dueDate: '2026-06-02',
    shootDate: '2026-05-22',
    driveLink: 'https://drive.google.com/drive/folders/thuy-design-summer-2026',
    status: 'cần chỉnh sửa',
    notes: 'Buổi chụp diễn ra thuận lợi tại phim trường Quận 9. Đang chọn ảnh thô để retouch 40 tấm hoàn chỉnh. Sắp tới hạn bàn giao.',
    contractNumber: 'BG-2026-042',
    taxDeclared: false,
    brief: 'Chụp lookbook trang phục thiết kế hè. Retouch hoàn thiện 40 tấm chất lượng cao, bàn giao toàn bộ file thô đã resize.',
    receivedDate: '2026-05-01',
    location: 'Phim trường Bắc Âu, Quận 9',
    priority: 'trung bình',
    assignee: 'Chị Mai Thu Thủy',
    collaborators: 'Linh Nga (Makeup Artist)'
  },
  {
    id: 'p-3',
    title: 'Series 10 Video TikTok sản phẩm nội thất gỗ - Sài Gòn Mộc',
    clientId: 'c-3',
    serviceType: 'Reels/TikTok',
    price: 15000000,
    deposit: 5000000,
    depositDate: '2026-05-16',
    finalPayment: 10000000,
    finalPaymentStatus: 'unpaid',
    dueDate: '2026-06-15',
    shootDate: '2026-05-28',
    status: 'đang chuẩn bị',
    notes: 'Đã thống nhất Outline và Kịch bản cho 5 video đầu tiên. Ngày 28/05 bắt đầu bấm máy tại xưởng mộc ở Bình Dương.',
    contractNumber: 'HD-2026-015',
    taxDeclared: false,
    brief: 'Sản xuất chuỗi 10 video ngắn phát triển thương hiệu mộc decor. Quay trực tiếp xưởng và lồng giọng kể câu chuyện thương hiệu.',
    receivedDate: '2026-05-15',
    location: 'Xưởng mộc Sài Gòn Mộc, Thuận An, Bình Dương',
    priority: 'cao',
    assignee: 'Trần Hoàng Nam',
    collaborators: 'Duy Huy (Kịch bản)'
  },
  {
    id: 'p-4',
    title: 'Dựng video kỷ niệm 5 năm thành lập - Hương Sen Wedding',
    clientId: 'c-1',
    serviceType: 'Dựng video',
    price: 6000000,
    deposit: 0,
    finalPayment: 6000000,
    finalPaymentStatus: 'unpaid',
    dueDate: '2026-05-30',
    status: 'lead',
    notes: 'Gói dựng phim tư liệu cũ. Khách chưa đặt cọc vì đang chờ đối tác ký duyệt ngân sách tổng. Cần theo dõi sát để ký hợp đồng sớm.',
    contractNumber: 'BG-2026-077',
    taxDeclared: false,
    brief: 'Dựng ghép phim hoạt động kỷ niệm 5 năm thành lập Hương Sen Wedding từ nguồn tư liệu quay thô cũ từ 2021 đến nay.',
    receivedDate: '2026-05-20',
    location: 'Làm việc online / Editor Cabin Space',
    priority: 'thấp',
    assignee: 'Thế Anh (Editor)'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Doanh thu (Khoản thu) liên kết hoặc độc lập
  {
    id: 't-1',
    transactionNumber: 'TX-2026-001',
    projectId: 'p-1',
    clientId: 'c-2',
    type: 'thu',
    amount: 6000000,
    category: 'Cọc dự án',
    date: '2026-04-12',
    method: 'Chuyển khoản',
    status: 'Đã đối soát',
    notes: 'Nhận cọc 30% phóng sự cưới Duy & Oanh - Hội An',
    description: 'Nhận cọc 30% phóng sự cưới Duy & Oanh - Hội An'
  },
  {
    id: 't-2',
    transactionNumber: 'TX-2026-002',
    projectId: 'p-1',
    clientId: 'c-2',
    type: 'thu',
    amount: 12000000,
    category: 'Thanh toán đợt cuối',
    date: '2026-05-12',
    method: 'Chuyển khoản',
    status: 'Đã đối soát',
    notes: 'Tất toán hợp đồng phóng sự cưới Duy & Oanh - Hội An',
    description: 'Tất toán hợp đồng phóng sự cưới Duy & Oanh - Hội An'
  },
  {
    id: 't-3',
    transactionNumber: 'TX-2026-003',
    projectId: 'p-2',
    clientId: 'c-2',
    type: 'thu',
    amount: 3000000,
    category: 'Cọc dự án',
    date: '2026-05-02',
    method: 'Chuyển khoản',
    status: 'Đã đối soát',
    notes: 'Nhận cọc chụp bộ sưu tập hè ThuyDesign',
    description: 'Nhận cọc chụp bộ sưu tập hè ThuyDesign'
  },
  {
    id: 't-4',
    transactionNumber: 'TX-2026-004',
    projectId: 'p-3',
    clientId: 'c-3',
    type: 'thu',
    amount: 5000000,
    category: 'Cọc dự án',
    date: '2026-05-16',
    method: 'Chuyển khoản',
    status: 'Đã đối soát',
    notes: 'Cọc đợt 1 loạt video TikTok sản phẩm gỗ Sài Gòn Mộc',
    description: 'Cọc đợt 1 loạt video TikTok sản phẩm gỗ Sài Gòn Mộc'
  },
  {
    id: 't-5',
    transactionNumber: 'TX-2026-005',
    type: 'thu',
    amount: 1500000,
    category: 'Doanh thu ngoài',
    date: '2026-05-18',
    method: 'Chuyển khoản',
    status: 'Đã ghi nhận',
    notes: 'Bán lẻ file preset màu ảnh cưới Lightroom độc quyền cho studio bạn',
    description: 'Bán lẻ file preset màu ảnh cưới Lightroom độc quyền cho studio bạn'
  },

  // Chi phí (Khoản chi)
  {
    id: 't-6',
    transactionNumber: 'TX-2026-006',
    projectId: 'p-1',
    clientId: 'c-2',
    type: 'chi',
    amount: 2500000,
    category: 'Thuê thiết bị',
    date: '2026-04-24',
    method: 'Chuyển khoản',
    status: 'Đã đối soát',
    notes: 'Thuê Lens Sony 16-35 f2.8 GM và gimbal DJI Ronin RS3 Pro trong 2 ngày đi Hội An',
    description: 'Thuê Lens Sony 16-35 f2.8 GM và gimbal DJI Ronin RS3 Pro trong 2 ngày đi Hội An'
  },
  {
    id: 't-7',
    transactionNumber: 'TX-2026-007',
    projectId: 'p-1',
    clientId: 'c-2',
    type: 'chi',
    amount: 1200000,
    category: 'Thuê nhân sự ngoài (Model/Trợ lý/...)',
    date: '2026-04-25',
    method: 'Tiền mặt',
    status: 'Đã ghi nhận',
    notes: 'Thuê trợ lý ánh sáng & hỗ trợ mang vác phụ thiết bị tại Hội An',
    description: 'Thuê trợ lý ánh sáng & hỗ trợ mang vác phụ thiết bị tại Hội An'
  },
  {
    id: 't-8',
    transactionNumber: 'TX-2026-008',
    projectId: 'p-2',
    clientId: 'c-2',
    type: 'chi',
    amount: 1500000,
    category: 'Thuê studio / bối cảnh',
    date: '2026-05-22',
    method: 'Chuyển khoản',
    status: 'Đã đối soát',
    notes: 'Thanh toán tiền giờ thuê Phim trường phong cách Bắc Âu Quận 9 (3 tiếng)',
    description: 'Thanh toán tiền giờ thuê Phim trường phong cách Bắc Âu Quận 9 (3 tiếng)'
  },
  {
    id: 't-9',
    transactionNumber: 'TX-2026-009',
    type: 'chi',
    amount: 350000,
    category: 'Di chuyển / Xăng xe',
    date: '2026-05-22',
    method: 'Ví điện tử',
    status: 'Đã đối soát',
    notes: 'Grab Car di chuyển chở đồ studio đi Quận 9 khứ hồi',
    description: 'Grab Car di chuyển chở đồ studio đi Quận 9 khứ hồi'
  },
  {
    id: 't-10',
    transactionNumber: 'TX-2026-010',
    projectId: 'p-3',
    clientId: 'c-3',
    type: 'chi',
    amount: 850000,
    category: 'Ăn uống / Tiếp khách',
    date: '2026-05-17',
    method: 'Tiền mặt',
    status: 'Đã ghi nhận',
    notes: 'Cà phê họp bàn kịch bản chi tiết với anh Nam Sài Gòn Mộc',
    description: 'Cà phê họp bàn kịch bản chi tiết với anh Nam Sài Gòn Mộc'
  },
  {
    id: 't-11',
    transactionNumber: 'TX-2026-011',
    type: 'chi',
    amount: 1900000,
    category: 'Thiết bị mua mới / Sửa chữa',
    date: '2026-05-05',
    method: 'Chuyển khoản',
    status: 'Đã ghi nhận',
    notes: 'Mua Thẻ nhớ SD SanDisk Extreme Pro 128GB tốc độ cao 200MB/s chính hãng',
    description: 'Mua Thẻ nhớ SD SanDisk Extreme Pro 128GB tốc độ cao 200MB/s chính hãng'
  }
];

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'q-1',
    quoteNumber: 'BG-2026-001',
    clientId: 'c-2',
    projectId: 'p-2',
    createdDate: '2026-05-01',
    expiredDate: '2026-05-15',
    items: [
      {
        id: 'qi-1',
        name: 'Chụp ảnh Lookbook bộ sưu tập mới',
        description: 'Chụp lookbook trang phục thiết kế hè. Retouch hoàn thiện 40 tấm chất lượng cao, bàn giao ảnh thô.',
        quantity: 1,
        price: 6500000,
        total: 6500000
      },
      {
        id: 'qi-2',
        name: 'Dịch vụ Makeup & Làm tóc chuyên nghiệp',
        description: 'Makeup 1 mẫu chính, thay đổi 3 layout makeup theo concept trang phục.',
        quantity: 1,
        price: 2000000,
        total: 2000000
      }
    ],
    discount: 0,
    totalBeforeDiscount: 8500000,
    totalAfterDiscount: 8500000,
    paymentTerms: 'Tạm ứng trước 30-50% để giữ lịch chụp, phần còn lại thanh toán ngay khi bàn giao sản phẩm duyệt sửa.',
    proposedDepositRate: 35,
    depositAmount: 3000000,
    deliveryTimeframe: 'Bàn giao file ảnh thô trong vòng 24h sau chụp. Ảnh chỉnh sửa hoàn thiện 40 tấm sau 5 ngày chọn ảnh.',
    notes: 'Báo giá đã bao gồm trang thiết bị đèn studio di động. Chưa bao gồm tiền thuê phim trường/studio.',
    status: 'đã duyệt'
  },
  {
    id: 'q-2',
    quoteNumber: 'BG-2026-015',
    clientId: 'c-3',
    projectId: 'p-3',
    createdDate: '2026-05-14',
    expiredDate: '2026-05-28',
    items: [
      {
        id: 'qi-3',
        name: 'Sản xuất chuỗi 10 video ngắn TikTok/Reels',
        description: 'Lên outline kịch bản, quay dựng chuỗi 10 video ngắn phát triển thương hiệu thiết kế decor mộc.',
        quantity: 10,
        price: 1500000,
        total: 15000000
      }
    ],
    discount: 0,
    totalBeforeDiscount: 15000000,
    totalAfterDiscount: 15000000,
    paymentTerms: 'Cọc 2 đợt: Đợt 1 tạm ứng 5.000.000đ khi duyệt xong Kịch bản. Đợt 2 thanh toán 10.000.000đ khi bàn giao trọn bộ.',
    proposedDepositRate: 30,
    depositAmount: 5000000,
    deliveryTimeframe: 'Bàn giao cuốn kịch bản sau 3 ngày. Bàn giao 5 video đợt một sau 7 ngày kết thúc bấm máy, đợt tiếp theo cuốn chiếu mỗi tuần 2 video.',
    notes: 'Quay chụp tại xưởng của khách. Đã bao gồm thiết bị đèn mảng và mic không dây thu âm hiện trường.',
    status: 'đã duyệt'
  },
  {
    id: 'q-3',
    quoteNumber: 'BG-2026-088',
    clientId: 'c-1',
    createdDate: '2026-05-25',
    expiredDate: '2026-06-10',
    items: [
      {
        id: 'qi-4',
        name: 'Gói thiết kế Nhận diện thương hiệu cơ bản',
        description: 'Thiết kế Logo, quy chuẩn màu sắc, phông chữ, danh thiếp và mẫu phong bì thư.',
        quantity: 1,
        price: 5000000,
        total: 5000000
      }
    ],
    discount: 500000,
    totalBeforeDiscount: 5000000,
    totalAfterDiscount: 4500000,
    paymentTerms: 'Thanh toán tạm ứng 50% bắt đầu thực hiện dự án. 50% còn lại thanh toán khi bàn giao file vector gốc.',
    proposedDepositRate: 50,
    depositAmount: 2250000,
    deliveryTimeframe: 'Phác thảo 3 mẫu logo sau 5 ngày. Hoàn thiện bộ nhận diện sau 7 ngày kể từ khi chốt mẫu logo.',
    notes: 'Hỗ trợ sửa đổi tối đa 3 lần cho phương án logo đã lựa chọn.',
    status: 'khách đang xem xét'
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'hd-1',
    contractNumber: 'HD-2026-101',
    title: 'Hợp đồng Quay chụp phóng sự cưới Duy & Oanh - Hội An',
    clientId: 'c-1',
    projectId: 'p-1',
    quotationId: 'q-1',
    createdDate: '2026-04-12',
    signedDate: '2026-04-14',
    totalValue: 18000000,
    deposit: 6000000,
    remainingAmount: 12000000,
    scopeOfWork: 'Quay chụp highlight phóng sự đám cưới Hội An 2 ngày 1 đêm. Sản xuất: 01 Video Highlight phóng sự dài 3 - 5 phút chất lượng điện ảnh, bàn giao 150 file hình ảnh retouch màu và toàn bộ file gốc chụp sự kiện.',
    freeRevisions: 3,
    extraRevisionCost: 500000,
    deliveryTimeframe: 'Bàn giao video demo và link ảnh số sau 15 ngày làm việc kể từ ngày diễn ra lễ cưới.',
    paymentTerms: 'Đợt 1: Tạm ứng cọc 30% khi ký kết hợp đồng. Đợt 2: Thanh toán nốt 70% còn lại ngay sau khi nghiệm thu và bàn giao sản phẩm hoàn thiện cuối cùng qua Google Drive.',
    cancellationTerms: 'Trong trường hợp một trong hai bên đơn phương hủy bỏ hợp đồng mà không có sự đồng thuận bằng văn bản của bên còn lại, bên hủy hợp đồng sẽ chịu phạt 50% tổng giá trị hợp đồng. Tiền đặt cọc sẽ không được hoàn lại nếu bên A (Khách hàng) thay đổi lịch đột xuất dưới 7 ngày.',
    copyrightTerms: 'Bên B (Freelancer) có đầy đủ quyền tác giả đối với toàn bộ tệp hình ảnh & video được sản xuất. Bên B được quyền sử dụng các ấn phẩm này để quảng bá năng lực cá nhân trên portfolio và các phương tiện social trừ phi có thỏa thuận bảo mật khác.',
    confidentialityTerms: 'Hai bên cam kết giữ bí mật hoàn toàn các thông tin cá nhân và chi phí thỏa thuận riêng trong suốt thời gian thực hiện dịch vụ.',
    status: 'hoàn thành'
  },
  {
    id: 'hd-2',
    contractNumber: 'HD-2026-102',
    title: 'Hợp đồng Chụp ảnh trang phục hè model Thủy Design',
    clientId: 'c-2',
    projectId: 'p-2',
    quotationId: 'q-1',
    createdDate: '2026-05-02',
    signedDate: '2026-05-03',
    totalValue: 8500000,
    deposit: 3000000,
    remainingAmount: 5500000,
    scopeOfWork: 'Chụp ảnh Lookbook BST trang phục thiết kế hè gồm 15 mẫu quần áo tại phim trường Quận 9. Retouch màu sắc bối cảnh hoàn chỉnh 40 tấm ảnh xuất sắc nhất.',
    freeRevisions: 2,
    extraRevisionCost: 150000,
    deliveryTimeframe: 'Bàn giao file ảnh thô trong vòng 24 giờ sau buổi chụp. File ảnh retouch bàn giao sau 5 ngày kể từ thời điểm bên A chốt danh sách chọn ảnh.',
    paymentTerms: 'Bên A thanh toán tạm ứng 3.000.000đ khi ký hợp đồng. 5.500.000đ còn lại được thanh toán dứt điểm khi bàn giao tệp ảnh JPG xuất sắc đã xử lý.',
    cancellationTerms: 'Nếu hủy lịch trước ngày bấm máy 48 giờ, khách hàng chịu mất 100% tiền tạm ứng đặt cọc bối cảnh và chuẩn bị.',
    copyrightTerms: 'Bên A được toàn quyền sử dụng hình ảnh thương mại để chạy quảng cáo bán hàng. Bên B giữ quyền tác giả và được gắn thẻ ghi nhận tác phẩm (credit) khi đăng tải album nghệ thuật phi thương mại.',
    status: 'đang thực hiện'
  },
  {
    id: 'hd-3',
    contractNumber: 'HD-2026-103',
    title: 'Hợp đồng Sản xuất 10 video Reels thương hiệu Sài Gòn Mộc',
    clientId: 'c-3',
    projectId: 'p-3',
    quotationId: 'q-2',
    createdDate: '2026-05-15',
    totalValue: 15000000,
    deposit: 5000000,
    remainingAmount: 10000000,
    scopeOfWork: '- Biên tập kịch bản chi tiết cho chuỗi 10 video ngắn phát triển thương hiệu.\n- Quay chụp tại xưởng Thuận An 1 ngày trọn gói.\n- Hậu kỳ, dựng phim hoàn chỉnh, chèn nhạc, phụ đề và xuất file độ phân giải cao.',
    freeRevisions: 2,
    extraRevisionCost: 300000,
    deliveryTimeframe: 'Kịch bản: Hoàn thiện sau 3 ngày kể từ khi ký hợp đồng.\nVideo hoàn chỉnh: Bàn giao cuốn chiếu 2 video mỗi tuần kể từ ngày bấm máy thực tế.',
    paymentTerms: 'Chuyển khoản cọc 35% ngay khi ký thỏa thuận. Thanh toán 65% số tiền còn lại sau khi thống nhất nghiệm thu toàn bộ 10 video.',
    cancellationTerms: 'Nếu bên A đơn phương hủy bỏ dự án khi đã lên kịch bản chi tiết, sẽ phải bồi thường 30% giá trị hợp đồng cho công tác lên ý tưởng sáng tạo.',
    copyrightTerms: 'Quyền sử dụng độc quyền tệp video thô và video thành phẩm thuộc về bên A trên các kênh xã hội chính thức. Bên B giữ quyền tác giả nguyên bản.',
    confidentialityTerms: 'Không tiết lộ thông tin quy trình sản xuất mộc mỹ nghệ độc quyền của bên A ra ngoài.',
    status: 'chờ khách xác nhận'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    title: 'Họp brief dự án Duy & Oanh - Hội An',
    clientId: 'c-1',
    projectId: 'p-1',
    type: 'Họp brief',
    startDate: '2026-05-26T10:00',
    endDate: '2026-05-26T11:30',
    location: 'Văn phòng Studio & Zoom online',
    onlineMeetingLink: 'https://zoom.us/j/9876543210',
    notes: 'Xem kỹ moodboard và thống nhất kịch bản quay highlight bấm máy Hội An.',
    status: 'Sắp diễn ra'
  },
  {
    id: 'apt-2',
    title: 'Chụp ảnh dã ngoại bối cảnh hè model Thủy Design',
    clientId: 'c-2',
    projectId: 'p-2',
    type: 'Chụp ảnh',
    startDate: '2026-05-27T08:00',
    endDate: '2026-05-27T17:00',
    location: 'Phim trường Quận 9 & ngoài trời',
    notes: 'Mẫu Thủy tự chuẩn bị layouts makeup. Nhắc mẫu mang thêm phụ kiện giày dép.',
    status: 'Sắp diễn ra'
  },
  {
    id: 'apt-3',
    title: 'Họp tư vấn chốt kịch bản chuỗi Reels Sài Gòn Mộc',
    clientId: 'c-3',
    projectId: 'p-3',
    type: 'Tư vấn',
    startDate: '2026-05-25T14:00',
    endDate: '2026-05-25T15:30',
    location: 'Highlands Coffee GigaMall Thủ Đức',
    notes: 'Đã thống nhất 5 kịch bản đầu về quá trình tạo tác gỗ nguyên khối.',
    status: 'Hoàn thành'
  },
  {
    id: 'apt-4',
    title: 'Nhắc thanh toán tạm ứng hợp đồng Thủy Design',
    clientId: 'c-2',
    type: 'Nhắc thanh toán',
    startDate: '2026-05-26T09:00',
    endDate: '2026-05-26T09:15',
    location: 'Zalo / Chat trực tiếp',
    notes: 'Sử dụng mẫu tin nhắc lịch sự lần 1.',
    status: 'Sắp diễn ra'
  }
];



