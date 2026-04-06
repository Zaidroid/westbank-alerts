import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { Stats } from "@/lib/api";

interface StatsViewProps {
  stats?: Stats | null;
}

export function StatsView({ stats }: StatsViewProps) {
  const { t } = useLang();

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading stats...
      </div>
    );
  }

  const severityData = stats.by_severity
    ? Object.entries(stats.by_severity).map(([severity, count]) => ({ severity, count }))
    : [];

  const typeData = stats.by_type
    ? Object.entries(stats.by_type).map(([type, count]) => ({ type, count }))
    : [];

  const areaData = stats.by_area
    ? Object.entries(stats.by_area).map(([area, count]) => ({ area, count }))
    : [];

  const translatedSeverityStats = severityData.map(s => ({
    ...s,
    label: t[s.severity as keyof typeof t] || s.severity
  }));

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "hsl(var(--destructive))";
      case "high": return "hsl(var(--chart-2))";
      case "medium": return "hsl(var(--chart-3))";
      case "low": return "hsl(var(--chart-4))";
      default: return "hsl(var(--muted))";
    }
  };

  const getAreaColor = (index: number) => {
    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))", "hsl(var(--muted-foreground))"];
    return colors[index % colors.length];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1 pb-4">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2 border-b border-border/50">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            {t.alertsBySeverity}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 h-[220px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={translatedSeverityStats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" hide />
              <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={80} style={{ textTransform: "capitalize" }} />
              <RechartsTooltip 
                cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px", fontFamily: "var(--app-font-mono)" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                {translatedSeverityStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2 border-b border-border/50">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-muted-foreground" />
            {t.alertsByType}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 h-[220px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                nameKey="type"
                stroke="none"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getAreaColor(index)} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px", fontFamily: "var(--app-font-mono)" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend 
                verticalAlign="middle" 
                align="right"
                layout="vertical"
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm md:col-span-2">
        <CardHeader className="pb-2 border-b border-border/50">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            {t.alertsByRegion}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 h-[220px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="area" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <RechartsTooltip 
                cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px", fontFamily: "var(--app-font-mono)" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                {areaData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}