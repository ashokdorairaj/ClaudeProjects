import React, { useRef, useState } from 'react';
import type { FormFactor, ValueState } from '../../../tokens';
import './FileUploader.css';

/* ── Types ─────────────────────────────────────────────────── */

export interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  maxFileSize?: number;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  /** Controlled file list — when provided the component is fully controlled */
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  onFileRemove?: (name: string) => void;
  formFactor?: FormFactor;
  /** SAP value state — mirrors Input/Select pattern */
  valueState?: ValueState;
  /** Message shown below the field when valueState !== 'None' */
  valueStateMessage?: string;
  className?: string;
}

/* ── Value state helpers ────────────────────────────────────── */

const valueStateFieldClass: Record<ValueState, string> = {
  None: '',
  Positive: 'fd-file-uploader--success',
  Negative: 'fd-file-uploader--error',
  Critical: 'fd-file-uploader--warning',
  Information: 'fd-file-uploader--information',
};

const valueStateMessageClass: Record<ValueState, string> = {
  None: '',
  Positive: 'fd-file-uploader__message--positive',
  Negative: 'fd-file-uploader__message--negative',
  Critical: 'fd-file-uploader__message--critical',
  Information: 'fd-file-uploader__message--information',
};

/* ── Component ──────────────────────────────────────────────── */

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept,
  multiple = false,
  maxFileSize = 0,
  disabled = false,
  required = false,
  label,
  placeholder = 'Browse or drop a file',
  files: filesProp,
  onFilesChange,
  onFileRemove,
  formFactor = 'cozy',
  valueState = 'None',
  valueStateMessage,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync controlled value
  const isControlled = filesProp !== undefined;
  const files = isControlled ? filesProp : internalFiles;

  const setFiles = (next: File[]) => {
    if (!isControlled) setInternalFiles(next);
    onFilesChange?.(next);
  };

  const processFiles = (rawFiles: FileList | null) => {
    if (!rawFiles) return;
    let incoming = Array.from(rawFiles);
    if (maxFileSize > 0) {
      incoming = incoming.filter((f) => f.size <= maxFileSize);
    }
    const next = multiple ? [...files, ...incoming] : incoming.slice(0, 1);
    setFiles(next);
  };

  const removeFile = (name: string) => {
    const next = files.filter((f) => f.name !== name);
    setFiles(next);
    onFileRemove?.(name);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled) processFiles(e.dataTransfer.files);
  };

  const rootClasses = [
    'fd-file-uploader',
    formFactor === 'compact' ? 'fd-file-uploader--compact' : '',
    disabled ? 'fd-file-uploader--disabled' : '',
    isDragOver ? 'fd-file-uploader--drag-over' : '',
    valueState !== 'None' ? valueStateFieldClass[valueState] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const fieldAriaLabel =
    files.length > 0
      ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
      : placeholder;

  return (
    <div className={rootClasses}>
      {label && (
        <label className="fd-file-uploader__label">
          {label}
          {required && <span className="fd-file-uploader__label-required" aria-hidden="true"> *</span>}
        </label>
      )}

      {/* ── Input field ── */}
      <div
        className="fd-file-uploader__field"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={fieldAriaLabel}
        aria-invalid={valueState === 'Negative' ? 'true' : undefined}
        aria-required={required ? 'true' : undefined}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        {/* Filename tokens (uploaded state) or placeholder */}
        <span className="fd-file-uploader__content">
          {files.length > 0 ? (
            files.map((f) => (
              <span
                key={f.name}
                className="fd-file-uploader__token"
                title={f.name}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="fd-file-uploader__token-text">{f.name}</span>
                <button
                  type="button"
                  className="fd-file-uploader__token-remove"
                  onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                  aria-label={`Remove ${f.name}`}
                  disabled={disabled}
                >
                  <CloseIcon />
                </button>
              </span>
            ))
          ) : (
            <span className="fd-file-uploader__placeholder">{placeholder}</span>
          )}
        </span>

        {/* Browse icon button */}
        <button
          type="button"
          className="fd-file-uploader__browse-btn"
          disabled={disabled}
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          tabIndex={-1}
          aria-label="Browse files"
        >
          <UploadIcon />
        </button>

        <input
          ref={inputRef}
          type="file"
          className="fd-file-uploader__hidden-input"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* Value state message */}
      {valueStateMessage && valueState !== 'None' && (
        <p className={`fd-file-uploader__message ${valueStateMessageClass[valueState]}`} role="alert">
          {valueStateMessage}
        </p>
      )}
    </div>
  );
};

/* ── Icons ─────────────────────────────────────────────────── */

/** SAP Fiori "upload" icon — arrow pointing up from a tray */
const UploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <path d="M8 1a.75.75 0 0 1 .53.22l3 3a.75.75 0 1 1-1.06 1.06L8.75 3.56V10a.75.75 0 0 1-1.5 0V3.56L5.53 5.28A.75.75 0 0 1 4.47 4.22l3-3A.75.75 0 0 1 8 1ZM2 11.25A.75.75 0 0 1 2.75 12h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 12.75v-1.5A.75.75 0 0 1 2 11.25Z"/>
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export default FileUploader;
