import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, BookOpen, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Navbar() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

// above return()
async function handleSignOut() {
  try {
    await apiRequest("POST", "/api/logout");  // <-- POST, not GET
  } catch {
    // ignore; we’ll still kick back to landing
  } finally {
    window.location.href = "/";               // go to home, NOT /api/logout
  }
}


  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setLocation('/')}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="text-white h-5 w-5" />
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">Knowledge Base</span>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search articles, categories..."
                className="pl-10"
              />
            </div>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Button
  variant="ghost"
  className="w-full justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
  onClick={() => {
    setShowUserMenu(false);
    handleSignOut();
  }}
>
  Sign Out
</Button>            
            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center space-x-3 p-2"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "User"} />
                  <AvatarFallback>
                    {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.email || "User"
                    }
                  </div>
                </div>
                <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'} className="hidden sm:inline-flex">
                  {user?.role || 'User'}
                </Badge>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
              
              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setLocation('/profile');
                        setShowUserMenu(false);
                      }}
                    >
                      Profile Settings
                    </Button>
                    <div className="border-t border-gray-100 my-1" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setShowUserMenu(false);
                        window.location.href = '/api/logout';
                      }}
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
