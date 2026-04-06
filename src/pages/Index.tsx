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
import SettingsPanel from '@/components/nova/SettingsPanel';
import PinLock from '@/components/nova/PinLock';

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
      }
    }
  }, [reminders, smart]);

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
    });
    handleToolActions(actions);
  }, [chat, weather.weather, reminders.reminders, notes.notes, timers.timers, smart.devices, calendar, ambient.playing, profile, handleToolActions, notif.notifications]);

  const handleVoiceResult = useCallback((text: string) => {
    setTab('chat');
    sendWithContext(text);
  }, [sendWithContext]);

  const voice = useVoiceWake(handleVoiceResult);

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
      />
      <TabNav active={tab} onChange={setTab} />
      <main className="flex-1 overflow-hidden flex flex-col">
        {tab === 'dashboard' && (
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
          />
        )}
        {tab === 'chat' && (
          <ChatPanel
            messages={chat.messages}
            isLoading={chat.isLoading}
            onSend={sendWithContext}
            voiceState={voice.state}
            voiceStatusText={voice.statusText}
            onVoiceStart={voice.startListening}
            onVoiceStop={voice.stopListening}
          />
        )}
        {tab === 'home' && (
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
        )}
        {tab === 'radio' && (
          <RadioPanel
            stations={radio.stations}
            playing={radio.playing}
            loading={radio.loading}
            volume={radio.volume}
            onToggle={radio.toggle}
            onVolumeChange={radio.changeVolume}
          />
        )}
        {tab === 'meteo' && (
          <MeteoPanel weather={weather.weather} loading={weather.loading} />
        )}
        {tab === 'reminders' && (
          <NotesPanel
            notes={notes.notes}
            onAdd={notes.add}
            onRemove={notes.remove}
            onEdit={notes.edit}
          />
        )}
        {tab === 'timer' && (
          <TimerPanel
            timers={timers.timers}
            onAdd={timers.add}
            onStart={timers.start}
            onPause={timers.pause}
            onReset={timers.reset}
            onRemove={timers.remove}
          />
        )}
        {tab === 'calendar' && (
          <CalendarPanel
            events={calendar.events}
            onAdd={calendar.addEvent}
            onUpdate={calendar.updateEvent}
            onRemove={calendar.removeEvent}
            getEventsForDate={calendar.getEventsForDate}
          />
        )}
        {tab === 'ambiente' && (
          <AmbientePanel
            sounds={ambient.sounds}
            playing={ambient.playing}
            volume={ambient.volume}
            onToggle={ambient.toggle}
            onVolumeChange={ambient.changeVolume}
          />
        )}
        {tab === 'news' && (
          <NewsPanel items={news.items} loading={news.loading} error={news.error} onRefresh={news.refresh} />
        )}
        {tab === 'settings' && (
          <SettingsPanel
            onClearChat={chat.clearChat}
            onDetectLocation={weather.detectLocation}
            profile={profile}
            onLogout={handleLogout}
            notifSettings={notif.settings}
            onNotifSettingChange={notif.updateSetting}
            ttsEnabled={tts.enabled}
            onTtsToggle={tts.toggle}
          />
        )}
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
    </div>
  );
};

export default Index;
