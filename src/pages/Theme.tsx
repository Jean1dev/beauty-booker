import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Theme = () => {
  const navigate = useNavigate();
  const [primaryColor, setPrimaryColor] = useState("#F4A69F");
  const [accentColor, setAccentColor] = useState("#F5DDA9");

  useEffect(() => {
    const savedTheme = localStorage.getItem("customTheme");
    if (savedTheme) {
      const theme = JSON.parse(savedTheme);
      setPrimaryColor(theme.primary);
      setAccentColor(theme.accent);
    }
  }, []);

  const handleSave = () => {
    const theme = {
      primary: primaryColor,
      accent: accentColor,
    };
    localStorage.setItem("customTheme", JSON.stringify(theme));
    toast.success("Tema personalizado salvo!");
  };

  const presetThemes = [
    { name: "Coral Rose", primary: "#F4A69F", accent: "#F5DDA9" },
    { name: "Lavender", primary: "#C4B5FD", accent: "#FCA5A5" },
    { name: "Mint Fresh", primary: "#86EFAC", accent: "#FDE047" },
    { name: "Ocean Blue", primary: "#7DD3FC", accent: "#A5F3FC" },
  ];

  const applyPreset = (preset: typeof presetThemes[0]) => {
    setPrimaryColor(preset.primary);
    setAccentColor(preset.accent);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="shadow-soft"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Personalização
            </h1>
            <p className="text-muted-foreground mt-1">
              Customize as cores do seu sistema
            </p>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader className="gradient-primary text-primary-foreground rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Tema Personalizado
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Escolha as cores que representam sua marca
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Preset Themes */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Temas Predefinidos</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {presetThemes.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="p-4 rounded-xl border border-border hover:border-primary/50 transition-all shadow-soft hover:shadow-medium group"
                  >
                    <div className="flex gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="w-8 h-8 rounded-lg"
                        style={{ backgroundColor: preset.accent }}
                      />
                    </div>
                    <p className="text-sm font-medium text-left group-hover:text-primary transition-colors">
                      {preset.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Cores Personalizadas</Label>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary">Cor Principal</Label>
                  <div className="flex gap-2">
                    <input
                      id="primary"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-16 h-10 rounded-lg cursor-pointer border border-border"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-4 py-2 bg-secondary rounded-lg border border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent">Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <input
                      id="accent"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-16 h-10 rounded-lg cursor-pointer border border-border"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 px-4 py-2 bg-secondary rounded-lg border border-border"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Preview</Label>
              <div className="p-6 rounded-xl border border-border bg-card space-y-4">
                <div
                  className="h-12 rounded-lg flex items-center justify-center font-semibold text-white shadow-soft"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                >
                  Gradiente de Exemplo
                </div>
                <div className="flex gap-2">
                  <div
                    className="flex-1 h-16 rounded-lg shadow-soft"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div
                    className="flex-1 h-16 rounded-lg shadow-soft"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              className="w-full h-12 text-base shadow-medium"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
            >
              Salvar Tema
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Nota: As alterações de tema são salvas localmente neste dispositivo
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Theme;
