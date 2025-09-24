'use client';

import { SignUp } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconBattery, IconShield, IconUser } from '@tabler/icons-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Company Branding */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <IconBattery className="h-8 w-8 text-blue-600" />
              <CardTitle className="text-2xl font-bold text-gray-900">
                Join E-Wheels
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Create your account to access the Battery Service Management System
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SignUp 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none border-0 bg-transparent",
                },
              }}
              afterSignUpUrl="/auth/assign-role"
              redirectUrl="/auth/assign-role"
            />
          </CardContent>
        </Card>
        
        {/* Role Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-blue-800">
              <div className="font-medium mb-3">After Registration</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-left">
                  <IconUser className="h-4 w-4" />
                  <span>Default role: <span className="font-medium">Technician</span></span>
                </div>
                <div className="flex items-center gap-2 text-left">
                  <IconShield className="h-4 w-4" />
                  <span>Admin approval may be required for full access</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
