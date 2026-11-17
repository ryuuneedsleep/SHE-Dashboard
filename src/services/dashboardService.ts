/**
 * SPLD SAFETY - Production Dashboard Service
 * Fetches real aggregated analytics & KPIs from Express / Neon backend
 */

import type { DashboardData, DashboardFilters } from '../types/dashboard.ts';

export const dashboardService = {
  /**
   * Fetch complete aggregated dashboard data
   */
  async getDashboardData(filters?: DashboardFilters): Promise<DashboardData> {
    const params = new URLSearchParams();

    if (filters?.department && filters.department !== 'ALL') {
      params.set('department', filters.department);
    }
    if (filters?.operationalArea && filters.operationalArea !== 'ALL') {
      params.set('operational_area', filters.operationalArea);
    }
    if (filters?.startDate) {
      params.set('from_date', filters.startDate);
    }
    if (filters?.endDate) {
      params.set('to_date', filters.endDate);
    }

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/v1/dashboard${queryStr}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });

    const payload = await res.json();
    if (!res.ok || !payload.success || !payload.data) {
      throw new Error(payload.message || 'Gagal memuat data dashboard.');
    }

    return payload.data;
  },
};

export default dashboardService;
