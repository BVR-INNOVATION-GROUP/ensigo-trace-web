import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-body mb-2 font-bold">
          Analytics
        </h1>
        <p className="text-body">
          View your collection analytics and insights
        </p>
      </div>
    </DashboardLayout>
  );
}

