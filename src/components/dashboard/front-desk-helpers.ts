export function hashString(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h);
}

const CUSTOMER_VARIANTS = [
  { accent: 'bg-emerald-500', hover: 'hover:bg-emerald-50', border: 'border-emerald-200' },
  { accent: 'bg-blue-500', hover: 'hover:bg-blue-50', border: 'border-blue-200' },
  { accent: 'bg-violet-500', hover: 'hover:bg-violet-50', border: 'border-violet-200' },
  { accent: 'bg-amber-500', hover: 'hover:bg-amber-50', border: 'border-amber-200' },
  { accent: 'bg-rose-500', hover: 'hover:bg-rose-50', border: 'border-rose-200' },
  { accent: 'bg-cyan-500', hover: 'hover:bg-cyan-50', border: 'border-cyan-200' },
  { accent: 'bg-lime-500', hover: 'hover:bg-lime-50', border: 'border-lime-200' }
] as const;

export function getCustomerVariant(key: string) {
  const idx = hashString(key) % CUSTOMER_VARIANTS.length;
  return CUSTOMER_VARIANTS[idx];
}

const TICKET_STATUS_VARIANTS: Record<string, { accent: string; hover: string; border: string }> = {
  reported: { accent: 'bg-sky-500', hover: 'hover:bg-sky-50', border: 'border-sky-200' },
  triaged: { accent: 'bg-amber-500', hover: 'hover:bg-amber-50', border: 'border-amber-200' },
  in_progress: { accent: 'bg-violet-500', hover: 'hover:bg-violet-50', border: 'border-violet-200' },
  waiting_approval: { accent: 'bg-yellow-500', hover: 'hover:bg-yellow-50', border: 'border-yellow-200' },
  on_hold: { accent: 'bg-zinc-500', hover: 'hover:bg-zinc-50', border: 'border-zinc-200' },
  completed: { accent: 'bg-green-600', hover: 'hover:bg-green-50', border: 'border-green-200' },
  delivered: { accent: 'bg-emerald-600', hover: 'hover:bg-emerald-50', border: 'border-emerald-200' },
  closed: { accent: 'bg-slate-500', hover: 'hover:bg-slate-50', border: 'border-slate-200' },
  cancelled: { accent: 'bg-rose-600', hover: 'hover:bg-rose-50', border: 'border-rose-200' }
};

const DEFAULT_TICKET_VARIANT = {
  accent: 'bg-indigo-500',
  hover: 'hover:bg-indigo-50',
  border: 'border-indigo-200'
} as const;

export function getTicketVariant(status?: string | null) {
  if (!status) return DEFAULT_TICKET_VARIANT;
  return TICKET_STATUS_VARIANTS[status] ?? DEFAULT_TICKET_VARIANT;
}

