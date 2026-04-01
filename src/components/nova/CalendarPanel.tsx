import { useState, useMemo } from 'react';
import { CalendarEvent } from '@/hooks/useCalendar';

const DAYS_IT = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];
const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

interface Props {
  events: CalendarEvent[];
  onAdd: (event: Omit<CalendarEvent, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => void;
  onRemove: (id: string) => void;
  getEventsForDate: (date: string) => CalendarEvent[];
}

const toDateStr = (d: Date) => d.toISOString().split('T')[0];

const getWeekDays = (baseDate: Date) => {
  const d = new Date(baseDate);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
};

const CalendarPanel = ({ events, onAdd, onUpdate, onRemove, getEventsForDate }: Props) => {
  const [view, setView] = useState<'week' | 'agenda'>('week');
  const [weekBase, setWeekBase] = useState(new Date());
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [creating, setCreating] = useState<string | null>(null); // date string

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);

  const prevWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() - 7);
    setWeekBase(d);
  };
  const nextWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + 7);
    setWeekBase(d);
  };

  const today = toDateStr(new Date());

  // Agenda: group future events by day
  const agendaGroups = useMemo(() => {
    const future = events
      .filter(e => e.date >= today)
      .sort((a, b) => a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date));
    const groups: Record<string, CalendarEvent[]> = {};
    future.forEach(e => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    return Object.entries(groups).slice(0, 14);
  }, [events, today]);

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${DAYS_IT[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS_IT[d.getMonth()]}`;
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
      {/* View toggle + nav */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex gap-1">
          <button onClick={() => setView('week')} className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-syne font-semibold transition-all ${view === 'week' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>Settimana</button>
          <button onClick={() => setView('agenda')} className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-syne font-semibold transition-all ${view === 'agenda' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>Agenda</button>
        </div>
        {view === 'week' && (
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="w-7 h-7 rounded-lg bg-secondary text-foreground flex items-center justify-center text-sm">←</button>
            <span className="text-[0.65rem] font-mono text-muted-foreground">{formatDateLabel(toDateStr(weekDays[0]))}</span>
            <button onClick={nextWeek} className="w-7 h-7 rounded-lg bg-secondary text-foreground flex items-center justify-center text-sm">→</button>
          </div>
        )}
      </div>

      {view === 'week' ? (
        <div className="px-4 pb-4 flex flex-col gap-1">
          {weekDays.map(day => {
            const dateStr = toDateStr(day);
            const dayEvents = getEventsForDate(dateStr);
            const isToday = dateStr === today;
            return (
              <div
                key={dateStr}
                className={`rounded-xl border p-3 transition-all cursor-pointer ${isToday ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}
                onClick={() => { if (dayEvents.length === 0) setCreating(dateStr); }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[0.7rem] font-syne font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {DAYS_IT[(day.getDay() + 6) % 7]} {day.getDate()}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); setCreating(dateStr); }} className="text-[0.6rem] text-primary font-syne font-semibold">+ NUOVO</button>
                </div>
                {dayEvents.length === 0 ? (
                  <p className="text-[0.6rem] text-muted-foreground">Nessun evento</p>
                ) : dayEvents.map(ev => (
                  <button key={ev.id} onClick={(e) => { e.stopPropagation(); setEditing(ev); }} className="w-full text-left flex items-center gap-2 py-1 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-[0.68rem] font-semibold truncate flex-1">{ev.title}</span>
                    <span className="text-[0.6rem] text-muted-foreground font-mono">{ev.startTime}–{ev.endTime}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {agendaGroups.length === 0 ? (
            <p className="text-[0.7rem] text-muted-foreground text-center py-8">Nessun evento futuro</p>
          ) : agendaGroups.map(([dateStr, evts]) => (
            <div key={dateStr}>
              <p className="text-[0.65rem] font-syne font-bold text-primary mb-1 tracking-wider uppercase">{formatDateLabel(dateStr)}</p>
              <div className="flex flex-col gap-1">
                {evts.map(ev => (
                  <button key={ev.id} onClick={() => setEditing(ev)} className="w-full text-left bg-card border border-border rounded-xl px-3 py-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    <span className="text-[0.7rem] font-semibold truncate flex-1">{ev.title}</span>
                    <span className="text-[0.6rem] text-muted-foreground font-mono">{ev.startTime}–{ev.endTime}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event form modal */}
      {(editing || creating) && (
        <EventForm
          event={editing}
          defaultDate={creating || editing?.date || today}
          onSave={(data) => {
            if (editing) {
              onUpdate(editing.id, data);
            } else {
              onAdd(data as Omit<CalendarEvent, 'id'>);
            }
            setEditing(null);
            setCreating(null);
          }}
          onDelete={editing ? () => { onRemove(editing.id); setEditing(null); } : undefined}
          onClose={() => { setEditing(null); setCreating(null); }}
        />
      )}
    </div>
  );
};

interface EventFormProps {
  event: CalendarEvent | null;
  defaultDate: string;
  onSave: (data: Omit<CalendarEvent, 'id'>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const EventForm = ({ event, defaultDate, onSave, onDelete, onClose }: EventFormProps) => {
  const [title, setTitle] = useState(event?.title || '');
  const [date, setDate] = useState(event?.date || defaultDate);
  const [startTime, setStartTime] = useState(event?.startTime || '09:00');
  const [endTime, setEndTime] = useState(event?.endTime || '10:00');
  const [description, setDescription] = useState(event?.description || '');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), date, startTime, endTime, description: description.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-md bg-card border-t border-border rounded-t-2xl p-5 flex flex-col gap-3 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
        <h3 className="font-syne font-bold text-sm">{event ? 'Modifica Evento' : 'Nuovo Evento'}</h3>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titolo *" className="bg-secondary border border-border rounded-xl px-3 py-2.5 text-[0.75rem] font-mono outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary border border-border rounded-xl px-3 py-2.5 text-[0.75rem] font-mono outline-none focus:border-primary/40 text-foreground [color-scheme:dark]" />
        <div className="flex gap-2">
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2.5 text-[0.75rem] font-mono outline-none focus:border-primary/40 text-foreground [color-scheme:dark]" />
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2.5 text-[0.75rem] font-mono outline-none focus:border-primary/40 text-foreground [color-scheme:dark]" />
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrizione (opzionale)" rows={2} className="bg-secondary border border-border rounded-xl px-3 py-2.5 text-[0.75rem] font-mono outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground resize-none" />
        <div className="flex gap-2 mt-1">
          <button onClick={handleSave} disabled={!title.trim()} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-syne font-bold text-[0.75rem] disabled:opacity-40 transition-all active:scale-[0.98]">Salva</button>
          {onDelete && (
            <button onClick={onDelete} className="px-4 py-2.5 rounded-xl bg-destructive/15 text-destructive font-syne font-bold text-[0.75rem] transition-all active:scale-[0.98]">Elimina</button>
          )}
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-secondary text-muted-foreground font-syne font-bold text-[0.75rem] transition-all">Annulla</button>
        </div>
      </div>
    </div>
  );
};

export default CalendarPanel;
