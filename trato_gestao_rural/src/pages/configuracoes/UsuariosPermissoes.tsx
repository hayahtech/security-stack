import { useState } from "react";
import {
  Users, Shield, UserPlus, Edit2, Trash2, RotateCcw, Mail, Check, X,
  Plus, ChevronDown, Eye, EyeOff, Lock, Building2,
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DEFAULT_PROFILES, SYSTEM_MODULES, mockUsers,
  type AccessProfile, type AppUser, type PermissionLevel,
} from "@/data/access-control-mock";

const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  none: "Sem acesso",
  read: "Somente leitura",
  write: "Criar/Editar",
  full: "Acesso total",
};

const PERMISSION_COLORS: Record<PermissionLevel, string> = {
  none: "bg-muted text-muted-foreground",
  read: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  write: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  full: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

const FARMS = ["Fazenda Boa Vista", "Fazenda São José", "Sítio Esperança"];

/* ══════════════════════════════════════════════════════ */
export default function UsuariosPermissoes() {
  const [profiles, setProfiles] = useState<AccessProfile[]>([...DEFAULT_PROFILES]);
  const [users, setUsers] = useState<AppUser[]>([...mockUsers]);

  /* invite dialog */
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteProfile, setInviteProfile] = useState("viewer");
  const [inviteFarms, setInviteFarms] = useState<string[]>([FARMS[0]]);
  const [inviteMessage, setInviteMessage] = useState("");

  /* edit user dialog */
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [editProfile, setEditProfile] = useState("");
  const [editFarms, setEditFarms] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");

  /* custom profile dialog */
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDesc, setNewProfileDesc] = useState("");

  /* delete confirm */
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  /* ── handlers ─── */
  function handleInvite() {
    if (!inviteEmail.trim()) return;
    const nu: AppUser = {
      id: `u${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      profileId: inviteProfile,
      farms: inviteFarms,
      lastAccess: null,
      status: "pending",
      invitedAt: new Date().toISOString(),
    };
    setUsers([...users, nu]);
    setShowInvite(false);
    setInviteEmail("");
    setInviteMessage("");
    toast.success(`Convite enviado para ${inviteEmail}`);
  }

  function handleSaveEdit() {
    if (!editUser) return;
    setUsers(users.map((u) =>
      u.id === editUser.id ? { ...u, profileId: editProfile, farms: editFarms, status: editStatus } : u
    ));
    setEditUser(null);
    toast.success("Usuário atualizado");
  }

  function handleDeleteUser() {
    if (!deleteUserId) return;
    setUsers(users.filter((u) => u.id !== deleteUserId));
    setDeleteUserId(null);
    toast.success("Usuário removido");
  }

  function openEditUser(u: AppUser) {
    setEditUser(u);
    setEditProfile(u.profileId);
    setEditFarms([...u.farms]);
    setEditStatus(u.status === "pending" ? "active" : u.status);
  }

  function handlePermChange(profileId: string, moduleId: string, level: PermissionLevel) {
    setProfiles(profiles.map((p) =>
      p.id === profileId ? { ...p, permissions: { ...p.permissions, [moduleId]: level } } : p
    ));
  }

  function handleResetProfile(profileId: string) {
    const def = DEFAULT_PROFILES.find((p) => p.id === profileId);
    if (!def) return;
    setProfiles(profiles.map((p) => (p.id === profileId ? { ...def } : p)));
    toast.success("Permissões restauradas ao padrão");
  }

  function handleCreateProfile() {
    if (!newProfileName.trim()) return;
    const np: AccessProfile = {
      id: `custom_${Date.now()}`,
      name: newProfileName.trim(),
      slug: newProfileName.trim().toLowerCase().replace(/\s+/g, "_"),
      description: newProfileDesc || "Perfil personalizado",
      isDefault: false,
      permissions: Object.fromEntries(SYSTEM_MODULES.map((m) => [m.id, "none" as const])),
    };
    setProfiles([...profiles, np]);
    setShowNewProfile(false);
    setNewProfileName("");
    setNewProfileDesc("");
    toast.success(`Perfil "${np.name}" criado`);
  }

  function toggleInviteFarm(farm: string) {
    setInviteFarms((f) => f.includes(farm) ? f.filter((x) => x !== farm) : [...f, farm]);
  }
  function toggleEditFarm(farm: string) {
    setEditFarms((f) => f.includes(farm) ? f.filter((x) => x !== farm) : [...f, farm]);
  }

  const getProfileName = (id: string) => profiles.find((p) => p.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Usuários & Permissões
          </h1>
          <p className="text-sm text-muted-foreground">Controle de acesso multiusuário do sistema</p>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="users" className="gap-1"><Users className="h-3.5 w-3.5" />Usuários</TabsTrigger>
          <TabsTrigger value="profiles" className="gap-1"><Shield className="h-3.5 w-3.5" />Perfis</TabsTrigger>
          <TabsTrigger value="matrix" className="gap-1"><Lock className="h-3.5 w-3.5" />Matriz de Permissões</TabsTrigger>
        </TabsList>

        {/* ═══ TAB: USERS ═══ */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowInvite(true)} className="gap-1">
              <UserPlus className="h-4 w-4" /> Convidar Usuário
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Fazenda(s)</TableHead>
                      <TableHead>Último acesso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{getProfileName(u.profileId)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.farms.map((f) => (
                              <Badge key={f} variant="outline" className="text-xs gap-1">
                                <Building2 className="h-3 w-3" />{f}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {u.lastAccess ? new Date(u.lastAccess).toLocaleString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={u.status === "active" ? "default" : u.status === "pending" ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {u.status === "active" ? "Ativo" : u.status === "pending" ? "Pendente" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditUser(u)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            {u.profileId !== "owner" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteUserId(u.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB: PROFILES ═══ */}
        <TabsContent value="profiles" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowNewProfile(true)} className="gap-1">
              <Plus className="h-4 w-4" /> Criar Perfil Personalizado
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {profiles.map((p) => {
              const userCount = users.filter((u) => u.profileId === p.id).length;
              return (
                <Card key={p.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" /> {p.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">{p.description}</CardDescription>
                      </div>
                      {p.isDefault && <Badge variant="outline" className="text-[10px]">Padrão</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {SYSTEM_MODULES.map((m) => {
                        const level = p.permissions[m.id] || "none";
                        if (level === "none") return null;
                        return (
                          <Badge key={m.id} className={`text-[10px] ${PERMISSION_COLORS[level]}`}>
                            {m.label}: {PERMISSION_LABELS[level]}
                          </Badge>
                        );
                      })}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{userCount} usuário(s)</span>
                      {p.isDefault && (
                        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => handleResetProfile(p.id)}>
                          <RotateCcw className="h-3 w-3" /> Restaurar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══ TAB: MATRIX ═══ */}
        <TabsContent value="matrix" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Matriz de Permissões</CardTitle>
              <CardDescription>Clique em cada célula para alterar o nível de acesso por perfil</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px] sticky left-0 bg-background z-10">Módulo</TableHead>
                      {profiles.map((p) => (
                        <TableHead key={p.id} className="min-w-[130px] text-center text-xs">
                          <div className="space-y-1">
                            <span>{p.name}</span>
                            {p.isDefault && (
                              <Button variant="ghost" size="sm" className="text-[10px] h-5 w-full gap-0.5" onClick={() => handleResetProfile(p.id)}>
                                <RotateCcw className="h-2.5 w-2.5" /> Restaurar
                              </Button>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SYSTEM_MODULES.map((mod) => (
                      <TableRow key={mod.id}>
                        <TableCell className="font-medium text-sm sticky left-0 bg-background z-10">{mod.label}</TableCell>
                        {profiles.map((p) => {
                          const level = p.permissions[mod.id] || "none";
                          return (
                            <TableCell key={p.id} className="text-center p-1">
                              <Select
                                value={level}
                                onValueChange={(v) => handlePermChange(p.id, mod.id, v as PermissionLevel)}
                                disabled={p.id === "owner"}
                              >
                                <SelectTrigger className={`h-7 text-[11px] ${PERMISSION_COLORS[level]} border-0`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(Object.entries(PERMISSION_LABELS) as [PermissionLevel, string][]).map(([k, v]) => (
                                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ INVITE DIALOG ═══ */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Convidar Usuário</DialogTitle>
            <DialogDescription>Envie um convite para que um novo usuário acesse o sistema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Perfil de acesso</Label>
              <Select value={inviteProfile} onValueChange={setInviteProfile}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {profiles.filter((p) => p.id !== "owner").map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fazenda(s) com acesso</Label>
              <div className="flex flex-wrap gap-2">
                {FARMS.map((f) => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={inviteFarms.includes(f)} onCheckedChange={() => toggleInviteFarm(f)} />
                    <span className="text-sm">{f}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Mensagem personalizada (opcional)</Label>
              <Textarea value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)} placeholder="Olá! Estou te convidando para acessar o sistema..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancelar</Button>
            <Button onClick={handleInvite} className="gap-1"><Mail className="h-4 w-4" /> Enviar Convite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT USER DIALOG ═══ */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>{editUser?.name} — {editUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Perfil</Label>
              <Select value={editProfile} onValueChange={setEditProfile}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fazenda(s)</Label>
              <div className="flex flex-wrap gap-2">
                {FARMS.map((f) => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={editFarms.includes(f)} onCheckedChange={() => toggleEditFarm(f)} />
                    <span className="text-sm">{f}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ NEW PROFILE DIALOG ═══ */}
      <Dialog open={showNewProfile} onOpenChange={setShowNewProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Perfil Personalizado</DialogTitle>
            <DialogDescription>Defina o nome e configure as permissões na Matriz após criar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome do perfil</Label>
              <Input value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} placeholder='Ex: "Ordenhador", "Tratorista"' />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={newProfileDesc} onChange={(e) => setNewProfileDesc(e.target.value)} placeholder="Descreva o que este perfil pode fazer..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProfile(false)}>Cancelar</Button>
            <Button onClick={handleCreateProfile} className="gap-1"><Plus className="h-4 w-4" /> Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CONFIRM ═══ */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(o) => !o && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
            <AlertDialogDescription>O usuário perderá todo o acesso ao sistema. Esta ação pode ser desfeita reativando o convite.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
