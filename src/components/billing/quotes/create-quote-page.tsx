'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { QuoteForm } from './quote-form';
import { CreateQuoteFormData } from '@/lib/billing/schemas';
import { billingRepository } from '@/lib/billing/repository';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { IconArrowLeft } from '@tabler/icons-react';
import { toast } from 'sonner';

export function CreateQuotePage() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateQuoteFormData) => {
    if (!user) {
      toast.error('You must be logged in to create a quote');
      return;
    }

    try {
      setLoading(true);
      await billingRepository.createQuote(data, user.id);
      toast.success('Quote created successfully');
      router.push('/dashboard/quotes');
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to create quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/quotes');
  };

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="h-8 w-8 p-0"
          >
            <IconArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Create Quote</h1>
            <p className="text-muted-foreground">
              Create a new sales quote for your customer.
            </p>
          </div>
        </div>

        {/* Quote Form */}
        <QuoteForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          mode="create"
        />
      </div>
    </PageContainer>
  );
}
