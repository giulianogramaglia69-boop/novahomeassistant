import { NewsItem } from '@/hooks/useNews';

interface Props {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const NewsPanel = ({ items, loading, error, onRefresh }: Props) => {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">Ultime Notizie</div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1.5 border border-border rounded-lg bg-secondary text-foreground font-mono text-[0.65rem] cursor-pointer transition-all hover:border-primary hover:text-primary disabled:opacity-40"
        >
          {loading ? '...' : 'Aggiorna'}
        </button>
      </div>

      {error && (
        <div className="text-[0.65rem] text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
              <div className="h-3 bg-secondary rounded w-3/4 mb-2" />
              <div className="h-2 bg-secondary rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card border border-border rounded-2xl p-4 transition-all hover:border-primary/30 active:scale-[0.98] block"
            >
              <h3 className="text-[0.78rem] font-semibold leading-snug text-foreground mb-1.5">
                {item.title}
              </h3>
              <div className="flex items-center gap-2 text-[0.55rem] text-muted-foreground">
                {item.source && (
                  <>
                    <span className="font-syne font-bold uppercase tracking-wider">{item.source}</span>
                    <span>·</span>
                  </>
                )}
                <span className="font-mono">{formatDate(item.pubDate)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsPanel;
