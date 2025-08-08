import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/ui/rich-text-editor";
import FileUploadZone from "@/components/ui/file-upload-zone";

export default function ArticleEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ["/api/articles", id],
    enabled: isEditing,
    retry: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Load article data when editing
  useEffect(() => {
    if (article) {
      setTitle(article.title || "");
      setContent(article.content || "");
      setCategoryId(article.categoryId || "");
      setTags(article.tags?.join(", ") || "");
      setIsPublished(article.isPublished || false);
    }
  }, [article]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/articles", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Article created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      setLocation('/articles');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create article",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/articles/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Article updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      setLocation('/articles');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update article",
        variant: "destructive",
      });
    },
  });

  const handleSave = (publish = false) => {
    if (!title.trim() || !content.trim() || !categoryId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const articleData = {
      title: title.trim(),
      content: content.trim(),
      categoryId,
      tags: tags ? tags.split(",").map(tag => tag.trim()).filter(Boolean) : [],
      isPublished: publish || isPublished,
    };

    if (isEditing) {
      updateMutation.mutate(articleData);
    } else {
      createMutation.mutate(articleData);
    }
  };

  const handleFileUpload = (files: any[]) => {
    // Handle file uploads and attach to article
    console.log("Files uploaded:", files);
  };

  if (isEditing && articleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16">
        <main className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit Article' : 'Create New Article'}
                </h1>
                <p className="text-gray-600">Write and publish knowledge base content</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Save Draft
                </Button>
                <Button 
                  onClick={() => handleSave(true)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {isEditing ? 'Update Article' : 'Publish Article'}
                </Button>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Article Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Article Title *
                </label>
                <Input
                  type="text"
                  placeholder="Enter article title..."
                  className="text-lg"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Category and Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter tags separated by commas..."
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>

              {/* Rich Text Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Start writing your article content here..."
                />
              </div>

              {/* File Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments
                </label>
                <FileUploadZone onFilesUploaded={handleFileUpload} />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
