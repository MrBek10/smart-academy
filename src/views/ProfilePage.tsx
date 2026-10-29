import { useState, useEffect } from 'react';
import { User as UserIcon, Camera, Save, Check, Palette, Mail, Shield, KeyRound, Upload, FileText, Trash2, History, Clock } from 'lucide-react';
import { supabase, Profile, UserTheme, TestFile, ActivityLog, CREATOR_EMAIL } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

export default function ProfilePage({ onBack }: { onBack: () => void }) {
  const { user, profile, role, refreshProfile } = useAuth();
  const { userTheme, refresh } = useTheme();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'profile' | 'theme' | 'activity'>('profile');

  if (!user || !profile) return <div className="max-w-3xl mx-auto px-4 py-20 text-stone-400">Profil topilmadi.</div>;

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { alert('Rasm yuklashda xato: ' + error.message); return; }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(pub.publicUrl);
  };

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ display_name: displayName, avatar_url: avatarUrl }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isCreator = profile.role === 'creator';
  const isAdmin = profile.role === 'admin';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-100 mb-5">← Orqaga</button>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-slate-700" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-slate-500" />
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full glass-strong flex items-center justify-center cursor-pointer hover:border-indigo-500/40 transition-shadow">
            <Camera className="w-4 h-4 text-slate-300" />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </label>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{profile.display_name || profile.email}</h1>
          <p className="text-sm text-slate-400">{profile.email}</p>
          <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border" style={{ background: profile.role === 'creator' ? 'rgba(168,85,247,0.15)' : profile.role === 'admin' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)', color: profile.role === 'creator' ? '#c084fc' : profile.role === 'admin' ? '#fbbf24' : '#94a3b8', borderColor: profile.role === 'creator' ? 'rgba(168,85,247,0.3)' : profile.role === 'admin' ? 'rgba(245,158,11,0.3)' : 'rgba(100,116,139,0.3)' }}>
            {profile.role === 'creator' ? 'Yaratuvchi' : profile.role === 'admin' ? 'Admin' : "O'quvchi"}
          </span>
        </div>
      </div>

      <div className="flex gap-1 p-1 glass rounded-xl mb-6 w-fit">
        <button onClick={() => setTab('profile')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'profile' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'}`}>
          <UserIcon className="w-4 h-4 inline mr-1.5" /> Profil
        </button>
        <button onClick={() => setTab('theme')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'theme' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'}`}>
          <Palette className="w-4 h-4 inline mr-1.5" /> Dizayn
        </button>
        <button onClick={() => setTab('activity')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'activity' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'}`}>
          <History className="w-4 h-4 inline mr-1.5" /> Faoliyat tarixi
        </button>
      </div>

      {tab === 'profile' && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Ism familiya</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-blue-500 focus:outline-none text-sm text-slate-100" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Email</label>
            <input type="email" value={profile.email} disabled className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 text-slate-500 text-sm border border-slate-800" />
          </div>
          <button onClick={saveProfile} disabled={saving} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50 bg-blue-600 hover:bg-blue-500">
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} {saved ? 'Saqlandi!' : 'Saqlash'}
          </button>
          {isCreator && <CreatorTools />}
          {!isCreator && !isAdmin && <StudentAdminClaim />}
        </div>
      )}

      {tab === 'theme' && <UserThemeEditor theme={userTheme} onSaved={refresh} />}
      {tab === 'activity' && <ActivityHistory />}
    </div>
  );
}

function CreatorTools() {
  const { user } = useAuth();
  const [targetEmail, setTargetEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const genCode = async () => {
    if (!targetEmail.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('generate_admin_code', { p_target_email: targetEmail });
    setLoading(false);
    if (error) { alert('Xato: ' + error.message); return; }
    setGeneratedCode(data as string);
  };

  const changeEmail = async () => {
    if (!newEmail.trim()) return;
    setLoading(true);
    const { error } = await supabase.rpc('set_creator_email', { p_new_email: newEmail });
    setLoading(false);
    if (error) { alert('Xato: ' + error.message); return; }
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2000);
  };

  return (
    <div className="border-t border-slate-700/50 pt-5 mt-5 space-y-5">
      <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/30">
        <h3 className="font-semibold mb-1.5 flex items-center gap-2 text-amber-300"><Shield className="w-4 h-4" /> Yaratuvchi vositalari</h3>
        <p className="text-xs text-amber-200/80 mb-3">Admin tayinlash uchun kod yarating. Kodni adminga yetkazing — tasdiqlagach, unga admin huquqi beriladi.</p>
        <div className="flex gap-2">
          <input type="email" placeholder="Yangi admin emaili" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 focus:border-amber-500 outline-none text-sm text-slate-100" />
          <button onClick={genCode} disabled={loading} className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold">Kod yarat</button>
        </div>
        {generatedCode && (
          <div className="mt-3 p-3 bg-slate-800/60 rounded-lg border border-amber-500/30">
            <div className="text-xs text-amber-300 mb-1">Tasdiqlash kodi (adminga yetkazing):</div>
            <div className="font-mono text-2xl font-bold tracking-widest text-amber-200">{generatedCode}</div>
          </div>
        )}
      </div>

      <div className="rounded-xl p-4 glass">
        <h3 className="font-semibold mb-1.5 flex items-center gap-2 text-slate-200"><Mail className="w-4 h-4" /> Yaratuvchi emailini o'zgartirish</h3>
        <p className="text-xs text-slate-400 mb-3">Joriy: {CREATOR_EMAIL}</p>
        <div className="flex gap-2">
          <input type="email" placeholder="Yangi email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm text-slate-100" />
          <button onClick={changeEmail} disabled={loading} className="px-3 py-2 rounded-lg text-white text-sm font-semibold bg-blue-600 hover:bg-blue-500">
            {emailSaved ? 'Saqlandi!' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentAdminClaim() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const claim = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setMsg(null);
    const { data, error } = await supabase.rpc('confirm_admin_code', { p_code: code });
    setLoading(false);
    if (error) { setMsg('Kod yaroqsiz yoki allaqachon ishlatilgan.'); return; }
    if (data) { setMsg('Tabriklaymiz! Sizga admin huquqi berildi.'); window.location.reload(); }
  };

  return (
    <div className="border-t border-slate-700/50 pt-5 mt-5">
      <div className="rounded-xl p-4 bg-blue-500/10 border border-blue-500/30">
        <h3 className="font-semibold mb-1.5 flex items-center gap-2 text-blue-300"><KeyRound className="w-4 h-4" /> Admin huquqini tasdiqlash</h3>
        <p className="text-xs text-blue-200/80 mb-3">Yaratuvchi yuborgan 6 xonali kodni kiriting.</p>
        <div className="flex gap-2">
          <input type="text" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} className="flex-1 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm font-mono tracking-widest text-slate-100" />
          <button onClick={claim} disabled={loading} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold">Tasdiqlash</button>
        </div>
        {msg && <div className="mt-2 text-sm text-slate-300">{msg}</div>}
      </div>
    </div>
  );
}

function UserThemeEditor({ theme, onSaved }: { theme: UserTheme | null; onSaved: () => Promise<void> }) {
  const { user } = useAuth();
  const [form, setForm] = useState<UserTheme | null>(theme);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(theme ?? { user_id: user?.id ?? '', primary_color: '#0f766e', accent_color: '#f59e0b', board_bg: '#1a1a1a', board_text: '#f5f5f5', updated_at: '' }); }, [theme]);

  if (!form || !user) return <div className="text-slate-500">Yuklanmoqda…</div>;

  const save = async () => {
    await supabase.from('user_themes').upsert({
      user_id: user.id,
      primary_color: form.primary_color,
      accent_color: form.accent_color,
      board_bg: form.board_bg,
      board_text: form.board_text,
      updated_at: new Date().toISOString(),
    });
    await onSaved();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = async () => {
    await supabase.from('user_themes').delete().eq('user_id', user.id);
    await onSaved();
  };

  const presets = [
    { name: 'Standart', primary_color: '#0f766e', accent_color: '#f59e0b', board_bg: '#1a1a1a', board_text: '#f5f5f5' },
    { name: 'Okean', primary_color: '#0369a1', accent_color: '#0ea5e9', board_bg: '#0c1929', board_text: '#e0f2fe' },
    { name: 'Emerald', primary_color: '#059669', accent_color: '#10b981', board_bg: '#022c22', board_text: '#d1fae5' },
    { name: "To'q sariq", primary_color: '#c2410c', accent_color: '#f97316', board_bg: '#1c1917', board_text: '#fef3c7' },
    { name: 'Bordo', primary_color: '#9f1239', accent_color: '#e11d48', board_bg: '#1a0a10', board_text: '#ffe4e6' },
    { name: 'Tungi binafsha', primary_color: '#6d28d9', accent_color: '#8b5cf6', board_bg: '#0f0a1f', board_text: '#ede9fe' },
  ];

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      <div>
        <h3 className="font-semibold mb-1 text-white">Shaxsiy dizayn</h3>
        <p className="text-sm text-slate-400 mb-4">Ranglar faqat sizning akkauntingizda o'zgaradi.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <ColorField label="Asosiy rang" value={form.primary_color} onChange={(v) => setForm({ ...form, primary_color: v })} />
          <ColorField label="Aksent rang" value={form.accent_color} onChange={(v) => setForm({ ...form, accent_color: v })} />
          <ColorField label="Doska fon rangi" value={form.board_bg} onChange={(v) => setForm({ ...form, board_bg: v })} />
          <ColorField label="Doska matn rangi" value={form.board_text} onChange={(v) => setForm({ ...form, board_text: v })} />
        </div>
      </div>

      <div>
        <h4 className="font-medium text-sm mb-3">Tayyor dizaynlar</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {presets.map((p) => (
            <button key={p.name} onClick={() => setForm({ ...form, ...p })} className="p-2.5 rounded-xl glass hover:border-slate-600 text-left">
              <div className="flex gap-1 mb-1.5 h-7 rounded-lg overflow-hidden">
                <div className="flex-1" style={{ background: p.primary_color }} />
                <div className="flex-1" style={{ background: p.accent_color }} />
                <div className="flex-1" style={{ background: p.board_bg }} />
              </div>
              <div className="text-xs font-medium text-slate-200">{p.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={save} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500">
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} {saved ? 'Saqlandi!' : 'Saqlash'}
        </button>
        {theme && <button onClick={reset} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/60">Standartga qaytarish</button>}
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm font-mono text-slate-100" />
      </div>
    </div>
  );
}

function ActivityHistory() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from('activity_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      setLogs((data as ActivityLog[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const totalSeconds = logs.reduce((acc, l) => acc + (l.duration_seconds ?? 0), 0);
  const totalMin = Math.round(totalSeconds / 60);

  const actionLabels: Record<string, string> = {
    login: 'Tizimga kirish',
    dars: 'Dars o\'qish',
    imtihon: 'Imtihon topshirish',
    ai_savol: 'AI ga savol berish',
    profile: 'Profilni yangilash',
  };

  if (loading) return <div className="text-slate-500">Yuklanmoqda…</div>;

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <div className="text-2xl font-bold text-blue-400">{logs.length}</div>
          <div className="text-xs text-slate-400">Umumiy harakatlar</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-400">{totalMin}</div>
          <div className="text-xs text-slate-400">Sarflangan vaqt (daqiqa)</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-400">{logs.filter((l) => l.action === 'imtihon').length}</div>
          <div className="text-xs text-slate-400">Topshirilgan imtihonlar</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-white"><History className="w-4 h-4" /> Faoliyat tarixi</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">Hozircha faoliyat yoqishi yoq.</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/20 text-blue-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200">{actionLabels[l.action] ?? l.action}</div>
                  {l.description && <div className="text-xs text-slate-500 mt-0.5">{l.description}</div>}
                  {l.duration_seconds && l.duration_seconds > 0 && (
                    <div className="text-xs text-slate-500 mt-0.5">{Math.floor(l.duration_seconds / 60)} daq {l.duration_seconds % 60} son</div>
                  )}
                </div>
                <div className="text-xs text-slate-500 shrink-0">{new Date(l.created_at).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
