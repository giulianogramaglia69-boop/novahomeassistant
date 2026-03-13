const NovaHeader = () => (
  <header className="relative z-10 flex items-center justify-between px-5 pt-[18px] pb-[14px] border-b border-border bg-background/80 backdrop-blur-[20px] shrink-0">
    <div className="flex items-center gap-2.5">
      <div
        className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0"
        style={{ animation: 'pulse-orb 3s ease-in-out infinite' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <div>
        <div className="font-syne font-extrabold text-[1.2rem] tracking-[0.12em] bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
          NOVA
        </div>
        <div className="text-[0.58rem] text-muted-foreground tracking-[0.1em] -mt-1">HOME ASSISTANT</div>
      </div>
    </div>
    <div className="flex gap-2 items-center">
      <div className="flex items-center gap-[5px] px-2.5 py-1 rounded-full text-[0.6rem] tracking-[0.08em] border border-accent/30 bg-accent/5 text-accent cursor-pointer">
        <span className="w-1.5 h-1.5 rounded-full bg-current" style={{ animation: 'blink 1.5s infinite' }} />
        AI ON
      </div>
    </div>
  </header>
);

export default NovaHeader;
