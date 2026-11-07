"use client";

import { useEffect, useRef, useState } from "react";
import type { PlaceResult } from "@/lib/mapbox";

type Props = {
  label: string;
  placeholder: string;
  marker: "origin" | "destination";
  onSelect: (place: PlaceResult | null) => void;
  initialValue?: string;
};

type SearchResponse = { features?: PlaceResult[]; error?: string };

export default function LocationSearch({ label, placeholder, marker, onSelect, initialValue = "" }: Props) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const selectedName = useRef(initialValue);
  const listId = `suggestions-${marker}`;

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2 || normalized === selectedName.current) {
      setSuggestions([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(normalized)}`, { signal: controller.signal });
        const data = await response.json() as SearchResponse;
        if (!response.ok) throw new Error(data.error ?? "Location search is unavailable.");
        setSuggestions(data.features ?? []);
        setOpen(true);
      } catch (searchError) {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setError(searchError instanceof Error ? searchError.message : "Location search is unavailable.");
        setOpen(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 320);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function choose(place: PlaceResult) {
    selectedName.current = place.name;
    setQuery(place.name);
    setSuggestions([]);
    setError("");
    setOpen(false);
    onSelect(place);
  }

  return (
    <div className="location-search">
      <label className="visually-hidden" htmlFor={`search-${marker}`}>{label}</label>
      <input
        id={`search-${marker}`}
        value={query}
        autoComplete="off"
        placeholder={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && (loading || Boolean(error) || suggestions.length > 0)}
        aria-controls={listId}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const nextValue = event.target.value;
          setQuery(nextValue);
          selectedName.current = "";
          setSuggestions([]);
          setError("");
          onSelect(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && suggestions[0]) {
            event.preventDefault();
            choose(suggestions[0]);
          }
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      />
      {open && (loading || error || suggestions.length > 0 || (query.trim().length >= 2 && query.trim() !== selectedName.current)) && (
        <div className="suggestion-popover" id={listId} role="listbox" aria-label={`${label} suggestions`}>
          {loading && <div className="suggestion-message"><span className="small-spinner" /> Searching places…</div>}
          {!loading && error && <div className="suggestion-message suggestion-error">{error}</div>}
          {!loading && !error && suggestions.map((place) => (
            <button className="suggestion-option" type="button" role="option" aria-selected="false" key={place.id} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(place)}>
              <span className="suggestion-pin">⌖</span><span>{place.name}</span>{place.sourceMode === "demo" && <small>DEMO</small>}
            </button>
          ))}
          {!loading && !error && !suggestions.length && query.trim().length >= 2 && query.trim() !== selectedName.current && <div className="suggestion-message">No places found in the UK.</div>}
          {!loading && suggestions.some((place) => place.sourceMode === "demo") && <div className="suggestion-footnote">Demo locations · add a Mapbox key for live search.</div>}
        </div>
      )}
    </div>
  );
}
