const TrafficPanel = () => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h2 className="font-syne text-lg font-bold">🚗 Traffico Live · Agrigento</h2>
        <div className="text-[0.65rem] text-muted-foreground mt-0.5">Mappa traffico in tempo reale di Google Maps</div>
      </div>
      <div className="flex-1">
        <iframe
          title="Traffico Agrigento"
          src="https://maps.google.com/maps?q=Agrigento&t=m&layer=t&z=12&output=embed"
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default TrafficPanel;
