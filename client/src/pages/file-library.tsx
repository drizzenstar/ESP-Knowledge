import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import FileUploadZone from "@/components/ui/file-upload-zone";
import { 
  Upload, 
  Search, 
  FileText, 
  Image, 
  File, 
  Video, 
  MoreVertical,
  Trash2,
  Download 
} from "lucide-react";

export default function FileLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["/api/files"],
    retry: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/files/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Video;
    if (fileType.includes('pdf')) return FileText;
    return File;
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'bg-purple-100 text-purple-600';
    if (fileType.startsWith('video/')) return 'bg-blue-100 text-blue-600';
    if (fileType.includes('pdf')) return 'bg-red-100 text-red-600';
    if (fileType.includes('document') || fileType.includes('word')) return 'bg-blue-100 text-blue-600';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'bg-green-100 text-green-600';
    return 'bg-gray-100 text-gray-600';
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFiles = files.filter((file: any) => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFileType = !fileTypeFilter || file.fileType.includes(fileTypeFilter);
    const matchesCategory = !categoryFilter || file.categoryId === categoryFilter;
    return matchesSearch && matchesFileType && matchesCategory;
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownload = (file: any) => {
    // Open file in new tab for download/viewing
    window.open(file.filePath, '_blank');
  };

  const handleFilesUploaded = (uploadedFiles: any[]) => {
    setShowUploadDialog(false);
    queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    toast({
      title: "Success",
      description: `${uploadedFiles.length} file(s) uploaded successfully`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex h-screen pt-16">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">File Library</h1>
                  <p className="text-gray-600">Manage uploaded documents and media files</p>
                </div>
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Upload Files</DialogTitle>
                    </DialogHeader>
                    <FileUploadZone onFilesUploaded={handleFilesUploaded} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Filter and Search */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search files..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All File Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All File Types</SelectItem>
                      <SelectItem value="pdf">PDF Documents</SelectItem>
                      <SelectItem value="document">Word Documents</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Files Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="animate-pulse">
                        <div className="h-10 bg-gray-200 rounded mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredFiles.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No files found</p>
                  <Button onClick={() => setShowUploadDialog(true)}>
                    Upload your first file
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFiles.map((file: any) => {
                  const FileIcon = getFileIcon(file.fileType);
                  const category = categories.find((cat: any) => cat.id === file.categoryId);
                  
                  return (
                    <Card key={file.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileTypeColor(file.fileType)}`}>
                            <FileIcon className="h-5 w-5" />
                          </div>
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                            {/* File actions menu would go here */}
                          </div>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                          {file.originalName}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {formatFileSize(file.fileSize)}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                          {category && (
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: category.color,
                                color: category.color 
                              }}
                            >
                              {category.name}
                            </Badge>
                          )}
                        </div>
                        
                        {/* File actions */}
                        <div className="flex mt-3 space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDownload(file)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {(user?.role === 'admin' || file.uploadedBy === user?.id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(file.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
