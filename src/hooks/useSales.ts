import { useState, useEffect } from "react";
import { SalesService } from "@/src/services/SalesService";
import type { Sale } from "@/src/models/Sale";

export function useSales(nurseryId: string) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    paidSales: 0,
  });
  const [loading, setLoading] = useState(false);
  const salesService = new SalesService();

  const loadSales = async () => {
    setLoading(true);
    try {
      const allSales = await salesService.getAllSales(nurseryId);
      setSales(allSales);
      const salesStats = await salesService.getSalesStats(nurseryId);
      setStats(salesStats);
    } catch (error) {
      console.error("Failed to load sales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [nurseryId]);

  return { sales, stats, loading, loadSales };
}





