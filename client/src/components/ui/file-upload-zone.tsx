import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Props = { onFilesUploaded?: (files: any[]) => void };

export default function FileUploadZone({ onFilesUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const doUpload = async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList ?? []);
    if (!arr.length) return;

    setUploading(true);
    try {
      const form = new FormData();
      arr.forEach((f) => form.append("files", f)); // <-- field name `files`

      // IMPORTANT: tell apiRequest this is FormData so it does NOT set JSON headers
      const res = await apiRequest("POST", "/api/files/upload", form, true);
      onFilesUploaded?.(res.files ?? []);
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) doUpload(e.target.files);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      doUpload(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, []);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
        dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={onInputChange}
      />

      <div className="mb-2 text-gray-600">
        Drop files here or browse files
      </div>

      <Button type="button" onClick={openPicker} disabled={uploading}>
        {uploading ? "Uploading..." : "Browse files"}
      </Button>

      <p className="mt-3 text-xs text-gray-500">
        Supports PDF, DOC, DOCX, images, videos (max 10MB each)
      </p>
    </div>
  );
}
