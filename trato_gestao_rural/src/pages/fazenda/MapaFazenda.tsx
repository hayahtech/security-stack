import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { MapPin, Layers, Navigation, Plus, X, Eye, EyeOff, Beef, Factory, Thermometer, AlertTriangle, ClipboardList, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, LayersControl, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { mockAnimals } from "@/data/rebanho-mock";
import { mockPropriedade, mockBenfeitorias, CATEGORIA_ICONS } from "@/data/propriedades-mock";

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── Types ──
interface PasturePolygon {
  id: string;
  pastureId: string;
  name: string;
  coords: [number, number][];
  status: "descanso" | "normal" | "alta" | "superlotado" | "reforma";
  animais: number;
  capacidade: number;
  areaHa: number;
  tipo: string;
  funcao: string;
  diasDescanso: number;
  ultimaEntrada: string;
}

interface InfraMarker {
  id: string;
  type: string;
  icon: string;
  name: string;
  lat: number;
  lng: number;
  notes: string;
  categoria: string;
}

// ── Mock pasture polygons around Fazenda Boa Vista coords ──
const CENTER: [number, number] = [mockPropriedade.latitude, mockPropriedade.longitude];

const mockPasturePolygons: PasturePolygon[] = [
  {
    id: "pp-1", pastureId: "pas-1", name: "Pasto Norte", status: "normal",
    animais: 18, capacidade: 38, areaHa: 25, tipo: "Braquiária", funcao: "Engorda",
    diasDescanso: 0, ultimaEntrada: "2026-02-15",
    coords: [[-19.738, -47.938], [-19.738, -47.930], [-19.742, -47.930], [-19.742, -47.938]],
  },
  {
    id: "pp-2", pastureId: "pas-2", name: "Pasto Sul", status: "alta",
    animais: 28, capacidade: 40, areaHa: 30, tipo: "Mombaça", funcao: "Reprodução",
    diasDescanso: 0, ultimaEntrada: "2026-02-20",
    coords: [[-19.752, -47.938], [-19.752, -47.928], [-19.757, -47.928], [-19.757, -47.938]],
  },
  {
    id: "pp-3", pastureId: "pas-3", name: "Pasto Leste", status: "descanso",
    animais: 0, capacidade: 25, areaHa: 18, tipo: "Tifton 85", funcao: "Cria",
    diasDescanso: 12, ultimaEntrada: "2026-02-01",
    coords: [[-19.744, -47.925], [-19.744, -47.920], [-19.748, -47.920], [-19.748, -47.925]],
  },
  {
    id: "pp-4", pastureId: "pas-4", name: "Pasto Grande", status: "normal",
    animais: 35, capacidade: 60, areaHa: 45, tipo: "Tanzânia", funcao: "Recria",
    diasDescanso: 0, ultimaEntrada: "2026-03-01",
    coords: [[-19.742, -47.940], [-19.742, -47.946], [-19.750, -47.946], [-19.750, -47.940]],
  },
  {
    id: "pp-5", pastureId: "pas-5", name: "Piquete Maternidade", status: "normal",
    animais: 5, capacidade: 8, areaHa: 5, tipo: "Coast Cross", funcao: "Cria",
    diasDescanso: 0, ultimaEntrada: "2026-03-05",
    coords: [[-19.748, -47.932], [-19.748, -47.929], [-19.750, -47.929], [-19.750, -47.932]],
  },
  {
    id: "pp-6", pastureId: "pas-7", name: "Curral Quarentena", status: "reforma",
    animais: 2, capacidade: 10, areaHa: 0.3, tipo: "Outro", funcao: "Quarentena",
    diasDescanso: 0, ultimaEntrada: "2026-03-06",
    coords: [[-19.746, -47.931], [-19.746, -47.930], [-19.747, -47.930], [-19.747, -47.931]],
  },
  {
    id: "pp-7", pastureId: "pas-8", name: "Confinamento", status: "superlotado",
    animais: 95, capacidade: 100, areaHa: 2, tipo: "Outro", funcao: "Engorda",
    diasDescanso: 0, ultimaEntrada: "2026-03-07",
    coords: [[-19.750, -47.934], [-19.750, -47.931], [-19.752, -47.931], [-19.752, -47.934]],
  },
];

const mockInfraMarkers: InfraMarker[] = [
  { id: "im-1", type: "Casa sede", icon: "🏠", name: "Casa Sede", lat: -19.7472, lng: -47.9318, notes: "Sede principal reformada em 2020", categoria: "residencial" },
  { id: "im-2", type: "Curral", icon: "🐄", name: "Curral Principal", lat: -19.7460, lng: -47.9305, notes: "Capacidade 500 cabeças", categoria: "pecuaria" },
  { id: "im-3", type: "Balança", icon: "⚖️", name: "Balança Digital", lat: -19.7462, lng: -47.9302, notes: "Coimma 2.000 kg", categoria: "pecuaria" },
  { id: "im-4", type: "Açude", icon: "💧", name: "Açude Principal", lat: -19.7500, lng: -47.9360, notes: "3.5 ha de espelho d'água", categoria: "hidrico" },
  { id: "im-5", type: "Poço artesiano", icon: "💧", name: "Poço Artesiano 1", lat: -19.7455, lng: -47.9330, notes: "15 m³/h — profundidade 120m", categoria: "hidrico" },
  { id: "im-6", type: "Galpão", icon: "🌾", name: "Galpão de Insumos", lat: -19.7468, lng: -47.9325, notes: "400 m²", categoria: "armazenagem" },
  { id: "im-7", type: "Oficina", icon: "⚙️", name: "Oficina Mecânica", lat: -19.7475, lng: -47.9310, notes: "150 m²", categoria: "operacional" },
  { id: "im-8", type: "Posto de combustível", icon: "⛽", name: "Tanque Diesel", lat: -19.7478, lng: -47.9308, notes: "5.000 litros", categoria: "operacional" },
];

const INFRA_MARKER_TYPES = [
  { icon: "🏠", label: "Sede / Casa sede" },
  { icon: "🐄", label: "Curral / Brete / Tronco" },
  { icon: "⚖️", label: "Balança" },
  { icon: "💧", label: "Bebedouro / Açude / Rio" },
  { icon: "🌾", label: "Silo / Paiol" },
  { icon: "⛽", label: "Tanque de combustível" },
  { icon: "🔌", label: "Casa de força / Gerador" },
  { icon: "🌡️", label: "Estação meteorológica" },
];

// ── Fazendas para multi-fazenda ──
const FAZENDAS = [
  { id: "faz-1", nome: "Fazenda Boa Vista", lat: -19.7472, lng: -47.9318, municipio: "Uberaba — MG" },
  { id: "faz-2", nome: "Fazenda São José", lat: -19.8100, lng: -47.8900, municipio: "Sacramento — MG" },
  { id: "faz-3", nome: "Retiro dos Lagos", lat: -19.6800, lng: -47.9700, municipio: "Nova Ponte — MG" },
];

// ── Helpers ──
function statusColor(s: PasturePolygon["status"]): string {
  switch (s) {
    case "descanso": return "#166534";
    case "normal": return "#4ade80";
    case "alta": return "#facc15";
    case "superlotado": return "#ef4444";
    case "reforma": return "#9ca3af";
  }
}

function statusLabel(s: PasturePolygon["status"]): string {
  switch (s) {
    case "descanso": return "Em descanso";
    case "normal": return "Lotação normal";
    case "alta": return "Lotação alta";
    case "superlotado": return "Superlotado";
    case "reforma": return "Em reforma";
  }
}

function createEmojiIcon(emoji: string) {
  return L.divIcon({
    html: `<div style="font-size:24px;line-height:1;text-align:center;filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.5))">${emoji}</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createAnimalClusterIcon(count: number) {
  return L.divIcon({
    html: `<div style="background:#16a34a;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🐄${count}</div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

// ── Map sub-components ──
function LocateButton() {
  const map = useMap();
  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 16 });
    map.on("locationfound", (e) => {
      L.marker(e.latlng).addTo(map).bindPopup("📍 Sua localização").openPopup();
    });
    map.on("locationerror", () => {
      toast({ title: "Não foi possível obter localização", variant: "destructive" });
    });
  };
  return (
    <div className="leaflet-top leaflet-right" style={{ top: 80 }}>
      <div className="leaflet-control">
        <Button size="sm" variant="secondary" onClick={handleLocate} className="shadow-md gap-1" title="Minha localização">
          <Navigation className="h-4 w-4" /> Minha localização
        </Button>
      </div>
    </div>
  );
}

function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 1 }); }, [center, zoom, map]);
  return null;
}

// ── Drawing mode component ──
function DrawingMode({ onFinish }: { onFinish: (coords: [number, number][]) => void }) {
  const [points, setPoints] = useState<[number, number][]>([]);
  
  useMapEvents({
    click(e) {
      setPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    },
  });

  return (
    <>
      {points.length >= 3 && (
        <Polygon positions={points} pathOptions={{ color: "#3b82f6", weight: 2, dashArray: "5,5", fillOpacity: 0.2 }} />
      )}
      {points.map((p, i) => (
        <Marker key={i} position={p} icon={L.divIcon({ html: `<div style="background:#3b82f6;color:white;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;border:2px solid white">${i + 1}</div>`, className: "", iconSize: [20, 20], iconAnchor: [10, 10] })} />
      ))}
      <div className="leaflet-bottom leaflet-left" style={{ bottom: 20 }}>
        <div className="leaflet-control flex gap-2">
          <Button size="sm" variant="destructive" onClick={() => { setPoints([]); onFinish([]); }}>
            <X className="h-3.5 w-3.5 mr-1" /> Cancelar
          </Button>
          {points.length >= 3 && (
            <Button size="sm" onClick={() => onFinish(points)} className="gap-1">
              ✓ Finalizar ({points.length} pontos)
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main component ──
export default function MapaFazenda() {
  const [fazendaId, setFazendaId] = useState("faz-1");
  const [layers, setLayers] = useState({
    animais: true,
    infraestrutura: true,
    clima: false,
    alertas: false,
    atividades: false,
  });
  const [drawing, setDrawing] = useState(false);
  const [drawnCoords, setDrawnCoords] = useState<[number, number][] | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedPasture, setSelectedPasture] = useState<PasturePolygon | null>(null);
  const [showInfraForm, setShowInfraForm] = useState(false);
  const [infraName, setInfraName] = useState("");
  const [infraType, setInfraType] = useState(INFRA_MARKER_TYPES[0].label);
  const [infraNotes, setInfraNotes] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);

  const fazenda = FAZENDAS.find((f) => f.id === fazendaId) || FAZENDAS[0];
  const mapCenter: [number, number] = [fazenda.lat, fazenda.lng];
  const isAllView = fazendaId === "todas";

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDrawFinish = (coords: [number, number][]) => {
    setDrawing(false);
    if (coords.length >= 3) {
      setDrawnCoords(coords);
      setShowLinkDialog(true);
    }
  };

  const handleSavePolygon = () => {
    toast({ title: "Pasto delimitado!", description: "Polígono vinculado com sucesso." });
    setShowLinkDialog(false);
    setDrawnCoords(null);
  };

  const handleSaveInfra = () => {
    if (!infraName.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    toast({ title: "Marcador adicionado!", description: infraName });
    setShowInfraForm(false);
    setInfraName(""); setInfraNotes("");
  };

  // Pasture animal counts for cluster icons
  const pastureAnimalCentroids = useMemo(() => {
    return mockPasturePolygons.filter(p => p.animais > 0).map(p => {
      const lat = p.coords.reduce((s, c) => s + c[0], 0) / p.coords.length;
      const lng = p.coords.reduce((s, c) => s + c[1], 0) / p.coords.length;
      return { ...p, centroidLat: lat, centroidLng: lng };
    });
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 pb-2 border-b bg-background">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Mapa da Fazenda</h1>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Select value={fazendaId} onValueChange={setFazendaId}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FAZENDAS.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
              ))}
              <SelectItem value="todas">📍 Ver todas as fazendas</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowSidebar(!showSidebar)} className="gap-1">
            <Layers className="h-4 w-4" /> Camadas
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDrawing(!drawing)} className="gap-1" disabled={drawing}>
            <Plus className="h-4 w-4" /> Desenhar Pasto
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowInfraForm(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Marcador
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 border-r bg-card p-4 space-y-4 overflow-auto shrink-0">
            <h3 className="font-semibold text-sm text-foreground">Camadas</h3>
            <div className="space-y-3">
              {[
                { key: "animais" as const, icon: <Beef className="h-4 w-4" />, label: "Animais" },
                { key: "infraestrutura" as const, icon: <Factory className="h-4 w-4" />, label: "Infraestrutura" },
                { key: "clima" as const, icon: <Thermometer className="h-4 w-4" />, label: "Clima" },
                { key: "alertas" as const, icon: <AlertTriangle className="h-4 w-4" />, label: "Alertas" },
                { key: "atividades" as const, icon: <ClipboardList className="h-4 w-4" />, label: "Atividades" },
              ].map(({ key, icon, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    {icon} {label}
                  </div>
                  <Switch checked={layers[key]} onCheckedChange={() => toggleLayer(key)} />
                </div>
              ))}
            </div>

            <Separator />

            <h3 className="font-semibold text-sm text-foreground">Legenda — Pastos</h3>
            <div className="space-y-1.5">
              {[
                { color: "#166534", label: "Em descanso" },
                { color: "#4ade80", label: "Lotação normal" },
                { color: "#facc15", label: "Lotação alta" },
                { color: "#ef4444", label: "Superlotado" },
                { color: "#9ca3af", label: "Em reforma" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                  {label}
                </div>
              ))}
            </div>

            <Separator />

            <h3 className="font-semibold text-sm text-foreground">Pastos</h3>
            <div className="space-y-1.5 max-h-64 overflow-auto">
              {mockPasturePolygons.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPasture(p)}
                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors"
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColor(p.status) }} />
                  <span className="truncate text-foreground">{p.name}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] shrink-0">{p.animais}</Badge>
                </button>
              ))}
            </div>

            <Separator />

            <h3 className="font-semibold text-sm text-foreground">Infraestrutura</h3>
            <div className="space-y-1 max-h-40 overflow-auto">
              {mockInfraMarkers.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-1">
                  <span>{m.icon}</span>
                  <span className="truncate">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={mapCenter}
            zoom={isAllView ? 10 : 15}
            className="w-full h-full"
            style={{ zIndex: 1 }}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="🛰️ Satélite">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Esri"
                  maxZoom={19}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="🗺️ Mapa">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                  maxZoom={19}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="🌿 Terreno">
                <TileLayer
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  attribution='OpenTopoMap'
                  maxZoom={17}
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <FlyTo center={isAllView ? [-19.75, -47.93] : mapCenter} zoom={isAllView ? 11 : 15} />
            <LocateButton />

            {/* Pasture polygons */}
            {mockPasturePolygons.map((p) => (
              <Polygon
                key={p.id}
                positions={p.coords}
                pathOptions={{
                  color: statusColor(p.status),
                  weight: 3,
                  fillColor: statusColor(p.status),
                  fillOpacity: 0.35,
                }}
                eventHandlers={{
                  click: () => setSelectedPasture(p),
                }}
              >
                <Popup>
                  <div className="min-w-[220px]">
                    <p className="font-bold text-sm">{p.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor(p.status) }} />
                      <span className="text-xs">{statusLabel(p.status)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                      <span className="text-gray-500">Área</span><span>{p.areaHa} ha</span>
                      <span className="text-gray-500">Animais</span><span>{p.animais} / {p.capacidade} UA</span>
                      <span className="text-gray-500">Lotação</span><span>{p.areaHa > 0 ? (p.animais / p.areaHa).toFixed(2) : "—"} UA/ha</span>
                      <span className="text-gray-500">Tipo</span><span>{p.tipo}</span>
                      <span className="text-gray-500">Função</span><span>{p.funcao}</span>
                      {p.diasDescanso > 0 && (
                        <><span className="text-gray-500">Descanso</span><span>{p.diasDescanso} dias</span></>
                      )}
                      <span className="text-gray-500">Últ. entrada</span><span>{new Date(p.ultimaEntrada).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {/* Animal cluster icons */}
            {layers.animais && pastureAnimalCentroids.map((p) => (
              <Marker
                key={`animal-${p.id}`}
                position={[p.centroidLat, p.centroidLng]}
                icon={createAnimalClusterIcon(p.animais)}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold">{p.name}</p>
                    <p>{p.animais} animais ativos</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Infrastructure markers */}
            {layers.infraestrutura && mockInfraMarkers.map((m) => (
              <Marker key={m.id} position={[m.lat, m.lng]} icon={createEmojiIcon(m.icon)}>
                <Popup>
                  <div className="min-w-[160px]">
                    <p className="font-bold text-sm">{m.icon} {m.name}</p>
                    <p className="text-xs text-gray-500">{m.type}</p>
                    {m.notes && <p className="text-xs mt-1">{m.notes}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* All farms markers */}
            {isAllView && FAZENDAS.map((f) => (
              <Marker key={f.id} position={[f.lat, f.lng]} icon={createEmojiIcon("🏠")}>
                <Popup>
                  <div>
                    <p className="font-bold text-sm">{f.nome}</p>
                    <p className="text-xs text-gray-500">{f.municipio}</p>
                    <button
                      className="text-xs text-blue-600 underline mt-1"
                      onClick={() => setFazendaId(f.id)}
                    >
                      Zoom nesta fazenda →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Clima overlay */}
            {layers.clima && (
              <Marker position={[mapCenter[0] + 0.003, mapCenter[1] + 0.003]} icon={L.divIcon({
                html: `<div style="background:rgba(255,255,255,0.9);border-radius:8px;padding:6px 10px;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-size:12px;white-space:nowrap"><b>🌡️ 28°C</b> · 💧 62% · 🌧️ 2mm</div>`,
                className: "",
                iconSize: [180, 36],
                iconAnchor: [90, 18],
              })} />
            )}

            {/* Alertas overlay */}
            {layers.alertas && (
              <>
                <Marker position={[mockPasturePolygons[1].coords[0][0], mockPasturePolygons[1].coords[0][1]]} icon={L.divIcon({
                  html: `<div style="background:#fef2f2;border:1px solid #ef4444;border-radius:6px;padding:3px 8px;font-size:10px;white-space:nowrap;color:#b91c1c">⚠️ Lotação alta</div>`,
                  className: "",
                  iconSize: [120, 24],
                  iconAnchor: [60, 12],
                })} />
                <Marker position={[mockPasturePolygons[6].coords[0][0], mockPasturePolygons[6].coords[0][1]]} icon={L.divIcon({
                  html: `<div style="background:#fef2f2;border:1px solid #ef4444;border-radius:6px;padding:3px 8px;font-size:10px;white-space:nowrap;color:#b91c1c">🔴 Superlotado!</div>`,
                  className: "",
                  iconSize: [120, 24],
                  iconAnchor: [60, 12],
                })} />
              </>
            )}

            {/* Atividades overlay */}
            {layers.atividades && (
              <Marker position={[mockPasturePolygons[0].coords[0][0] + 0.001, mockPasturePolygons[0].coords[0][1] + 0.002]} icon={L.divIcon({
                html: `<div style="background:#eff6ff;border:1px solid #3b82f6;border-radius:6px;padding:3px 8px;font-size:10px;white-space:nowrap;color:#1d4ed8">📋 Vacinação agendada 12/03</div>`,
                className: "",
                iconSize: [180, 24],
                iconAnchor: [90, 12],
              })} />
            )}

            {/* Drawing mode */}
            {drawing && <DrawingMode onFinish={handleDrawFinish} />}
          </MapContainer>

          {/* Drawing mode banner */}
          {drawing && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
              Clique no mapa para desenhar o polígono do pasto
            </div>
          )}
        </div>
      </div>

      {/* Pasture detail dialog */}
      <Dialog open={!!selectedPasture} onOpenChange={() => setSelectedPasture(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedPasture ? statusColor(selectedPasture.status) : undefined }} />
              {selectedPasture?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedPasture && (
            <div className="space-y-4">
              <Badge variant="outline">{statusLabel(selectedPasture.status)}</Badge>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Área</p><p className="font-medium">{selectedPasture.areaHa} ha</p></div>
                <div><p className="text-xs text-muted-foreground">Animais</p><p className="font-medium">{selectedPasture.animais} / {selectedPasture.capacidade} UA</p></div>
                <div><p className="text-xs text-muted-foreground">Lotação</p><p className="font-medium">{selectedPasture.areaHa > 0 ? (selectedPasture.animais / selectedPasture.areaHa).toFixed(2) : "—"} UA/ha</p></div>
                <div><p className="text-xs text-muted-foreground">Tipo de capim</p><p className="font-medium">{selectedPasture.tipo}</p></div>
                <div><p className="text-xs text-muted-foreground">Função</p><p className="font-medium">{selectedPasture.funcao}</p></div>
                <div><p className="text-xs text-muted-foreground">Últ. entrada</p><p className="font-medium">{new Date(selectedPasture.ultimaEntrada).toLocaleDateString("pt-BR")}</p></div>
                {selectedPasture.diasDescanso > 0 && (
                  <div><p className="text-xs text-muted-foreground">Dias em descanso</p><p className="font-medium">{selectedPasture.diasDescanso}</p></div>
                )}
              </div>
              <Separator />
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="gap-1">
                  <Eye className="h-3.5 w-3.5" /> Ver animais
                </Button>
                <Button size="sm" variant="outline" className="gap-1">
                  🔄 Mover animais
                </Button>
                <Button size="sm" variant="outline" className="gap-1">
                  📋 Ver detalhes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Link polygon to pasture dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vincular Polígono ao Pasto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Polígono com {drawnCoords?.length || 0} pontos desenhado. Vincule a um pasto existente ou crie um novo.
            </p>
            <div className="space-y-1">
              <Label>Pasto</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecionar pasto cadastrado" /></SelectTrigger>
                <SelectContent>
                  {mockPasturePolygons.map((p) => (
                    <SelectItem key={p.id} value={p.pastureId}>{p.name}</SelectItem>
                  ))}
                  <SelectItem value="novo">+ Criar novo pasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowLinkDialog(false); setDrawnCoords(null); }}>Cancelar</Button>
            <Button onClick={handleSavePolygon}>Vincular</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Infra marker form */}
      <Dialog open={showInfraForm} onOpenChange={setShowInfraForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Marcador de Infraestrutura</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={infraType} onValueChange={setInfraType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INFRA_MARKER_TYPES.map((t) => (
                    <SelectItem key={t.label} value={t.label}>{t.icon} {t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={infraName} onChange={(e) => setInfraName(e.target.value)} placeholder="Ex: Bebedouro Pasto Norte" />
            </div>
            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea value={infraNotes} onChange={(e) => setInfraNotes(e.target.value)} placeholder="Detalhes..." className="min-h-[60px]" />
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Após salvar, clique no mapa para posicionar o marcador.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInfraForm(false)}>Cancelar</Button>
            <Button onClick={handleSaveInfra}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
