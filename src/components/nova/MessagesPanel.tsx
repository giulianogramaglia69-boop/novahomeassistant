import { useState, useEffect, useRef } from 'react';
import { Profile, ProfileName } from '@/lib/types';
import { NovaMessage } from '@/hooks/useMessages';

const PROFILES: { name: ProfileName; emoji: string }[] = [
  { name: 'Giuliano', emoji: '👤' },
  { name: 'Simone', emoji: '🧑' },
  { name: 'Ilenia', emoji: '👩' },
  { name: 'Admin', emoji: '🛡️' },
];

interface Props {
  profile: Profile;
  messages: NovaMessage[];
  onSend: (to: ProfileName, content: string) => void;
  onMarkRead: (peer: ProfileName) => void;
}

const MessagesPanel = ({ profile, messages, onSend, onMarkRead }: Props) => {
  const peers = PROFILES.filter(p => p.name !== profile.name);
  const [peer, setPeer] = useState<ProfileName>(peers[0].name);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const thread = messages.filter(
    m => (m.from_profile === profile.name && m.to_profile === peer) ||
         (m.from_profile === peer && m.to_profile === profile.name)
  );

  useEffect(() => { onMarkRead(peer); }, [peer, messages.length, onMarkRead]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread.length]);

  const send = () => {
    if (!input.trim()) return;
    onSend(peer, input);
    setInput('');
  };

  const unreadFrom = (p: ProfileName) =>
    messages.filter(m => m.from_profile === p && m.to_profile === profile.name && !m.read).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex gap-2 p-3 border-b border-border overflow-x-auto scrollbar-none shrink-0">
        {peers.map(p => {
          const u = unreadFrom(p.name);
          return (
            <button key={p.name} onClick={() => setPeer(p.name)}
              className={`shrink-0 px-3 py-2 rounded-xl border font-mono text-[0.7rem] transition-all flex items-center gap-2 ${
                peer === p.name ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-card border-border text-foreground'
              }`}>
              <span>{p.emoji}</span>{p.name}
              {u > 0 && <span className="bg-destructive text-destructive-foreground rounded-full px-1.5 text-[0.55rem]">{u}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
        {thread.length === 0 && (
          <div className="text-center text-muted-foreground text-xs mt-12">Nessun messaggio con {peer}.</div>
        )}
        {thread.map(m => {
          const mine = m.from_profile === profile.name;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-[0.8rem] ${
                mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'
              }`}>
                <div>{m.content}</div>
                <div className={`text-[0.55rem] mt-1 opacity-70 ${mine ? 'text-right' : ''}`}>
                  {new Date(m.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-border flex gap-2 shrink-0">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={`Scrivi a ${peer}…`}
          className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-[0.8rem] outline-none focus:border-primary/40" />
        <button onClick={send} className="px-4 rounded-xl bg-primary text-primary-foreground font-syne text-xs font-bold active:scale-95">Invia</button>
      </div>
    </div>
  );
};

export default MessagesPanel;
