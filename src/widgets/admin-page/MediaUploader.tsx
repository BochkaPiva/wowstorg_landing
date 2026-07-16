import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Save, UploadCloud, X } from "lucide-react";

export function MediaUploader({ onUpload, onPendingChange, deferred = false, label = "Загрузить изображения", multiple = true, resetToken = 0, suggestedAlt = "" }: {
  onUpload?: (file: File, alt: string) => Promise<void>;
  onPendingChange?: (files: File[], alt: string) => void;
  deferred?: boolean;
  label?: string;
  multiple?: boolean;
  resetToken?: number;
  suggestedAlt?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [alt, setAlt] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);
  useEffect(() => {
    setFiles([]);
    setAlt("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [resetToken]);

  const chooseFiles = (list: FileList | null) => {
    if (!list) return;
    const nextFiles = Array.from(list);
    const nextAlt = alt.trim().length >= 2 ? alt : suggestedAlt.trim();
    setFiles(nextFiles);
    setAlt(nextAlt);
    onPendingChange?.(nextFiles, nextAlt);
    setError(null);
  };
  const change = (event: ChangeEvent<HTMLInputElement>) => chooseFiles(event.target.files);
  const drop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFiles(event.dataTransfer.files);
  };
  const upload = async () => {
    if (!files.length || !onUpload) return;
    setUploading(true);
    setError(null);
    try {
      for (const [index, file] of files.entries()) {
        const fileAlt = files.length > 1 ? `${alt.trim()} ${index + 1}`.trim() : alt.trim();
        await onUpload(file, fileAlt);
      }
      setFiles([]);
      setAlt("");
      onPendingChange?.([], "");
      if (inputRef.current) inputRef.current.value = "";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить файл.");
    } finally {
      setUploading(false);
    }
  };

  return <div className="admin-uploader">
    <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} onChange={change} />
    <button className={`admin-uploader__drop ${dragging ? "is-dragging" : ""}`} type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>
      <UploadCloud size={23} /><span>{label}</span><small>Перетащите JPG, PNG, WebP или AVIF до 10 МБ</small>
    </button>
    {files.length ? <div className="admin-uploader__selection">
      <div className="admin-uploader__previews" aria-label="Выбранные изображения">{previews.map(({ file, url }) => <figure key={`${file.name}-${file.lastModified}`}><img src={url} alt="" /><figcaption>{file.name}</figcaption></figure>)}</div>
      <div className="admin-uploader__summary"><ImagePlus size={19} /><span>{files.length === 1 ? files[0].name : `Выбрано файлов: ${files.length}`}</span><button type="button" onClick={() => { setFiles([]); setAlt(""); onPendingChange?.([], ""); }} aria-label="Очистить выбор"><X size={16} /></button></div>
      <label><span>Описание для доступности и SEO</span><input value={alt} onChange={(event) => { const nextAlt = event.target.value; setAlt(nextAlt); onPendingChange?.(files, nextAlt); }} placeholder="Что изображено на фото" /></label>
      {deferred
        ? <p className={alt.trim().length >= 2 ? "admin-uploader__pending is-ready" : "admin-uploader__pending"}><Save size={16} /><span>{alt.trim().length >= 2 ? "Загрузятся вместе с карточкой" : "Добавьте описание фотографий"}</span></p>
        : <button type="button" onClick={() => void upload()} disabled={uploading || alt.trim().length < 2}>{uploading ? <LoaderCircle className="is-spinning" size={17} /> : <UploadCloud size={17} />} Загрузить</button>}
    </div> : null}
    {error ? <p className="admin-formError" role="alert">{error}</p> : null}
  </div>;
}
