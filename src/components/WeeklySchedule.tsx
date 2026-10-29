import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  CheckCircle2,
  Bell,
  Sparkles,
  BookOpen,
  Filter,
  PlayCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export interface ScheduleItem {
  id: string;
  day: 'Dushanba' | 'Seshanba' | 'Chorshanba' | 'Payshanba' | 'Juma' | 'Shanba';
  startTime: string; // "08:30"
  endTime: string;   // "09:50"
  subject: string;
  topic: string;
  teacher: string;
  room: string;
  type: "Ma'ruza" | "Amaliyot" | "Seminar" | "Maxsus Tayyorgarlik";
  color: string;
  videoLessonId?: string;
  notes?: string;
}

const DAYS: Array<ScheduleItem['day']> = [
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
];

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  // Dushanba
  {
    id: 'sch-1',
    day: 'Dushanba',
    startTime: '08:30',
    endTime: '09:50',
    subject: "Konstitutsiya va Inson Huquqlari",
    topic: "Davlat suvereniteti va inson sha'ni kafolatlari",
    teacher: "Dotsent S.M. Karimov",
    room: "204-Ma'ruzalar zali",
    type: "Ma'ruza",
    color: 'from-blue-600 to-indigo-600',
    videoLessonId: 'vid-1',
    notes: "Yangi Konstitutsiyaning 1-moddasini tahlil qilish",
  },
  {
    id: 'sch-2',
    day: 'Dushanba',
    startTime: '10:05',
    endTime: '11:25',
    subject: "Jinoyat Huquqi Umumiy Qismi",
    topic: "Jinoyat tarkibi va zaruriy mudofaa chegaralari",
    teacher: "Mayor X.A. Rahimov",
    room: "302-auditoriya",
    type: "Amaliyot",
    color: 'from-purple-600 to-pink-600',
    videoLessonId: 'vid-2',
    notes: "Kazuist holatlar bo'yicha mustaqil topshiriq",
  },
  {
    id: 'sch-3',
    day: 'Dushanba',
    startTime: '11:45',
    endTime: '13:05',
    subject: "Milliy Sertifikat: Matematika & Mantiq",
    topic: "Mantiqiy tahlil va nostandart test savollari",
    teacher: "Katta o'qituvchi N.B. Aliyev",
    room: "108-Kompyuter sinfi",
    type: "Seminar",
    color: 'from-emerald-600 to-teal-600',
    videoLessonId: 'vid-4',
    notes: "189 ballik baholash shkalasi bo'yicha hisoblash",
  },

  // Seshanba
  {
    id: 'sch-4',
    day: 'Seshanba',
    startTime: '08:30',
    endTime: '09:50',
    subject: "IIV Tezkor Xizmat Asoslari",
    topic: "Jamoat xavfsizligini ta'minlashda patrullik faoliyati",
    teacher: "Podpolkovnik U.K. Yo'ldoshev",
    room: "Maxsus taktik poligon",
    type: "Maxsus Tayyorgarlik",
    color: 'from-amber-600 to-orange-600',
    videoLessonId: 'vid-3',
    notes: "Kasbiy etika va fuqarolar bilan muomala qoidalari",
  },
  {
    id: 'sch-5',
    day: 'Seshanba',
    startTime: '10:05',
    endTime: '11:25',
    subject: "O'zbekiston Tarixi (DTM Blok)",
    topic: "Temuriylar davrida davlatchilik va huquq tizimi",
    teacher: "T.f.n. M.O. Shukurov",
    room: "215-auditoriya",
    type: "Ma'ruza",
    color: 'from-cyan-600 to-blue-600',
  },
  {
    id: 'sch-6',
    day: 'Seshanba',
    startTime: '11:45',
    endTime: '13:05',
    subject: "Ona Tili va Adabiyot (Milliy Sertifikat)",
    topic: "Matn ustida ishlash va grammatik tahlil",
    teacher: "Oliy toifali ustoz D.R. Karimova",
    room: "104-auditoriya",
    type: "Seminar",
    color: 'from-fuchsia-600 to-purple-600',
  },

  // Chorshanba
  {
    id: 'sch-7',
    day: 'Chorshanba',
    startTime: '08:30',
    endTime: '09:50',
    subject: "Ma'muriy Huquq va Jarayon",
    topic: "Ma'muriy javobgarlik va bayonnomalar tuzish tartibi",
    teacher: "Mayor X.A. Rahimov",
    room: "302-auditoriya",
    type: "Amaliyot",
    color: 'from-indigo-600 to-violet-600',
  },
  {
    id: 'sch-8',
    day: 'Chorshanba',
    startTime: '10:05',
    endTime: '11:25',
    subject: "Jismoniy va Jangovar Tayyorgarlik",
    topic: "Qo'l jangi usullari va to'siqlardan o'tish me'yori",
    teacher: "Katta leytenant D.B. Toshmatov",
    room: "Sport majmuasi / Mashg'ulot maydoni",
    type: "Maxsus Tayyorgarlik",
    color: 'from-rose-600 to-red-600',
  },
  {
    id: 'sch-9',
    day: 'Chorshanba',
    startTime: '11:45',
    endTime: '13:05',
    subject: "Ingliz Tili (IELTS / DTM Blok)",
    topic: "Reading & Legal Vocabulary in Law Enforcement",
    teacher: "J.A. Saidov (CELTA sertifikati)",
    room: "Lingafon xonasi 201",
    type: "Seminar",
    color: 'from-teal-600 to-emerald-600',
  },

  // Payshanba
  {
    id: 'sch-10',
    day: 'Payshanba',
    startTime: '08:30',
    endTime: '09:50',
    subject: "Kriminologiya va Huquqbuzarliklar Profilaktikasi",
    topic: "Voyaga yetmaganlar o'rtasida jinoyatchilikning oldini olish",
    teacher: "Dotsent S.M. Karimov",
    room: "204-Ma'ruzalar zali",
    type: "Ma'ruza",
    color: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'sch-11',
    day: 'Payshanba',
    startTime: '10:05',
    endTime: '11:25',
    subject: "Kriminalistika va Sud Ekspertizasi",
    topic: "Hodisa joyini ko'zdan kechirish va dalillarni qayd etish",
    teacher: "Katta ekspert F.T. Ergashev",
    room: "Sud ekspertizasi laboratoriyasi",
    type: "Amaliyot",
    color: 'from-violet-600 to-purple-600',
  },
  {
    id: 'sch-12',
    day: 'Payshanba',
    startTime: '11:45',
    endTime: '13:05',
    subject: "Axborot Texnologiyalari va Kiberxavfsizlik",
    topic: "Raqamli gigiyena va ma'lumotlar xavfsizligi",
    teacher: "D.E. Qodirov",
    room: "108-Kompyuter sinfi",
    type: "Amaliyot",
    color: 'from-cyan-600 to-teal-600',
  },

  // Juma
  {
    id: 'sch-13',
    day: 'Juma',
    startTime: '08:30',
    endTime: '09:50',
    subject: "Harbiy Nizomlar va Saf Tayyorgarligi",
    topic: "Ichki xizmat va intizom nizomlari talablari",
    teacher: "Podpolkovnik U.K. Yo'ldoshev",
    room: "Saf maydoni",
    type: "Maxsus Tayyorgarlik",
    color: 'from-amber-600 to-orange-600',
  },
  {
    id: 'sch-14',
    day: 'Juma',
    startTime: '10:05',
    endTime: '11:25',
    subject: "Davlat va Huquq Nazariyasi",
    topic: "Huquqiy ong va huquqiy madaniyatni yuksaltirish",
    teacher: "Dotsent S.M. Karimov",
    room: "204-Ma'ruzalar zali",
    type: "Ma'ruza",
    color: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'sch-15',
    day: 'Juma',
    startTime: '11:45',
    endTime: '13:05',
    subject: "Milliy Sertifikat / DTM Nazorat Sinovi",
    topic: "Haftalik yakuniy diagnostik test va OMR blankasi",
    teacher: "Katta o'qituvchi N.B. Aliyev",
    room: "Katta imtihon zali",
    type: "Seminar",
    color: 'from-emerald-600 to-teal-600',
  },

  // Shanba
  {
    id: 'sch-16',
    day: 'Shanba',
    startTime: '09:00',
    endTime: '10:30',
    subject: "Mustaqil Mutolaa & Audio Kitoblar Tahlili",
    topic: "Huquqiy adabiyotlar va badiiy asarlar muhokamasi",
    teacher: "Kutubxona koordinatori",
    room: "Elektron kutubxona",
    type: "Seminar",
    color: 'from-purple-600 to-pink-600',
  },
  {
    id: 'sch-17',
    day: 'Shanba',
    startTime: '10:45',
    endTime: '12:15',
    subject: "Psixologik Tayyorgarlik va Notiqlik San'ati",
    topic: "Stressga chidamlilik va favqulodda vaziyatlarda qaror qabul qilish",
    teacher: "Psixolog M.M. Vohidova",
    room: "305-Mashg'ulot zali",
    type: "Amaliyot",
    color: 'from-rose-600 to-amber-600',
  },
];

const STORAGE_KEY = 'educational_platform_schedule_v2';

export default function WeeklySchedule({
  onSelectVideoLesson,
}: {
  onSelectVideoLesson?: (videoLessonId: string) => void;
}) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return DEFAULT_SCHEDULE;
  });

  // Calculate current weekday in Uzbek
  const getTodayName = (): ScheduleItem['day'] => {
    const dayIdx = new Date().getDay(); // 0 is Sunday, 1 is Monday ...
    switch (dayIdx) {
      case 1:
        return 'Dushanba';
      case 2:
        return 'Seshanba';
      case 3:
        return 'Chorshanba';
      case 4:
        return 'Payshanba';
      case 5:
        return 'Juma';
      case 6:
        return 'Shanba';
      default:
        return 'Dushanba'; // Fallback on Sunday to Monday
    }
  };

  const [selectedDay, setSelectedDay] = useState<ScheduleItem['day']>(getTodayName());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [typeFilter, setTypeFilter] = useState<string>('Barchasi');
  const [showAddModal, setShowAddModal] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // New class form
  const [newClass, setNewClass] = useState<Omit<ScheduleItem, 'id'>>({
    day: selectedDay,
    startTime: '08:30',
    endTime: '09:50',
    subject: '',
    topic: '',
    teacher: '',
    room: '',
    type: "Ma'ruza",
    color: 'from-blue-600 to-indigo-600',
    notes: '',
  });

  const saveToStorage = (items: ScheduleItem[]) => {
    setSchedule(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleResetToDefault = () => {
    if (confirm("Dars jadvalini dastlabki holatiga qaytarishni xohlaysizmi?")) {
      saveToStorage(DEFAULT_SCHEDULE);
      showToast("Dars jadvali standart holatga qaytarildi");
    }
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.subject.trim()) {
      alert("Iltimos, dars nomini kiriting");
      return;
    }

    const item: ScheduleItem = {
      ...newClass,
      id: `sch-${Date.now()}`,
    };

    const updated = [...schedule, item];
    saveToStorage(updated);
    setShowAddModal(false);
    showToast(`"${item.subject}" darsi jadvalga qo'shildi`);
    setNewClass({
      day: selectedDay,
      startTime: '08:30',
      endTime: '09:50',
      subject: '',
      topic: '',
      teacher: '',
      room: '',
      type: "Ma'ruza",
      color: 'from-blue-600 to-indigo-600',
      notes: '',
    });
  };

  const handleDeleteClass = (id: string, subject: string) => {
    if (confirm(`"${subject}" darsini jadvaldan o'chirishni tasdiqlaysizmi?`)) {
      const updated = schedule.filter((s) => s.id !== id);
      saveToStorage(updated);
      showToast("Dars jadvaldan o'chirildi");
    }
  };

  // Google Calendar URL Generator
  const generateGoogleCalendarUrl = (item: ScheduleItem) => {
    // Determine the next date of this day
    const dayMap: Record<ScheduleItem['day'], number> = {
      Dushanba: 1,
      Seshanba: 2,
      Chorshanba: 3,
      Payshanba: 4,
      Juma: 5,
      Shanba: 6,
    };

    const targetDayIndex = dayMap[item.day];
    const now = new Date();
    const currentDayIndex = now.getDay(); // 0-6
    let daysUntil = targetDayIndex - currentDayIndex;
    if (daysUntil < 0) daysUntil += 7;
    if (daysUntil === 0) {
      // Check if time has already passed today
      const [h, m] = item.startTime.split(':').map(Number);
      if (now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)) {
        daysUntil = 7;
      }
    }

    const eventDate = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);
    const yyyy = eventDate.getFullYear();
    const mm = String(eventDate.getMonth() + 1).padStart(2, '0');
    const dd = String(eventDate.getDate()).padStart(2, '0');

    const [startH, startM] = item.startTime.split(':');
    const [endH, endM] = item.endTime.split(':');

    // Dates format: YYYYMMDDTHHMMSSZ or local
    const startStr = `${yyyy}${mm}${dd}T${startH}${startM}00`;
    const endStr = `${yyyy}${mm}${dd}T${endH}${endM}00`;

    const title = encodeURIComponent(`${item.subject} (${item.type})`);
    const details = encodeURIComponent(
      `Mavzu: ${item.topic}\nO'qituvchi: ${item.teacher}\nXona: ${item.room}\nQayd: ${item.notes || "Yo'q"}\nPlatforma: Darsxona Ta'lim Tizimi`
    );
    const location = encodeURIComponent(`${item.room}, Litsey/Akademiya binosi`);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  };

  // iCalendar (.ics) export generator
  const exportIcsFile = (itemsToExport: ScheduleItem[], filename: string) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(
      now.getUTCHours()
    )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    const dayMap: Record<ScheduleItem['day'], number> = {
      Dushanba: 1,
      Seshanba: 2,
      Chorshanba: 3,
      Payshanba: 4,
      Juma: 5,
      Shanba: 6,
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Talim Platformasi//Darsxona Jadvali//UZ',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Haftalik Dars Jadvali',
      'X-WR-TIMEZONE:Asia/Tashkent',
    ];

    itemsToExport.forEach((item) => {
      const targetDay = dayMap[item.day];
      const curDay = now.getDay();
      let diff = targetDay - curDay;
      if (diff < 0) diff += 7;
      const targetDate = new Date(now.getTime() + diff * 86400000);

      const yyyy = targetDate.getFullYear();
      const mm = pad(targetDate.getMonth() + 1);
      const dd = pad(targetDate.getDate());

      const [sh, sm] = item.startTime.split(':');
      const [eh, em] = item.endTime.split(':');

      const dtstart = `${yyyy}${mm}${dd}T${sh}${sm}00`;
      const dtend = `${yyyy}${mm}${dd}T${eh}${em}00`;

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:darsxona-${item.id}-${yyyy}${mm}${dd}@talim.uz`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;TZID=Asia/Tashkent:${dtstart}`,
        `DTEND;TZID=Asia/Tashkent:${dtend}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${['SU','MO','TU','WE','TH','FR','SA'][targetDay]}`,
        `SUMMARY:${item.subject} (${item.type})`,
        `DESCRIPTION:Mavzu: ${item.topic} | O'qituvchi: ${item.teacher} | Eslatma: ${item.notes || ''}`,
        `LOCATION:${item.room}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${item.subject} darsi 15 daqiqadan so'ng boshlanadi`,
        'END:VALARM',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("iCal (.ics) taqvim fayli yuklab olindi! Telefon yoki kompyuter taqvimingizga import qilishingiz mumkin.");
  };

  // Determine if a class is happening right now
  const isClassOngoing = (item: ScheduleItem) => {
    const today = getTodayName();
    if (item.day !== today) return false;

    const now = new Date();
    const curMinutes = now.getHours() * 60 + now.getMinutes();

    const [sh, sm] = item.startTime.split(':').map(Number);
    const [eh, em] = item.endTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    return curMinutes >= startMin && curMinutes <= endMin;
  };

  // Filtered lists
  const currentDayClasses = schedule
    .filter((s) => s.day === selectedDay)
    .filter((s) => typeFilter === 'Barchasi' || s.type === typeFilter)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const todayName = getTodayName();

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold border border-emerald-400 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="glass rounded-3xl p-6 sm:p-7 border border-indigo-500/30 shadow-xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wide border border-indigo-500/30 mb-2">
              <CalendarIcon className="w-3.5 h-3.5" /> Haftalik Dars Jadvali & Kalendar
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              O'quv Mashg'ulotlari & Dars Rejasi
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Haftalik dars jadvalingizni kuzating, Google Kalendar yoki telefon taqvimi (iCal) bilan sinxronizatsiya qiling va kerakli video darslarga bir zumda o'ting.
            </p>
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportIcsFile(schedule, 'haftalik_dars_jadvali')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition shadow hover:text-white"
              title="Apple Calendar, Outlook va boshqa taqvimlarga eksport qilish"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>iCal (.ics) Yuklab Olish</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Dars Qo'shish</span>
            </button>

            <button
              onClick={handleResetToDefault}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              title="Standart jadvalga qaytarish"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View mode and Day Selector */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Day of Week Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {DAYS.map((day) => {
              const isToday = day === todayName;
              const isSelected = selectedDay === day;
              const count = schedule.filter((s) => s.day === day).length;
              return (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                    setViewMode('day');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-900/40 ring-1 ring-indigo-400'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500 text-slate-950 font-black">
                      Bugun
                    </span>
                  )}
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle: Single Day vs Full Week Grid */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setViewMode(viewMode === 'day' ? 'week' : 'day')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 transition flex items-center gap-2"
            >
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span>{viewMode === 'day' ? "Haftalik To'liq Ko'rinish" : "Kunlik Reja"}</span>
            </button>

            {/* Filter by lesson type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="Barchasi">Barcha turlar</option>
              <option value="Ma'ruza">Ma'ruzalar</option>
              <option value="Amaliyot">Amaliyotlar</option>
              <option value="Seminar">Seminarlar</option>
              <option value="Maxsus Tayyorgarlik">Maxsus Tayyorgarlik</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: DAY TIMELINE VIEW */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{selectedDay} Darslari</h3>
              {selectedDay === todayName && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Bugungi kun jadvali
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              Jami: <span className="font-bold text-white">{currentDayClasses.length}</span> ta mashg'ulot
            </div>
          </div>

          {currentDayClasses.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center border border-slate-800">
              <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">
                {selectedDay} kuni uchun mashg'ulot topilmadi
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                Ushbu kunga yangi dars yoki shaxsiy repetitorlik mashg'ulotini qo'shishingiz mumkin.
              </p>
              <button
                onClick={() => {
                  setNewClass((prev) => ({ ...prev, day: selectedDay }));
                  setShowAddModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Dars Qo'shish
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {currentDayClasses.map((item, idx) => {
                const ongoing = isClassOngoing(item);
                const gCalUrl = generateGoogleCalendarUrl(item);

                return (
                  <div
                    key={item.id}
                    className={`glass rounded-2xl p-5 border transition-all relative overflow-hidden ${
                      ongoing
                        ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Ongoing lesson indicator pulse */}
                    {ongoing && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider flex items-center gap-1.5 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                        Ayni paytda davom etmoqda
                      </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      {/* Left: Time and index */}
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 text-indigo-400 font-mono font-black text-sm flex items-center justify-center shrink-0">
                          0{idx + 1}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            <span className="font-mono font-black text-white text-base">
                              {item.startTime} — {item.endTime}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                item.type === "Ma'ruza"
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : item.type === 'Amaliyot'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : item.type === 'Maxsus Tayyorgarlik'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {item.type}
                            </span>
                          </div>

                          <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            {item.subject}
                          </h4>

                          {item.topic && (
                            <p className="text-xs sm:text-sm text-slate-300 font-medium">
                              <span className="text-indigo-300 font-semibold">Mavzu:</span> {item.topic}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Middle: Details (Teacher, Room, Notes) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t lg:border-t-0 lg:border-l border-slate-800 pt-3 lg:pt-0 lg:pl-6 min-w-[280px]">
                        <div className="flex items-center gap-2 text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            <span className="text-slate-400">Ustoz:</span>{' '}
                            <span className="font-semibold text-white">{item.teacher || 'Belgilanmagan'}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            <span className="text-slate-400">Xona:</span>{' '}
                            <span className="font-semibold text-white">{item.room || 'Auditoriya'}</span>
                          </span>
                        </div>

                        {item.notes && (
                          <div className="sm:col-span-2 text-[11px] text-amber-300/90 bg-amber-950/30 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                            <span className="font-bold">Eslatma:</span> {item.notes}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                        {/* Link to video lesson if available or requested */}
                        {item.videoLessonId && onSelectVideoLesson && (
                          <button
                            onClick={() => onSelectVideoLesson(item.videoLessonId!)}
                            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
                            title="Tegishli video darsni tomosha qilish"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Darsga O'tish</span>
                          </button>
                        )}

                        {/* Add to Google Calendar button */}
                        <a
                          href={gCalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
                          title="Google Kalendarga qo'shish"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="hidden sm:inline">Google Calendar</span>
                        </a>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteClass(item.id, item.subject)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* VIEW MODE 2: FULL WEEK GRID */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-white">Butun Hafta Jadvali</h3>
            <span className="text-xs text-slate-400">
              Jami <span className="font-bold text-white">{schedule.length}</span> ta dars rejalashtirilgan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS.map((day) => {
              const dayItems = schedule
                .filter((s) => s.day === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              const isToday = day === todayName;

              return (
                <div
                  key={day}
                  className={`glass rounded-2xl p-4 border transition ${
                    isToday
                      ? 'border-indigo-500 bg-indigo-950/20 shadow-md ring-1 ring-indigo-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{day}</span>
                      {isToday && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black">
                          Bugun
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {dayItems.length} dars
                    </span>
                  </div>

                  {dayItems.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">Dars belgilanmagan</p>
                  ) : (
                    <div className="space-y-2.5">
                      {dayItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition text-xs"
                        >
                          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                            <span className="font-mono font-bold text-indigo-300">
                              {item.startTime} - {item.endTime}
                            </span>
                            <span className="text-[10px] text-slate-500">{item.type}</span>
                          </div>
                          <div className="font-semibold text-white truncate">{item.subject}</div>
                          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                            <span className="truncate">{item.teacher}</span>
                            <span className="font-mono text-slate-400 shrink-0">{item.room}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-indigo-500/40 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Yangi Dars Qo'shish</h3>
                  <p className="text-xs text-slate-400">Jadvalga yangi mashg'ulot kiriting</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddClass} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hafta kuni</label>
                  <select
                    value={newClass.day}
                    onChange={(e) =>
                      setNewClass({ ...newClass, day: e.target.value as ScheduleItem['day'] })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-indigo-500"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mashg'ulot turi</label>
                  <select
                    value={newClass.type}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        type: e.target.value as ScheduleItem['type'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Ma'ruza">Ma'ruza</option>
                    <option value="Amaliyot">Amaliyot</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Maxsus Tayyorgarlik">Maxsus Tayyorgarlik</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Boshlanish vaqti</label>
                  <input
                    type="time"
                    value={newClass.startTime}
                    onChange={(e) => setNewClass({ ...newClass, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tugash vaqti</label>
                  <input
                    type="time"
                    value={newClass.endTime}
                    onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dars / Fan nomi *</label>
                <input
                  type="text"
                  placeholder="Masalan: Konstitutsiya va Inson Huquqlari"
                  value={newClass.subject}
                  onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mavzu tavsifi</label>
                <input
                  type="text"
                  placeholder="Masalan: Davlat tuzilishi va qonun ustuvorligi"
                  value={newClass.topic}
                  onChange={(e) => setNewClass({ ...newClass, topic: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">O'qituvchi / Ustoz</label>
                  <input
                    type="text"
                    placeholder="Masalan: Dotsent S.M. Karimov"
                    value={newClass.teacher}
                    onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Auditoriya / Xona</label>
                  <input
                    type="text"
                    placeholder="Masalan: 302-xona"
                    value={newClass.room}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Qayd / Vazifa</label>
                <textarea
                  rows={2}
                  placeholder="Dars uchun muhim eslatma yoki uyga vazifa..."
                  value={newClass.notes}
                  onChange={(e) => setNewClass({ ...newClass, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30"
                >
                  Jadvalga Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
