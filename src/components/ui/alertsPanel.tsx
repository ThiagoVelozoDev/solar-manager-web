import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scrollArea";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export interface Alert {
  id: string;
  plantName: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
}

export function AlertsPanel({ alerts, onDismiss }: AlertsPanelProps) {
  const alertConfig = {
    critical: {
      icon: AlertCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900',
      label: 'Crítico',
    },
    warning: {
      icon: AlertTriangle,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-900',
      label: 'Atenção',
    },
    info: {
      icon: Info,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      label: 'Info',
    },
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">Alertas e Alarmes</CardTitle>
          <Badge variant="outline" className="text-xs sm:text-sm w-fit">
            {alerts.length} ativos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden px-4 sm:px-6">
        <ScrollArea className="h-full pr-2 sm:pr-4">
          <div className="space-y-2 sm:space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Info className="size-8 sm:size-12 mx-auto mb-2 text-gray-300" />
                <p className="text-xs sm:text-sm">Nenhum alerta ativo</p>
              </div>
            ) : (
              alerts.map((alert) => {
                const config = alertConfig[alert.type];
                const Icon = config.icon;
                
                return (
                  <div
                    key={alert.id}
                    className={`p-2 sm:p-4 rounded-lg border ${config.bgColor} ${config.borderColor} relative`}
                  >
                    <div className="flex gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg ${config.color} flex-shrink-0 h-fit`}>
                        <Icon className="size-3 sm:size-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            <span className="truncate max-w-[100px] sm:max-w-none">{alert.plantName}</span>
                          </Badge>
                          <Badge className={`${config.color} text-white text-xs whitespace-nowrap`}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className={`text-xs sm:text-sm ${config.textColor} mb-1 line-clamp-2`}>
                          {alert.message}
                        </p>
                        <span className="text-xs text-gray-500">
                          {alert.timestamp}
                        </span>
                      </div>
                      {onDismiss && (
                        <button
                          onClick={() => onDismiss(alert.id)}
                          className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
                        >
                          <X className="size-3 sm:size-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}