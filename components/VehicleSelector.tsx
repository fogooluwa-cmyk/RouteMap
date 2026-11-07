"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Vehicle } from "@/lib/vehicles";

type Props = {
  vehicles: Vehicle[];
  selectedIndex: number;
  onChange: (index: number) => void;
};

export default function VehicleSelector({ vehicles, selectedIndex, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = vehicles[selectedIndex];

  const groups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const filtered = vehicles.map((vehicle, index) => ({ vehicle, index })).filter(({ vehicle }) =>
      !normalized || `${vehicle.make} ${vehicle.model} ${vehicle.variant} ${vehicle.modelYear} ${vehicle.batteryKwh} ${vehicle.connectorLabel}`.toLocaleLowerCase().includes(normalized),
    );
    const grouped = new Map<string, typeof filtered>();
    filtered.forEach((item) => grouped.set(item.vehicle.make, [...(grouped.get(item.vehicle.make) ?? []), item]));
    return [...grouped.entries()];
  }, [vehicles, query]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", dismiss);
    return () => window.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function choose(index: number) {
    onChange(index);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className={`vehicle-picker ${open ? "is-open" : ""}`} ref={rootRef}>
      <button className="vehicle-trigger" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="vehicle-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><path d="M3 11h18v8H3zM6 19v2m12-2v2M3 14h3m12 0h3"/><circle cx="7" cy="15" r=".5"/><circle cx="17" cy="15" r=".5"/></svg></span>
        <span className="vehicle-trigger-copy"><strong>{selected.name}</strong><small>{selected.modelYear} · {selected.batteryKwh} kWh usable · ~{selected.efficiencyMiPerKwh.toFixed(1)} mi/kWh est.</small></span>
        <span className="select-chevron" aria-hidden="true">⌄</span>
      </button>

      {open && <div className="vehicle-picker-popover">
        <label className="vehicle-search"><span aria-hidden="true">⌕</span><input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search make, model or variant" aria-label="Search vehicles" onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && groups[0]?.[1][0]) { event.preventDefault(); choose(groups[0][1][0].index); }
        }} /></label>
        <div className="vehicle-results" role="listbox" aria-label="Available vehicles">
          {groups.map(([make, items]) => <section className="vehicle-group" key={make} aria-label={make}>
            <h3>{make}<span>{items.length}</span></h3>
            {items.map(({ vehicle, index }) => <button type="button" role="option" aria-selected={selectedIndex === index} className={`vehicle-option ${selectedIndex === index ? "is-selected" : ""}`} key={`${vehicle.name}-${vehicle.modelYear}-${index}`} onClick={() => choose(index)}>
              <span className="vehicle-option-main"><strong>{vehicle.model} <span>{vehicle.variant}</span></strong><small>{vehicle.modelYear} · {vehicle.batteryKwh} kWh usable</small></span>
              <span className="vehicle-option-data"><strong>~{vehicle.efficiencyMiPerKwh.toFixed(1)}</strong><small>mi/kWh est.</small></span>
            </button>)}
          </section>)}
          {groups.length === 0 && <p className="vehicle-no-results">No vehicles match “{query}”. Try a make, model or battery size.</p>}
        </div>
        <div className="vehicle-picker-foot">WLTP figures are estimates · charging connector shown below</div>
      </div>}

      <div className="vehicle-spec-row">
        <span><strong>{selected.batteryKwh} kWh</strong><small>USABLE BATTERY</small></span>
        <span><strong>~{selected.efficiencyMiPerKwh.toFixed(1)} mi/kWh</strong><small>WLTP ESTIMATE</small></span>
        <a href={selected.sourceUrl} target="_blank" rel="noreferrer" title={`View ${selected.sourceLabel}`}>Specs ↗</a>
      </div>
    </div>
  );
}
