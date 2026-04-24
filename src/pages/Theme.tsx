import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Palette, Upload, X, Image as ImageIcon, User, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { trackThemeChanged } from "@/lib/analytics";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/use-auth";
import { getUserPreferences, saveUserPreferences } from "@/services/user-preferences";
import { uploadLogo, deleteLogo } from "@/services/storage";

const SERVICE_CATEGORIES = [
  "Make Profissional",
  "Manicure",
  "Pedicure",
  "Tatuagem",
  "Sobrancelhas",
  "Cílios",
  "Cabelo",
  "Estética",
  "Depilação",
  "Massagem",
  "Barbearia",
  "Outros",
];

type SaveStatus = "idle" | "saving" | "saved";

const Theme = () => {
  const navigate = useNavigate();
  const { theme, updateTheme } = useTheme();
  const { userData } = useAuth();
  const [primaryColor, setPrimaryColor] = useState(theme.primary);
  const [accentColor, setAccentColor] = useState(theme.accent);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayNameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refs to always have latest color values inside debounced callbacks
  const primaryColorRef = useRef(primaryColor);
  const accentColorRef = useRef(accentColor);

  useEffect(() => {
    setPrimaryColor(theme.primary);
    setAccentColor(theme.accent);
    primaryColorRef.current = theme.primary;
    accentColorRef.current = theme.accent;
  }, [theme]);

  useEffect(() => {
    const loadPreferences = async () => {
      if (userData?.uid) {
        try {
          const preferences = await getUserPreferences(userData.uid);
          if (preferences?.logoUrl) setLogoUrl(preferences.logoUrl);
          if (preferences?.displayName) setDisplayName(preferences.displayName);
          if (preferences?.serviceCategory)
            setSelectedCategories(
              preferences.serviceCategory
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
            );
          if (preferences?.isPublicProfile !== undefined)
            setIsPublicProfile(preferences.isPublicProfile);
        } catch {}
      }
    };
    loadPreferences();
  }, [userData?.uid]);

  const markSaved = () => {
    setSaveStatus("saved");
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
  };

  // Saves profile data immediately using explicitly passed values to avoid stale closures
  const saveProfileData = async (overrides: {
    displayName?: string;
    selectedCategories?: string[];
    isPublicProfile?: boolean;
  }) => {
    if (!userData?.uid) return;
    setSaveStatus("saving");
    try {
      await saveUserPreferences({
        userId: userData.uid,
        displayName: "displayName" in overrides ? overrides.displayName! : displayName,
        serviceCategory: (
          "selectedCategories" in overrides ? overrides.selectedCategories! : selectedCategories
        ).join(", "),
        isPublicProfile:
          "isPublicProfile" in overrides ? overrides.isPublicProfile! : isPublicProfile,
      });
      markSaved();
    } catch {
      setSaveStatus("idle");
      toast.error("Erro ao salvar");
    }
  };

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    setSaveStatus("saving");
    if (displayNameDebounceRef.current) clearTimeout(displayNameDebounceRef.current);
    displayNameDebounceRef.current = setTimeout(() => {
      saveProfileData({ displayName: value });
    }, 700);
  };

  const handleCategoryToggle = (cat: string) => {
    const newCategories = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(newCategories);
    saveProfileData({ selectedCategories: newCategories });
  };

  const handlePublicProfileChange = (value: boolean) => {
    setIsPublicProfile(value);
    saveProfileData({ isPublicProfile: value });
  };

  const scheduleColorSave = () => {
    setSaveStatus("saving");
    if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
    colorDebounceRef.current = setTimeout(async () => {
      try {
        await updateTheme({
          primary: primaryColorRef.current,
          accent: accentColorRef.current,
        });
        trackThemeChanged("custom");
        markSaved();
      } catch {
        setSaveStatus("idle");
        toast.error("Erro ao salvar tema");
      }
    }, 700);
  };

  const handlePrimaryColorChange = (value: string) => {
    setPrimaryColor(value);
    primaryColorRef.current = value;
    scheduleColorSave();
  };

  const handleAccentColorChange = (value: string) => {
    setAccentColor(value);
    accentColorRef.current = value;
    scheduleColorSave();
  };

  const presetThemes = [
    { name: "Rose Clássico", primary: "#C45C58", accent: "#C9A84C" },
    { name: "Coral Rose", primary: "#F4A69F", accent: "#F5DDA9" },
    { name: "Lavanda", primary: "#C4B5FD", accent: "#FCA5A5" },
    { name: "Esmeralda", primary: "#6EE7B7", accent: "#FDE68A" },
  ];

  const applyPreset = async (preset: (typeof presetThemes)[0]) => {
    setPrimaryColor(preset.primary);
    setAccentColor(preset.accent);
    primaryColorRef.current = preset.primary;
    accentColorRef.current = preset.accent;
    setSaveStatus("saving");
    try {
      await updateTheme({ primary: preset.primary, accent: preset.accent });
      trackThemeChanged("preset");
      markSaved();
    } catch {
      setSaveStatus("idle");
      toast.error("Erro ao aplicar tema");
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userData?.uid) {
      if (!userData?.uid) toast.error("Você precisa estar autenticado para fazer upload");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }
    try {
      setIsUploadingLogo(true);
      const uploadedUrl = await uploadLogo(userData.uid, file);
      await saveUserPreferences({ userId: userData.uid, logoUrl: uploadedUrl });
      setLogoUrl(uploadedUrl);
      toast.success("Logo enviado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload do logo");
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    if (!userData?.uid) return;
    try {
      await deleteLogo(userData.uid);
      await saveUserPreferences({ userId: userData.uid, logoUrl: null });
      setLogoUrl(null);
      toast.success("Logo removido com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover logo");
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="page-title">Personalização</h1>
            <p className="page-subtitle">Customize cores e logo do seu sistema</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[80px] justify-end">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Salvando...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span className="text-green-500">Salvo</span>
              </>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <h2 className="font-medium text-foreground text-sm">Informações do Perfil</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
                Nome de Exibição
              </Label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
                placeholder="Ex: Studio da Ana"
                className="w-full px-4 py-2 bg-secondary/50 rounded-xl border border-border text-sm focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
                Categoria dos Serviços
              </Label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map((cat) => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-foreground">Perfil Público</p>
                <p className="text-xs text-muted-foreground">
                  Permite que clientes encontrem e acessem seu perfil
                </p>
              </div>
              <Switch checked={isPublicProfile} onCheckedChange={handlePublicProfileChange} />
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h2 className="font-medium text-foreground text-sm">Logo</h2>
          </div>
          <div className="p-6">
            {logoUrl ? (
              <div className="flex items-center gap-6">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-24 h-24 object-contain rounded-xl border border-border p-2 bg-secondary/50"
                />
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploadingLogo ? "Enviando..." : "Alterar Logo"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={isUploadingLogo}
                    className="text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-3">Nenhum logo enviado</p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUploadingLogo}
                  className="pointer-events-none"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isUploadingLogo ? "Enviando..." : "Enviar Logo"}
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-3">
              Formatos aceitos: JPG, PNG, GIF · Tamanho máximo: 5MB
            </p>
          </div>
        </div>

        {/* Preset Themes */}
        <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <h2 className="font-medium text-foreground text-sm">Temas Predefinidos</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presetThemes.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="p-4 rounded-xl border border-border hover:border-primary/40 hover:shadow-soft transition-all text-left group"
                >
                  <div className="flex gap-2 mb-2.5">
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    {preset.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Colors */}
        <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="font-medium text-foreground text-sm">Cores Personalizadas</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
                  Cor Principal
                </Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => handlePrimaryColorChange(e.target.value)}
                    className="w-14 h-10 rounded-xl cursor-pointer border border-border p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => handlePrimaryColorChange(e.target.value)}
                    className="flex-1 px-4 py-2 bg-secondary/50 rounded-xl border border-border text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
                  Cor de Destaque
                </Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => handleAccentColorChange(e.target.value)}
                    className="w-14 h-10 rounded-xl cursor-pointer border border-border p-0.5"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => handleAccentColorChange(e.target.value)}
                    className="flex-1 px-4 py-2 bg-secondary/50 rounded-xl border border-border text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
                Preview
              </Label>
              <div className="p-5 rounded-xl border border-border bg-secondary/30 space-y-3">
                <div
                  className="h-10 rounded-full flex items-center justify-center text-sm font-medium text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Botão principal
                </div>
                <div className="flex gap-3">
                  <div
                    className="flex-1 h-12 rounded-xl shadow-sm"
                    style={{ backgroundColor: primaryColor, opacity: 0.15 }}
                  />
                  <div
                    className="flex-1 h-12 rounded-xl shadow-sm"
                    style={{ backgroundColor: accentColor, opacity: 0.15 }}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              As alterações são salvas automaticamente em todos os dispositivos
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Theme;
