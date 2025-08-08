import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Server, Database, Mail, Shield, Globe, Save, RefreshCw } from "lucide-react";

export default function SystemSettings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [settings, setSettings] = useState({
    siteName: "Knowledge Base Platform",
    siteDescription: "A comprehensive knowledge management solution",
    allowRegistration: true,
    requireEmailVerification: false,
    defaultUserRole: "user",
    maxFileSize: 10485760, // 10MB
    allowedFileTypes: ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg",
    enableTeamsIntegration: false,
    teamsWebhookUrl: "",
    maintenanceMode: false,
    backupFrequency: "daily",
    sessionTimeout: 7200, // 2 hours
    enableAuditLogging: true,
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

  // Check admin access
  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Admin access required for this page",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation('/');
      }, 500);
    }
  }, [user, isLoading, toast, setLocation]);

  const handleSave = () => {
    // In a real application, this would make an API call to save settings
    toast({
      title: "Settings Saved",
      description: "System settings have been updated successfully (demo mode)",
    });
  };

  const handleReset = () => {
    setSettings({
      siteName: "Knowledge Base Platform",
      siteDescription: "A comprehensive knowledge management solution",
      allowRegistration: true,
      requireEmailVerification: false,
      defaultUserRole: "user",
      maxFileSize: 10485760,
      allowedFileTypes: ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg",
      enableTeamsIntegration: false,
      teamsWebhookUrl: "",
      maintenanceMode: false,
      backupFrequency: "daily",
      sessionTimeout: 7200,
      enableAuditLogging: true,
    });
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults",
    });
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex h-screen pt-16">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-600">Configure system-wide settings and preferences.</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Site Name</label>
                    <Input
                      value={settings.siteName}
                      onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                      placeholder="Knowledge Base Platform"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Site Description</label>
                    <Textarea
                      value={settings.siteDescription}
                      onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                      placeholder="A comprehensive knowledge management solution"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Maintenance Mode</label>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* User Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow Registration</label>
                    <Switch
                      checked={settings.allowRegistration}
                      onCheckedChange={(checked) => setSettings({...settings, allowRegistration: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Require Email Verification</label>
                    <Switch
                      checked={settings.requireEmailVerification}
                      onCheckedChange={(checked) => setSettings({...settings, requireEmailVerification: checked})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Default User Role</label>
                    <Select value={settings.defaultUserRole} onValueChange={(value) => setSettings({...settings, defaultUserRole: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Session Timeout (seconds)</label>
                    <Input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                      placeholder="7200"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* File Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="h-5 w-5 mr-2" />
                    File Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max File Size (bytes)</label>
                    <Input
                      type="number"
                      value={settings.maxFileSize}
                      onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                      placeholder="10485760"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {(settings.maxFileSize / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Allowed File Types</label>
                    <Input
                      value={settings.allowedFileTypes}
                      onChange={(e) => setSettings({...settings, allowedFileTypes: e.target.value})}
                      placeholder=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Comma-separated list of file extensions
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Integration Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Integration Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Enable Teams Integration</label>
                    <Switch
                      checked={settings.enableTeamsIntegration}
                      onCheckedChange={(checked) => setSettings({...settings, enableTeamsIntegration: checked})}
                    />
                  </div>
                  {settings.enableTeamsIntegration && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Teams Webhook URL</label>
                      <Input
                        value={settings.teamsWebhookUrl}
                        onChange={(e) => setSettings({...settings, teamsWebhookUrl: e.target.value})}
                        placeholder="https://your-teams-webhook-url.com"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Monitoring */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    System Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Backup Frequency</label>
                      <Select value={settings.backupFrequency} onValueChange={(value) => setSettings({...settings, backupFrequency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Enable Audit Logging</label>
                      <Switch
                        checked={settings.enableAuditLogging}
                        onCheckedChange={(checked) => setSettings({...settings, enableAuditLogging: checked})}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">99.9%</div>
                      <div className="text-sm text-gray-600">Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">2.3 GB</div>
                      <div className="text-sm text-gray-600">Storage Used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">156</div>
                      <div className="text-sm text-gray-600">Active Sessions</div>
                    </div>
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