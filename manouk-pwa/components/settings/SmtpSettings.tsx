import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SmtpSettings() {
  const supabase = createClient();
  const [smtp, setSmtp] = useState({
    host: '',
    port: '',
    user: '',
    pass: '',
    from: '',
    to: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Charger la config SMTP depuis Supabase (table settings)
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_to']);
      if (data) {
        const obj = Object.fromEntries(data.map((s: any) => [s.key.replace('smtp_', ''), s.value]));
        setSmtp((prev) => ({ ...prev, ...obj }));
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: any) => {
    setSmtp({ ...smtp, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    for (const [key, value] of Object.entries(smtp)) {
      await supabase.from('settings').upsert({ key: `smtp_${key}`, value });
    }
    setLoading(false);
    setMessage('Configuration enregistrée.');
  };

  const handleTest = async () => {
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/test-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtp),
    });
    const json = await res.json();
    setLoading(false);
    setMessage(json.ok ? 'Mail de test envoyé !' : `Erreur : ${json.error || json.details}`);
  };

  return (
    <div className="space-y-4 max-w-lg">
      <h3 className="text-lg font-semibold">Configuration SMTP</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="host" value={smtp.host} onChange={handleChange} placeholder="Hôte SMTP" className="border px-2 py-1 rounded" />
        <input name="port" value={smtp.port} onChange={handleChange} placeholder="Port" className="border px-2 py-1 rounded" />
        <input name="user" value={smtp.user} onChange={handleChange} placeholder="Email d'envoi" className="border px-2 py-1 rounded" />
        <input name="pass" value={smtp.pass} onChange={handleChange} placeholder="Mot de passe (ou app)" type="password" className="border px-2 py-1 rounded" />
        <input name="from" value={smtp.from} onChange={handleChange} placeholder="Nom affiché (optionnel)" className="border px-2 py-1 rounded" />
        <input name="to" value={smtp.to} onChange={handleChange} placeholder="Destinataire test" className="border px-2 py-1 rounded" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded">Enregistrer</button>
        <button onClick={handleTest} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">Envoyer un mail de test</button>
      </div>
      {message && <div className="text-sm mt-2">{message}</div>}
    </div>
  );
}
