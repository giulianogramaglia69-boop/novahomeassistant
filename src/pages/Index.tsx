import { useState, useCallback } from 'react';
import { TabId } from '@/lib/types';
import { useChat, ChatToolAction } from '@/hooks/useChat';
import { useDevices } from '@/hooks/useDevices';
import { useReminders } from '@/hooks/useReminders';
import { useWeather } from '@/hooks/useWeather';
import { useSmartThings } from '@/hooks/useSmartThings';
import { useVoiceWake } from '@/hooks/useVoiceWake';
import { useRadio } from '@/hooks/useRadio';
import NovaHeader from '@/components/nova/NovaHeader';
import TabNav from '@/components/nova/TabNav';
import ChatPanel from '@/components/nova/ChatPanel';
import HomePanel from '@/components/nova/HomePanel';
import RadioPanel from '@/components/nova/RadioPanel';
import MeteoPanel from '@/components/nova/MeteoPanel';
import RemindersPanel from '@/components/nova/RemindersPanel';
import SettingsPanel from '@/components/nova/SettingsPanel';

const Index = () => {
  const [tab, setTab] = useState<TabId>('chat');
  const chat = useChat();
  const devices = useDevices();
  const reminders = useReminders();
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

  // Voice wake word handler
  const handleVoiceCommand = useCallback((text: string) => {
    // Switch to chat tab and send the voice command
    setTab('chat');
    sendWithContext(text);
  }, [sendWithContext]);

  const voice = useVoiceWake(handleVoiceCommand);

  const startVoice = useCallback(() => {
    setVoiceActive(true);
    voice.startListening();
  }, [voice]);

  const stopVoice = useCallback(() => {
    setVoiceActive(false);
    voice.stopListening();
  }, [voice]);

  return (
    <div className="flex flex-col h-dvh relative z-[1]">
      <NovaHeader />
      <TabNav active={tab} onChange={setTab} />
      <main className="flex-1 overflow-hidden flex flex-col">
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
        {tab === 'meteo' && (
          <MeteoPanel weather={weather.weather} loading={weather.loading} />
        )}
        {tab === 'reminders' && (
          <RemindersPanel
            reminders={reminders.reminders}
            onAdd={reminders.add}
            onToggle={reminders.toggleDone}
            onRemove={reminders.remove}
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
