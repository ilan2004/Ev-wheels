'use client';

import React from 'react';
import PageContainer from '@/components/layout/page-container';
import { SectionHeader } from '@/components/layout/section-header';
import { ImprovedJobCardForm } from '@/components/job-cards/improved-job-card-form';
import { useRequireAuth } from '@/lib/auth/use-require-auth';

export default function NewImprovedJobCardPage() {
  // Require an authenticated session to create tickets
  useRequireAuth();

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <SectionHeader
          title="Create Job Card (Enhanced)"
          description="Improved job card creation with support for vehicles, batteries, or both with smart media categorization."
        />
        
        <ImprovedJobCardForm />
      </div>
    </PageContainer>
  );
}
