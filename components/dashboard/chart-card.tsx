"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/theme-provider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

export interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
}

interface ChartCardProps {
  title: string;
  description?: string;
  type: "bar" | "horizontal-bar" | "donut" | "line" | "area" | "geo";
  data: ChartDataItem[];
  showLegend?: boolean;
  className?: string;
  height?: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: unknown[];
  label?: string | number;
}) => {
  const formatTooltipValue = (value: number): string => {
    if (!Number.isFinite(value)) {
      return "0.00";
    }
    if (Number.isInteger(value)) {
      return value.toLocaleString();
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const firstPayload = Array.isArray(payload) && payload.length > 0
    ? (payload[0] as { value?: number; payload?: { label?: string } })
    : null;
  if (active && firstPayload) {
    return (
      <div className="bg-paper rounded-lg p-3 shadow-custom">
        <p className="text-label font-medium">{String(label || firstPayload.payload?.label || "Item")}</p>
        <p className="text-body text-primary">{formatTooltipValue(firstPayload.value ?? 0)}</p>
      </div>
    );
  }
  return null;
};

export function ChartCard({
  title,
  description,
  type,
  data,
  showLegend = true,
  className,
  height = 300,
}: ChartCardProps) {
  const { resolvedTheme } = useTheme();
  const colors =
    resolvedTheme === "dark"
      ? ["#1ed760", "#6b7280", "#7aa2d6", "#9a88c5", "#d9a06e", "#c987ab", "#6bb8c4", "#c7b36a"]
      : ["#1db954", "#9ca3af", "#3b82f6", "#8b5cf6", "#f97316", "#ec4899", "#06b6d4", "#f59e0b"];

  // Transform data for recharts
  const chartData = data.map((item, index) => ({
    name: item.label,
    value: item.value,
    fill: item.color || colors[index % colors.length],
  }));
  const geoData = data.map((item, index) => {
    const [latRaw = "0", lngRaw = "0"] = item.label.split(",").map((part) => part.trim());
    return {
      label: item.label,
      name: item.label,
      lat: Number(latRaw),
      lng: Number(lngRaw),
      value: item.value,
      fill: item.color || colors[index % colors.length],
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-paper rounded-lg shadow-custom p-6", className)}
    >
      <div className="mb-4">
        <h3 className="text-h5">{title}</h3>
        {description && (
          <p className="text-caption text-[var(--very-dark-color)]/60">{description}</p>
        )}
      </div>

      <div style={{ height }}>
        {type === "bar" && (
          <ResponsiveContainer key={`bar-${resolvedTheme}`} width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--very-dark-color)" strokeOpacity={0.1} />
              <XAxis type="number" tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {type === "horizontal-bar" && (
          <ResponsiveContainer key={`hbar-${resolvedTheme}`} width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--very-dark-color)" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {type === "donut" && (
          <ResponsiveContainer key={`donut-${resolvedTheme}`} width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  formatter={(value) => (
                    <span style={{ color: "var(--very-dark-color)", fontSize: 12 }}>{value}</span>
                  )}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        )}

        {type === "line" && (
          <ResponsiveContainer key={`line-${resolvedTheme}`} width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--very-dark-color)" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "transparent" }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: "var(--primary)", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {type === "area" && (
          <ResponsiveContainer key={`area-${resolvedTheme}`} width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--very-dark-color)" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "transparent" }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {type === "geo" && (
          <ResponsiveContainer key={`geo-${resolvedTheme}`} width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--very-dark-color)" strokeOpacity={0.1} />
              <XAxis
                type="number"
                dataKey="lng"
                name="Longitude"
                domain={["auto", "auto"]}
                tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="lat"
                name="Latitude"
                domain={["auto", "auto"]}
                tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }}
              />
              <ZAxis type="number" dataKey="value" range={[60, 280]} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "transparent" }} />
              <Scatter data={geoData} fill="var(--primary)" stroke="none" />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
