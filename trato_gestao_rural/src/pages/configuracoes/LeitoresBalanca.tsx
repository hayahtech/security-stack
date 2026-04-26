import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Radio, Weight, Wifi, Bluetooth, Usb, Settings2,
  RefreshCw, Trash2, Power, PowerOff, CheckCircle2, XCircle, Clock, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  mockReaders, mockScales,
  readerManufacturers, scaleManufacturers,
  connectionTypeLabel, rfidStandardLabel, deviceLocationLabel,
  statusLabel, statusColor,
  simulateSingleRead, simulateSingleWeight,
  type RfidReader, type ElectronicScale, type ConnectionType, type RfidStandard, type DeviceLocation,
} from "@/data/devices-mock";
import {
  connectBluetoothReader, disconnectBluetoothReader,
  isWebBluetoothSupported, isBluetoothConnected,
  onBluetoothStateChange, type BluetoothConnectionState,
} from "@/lib/bluetooth-rfid";
import {
  connectWifiReader, disconnectWifiReader,
  isWifiConnected, onWifiStateChange,
} from "@/lib/wifi-rfid";
import {
  connectSerialDevice, disconnectSerialDevice,
  isSerialConnected, isWebSerialSupported, onSerialStateChange,
} from "@/lib/serial-rfid";

const connIcon: Record<ConnectionType, React.ElementType> = {
  bluetooth: Bluetooth,
  wifi: Wifi,
  usb_serial: Usb,
};

export default function LeitoresBalanca() {
  const navigate = useNavigate();
  const [readers, setReaders] = useState<RfidReader[]>(mockReaders);
  const [scales, setScales] = useState<ElectronicScale[]>(mockScales);

  // Reader form
  const [showReaderForm, setShowReaderForm] = useState(false);
  const [rName, setRName] = useState("");
  const [rManufacturer, setRManufacturer] = useState("Allflex");
  const [rModel, setRModel] = useState("");
  const [rConnection, setRConnection] = useState<ConnectionType>("bluetooth");
  const [rStandard, setRStandard] = useState<RfidStandard>("fdx_b");
  const [rLocation, setRLocation] = useState<DeviceLocation>("brete");
  const [rIp, setRIp] = useState("");
  const [rPort, setRPort] = useState("8080");

  // Scale form
  const [showScaleForm, setShowScaleForm] = useState(false);
  const [sName, setSName] = useState("");
  const [sManufacturer, setSManufacturer] = useState("Tru-Test");
  const [sModel, setSModel] = useState("");
  const [sConnection, setSConnection] = useState<ConnectionType>("bluetooth");
  const [sDecimals, setSDecimals] = useState("1");
  const [sStabilization, setSStabilization] = useState("3");
  const [sLinkedReader, setSLinkedReader] = useState("");

  function handleAddReader() {
    if (!rName.trim()) { toast.error("Nome é obrigatório"); return; }
    const newReader: RfidReader = {
      id: `reader-${Date.now()}`,
      name: rName,
      manufacturer: rManufacturer,
      model: rModel,
      connectionType: rConnection,
      rfidStandard: rStandard,
      location: rLocation,
      active: true,
      status: "disconnected",
      ipAddress: rConnection === "wifi" ? rIp : undefined,
      port: rConnection === "wifi" ? rPort : undefined,
    };
    setReaders([...readers, newReader]);
    setShowReaderForm(false);
    resetReaderForm();
    toast.success(`Leitor "${rName}" adicionado`);
  }

  function handleAddScale() {
    if (!sName.trim()) { toast.error("Nome é obrigatório"); return; }
    const newScale: ElectronicScale = {
      id: `scale-${Date.now()}`,
      name: sName,
      manufacturer: sManufacturer,
      model: sModel,
      connectionType: sConnection,
      decimalPlaces: parseInt(sDecimals),
      stabilizationReadings: parseInt(sStabilization),
      linkedReaderId: sLinkedReader || undefined,
      active: true,
      status: "disconnected",
    };
    setScales([...scales, newScale]);
    setShowScaleForm(false);
    resetScaleForm();
    toast.success(`Balança "${sName}" adicionada`);
  }

  function resetReaderForm() {
    setRName(""); setRModel(""); setRManufacturer("Allflex");
    setRConnection("bluetooth"); setRStandard("fdx_b"); setRLocation("brete");
    setRIp(""); setRPort("8080");
  }
  function resetScaleForm() {
    setSName(""); setSModel(""); setSManufacturer("Tru-Test");
    setSConnection("bluetooth"); setSDecimals("1"); setSStabilization("3"); setSLinkedReader("");
  }

  function toggleReader(id: string) {
    setReaders(readers.map(r => r.id === id ? { ...r, active: !r.active, status: r.active ? "disconnected" : "waiting" } : r));
  }
  function toggleScale(id: string) {
    setScales(scales.map(s => s.id === id ? { ...s, active: !s.active, status: s.active ? "disconnected" : "waiting" } : s));
  }
  function removeReader(id: string) {
    setReaders(readers.filter(r => r.id !== id));
    toast.success("Leitor removido");
  }
  function removeScale(id: string) {
    setScales(scales.filter(s => s.id !== id));
    toast.success("Balança removida");
  }
  const [btConnecting, setBtConnecting] = useState<string | null>(null);
  const [wifiConnecting, setWifiConnecting] = useState<string | null>(null);
  const [serialConnecting, setSerialConnecting] = useState<string | null>(null);

  // Listen for real Bluetooth state changes
  useEffect(() => {
    const unsubBt = onBluetoothStateChange((deviceId, state) => {
      if (state === "listening") {
        setReaders(rs => rs.map(r => r.id === deviceId ? { ...r, status: "connected" } : r));
        setScales(ss => ss.map(s => s.id === deviceId ? { ...s, status: "connected" } : s));
      } else if (state === "disconnected") {
        setReaders(rs => rs.map(r => r.id === deviceId ? { ...r, status: "disconnected" } : r));
        setScales(ss => ss.map(s => s.id === deviceId ? { ...s, status: "disconnected" } : s));
      }
      if (state !== "requesting" && state !== "connecting" && state !== "discovering") {
        setBtConnecting(null);
      }
    });
    const unsubWifi = onWifiStateChange((deviceId, state) => {
      if (state === "polling" || state === "websocket") {
        setReaders(rs => rs.map(r => r.id === deviceId ? { ...r, status: "connected" } : r));
      } else if (state === "disconnected" || state === "error") {
        setReaders(rs => rs.map(r => r.id === deviceId ? { ...r, status: "disconnected" } : r));
      }
      setWifiConnecting(null);
    });
    const unsubSerial = onSerialStateChange((deviceId, state) => {
      if (state === "connected" || state === "reading") {
        setReaders(rs => rs.map(r => r.id === deviceId ? { ...r, status: "connected" } : r));
        setScales(ss => ss.map(s => s.id === deviceId ? { ...s, status: "connected" } : s));
      } else if (state === "disconnected" || state === "error") {
        setReaders(rs => rs.map(r => r.id === deviceId ? { ...r, status: "disconnected" } : r));
        setScales(ss => ss.map(s => s.id === deviceId ? { ...s, status: "disconnected" } : s));
      }
      setSerialConnecting(null);
    });
    return () => { unsubBt(); unsubWifi(); unsubSerial(); };
  }, []);

  async function handleBluetoothConnect(readerId: string) {
    if (!isWebBluetoothSupported()) {
      toast.error("Web Bluetooth não disponível. Use Chrome em HTTPS.");
      return;
    }
    setBtConnecting(readerId);
    const result = await connectBluetoothReader(readerId);
    setBtConnecting(null);
    if (result.success) {
      toast.success(`Conectado a ${result.deviceName} via Bluetooth!`);
      setReaders(rs => rs.map(r => r.id === readerId ? { ...r, status: "connected" } : r));
    } else {
      toast.error(result.error || "Falha ao conectar.");
    }
  }

  function handleBluetoothDisconnect(readerId: string) {
    disconnectBluetoothReader(readerId);
    setReaders(rs => rs.map(r => r.id === readerId ? { ...r, status: "disconnected" } : r));
    toast.info("Bluetooth desconectado.");
  }

  async function handleWifiConnect(reader: RfidReader) {
    if (!reader.ipAddress || !reader.port) {
      toast.error("Configure o IP e porta do leitor antes de conectar.");
      return;
    }
    setWifiConnecting(reader.id);
    const result = await connectWifiReader(reader.id, reader.ipAddress, reader.port);
    setWifiConnecting(null);
    if (result.success) {
      toast.success(`Conectado via ${result.mode === "websocket" ? "WebSocket" : "HTTP Polling"} em ${reader.ipAddress}:${reader.port}`);
      setReaders(rs => rs.map(r => r.id === reader.id ? { ...r, status: "connected" } : r));
    } else {
      toast.error(result.error || "Falha ao conectar via Wi-Fi.");
    }
  }

  function handleWifiDisconnect(readerId: string) {
    disconnectWifiReader(readerId);
    setReaders(rs => rs.map(r => r.id === readerId ? { ...r, status: "disconnected" } : r));
    toast.info("Conexão Wi-Fi encerrada.");
  }

  async function handleSerialConnect(deviceId: string) {
    if (!isWebSerialSupported()) {
      toast.error("Web Serial não disponível. Use Chrome em HTTPS.");
      return;
    }
    setSerialConnecting(deviceId);
    const result = await connectSerialDevice(deviceId, 9600);
    setSerialConnecting(null);
    if (result.success) {
      toast.success("Conectado via USB Serial! Lendo dados...");
      setReaders(rs => rs.map(r => r.id === deviceId ? { ...r, status: "connected" } : r));
      setScales(ss => ss.map(s => s.id === deviceId ? { ...s, status: "connected" } : s));
    } else {
      toast.error(result.error || "Falha ao conectar USB Serial.");
    }
  }

  async function handleSerialDisconnect(deviceId: string) {
    await disconnectSerialDevice(deviceId);
    setReaders(rs => rs.map(r => r.id === deviceId ? { ...r, status: "disconnected" } : r));
    setScales(ss => ss.map(s => s.id === deviceId ? { ...s, status: "disconnected" } : s));
    toast.info("USB Serial desconectado.");
  }

  function testReader(id: string) {
    simulateSingleRead();
    toast.info("Teste de leitura enviado — aguarde...");
    setTimeout(() => {
      setReaders(rs => rs.map(r => r.id === id ? { ...r, status: "connected", lastReading: "BR-TESTE-001", lastReadingTime: new Date().toLocaleString("pt-BR") } : r));
      toast.success("Leitor respondeu com sucesso!");
    }, 1500);
  }
  function testScale(id: string) {
    simulateSingleWeight();
    toast.info("Teste de pesagem — aguarde estabilização...");
    setTimeout(() => {
      const w = +(350 + Math.random() * 200).toFixed(1);
      setScales(ss => ss.map(s => s.id === id ? { ...s, status: "connected", lastWeight: w, lastReadingTime: new Date().toLocaleString("pt-BR") } : s));
      toast.success(`Peso recebido: ${w} kg`);
    }, 2000);
  }
  function reconnectDevice(type: "reader" | "scale", id: string) {
    if (type === "reader") {
      setReaders(rs => rs.map(r => r.id === id ? { ...r, status: "waiting" } : r));
      setTimeout(() => setReaders(rs => rs.map(r => r.id === id ? { ...r, status: "connected" } : r)), 2000);
    } else {
      setScales(ss => ss.map(s => s.id === id ? { ...s, status: "waiting" } : s));
      setTimeout(() => setScales(ss => ss.map(s => s.id === id ? { ...s, status: "connected" } : s)), 2000);
    }
    toast.info("Reconectando...");
  }

  const StatusDot = ({ status }: { status: string }) => (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusColor[status as keyof typeof statusColor] || "bg-muted"}`} />
  );

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/configuracoes")} className="self-start gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar às Configurações
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Radio className="h-6 w-6 text-primary" /> Leitores Eletrônicos & Balança
            </h1>
            <p className="text-sm text-muted-foreground">Configure leitores RFID e balanças eletrônicas</p>
          </div>
        </div>
      </div>

      {/* Status panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {readers.map((r) => {
          const ConnIcon = connIcon[r.connectionType];
          return (
            <Card key={r.id} className={`border ${r.active ? "border-border" : "border-muted opacity-60"}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={r.status} />
                    <span className="text-xs text-muted-foreground">{statusLabel[r.status]}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p className="flex items-center gap-1"><ConnIcon className="h-3 w-3" /> {connectionTypeLabel[r.connectionType]} • {deviceLocationLabel[r.location]}</p>
                  <p>{r.manufacturer} {r.model}</p>
                  {r.lastReading && <p>Última leitura: <span className="font-mono text-foreground">{r.lastReading}</span> ({r.lastReadingTime})</p>}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {r.connectionType === "bluetooth" && (
                    isBluetoothConnected(r.id) ? (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-destructive text-destructive" onClick={() => handleBluetoothDisconnect(r.id)}>
                        <Bluetooth className="h-3 w-3" /> Desconectar
                      </Button>
                    ) : (
                      <Button
                        variant="default" size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={btConnecting === r.id}
                        onClick={() => handleBluetoothConnect(r.id)}
                      >
                        {btConnecting === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bluetooth className="h-3 w-3" />}
                        {btConnecting === r.id ? "Conectando..." : "Conectar Bluetooth"}
                      </Button>
                    )
                  )}
                  {r.connectionType === "wifi" && (
                    isWifiConnected(r.id) ? (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-destructive text-destructive" onClick={() => handleWifiDisconnect(r.id)}>
                        <Wifi className="h-3 w-3" /> Desconectar
                      </Button>
                    ) : (
                      <Button
                        variant="default" size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={wifiConnecting === r.id}
                        onClick={() => handleWifiConnect(r)}
                      >
                        {wifiConnecting === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wifi className="h-3 w-3" />}
                        {wifiConnecting === r.id ? "Conectando..." : "Conectar Wi-Fi"}
                      </Button>
                    )
                  )}
                  {r.connectionType === "usb_serial" && (
                    isSerialConnected(r.id) ? (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-destructive text-destructive" onClick={() => handleSerialDisconnect(r.id)}>
                        <Usb className="h-3 w-3" /> Desconectar
                      </Button>
                    ) : (
                      <Button
                        variant="default" size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={serialConnecting === r.id}
                        onClick={() => handleSerialConnect(r.id)}
                      >
                        {serialConnecting === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Usb className="h-3 w-3" />}
                        {serialConnecting === r.id ? "Conectando..." : "Conectar USB"}
                      </Button>
                    )
                  )}
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => reconnectDevice("reader", r.id)}>
                    <RefreshCw className="h-3 w-3" /> Reconectar
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => testReader(r.id)}>
                    Testar (Simulado)
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {scales.map((s) => {
          const ConnIcon = connIcon[s.connectionType];
          return (
            <Card key={s.id} className={`border ${s.active ? "border-border" : "border-muted opacity-60"}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={s.status} />
                    <span className="text-xs text-muted-foreground">{statusLabel[s.status]}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p className="flex items-center gap-1"><ConnIcon className="h-3 w-3" /> {connectionTypeLabel[s.connectionType]}</p>
                  <p>{s.manufacturer} {s.model}</p>
                  {s.lastWeight != null && <p>Último peso: <span className="font-mono font-bold text-foreground">{s.lastWeight} kg</span> ({s.lastReadingTime})</p>}
                  {s.linkedReaderId && <p className="flex items-center gap-1"><Radio className="h-3 w-3" /> Vinculada: {readers.find(r => r.id === s.linkedReaderId)?.name || "—"}</p>}
                </div>
                <div className="flex gap-1.5 pt-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => reconnectDevice("scale", s.id)}>
                    <RefreshCw className="h-3 w-3" /> Reconectar
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => testScale(s.id)}>
                    Testar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Device management tabs */}
      <Tabs defaultValue="readers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="readers" className="gap-1.5"><Radio className="h-3.5 w-3.5" /> Leitores RFID ({readers.length})</TabsTrigger>
          <TabsTrigger value="scales" className="gap-1.5"><Weight className="h-3.5 w-3.5" /> Balanças ({scales.length})</TabsTrigger>
        </TabsList>

        {/* ── READERS TAB ── */}
        <TabsContent value="readers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowReaderForm(true)} className="gap-2"><Plus className="h-4 w-4" /> Adicionar Leitor</Button>
          </div>
          {readers.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum leitor cadastrado</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {readers.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <StatusDot status={r.status} />
                          <span className="font-semibold">{r.name}</span>
                          <Badge variant="outline" className="text-[10px]">{rfidStandardLabel[r.rfidStandard]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.manufacturer} {r.model} • {connectionTypeLabel[r.connectionType]} • {deviceLocationLabel[r.location]}</p>
                        {r.connectionType === "wifi" && r.ipAddress && <p className="text-xs font-mono text-muted-foreground">{r.ipAddress}:{r.port}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={r.active} onCheckedChange={() => toggleReader(r.id)} />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeReader(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── SCALES TAB ── */}
        <TabsContent value="scales" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowScaleForm(true)} className="gap-2"><Plus className="h-4 w-4" /> Adicionar Balança</Button>
          </div>
          {scales.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma balança cadastrada</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {scales.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <StatusDot status={s.status} />
                          <span className="font-semibold">{s.name}</span>
                          {s.linkedReaderId && (
                            <Badge variant="secondary" className="text-[10px] gap-1"><Radio className="h-2.5 w-2.5" /> {readers.find(r => r.id === s.linkedReaderId)?.name}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {s.manufacturer} {s.model} • {connectionTypeLabel[s.connectionType]} • {s.decimalPlaces} casas • {s.stabilizationReadings} leituras estáveis
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={s.active} onCheckedChange={() => toggleScale(s.id)} />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeScale(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Reader Form Dialog ── */}
      <Dialog open={showReaderForm} onOpenChange={setShowReaderForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Radio className="h-5 w-5 text-primary" /> Adicionar Leitor RFID</DialogTitle>
            <DialogDescription>Configure um novo leitor de identificação eletrônica</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Nome do leitor *</Label>
              <Input value={rName} onChange={e => setRName(e.target.value)} placeholder="Ex: Leitor Brete Principal" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Fabricante</Label>
                <Select value={rManufacturer} onValueChange={setRManufacturer}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{readerManufacturers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Modelo</Label>
                <Input value={rModel} onChange={e => setRModel(e.target.value)} placeholder="Ex: RS420" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Tipo de Conexão</Label>
                <Select value={rConnection} onValueChange={v => setRConnection(v as ConnectionType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(connectionTypeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Padrão RFID</Label>
                <Select value={rStandard} onValueChange={v => setRStandard(v as RfidStandard)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(rfidStandardLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {rConnection === "wifi" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Endereço IP</Label>
                  <Input value={rIp} onChange={e => setRIp(e.target.value)} placeholder="192.168.1.50" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Porta</Label>
                  <Input value={rPort} onChange={e => setRPort(e.target.value)} placeholder="8080" />
                </div>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label>Local de Instalação</Label>
              <Select value={rLocation} onValueChange={v => setRLocation(v as DeviceLocation)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(deviceLocationLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReaderForm(false)}>Cancelar</Button>
            <Button onClick={handleAddReader}>Adicionar Leitor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Scale Form Dialog ── */}
      <Dialog open={showScaleForm} onOpenChange={setShowScaleForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Weight className="h-5 w-5 text-primary" /> Adicionar Balança Eletrônica</DialogTitle>
            <DialogDescription>Configure uma nova balança para pesagem automatizada</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Nome *</Label>
              <Input value={sName} onChange={e => setSName(e.target.value)} placeholder="Ex: Balança Brete 1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Fabricante</Label>
                <Select value={sManufacturer} onValueChange={setSManufacturer}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{scaleManufacturers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Modelo</Label>
                <Input value={sModel} onChange={e => setSModel(e.target.value)} placeholder="Ex: S3" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label>Conexão</Label>
                <Select value={sConnection} onValueChange={v => setSConnection(v as ConnectionType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(connectionTypeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Casas decimais</Label>
                <Select value={sDecimals} onValueChange={setSDecimals}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Leituras estáveis</Label>
                <Input type="number" min={1} max={10} value={sStabilization} onChange={e => setSStabilization(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Vincular a leitor RFID</Label>
              <Select value={sLinkedReader} onValueChange={setSLinkedReader}>
                <SelectTrigger><SelectValue placeholder="Nenhum (independente)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {readers.filter(r => r.active).map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScaleForm(false)}>Cancelar</Button>
            <Button onClick={handleAddScale}>Adicionar Balança</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
