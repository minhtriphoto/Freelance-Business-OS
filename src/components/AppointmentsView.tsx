import React, { useState, useMemo } from 'react';
import {
  Appointment,
  AppointmentType,
  AppointmentStatus,
  Project,
  Client
} from '../types';
import { formatDate } from '../utils';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  Users,
  Briefcase,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Bell,
  X,
  CalendarDays,
  ListFilter,
  ArrowRight,
  User,
  Info,
  Layers,
  FileSignature
} from 'lucide-react';

interface AppointmentsViewProps {
  appointments: Appointment[];
  projects: Project[];
  clients: Client[];
  onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  onUpdateAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
}

export default function AppointmentsView({
  appointments,
  projects,
  clients,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment
}: AppointmentsViewProps) {
  // Calendar Navigation Dates
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-05-26')); // Align with metadata mockup date
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');

  // Filters state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Selected Day in month view
  const [selectedDayStr, setSelectedDayStr] = useState<string>('2026-05-26');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [type, setType] = useState<AppointmentType>('Tư vấn');
  const [startDateStr, setStartDateStr] = useState('2026-05-26T10:00');
  const [endDateStr, setEndDateStr] = useState('2026-05-26T11:00');
  const [location, setLocation] = useState('');
  const [onlineMeetingLink, setOnlineMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('Sắp diễn ra');

  // Quick lookup indices
  const clientsMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const projectsMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  // Exact mockup today parameter
  const todayStr = '2026-05-26';
  const todayDate = new Date(todayStr);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const client = clientsMap.get(apt.clientId || '');
      const project = projectsMap.get(apt.projectId || '');
      const searchLower = search.toLowerCase();

      const matchesSearch =
        apt.title.toLowerCase().includes(searchLower) ||
        (apt.location || '').toLowerCase().includes(searchLower) ||
        (apt.notes || '').toLowerCase().includes(searchLower) ||
        (client ? client.name.toLowerCase().includes(searchLower) : false) ||
        (project ? project.title.toLowerCase().includes(searchLower) : false);

      const matchesType = filterType === 'all' || apt.type === filterType;
      const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [appointments, search, filterType, filterStatus, clientsMap, projectsMap]);

  // Today's Appointments Counter & Events
  const todayEvents = useMemo(() => {
    return appointments.filter(apt => {
      const startDay = apt.startDate.split('T')[0];
      return startDay === todayStr && apt.status !== 'Hủy';
    });
  }, [appointments]);

  // Overdue Deadline alerts (Projects with dueDate in next 7 days or overdue)
  const approachingProjectDeadlines = useMemo(() => {
    return projects
      .filter(p => p.status !== 'hoàn thành' && p.status !== 'completed' && p.status !== 'hủy' && p.dueDate)
      .map(p => {
        const dueDateObj = new Date(p.dueDate!);
        const diffMs = dueDateObj.getTime() - todayDate.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
          ...p,
          daysRemaining: diffDays
        };
      })
      .filter(p => p.daysRemaining <= 7)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [projects, todayDate]);

  // Calendar Day cell builder for currently navigated Month
  const calendarCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Day of week of first day (0-6)
    let startDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Monday ...
    // Adjust to starting the week with Monday (Optional, but let's stick to standard Sunday)
    
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();

    const cells: { date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Prior Month trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dayFormatted = d.toISOString().split('T')[0];
      cells.push({
        date: d,
        dateStr: dayFormatted,
        isCurrentMonth: false,
        isToday: dayFormatted === todayStr
      });
    }

    // Active Month days
    for (let i = 1; i <= numDays; i++) {
      const d = new Date(year, month, i);
      const dayFormatted = d.toISOString().split('T')[0];
      cells.push({
        date: d,
        dateStr: dayFormatted,
        isCurrentMonth: true,
        isToday: dayFormatted === todayStr
      });
    }

    // Next Month leading days
    const totalSlots = 42; // standard 6-row grid
    const remainingSlots = totalSlots - cells.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      const dayFormatted = d.toISOString().split('T')[0];
      cells.push({
        date: d,
        dateStr: dayFormatted,
        isCurrentMonth: false,
        isToday: dayFormatted === todayStr
      });
    }

    return cells;
  }, [currentDate]);

  // Appointments grouped by date for Month view quick layout dots
  const appointmentsByDate = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    appointments.forEach(apt => {
      const dStr = apt.startDate.split('T')[0];
      if (!groups[dStr]) groups[dStr] = [];
      groups[dStr].push(apt);
    });
    return groups;
  }, [appointments]);

  // Navigate month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Nav month fast today
  const navToToday = () => {
    setCurrentDate(new Date(todayStr));
    setSelectedDayStr(todayStr);
  };

  // Weekly start and end days calculation
  const currentWeekDays = useMemo(() => {
    const dayOfWeek = currentDate.getDay(); // 0 is Sunday
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek + 1); // Start from Monday

    const weekDays: { date: Date; dateStr: string; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dayStr = d.toISOString().split('T')[0];
      weekDays.push({
        date: d,
        dateStr: dayStr,
        isToday: dayStr === todayStr
      });
    }
    return weekDays;
  }, [currentDate]);

  // Day Formatter helper for week headers
  const getVietnameseDayName = (dayIdx: number) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[dayIdx];
  };

  // Open creation modal
  const handleOpenCreateForm = (datePreFill?: string) => {
    setEditingAppointment(null);
    setTitle('');
    setClientId('');
    setProjectId('');
    setType('Tư vấn');
    
    const nowHour = '10:00';
    const fillDate = datePreFill || selectedDayStr || todayStr;
    setStartDateStr(`${fillDate}T${nowHour}`);
    setEndDateStr(`${fillDate}T11:00`);
    setLocation('');
    setOnlineMeetingLink('');
    setNotes('');
    setStatus('Sắp diễn ra');
    
    setFormModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditForm = (apt: Appointment) => {
    setEditingAppointment(apt);
    setTitle(apt.title);
    setClientId(apt.clientId || '');
    setProjectId(apt.projectId || '');
    setType(apt.type);
    setStartDateStr(apt.startDate);
    setEndDateStr(apt.endDate);
    setLocation(apt.location || '');
    setOnlineMeetingLink(apt.onlineMeetingLink || '');
    setNotes(apt.notes || '');
    setStatus(apt.status);
    
    setFormModalOpen(true);
  };

  // Handle Form Submit (Both Create & Update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề lịch hẹn!');
      return;
    }

    if (new Date(startDateStr) > new Date(endDateStr)) {
      alert('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu!');
      return;
    }

    const payload = {
      title: title.trim(),
      clientId: clientId || undefined,
      projectId: projectId || undefined,
      type,
      startDate: startDateStr,
      endDate: endDateStr,
      location: location.trim() || undefined,
      onlineMeetingLink: onlineMeetingLink.trim() || undefined,
      notes: notes.trim() || undefined,
      status
    };

    if (editingAppointment) {
      onUpdateAppointment({
        ...payload,
        id: editingAppointment.id
      });
      alert('Cập nhật lịch hẹn thành công!');
    } else {
      onAddAppointment(payload);
      alert('Tạo lịch hẹn công tác mới thành công!');
    }

    setFormModalOpen(false);
  };

  // Quick state toggling status
  const handleToggleStatus = (apt: Appointment, nextStatus: AppointmentStatus) => {
    onUpdateAppointment({
      ...apt,
      status: nextStatus
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn lịch hẹn này?')) {
      onDeleteAppointment(id);
    }
  };

  // Find meetings matching selected day inMonth/Day detail preview container
  const selectedDayMeetings = useMemo(() => {
    return appointments.filter(apt => apt.startDate.split('T')[0] === selectedDayStr);
  }, [appointments, selectedDayStr]);

  return (
    <div className="flex-1 flex flex-col space-y-6">

      {/* TOP HEADER & TODAY NOTIFICATION BANNER */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-950 flex items-center gap-2">
            <span className="p-2 bg-brand-green-light/10 text-brand-green-mid rounded-lg">
              <CalendarIcon size={22} />
            </span>
            Lịch làm việc & Định giờ chụp hình
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            Phân mục sắp xếp công vụ: Tư vấn khách hàng, Quay phim chụp ảnh tại hiện trường, Theo dõi mốc Deadline bàn giao và Nhắc nợ thanh toán.
          </p>
        </div>

        {/* ALERTS MODULE RIGHT-SIDE */}
        <div className="flex flex-wrap gap-2">
          {todayEvents.length > 0 ? (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-3 animate-pulse">
              <span className="p-1.5 bg-rose-600 text-white rounded-lg">
                <Bell size={16} />
              </span>
              <div>
                <p className="text-xs font-black text-rose-955">
                  Lịch hẹn hôm nay! ({todayEvents.length} sự kiện)
                </p>
                <p className="text-[10px] text-rose-700 font-medium">
                  Bấm để truy cập nhanh giờ làm việc trong ngày.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
              <span className="p-1.5 bg-slate-400 text-white rounded-lg">
                <Info size={16} />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-700">Độc lập rảnh rỗi</p>
                <p className="text-[10px] text-slate-405">Hôm nay không có lịch chụp / tư vấn.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DASHBOARD GRID: MAIN CALENDAR VS ALERTS/DEADLINES COLUMN */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COLUMN: PRIMARY CALENDAR FRAMEWORK */}
        <div className="xl:col-span-3 space-y-5">
          
          {/* TOOLBAR CONTROLS */}
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-3xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Navigators */}
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                title="Tháng trước"
              >
                <ChevronLeft size={16} />
              </button>
              
              <button
                onClick={navToToday}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hôm nay
              </button>

              <button
                onClick={nextMonth}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                title="Tháng sau"
              >
                <ChevronRight size={16} />
              </button>

              <h2 className="ml-2.5 text-sm font-black text-slate-900 capitalize">
                Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
              </h2>
            </div>

            {/* View selectors */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0">
                {(['month', 'week', 'day', 'agenda'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setCalendarView(v)}
                    className={`px-3 py-1.5 rounded-lg text-3xs font-black capitalize transition-all ${
                      calendarView === v
                        ? 'bg-white shadow-3xs text-slate-900'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {v === 'month' ? 'Tháng' : v === 'week' ? 'Tuần' : v === 'day' ? 'Ngày' : 'Sổ lịch'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleOpenCreateForm()}
                className="px-3 py-1.5 bg-brand-green-mid hover:bg-brand-green-mid/90 text-white rounded-xl text-3xs font-black flex items-center gap-1 shadow-3xs shrink-0 cursor-pointer"
              >
                <Plus size={13} /> Thêm Lịch hẹn
              </button>
            </div>

          </div>

          {/* MAIN GRID ACCORDING TO VIEW */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-3xs overflow-hidden">
            
            {/* MONTH VIEW CALENDAR */}
            {calendarView === 'month' && (
              <div>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-center py-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <div>T2</div>
                  <div>T3</div>
                  <div>T4</div>
                  <div>T5</div>
                  <div>T6</div>
                  <div>T7</div>
                  <div className="text-rose-500">CN</div>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-100 min-h-[440px] text-xs">
                  {calendarCells.map((cell, idx) => {
                    const meetings = appointmentsByDate[cell.dateStr] || [];
                    const isSelectedVal = selectedDayStr === cell.dateStr;

                    return (
                      <button
                        key={`${cell.dateStr}-${idx}`}
                        onClick={() => setSelectedDayStr(cell.dateStr)}
                        className={`min-h-[75px] p-2 flex flex-col justify-between items-stretch text-left transition-all relative cursor-pointer outline-hidden group ${
                          cell.isCurrentMonth ? 'bg-white text-slate-900' : 'bg-slate-50/40 text-slate-350'
                        } ${isSelectedVal ? 'ring-2 ring-brand-green-light ring-inset bg-brand-green-light/5' : ''} ${
                          cell.isToday ? 'bg-emerald-50/25' : ''
                        }`}
                      >
                        {/* Day indicator label */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center justify-center p-1 font-bold w-6 h-6 rounded-full text-xxs ${
                              cell.isToday 
                                ? 'bg-emerald-600 text-white font-black' 
                                : isSelectedVal 
                                ? 'text-brand-green-mid bg-brand-green-light/10 font-black' 
                                : 'text-slate-700'
                            }`}
                          >
                            {cell.date.getDate()}
                          </span>

                          {/* Quick add trigger button */}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCreateForm(cell.dateStr);
                            }}
                            className="text-slate-400 hover:text-brand-green-mid opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          >
                            <Plus size={11} />
                          </span>
                        </div>

                        {/* Event List Previews */}
                        <div className="space-y-1 mt-1 flex-1 overflow-hidden pointer-events-none">
                          {meetings.slice(0, 3).map(m => {
                            let typeBg = 'bg-slate-100 text-slate-700';
                            if (m.type === 'Chụp ảnh') typeBg = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                            if (m.type === 'Quay video') typeBg = 'bg-rose-50 text-rose-700 border-rose-100';
                            if (m.type === 'Tư vấn') typeBg = 'bg-indigo-50 text-indigo-750 border-indigo-100';
                            if (m.type === 'Deadline bàn giao') typeBg = 'bg-amber-50 text-amber-700 border-amber-100';
                            if (m.type === 'Nhắc thanh toán') typeBg = 'bg-purple-50 text-purple-750 border-purple-100';

                            return (
                              <div
                                key={m.id}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-xs border truncate ${typeBg}`}
                                title={m.title}
                              >
                                {m.startDate.split('T')[1]} {m.title}
                              </div>
                            );
                          })}
                          {meetings.length > 3 && (
                            <div className="text-[8px] font-black text-slate-400 pl-1.5">
                              + {meetings.length - 3} sự kiện khác
                            </div>
                          )}
                        </div>

                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WEEK VIEW CALENDAR */}
            {calendarView === 'week' && (
              <div className="divide-y divide-slate-100 text-xs">
                {/* Headers */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-center py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {currentWeekDays.map(wd => (
                    <div key={wd.dateStr} className={wd.isToday ? 'text-brand-green-mid bg-emerald-50/10' : ''}>
                      <p>{getVietnameseDayName(wd.date.getDay())}</p>
                      <p className="text-slate-700 font-black mt-1">{wd.date.getDate()}/{wd.date.getMonth() + 1}</p>
                    </div>
                  ))}
                </div>

                {/* Day content blocks */}
                <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[380px]">
                  {currentWeekDays.map(wd => {
                    const meetings = appointmentsByDate[wd.dateStr] || [];

                    return (
                      <div
                        key={wd.dateStr}
                        onClick={() => setSelectedDayStr(wd.dateStr)}
                        className={`p-3 space-y-2 text-left min-h-[350px] cursor-pointer hover:bg-slate-50/30 transition-all ${
                          selectedDayStr === wd.dateStr ? 'bg-brand-green-light/5 ring-1 ring-brand-green-light ring-inset' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center text-3xs font-black">
                          <span className={wd.isToday ? 'text-emerald-700 font-extrabold animate-pulse' : 'text-slate-400'}>
                            {wd.isToday ? '★ HÔM NAY' : ''}
                          </span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCreateForm(wd.dateStr);
                            }}
                            className="text-slate-400 hover:text-brand-green-mid hover:bg-slate-100 rounded p-1"
                          >
                            <Plus size={11} />
                          </span>
                        </div>

                        {meetings.length === 0 ? (
                          <div className="text-3xs text-slate-350 italic text-center pt-8 font-medium">Trống</div>
                        ) : (
                          <div className="space-y-2">
                            {meetings.map(m => {
                              let badgeColor = 'bg-slate-550';
                              if (m.type === 'Chụp ảnh') badgeColor = 'bg-emerald-600';
                              if (m.type === 'Quay video') badgeColor = 'bg-rose-600';
                              if (m.type === 'Tư vấn') badgeColor = 'bg-indigo-600';
                              if (m.type === 'Deadline bàn giao') badgeColor = 'bg-amber-600';
                              if (m.type === 'Nhắc thanh toán') badgeColor = 'bg-purple-600';

                              return (
                                <div
                                  key={m.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditForm(m);
                                  }}
                                  className="p-2 bg-slate-50 border border-slate-150 rounded-xl hover:border-slate-300 transition-all text-left space-y-1 block relative"
                                >
                                  <div className="flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${badgeColor}`} />
                                    <span className="text-[9px] font-black text-slate-400 font-mono">
                                      {m.startDate.split('T')[1]}
                                    </span>
                                  </div>
                                  <p className="font-extrabold text-[10px] text-slate-800 line-clamp-2">{m.title}</p>
                                  {m.location && (
                                    <p className="text-[8px] text-slate-400 text-slate-500 font-medium truncate flex items-center gap-0.5">
                                      <MapPin size={8} /> {m.location}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DAY VIEW CALENDAR */}
            {calendarView === 'day' && (
              <div className="p-5 space-y-4">
                <div className="bg-slate-50 p-4 border border-slate-200/60 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded">
                      NGÀY LÀM VIỆC LỰA CHỌN
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-1">
                      {getVietnameseDayName(new Date(selectedDayStr).getDay())}, ngày {formatDate(selectedDayStr)}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleOpenCreateForm(selectedDayStr)}
                    className="px-3 py-1.5 bg-brand-green-mid hover:bg-brand-green-mid/90 text-white font-bold rounded-lg text-2xs flex items-center gap-1.5 shadow-3xs cursor-pointer"
                  >
                    <Plus size={12} /> Thêm kế hoạch trong ngày
                  </button>
                </div>

                {selectedDayMeetings.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 space-y-2">
                    <CalendarDays className="mx-auto text-slate-300 animate-pulse" size={36} />
                    <p className="text-xs font-black text-slate-700">Chưa có lịch hạch toán công vụ cho ngày hôm nay.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayMeetings.sort((a,b) => a.startDate.localeCompare(b.startDate)).map(m => {
                      const client = clientsMap.get(m.clientId || '');
                      const project = projectsMap.get(m.projectId || '');

                      return (
                        <div
                          key={m.id}
                          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-xs transition-shadow"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-3.5 bg-slate-50 rounded-xl max-w-[80px] shrink-0 text-center font-mono">
                              <Clock size={15} className="mx-auto text-slate-400" />
                              <span className="text-xs font-black text-slate-800 block mt-1">
                                {m.startDate.split('T')[1]}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                  m.type === 'Chụp ảnh' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                                  m.type === 'Quay video' ? 'bg-rose-50 text-rose-700 border-rose-150' :
                                  m.type === 'Tư vấn' ? 'bg-indigo-50 text-indigo-750 border-indigo-150' : 'bg-slate-50 text-slate-700'
                                }`}>
                                  {m.type}
                                </span>
                                
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                  m.status === 'Hoàn thành' ? 'bg-emerald-100 text-emerald-800' :
                                  m.status === 'Dời lịch' ? 'bg-amber-100 text-amber-800' :
                                  m.status === 'Hủy' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {m.status}
                                </span>
                              </div>

                              <h4 className="font-extrabold text-sm text-slate-900">{m.title}</h4>
                              
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xxs text-slate-500 font-medium">
                                {m.location && (
                                  <span className="flex items-center gap-0.5">
                                    <MapPin size={11} /> {m.location}
                                  </span>
                                )}
                                {client && (
                                  <span className="flex items-center gap-0.5 font-bold text-slate-700">
                                    <Users size={11} /> {client.name}
                                  </span>
                                )}
                                {project && (
                                  <span className="flex items-center gap-0.5 text-brand-green-mid">
                                    <Briefcase size={11} /> Job: {project.title}
                                  </span>
                                )}
                              </div>

                              {m.notes && (
                                <p className="text-3xs text-slate-400 italic mt-1 font-medium bg-slate-50/50 p-2 rounded">
                                  Ghi chú: {m.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1.5 justify-end shrink-0">
                            <button
                              onClick={() => handleOpenEditForm(m)}
                              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer"
                              title="Sửa"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="p-1.5 border border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-400 cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* AGENDA VIEW / LIST VIEW */}
            {calendarView === 'agenda' && (
              <div className="p-0 text-xs">
                
                {/* Filters Row */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-3 text-2xs">
                  
                  {/* Text search */}
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm công vụ theo nội dung, địa điểm, khách hàng..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 font-medium"
                    />
                  </div>

                  {/* Dropdowns */}
                  <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                    <select
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="all">Loại: Tất cả</option>
                      <option value="Tư vấn">Tư vấn</option>
                      <option value="Chụp ảnh">Chụp ảnh</option>
                      <option value="Quay video">Quay video</option>
                      <option value="Họp brief">Họp brief</option>
                      <option value="Họp duyệt sản phẩm">Kiểm duyệt SP</option>
                      <option value="Deadline bàn giao">Mốc Deadline</option>
                      <option value="Nhắc thanh toán">Nhắc nợ</option>
                      <option value="Khác">Khác</option>
                    </select>

                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="all">Trạng thái: Tất cả</option>
                      <option value="Sắp diễn ra">Sắp diễn ra</option>
                      <option value="Hoàn thành">Hoàn thành</option>
                      <option value="Dời lịch">Dời lịch</option>
                      <option value="Hủy">Đã hủy</option>
                    </select>
                  </div>

                </div>

                {filteredAppointments.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <ListFilter className="mx-auto text-slate-300" size={40} />
                    <p className="font-extrabold text-slate-700 text-sm">Không tìm thấy lịch hẹn khớp bộ lọc</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Vui lòng tối giản hóa các tiêu chuẩn tìm kiếm để tìm lại dữ liệu đã xếp.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredAppointments.sort((a,b) => a.startDate.localeCompare(b.startDate)).map(m => {
                      const client = clientsMap.get(m.clientId || '');
                      const project = projectsMap.get(m.projectId || '');

                      return (
                        <div key={m.id} className="p-4 hover:bg-slate-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          
                          <div className="space-y-1.5 flex-1 col-span-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xxs font-black text-slate-600 bg-slate-100 rounded px-1.5 py-0.2">
                                {formatDate(m.startDate.split('T')[0])} ({m.startDate.split('T')[1]})
                              </span>

                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                                m.type === 'Chụp ảnh' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                                m.type === 'Quay video' ? 'bg-rose-50 text-rose-700 border-rose-150' :
                                m.type === 'Tư vấn' ? 'bg-indigo-50 text-indigo-750 border-indigo-150' : 'bg-slate-50 text-slate-500'
                              }`}>
                                {m.type}
                              </span>

                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                m.status === 'Hoàn thành' ? 'bg-emerald-100 text-emerald-850' :
                                m.status === 'Dời lịch' ? 'bg-amber-100 text-amber-855' :
                                m.status === 'Hủy' ? 'bg-rose-100 text-rose-855' : 'bg-blue-100 text-blue-855'
                              }`}>
                                {m.status}
                              </span>
                            </div>

                            <h4 className="font-extrabold text-slate-900 text-xs md:text-sm">{m.title}</h4>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium">
                              {m.location && (
                                <span className="flex items-center gap-0.5">
                                  <MapPin size={11} className="text-slate-400" /> {m.location}
                                </span>
                              )}
                              {client && (
                                <span className="flex items-center gap-0.5 font-bold text-slate-700">
                                  <Users size={11} className="text-slate-400" /> Khách: {client.name}
                                </span>
                              )}
                              {project && (
                                <span className="flex items-center gap-0.5 text-brand-green-mid">
                                  <Briefcase size={11} className="text-brand-green-light" /> Job: {project.title}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            
                            {/* Fast status trigger buttons */}
                            {m.status === 'Sắp diễn ra' && (
                              <button
                                onClick={() => handleToggleStatus(m, 'Hoàn thành')}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-extrabold rounded hover:bg-emerald-100 transition-colors"
                              >
                                Hoàn tất nhanh
                              </button>
                            )}

                            <div className="flex gap-1">
                              <button
                                onClick={() => handleOpenEditForm(m)}
                                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                                title="Sửa"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => handleDelete(m.id)}
                                className="p-1.5 border border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-405 cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

          </div>

          {/* DETAILED AGENDA BOX FOR SELECTED DAY CELL */}
          {calendarView === 'month' && (
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-slate-900">
                    Sự kiện ngày {formatDate(selectedDayStr)}
                  </h3>
                  <p className="text-3xs text-slate-450 mt-0.5">
                    ({selectedDayMeetings.length} kế hoạch cụ thể)
                  </p>
                </div>
                <button
                  onClick={() => handleOpenCreateForm(selectedDayStr)}
                  className="px-3 py-1 bg-brand-green-mid hover:bg-brand-green-mid/90 text-white font-bold rounded-lg text-3xs flex items-center gap-1 shadow-3xs cursor-pointer"
                >
                  <Plus size={11} /> Đóng lịch ngày này
                </button>
              </div>

              {selectedDayMeetings.length === 0 ? (
                <p className="text-slate-400 italic text-center py-4 font-medium">
                  Trống lịch công tác. Bạn có thể tự do lên kế hoạch sáng tạo cá nhân ngày này!
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedDayMeetings.map(m => {
                    const client = clientsMap.get(m.clientId || '');
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleOpenEditForm(m)}
                        className="p-3.5 bg-slate-50 border border-slate-200 hover:border-slate-350 cursor-pointer rounded-xl flex items-start gap-2.5 transition-colors relative"
                      >
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          m.type === 'Chụp ảnh' ? 'bg-emerald-600' :
                          m.type === 'Quay video' ? 'bg-rose-600' :
                          m.type === 'Tư vấn' ? 'bg-indigo-600' : 'bg-slate-400'
                        }`} />

                        <div className="space-y-1 overflow-hidden flex-1">
                          <p className="font-extrabold text-slate-800 line-clamp-1">{m.title}</p>
                          <div className="flex justify-between items-center text-3xs text-slate-550 font-medium">
                            <span>Giờ: {m.startDate.split('T')[1]}</span>
                            <span>Trạng thái: <strong>{m.status}</strong></span>
                          </div>
                          {m.location && (
                            <p className="text-3xs text-slate-400 truncate flex items-center gap-0.5">
                              <MapPin size={9} /> {m.location}
                            </p>
                          )}
                          {client && (
                            <p className="text-[10px] font-bold text-slate-700 truncate">
                              👤 {client.name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: APPROACHING PROJECT DEADLINES & WARNINGS PANEL */}
        <div className="space-y-6 text-xs">
          
          {/* Section 1: Today Warnings list */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs space-y-4">
            <h3 className="font-black text-slate-950 flex items-center gap-1.5 uppercase tracking-wider text-xxs border-b border-slate-100 pb-2">
              <Bell size={14} className="text-rose-600 shrink-0" /> Sự kiện ngày hôm nay
            </h3>

            {todayEvents.length === 0 ? (
              <div className="text-center py-6 text-slate-400 italic">
                Hôm nay bạn không có cuộc họp hay buổi thực chiến nào.
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayEvents.map(m => (
                  <div
                    key={m.id}
                    onClick={() => handleOpenEditForm(m)}
                    className="p-3 border-l-3 border-rose-600 bg-rose-50/30 hover:bg-rose-50/50 cursor-pointer rounded-r-xl transition-colors space-y-1 text-left"
                  >
                    <div className="flex items-center justify-between text-3xs font-black">
                      <span className="text-rose-800 font-mono">BẮT ĐẦU: {m.startDate.split('T')[1]}</span>
                      <span className="text-slate-500 font-bold">{m.type}</span>
                    </div>
                    <p className="font-extrabold text-[12px] text-slate-800 line-clamp-2">{m.title}</p>
                    {m.location && (
                      <p className="text-3xs text-slate-405 flex items-center gap-0.5 truncate font-medium">
                        <MapPin size={9} /> {m.location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Approaching Project Deadlines highlights */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs space-y-4">
            <h3 className="font-black text-slate-950 flex items-center gap-1.5 uppercase tracking-wider text-xxs border-b border-slate-100 pb-2">
              <AlertCircle size={14} className="text-amber-500 shrink-0" /> Hạn bàn giao Gần kề (&lt;= 7 ngày)
            </h3>

            {approachingProjectDeadlines.length === 0 ? (
              <div className="text-center py-6 text-slate-400 italic">
                Tuyệt vời! Không có dự án nào vướng deadline trong 1 tuần tới.
              </div>
            ) : (
              <div className="space-y-2.5">
                {approachingProjectDeadlines.map(p => {
                  const client = clientsMap.get(p.clientId);
                  const isCritical = p.daysRemaining <= 2;

                  return (
                    <div
                      key={p.id}
                      className={`p-3 border rounded-xl space-y-2 ${
                        isCritical 
                          ? 'bg-rose-50/10 border-rose-200 shadow-3xs' 
                          : 'bg-slate-50/40 border-slate-150'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded leading-none ${
                          isCritical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.daysRemaining < 0 
                            ? `Quá hạn ${Math.abs(p.daysRemaining)} ngày` 
                            : p.daysRemaining === 0 
                            ? 'BÀN GIAO HÔM NAY' 
                            : `Còn ${p.daysRemaining} ngày`}
                        </span>

                        <span className="text-[9px] text-slate-400 font-black font-mono">
                          Hạn: {p.dueDate ? formatDate(p.dueDate) : '-'}
                        </span>
                      </div>

                      <p className="font-black text-slate-800 text-xxs line-clamp-2">{p.title}</p>

                      <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-100 font-bold text-slate-550">
                        <span>👤 {client ? client.name : 'Khách hàng'}</span>
                        <span className="text-brand-green-mid uppercase text-3xs">{p.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* CREATE & EDIT FORM MODAL CONTAINER */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-120 text-xs">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">
                  {editingAppointment ? 'Chỉnh Sửa Lịch Hẹn' : 'Lập Kế Hoạch Lịch Hẹn Mới'}
                </h3>
                <p className="text-[10px] text-white/70 font-medium">
                  Tích hợp liên kết chặt chẽ với sổ khách hàng và tiến trình hợp đồng.
                </p>
              </div>
              <button
                onClick={() => setFormModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Title Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase">TIÊU ĐỀ LỊCH HẸN *</label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: Họp khâu chuẩn bị bối cảnh model Thủy Design..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-black text-slate-800"
                />
              </div>

              {/* Linked Customer & Project */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">LIÊN KẾT KHÁCH HÀNG</label>
                  <select
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-bold"
                  >
                    <option value="">-- Chọn khách hàng liên quan (Không bắt buộc) --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">LIÊN KẾT JOB / DỰ ÁN</label>
                  <select
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-bold"
                  >
                    <option value="">-- Chọn Job đang tiến hành (Không bắt buộc) --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type, Start & End Time */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">LOẠI LỊCH</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as AppointmentType)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-bold"
                  >
                    <option value="Tư vấn">Tư vấn tuyển chọn</option>
                    <option value="Chụp ảnh">Chụp quay tại Studio</option>
                    <option value="Quay video">Quay chụp Ngoại cảnh</option>
                    <option value="Họp brief">Họp brief ý tưởng</option>
                    <option value="Họp duyệt sản phẩm">Hậu kỳ duyệt Album</option>
                    <option value="Deadline bàn giao">Mốc Deadline</option>
                    <option value="Nhắc thanh toán">Đối soát tài chính</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">GIỜ BẮT ĐẦU *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDateStr}
                    onChange={e => setStartDateStr(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">GIỜ KẾT THÚC *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDateStr}
                    onChange={e => setEndDateStr(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-semibold"
                  />
                </div>
              </div>

              {/* Location & Meeting Online links */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">ĐỊA ĐIỂM THỰC HIỆN</label>
                  <input
                    type="text"
                    placeholder="ví dụ: Studio Quận 1, Zoom meeting, v.v."
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">LINK HỌP TRỰC TUYẾN (ONLINE MEETING)</label>
                  <input
                    type="url"
                    placeholder="https://zoom.us/..."
                    value={onlineMeetingLink}
                    onChange={e => setOnlineMeetingLink(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Status and Notes */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">TRẠNG THÁI</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as AppointmentStatus)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-bold"
                  >
                    <option value="Sắp diễn ra">Sắp diễn ra</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Dời lịch">Dời lịch</option>
                    <option value="Hủy">Đã hủy</option>
                  </select>
                </div>

                <div className="col-span-3 space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">GHI CHÚ CHI TIẾT</label>
                  <input
                    type="text"
                    placeholder="Các yêu cầu chuẩn bị, máy móc cần đem theo..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-105 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer animate-fade-in"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-805 text-white rounded-lg transition-colors cursor-pointer"
                >
                  {editingAppointment ? 'Cập nhật lịch hẹn' : 'Lưu lịch hẹn'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
