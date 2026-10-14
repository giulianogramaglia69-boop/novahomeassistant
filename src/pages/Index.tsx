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
import { useHabits, partOfDay } from '@/hooks/useHabits';
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
import FamilyPanel from '@/components/nova/FamilyPanel';
import MirrorMode from '@/components/nova/MirrorMode';
import { useAnnouncements } from '@/hooks/useNovaItems';
import { usePresenceSim } from '@/hooks/usePresenceSim';

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
  const habits = useHabits(pName);
  const proactive = useProactivity({
    profileName: pName,
    weather: weather.weather,
    events: calendar.events,
    totalKwh: energy.totalKwh,
    speak: (t: string) => tts.speak(t),
    addNotification: (n) => notif.addNotification({ type: n.type as any, title: n.title, body: n.body }),
    habitForHour: habits.habitForHour,
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
      window.dispatchEvent(new CustomEvent('nova-agent-action', { detail: action }));
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
    habits.log(input);
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
      ambient: {
        partOfDay: partOfDay(),
        isWeekend: [0, 6].includes(new Date().getDay()),
        presence: vision.present,
        visionEnabled: vision.enabled,
      },
      habits: {
        top: habits.topHabits(8).map(h => ({ key: h.key, total: h.total })),
        nowHourHabit: habits.habitForHour(new Date().getHours())?.key || null,
      },
    });
    handleToolActions(actions);
  }, [chat, weather.weather, reminders.reminders, notes.notes, timers.timers, smart.devices, calendar, ambient.playing, profile, handleToolActions, notif.notifications, memory.items, shopping.items, msgs.unreadCount, habits, vision.present, vision.enabled]);

  const [mirror, setMirror] = useState(false);
  const [desktop, setDesktop] = useState(false);

  const handleVoiceResult = useCallback((text: string) => {
    const t = text.toLowerCase();
    const d: any = document;
    const isFs = !!(d.fullscreenElement || d.webkitFullscreenElement);
    if (/esci.*schermo intero/.test(t)) { if (isFs) (d.exitFullscreen || d.webkitExitFullscreen)?.call(d); return; }
    if (/schermo intero/.test(t)) { const el: any = document.documentElement; if (!isFs) (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el); return; }
    if (/(chiudi|esci).*specchio/.test(t)) { setMirror(false); return; }
    if (/specchio/.test(t)) { setMirror(true); return; }
    if (/(chiudi|esci).*desktop/.test(t)) { setDesktop(false); return; }
    if (/(modalit[aà]|apri) desktop/.test(t)) { setDesktop(true); return; }
    window.dispatchEvent(new CustomEvent('nova-agent-user', { detail: text }));
    if (!desktop) setTab('chat');
    sendWithContext(text);
  }, [sendWithContext, desktop]);

  const voice = useVoiceWake(handleVoiceResult);

  // Idle screensaver
  const [idle, setIdle] = useState(false);
  useAnnouncements(pName, tts.speak);
  const presence = usePresenceSim(smart.devices, smart.toggleDevice);
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

  const renderTab = (t: TabId) => {
    switch (t) {
      case 'dashboard':
        return (
          <DashboardPanel
            messages={chat.messages}
            isLoading={chat.isLoading}
            onSend={sendWithContext}
            smartDevices={smart.devices}
            smartLoading={smart.loading}
            onSmartToggle={smart.toggleDevice}
            stations={radio.stations}
            playing={radio.playing}
            onRadioToggle={radio.toggle}
            notes={notes.notes}
            onAddNote={notes.add}
            onRemoveNote={notes.remove}
            onNavigate={setTab}
            timers={timers.timers}
            onTimerNavigate={() => setTab('timer')}
            onTimerStart={timers.start}
            onTimerPause={timers.pause}
            weather={weather.weather}
            upcomingEvents={calendar.getUpcomingEvents(3)}
            voiceState={voice.state}
            onVoiceStart={voice.startListening}
            onVoiceStop={voice.stopListening}
            newsItems={news.items}
            newsLoading={news.loading}
            profile={profile}
            ambientSounds={ambient.sounds}
            ambientPlaying={ambient.playing}
            onAmbientToggle={ambient.toggle}
            ttsSpeaking={tts.speaking}
            totalWattage={totalWattage}
            devicesOn={devicesOn}
          />
        );
      case 'chat':
        return (
          <ChatPanel
            messages={chat.messages}
            isLoading={chat.isLoading}
            onSend={sendWithContext}
            voiceState={voice.state}
            voiceStatusText={voice.statusText}
            onVoiceStart={voice.startListening}
            onVoiceStop={voice.stopListening}
          />
        );
      case 'home':
        return (
          <HomePanel
            devices={devices.devices}
            devicesOn={devices.devicesOn}
            totalWattage={devices.totalWattage}
            onToggle={devices.toggle}
            onValueChange={devices.setValue}
            onScene={devices.applyScene}
            smartDevices={smart.devices}
            smartLoading={smart.loading}
            smartError={smart.error}
            onSmartToggle={smart.toggleDevice}
            onSmartFetch={smart.fetchDevices}
            onSmartCommand={smart.sendCommand}
          />
        );
      case 'radio':
        return (
          <RadioPanel
            stations={radio.stations}
            playing={radio.playing}
            loading={radio.loading}
            volume={radio.volume}
            onToggle={radio.toggle}
            onVolumeChange={radio.changeVolume}
          />
        );
      case 'meteo':
        return <MeteoPanel weather={weather.weather} loading={weather.loading} />;
      case 'reminders':
        return (
          <NotesPanel
            notes={notes.notes}
            onAdd={notes.add}
            onRemove={notes.remove}
            onEdit={notes.edit}
          />
        );
      case 'timer':
        return (
          <TimerPanel
            timers={timers.timers}
            onAdd={timers.add}
            onStart={timers.start}
            onPause={timers.pause}
            onReset={timers.reset}
            onRemove={timers.remove}
          />
        );
      case 'calendar':
        return (
          <CalendarPanel
            events={calendar.events}
            onAdd={calendar.addEvent}
            onUpdate={calendar.updateEvent}
            onRemove={calendar.removeEvent}
            getEventsForDate={calendar.getEventsForDate}
          />
        );
      case 'ambiente':
        return (
          <AmbientePanel
            sounds={ambient.sounds}
            playing={ambient.playing}
            volume={ambient.volume}
            onToggle={ambient.toggle}
            onVolumeChange={ambient.changeVolume}
          />
        );
      case 'news':
        return <NewsPanel items={news.items} loading={news.loading} error={news.error} onRefresh={news.refresh} />;
      case 'web':
        return <WebPanel />;
      case 'messages':
        return <MessagesPanel profile={profile} messages={msgs.messages} onSend={msgs.send} onMarkRead={msgs.markRead} />;
      case 'shopping':
        return <ShoppingPanel items={shopping.items} onAdd={shopping.add} onToggle={shopping.toggle} onRemove={shopping.remove} onClearDone={shopping.clearDone} />;
      case 'traffic':
        return <TrafficPanel />;
      case 'settings':
        return (
          <SettingsPanel
            onClearChat={chat.clearChat}
            onDetectLocation={weather.detectLocation}
            profile={profile}
            onLogout={handleLogout}
            notifSettings={notif.settings}
            onNotifSettingChange={notif.updateSetting}
            ttsEnabled={tts.enabled}
            onTtsToggle={tts.toggle}
            memoryItems={memory.items}
            onForgetMemory={memory.forget}
            voiceAlwaysOn={voice.alwaysOn}
            onVoiceAlwaysOnToggle={() => voice.setAlwaysOn(!voice.alwaysOn)}
            routines={proactive.routines}
            onUpdateRoutine={proactive.updateRoutine}
            macros={macrosHook.macros}
            onAddMacro={macrosHook.add}
            onRemoveMacro={macrosHook.remove}
            vision={{
              enabled: vision.enabled,
              active: vision.active,
              present: vision.present,
              motionLevel: vision.motionLevel,
              toggle: vision.toggle,
              videoRef: vision.videoRef,
              profileName: profile.name,
            }}
          />
        );
      case 'family':
        return <FamilyPanel profileName={profile.name} onAddShopping={(i) => shopping.add(i)} presence={presence} deviceCount={smart.devices.length} />;
      default:
        return null;
    }
  };

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
        onMirror={() => setMirror(true)}
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

      {desktop && (
        <DesktopMode
          onExit={() => setDesktop(false)}
          renderPanel={renderTab}
          chat={
            <ChatPanel
              messages={chat.messages}
              isLoading={chat.isLoading}
              onSend={(m) => { window.dispatchEvent(new CustomEvent('nova-agent-user', { detail: m })); sendWithContext(m); }}
              voiceState={voice.state}
              voiceStatusText={voice.statusText}
              onVoiceStart={voice.startListening}
              onVoiceStop={voice.stopListening}
            />
          }
        />
      )}

      {mirror && (
        <MirrorMode weather={weather.weather} events={calendar.getUpcomingEvents(3)} onClose={() => setMirror(false)} />
      )}

      {vision.active && (
        <div className="fixed top-2 right-2 z-[100] flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/20 border border-destructive/40 backdrop-blur-md pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-[0.5rem] font-mono font-bold text-destructive tracking-wider uppercase">REC</span>
        </div>
      )}

      <FloatingHost renderPanel={renderTab} />
    </div>
  );
};

export default Index;
