import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PrintSettingsData {
  thermal_paper_width: string;
  auto_print_pos: boolean;
  barcode_label_size: string;
  thermal_logo_url: string | null;
  invoice_paper_size: string;
  print_density: number;
  footer_text: string;
}

const defaultSettings: PrintSettingsData = {
  thermal_paper_width: "3inch",
  auto_print_pos: false,
  barcode_label_size: "50x25",
  thermal_logo_url: null,
  invoice_paper_size: "A4",
  print_density: 5,
  footer_text: "Thank you for your business!",
};

export function PrintSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrintSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("business_settings")
        .select("print_settings")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.print_settings && typeof data.print_settings === 'object') {
        setSettings({ ...defaultSettings, ...(data.print_settings as unknown as PrintSettingsData) });
      }
    } catch (error) {
      console.error("Error loading print settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("business_settings")
        .update({ print_settings: settings as unknown as import("@/integrations/supabase/types").Json })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Print settings saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Thermal Printer */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Thermal Printer
          </CardTitle>
          <CardDescription>Configure thermal receipt printer settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Paper Width</Label>
            <Select
              value={settings.thermal_paper_width}
              onValueChange={(value) => setSettings({ ...settings, thermal_paper_width: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2inch">2 inch (58mm)</SelectItem>
                <SelectItem value="3inch">3 inch (80mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Auto-print after POS sale</Label>
              <p className="text-sm text-muted-foreground">Automatically print receipt after checkout</p>
            </div>
            <Switch
              checked={settings.auto_print_pos}
              onCheckedChange={(checked) => setSettings({ ...settings, auto_print_pos: checked })}
            />
          </div>

          <div>
            <Label>Footer Text</Label>
            <Input
              value={settings.footer_text}
              onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
              placeholder="Thank you for your business!"
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Barcode Printer */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Barcode / Label Printer</CardTitle>
          <CardDescription>Configure label printer settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Label Size</Label>
            <Select
              value={settings.barcode_label_size}
              onValueChange={(value) => setSettings({ ...settings, barcode_label_size: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50x25">50 × 25 mm</SelectItem>
                <SelectItem value="40x30">40 × 30 mm</SelectItem>
                <SelectItem value="60x40">60 × 40 mm</SelectItem>
                <SelectItem value="100x50">100 × 50 mm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Print Density: {settings.print_density}</Label>
            <Slider
              value={[settings.print_density]}
              onValueChange={([value]) => setSettings({ ...settings, print_density: value })}
              min={1}
              max={10}
              step={1}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Higher density = darker print
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Printer */}
      <Card className="shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle>Invoice Printer</CardTitle>
          <CardDescription>Configure A4/standard invoice printing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Label>Paper Size</Label>
            <Select
              value={settings.invoice_paper_size}
              onValueChange={(value) => setSettings({ ...settings, invoice_paper_size: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                <SelectItem value="A5">A5 (148 × 210 mm)</SelectItem>
                <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                <SelectItem value="Thermal">Thermal Receipt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Print Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
