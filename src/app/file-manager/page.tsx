"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UploadedFile {
  name: string;
  originalName: string;
  size: number;
  createdAt: string;
  url: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const icons: Record<string, string> = {
    pdf: "📄",
    doc: "📝",
    docx: "📝",
    xls: "📊",
    xlsx: "📊",
    ppt: "📽️",
    pptx: "📽️",
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    gif: "🖼️",
    webp: "🖼️",
    svg: "🖼️",
    mp4: "🎬",
    mp3: "🎵",
    zip: "📦",
    rar: "📦",
    "7z": "📦",
    txt: "📃",
    csv: "📊",
    json: "📋",
    js: "⚙️",
    ts: "⚙️",
    html: "🌐",
    css: "🎨",
  };
  return icons[ext] || "📎";
}

export default function FileManagerPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/file-manager");
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error("Lỗi tải danh sách file:", err);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(`Đang tải lên: ${file.name}`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/file-manager/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload thất bại");
      }

      setUploadProgress(`✅ Tải lên thành công: ${file.name}`);
      await fetchFiles();

      setTimeout(() => setUploadProgress(null), 3000);
    } catch (err) {
      setUploadProgress(
        `❌ Lỗi: ${err instanceof Error ? err.message : "Upload thất bại"}`
      );
      setTimeout(() => setUploadProgress(null), 4000);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDelete = async (fileName: string) => {
    if (!confirm("Bạn có chắc muốn xóa file này?")) return;

    setDeletingFile(fileName);
    try {
      const res = await fetch("/api/file-manager", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName }),
      });

      if (!res.ok) throw new Error("Xóa thất bại");

      await fetchFiles();
    } catch (err) {
      console.error("Lỗi xóa file:", err);
    } finally {
      setDeletingFile(null);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerGlow} />
          <h1 style={styles.title}>
            <span style={styles.titleIcon}>☁️</span>
            Quản lý File
          </h1>
          <p style={styles.subtitle}>
            Tải lên, lưu trữ và tải về các file của bạn
          </p>
        </div>

        {/* Upload Area */}
        <div
          style={{
            ...styles.uploadArea,
            ...(dragOver ? styles.uploadAreaDragOver : {}),
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="file-upload-input"
          />
          <div
            style={{
              ...styles.uploadIcon,
              ...(dragOver ? styles.uploadIconDragOver : {}),
            }}
          >
            {uploading ? "⏳" : dragOver ? "📥" : "📤"}
          </div>
          <p style={styles.uploadText}>
            {uploading
              ? "Đang tải lên..."
              : dragOver
                ? "Thả file vào đây!"
                : "Nhấn để chọn file hoặc kéo thả vào đây"}
          </p>
          <p style={styles.uploadHint}>Hỗ trợ mọi loại file</p>
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div
            style={{
              ...styles.progressBar,
              ...(uploadProgress.startsWith("❌")
                ? styles.progressError
                : uploadProgress.startsWith("✅")
                  ? styles.progressSuccess
                  : {}),
            }}
          >
            {uploadProgress}
          </div>
        )}

        {/* File List */}
        <div style={styles.fileListHeader}>
          <h2 style={styles.fileListTitle}>
            📁 File đã tải lên ({files.length})
          </h2>
          {files.length > 0 && (
            <button style={styles.refreshBtn} onClick={fetchFiles}>
              🔄 Làm mới
            </button>
          )}
        </div>

        {files.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📂</div>
            <p style={styles.emptyText}>Chưa có file nào</p>
            <p style={styles.emptyHint}>
              Hãy tải file lên để bắt đầu
            </p>
          </div>
        ) : (
          <div style={styles.fileGrid}>
            {files.map((file) => (
              <div key={file.name} style={styles.fileCard}>
                <div style={styles.fileCardHeader}>
                  <span style={styles.fileIcon}>
                    {getFileIcon(file.originalName)}
                  </span>
                  <span style={styles.fileSize}>
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <p style={styles.fileName} title={file.originalName}>
                  {file.originalName}
                </p>
                <p style={styles.fileDate}>{formatDate(file.createdAt)}</p>
                <div style={styles.fileActions}>
                  <a
                    href={file.url}
                    download={file.originalName}
                    style={styles.downloadBtn}
                    onClick={(e) => e.stopPropagation()}
                  >
                    ⬇️ Tải về
                  </a>
                  <button
                    style={{
                      ...styles.deleteBtn,
                      ...(deletingFile === file.name
                        ? styles.deleteBtnDisabled
                        : {}),
                    }}
                    onClick={() => handleDelete(file.name)}
                    disabled={deletingFile === file.name}
                  >
                    {deletingFile === file.name ? "⏳" : "🗑️"} Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline styles for fully standalone page
// ─────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29 0%, #1a1a3e 40%, #24243e 100%)",
    padding: "40px 16px",
    fontFamily:
      "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#e2e8f0",
  },
  container: {
    maxWidth: 800,
    margin: "0 auto",
  },

  // Header
  header: {
    position: "relative" as const,
    textAlign: "center" as const,
    marginBottom: 40,
    padding: "40px 20px 30px",
    borderRadius: 20,
    background:
      "linear-gradient(145deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.10) 100%)",
    border: "1px solid rgba(99,102,241,0.2)",
    overflow: "hidden",
  },
  headerGlow: {
    position: "absolute" as const,
    top: -60,
    left: "50%",
    transform: "translateX(-50%)",
    width: 300,
    height: 120,
    background: "radial-gradient(ellipse, rgba(139,92,246,0.35) 0%, transparent 70%)",
    pointerEvents: "none" as const,
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    margin: 0,
    background: "linear-gradient(135deg, #a78bfa, #c084fc, #e879f9)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.02em",
  },
  titleIcon: {
    WebkitTextFillColor: "initial",
    marginRight: 10,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#94a3b8",
    fontWeight: 400,
  },

  // Upload area
  uploadArea: {
    border: "2px dashed rgba(139,92,246,0.4)",
    borderRadius: 16,
    padding: "48px 24px",
    textAlign: "center" as const,
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: "rgba(139,92,246,0.05)",
    marginBottom: 24,
  },
  uploadAreaDragOver: {
    borderColor: "#a78bfa",
    background: "rgba(139,92,246,0.15)",
    transform: "scale(1.01)",
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 12,
    transition: "transform 0.3s ease",
  },
  uploadIconDragOver: {
    transform: "scale(1.2)",
  },
  uploadText: {
    fontSize: 16,
    fontWeight: 600,
    color: "#c4b5fd",
    margin: "0 0 6px",
  },
  uploadHint: {
    fontSize: 13,
    color: "#64748b",
    margin: 0,
  },

  // Progress
  progressBar: {
    padding: "12px 16px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 24,
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.3)",
    color: "#a5b4fc",
    textAlign: "center" as const,
  },
  progressSuccess: {
    background: "rgba(34,197,94,0.15)",
    borderColor: "rgba(34,197,94,0.3)",
    color: "#86efac",
  },
  progressError: {
    background: "rgba(239,68,68,0.15)",
    borderColor: "rgba(239,68,68,0.3)",
    color: "#fca5a5",
  },

  // File list header
  fileListHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  fileListTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: "#e2e8f0",
  },
  refreshBtn: {
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.3)",
    color: "#a5b4fc",
    padding: "6px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.2s ease",
  },

  // Empty state
  emptyState: {
    textAlign: "center" as const,
    padding: "60px 20px",
    borderRadius: 16,
    background: "rgba(30,30,60,0.5)",
    border: "1px solid rgba(99,102,241,0.1)",
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: 600,
    color: "#94a3b8",
    margin: "0 0 4px",
  },
  emptyHint: {
    fontSize: 13,
    color: "#64748b",
    margin: 0,
  },

  // File grid
  fileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
  },

  // File card
  fileCard: {
    background: "rgba(30,30,60,0.7)",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: 14,
    padding: 18,
    transition: "all 0.25s ease",
    display: "flex",
    flexDirection: "column" as const,
  },
  fileCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  fileIcon: {
    fontSize: 28,
  },
  fileSize: {
    fontSize: 12,
    color: "#64748b",
    background: "rgba(99,102,241,0.1)",
    padding: "2px 8px",
    borderRadius: 6,
  },
  fileName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#e2e8f0",
    margin: "0 0 4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  fileDate: {
    fontSize: 12,
    color: "#64748b",
    margin: "0 0 14px",
  },
  fileActions: {
    display: "flex",
    gap: 8,
    marginTop: "auto",
  },
  downloadBtn: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "8px 0",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  deleteBtn: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "8px 0",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: "rgba(239,68,68,0.12)",
    color: "#fca5a5",
    border: "1px solid rgba(239,68,68,0.2)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  deleteBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};
