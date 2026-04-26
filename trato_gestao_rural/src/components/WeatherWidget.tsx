import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cloud, Droplets, Wind, Thermometer, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchWeather, getWeatherInfo, calculateTHI, getTHIStatus, generateAlerts,
  DEFAULT_FARM_LOCATIONS,
  type WeatherData,
} from "@/lib/weather-service";
import { useFazenda } from "@/contexts/FazendaContext";

export function WeatherWidget() {
  const navigate = useNavigate();
  const { activeFazenda } = useFazenda();
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loc = DEFAULT_FARM_LOCATIONS.find((l) => l.farmId === activeFazenda?.id) || DEFAULT_FARM_LOCATIONS[0];

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchWeather(loc.lat, loc.lon)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loc.lat, loc.lon]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Cloud className="h-4 w-4" /> Clima</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-24" />
          <div className="flex gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-14" />)}</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-4 text-center text-sm text-muted-foreground">
          <Cloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          Não foi possível carregar o clima
        </CardContent>
      </Card>
    );
  }

  const info = getWeatherInfo(data.current.weathercode);
  const todayHumidity = data.hourly[0]?.humidity || 60;
  const thi = calculateTHI(data.current.temperature, todayHumidity);
  const thiStatus = getTHIStatus(thi);
  const todayPrecip = data.daily[0]?.precipitationSum || 0;
  const alerts = generateAlerts(data);
  const next5 = data.daily.slice(1, 6);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" /> Clima — {loc.farmName}
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-6" onClick={() => navigate("/fazenda/clima")}>
            Ver completo <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{info.icon}</span>
            <div>
              <p className="text-3xl font-bold text-foreground">{Math.round(data.current.temperature)}°C</p>
              <p className="text-xs text-muted-foreground">{info.label}</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Droplets className="h-3 w-3" /> {todayHumidity}%</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Wind className="h-3 w-3" /> {Math.round(data.current.windspeed)} km/h</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Droplets className="h-3 w-3" /> {todayPrecip.toFixed(1)} mm</p>
          </div>
        </div>

        {/* THI */}
        <Badge className={`text-[10px] ${thiStatus.color}`}>
          {thiStatus.icon} THI {thi.toFixed(0)} — {thiStatus.label}
        </Badge>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-1">
            {alerts.slice(0, 2).map((a, i) => (
              <div key={i} className="flex items-start gap-2 p-1.5 rounded-md bg-muted/50">
                <span className="text-sm">{a.icon}</span>
                <p className="text-[11px] text-muted-foreground leading-snug"><strong>{a.title}:</strong> {a.message.slice(0, 80)}…</p>
              </div>
            ))}
          </div>
        )}

        {/* 5-day mini forecast */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {next5.map((d) => {
            const dayInfo = getWeatherInfo(d.weathercode);
            const dayName = new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short" });
            return (
              <div key={d.date} className="flex flex-col items-center min-w-[52px] p-1.5 rounded-lg bg-muted/40">
                <span className="text-[10px] text-muted-foreground capitalize">{dayName}</span>
                <span className="text-lg">{dayInfo.icon}</span>
                <span className="text-[10px] font-medium">{Math.round(d.tempMax)}°</span>
                <span className="text-[10px] text-muted-foreground">{Math.round(d.tempMin)}°</span>
                {d.precipitationProbMax > 30 && (
                  <span className="text-[9px] text-blue-600">{d.precipitationProbMax}%</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
