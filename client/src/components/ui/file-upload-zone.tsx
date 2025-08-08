import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Props = { onFilesUploaded?: (files: any[]) => void };

export default function FileUploadZone({ onFilesUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      // adjust endpoint/path if your API differs
      const res = await apiRequest("POST", "/api/files/upload", form, true);
      onFilesUploaded?.(res.files ?? []);
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    } finally {
      setUploading(false);
      // allow selecting the same file twice in a row
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="border-2 border-dashed rounded-xl p-8 text-center">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={onChange}
      />
      <div className="mb-2 text-gray-600">Drop files here or browse files</div>
      <Button type="button" onClick={openPicker} disabled={uploading}>
        {uploading ? "Uploading..." : "Browse files"}
      </Button>
      <p className="mt-3 text-xs text-gray-500">
        Supports PDF, DOC, DOCX, images, videos (max 10MB each)
      </p>
    </div>
  );
}
