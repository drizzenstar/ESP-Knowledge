import { useState, useCallback } from "react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UploadResult } from "@uppy/core";

interface FileUploadZoneProps {
  onFilesUploaded?: (files: any[]) => void;
  articleId?: string;
  categoryId?: string;
}

export default function FileUploadZone({ onFilesUploaded, articleId, categoryId }: FileUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const { toast } = useToast();

  const handleGetUploadParameters = useCallback(async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload", {});
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload parameters:", error);
      throw error;
    }
  }, []);

  const handleUploadComplete = useCallback(async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    try {
      const files = [];
      
      for (const file of result.successful) {
        // Register file with backend
        const fileResponse = await apiRequest("PUT", "/api/files", {
          fileURL: file.uploadURL,
          filename: file.name,
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size,
          articleId,
          categoryId,
        });
        
        const fileData = await fileResponse.json();
        files.push(fileData.file);
      }
      
      setUploadedFiles(prev => [...prev, ...files]);
      onFilesUploaded?.(files);
      
      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      console.error("Error completing upload:", error);
      toast({
        title: "Error",
        description: "Failed to complete upload",
        variant: "destructive",
      });
    }
  }, [articleId, categoryId, onFilesUploaded, toast]);

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed border-gray-300 hover:border-primary transition-colors">
        <CardContent className="p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Drop files here or</p>
            <ObjectUploader
              maxNumberOfFiles={10}
              maxFileSize={10 * 1024 * 1024} // 10MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
            >
              <span className="text-primary hover:text-blue-700 font-medium text-sm">
                browse to upload
              </span>
            </ObjectUploader>
            <p className="text-xs text-gray-500">
              Supports PDF, DOC, DOCX, images, videos (max 10MB each)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Files</h4>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
