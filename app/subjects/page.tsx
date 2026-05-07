'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, Image as ImageIcon } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import { api } from '@/lib/api-client';
import { pcGetStale } from '@/lib/persist-cache';
import type { TimetableEntry } from '@/lib/types';

interface SubjectInfo {
  key: string;
  long: string;
  short: string;
}

function extractSubjectsFromCache(): SubjectInfo[] {
  if (typeof window === 'undefined') return [];
  const map = new Map<string, SubjectInfo>();
  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey?.startsWith('pokyh_cache_tt_week_')) continue;
    const cacheKey = storageKey.replace('pokyh_cache_', '');
    const entries = pcGetStale<TimetableEntry[]>(cacheKey) ?? [];
    for (const e of entries) {
      if (!e.subjectName && !e.subjectLong) continue;
      const key = (e.subjectLong || e.subjectName).toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          key,
          long: e.subjectLong || e.subjectName,
          short: e.subjectName,
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.long.localeCompare(b.long, 'de'));
}

function SubjectCard({
  info,
  hasImage,
  onUploaded,
  onDeleted,
}: {
  info: SubjectInfo;
  hasImage: boolean;
  onUploaded: (key: string) => void;
  onDeleted: (key: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (hasImage) {
      setPreviewUrl(api.subjectImages.imageUrl(info.key));
    } else {
      setPreviewUrl(null);
    }
  }, [hasImage, info.key]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      await api.subjectImages.upload(info.key, file);
      onUploaded(info.key);
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      setUploading(false);
    }
  }, [info.key, onUploaded]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await api.subjectImages.remove(info.key);
      onDeleted(info.key);
    } catch (e) {
      console.error('Delete failed', e);
    } finally {
      setDeleting(false);
    }
  }, [info.key, onDeleted]);

  return (
    <div
      className="subject-card"
      onDragOver={e => { e.preventDefault(); }}
      onDrop={e => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
      }}
    >
      <div className="subject-thumb">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={info.long}
            onError={() => setPreviewUrl(null)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <ImageIcon size={22} style={{ color: 'var(--app-text-tertiary)' }} />
        )}
      </div>

      <div className="subject-info">
        <span className="subject-long">{info.long}</span>
        {info.short && info.short !== info.long && (
          <span className="subject-short">{info.short}</span>
        )}
      </div>

      <div className="subject-actions">
        {hasImage ? (
          <>
            <button
              className="subject-btn replace press-scale"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              title="Bild ersetzen"
            >
              {uploading ? <Spinner size={14} /> : <ImagePlus size={14} />}
              <span>Ersetzen</span>
            </button>
            <button
              className="subject-btn delete press-scale"
              onClick={handleDelete}
              disabled={deleting}
              title="Bild löschen"
            >
              {deleting ? <Spinner size={14} /> : <Trash2 size={14} />}
            </button>
          </>
        ) : (
          <button
            className="subject-btn add press-scale"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Spinner size={14} /> : <ImagePlus size={14} />}
            <span>{uploading ? 'Wird hochgeladen…' : 'Bild hinzufügen'}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />

      <style jsx>{`
        .subject-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 14px;
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          transition: border-color 0.15s;
        }
        .subject-card:hover {
          border-color: color-mix(in srgb, var(--accent) 35%, var(--app-border));
        }
        .subject-thumb {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: var(--app-card);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid var(--app-border);
        }
        .subject-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .subject-long {
          font-size: 14px;
          font-weight: 600;
          color: var(--app-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .subject-short {
          font-size: 11px;
          font-weight: 500;
          color: var(--app-text-tertiary);
          letter-spacing: 0.03em;
        }
        .subject-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        .subject-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 9px;
          border: 1px solid;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.12s;
        }
        .subject-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .subject-btn.add, .subject-btn.replace {
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          border-color: color-mix(in srgb, var(--accent) 35%, var(--app-border));
          color: var(--accent);
        }
        .subject-btn.add:hover:not(:disabled), .subject-btn.replace:hover:not(:disabled) {
          background: color-mix(in srgb, var(--accent) 18%, transparent);
        }
        .subject-btn.delete {
          background: transparent;
          border-color: color-mix(in srgb, var(--danger) 35%, var(--app-border));
          color: var(--danger);
          padding: 6px 8px;
        }
        .subject-btn.delete:hover:not(:disabled) {
          background: color-mix(in srgb, var(--danger) 10%, transparent);
        }
      `}</style>
    </div>
  );
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [withImage, setWithImage] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = extractSubjectsFromCache();
    setSubjects(cached);

    api.subjectImages.list()
      .then(rows => {
        setWithImage(new Set(rows.map(r => r.subject)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUploaded = useCallback((key: string) => {
    setWithImage(prev => new Set([...prev, key]));
  }, []);

  const handleDeleted = useCallback((key: string) => {
    setWithImage(prev => { const s = new Set(prev); s.delete(key); return s; });
  }, []);

  const withImg = subjects.filter(s => withImage.has(s.key));
  const withoutImg = subjects.filter(s => !withImage.has(s.key));

  return (
    <AuthGuard>
      <div className="page-wrap">
        <div className="page-scroll">
          <header className="page-head fade-in">
            <h1 className="page-title">Fachbilder</h1>
            <p className="page-sub">Bilder für deine Unterrichtsfächer im Stundenplan</p>
          </header>

          {loading ? (
            <div className="center-state">
              <Spinner size={28} />
              <p>Wird geladen…</p>
            </div>
          ) : subjects.length === 0 ? (
            <div className="center-state">
              <p style={{ color: 'var(--app-text-secondary)' }}>
                Öffne zuerst den Stundenplan, damit Fächer erkannt werden.
              </p>
            </div>
          ) : (
            <>
              {withoutImg.length > 0 && (
                <section className="fade-in">
                  <div className="section-header">
                    <span className="section-title">Kein Bild</span>
                    <span className="section-count">{withoutImg.length}</span>
                  </div>
                  <div className="card-list">
                    {withoutImg.map(s => (
                      <SubjectCard
                        key={s.key}
                        info={s}
                        hasImage={false}
                        onUploaded={handleUploaded}
                        onDeleted={handleDeleted}
                      />
                    ))}
                  </div>
                </section>
              )}

              {withImg.length > 0 && (
                <section className="fade-in">
                  <div className="section-header">
                    <span className="section-title">Bild hinzugefügt</span>
                    <span className="section-count" style={{ color: 'var(--accent)' }}>
                      {withImg.length}
                    </span>
                  </div>
                  <div className="card-list">
                    {withImg.map(s => (
                      <SubjectCard
                        key={s.key}
                        info={s}
                        hasImage={true}
                        onUploaded={handleUploaded}
                        onDeleted={handleDeleted}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <style jsx>{`
          .page-wrap {
            height: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .page-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 20px 16px 80px;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          @media (min-width: 768px) {
            .page-scroll {
              padding: 32px 32px 80px;
              max-width: 700px;
            }
          }
          .page-head {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .page-title {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin: 0;
            color: var(--app-text-primary);
          }
          @media (min-width: 768px) {
            .page-title { font-size: 28px; }
          }
          .page-sub {
            font-size: 13.5px;
            color: var(--app-text-secondary);
            margin: 0;
          }
          .section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
          }
          .section-title {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--app-text-tertiary);
          }
          .section-count {
            font-size: 12px;
            font-weight: 700;
            color: var(--app-text-tertiary);
            background: var(--app-card);
            border: 1px solid var(--app-border);
            border-radius: 999px;
            padding: 1px 7px;
          }
          .card-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .center-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 64px 24px;
            color: var(--app-text-secondary);
            font-size: 13.5px;
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}
