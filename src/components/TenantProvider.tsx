'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Tenant, TenantBranding } from '@/types/database';

interface TenantContextValue {
  id: string;
  slug: string;
  name: string;
  branding: TenantBranding;
  isActive: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: TenantContextValue;
  children: ReactNode;
}) {
  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}

export function useTenantOptional(): TenantContextValue | null {
  return useContext(TenantContext);
}
