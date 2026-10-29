import { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Phone,
  Shield,
  Bot,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  Cookie,
  Mail,
  MapPin,
  Send,
  Sliders,
  SlidersHorizontal,
  GraduationCap,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import {
  AISettings,
  DEFAULT_AI_SETTINGS,
  getStoredAISettings,
  saveStoredAISettings,
} from '@/lib/gemini';
import { useAuth } from '@/lib/auth';

const CONTACTS_STORAGE_KEY = 'smart_academy_contacts_v2';
const COOKIES_STORAGE_KEY = 'smart_academy_cookie_settings';

export interface SiteContacts {
  phone: string;
  telegram: string;
  email: string;
  address: string;
  workingHours: string;
}

export const DEFAULT_CONTACTS: SiteContacts = {
  phone: '+998 (71) 200-11-22',
  telegram: '@smartacademy_uz',
  email: 'info@smartacademy.uz',
  address: "Toshkent shahri, Yunusobod tumani, Ta'lim markazi",
  workingHours: 'Dushanba - Shanba: 08:30 - 18:30',
};

export interface CookieSettings {
  consentAccepted: boolean;
  functional: boolean;
  analytics: boolean;
  security: boolean;
}

export const DEFAULT_COOKIES: CookieSettings = {
  consentAccepted: true,
  functional: true,
  analytics: true,
  security: true,
};

export default function SiteSettings({ onBack }: { onBack: () => void }) {
  const { globalTheme, updateGlobalTheme } = useTheme();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'contacts' | 'cookies' | 'ai'>('general');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // General settings state
  const [siteName, setSiteName] = useState(globalTheme?.site_name || 'Smart Academy');
  const [logoIcon, setLogoIcon] = useState('GraduationCap');
  const [primaryColor, setPrimaryColor] = useState(globalTheme?.primary_color || '#4f46e5');

  // Contacts state
  const [contacts, setContacts] = useState<SiteContacts>(() => {
    try {
      const saved = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return DEFAULT_CONTACTS;
  });

  // Cookie settings state
  const [cookies, setCookies] = useState<CookieSettings>(() => {
    try {
      const saved = localStorage.getItem(COOKIES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return DEFAULT_COOKIES;
  });

  // AI settings state
  const [aiSettings, setAiSettings] = useState<AISettings>(getStoredAISettings);

  const isCreatorOrAdmin = profile?.role === 'creator' || profile?.role === 'admin';

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (globalTheme) {
      await updateGlobalTheme({
        ...globalTheme,
        site_name: siteName,
        primary_color: primaryColor,
      });
    }
    triggerSaveFeedback();
  };

  const handleSaveContacts = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
    triggerSaveFeedback();
  };

  const handleSaveCookies = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(COOKIES_STORAGE_KEY, JSON.stringify(cookies));
    triggerSaveFeedback();
  };

  const handleSaveAI = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredAISettings(aiSettings);
    triggerSaveFeedback();
  };

  const handleResetAI = () => {
    if (confirm("AI sozlamalarini standart holatga qaytarishni tasdiqlaysizmi?")) {
      setAiSettings(DEFAULT_AI_SETTINGS);
      saveStoredAISettings(DEFAULT_AI_SETTINGS);
      triggerSaveFeedback();
    }
  };

  const clearAllCookies = () => {
    if (confirm("Saytning barcha lokal saqlangan sozlamalari va keshini tozalashni xohlaysizmi?")) {
      localStorage.clear();
      alert("Lokal xotira tozalandi. Sahifa yangilanadi.");
      window.location.reload();
    }
  };

  const triggerSaveFeedback = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Bosh sahifaga
      </button>

      {/* Header */}
      <div className="rounded-3xl p-7 mb-8 text-white bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase mb-3 backdrop-blur-md">
          <Settings className="w-4 h-4" /> Boshqaruv & Sayt Sozlamalari
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
          Sayt va AI Yordamchisi Sozlamalari
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Sayt nomi, kontakt ma'lumotlari, cookie maxfiylik siyosati hamda Gemini sun'iy intellekt
          repetitorining modeli va xarakterini moslashtiring.
        </p>
      </div>

      {/* Save Toast notification */}
      {savedSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 glass rounded-2xl mb-6 w-fit flex-wrap border border-slate-800">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'general' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" /> Umumiy & Logo
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'contacts' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Phone className="w-4 h-4" /> Kontaktlar
        </button>

        <button
          onClick={() => setActiveTab('cookies')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'cookies' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cookie className="w-4 h-4" /> Cookie Sozlamalari
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'ai'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4 text-amber-300" /> AI Yordamchini O'zgartirish
        </button>
      </div>

      {/* TAB 1: GENERAL & LOGO */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="glass rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-5">
          <h2 className="text-lg font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" /> Asosiy Sayt Ma'lumotlari & Brending
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sayt Nomi</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-sm outline-none focus:border-indigo-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Ushbu nom sayt sarlavhasi, navigatsiya paneli va SEO teglarida aks etadi.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Asosiy Rang</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-slate-300">{primaryColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sayt Belgisi / Logotip</label>
              <select
                value={logoIcon}
                onChange={(e) => setLogoIcon(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="GraduationCap">🎓 Akademiya Shlyapasi (Standart)</option>
                <option value="Code2">💻 IT & Dasturlash Belgisi</option>
                <option value="Shield">🛡️ Harbiy & IIV Qalqoni</option>
                <option value="BookOpen">📖 Ochiq Kitob</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" /> Saqlash
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: CONTACTS */}
      {activeTab === 'contacts' && (
        <form onSubmit={handleSaveContacts} className="glass rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-5">
          <h2 className="text-lg font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
            <Phone className="w-5 h-5 text-indigo-400" /> Aloqa va Qo'llab-quvvatlash Ma'lumotlari
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-400" /> Telefon Raqam
              </label>
              <input
                type="text"
                value={contacts.phone}
                onChange={(e) => setContacts({ ...contacts, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-cyan-400" /> Telegram Kanal / Bot
              </label>
              <input
                type="text"
                value={contacts.telegram}
                onChange={(e) => setContacts({ ...contacts, telegram: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" /> Elektron Pochta (Email)
              </label>
              <input
                type="email"
                value={contacts.email}
                onChange={(e) => setContacts({ ...contacts, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ish Rejimi / Vaqti</label>
              <input
                type="text"
                value={contacts.workingHours}
                onChange={(e) => setContacts({ ...contacts, workingHours: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> Manzil
            </label>
            <input
              type="text"
              value={contacts.address}
              onChange={(e) => setContacts({ ...contacts, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" /> Kontaktlarni Saqlash
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: COOKIES */}
      {activeTab === 'cookies' && (
        <form onSubmit={handleSaveCookies} className="glass rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cookie className="w-5 h-5 text-amber-400" /> Maxfiylik & Cookie Sozlamalari
            </h2>
            <button
              type="button"
              onClick={clearAllCookies}
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Keshni Tozalash
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Smart Academy platformasi sizning sessiyangizni uzluksiz ta'minlash, soundtrack pleyer holatini
            va o'rganish progressini xotirada saqlash uchun texnik cookie va mahalliy xotiradan (localStorage) foydalanadi.
          </p>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-sm text-white block">Xavfsizlik & Asosiy Cookie-lar</span>
                <span className="text-xs text-slate-400">Tizimga kirish va botdan himoya qilish uchun majburiy</span>
              </div>
              <input type="checkbox" checked={cookies.security} disabled className="accent-indigo-500 w-4 h-4" />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-sm text-white block">Funksional Cookie-lar</span>
                <span className="text-xs text-slate-400">Soundtrack tanlovi, ovoz balandligi va dars konspektlari xotirasi</span>
              </div>
              <input
                type="checkbox"
                checked={cookies.functional}
                onChange={(e) => setCookies({ ...cookies, functional: e.target.checked })}
                className="accent-indigo-500 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-sm text-white block">Tahliliy Cookie-lar (Google Analytics)</span>
                <span className="text-xs text-slate-400">Sayt tezligi va sahifalar yuklanishini tahlil qilish (shaxssizlantirilgan)</span>
              </div>
              <input
                type="checkbox"
                checked={cookies.analytics}
                onChange={(e) => setCookies({ ...cookies, analytics: e.target.checked })}
                className="accent-indigo-500 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" /> Cookie Sozlamalarini Saqlash
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: AI ASSISTANT SETTINGS */}
      {activeTab === 'ai' && (
        <form onSubmit={handleSaveAI} className="glass rounded-3xl p-6 sm:p-7 border border-indigo-500/40 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Bot className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Gemini AI Yordamchisini Sozlash</h2>
                <p className="text-xs text-slate-400">Model, harorat, xotira va tizim yo'riqnomasini boshqaring</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAI}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Standart holatga qaytarish"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Standart
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sun'iy Intellekt Modeli</label>
              <select
                value={aiSettings.model}
                onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-mono outline-none focus:border-indigo-500"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Tavsiya etiladi • Yuqori intellekt)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra tezkor)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Chuqur tahlil & Dasturlash)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash (Tezkor javoblar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">AI Asosiy Yo'nalishi / Roli</label>
              <select
                value={aiSettings.role}
                onChange={(e) =>
                  setAiSettings({ ...aiSettings, role: e.target.value as AISettings['role'] })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="universal">Universal Ta'lim Repetitori (Barcha sohalar)</option>
                <option value="code_mentor">IT & Dasturlash Mentori (Clean Code & Bug tahlili)</option>
                <option value="law_expert">Huquqshunoslik & Konstitutsiya Eksperti</option>
                <option value="dtm_expert">Milliy Sertifikat (189 ball) & DTM Eksperti</option>
              </select>
            </div>
          </div>

          {/* Temperature slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                Harorat / Ijodiylik Darajasi (Temperature): <span className="font-mono text-indigo-300">{aiSettings.temperature}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {aiSettings.temperature <= 0.3
                  ? 'Qat\'iy va aniq faktlar'
                  : aiSettings.temperature <= 0.7
                  ? 'Balanslangan (Standart)'
                  : 'Yuqori ijodiylik va tushuntirishlar'}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={aiSettings.temperature}
              onChange={(e) =>
                setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })
              }
              className="w-full h-2 accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Memory limit slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span>
                Multi-Turn Xotira Hajmi: <span className="font-mono text-cyan-400">{aiSettings.memoryLimit}</span> ta oxirgi xabar
              </span>
              <span className="text-[11px] text-slate-400">Suhbat davomida eslab qolinadigan so'rovlar soni</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={aiSettings.memoryLimit}
              onChange={(e) =>
                setAiSettings({ ...aiSettings, memoryLimit: parseInt(e.target.value, 10) })
              }
              className="w-full h-2 accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* System Instruction */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tizim Yo'riqnomasi (System Instruction)
            </label>
            <textarea
              rows={5}
              value={aiSettings.systemInstruction}
              onChange={(e) =>
                setAiSettings({ ...aiSettings, systemInstruction: e.target.value })
              }
              className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white leading-relaxed font-sans outline-none focus:border-indigo-500 resize-y"
              placeholder="Sun'iy intellekt xulq-atvori va yo'riqnomasini yozing..."
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-purple-900/40"
            >
              <Save className="w-4 h-4" /> AI Sozlamalarini Saqlash
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
