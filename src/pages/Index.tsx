import { useState, useCallback, useEffect, useRef } from 'react';
import { TabId, Profile } from '@/lib/types';
import { useChat, ChatToolAction } from '@/hooks/useChat';
import { useDevices } from '@/hooks/useDevices';
import { useReminders } from '@/hooks/useReminders';
import { useNotes } from '@/hooks/useNotes';
import { useWeather } from '@/hooks/useWeather';
import { useSmartThings } from '@/hooks/useSmartThings';
import { useVoiceWake } from '@/hooks/useVoiceWake';
import { useRadio } from '@/hooks/useRadio';
import { useTimers } from '@/hooks/useTimers';
import { useCalendar } from '@/hooks/useCalendar';
import { useAmbientSounds } from '@/hooks/useAmbientSounds';
import { useNews } from '@/hooks/useNews';
import { useTTS } from '@/hooks/useTTS';
import { useNotifications } from '@/hooks/useNotifications';
import { useAIMemory } from '@/hooks/useAIMemory';
import { useMessages } from '@/hooks/useMessages';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useTheme } from '@/hooks/useTheme';
import { useProactivity } from '@/hooks/useProactivity';
import { useMacros } from '@/hooks/useMacros';
import { useEnergyUsage } from '@/hooks/useEnergyUsage';
import { useVision } from '@/hooks/useVision';
import NovaHeader from '@/components/nova/NovaHeader';
import TabNav from '@/components/nova/TabNav';
import DashboardPanel from '@/components/nova/DashboardPanel';
import ChatPanel from '@/components/nova/ChatPanel';
import HomePanel from '@/components/nova/HomePanel';
import RadioPanel from '@/components/nova/RadioPanel';
import MeteoPanel from '@/components/nova/MeteoPanel';
import NotesPanel from '@/components/nova/NotesPanel';
import RemindersPanel from '@/components/nova/RemindersPanel';
import TimerPanel from '@/components/nova/TimerPanel';
import CalendarPanel from '@/components/nova/CalendarPanel';
import AmbientePanel from '@/components/nova/AmbientePanel';
import NewsPanel from '@/components/nova/NewsPanel';
import WebPanel from '@/components/nova/WebPanel';
import MessagesPanel from '@/components/nova/MessagesPanel';
import ShoppingPanel from '@/components/nova/ShoppingPanel';
import TrafficPanel from '@/components/nova/TrafficPanel';
import FloatingHost from '@/components/nova/FloatingHost';
import SettingsPanel from '@/components/nova/SettingsPanel';
import PinLock from '@/components/nova/PinLock';
import Screensaver from '@/components/nova/Screensaver';

const IDLE_MS = 5 * 60 * 1000;

const Index = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<TabId>('dashboard');
  const chat = useChat();
  const devices = useDevices();
  const pName = profile?.name;
  const reminders = useReminders(pName);
  const notes = useNotes(pName);
  const weather = useWeather();
  const smart = useSmartThings();
  const radio = useRadio();
  const timers = useTimers();
  const calendar = useCalendar(pName);
  const ambient = useAmbientSounds();
  const news = useNews();
  const tts = useTTS();
  const notif = useNotifications(pName);
  const memory = useAIMemory(pName);
  const msgs = useMessages(pName);
  const shopping = useShoppingList(pName);
  useTheme();
  const macrosHook = useMacros(pName);
  const devicesOn = devices.devicesOn;
  const totalWattage = devices.totalWattage;
  const energy = useEnergyUsage(
    devices.devices.map(d => ({ id: d.id, label: d.name, room: d.room, wattage: d.wattage || 0, on: d.on }))
  );
  const proactive = useProactivity({
    profileName: pName,
    weather: weather.weather,
    events: calendar.events,
    totalKwh: energy.totalKwh,
    speak: (t: string) => tts.speak(t),
    addNotification: (n) => notif.addNotification({ type: n.type as any, title: n.title, body: n.body }),
  });
  const vision = useVision({
    onPresenceChange: (p) => {
      if (p) window.dispatchEvent(new CustomEvent('nova-presence'));
    },
  });
  const prevMsgCount = useRef(chat.messages.length);

  useEffect(() => {
    notif.checkTimers(timers.timers);
  }, [timers.timers, notif.checkTimers]);

  useEffect(() => {
    const iv = setInterval(() => notif.checkCalendar(calendar.events), 60_000);
    notif.checkCalendar(calendar.events);
    return () => clearInterval(iv);
  }, [calendar.events, notif.checkCalendar]);

  useEffect(() => {
    notif.checkWeather(weather.weather);
  }, [weather.weather, notif.checkWeather]);

  useEffect(() => {
    if (chat.messages.length > prevMsgCount.current) {
      const lastMsg = chat.messages[chat.messages.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg.id !== 'welcome') {
        tts.speak(lastMsg.content);
      }
    }
    prevMsgCount.current = chat.messages.length;
  }, [chat.messages, tts]);

  const handleToolActions = useCallback((actions: ChatToolAction[]) => {
    for (const action of actions) {
      switch (action.type) {
        case 'add_reminder':
          if (action.payload) reminders.add(action.payload);
          break;
        case 'complete_reminder':
          if (action.payload !== undefined) {
            const idx = parseInt(action.payload);
            const r = reminders.reminders[idx];
            if (r) reminders.toggleDone(r.id);
          }
          break;
        case 'remove_reminder':
          if (action.payload !== undefined) {
            const idx = parseInt(action.payload);
            const r = reminders.reminders[idx];
            if (r) reminders.remove(r.id);
          }
          break;
        case 'refresh_devices':
          smart.fetchDevices();
          break;
        case 'navigate':
          if (action.payload) setTab(action.payload as TabId);
          break;
        case 'web_search':
          if (action.payload) {
            const q = encodeURIComponent(action.payload);
            window.dispatchEvent(new CustomEvent('nova-web-go', { detail: `https://glowsearch.lovable.app/?q=${q}` }));
            setTab('web');
          }
          break;
        case 'start_timer':
          try {
            const p = JSON.parse(action.payload || '{}');
            const minutes = Math.max(1, Math.round((p.seconds || 60) / 60));
            const id = timers.add(p.label || 'Timer AI', minutes);
            timers.start(id);
          } catch { /* ignore */ }
          break;
        case 'play_radio':
          try {
            const p = JSON.parse(action.payload || '{}');
            if (p.action === 'stop') { radio.stop(); break; }
            const name = (p.station || '').toLowerCase();
            const station = radio.stations.find(s =>
              s.name.toLowerCase().includes(name) || s.id.toLowerCase().includes(name)
            ) || radio.stations[0];
            if (station) radio.toggle(station.id);
          } catch { /* ignore */ }
          break;
        case 'play_ambient':
          try {
            const p = JSON.parse(action.payload || '{}');
            if (p.action === 'stop') { ambient.stop?.(); break; }
            const name = (p.sound || '').toLowerCase();
            const s = ambient.sounds.find(x => x.name.toLowerCase().includes(name) || x.id.toLowerCase().includes(name));
            if (s) ambient.toggle(s.id);
          } catch { /* ignore */ }
          break;
        case 'add_event':
          try {
            const p = JSON.parse(action.payload || '{}');
            if (p.title && p.date && p.startTime && p.endTime) {
              calendar.addEvent({ title: p.title, date: p.date, startTime: p.startTime, endTime: p.endTime, description: p.description });
            }
          } catch { /* ignore */ }
          break;
         case 'add_note':
          if (action.payload) notes.add(action.payload);
          break;
        case 'remember':
          try {
            const p = JSON.parse(action.payload || '{}');
            if (p.key && p.value) memory.remember(p.key, p.value);
          } catch { /* ignore */ }
          break;
        case 'add_shopping':
          try {
            const p = JSON.parse(action.payload || '{}');
            if (p.item) shopping.add(p.item, p.qty, p.category);
          } catch { /* ignore */ }
          break;
        case 'run_sequence':
          try {
            const steps = JSON.parse(action.payload || '[]') as { type: string; payload?: string }[];
            (async () => {
              for (const s of steps) {
                try {
                  const pl = s.payload ? (s.payload.startsWith('{') || s.payload.startsWith('[') ? JSON.parse(s.payload) : s.payload) : null;
                  if (s.type === 'navigate' && typeof pl === 'string') setTab(pl as TabId);
                  else if (s.type === 'scene' && typeof pl === 'string') devices.applyScene(pl);
                  else if (s.type === 'smart_toggle' && typeof pl === 'string') smart.toggleDevice(pl);
                  else if (s.type === 'radio') { if (pl?.action === 'stop') radio.stop(); else { const st = radio.stations.find(x => x.name.toLowerCase().includes((pl?.station||'').toLowerCase())); if (st) radio.toggle(st.id); } }
                  else if (s.type === 'ambient') { if (pl?.action === 'stop') ambient.stop?.(); else { const sd = ambient.sounds.find(x => x.name.toLowerCase().includes((pl?.sound||'').toLowerCase())); if (sd) ambient.toggle(sd.id); } }
                  else if (s.type === 'timer') { const id = timers.add(pl?.label || 'Timer', Math.max(1, Math.round((pl?.seconds || 60) / 60))); timers.start(id); }
                  else if (s.type === 'speak' && typeof pl === 'string') tts.speak(pl);
                  else if (s.type === 'delay') await new Promise(r => setTimeout(r, Math.min(30000, (Number(pl)||1)*1000)));
                } catch { /* skip step */ }
                await new Promise(r => setTimeout(r, 200));
              }
            })();
          } catch { /* ignore */ }
          break;
        case 'delay':
          // Standalone delay — no-op (only meaningful inside sequences)
          break;
        case 'open_floating':
          try {
            const p = JSON.parse(action.payload || '{}');
            if (p.target || p.url) {
              window.dispatchEvent(new CustomEvent('nova-open-floating', { detail: p }));
            }
          } catch { /* ignore */ }
          break;
      }
    }
  }, [reminders, smart, timers, radio, ambient, calendar, notes, memory, shopping, devices, tts]);

  const sendWithContext = useCallback(async (input: string) => {
    const actions = await chat.sendMessage(input, {
      weather: weather.weather,
      reminders: reminders.reminders,
      notes: notes.notes,
      timers: timers.timers,
      smartDevices: smart.devices.map(d => ({ deviceId: d.deviceId, label: d.label, type: d.type, on: d.on })),
      calendarEvents: calendar.getUpcomingEvents(10),
      ambientPlaying: ambient.playing,
      profileName: profile?.name || 'Giuliano',
      notifications: notif.notifications.slice(0, 10),
      memory: memory.items.map(m => ({ key: m.key, value: m.value })),
      shopping: shopping.items.slice(0, 30).map(s => ({ item: s.item, qty: s.qty, category: s.category, done: s.done })),
      unreadMessages: msgs.unreadCount,
    });
    handleToolActions(actions);
  }, [chat, weather.weather, reminders.reminders, notes.notes, timers.timers, smart.devices, calendar, ambient.playing, profile, handleToolActions, notif.notifications, memory.items, shopping.items, msgs.unreadCount]);

  const handleVoiceResult = useCallback((text: string) => {
    setTab('chat');
    sendWithContext(text);
  }, [sendWithContext]);

  const voice = useVoiceWake(handleVoiceResult);

  // Idle screensaver
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!unlocked) return;
    const reset = () => {
      setIdle(false);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MS);
    };
    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'];
    events.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
    window.addEventListener('nova-presence', reset as EventListener);
    reset();
    return () => {
      events.forEach(ev => window.removeEventListener(ev, reset));
      window.removeEventListener('nova-presence', reset as EventListener);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [unlocked]);

  const handleLogout = useCallback(() => {
    setUnlocked(false);
    setProfile(null);
    setTab('dashboard');
    tts.stop();
  }, [tts]);

  if (!unlocked || !profile) {
    return <PinLock onUnlock={(p) => { setProfile(p); setUnlocked(true); }} />;
  }

  return (
    <div className="flex flex-col h-dvh relative z-[1]">
      <NovaHeader
        ttsEnabled={tts.enabled}
        ttsSpeaking={tts.speaking}
        onTtsToggle={tts.toggle}
        onTtsStop={tts.stop}
        profile={profile}
        notifications={notif.notifications}
        unreadCount={notif.unreadCount}
        onMarkRead={notif.markRead}
        onClearNotifications={notif.clearAll}
        voiceState={voice.state}
        voiceAlwaysOn={voice.alwaysOn}
      />
      <TabNav active={tab} onChange={setTab} />
      <main className="flex-1 overflow-hidden flex flex-col">
        {renderTab(tab)}
      </main>

      {voice.statusText && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-2 pointer-events-none">
          <div className={`rounded-xl px-4 py-2.5 text-xs font-mono text-center backdrop-blur-lg border transition-all ${
            voice.state === 'listening' ? 'bg-primary/15 border-primary/30 text-primary' :
            voice.state === 'processing' ? 'bg-accent/15 border-accent/30 text-accent' :
            voice.state === 'error' ? 'bg-destructive/15 border-destructive/30 text-destructive' :
            'bg-card/90 border-border text-muted-foreground'
          }`}>
            {voice.state === 'listening' && <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />}
            {voice.statusText}
          </div>
        </div>
      )}

      {idle && (
        <Screensaver
          weather={weather.weather}
          events={calendar.getUpcomingEvents(5)}
          onDismiss={() => setIdle(false)}
        />
      )}

      {vision.active && (
        <div className="fixed top-2 right-2 z-[100] flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/20 border border-destructive/40 backdrop-blur-md pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-[0.5rem] font-mono font-bold text-destructive tracking-wider uppercase">REC</span>
        </div>
      )}

      <FloatingHost />
    </div>
  );
};

export default Index;
