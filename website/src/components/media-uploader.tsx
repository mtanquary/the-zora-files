"use client";

import { useState, useCallback } from "react";

export interface PendingMedia {
  id: string; // local id for keying
  file: File;
  kind: "photo" | "video";
  caption: string;
  previewUrl: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  uploadedUrl?: string;
  uploadedPath?: string;
  errorMessage?: string;
}

export interface ExistingMedia {
  id: string;
  kind: "photo" | "video";
  url: string;
  caption: string;
  sort_order: number;
  marked_for_deletion?: boolean;
}

interface Props {
  pending: PendingMedia[];
  existing: ExistingMedia[];
  onPendingChange: (next: PendingMedia[]) => void;
  onExistingChange: (next: ExistingMedia[]) => void;
}

export function MediaUploader({ pending, existing, onPendingChange, onExistingChange }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const startOrder = existing.length + pending.length;
      const next: PendingMedia[] = arr.map((file, i) => {
        const isVideo = file.type.startsWith("video/");
        return {
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          kind: isVideo ? "video" : "photo",
          caption: "",
          previewUrl: URL.createObjectURL(file),
          status: "pending",
        };
      });
      void startOrder;
      onPendingChange([...pending, ...next]);
    },
    [pending, existing.length, onPendingChange]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  };

  const updatePending = (id: string, patch: Partial<PendingMedia>) => {
    onPendingChange(pending.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removePending = (id: string) => {
    const target = pending.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onPendingChange(pending.filter((p) => p.id !== id));
  };

  const toggleDeleteExisting = (id: string) => {
    onExistingChange(
      existing.map((e) =>
        e.id === id ? { ...e, marked_for_deletion: !e.marked_for_deletion } : e
      )
    );
  };

  const updateExistingCaption = (id: string, caption: string) => {
    onExistingChange(existing.map((e) => (e.id === id ? { ...e, caption } : e)));
  };

  const totalCount = existing.filter((e) => !e.marked_for_deletion).length + pending.length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`block cursor-pointer rounded-xl border-2 border-dashed transition-colors p-8 text-center ${
          dragOver
            ? "border-zora-amber bg-zora-amber/5"
            : "border-dawn-mist/15 hover:border-zora-amber/30"
        }`}
      >
        <p className="text-sm text-dawn-mist/70">
          Drop photos and videos, or click to browse
        </p>
        <p className="text-xs text-dawn-mist/40 mt-1">
          {totalCount > 0
            ? `${totalCount} item${totalCount !== 1 ? "s" : ""} attached to this expedition`
            : "Anything beyond the hero sunrise photo — extra frames, drone clips, behind-the-scenes"}
        </p>
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={onPick}
          className="hidden"
        />
      </label>

      {/* Existing media (edit mode) */}
      {existing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-dawn-mist/40 uppercase tracking-wider">already saved</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {existing.map((m) => (
              <div
                key={m.id}
                className={`relative rounded-lg border p-2 ${
                  m.marked_for_deletion
                    ? "border-sunrise-orange/40 bg-sunrise-orange/5 opacity-50"
                    : "border-dawn-mist/10 bg-dawn-mist/5"
                }`}
              >
                {m.kind === "video" ? (
                  <video src={m.url} className="w-full h-32 object-cover rounded" muted />
                ) : (
                  <img src={m.url} alt={m.caption || "Media"} className="w-full h-32 object-cover rounded" />
                )}
                <input
                  type="text"
                  value={m.caption}
                  onChange={(e) => updateExistingCaption(m.id, e.target.value)}
                  placeholder="caption (optional)"
                  className="mt-2 w-full rounded border border-dawn-mist/10 bg-dawn-mist/5 px-2 py-1 text-xs text-dawn-mist placeholder:text-dawn-mist/20 focus:border-zora-amber/40 focus:outline-none"
                  disabled={m.marked_for_deletion}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="font-mono text-[0.6rem] text-dawn-mist/40 uppercase">
                    {m.kind}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleDeleteExisting(m.id)}
                    className={`text-[0.6rem] uppercase tracking-wider ${
                      m.marked_for_deletion
                        ? "text-eos-teal hover:text-eos-teal/80"
                        : "text-sunrise-orange/60 hover:text-sunrise-orange"
                    }`}
                  >
                    {m.marked_for_deletion ? "undo" : "remove"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending uploads */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-dawn-mist/40 uppercase tracking-wider">to upload</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pending.map((p) => (
              <div
                key={p.id}
                className={`relative rounded-lg border p-2 ${
                  p.status === "error"
                    ? "border-sunrise-orange/40 bg-sunrise-orange/5"
                    : p.status === "uploaded"
                    ? "border-eos-teal/40 bg-eos-teal/5"
                    : "border-zora-amber/30 bg-zora-amber/5"
                }`}
              >
                {p.kind === "video" ? (
                  <video src={p.previewUrl} className="w-full h-32 object-cover rounded" muted />
                ) : (
                  <img src={p.previewUrl} alt="Preview" className="w-full h-32 object-cover rounded" />
                )}
                <input
                  type="text"
                  value={p.caption}
                  onChange={(e) => updatePending(p.id, { caption: e.target.value })}
                  placeholder="caption (optional)"
                  className="mt-2 w-full rounded border border-dawn-mist/10 bg-dawn-mist/5 px-2 py-1 text-xs text-dawn-mist placeholder:text-dawn-mist/20 focus:border-zora-amber/40 focus:outline-none"
                  disabled={p.status === "uploading"}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="font-mono text-[0.6rem] text-dawn-mist/40 uppercase">
                    {p.kind}
                    {p.status === "uploading" && " · uploading"}
                    {p.status === "uploaded" && " · saved"}
                    {p.status === "error" && " · error"}
                  </span>
                  {p.status !== "uploading" && (
                    <button
                      type="button"
                      onClick={() => removePending(p.id)}
                      className="text-[0.6rem] uppercase tracking-wider text-sunrise-orange/60 hover:text-sunrise-orange"
                    >
                      remove
                    </button>
                  )}
                </div>
                {p.errorMessage && (
                  <p className="mt-1 text-[0.6rem] text-sunrise-orange">{p.errorMessage}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
