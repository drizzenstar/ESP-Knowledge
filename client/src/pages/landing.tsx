import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-blue-600">
      <div className="max-w-md w-full mx-4">
        <Card className="shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="text-white h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
              <p className="text-gray-600 mt-2">Enterprise Knowledge Management</p>
            </div>
            
            <div className="space-y-4">
              <Button 
                className="w-full"
                onClick={() => setLocation('/auth')}
              >
                Sign In to Continue
              </Button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Access your team's knowledge base with secure authentication
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
