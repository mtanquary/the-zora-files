"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSONSource, Map as MlMap, StyleSpecification } from "maplibre-gl";
import type { StayWithAvailability } from "@/lib/stays/types";
import { KIND_MARKS, SUMMARY_STYLE } from "./display";

/**
 * MapLibre map of lookouts, cabins, and guard stations. Clusters when zoomed
 * out; clusters turn green when anything inside is open. Fill color is
 * availability; the pin's ring says what kind of place it is (see
 * KIND_MARKS). Basemaps are OpenStreetMap-derived and need no key: CARTO
 * Voyager (default) and OpenTopoMap.
 */

type BasemapId = "voyager" | "topo";

const VOYAGER = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const CARTO_GLYPHS = "https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf";

const TOPO: StyleSpecification = {
  version: 8,
  glyphs: CARTO_GLYPHS,
  sources: {
    topo: {
      type: "raster",
      tiles: [
        "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
        "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
        "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      maxzoom: 17,
      attribution:
        'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Style © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    },
  },
  layers: [{ id: "topo", type: "raster", source: "topo" }],
};

const US_CENTER: [number, number] = [-110.5, 44.5];

/** Off the lower-48 frame: included on the map, left out of the first fit. */
const FAR_STATES = new Set(["AK", "HI", "PR", "VI", "GU"]);


function toGeoJSON(sites: StayWithAvailability[]) {
  return {
    type: "FeatureCollection" as const,
    features: sites.map((s) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] },
      properties: {
        id: s.id,
        name: s.name,
        kind: s.kind,
        summary: s.availability.summary,
        open: s.availability.summary === "available" || s.availability.summary === "partial" ? 1 : 0,
      },
    })),
  };
}

const colorMatch = [
  "match",
  ["get", "summary"],
  ...Object.entries(SUMMARY_STYLE).flatMap(([k, v]) => [k, v.color]),
  "#B8ADB2",
];

export function LookoutMap({
  sites,
  selectedId,
  onSelect,
}: {
  sites: StayWithAvailability[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const sitesRef = useRef(sites);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const [basemap, setBasemap] = useState<BasemapId>("voyager");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sitesRef.current = sites;
    selectedRef.current = selectedId;
    onSelectRef.current = onSelect;
  });

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let map: MlMap | null = null;
    (async () => {
      try {
        const mod = await import("maplibre-gl");
        const maplibregl = (mod.default ?? mod) as typeof import("maplibre-gl");
        if (cancelled || !containerRef.current) return;
        map = new maplibregl.Map({
          container: containerRef.current,
          style: VOYAGER,
          center: US_CENTER,
          zoom: 3.4,
          minZoom: 2,
          cooperativeGestures: false,
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new maplibregl.ScaleControl({ unit: "imperial" }), "bottom-left");
        const ro = new ResizeObserver(() => map?.resize());
        ro.observe(containerRef.current);
        map.on("remove", () => ro.disconnect());

        const install = () => {
          const m = mapRef.current;
          if (!m || m.getSource("lookouts")) return;
          m.addSource("lookouts", {
            type: "geojson",
            data: toGeoJSON(sitesRef.current),
            cluster: true,
            clusterRadius: 42,
            clusterMaxZoom: 8,
            clusterProperties: { open: ["+", ["get", "open"]] },
          });
          m.addLayer({
            id: "clusters",
            type: "circle",
            source: "lookouts",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": ["case", [">", ["get", "open"], 0], "#2E7D4F", "#1D2342"],
              "circle-radius": ["step", ["get", "point_count"], 15, 6, 19, 15, 24],
              "circle-stroke-color": "#F2EBDD",
              "circle-stroke-width": 2.5,
            },
          });
          m.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "lookouts",
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["Open Sans Bold"],
              "text-size": 12,
              "text-allow-overlap": true,
            },
            paint: { "text-color": "#F2EBDD" },
          });
          m.addLayer({
            id: "selected-halo",
            type: "circle",
            source: "lookouts",
            filter: ["==", ["get", "id"], selectedRef.current ?? ""],
            paint: { "circle-radius": 15, "circle-color": "rgba(242,169,59,0.35)", "circle-stroke-color": "#F2A93B", "circle-stroke-width": 2 },
          });
          m.addLayer({
            id: "points",
            type: "circle",
            source: "lookouts",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": colorMatch as never,
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 6, 9, 9],
              "circle-stroke-color": [
                "match",
                ["get", "kind"],
                ...Object.entries(KIND_MARKS).flatMap(([k, v]) => [k, v.stroke]),
                "#F2EBDD",
              ] as never,
              "circle-stroke-width": ["match", ["get", "kind"], "guard_station", 2.5, 2],
            },
          });
          m.addLayer({
            id: "point-dots",
            type: "circle",
            source: "lookouts",
            filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "kind"], "cabin"]],
            paint: {
              "circle-color": KIND_MARKS.cabin.dot!,
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 1.8, 9, 3],
            },
          });
          m.addLayer({
            id: "point-labels",
            type: "symbol",
            source: "lookouts",
            filter: ["!", ["has", "point_count"]],
            minzoom: 7,
            layout: {
              "text-field": ["get", "name"],
              "text-font": ["Open Sans Bold"],
              "text-size": 11,
              "text-offset": [0, 1.3],
              "text-anchor": "top",
              "text-optional": true,
            },
            paint: { "text-color": "#1D2342", "text-halo-color": "#F2EBDD", "text-halo-width": 1.5 },
          });
        };

        map.on("style.load", install);
        // Frame the pins once, on first load. Alaska, Hawaii, and the
        // territories stay on the map but would zoom the frame out to the
        // whole Pacific, so they're left out of the fit unless they're all
        // there is.
        map.once("load", () => {
          const all = sitesRef.current;
          const near = all.filter((p) => !FAR_STATES.has(p.state));
          const pts = near.length ? near : all;
          if (!map || pts.length === 0) return;
          const lngs = pts.map((p) => p.lng);
          const lats = pts.map((p) => p.lat);
          map.fitBounds(
            [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ],
            { padding: 40, duration: 0, maxZoom: 7 }
          );
        });
        map.on("error", (e) => {
          const msg = (e as { error?: Error }).error?.message;
          if (msg && /style|glyph/i.test(msg)) setError(msg);
        });

        map.on("click", "clusters", async (e) => {
          const m = mapRef.current;
          const f = e.features?.[0];
          if (!m || !f) return;
          const src = m.getSource("lookouts") as GeoJSONSource;
          const zoom = await src.getClusterExpansionZoom(f.properties?.cluster_id);
          m.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
        });
        map.on("click", "points", (e) => {
          const id = e.features?.[0]?.properties?.id as string | undefined;
          if (id) onSelectRef.current(id);
        });
        for (const layer of ["clusters", "points"]) {
          map.on("mouseenter", layer, () => (map!.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", layer, () => (map!.getCanvas().style.cursor = ""));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // Push data changes into the source.
  useEffect(() => {
    const src = mapRef.current?.getSource("lookouts") as GeoJSONSource | undefined;
    src?.setData(toGeoJSON(sites));
  }, [sites]);

  // Highlight + fly to the selected lookout.
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !m.getLayer("selected-halo")) return;
    m.setFilter("selected-halo", ["==", ["get", "id"], selectedId ?? ""]);
    const s = sitesRef.current.find((x) => x.id === selectedId);
    if (s) m.easeTo({ center: [s.lng, s.lat], zoom: Math.max(m.getZoom(), 8), duration: 700 });
  }, [selectedId]);

  // Basemap swap. diff: false forces a full style rebuild, which fires
  // style.load and re-installs our pin layers. With MapLibre's default diff,
  // switching styles silently drops our sources and layers and style.load
  // never fires, so the pins vanished for good after picking Topo.
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    m.setStyle(basemap === "topo" ? TOPO : VOYAGER, { diff: false });
  }, [basemap]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0">
        {/* maplibre CSS forces position:relative on its container, so it fills a positioned wrapper */}
        <div ref={containerRef} className="h-full w-full" />
      </div>
      <div className="absolute left-3 top-3 z-10 flex overflow-hidden rounded-sm border-2 border-ink bg-bone font-park-sans text-xs font-semibold shadow">
        {(["voyager", "topo"] as const).map((b) => (
          <button
            key={b}
            onClick={() => setBasemap(b)}
            className={`px-3 py-1.5 transition-colors ${
              basemap === b ? "bg-blue-hour text-bone" : "text-park-ink-soft hover:text-park-forest"
            }`}
          >
            {b === "voyager" ? "Map" : "Topo"}
          </button>
        ))}
      </div>
      {error && (
        <div className="absolute inset-x-3 bottom-10 z-10 rounded-sm bg-park-bark-deep/90 px-3 py-2 font-park-sans text-xs text-park-paper">
          Map trouble: {error}
        </div>
      )}
    </div>
  );
}
