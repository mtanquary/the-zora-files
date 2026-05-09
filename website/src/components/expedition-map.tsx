"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapExpedition } from "@/lib/queries";

// Basemap options. Dark is a maplibre-native vector style (no API key).
// Streets / Satellite / Outdoors come from Mapbox raster tiles using the
// site's NEXT_PUBLIC_MAPBOX_TOKEN. Topo is OpenTopoMap (free, no key).

type BasemapId = "dark" | "satellite" | "streets" | "outdoors" | "topo";

interface BasemapDef {
  id: BasemapId;
  label: string;
  needsToken: boolean;
}

const BASEMAPS: BasemapDef[] = [
  { id: "dark", label: "Dark", needsToken: false },
  { id: "satellite", label: "Satellite", needsToken: true },
  { id: "streets", label: "Streets", needsToken: true },
  { id: "outdoors", label: "Outdoors", needsToken: true },
  { id: "topo", label: "Topo", needsToken: false },
];

const CARTO_DARK_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

interface MaplibreStyleSpec {
  version: 8;
  glyphs?: string;
  sources: Record<string, unknown>;
  layers: Array<Record<string, unknown>>;
}

function rasterStyle(
  tileUrls: string[],
  attribution: string,
  glyphs?: string,
  maxzoom?: number
): MaplibreStyleSpec {
  return {
    version: 8,
    ...(glyphs ? { glyphs } : {}),
    sources: {
      basemap: {
        type: "raster",
        tiles: tileUrls,
        tileSize: 256,
        attribution,
        ...(maxzoom != null ? { maxzoom } : {}),
      },
    },
    layers: [{ id: "basemap", type: "raster", source: "basemap" }],
  };
}

function getBasemapStyle(
  id: BasemapId,
  token: string | null
): string | MaplibreStyleSpec {
  switch (id) {
    case "dark":
      return CARTO_DARK_STYLE_URL;
    case "satellite":
      if (!token) return CARTO_DARK_STYLE_URL;
      return rasterStyle(
        [
          `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${token}`,
        ],
        "© Mapbox © OpenStreetMap © Maxar",
        `https://api.mapbox.com/fonts/v1/mapbox/{fontstack}/{range}.pbf?access_token=${token}`
      );
    case "streets":
      if (!token) return CARTO_DARK_STYLE_URL;
      return rasterStyle(
        [
          `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${token}`,
        ],
        "© Mapbox © OpenStreetMap",
        `https://api.mapbox.com/fonts/v1/mapbox/{fontstack}/{range}.pbf?access_token=${token}`
      );
    case "outdoors":
      if (!token) return CARTO_DARK_STYLE_URL;
      return rasterStyle(
        [
          `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${token}`,
        ],
        "© Mapbox © OpenStreetMap",
        `https://api.mapbox.com/fonts/v1/mapbox/{fontstack}/{range}.pbf?access_token=${token}`
      );
    case "topo":
      // OpenTopoMap (CC-BY-SA). No API key required. Limited to z≤17.
      // Glyphs aren't provided here; we substitute a glyphless cluster style
      // (no count text) when this basemap is active.
      return rasterStyle(
        [
          "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
          "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
          "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
        ],
        "Map data © OpenStreetMap contributors, SRTM | Map style © OpenTopoMap (CC-BY-SA)",
        undefined,
        17
      );
  }
}

type DiscoveryType = "wildlife" | "plant" | "geographic" | "cultural_historical";

const TYPE_LABELS: Record<DiscoveryType, string> = {
  wildlife: "wildlife",
  plant: "plants",
  geographic: "geographic",
  cultural_historical: "cultural & historical",
};

const TYPE_COLORS: Record<DiscoveryType, string> = {
  wildlife: "#7A5FB8",
  plant: "#1D9E75",
  geographic: "#F0A500",
  cultural_historical: "#E8520A",
};

const ALL_TYPES: DiscoveryType[] = ["wildlife", "plant", "geographic", "cultural_historical"];

const ARIZONA_CENTER: [number, number] = [-111.6, 34.2];

interface DiscoveryMeta {
  name: string;
  type: DiscoveryType;
  episodeIds: Set<string>;
  totalSightings: number;
}

export interface ExpeditionMapProps {
  expeditions: MapExpedition[];
  token: string | null;
  compact?: boolean;
  height?: string;
}

export function ExpeditionMap({
  expeditions,
  token,
  compact = false,
  height,
}: ExpeditionMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const popupRef = useRef<unknown>(null);
  const mapboxRef = useRef<unknown>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeBasemap, setActiveBasemap] = useState<BasemapId>("dark");
  // Stable ref to the latest filtered list so the install function (which
  // is bound to map events) always reads the current data without React
  // state-update timing issues.
  const filteredRef = useRef<MapExpedition[]>([]);

  const [activeTypes, setActiveTypes] = useState<Set<DiscoveryType>>(
    new Set(ALL_TYPES)
  );
  const [focusDiscovery, setFocusDiscovery] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // Build the master discovery index (name → metadata across episodes).
  const discoveryIndex = useMemo(() => {
    const map = new Map<string, DiscoveryMeta>();
    for (const ep of expeditions) {
      for (const d of ep.discoveries) {
        const key = d.name.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.episodeIds.add(ep.id);
          existing.totalSightings += 1;
        } else {
          map.set(key, {
            name: d.name,
            type: d.type as DiscoveryType,
            episodeIds: new Set([ep.id]),
            totalSightings: 1,
          });
        }
      }
    }
    return map;
  }, [expeditions]);

  const sortedDiscoveries = useMemo(() => {
    return Array.from(discoveryIndex.values()).sort(
      (a, b) =>
        b.episodeIds.size - a.episodeIds.size ||
        a.name.localeCompare(b.name)
    );
  }, [discoveryIndex]);

  const typeCounts = useMemo(() => {
    const counts: Record<DiscoveryType, number> = {
      wildlife: 0,
      plant: 0,
      geographic: 0,
      cultural_historical: 0,
    };
    for (const meta of discoveryIndex.values()) {
      counts[meta.type] += 1;
    }
    return counts;
  }, [discoveryIndex]);

  const filteredExpeditions = useMemo(() => {
    return expeditions.filter((ep) => {
      // Focus discovery wins: only show expeditions that match.
      if (focusDiscovery) {
        const meta = discoveryIndex.get(focusDiscovery.toLowerCase());
        return meta ? meta.episodeIds.has(ep.id) : false;
      }
      // Type filter — only narrow if some types are unchecked.
      if (activeTypes.size === ALL_TYPES.length) return true;
      // Expeditions with no discoveries always visible.
      if (ep.discoveries.length === 0) return true;
      return ep.discoveries.some((d) =>
        activeTypes.has(d.type as DiscoveryType)
      );
    });
  }, [expeditions, focusDiscovery, activeTypes, discoveryIndex]);

  const filteredDiscoveryList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedDiscoveries.filter((d) => {
      if (!activeTypes.has(d.type)) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q);
    });
  }, [sortedDiscoveries, search, activeTypes]);

  // Keep the install function's view of "what to draw" current.
  filteredRef.current = filteredExpeditions;

  // Init map once.
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    let mapInstance: { remove: () => void } | null = null;

    (async () => {
      try {
        const mod = await import("maplibre-gl");
        if (cancelled || !containerRef.current) return;
        const maplibregl = (mod.default ?? mod) as typeof mod.default;
        if (!maplibregl || typeof maplibregl.Map !== "function") {
          throw new Error("maplibre-gl module did not load correctly");
        }
        mapboxRef.current = maplibregl;

        if (
          containerRef.current.clientWidth === 0 ||
          containerRef.current.clientHeight === 0
        ) {
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve())
          );
          if (cancelled || !containerRef.current) return;
        }

        const center: [number, number] =
          expeditions.length > 0
            ? [expeditions[0].coordinates.lng, expeditions[0].coordinates.lat]
            : ARIZONA_CENTER;

        const initialStyle = getBasemapStyle("dark", token);
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: initialStyle as string,
          center,
          zoom: expeditions.length > 0 ? 5 : 5.5,
          attributionControl: compact ? false : undefined,
          cooperativeGestures: compact,
        });
        mapInstance = map as unknown as { remove: () => void };
        mapRef.current = map;

        // Force a resize after layout settles — guards against the canvas
        // measuring 0 when the parent is initially hidden / animated in.
        const resizeObs = new ResizeObserver(() => {
          (map as unknown as { resize: () => void }).resize();
        });
        resizeObs.observe(containerRef.current);
        const stopObs = () => resizeObs.disconnect();
        map.on("remove", stopObs);

        if (!compact) {
          map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
          map.addControl(new maplibregl.FullscreenControl(), "top-right");
        }

        // Surface map runtime errors (style/sprite/tile fetch failures, etc.)
        map.on("error", (e: { error?: { message?: string; status?: number } }) => {
          const msg = e?.error?.message || "map runtime error";
          const status = e?.error?.status;
          console.error("[map] error", e?.error);
          if (status === 401 || status === 403) {
            setMapError((prev) => prev ?? `${msg} (${status})`);
          }
        });

        // Re-installs custom sources / layers after every style swap, then
        // immediately fills them with the current expedition data. Doing it
        // inline (rather than via a React state bump) avoids any timing
        // window where the new style is loaded but our data hasn't caught up.
        function installCustomLayers() {
          if (cancelled) return;
          if (!(map as { isStyleLoaded: () => boolean }).isStyleLoaded()) return;

          // Tracks first so pins draw on top.
          if (!map.getSource("tracks")) {
            map.addSource("tracks", {
              type: "geojson",
              data: { type: "FeatureCollection", features: [] },
            });
            map.addLayer({
              id: "expedition-track-glow",
              type: "line",
              source: "tracks",
              layout: { "line-cap": "round", "line-join": "round" },
              paint: {
                "line-color": "#F0A500",
                "line-width": 6,
                "line-blur": 4,
                "line-opacity": 0.35,
              },
            });
            map.addLayer({
              id: "expedition-track",
              type: "line",
              source: "tracks",
              layout: { "line-cap": "round", "line-join": "round" },
              paint: {
                "line-color": "#FFD166",
                "line-width": 2.5,
                "line-opacity": 0.9,
              },
            });
          }

          if (!map.getSource("expeditions")) {
            map.addSource("expeditions", {
              type: "geojson",
              data: { type: "FeatureCollection", features: [] },
              cluster: true,
              clusterMaxZoom: 11,
              clusterRadius: 50,
            });

            map.addLayer({
              id: "clusters",
              type: "circle",
              source: "expeditions",
              filter: ["has", "point_count"],
              paint: {
                "circle-color": [
                  "step",
                  ["get", "point_count"],
                  "rgba(240,165,0,0.55)",
                  5, "rgba(240,165,0,0.7)",
                  15, "rgba(240,165,0,0.85)",
                ],
                "circle-radius": [
                  "step",
                  ["get", "point_count"],
                  18,
                  5, 24,
                  15, 32,
                ],
                "circle-stroke-color": "#FFD166",
                "circle-stroke-width": 2,
                "circle-stroke-opacity": 0.7,
              },
            });

            // Only add cluster-count text if the active style provides
            // glyphs. OpenTopoMap doesn't, and a text layer without glyphs
            // throws errors and renders nothing.
            const styleHasGlyphs = !!(map as {
              getStyle: () => { glyphs?: string };
            })
              .getStyle()
              .glyphs;
            if (styleHasGlyphs) {
              map.addLayer({
                id: "cluster-count",
                type: "symbol",
                source: "expeditions",
                filter: ["has", "point_count"],
                layout: {
                  "text-field": ["get", "point_count_abbreviated"],
                  "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                  "text-size": 13,
                },
                paint: { "text-color": "#0D0F14" },
              });
            }

            map.addLayer({
              id: "expedition-halo",
              type: "circle",
              source: "expeditions",
              filter: ["!", ["has", "point_count"]],
              paint: {
                "circle-color": "rgba(240,165,0,0.18)",
                "circle-radius": 14,
                "circle-blur": 0.6,
              },
            });

            map.addLayer({
              id: "expedition-point",
              type: "circle",
              source: "expeditions",
              filter: ["!", ["has", "point_count"]],
              paint: {
                "circle-color": "#F0A500",
                "circle-radius": 7,
                "circle-stroke-color": "#FFD166",
                "circle-stroke-width": 2,
              },
            });
          }

          // Fill (or refill) the sources from the latest filtered list.
          syncSourcesFromRef();
        }

        // Pulls features from filteredRef.current and pushes them to the
        // sources. Used both during install and on filter changes (via the
        // data-sync effect, which calls into this same logic by re-running
        // filteredRef updates and triggering a setData below).
        function syncSourcesFromRef() {
          const list = filteredRef.current;
          const features = list.map((ep) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [ep.coordinates.lng, ep.coordinates.lat],
            },
            properties: {
              id: ep.id,
              slug: ep.slug,
              season: ep.season,
              episode_number: ep.episode_number,
              title: ep.title,
              location_name: ep.location_name,
              country: ep.country,
              region: ep.region ?? "",
              shoot_date: ep.shoot_date,
              eos_total: ep.eos_total,
              zora_total: ep.zora_total,
              effort_label: ep.effort_label,
              effort_points: ep.effort_points,
              discovery_points: ep.discovery_points,
              discovery_count: ep.discoveries.length,
              thumbnail_url: ep.thumbnail_url ?? "",
              distance_miles: ep.distance_miles ?? 0,
              elevation_gain_ft: ep.elevation_gain_ft ?? 0,
              discoveries_json: JSON.stringify(
                ep.discoveries.map((d) => ({
                  n: d.name,
                  t: d.type,
                  r: d.rarity_tier,
                  p: d.points,
                }))
              ),
            },
          }));
          const expSrc = map.getSource("expeditions") as
            | { setData: (d: unknown) => void }
            | undefined;
          if (expSrc) expSrc.setData({ type: "FeatureCollection", features });

          const trackFeatures = list
            .filter((ep) => ep.track_geojson && ep.track_geojson.coordinates.length >= 2)
            .map((ep) => ({
              type: "Feature" as const,
              geometry: ep.track_geojson!,
              properties: { id: ep.id, slug: ep.slug, title: ep.title },
            }));
          const trackSrc = map.getSource("tracks") as
            | { setData: (d: unknown) => void }
            | undefined;
          if (trackSrc)
            trackSrc.setData({ type: "FeatureCollection", features: trackFeatures });
        }

        // Expose helpers on the map so other effects (data sync, basemap
        // change safety net) can invoke them without sharing closures.
        (
          map as unknown as {
            __syncSources: () => void;
            __installLayers: () => void;
          }
        ).__syncSources = syncSourcesFromRef;
        (
          map as unknown as {
            __syncSources: () => void;
            __installLayers: () => void;
          }
        ).__installLayers = installCustomLayers;

        // Click + hover handlers — bound once here on the map instance.
        // setStyle wipes layers but these layer-scoped handlers re-attach
        // automatically when a layer with the same id reappears.
        map.on("click", "clusters", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["clusters"],
          });
          const clusterId = features[0]?.properties?.cluster_id;
          const source = map.getSource("expeditions") as unknown as {
            getClusterExpansionZoom: (id: number) => Promise<number>;
          };
          if (clusterId == null || !source) return;
          source
            .getClusterExpansionZoom(clusterId)
            .then((zoom) => {
              const geom = features[0].geometry as {
                type: string;
                coordinates: [number, number];
              };
              if (geom.type !== "Point") return;
              map.easeTo({ center: geom.coordinates, zoom });
            })
            .catch(() => {});
        });

        map.on("click", "expedition-point", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const props = f.properties as Record<string, string> | null;
          if (!props) return;
          const geom = f.geometry as {
            type: string;
            coordinates: [number, number];
          };
          if (geom.type !== "Point") return;

          if (popupRef.current) {
            (popupRef.current as { remove: () => void }).remove();
          }
          const popup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: "320px",
            offset: 14,
            className: "zora-popup",
          })
            .setLngLat(geom.coordinates)
            .setHTML(buildPopupHtml(props, compact))
            .addTo(map);
          popupRef.current = popup;
        });

        for (const layer of ["clusters", "expedition-point"]) {
          map.on("mouseenter", layer, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layer, () => {
            map.getCanvas().style.cursor = "";
          });
        }

        // Initial install + re-install after every style swap.
        map.on("load", () => {
          installCustomLayers();
          setMapReady(true);
        });
        map.on("style.load", installCustomLayers);
      } catch (err) {
        console.error("Map init failed", err);
        setMapError(
          err instanceof Error ? err.message : "Failed to load map."
        );
      }
    })();

    return () => {
      cancelled = true;
      if (mapInstance) mapInstance.remove();
      mapRef.current = null;
      mapboxRef.current = null;
      popupRef.current = null;
    };
  }, [compact, expeditions, token]);

  // Apply basemap changes after the map has mounted. setStyle wipes our
  // custom layers; the install function (bound to style.load + once('idle'))
  // re-creates them and refills data from filteredRef.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current as {
      setStyle: (style: string | MaplibreStyleSpec, opts?: { diff?: boolean }) => void;
      once: (event: string, cb: () => void) => void;
    };
    const style = getBasemapStyle(activeBasemap, token);
    map.setStyle(style, { diff: false });

    // Safety net: if the style.load handler didn't re-install the layers
    // for any reason, the idle event will fire once the new style and tiles
    // are fully loaded — we re-install (idempotently) from there.
    map.once("idle", () => {
      const helpers = mapRef.current as unknown as {
        __installLayers?: () => void;
      };
      helpers.__installLayers?.();
    });
  }, [activeBasemap, token, mapReady]);

  // Push filter changes through to the existing sources via the install-time
  // helper stashed on the map instance. The ref was already updated above.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const sync = (mapRef.current as unknown as { __syncSources?: () => void })
      .__syncSources;
    sync?.();
  }, [filteredExpeditions, mapReady]);

  // Auto-fit bounds once on initial mount.
  const didFitRef = useRef(false);
  useEffect(() => {
    if (!mapReady || didFitRef.current || !mapRef.current || !mapboxRef.current) return;
    if (expeditions.length === 0) {
      didFitRef.current = true;
      return;
    }

    const map = mapRef.current as {
      fitBounds: (bounds: unknown, opts: unknown) => void;
      flyTo: (opts: unknown) => void;
    };
    const maplibregl = mapboxRef.current as {
      LngLatBounds: new () => {
        extend: (c: [number, number]) => void;
        isEmpty: () => boolean;
      };
    };

    const bounds = new maplibregl.LngLatBounds();
    for (const ep of expeditions) {
      bounds.extend([ep.coordinates.lng, ep.coordinates.lat]);
    }
    if (!bounds.isEmpty()) {
      if (expeditions.length === 1) {
        map.flyTo({
          center: [expeditions[0].coordinates.lng, expeditions[0].coordinates.lat],
          zoom: 9,
          duration: 0,
        });
      } else {
        map.fitBounds(bounds, {
          padding: compact ? 30 : 80,
          maxZoom: 9,
          duration: 0,
        });
      }
    }
    didFitRef.current = true;
  }, [mapReady, expeditions, compact]);

  // Delegated click handler for popup discovery chips and "view episode" / focus links.
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const focusEl = target.closest("[data-focus-discovery]") as HTMLElement | null;
      if (focusEl) {
        const name = focusEl.getAttribute("data-focus-discovery");
        if (name) {
          e.preventDefault();
          setFocusDiscovery(name);
          setSearch("");
        }
      }
    }
    el.addEventListener("click", handleClick);
    return () => el.removeEventListener("click", handleClick);
  }, []);

  function toggleType(t: DiscoveryType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      // Clear focus discovery if its type was just turned off.
      if (focusDiscovery) {
        const meta = discoveryIndex.get(focusDiscovery.toLowerCase());
        if (meta && !next.has(meta.type)) {
          setFocusDiscovery(null);
        }
      }
      return next;
    });
  }

  const totalCount = expeditions.length;
  const shownCount = filteredExpeditions.length;

  if (compact) {
    return (
      <div className="relative rounded-md overflow-hidden border border-rule">
        {mapError && <MapError message={mapError} />}
        <div
          ref={containerRef}
          style={{ width: "100%", height: height ?? "260px" }}
        />
        <div className="pointer-events-none absolute bottom-2 left-2 z-10 px-2 py-1 rounded bg-pre-dawn/80 backdrop-blur-sm border border-rule">
          <p className="font-mono text-[0.55rem] tracking-wider uppercase text-zora-amber">
            {totalCount} expedition{totalCount !== 1 ? "s" : ""} pinned
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Mobile filter toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className="w-full bg-pre-dawn-mid border border-rule rounded-md px-4 py-2 font-mono text-xs tracking-wider uppercase text-zora-amber hover:bg-zora-amber/10 transition-colors"
        >
          {filterOpen ? "hide filters" : "filters"} ·{" "}
          <span className="text-mist-dim">
            {shownCount}/{totalCount} shown
          </span>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${filterOpen ? "block" : "hidden"} md:block w-full md:w-72 flex-shrink-0`}
      >
        <div className="bg-pre-dawn-mid border border-rule rounded-md p-4 space-y-5">
          <div>
            <p className="font-display text-xs tracking-[0.18em] uppercase text-zora-amber mb-1">
              showing
            </p>
            <p className="font-mono text-[0.7rem] text-mist-dim">
              {shownCount} of {totalCount} expedition{totalCount !== 1 ? "s" : ""}
            </p>
            {focusDiscovery && (
              <button
                onClick={() => setFocusDiscovery(null)}
                className="mt-2 inline-flex items-center gap-1 text-[0.6rem] font-mono uppercase tracking-wider text-amber-light hover:text-zora-amber border border-amber-light/30 hover:border-zora-amber/50 px-2 py-1 rounded transition-colors"
              >
                <span>focused: {focusDiscovery}</span>
                <span aria-hidden>×</span>
              </button>
            )}
          </div>

          <div>
            <p className="font-display text-[0.6rem] tracking-[0.18em] uppercase text-mist-dim mb-2">
              discovery types
            </p>
            <ul className="space-y-1.5">
              {ALL_TYPES.map((t) => {
                const checked = activeTypes.has(t);
                return (
                  <li key={t}>
                    <label className="flex items-center gap-2 cursor-pointer text-xs hover:text-amber-light">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleType(t)}
                        className="accent-zora-amber w-3.5 h-3.5"
                      />
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: TYPE_COLORS[t] }}
                      />
                      <span className={checked ? "text-dawn-mist" : "text-mist-dim/60"}>
                        {TYPE_LABELS[t]}
                      </span>
                      <span className="ml-auto font-mono text-[0.6rem] text-mist-dim/50">
                        {typeCounts[t]}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="font-display text-[0.6rem] tracking-[0.18em] uppercase text-mist-dim mb-2">
              find a discovery
            </p>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="saguaro, owl, slot canyon…"
              className="w-full bg-pre-dawn border border-rule rounded px-3 py-1.5 text-xs text-dawn-mist placeholder:text-mist-dim/40 focus:outline-none focus:border-zora-amber/60"
            />

            {filteredDiscoveryList.length > 0 ? (
              <ul className="mt-2 max-h-72 overflow-y-auto space-y-1 pr-1">
                {filteredDiscoveryList.slice(0, 80).map((d) => {
                  const isActive = focusDiscovery === d.name;
                  return (
                    <li key={d.name}>
                      <button
                        onClick={() =>
                          setFocusDiscovery(isActive ? null : d.name)
                        }
                        className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
                          isActive
                            ? "bg-zora-amber/15 text-amber-light"
                            : "hover:bg-pre-dawn-light text-dawn-mist"
                        }`}
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full"
                          style={{ background: TYPE_COLORS[d.type] }}
                        />
                        <span className="truncate">{d.name}</span>
                        <span className="ml-auto font-mono text-[0.55rem] text-mist-dim/60">
                          {d.episodeIds.size}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-[0.7rem] text-mist-dim/60">
                {sortedDiscoveries.length === 0
                  ? "No discoveries logged yet."
                  : "No matches."}
              </p>
            )}
            {filteredDiscoveryList.length > 80 && (
              <p className="mt-1 font-mono text-[0.55rem] text-mist-dim/40">
                showing 80 of {filteredDiscoveryList.length} — refine search
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Map */}
      <div className="flex-1 min-w-0">
        <div className="relative rounded-md overflow-hidden border border-rule">
          {mapError && <MapError message={mapError} />}
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: height ?? "70vh",
              minHeight: "480px",
            }}
          />
          <BasemapSwitcher
            active={activeBasemap}
            onChange={setActiveBasemap}
            hasToken={!!token}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.65rem] font-mono uppercase tracking-wider text-mist-dim">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zora-amber border border-amber-light" />
            expedition
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-zora-amber/70 border border-amber-light/70 flex items-center justify-center text-[0.5rem] text-pre-dawn">
              n
            </span>
            cluster (zoom in)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-amber-light" />
            track
          </span>
          <span className="opacity-50">click a pin for the expedition record</span>
        </div>
      </div>

      <PopupStyles />
    </div>
  );
}

function BasemapSwitcher({
  active,
  onChange,
  hasToken,
}: {
  active: BasemapId;
  onChange: (id: BasemapId) => void;
  hasToken: boolean;
}) {
  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-0.5 rounded-md bg-pre-dawn/85 backdrop-blur-sm border border-rule p-1 shadow-lg shadow-black/30">
      {BASEMAPS.map((b) => {
        const disabled = b.needsToken && !hasToken;
        const isActive = active === b.id;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => !disabled && onChange(b.id)}
            disabled={disabled}
            title={
              disabled ? "Requires NEXT_PUBLIC_MAPBOX_TOKEN" : `Switch to ${b.label}`
            }
            className={`px-2.5 py-1 rounded text-[0.6rem] font-mono uppercase tracking-wider transition-colors text-left ${
              isActive
                ? "bg-zora-amber/15 text-zora-amber"
                : disabled
                  ? "text-mist-dim/30 cursor-not-allowed"
                  : "text-mist-dim hover:text-amber-light hover:bg-zora-amber/10"
            }`}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
}

function MapError({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <p className="font-display text-zora-amber text-sm mb-2">
          map unavailable
        </p>
        <p className="text-mist-dim text-xs">{message}</p>
      </div>
    </div>
  );
}

function buildPopupHtml(
  props: Record<string, string>,
  compact: boolean
): string {
  const slug = String(props.slug);
  const title = escapeHtml(String(props.title));
  const location = escapeHtml(String(props.location_name));
  const region = props.region ? escapeHtml(String(props.region)) : "";
  const country = escapeHtml(String(props.country ?? ""));
  const date = formatDate(String(props.shoot_date));
  const eos = props.eos_total;
  const zora = props.zora_total;
  const effort = escapeHtml(String(props.effort_label));
  const thumb = String(props.thumbnail_url);
  const distance = Number(props.distance_miles);
  const elevation = Number(props.elevation_gain_ft);
  const seasonNum = String(props.season).padStart(2, "0");
  const epNum = String(props.episode_number).padStart(2, "0");

  let discoveries: Array<{ n: string; t: string; r: string; p: number }> = [];
  try {
    discoveries = JSON.parse(String(props.discoveries_json ?? "[]"));
  } catch {
    discoveries = [];
  }

  const placeBits = [location, region, country].filter(Boolean).join(" · ");

  const photoHtml = thumb
    ? `<a href="/finding-zora/episodes/${slug}" class="zp-photo">
         <img src="${escapeHtml(thumb)}" alt="Sunrise at ${location}" loading="lazy" />
       </a>`
    : "";

  const statsHtml = `
    <div class="zp-stats">
      <div><span class="zp-lbl">eos</span><span class="zp-val zp-teal">${eos}</span></div>
      <div><span class="zp-lbl">effort</span><span class="zp-val zp-orange">${effort}</span></div>
      <div><span class="zp-lbl">zora</span><span class="zp-val zp-amber">${zora}</span></div>
    </div>`;

  const contextBits: string[] = [];
  if (distance > 0) contextBits.push(`${distance.toFixed(1)} mi`);
  if (elevation > 0) contextBits.push(`+${Math.round(elevation)} ft`);
  const contextHtml = contextBits.length
    ? `<p class="zp-context">${contextBits.join(" · ")}</p>`
    : "";

  let discoveriesHtml = "";
  if (!compact && discoveries.length > 0) {
    const chips = discoveries
      .slice(0, 12)
      .map((d) => {
        const color = TYPE_COLORS[d.t as DiscoveryType] ?? "#F0A500";
        return `<button type="button" class="zp-chip" data-focus-discovery="${escapeHtml(
          d.n
        )}" style="--zp-c:${color}">${escapeHtml(d.n)}</button>`;
      })
      .join("");
    const more =
      discoveries.length > 12
        ? `<span class="zp-more">+${discoveries.length - 12} more</span>`
        : "";
    discoveriesHtml = `
      <div class="zp-discoveries">
        <p class="zp-section-lbl">discoveries</p>
        <div class="zp-chips">${chips}${more}</div>
      </div>`;
  }

  return `
    <div class="zp">
      ${photoHtml}
      <div class="zp-body">
        <p class="zp-eyebrow">S${seasonNum}E${epNum} · ${date}</p>
        <p class="zp-title">"${title}"</p>
        <p class="zp-place">${placeBits}</p>
        ${statsHtml}
        ${contextHtml}
        ${discoveriesHtml}
        <a class="zp-cta" href="/finding-zora/episodes/${slug}">view episode →</a>
      </div>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const POPUP_CSS = `
.maplibregl-canvas-container { outline: none; }
.maplibregl-ctrl-attrib,
.maplibregl-ctrl-bottom-right .maplibregl-ctrl-attrib {
  background: rgba(13, 15, 20, 0.6) !important;
  color: #8a9aae !important;
}
.maplibregl-ctrl-attrib a { color: #c8d4e0 !important; }
.maplibregl-ctrl-group {
  background: #141820 !important;
  border: 1px solid rgba(240, 165, 0, 0.22) !important;
}
.maplibregl-ctrl-group button { background-color: transparent !important; }
.maplibregl-ctrl-group button + button {
  border-top: 1px solid rgba(240, 165, 0, 0.22) !important;
}
.maplibregl-ctrl-group button .maplibregl-ctrl-icon {
  filter: invert(0.85) sepia(0.3) saturate(2) hue-rotate(-10deg) brightness(0.95);
}

.zora-popup .maplibregl-popup-content {
  background: #0d0f14 !important;
  border: 1px solid rgba(240, 165, 0, 0.35);
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.55);
  color: #c8d4e0;
  overflow: hidden;
}
.zora-popup .maplibregl-popup-tip { display: none; }
.zora-popup .maplibregl-popup-close-button {
  color: #8a9aae;
  font-size: 18px;
  right: 6px;
  top: 4px;
  z-index: 2;
}
.zora-popup .maplibregl-popup-close-button:hover { color: #f0a500; }

.zp { font-family: "Crimson Text", Georgia, serif; }
.zp-photo { display: block; }
.zp-photo img {
  width: 100%;
  height: 130px;
  object-fit: cover;
  display: block;
}
.zp-body { padding: 12px 14px 14px; }
.zp-eyebrow {
  font-family: "Space Mono", ui-monospace, monospace;
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8a9aae;
  margin: 0 0 4px;
}
.zp-title {
  font-family: "Cinzel", serif;
  font-size: 14px;
  color: #ffd166;
  margin: 0 0 2px;
  line-height: 1.25;
}
.zp-place {
  font-size: 11px;
  color: #8a9aae;
  margin: 0 0 10px;
  line-height: 1.4;
}
.zp-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}
.zp-stats > div {
  background: rgba(240, 165, 0, 0.06);
  border: 1px solid rgba(240, 165, 0, 0.18);
  border-radius: 4px;
  padding: 6px 4px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.zp-lbl {
  font-family: "Space Mono", ui-monospace, monospace;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #8a9aae;
}
.zp-val {
  font-family: "Space Mono", ui-monospace, monospace;
  font-size: 14px;
  font-weight: 700;
}
.zp-teal { color: #2cc48f; }
.zp-orange { color: #e8520a; font-size: 11px; }
.zp-amber { color: #f0a500; }
.zp-context {
  font-family: "Space Mono", ui-monospace, monospace;
  font-size: 10px;
  color: #8a9aae;
  margin: 0 0 8px;
}
.zp-section-lbl {
  font-family: "Space Mono", ui-monospace, monospace;
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #8a9aae;
  margin: 0 0 4px;
}
.zp-discoveries { margin-bottom: 10px; }
.zp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.zp-chip {
  font-family: "Space Mono", ui-monospace, monospace;
  font-size: 10px;
  color: #c8d4e0;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--zp-c, rgba(240, 165, 0, 0.4));
  border-radius: 999px;
  padding: 2px 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.zp-chip:hover {
  background: var(--zp-c, rgba(240, 165, 0, 0.2));
  color: #0d0f14;
}
.zp-more {
  font-family: "Space Mono", ui-monospace, monospace;
  font-size: 10px;
  color: #8a9aae;
  align-self: center;
}
.zp-cta {
  display: inline-block;
  font-family: "Space Mono", ui-monospace, monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #f0a500;
  text-decoration: none;
  border: 1px solid rgba(240, 165, 0, 0.4);
  padding: 5px 10px;
  border-radius: 3px;
  transition: all 0.15s;
}
.zp-cta:hover {
  background: rgba(240, 165, 0, 0.12);
  color: #ffd166;
}
`;

function PopupStyles() {
  return <style dangerouslySetInnerHTML={{ __html: POPUP_CSS }} />;
}

// Compact preview that links to the full map page.
export function MapPreviewLink({
  expeditions,
  token,
  href = "/finding-zora/map",
}: {
  expeditions: MapExpedition[];
  token: string | null;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="block group rounded-md overflow-hidden border border-rule hover:border-zora-amber/50 transition-colors"
    >
      <div className="relative">
        <ExpeditionMap
          expeditions={expeditions}
          token={token}
          compact
          height="240px"
        />
        <div className="absolute inset-0 pointer-events-none flex items-end justify-end p-3">
          <span className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-zora-amber bg-pre-dawn/85 backdrop-blur-sm border border-rule px-2.5 py-1 rounded group-hover:border-zora-amber/60 transition-colors">
            open full map →
          </span>
        </div>
      </div>
    </Link>
  );
}
