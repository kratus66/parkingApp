'use client';

import { useEffect, useState } from 'react';
import { dashboardService, DashboardStats } from './dashboardService';

/**
 * Hook personalizado para manejar los datos del dashboard
 * Actualiza automáticamente cada 30 segundos
 */
export const useDashboardData = (parkingLotId?: string) => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const stats = await dashboardService.getStats(parkingLotId);
      setData(stats);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [parkingLotId]);

  return { data, loading, error, refetch: fetchData };
};
