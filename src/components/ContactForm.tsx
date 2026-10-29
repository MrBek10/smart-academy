import { useState } from 'react';
import { Send, Mail, MessageSquare, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function ContactForm({ compact = false }: { compact?: boolean }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast('Iltimos, ism, email va xabar maydonlarini to\'ldiring.', 'error');
      return;
    }
    setSending(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name,
      email: form.email,
      subject: form.subject || null,
      message: form.message,
    });
    setSending(false);
    if (error) {
      toast('Xabar yuborishda xatolik: ' + error.message, 'error');
      return;
    }
    toast('Xabaringiz muvaffaqiyatli yuborildi! Tez orada javob beramiz.', 'success');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <form onSubmit={submit} className={compact ? 'space-y-3' : 'glass rounded-2xl p-6 space-y-4'}>
      {!compact && (
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-400" /> Bog'lanish</h3>
          <p className="text-sm text-slate-400 mt-1">Savolingiz bormi? Xabar qoldiring, biz tez orada javob beramiz.</p>
        </div>
      )}
      <div className={compact ? 'grid grid-cols-1 gap-3' : 'grid sm:grid-cols-2 gap-4'}>
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1.5 block">Ism familiya</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ismingiz"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm text-slate-100" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1.5 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm text-slate-100" />
          </div>
        </div>
      </div>
      {!compact && (
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1.5 block">Mavzu (ixtiyoriy)</label>
          <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Xabar mavzusi"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm text-slate-100" />
        </div>
      )}
      <div>
        <label className="text-sm font-medium text-slate-300 mb-1.5 block">Xabar</label>
        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={compact ? 3 : 4}
          placeholder="Xabaringizni shu yerga yozing..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm text-slate-100 resize-y" />
      </div>
      <button type="submit" disabled={sending}
        className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition">
        {sending ? 'Yuborilmoqda...' : <><Send className="w-4 h-4" /> Xabar yuborish</>}
      </button>
    </form>
  );
}
