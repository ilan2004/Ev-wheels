// API contract and export for Customers
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput
} from '@/lib/types/customers';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ListCustomersParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CustomersApiContract {
  list(params?: ListCustomersParams): Promise<ApiResponse<Customer[]>>;
  getById(id: string): Promise<ApiResponse<Customer | null>>;
  create(input: CreateCustomerInput): Promise<ApiResponse<Customer>>;
  update(
    id: string,
    input: UpdateCustomerInput
  ): Promise<ApiResponse<Customer>>;
  remove(id: string): Promise<ApiResponse<boolean>>;
  merge(
    sourceId: string,
    targetId: string
  ): Promise<ApiResponse<{ merged: boolean }>>;
}

import { customersSupabaseRepository } from './customers.supabase';

export const customersApi: CustomersApiContract = customersSupabaseRepository;
export type { Customer, CreateCustomerInput, UpdateCustomerInput };
