import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StatsGrid({ stats }: {
  stats: { label: string; value: string; icon: any }[]
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
        <Card key={idx} className="border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </CardTitle>
            <div className="p-2 bg-secondary rounded-lg text-secondary-foreground transition-colors">
              <stat.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
