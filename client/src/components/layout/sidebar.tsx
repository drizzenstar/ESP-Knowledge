import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { 
  Home, 
  FolderOpen, 
  FileText, 
  Upload, 
  Users, 
  Shield, 
  Settings,
  ChevronRight,
  ChevronDown,
  Folder,
} from "lucide-react";
import { useState } from "react";
import type { Category } from "@shared/schema";

interface CategoryTreeProps {
  categories: Category[];
  parentId?: number | null;
  level?: number;
}

function CategoryTree({ categories, parentId = null, level = 0 }: CategoryTreeProps) {
  const [location, setLocation] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const filteredCategories = categories.filter(cat => cat.parentId === parentId);

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const hasChildren = (categoryId: number) => {
    return categories.some(cat => cat.parentId === categoryId);
  };

  if (filteredCategories.length === 0) return null;

  return (
    <div className={level > 0 ? "ml-4" : ""}>
      {filteredCategories.map((category) => {
        const children = categories.filter(cat => cat.parentId === category.id);
        const isExpanded = expandedCategories.has(category.id);
        const categoryPath = `/categories/${category.id}`;
        
        return (
          <div key={category.id} className="space-y-1">
            <div className="flex items-center">
              {hasChildren(category.id) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-6 w-6 mr-1"
                  onClick={() => toggleExpanded(category.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
              <Button
                variant={location === categoryPath ? "default" : "ghost"}
                className="w-full justify-start text-sm h-8 px-2"
                onClick={() => setLocation(categoryPath)}
              >
                <Folder className="mr-2 h-3 w-3" />
                {category.name}
              </Button>
            </div>
            {isExpanded && children.length > 0 && (
              <CategoryTree 
                categories={categories} 
                parentId={category.id} 
                level={level + 1} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    retry: false,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/categories", icon: FolderOpen, label: "Categories" },
    { path: "/articles", icon: FileText, label: "Articles" },
    { path: "/files", icon: Upload, label: "File Library" },
  ];

  const adminNavItems = [
    { path: "/users", icon: Users, label: "User Management" },
    { path: "/permissions", icon: Shield, label: "Permissions" },
    { path: "/system-settings", icon: Settings, label: "System Settings" },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={location === item.path ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setLocation(item.path)}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          ))}
          
          {/* Categories Section */}
          {categories.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Knowledge Areas
              </p>
              <div className="space-y-1">
                <CategoryTree categories={categories} />
              </div>
            </div>
          )}
          
          {/* Admin Only Section */}
          {user?.role === 'admin' && (
            <div className="pt-4 border-t border-gray-200">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Administration
              </p>
              <div className="space-y-1">
                {adminNavItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={location === item.path ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setLocation(item.path)}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </nav>
        
        {/* Quick Stats */}
        <Card className="mt-8">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Articles</span>
                <span className="font-medium">{stats?.totalArticles || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Categories</span>
                <span className="font-medium">{stats?.totalCategories || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Users</span>
                <span className="font-medium">{stats?.activeUsers || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}