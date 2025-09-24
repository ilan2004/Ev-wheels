'use client';

import { SignIn } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconBattery } from '@tabler/icons-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Company Branding */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <IconBattery className="h-8 w-8 text-blue-600" />
              <CardTitle className="text-2xl font-bold text-gray-900">
                E-Wheels
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Battery Service Management System
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none border-0 bg-transparent",
                },
              }}
              afterSignInUrl="/dashboard"
              redirectUrl="/dashboard"
            />
          </CardContent>
        </Card>
        
        {/* Additional Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-blue-800">
              <div className="font-medium mb-2">Access Information</div>
              <div className="space-y-1">
                <p><span className="font-medium">Admin:</span> Full system access</p>
                <p><span className="font-medium">Technician:</span> Battery & customer management</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
