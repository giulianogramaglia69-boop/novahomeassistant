import { useState } from 'react';
import { TabId } from '@/lib/types';
import { useChat } from '@/hooks/useChat';
import { useDevices } from '@/hooks/useDevices';
import { useReminders } from '@/hooks/useReminders';
import { useWeather } from '@/hooks/useWeather';
import NovaHeader from '@/components/nova/NovaHeader';
import TabNav from '@/components/nova/TabNav';
import ChatPanel from '@/components/nova/ChatPanel';
import HomePanel from '@/components/nova/HomePanel';
import MeteoPanel from '@/components/nova/MeteoPanel';
import RemindersPanel from '@/components/nova/RemindersPanel';
import SettingsPanel from '@/components/nova/SettingsPanel';

const Index = () => {
  const [tab, setTab] = useState<TabId>('chat');
  const chat = useChat();
  const devices = useDevices();
  const reminders = useReminders();
  const weather = useWeather();

  return (
    <div className="flex flex-col h-dvh relative z-[1]">
      <NovaHeader />
      <TabNav active={tab} onChange={setTab} />
      <main className="flex-1 overflow-hidden flex flex-col">
        {tab === 'chat' && (
          <ChatPanel messages={chat.messages} isLoading={chat.isLoading} onSend={chat.sendMessage} />
        )}
        {tab === 'home' && (
          <HomePanel
            devices={devices.devices}
            devicesOn={devices.devicesOn}
            totalWattage={devices.totalWattage}
            onToggle={devices.toggle}
            onValueChange={devices.setValue}
            onScene={devices.applyScene}
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
