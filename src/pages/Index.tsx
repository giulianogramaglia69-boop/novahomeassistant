import { useState, useCallback } from 'react';
import { TabId } from '@/lib/types';
import { useChat, ChatToolAction } from '@/hooks/useChat';
import { useDevices } from '@/hooks/useDevices';
import { useReminders } from '@/hooks/useReminders';
import { useNotes } from '@/hooks/useNotes';
import { useWeather } from '@/hooks/useWeather';
import { useSmartThings } from '@/hooks/useSmartThings';
import { useVoiceWake } from '@/hooks/useVoiceWake';
import { useRadio, RADIO_STATIONS } from '@/hooks/useRadio';
import NovaHeader from '@/components/nova/NovaHeader';
import TabNav from '@/components/nova/TabNav';
import DashboardPanel from '@/components/nova/DashboardPanel';
import ChatPanel from '@/components/nova/ChatPanel';
import HomePanel from '@/components/nova/HomePanel';
import RadioPanel from '@/components/nova/RadioPanel';
import MeteoPanel from '@/components/nova/MeteoPanel';
import NotesPanel from '@/components/nova/NotesPanel';
import RemindersPanel from '@/components/nova/RemindersPanel';
import SettingsPanel from '@/components/nova/SettingsPanel';

const Index = () => {
  const [tab, setTab] = useState<TabId>('dashboard');
  const chat = useChat();
  const devices = useDevices();
  const reminders = useReminders();
  const notes = useNotes();
  const weather = useWeather();
  const smart = useSmartThings();
  const radio = useRadio();
  const [voiceActive, setVoiceActive] = useState(false);

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
    });
    handleToolActions(actions);
  }, [chat, weather.weather, reminders.reminders, handleToolActions]);

  // Voice: chat command handler
  const handleVoiceChatCommand = useCallback((text: string) => {
    setTab('chat');
    radio.unduck();
    sendWithContext(text);
  }, [sendWithContext, radio]);

  // Voice: home command handler (direct, no AI)
  const handleVoiceHomeCommand = useCallback((command: string) => {
    radio.unduck();
    if (command === 'tv_on' || command === 'tv_off') {
      const tvDevice = smart.devices.find(d => d.type === 'tv');
      if (tvDevice) smart.toggleDevice(tvDevice.deviceId);
    } else if (command === 'lights_on' || command === 'lights_off') {
      const lightDevices = devices.devices.filter(d => d.type === 'light');
      const turnOn = command === 'lights_on';
      lightDevices.forEach(d => { if (d.on !== turnOn) devices.toggle(d.id); });
    } else if (command === 'ac_on' || command === 'ac_off') {
      const acDevices = devices.devices.filter(d => d.type === 'ac');
      const turnOn = command === 'ac_on';
      acDevices.forEach(d => { if (d.on !== turnOn) devices.toggle(d.id); });
    } else if (command === 'all_off') {
      devices.devices.forEach(d => { if (d.on) devices.toggle(d.id); });
      smart.devices.forEach(d => { if (d.on) smart.toggleDevice(d.deviceId); });
      radio.stop();
    } else if (command.startsWith('radio_play:')) {
      const stationName = command.replace('radio_play:', '').toLowerCase();
      const station = RADIO_STATIONS.find(s => s.name.toLowerCase().includes(stationName));
      if (station) radio.toggle(station.id);
    } else if (command === 'radio_stop') {
      radio.stop();
    }
  }, [smart, devices, radio]);

  const voice = useVoiceWake({
    onChatCommand: handleVoiceChatCommand,
    onHomeCommand: handleVoiceHomeCommand,
  });

  const startVoice = useCallback(() => {
    setVoiceActive(true);
    radio.duck();
    voice.startListening();
  }, [voice, radio]);

  const stopVoice = useCallback(() => {
    setVoiceActive(false);
    radio.unduck();
    voice.stopListening();
  }, [voice, radio]);

  return (
    <div className="flex flex-col h-dvh relative z-[1]">
      <NovaHeader />
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
          />
        )}
        {tab === 'chat' && (
          <ChatPanel
            messages={chat.messages}
            isLoading={chat.isLoading}
            onSend={sendWithContext}
            voiceState={voice.state}
            voiceSupported={voice.supported}
            onVoiceStart={startVoice}
            onVoiceStop={stopVoice}
            isVoiceActive={voiceActive}
            voiceError={voice.error}
            wakeMode={voice.wakeMode}
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
          />
        )}
        {tab === 'settings' && (
          <SettingsPanel onClearChat={chat.clearChat} onDetectLocation={weather.detectLocation} />
        )}
      </main>
    </div>
  );
};

export default Index;
