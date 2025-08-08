import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FolderOpen, Users, Upload, Plus, FolderPlus, UserCog } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    retry: false,
  });

  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ["/api/articles"],
    retry: false,
  });

  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation('/auth');
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const recentArticles = articles?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex h-screen pt-16">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening in your knowledge base.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                        <BookOpen className="text-white h-6 w-6" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Articles</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : stats?.totalArticles || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
                        <FolderOpen className="text-white h-6 w-6" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Categories</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : stats?.totalCategories || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                        <Users className="text-white h-6 w-6" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : stats?.activeUsers || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center">
                        <Upload className="text-white h-6 w-6" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Uploaded Files</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : stats?.totalFiles || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Articles */}
              <Card>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Articles</h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setLocation('/articles')}
                    >
                      View All
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6">
                  {articlesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentArticles.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No articles found</p>
                  ) : (
                    <div className="space-y-4">
                      {recentArticles.map((article: any) => (
                        <div key={article.id} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {article.title}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Category
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(article.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto border-2 border-dashed border-gray-300 hover:border-primary hover:bg-blue-50"
                      onClick={() => setLocation('/articles/new')}
                    >
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-2">
                        <Plus className="text-white h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">New Article</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto border-2 border-dashed border-gray-300 hover:border-success hover:bg-green-50"
                      onClick={() => setLocation('/files')}
                    >
                      <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center mb-2">
                        <Upload className="text-white h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Upload File</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto border-2 border-dashed border-gray-300 hover:border-accent hover:bg-yellow-50"
                      onClick={() => setLocation('/categories')}
                    >
                      <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-2">
                        <FolderPlus className="text-white h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">New Category</span>
                    </Button>
                    
                    {user.role === 'admin' && (
                      <Button
                        variant="outline"
                        className="flex flex-col items-center p-4 h-auto border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50"
                        onClick={() => setLocation('/users')}
                      >
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-2">
                          <UserCog className="text-white h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Manage Users</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
