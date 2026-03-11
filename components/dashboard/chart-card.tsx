"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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
} from "recharts";

export interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
}

interface ChartCardProps {
  title: string;
  description?: string;
  type: "bar" | "horizontal-bar" | "donut" | "line" | "area";
  data: ChartDataItem[];
  showLegend?: boolean;
  className?: string;
  height?: number;
}

const COLORS = [
  "var(--primary)",
  "var(--secondary)",
  "var(--chart-blue)",
  "var(--chart-purple)",
  "var(--chart-orange)",
  "var(--chart-pink)",
  "var(--chart-cyan)",
  "var(--chart-yellow)",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-paper rounded-lg p-3 shadow-custom">
        <p className="text-label font-medium">{label || payload[0].payload.label}</p>
        <p className="text-body text-primary">{payload[0].value}</p>
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
  // Transform data for recharts
  const chartData = data.map((item, index) => ({
    name: item.label,
    value: item.value,
    fill: item.color || COLORS[index % COLORS.length],
  }));

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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--very-dark-color)" strokeOpacity={0.1} />
              <XAxis type="number" tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {type === "horizontal-bar" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--very-dark-color)" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {type === "donut" && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
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
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--very-dark-color)" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
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
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--very-dark-color)" strokeOpacity={0.1} />
              <XAxis dataKey="name" tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--very-dark-color)", opacity: 0.6, fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
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
      </div>
    </motion.div>
  );
}
