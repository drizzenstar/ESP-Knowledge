import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";

import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

type Article = {
  id: number;
  title: string;
  content: string;
  categoryId: number | null;
  authorId?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export default function ArticleEditor() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Matches /articles/:id/edit (edit mode) OR /articles/new (create mode)
  const [isEditRoute, params] = useRoute<{ id: string }>("/articles/:id/edit");
  const isEdit = Boolean(isEditRoute && params?.id);
  const articleId = isEdit ? Number(params!.id) : null;

  // Load categories for the dropdown (respects your server’s permission logic)
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Load article when editing
  const {
    data: existingArticle,
    isLoading: loadingArticle,
    error: loadErr,
  } = useQuery<Article>({
    queryKey: ["/api/articles", articleId],
    enabled: isEdit && !!articleId,
    retry: false,
  });

  // Local form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  // Initialize fields when article loads
  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title ?? "");
      setContent(existingArticle.content ?? "");
      setCategoryId(
        existingArticle.categoryId != null
          ? String(existingArticle.categoryId)
          : ""
      );
    }
  }, [existingArticle]);

  // Create / Update mutations
  const upsertMutation = useMutation({
    mutationFn: async () => {
      const body = {
        title,
        content,
        categoryId: categoryId ? Number(categoryId) : null,
      };

      if (isEdit && articleId) {
        const res = await apiRequest("PUT", `/api/articles/${articleId}`, body);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/articles", body);
        return await res.json();
      }
    },
    onSuccess: (data: Article) => {
      // Refresh lists and detail
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      if (isEdit) {
        queryClient.setQueryData(["/api/articles", articleId], data);
      }
      toast({
        title: isEdit ? "Article updated" : "Article created",
        description: isEdit
          ? "Your changes have been saved."
          : "Your article has been created.",
      });
      setLocation("/articles");
    },
    onError: (err: any) => {
      if (isUnauthorizedError(err)) {
        toast({
          title: "Session expired",
          description: "Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => (window.location.href = "/auth"), 500);
        return;
      }
      toast({
        title: "Save failed",
        description: err?.message ?? "Unable to save article.",
        variant: "destructive",
      });
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!articleId) return;
      await apiRequest("DELETE", `/api/articles/${articleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article deleted" });
      setLocation("/articles");
    },
    onError: (err: any) => {
      toast({
        title: "Delete failed",
        description: err?.message ?? "Unable to delete article.",
        variant: "destructive",
      });
    },
  });

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast({
        title: "Validation",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }
    upsertMutation.mutate();
  };

  if (isEdit && loadingArticle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading article…</div>
      </div>
    );
  }

  if (isEdit && loadErr) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Failed to load article.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex h-screen pt-16">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEdit ? "Edit Article" : "New Article"}
                </h1>
                <p className="text-gray-600">
                  {isEdit
                    ? "Update the article content."
                    : "Write a new knowledge base article."}
                </p>
              </div>
              {isEdit && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete this article? This cannot be undone."
                      )
                    ) {
                      deleteMutation.mutate();
                    }
                  }}
                >
                  Delete
                </Button>
              )}
            </div>

            <Card>
              <CardContent className="p-6">
                <form className="space-y-6" onSubmit={onSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Article title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <Select
                      value={categoryId}
                      onValueChange={setCategoryId}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Uncategorized</SelectItem>
                        {categories.map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <Textarea
                      className="min-h-[240px]"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your article content…"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={upsertMutation.isPending || !canSubmit}>
                      {isEdit ? "Save changes" : "Create article"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/articles")}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
