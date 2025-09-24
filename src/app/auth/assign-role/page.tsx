'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, IconBattery, IconShield, IconUser } from '@tabler/icons-react';
import { UserRole, DEFAULT_USER_ROLE, getRoleDisplayName } from '@/lib/auth/utils';
import { toast } from 'sonner';

export default function AssignRolePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    // Check if user already has a role assigned
    if (user?.publicMetadata?.role) {
      router.push('/dashboard');
      return;
    }
  }, [user, isLoaded, router]);

  const assignDefaultRole = async () => {
    if (!user) return;

    setIsAssigning(true);
    try {
      // Update user metadata with default role
      await user.update({
        publicMetadata: {
          ...user.publicMetadata,
          role: DEFAULT_USER_ROLE,
          hireDate: new Date().toISOString().split('T')[0],
          department: 'Technical Services'
        }
      });

      toast.success('Role assigned successfully! Redirecting to dashboard...');
      
      // Wait a moment for the update to propagate
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role. Please try again or contact support.');
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to sign-in
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Welcome Message */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <IconBattery className="h-8 w-8 text-blue-600" />
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome to E-Wheels
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Let's set up your account to get you started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">
                Hello, <span className="font-medium">{user.firstName || user.emailAddresses[0]?.emailAddress}</span>
              </div>
              <p className="text-sm text-gray-500">
                We're assigning you the default role to get you started. An administrator can update your permissions later if needed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShield className="h-5 w-5 text-blue-600" />
              Your Role Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <IconUser className="h-6 w-6 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">
                  {getRoleDisplayName(DEFAULT_USER_ROLE)}
                </div>
                <div className="text-sm text-blue-700">
                  Access to battery and customer management
                </div>
              </div>
              <Badge variant="secondary" className="ml-auto">
                Default
              </Badge>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <div className="font-medium mb-1">What you can do:</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>View and manage battery records</li>
                <li>View customer information</li>
                <li>Generate quotations</li>
                <li>Print labels and QR codes</li>
                <li>Update inventory</li>
              </ul>
            </div>

            <Button 
              onClick={assignDefaultRole} 
              disabled={isAssigning}
              className="w-full"
              size="lg"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up your account...
                </>
              ) : (
                'Continue to Dashboard'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-yellow-800">
              <div className="font-medium mb-2">Need different permissions?</div>
              <p>Contact your administrator to request additional access or role changes.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
