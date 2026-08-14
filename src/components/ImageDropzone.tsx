"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { ensureFirebaseSignedIn } from "@/lib/firebase-session";
import {
  cloudUploadErrorMessage,
  uploadImageBlob,
} from "@/lib/cloud-storage";

interface Props {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  label?: string;
}

const MAX_DIMENSION = 960;
const JPEG_QUALITY = 0.78;

async function fileToJpegBlob(file: File | Blob): Promise<Blob> {
  const type = file.type || "image/jpeg";
  if (!type.startsWith("image/")) {
    throw new Error("יש לבחור קובץ תמונה");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("התמונה גדולה מדי (מעל 12MB)");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("לא ניתן לעבד את התמונה");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) throw new Error("לא ניתן לעבד את התמונה");
  return blob;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("קריאת התמונה נכשלה"));
    reader.readAsDataURL(blob);
  });
}

function pickClipboardImage(e: globalThis.ClipboardEvent): File | null {
  const items = e.clipboardData?.items;
  if (!items) return null;
  for (const item of Array.from(items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  const files = e.clipboardData?.files;
  if (files?.length) {
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) return file;
    }
  }
  return null;
}

export function ImageDropzone({
  value,
  onChange,
  label = "תמונה",
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlob = useCallback(
    async (source: File | Blob) => {
      setBusy(true);
      setError(null);
      setHint(null);
      try {
        const blob = await fileToJpegBlob(source);
        // Always update preview immediately so file-picker / paste / drop feel instant
        const localPreview = await blobToDataUrl(blob);
        onChange(localPreview);

        if (!isFirebaseConfigured()) return;

        const uid = await ensureFirebaseSignedIn();
        if (!uid) {
          setHint("התמונה נבחרה מקומית — התחברו עם Google כדי לשמור בענן.");
          return;
        }

        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}`;
        try {
          const url = await uploadImageBlob(blob, `uploads/${id}.jpg`);
          onChange(url);
          setHint(null);
        } catch (uploadErr) {
          // Keep local preview; savePerson/saveProduction will retry via ensureCloudImageUrl
          setError(cloudUploadErrorMessage(uploadErr));
          setHint("התמונה מוצגת מקומית — נסו לשמור; ההעלאה לענן תתבצע שוב בשמירה.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "העלאה נכשלה");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onChange]
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      await handleBlob(file);
    },
    [handleBlob]
  );

  const pasteFromClipboard = useCallback(async () => {
    setError(null);
    setHint(null);

    if (typeof navigator !== "undefined" && navigator.clipboard?.read) {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith("image/")) {
              const blob = await item.getType(type);
              await handleBlob(blob);
              return;
            }
          }
        }
        setError("לא נמצאה תמונה בלוח ההעתקה — העתיקו תמונה ונסו שוב.");
        return;
      } catch {
        setHint("לחצו Ctrl+V (או ⌘+V במק) להדבקת תמונה מהלוח.");
        return;
      }
    }

    setHint("לחצו Ctrl+V (או ⌘+V במק) להדבקת תמונה מהלוח.");
  }, [handleBlob]);

  useEffect(() => {
    function onWindowPaste(e: globalThis.ClipboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input:not([type='file']), textarea, [contenteditable='true']")) {
        return;
      }
      const file = pickClipboardImage(e);
      if (!file) return;
      e.preventDefault();
      void handleBlob(file);
    }
    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [handleBlob]);

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    void handleFiles(e.dataTransfer.files);
  }

  const pasteShortcut =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/i.test(navigator.userAgent)
      ? "⌘+V"
      : "Ctrl+V";

  return (
    <div className="image-drop-wrap">
      <span className="image-drop-label">{label}</span>
      <div
        className={`image-drop ${dragging ? "dragging" : ""} ${value ? "has-image" : ""}`}
        tabIndex={0}
        role="button"
        aria-label={`${label} — גרירה, בחירה או הדבקה`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="תצוגה מקדימה" />
            <div className="image-drop-replace-hint" aria-hidden="true">
              <span>גררו תמונה לכאן · או לחצו להחלפה</span>
            </div>
          </>
        ) : (
          <div className="image-drop-empty">
            <strong>גררו תמונה לכאן</strong>
            <span>או לחצו לבחירה מהמחשב</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          aria-label={label}
          disabled={busy}
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>
      <div className="image-drop-actions">
        {!value && (
          <>
            <button
              type="button"
              className="btn btn-primary image-drop-paste-btn"
              disabled={busy}
              onClick={() => void pasteFromClipboard()}
            >
              <span className="image-drop-paste-icon" aria-hidden="true">
                📋
              </span>
              הדבקה
              <kbd className="image-drop-paste-kbd">{pasteShortcut}</kbd>
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              בחירה מהמחשב
            </button>
          </>
        )}
        {busy && <span className="muted">מעלה לענן…</span>}
        {value && (
          <div className="image-drop-replace-actions">
            <button
              type="button"
              className="btn btn-accent image-drop-replace-btn"
              disabled={busy}
              onClick={() => void pasteFromClipboard()}
            >
              הדבקת תמונה אחרת
              <kbd className="image-drop-replace-kbd">{pasteShortcut}</kbd>
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              בחירה מהמחשב
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={() => {
                onChange(undefined);
                setError(null);
                setHint(null);
              }}
            >
              הסרת תמונה
            </button>
          </div>
        )}
      </div>
      {hint && <p className="muted">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
