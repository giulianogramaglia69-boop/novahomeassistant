// Card riassuntive in cima alla pagina Casa + banner "Oggi".
// Riepiloga promemoria, spesa, prossimo evento, ponte e bacheca famiglia.
// NOTA: Reminder non ha una data di scadenza (solo id/text/done/createdAt):
// "in scadenza/arretrati" qui significa promemoria APERTI (non completati).
import { useNovaItems, NovaItem } from '@/hooks/useNovaItems';
import { CalendarEvent } from '@/hooks/useCalendar';
import { BridgeDevice, findBridgeTv, isBridgeTvOnline } from '@/lib/bridge';
import { Reminder, TabId } from '@/lib/types';
import { ShoppingItem } from '@/hooks/useShoppingList';

export interface HomeSummaryInput {
  reminders: Reminder[];
  shoppingItems: ShoppingItem[];
  upcomingEvents: CalendarEvent[];
  /** Post-it bacheca (già in ordine recente dal hook, ma si riordina qui). */
  boardPosts: NovaItem<{ text: string; color: string }>[];
  bridgeDevices: BridgeDevice[];
  bridgeConfigured: boolean;
  /** Messaggio d'errore del ponte (già in italiano), o null se nessun errore. */
  bridgeError: string | null;
}

export interface HomeSummaryBoardPost {
  id: string;
  text: string;
  color?: string;
  author: string;
  createdAt: string;
}

export interface HomeSummaryData {
  openReminders: number;
  /** Testi dei primi 3 promemoria aperti. */
  openReminderTexts: string[];
  openShoppingCount: number;
  /** L'evento più vicino per data + ora d'inizio, o null se nessuno. */
  nextEvent: CalendarEvent | null;
  /** Il primo evento di oggi, o null se nessuno. */
  todayEvent: CalendarEvent | null;
  bridgeOnlineCount: number;
  bridgeTotal: number;
  tvOnline: boolean;
  tvPresent: boolean;
  chromecastDown: boolean;
  latestBoardPosts: HomeSummaryBoardPost[];
  /** Voci del banner "Oggi", in italiano; vuoto = tutto a posto. */
  bannerIssues: string[];
  allClear: boolean;
}

function localTodayString(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return a.startTime.localeCompare(b.startTime);
}

/** Riepilogo puro: conteggi e selezioni per la pagina Casa. */
export function buildHomeSummary(input: HomeSummaryInput): HomeSummaryData {
  const open = input.reminders.filter(r => !r.done);
  const openReminderTexts = open.slice(0, 3).map(r => r.text);
  const openShoppingCount = input.shoppingItems.filter(i => !i.done).length;

  const sortedEvents = [...input.upcomingEvents].sort(compareEvents);
  const nextEvent = sortedEvents[0] ?? null;
  const today = localTodayString();
  const todayEvent = sortedEvents.find(e => e.date === today) ?? null;

  const bridgeTotal = input.bridgeDevices.length;
  const bridgeOnlineCount = input.bridgeDevices.filter(
    d => d.status === 'online' && d.live?.online !== false,
  ).length;
  const tv = findBridgeTv(input.bridgeDevices);
  const tvPresent = tv !== null;
  const tvOnline = isBridgeTvOnline(tv);
  const chromecastDown = input.bridgeDevices.some(
    d => d.type === 'chromecast' && (d.live?.online === false || d.status === 'offline'),
  );

  const latestBoardPosts: HomeSummaryBoardPost[] = [...input.boardPosts]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3)
    .map(p => ({
      id: p.id,
      text: p.data?.text ?? '',
      color: p.data?.color,
      author: p.created_by,
      createdAt: p.created_at,
    }));

  const bannerIssues: string[] = [];
  if (open.length === 1) bannerIssues.push('1 promemoria aperto');
  else if (open.length > 1) bannerIssues.push(`${open.length} promemoria aperti`);
  if (!input.bridgeConfigured) bannerIssues.push('Ponte Nova non configurato');
  else if (input.bridgeError) bannerIssues.push(input.bridgeError);
  if (tvPresent && !tvOnline) bannerIssues.push('TV Samsung offline');
  if (chromecastDown) bannerIssues.push('Chromecast non risponde');
  if (todayEvent) bannerIssues.push(`Oggi: ${todayEvent.title} alle ${todayEvent.startTime}`);

  return {
    openReminders: open.length,
    openReminderTexts,
    openShoppingCount,
    nextEvent,
    todayEvent,
    bridgeOnlineCount,
    bridgeTotal,
    tvOnline,
    tvPresent,
    chromecastDown,
    latestBoardPosts,
    bannerIssues,
    allClear: bannerIssues.length === 0,
  };
}

/** "sab 28 nov" dalla data YYYY-MM-DD (parse locale, mai UTC). */
function formatEventDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export interface HomeSummaryProps {
  profileName: string;
  reminders: Reminder[];
  shoppingItems: ShoppingItem[];
  upcomingEvents: CalendarEvent[];
  bridgeDevices: BridgeDevice[];
  bridgeConfigured: boolean;
  bridgeError: string | null;
  onNavigate?: (tab: TabId) => void;
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1.5">
      {children}
    </div>
  );
}

function SummaryCard({
  title,
  onClick,
  children,
  wide,
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const cls = `bg-card border border-border rounded-[14px] p-3.5 text-left ${
    wide ? 'col-span-2' : ''
  } ${onClick ? 'hover:border-primary/40 active:scale-[0.98] transition-all cursor-pointer' : ''}`;
  const body = (
    <>
      <CardHeader>{title}</CardHeader>
      {children}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

export function HomeSummary({
  profileName,
  reminders,
  shoppingItems,
  upcomingEvents,
  bridgeDevices,
  bridgeConfigured,
  bridgeError,
  onNavigate,
}: HomeSummaryProps) {
  const { items: boardPosts } = useNovaItems<{ text: string; color: string }>('postit', profileName);
  const s = buildHomeSummary({
    reminders,
    shoppingItems,
    upcomingEvents,
    boardPosts,
    bridgeDevices,
    bridgeConfigured,
    bridgeError,
  });
  const go = (tab: TabId) => (onNavigate ? () => onNavigate(tab) : undefined);
  const today = localTodayString();

  return (
    <div className="flex flex-col gap-2.5">
      {/* ─── BANNER OGGI ─── */}
      {s.allClear ? (
        <div className="bg-card border border-border rounded-[14px] px-3.5 py-2.5 text-[0.7rem] text-muted-foreground">
          Tutto a posto per oggi ✓
        </div>
      ) : (
        <div className="bg-card border border-primary/35 rounded-[14px] p-3.5">
          <CardHeader>Oggi</CardHeader>
          <ul className="space-y-0.5">
            {s.bannerIssues.map(issue => (
              <li key={issue} className="text-[0.7rem] text-foreground leading-snug">
                • {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── GRIGLIA RIASSUNTIVA ─── */}
      <div className="grid grid-cols-2 gap-2.5">
        <SummaryCard title="Promemoria" onClick={go('reminders')}>
          <div className="text-[0.8rem] font-semibold text-foreground">
            {s.openReminders === 0
              ? 'Nessun promemoria aperto'
              : s.openReminders === 1
                ? '1 aperto'
                : `${s.openReminders} aperti`}
          </div>
          {s.openReminderTexts.map(t => (
            <div key={t} className="text-[0.65rem] text-muted-foreground leading-snug truncate">
              • {t}
            </div>
          ))}
        </SummaryCard>

        <SummaryCard title="Spesa" onClick={go('shopping')}>
          <div className="text-[0.8rem] font-semibold text-foreground">
            {s.openShoppingCount === 0
              ? 'Lista vuota'
              : s.openShoppingCount === 1
                ? '1 articolo da comprare'
                : `${s.openShoppingCount} articoli da comprare`}
          </div>
        </SummaryCard>

        <SummaryCard title="Prossimo evento" onClick={go('calendar')}>
          {s.nextEvent ? (
            <>
              <div className="text-[0.8rem] font-semibold text-foreground leading-snug">
                {s.nextEvent.title}
              </div>
              <div className="text-[0.65rem] text-muted-foreground">
                {s.nextEvent.date === today
                  ? `Oggi · ${s.nextEvent.startTime}`
                  : `${formatEventDate(s.nextEvent.date)} · ${s.nextEvent.startTime}`}
              </div>
            </>
          ) : (
            <div className="text-[0.8rem] font-semibold text-foreground">
              Nessun evento in programma
            </div>
          )}
        </SummaryCard>

        <SummaryCard title="Dispositivi ponte" onClick={go('home')}>
          <div className="text-[0.8rem] font-semibold text-foreground">
            {bridgeConfigured
              ? `${s.bridgeOnlineCount} / ${s.bridgeTotal} online`
              : 'Ponte non configurato'}
          </div>
          <div className="text-[0.65rem] text-muted-foreground">
            {!s.tvPresent
              ? 'TV Samsung non trovata'
              : s.tvOnline
                ? 'TV Samsung: online ●'
                : 'TV Samsung: offline ○'}
          </div>
        </SummaryCard>

        <SummaryCard title="Bacheca Famiglia" wide onClick={go('family')}>
          {s.latestBoardPosts.length === 0 ? (
            <div className="text-[0.8rem] font-semibold text-foreground">
              Nessun post-it in bacheca
            </div>
          ) : (
            s.latestBoardPosts.map(p => (
              <div key={p.id} className="text-[0.65rem] text-muted-foreground leading-snug">
                • {p.text}
                {p.author ? <span className="text-foreground"> — {p.author}</span> : null}
              </div>
            ))
          )}
        </SummaryCard>
      </div>
    </div>
  );
}

export default HomeSummary;
