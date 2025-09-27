export interface Customer {
  id: string;
  name: string;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  gst_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerInput {
  name: string;
  contact?: string;
  email?: string;
  address?: string;
  gst_number?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

