import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  useGetSettings,
  useUpdateSettings,
  useGetUsers,
  useUpdateUser,
  useCreateUser,
  useGetRushes,
  usePostRushes,
  useDeleteRushesId,
  useGetCurrentAuthUser,
} from "@workspace/api-client-react";
import { usePosStore } from "@/store";
import { getTranslation } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Users,
  Plus,
  Edit2,
  X,
  Wine,
  Beer,
  Coffee,
  GlassWater,
  Martini,
  Microwave,
  IceCream,
  ChefHat,
  Utensils,
  Pizza,
  Zap,
  Trash2,
  HardDrive,
  Shield,
  Globe,
  Lock,
  Archive,
  Upload,
  FileSpreadsheet,
  Database,
} from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const BRAND_ICONS = [
  { name: "Wine", icon: Wine },
  { name: "Beer", icon: Beer },
  { name: "Coffee", icon: Coffee },
  { name: "GlassWater", icon: GlassWater },
  { name: "Martini", icon: Martini },
  { name: "Microwave", icon: Microwave },
  { name: "IceCream", icon: IceCream },
  { name: "ChefHat", icon: ChefHat },
  { name: "Utensils", icon: Utensils },
  { name: "Pizza", icon: Pizza },
];

const APP_COLUMNS = [
  {
    key: "name",
    label: "Name",
    required: true,
    suggest: ["name", "item", "product", "description"],
  },
  {
    key: "type",
    label: "Type",
    required: true,
    suggest: ["type", "category", "kind"],
  },
  {
    key: "subtype",
    label: "Subtype",
    required: false,
    suggest: ["subtype", "sub-category", "variety", "style"],
  },
  // Add index signature to allow dynamic key access for inventory items
  {
    key: "baseUnit",
    label: "Base Unit",
    required: false,
    suggest: ["bulk unit", "unit", "baseunit", "uom"],
  },
  {
    key: "baseUnitAmount",
    label: "Base Unit Amount",
    required: false,
    suggest: ["bulk size", "size", "volume", "amount", "baseunitamount"],
  },
  {
    key: "servingSize",
    label: "Serving Size",
    required: false,
    suggest: ["serving size", "servingsize", "pour", "serving"],
  },
  {
    key: "orderCost",
    label: "Order Cost",
    required: false,
    suggest: ["bulk cost", "cost", "price", "ordercost", "unit cost"],
  },
  {
    key: "currentStock",
    label: "Current Stock",
    required: false,
    suggest: ["stock", "quantity", "qty", "currentstock", "on hand"],
  },
];

export default function Settings() {
  // For blank field import confirmation
  const [blankFieldRows, setBlankFieldRows] = useState<any[]>([]);
  const [showBlankFieldModal, setShowBlankFieldModal] = useState(false);
  const [pendingImport, setPendingImport] = useState<any[]>([]);
  const { language } = usePosStore();
  const { data: settings } = useGetSettings();
  const { data: users, refetch: refetchUsers } = useGetUsers();
  const { data: rushes, refetch: refetchRushes } = useGetRushes();

  const updateSettings = useUpdateSettings();
  const updateUser = useUpdateUser();
  const createUser = useCreateUser();
  const createRush = usePostRushes();
  const deleteRush = useDeleteRushesId();

  const { toast } = useToast();
  const { data: auth } = useGetCurrentAuthUser();
  const isAdmin = auth?.user?.role === "admin";

  const [formData, setFormData] = useState({
    barName: "",
    barIcon: "Wine",
    usdToMxnRate: 0,
    cadToMxnRate: 0,
    defaultMarkupFactor: 0,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpFromEmail: "",
    inventoryAlertEmail: "",
    enableLitestream: false,
    enableUsbBackup: false,
  });

  const qc = useQueryClient();
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [showAddRush, setShowAddRush] = useState(false);
  const [deletingRush, setDeletingRush] = useState<any>(null);

  const [showSeedModal, setShowSeedModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);

  const [showRecipeImport, setShowRecipeImport] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditOffset, setAuditOffset] = useState(0);
  const [auditFilter, setAuditFilter] = useState<
    "all" | "tab" | "inventory" | "user"
  >("all");
  const [recipePreview, setRecipePreview] = useState<any[]>([]);

  const [showIngredientImport, setShowIngredientImport] = useState(false);
  const [ingredientPreview, setIngredientPreview] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>(
    {},
  );
  const [mappingStep, setMappingStep] = useState<"upload" | "map" | "preview">(
    "upload",
  );
  const [newRush, setNewRush] = useState({
    title: "",
    type: "cruise" as const,
    impact: "medium" as const,
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    description: "",
  });

  const fetchAuditLogs = async (offset: number = 0, filter: string = "all") => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "50",
        offset: offset.toString(),
      });
      if (filter !== "all") {
        params.append("entityType", filter);
      }
      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      const data = await res.json();
      setAuditLogs(data);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to load audit logs",
      });
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (settings && !formData.barName) {
      setFormData({
        barName: settings.barName,
        barIcon: settings.barIcon || "Wine",
        usdToMxnRate: settings.usdToMxnRate,
        cadToMxnRate: settings.cadToMxnRate,
        defaultMarkupFactor: settings.defaultMarkupFactor,
        smtpHost: settings.smtpHost || "",
        smtpPort: settings.smtpPort || 587,
        smtpUser: settings.smtpUser || "",
        smtpPassword: settings.smtpPassword || "",
        smtpFromEmail: settings.smtpFromEmail || "",
        inventoryAlertEmail: settings.inventoryAlertEmail || "",
        enableLitestream: settings.enableLitestream,
        enableUsbBackup: settings.enableUsbBackup,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handleSaveSettings = () => {
    updateSettings.mutate(
      { data: formData },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["/api/settings"] });
          toast({
            title: getTranslation("success", language),
            description: "Settings saved successfully",
          });
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: getTranslation("error", language),
            description: err?.message || "Failed to save settings",
          });
        },
      },
    );
  };

  const handleRecipeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

        const parsed = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, i) => {
            row[h] = values[i] || "";
          });

          const recipeStr = row.ingredients || "";
          const recipe = recipeStr
            .split(";")
            .filter((r: string) => r.trim())
            .map((r: string) => {
              const [ingredientName, amount] = r.split(":");
              return {
                ingredientId: "",
                ingredientName: ingredientName?.trim() || "",
                amountInBaseUnit: parseFloat(amount) || 0,
              };
            });

          return {
            name: row.name || "",
            category: row.category || "cocktail",
            price: parseFloat(row.price) || 0,
            recipe,
          };
        });

        setRecipePreview(parsed);
        toast({
          title: "Parsed successfully",
          description: `${parsed.length} recipes found`,
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Parse Error",
          description: "Could not parse CSV file",
        });
      }
    };
    reader.readAsText(file);
  };

  const autoSuggestMapping = (
    csvHeaders: string[],
    suggestions: string[],
  ): string => {
    for (const csvHeader of csvHeaders) {
      const normalized = csvHeader.toLowerCase().trim();
      for (const keyword of suggestions) {
        if (
          normalized === keyword ||
          normalized.includes(keyword) ||
          keyword.includes(normalized)
        ) {
          return csvHeader;
        }
      }
    }
    return "";
  };

  const handleIngredientUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          toast({
            variant: "destructive",
            title: "Parse Error",
            description: "CSV must have headers and at least one data row",
          });
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim());
        const rows = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, i) => {
            row[h] = values[i] || "";
          });
          return row;
        });

        setCsvHeaders(headers);
        setCsvRows(rows);

        const mappings: Record<string, string> = {};
        for (const col of APP_COLUMNS) {
          const match = autoSuggestMapping(headers, col.suggest);
          if (match) mappings[col.key] = match;
        }
        setColumnMappings(mappings);
        setMappingStep("map");

        toast({
          title: "CSV loaded",
          description: `${rows.length} rows found — map columns below`,
        });
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Parse Error",
          description: err.message || "Could not parse CSV file",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleApplyMappings = () => {
    const requiredUnmapped = APP_COLUMNS.filter(
      (c) => c.required && !columnMappings[c.key],
    );
    if (requiredUnmapped.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing mappings",
        description: `Please map: ${requiredUnmapped.map((c) => c.label).join(", ")}`,
      });
      return;
    }

    const normalizeType = (type: string): string => {
      const t = type.toLowerCase().trim();
      if (t === "spirits") return "spirit";
      if (t === "mixers") return "mixer";
      if (t === "ingredients") return "ingredient";
      if (t === "beers") return "beer";
      return t;
    };

    const normalizeSubtype = (subtype: string, type: string): string | null => {
      const s = subtype.toLowerCase().trim();
      if (!s) return null;
      const subtypeMap: Record<string, string> = {
        tequila: "tequila",
        mezcal: "mezcal",
        vodka: "vodka",
        gin: "gin",
        whiskey: "whiskey",
        rumron: "rum",
        rum: "rum",
        ron: "rum",
        miscliqor: "misc",
        misc: "misc",
        cervezanacional: "national",
        nacional: "national",
        cervezaimportadas: "import",
        importadas: "import",
        import: "import",
        cervazacero: "zero",
        cero: "zero",
        caguamos: "cuagamos",
        cervazamisc: "seltzer",
        mezcladores: "bulk",
        bulk: "bulk",
        ingredientes: "liquid",
        liquid: "liquid",
      };
      return subtypeMap[s] || s;
    };

    const normalizeBulkUnit = (unit: string, type: string): string => {
      const u = unit.toLowerCase().trim();
      if (!u) {
        if (type === "beer") return "unit";
        if (type === "spirit" || type === "mixer") return "ml";
        return "ml";
      }
      if (u === "case") return "unit";
      if (u === "bottle") return "ml";
      if (u === "can") return "unit";
      if (u === "gram" || u === "g") return "g";
      if (u === "ml") return "ml";
      if (u === "l") return "ml";
      if (u === "oz") return "ml";
      if (type === "beer") return "unit";
      if (type === "spirit" || type === "mixer") return "ml";
      return "ml";
    };

    const normalizeServingUnit = (unit: string, bulkUnit: string): string => {
      const u = unit.toLowerCase().trim();
      if (!u) return bulkUnit;
      if (u === "bottle" || u === "can") return "unit";
      if (u === "gram" || u === "g") return "g";
      if (u === "kg") return "g";
      if (u === "oz") return "ml";
      if (u === "l") return "ml";
      if (u === "ml") return "ml";
      if (u === "case") return "unit";
      return bulkUnit;
    };

    const convertServingSize = (
      servingSizeVal: number,
      servingUnit: string,
      bulkUnit: string,
    ): number => {
      if (servingUnit === "ml") return servingSizeVal;
      if (servingUnit === "g") return servingSizeVal;
      if (servingUnit === "unit") return servingSizeVal;
      if (servingUnit === "oz" && bulkUnit === "ml")
        return servingSizeVal * 29.5735;
      if (servingUnit === "l" && bulkUnit === "ml")
        return servingSizeVal * 1000;
      if (servingUnit === "kg" && bulkUnit === "g")
        return servingSizeVal * 1000;
      return servingSizeVal;
    };

    const convertBulkSize = (
      bulkSizeVal: number,
      bulkUnit: string,
      originalUnit: string,
    ): number => {
      const u = originalUnit.toLowerCase().trim();
      if (u === "case") return bulkSizeVal;
      if (u === "bottle") return bulkSizeVal;
      if (u === "can") return bulkSizeVal;
      if (u === "l") return bulkSizeVal * 1000;
      if (u === "kg") return bulkSizeVal * 1000;
      return bulkSizeVal;
    };

    const parsed = csvRows
      .map((row) => {
        const name = row[columnMappings["name"]] || "";
        const rawType = row[columnMappings["type"]] || "spirit";
        const type = normalizeType(rawType);
        const rawSubtype = columnMappings["subtype"]
          ? row[columnMappings["subtype"]] || ""
          : "";
        const subtype = normalizeSubtype(rawSubtype, type);
        const rawBulkUnit = columnMappings["baseUnit"]
          ? row[columnMappings["baseUnit"]] || ""
          : "";
        const bulkUnit = normalizeBulkUnit(rawBulkUnit, type);
        const rawBulkSize = columnMappings["baseUnitAmount"]
          ? row[columnMappings["baseUnitAmount"]] || ""
          : "";
        let bulkSize = parseFloat(rawBulkSize);
        if (isNaN(bulkSize) || rawBulkSize === "") {
          if (type === "spirit") bulkSize = 750;
          else if (type === "beer") bulkSize = 24;
          else if (type === "mixer") bulkSize = 1000;
          else bulkSize = 1;
        }
        const baseUnitAmount = convertBulkSize(bulkSize, bulkUnit, rawBulkUnit);
        const rawServingSize = columnMappings["servingSize"]
          ? row[columnMappings["servingSize"]] || ""
          : "";
        let servingSizeVal = parseFloat(rawServingSize);
        if (isNaN(servingSizeVal) || rawServingSize === "") {
          if (type === "spirit") servingSizeVal = 1.5;
          else if (type === "beer") servingSizeVal = 1;
          else if (type === "mixer") servingSizeVal = 1;
          else servingSizeVal = 1;
        }
        const servingUnit = normalizeServingUnit(
          rawServingSize ? bulkUnit : "",
          bulkUnit,
        );
        const servingSizeInBase = convertServingSize(
          servingSizeVal,
          servingUnit,
          bulkUnit,
        );
        const rawCost = columnMappings["orderCost"]
          ? row[columnMappings["orderCost"]] || "0"
          : "0";
        const bulkCost = parseFloat(rawCost.replace(/[$,]/g, ""));
        const rawStock = columnMappings["currentStock"]
          ? row[columnMappings["currentStock"]] || "0"
          : "0";
        const currentStock = parseFloat(rawStock) || 0;
        const unitsPerCase =
          type === "beer" && rawBulkUnit.toLowerCase().trim() === "case"
            ? bulkSize
            : type === "beer"
              ? 24
              : 1;

        return {
          name,
          nameEs: "",
          type,
          subtype,
          baseUnit: bulkUnit,
          baseUnitAmount,
          orderCost: isNaN(bulkCost) ? 0 : bulkCost,
          currentStock:
            currentStock > 0 && type !== "beer"
              ? currentStock * baseUnitAmount
              : currentStock,
          servingSize: servingSizeInBase,
          lowStockThreshold: 1,
          unitsPerCase,
          isOnMenu: false,
        };
      })
      .filter((item) => item.name.trim());

    // Check for blank required fields before preview
    const blankRows: { row: number; fields: string[] }[] = [];
    parsed.forEach((item, idx) => {
      const blanks: string[] = [];
      APP_COLUMNS.filter((c) => c.required).forEach((col) => {
        if (
          !(item as any)[col.key] ||
          String((item as any)[col.key]).trim() === ""
        ) {
          blanks.push(col.label);
        }
      });
      if (blanks.length > 0) {
        blankRows.push({ row: idx + 1, fields: blanks });
      }
    });
    if (blankRows.length > 0) {
      setBlankFieldRows(blankRows);
      setPendingImport(parsed);
      setShowBlankFieldModal(true);
      return;
    }
    setIngredientPreview(parsed);
    setMappingStep("preview");
    toast({
      title: "Mappings applied",
      description: `${parsed.length} ingredients ready to import`,
    });
  };

  const handleResetImport = () => {
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMappings({});
    setIngredientPreview([]);
    setMappingStep("upload");
    setShowIngredientImport(false);
  };

  const handleRecipeImport = async () => {
    try {
      const res = await fetch("/api/admin/bulk-drinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drinks: recipePreview }),
      });
      const data = await res.json();
      if (!res.ok) {
        let errorMsg = data.error || "Drinks import failed";
        // Format validation errors if present
        if (data.validationErrors && Array.isArray(data.validationErrors)) {
          const errorList = data.validationErrors
            .slice(0, 5)
            .map((e: any) => {
              return "Row " + e.row + ": " + e.errors.join("; ");
            })
            .join("\n");
          errorMsg =
            data.summary +
            "\n\n" +
            errorList +
            (data.validationErrors.length > 5 ? "\n..." : "");
        }
        throw new Error(errorMsg);
      }
      toast({
        title: getTranslation("success", language),
        description: data.message || recipePreview.length + " recipes imported",
      });
      setShowRecipeImport(false);
      setRecipePreview([]);
      qc.invalidateQueries({ queryKey: ["/api/drinks"] });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Import Error",
        description: e.message || "Failed to perform bulk import",
      });
    }
  };

  const handleIngredientImport = async () => {
    try {
      const res = await fetch("/api/admin/bulk-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientPreview }),
      });
      const data = await res.json();
      if (!res.ok) {
        let errorMsg = data.error || "Ingredients import failed";
        // Format validation errors if present
        if (data.validationErrors && Array.isArray(data.validationErrors)) {
          const errorList = data.validationErrors
            .slice(0, 5)
            .map(function (e: any) {
              return "Row " + e.row + ": " + e.errors.join("; ");
            })
            .join("\n");
          errorMsg =
            data.summary +
            "\n\n" +
            errorList +
            (data.validationErrors.length > 5 ? "\n..." : "");
        }
        throw new Error(errorMsg);
      }
      toast({
        title: getTranslation("success", language),
        description:
          data.message || ingredientPreview.length + " ingredients imported",
      });
      handleResetImport();
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Import Error",
        description: e.message || "Failed to perform bulk import",
      });
    }
  };

  const handleSeedStarter = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed-starter", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast({
          title: getTranslation("success", language),
          description: "Starter data seeded successfully",
        });
        qc.invalidateQueries({ queryKey: ["/api/drinks"] });
        qc.invalidateQueries({ queryKey: ["/api/inventory/items"] });
        setShowSeedModal(false);
      } else {
        toast({
          variant: "destructive",
          title: getTranslation("error", language),
          description: data.error,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: err.message,
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetDatabase = () => {
    setShowDeleteDataModal(true);
  };

  const handleSaveStaff = () => {
    if (!editingStaff) return;

    const { password, ...rest } = editingStaff;

    if (editingStaff.id) {
      const payload: any = { ...rest };
      if (password) payload.password = password;

      updateUser.mutate({ id: editingStaff.id, data: payload });
    } else {
      createUser.mutate({
        ...rest,
        password: password || "",
        isActive: true,
      });
    }
  };

  const handleAddRush = () => {
    createRush.mutate({ data: newRush });
  };

  const handleDeleteRush = (rush: any) => {
    setDeletingRush(rush);
  };

  const confirmDeleteRush = () => {
    if (!deletingRush) return;
    deleteRush.mutate(
      { id: deletingRush.id },
      {
        onSuccess: () => {
          refetchRushes();
          toast({
            title: getTranslation("success", language),
            description: "Rush event deleted",
          });
          setDeletingRush(null);
        },
        onError: (_err: any) => {
          toast({
            variant: "destructive",
            title: getTranslation("error", language),
            description: "Failed to delete rush",
          });
        },
      },
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Blank Field Import Modal */}
      <Dialog open={showBlankFieldModal} onOpenChange={setShowBlankFieldModal}>
        <DialogContent>
          <DialogTitle>Blank Required Fields Detected</DialogTitle>
          <div className="mb-4 text-sm text-muted-foreground">
            The following rows have missing required fields:
            <ul className="list-disc ml-6 mt-2">
              {blankFieldRows.map((row) => (
                <li key={row.row}>
                  Row {row.row}: {row.fields.join(", ")}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              You can abort and fix the CSV, or proceed. If you proceed, these
              items will be marked incomplete and cannot be added to the menu
              until completed.
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="destructive"
              onClick={() => setShowBlankFieldModal(false)}
            >
              Abort Import
            </Button>
            <Button onClick={() => setShowBlankFieldModal(false)}>
              Proceed Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div>
        <h1 className="text-4xl font-display">
          {getTranslation("settings", language)}
        </h1>
        <p className="text-muted-foreground mt-1">Configure your POS system</p>
      </div>

      {/* Branding & Config */}
      <section className="glass rounded-3xl p-6 space-y-6">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2 border-b border-white/5 pb-2">
          <Globe size={18} /> Branding & Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase">
                Bar Name
              </label>
              <input
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                value={formData.barName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, barName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase">
                Brand Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {BRAND_ICONS.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    onClick={() => setFormData({ ...formData, barIcon: name })}
                    className={
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all " +
                      (formData.barIcon === name
                        ? "bg-primary text-primary-foreground ring-2 ring-primary"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10")
                    }
                  >
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase">
                USD → MXN Rate
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                value={formData.usdToMxnRate || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usdToMxnRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase">
                CAD → MXN Rate
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                value={formData.cadToMxnRate || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cadToMxnRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase">
                Default Markup Factor
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                value={formData.defaultMarkupFactor || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultMarkupFactor: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </div>
        <Button className="w-full" onClick={handleSaveSettings}>
          <Save size={16} className="mr-2" /> Save Configuration
        </Button>
      </section>

      {/* Backups / Disaster Recovery */}
      <section className="glass rounded-3xl p-6 space-y-6">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2 border-b border-white/5 pb-2">
          <Shield size={18} /> Backups & Disaster Recovery
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <HardDrive size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">Litestream Replication</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Stream SQLite WAL to S3-compatible storage for real-time backup
              </p>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableLitestream}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enableLitestream: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-white/30"
                />
                <span className="text-xs font-medium">Enable Litestream</span>
              </label>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Archive size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">USB Local Backup</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Periodic backup to mounted USB drive for offline recovery
              </p>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableUsbBackup}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enableUsbBackup: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-white/30"
                />
                <span className="text-xs font-medium">Enable USB Backup</span>
              </label>
            </div>
          </div>
        </div>
        <Button className="w-full" onClick={handleSaveSettings}>
          <Save size={16} className="mr-2" /> Save Backup Settings
        </Button>
      </section>

      {/* SMTP / Notifications - DISABLED for offline-first deployment */}
      {/* Email notifications not available in local/offline mode */}

      {/* Staff Management */}
      <section className="glass rounded-3xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h3 className="text-lg font-medium text-primary flex items-center gap-2">
            <Users size={18} /> Staff Management
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                setEditingStaff({
                  firstName: "",
                  lastName: "",
                  email: "",
                  role: "bartender",
                  pin: "",
                  isActive: true,
                })
              }
            >
              <Plus size={16} className="mr-2" /> Add Staff
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground text-sm">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">PIN</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users?.map((user: any) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {user.email || "—"}
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 capitalize">
                      {user.role?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-sm">{user.pin || "—"}</td>
                  <td className="p-3">
                    <span
                      className={
                        "text-xs font-medium px-2 py-1 rounded-full " +
                        (user.isActive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-secondary text-muted-foreground")
                      }
                    >
                      {user.isActive ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingStaff(user)}
                    >
                      <Edit2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Data Management */}
      <section className="glass rounded-3xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h3 className="text-lg font-medium text-primary flex items-center gap-2">
            <Database size={18} /> Data Management
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-6"
            onClick={() => setShowIngredientImport(true)}
          >
            <Upload size={24} />
            <span>Import Ingredients</span>
            <span className="text-xs text-muted-foreground font-normal">
              Bulk CSV upload
            </span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-6"
            onClick={() => setShowRecipeImport(true)}
          >
            <FileSpreadsheet size={24} />
            <span>Import Recipes</span>
            <span className="text-xs text-muted-foreground font-normal">
              Bulk recipe upload
            </span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-6 hover:text-white"
            onClick={() => setShowSeedModal(true)}
            disabled={isSeeding}
          >
            <Database size={24} />
            <span>Seed Library</span>
            <span className="text-xs text-muted-foreground font-normal">
              Load starter data
            </span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleResetDatabase}
            disabled={isResetting}
          >
            <Trash2 size={24} />
            <span>Reset Database</span>
            <span className="text-xs text-muted-foreground font-normal">
              {isResetting ? "Resetting..." : "Delete all data"}
            </span>
          </Button>
        </div>
      </section>

      {/* Rush Events */}
      <section className="glass rounded-3xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h3 className="text-lg font-medium text-primary flex items-center gap-2">
            <Zap size={18} /> Rush Events
          </h3>
          <Button size="sm" onClick={() => setShowAddRush(true)}>
            <Plus size={16} className="mr-2" /> Schedule Rush
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground text-sm">
                <th className="p-3 font-medium">Event</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Impact</th>
                <th className="p-3 font-medium">Start Time</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rushes?.map((rush: any) => (
                <tr
                  key={rush.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-3 font-medium text-sm">{rush.title}</td>
                  <td className="p-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 capitalize">
                      {rush.type?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        "text-xs font-medium px-2 py-1 rounded-full " +
                        (rush.impact === "high"
                          ? "bg-red-500/20 text-red-400"
                          : rush.impact === "medium"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-emerald-500/20 text-emerald-400")
                      }
                    >
                      {rush.impact}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {rush.startTime
                      ? format(new Date(rush.startTime), "PPp")
                      : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRush(rush)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rush Add Modal */}
      {showAddRush && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative">
            <button
              onClick={() => setShowAddRush(false)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-6">Schedule a Rush</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Event Title
                </label>
                <input
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                  placeholder="e.g. Carnival Panorama Arrival"
                  value={newRush.title}
                  onChange={(e) =>
                    setNewRush({ ...newRush, title: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Type
                  </label>
                  <select
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                    value={newRush.type}
                    onChange={(e) =>
                      setNewRush({ ...newRush, type: e.target.value as any })
                    }
                  >
                    <option value="cruise">Cruise Ship</option>
                    <option value="festival">Festival</option>
                    <option value="music">Live Music</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Impact
                  </label>
                  <select
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                    value={newRush.impact}
                    onChange={(e) =>
                      setNewRush({ ...newRush, impact: e.target.value as any })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                  value={newRush.startTime}
                  onChange={(e) =>
                    setNewRush({ ...newRush, startTime: e.target.value })
                  }
                />
              </div>
              <Button
                className="w-full h-14 mt-4"
                onClick={handleAddRush}
                disabled={createRush.isPending}
              >
                Schedule Event
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Edit Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative">
            <button
              onClick={() => setEditingStaff(null)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-6">
              {editingStaff.id ? "Edit Staff" : "New Staff"}
            </h2>

            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {getTranslation("first_name", language)}
                  </label>
                  <input
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                    value={editingStaff.firstName || ""}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        firstName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {getTranslation("last_name", language)}
                  </label>
                  <input
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                    value={editingStaff.lastName || ""}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        lastName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Email or Username (Optional)
                </label>
                <input
                  type="text"
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                  placeholder="staff identifier (optional)"
                  value={editingStaff.email || ""}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, email: e.target.value })
                  }
                />
              </div>

              {(editingStaff.role === "admin" ||
                editingStaff.role === "manager" ||
                editingStaff.role === "head_bartender") && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium text-primary flex items-center gap-2">
                    <Lock size={14} /> Account Password
                  </label>
                  <input
                    type="password"
                    className="w-full bg-secondary border border-primary/30 rounded-xl px-4 py-3 text-foreground"
                    placeholder={
                      editingStaff.id
                        ? "Leave blank to keep current"
                        : "Set login password"
                    }
                    value={editingStaff.password || ""}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        password: e.target.value,
                      })
                    }
                  />
                  {/* Reset Password Button for Admins */}
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={async () => {
                      if (!editingStaff.email || !editingStaff.pin) {
                        toast({
                          variant: "destructive",
                          title: "Missing Email or PIN",
                          description:
                            "Staff must have an email and PIN set to reset password.",
                        });
                        return;
                      }
                      const newPass = prompt(
                        "Enter new password for this staff member:",
                      );
                      if (!newPass) return;
                      try {
                        const response = await fetch(
                          "/api/auth/reset-password",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              email: editingStaff.email,
                              pin: editingStaff.pin,
                              newPassword: newPass,
                            }),
                          },
                        );
                        const data = await response.json();
                        if (response.status === 429) {
                          toast({
                            variant: "destructive",
                            title: "Too Many Attempts",
                            description:
                              "Too many reset attempts. Please try again in 15 minutes.",
                          });
                        } else if (data.success) {
                          toast({
                            title: "Password Reset",
                            description:
                              "Password has been reset for this staff member.",
                          });
                        } else {
                          toast({
                            variant: "destructive",
                            title: "Reset Failed",
                            description:
                              data.error || "Could not reset password.",
                          });
                        }
                      } catch {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: "Could not connect to server",
                        });
                      }
                    }}
                  >
                    Reset Password (Admin)
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {getTranslation("role", language)}
                  </label>
                  <select
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                    value={editingStaff.role}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, role: e.target.value })
                    }
                  >
                    <option value="admin">
                      {getTranslation("admin", language)}
                    </option>
                    <option value="manager">
                      {getTranslation("manager", language)}
                    </option>
                    <option value="head_bartender">
                      {getTranslation("head_bartender", language)}
                    </option>
                    <option value="bartender">
                      {getTranslation("bartender", language)}
                    </option>
                    <option value="server">
                      {getTranslation("server", language)}
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {getTranslation("pin", language)} (4 digits)
                  </label>
                  <input
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground font-mono"
                    maxLength={4}
                    value={editingStaff.pin || ""}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, pin: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={editingStaff.isActive}
                  onChange={(e) =>
                    setEditingStaff({
                      ...editingStaff,
                      isActive: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded-lg border-white/10 bg-secondary"
                />
                <div className="ml-2">
                  <label
                    htmlFor="is-active"
                    className="text-sm font-bold text-foreground block"
                  >
                    Currently Active
                  </label>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Uncheck to archive (Hide from PIN Pad)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
              <Button variant="ghost" onClick={() => setEditingStaff(null)}>
                {getTranslation("cancel", language)}
              </Button>
              <Button
                onClick={handleSaveStaff}
                disabled={updateUser.isPending || createUser.isPending}
              >
                {getTranslation("save", language)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Seed Starter Modal */}
      {showSeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative">
            <button
              onClick={() => setShowSeedModal(false)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-2 flex items-center gap-2">
              <Database className="text-primary" /> Seed Library
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              This will load approx. 50+ ingredients and standard recipes into
              your inventory. Continue?
            </p>
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-white/10">
              <Button variant="ghost" onClick={() => setShowSeedModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSeedStarter}
                disabled={isSeeding}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                {isSeeding ? "Seeding..." : "Load Starter Data"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Import Modal */}
      {showRecipeImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative border border-white/10">
            <button
              onClick={() => {
                setShowRecipeImport(false);
                setRecipePreview([]);
              }}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-2 flex items-center gap-2">
              <FileSpreadsheet className="text-primary" /> Recipe Bulk Import
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Upload a CSV with headers: Name, Category, Price, Ingredients
              (Format: &quot;Ingredient:Amount, ...&quot;)
            </p>

            <div className="flex-1 overflow-hidden flex flex-col gap-6">
              <div className="p-10 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleRecipeUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload size={48} className="text-primary mb-4" />
                <p className="text-lg font-medium">Select your Recipes CSV</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Example: Margarita, cocktail, 140, &quot;Tequila:60, Lime:30,
                  Agave:15&quot;
                </p>
              </div>

              <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden flex flex-col flex-1">
                <div className="p-4 border-b border-white/5 font-bold text-sm bg-white/5 flex justify-between items-center">
                  <span>Preview ({recipePreview.length} drinks)</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {recipePreview.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-foreground text-sm">
                          {item.name}
                        </div>
                        <div className="text-muted-foreground">
                          {item.category} • {item.recipe.length} ingredients
                        </div>
                      </div>
                      <div className="flex-1 px-4 text-muted-foreground italic truncate">
                        {item.recipe
                          .map(
                            (r: any) =>
                              r.ingredientName +
                              " (" +
                              r.amountInBaseUnit +
                              "ml)",
                          )
                          .join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRecipeImport(false);
                  setRecipePreview([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecipeImport}
                disabled={recipePreview.length === 0}
                className="px-12 bg-primary hover:bg-primary/90 text-primary-foreground h-12 shadow-lg shadow-primary/20"
              >
                Save Recipes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ingredient Import Modal */}
      {showIngredientImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative border border-white/10">
            <button
              onClick={handleResetImport}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-2 flex items-center gap-2">
              <Upload className="text-primary" /> Ingredient Bulk Import
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Upload a CSV and map your columns to the app&apos;s fields
            </p>

            {/* Step 1: Upload */}
            {mappingStep === "upload" && (
              <div className="p-10 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleIngredientUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload size={48} className="text-primary mb-4" />
                <p className="text-lg font-medium">
                  Select your Ingredients CSV
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Any CSV format — you&apos;ll map columns next
                </p>
              </div>
            )}

            {/* Step 2: Map Columns */}
            {mappingStep === "map" && (
              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="bg-white/5 rounded-2xl border border-white/5 p-4">
                  <h3 className="text-sm font-bold text-foreground mb-3">
                    Map CSV Columns
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {csvRows.length} rows detected from {csvHeaders.length}{" "}
                    columns. Map each app field to the corresponding CSV column.
                  </p>
                  <div className="space-y-3">
                    {APP_COLUMNS.map((col) => (
                      <div key={col.key} className="flex items-center gap-4">
                        <div className="w-40 shrink-0">
                          <span className="text-sm font-medium text-foreground">
                            {col.label}
                          </span>
                          {col.required && (
                            <span className="text-red-400 ml-1">*</span>
                          )}
                        </div>
                        <select
                          className="flex-1 bg-secondary border border-white/10 rounded-xl px-4 py-2 text-foreground text-sm"
                          value={columnMappings[col.key] || ""}
                          onChange={(e) =>
                            setColumnMappings({
                              ...columnMappings,
                              [col.key]: e.target.value,
                            })
                          }
                        >
                          <option value="">— None —</option>
                          {csvHeaders.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button variant="ghost" onClick={handleResetImport}>
                    Cancel
                  </Button>
                  <Button onClick={handleApplyMappings}>Apply & Preview</Button>
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {mappingStep === "preview" && (
              <div className="flex-1 overflow-hidden flex flex-col gap-6">
                <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden flex flex-col flex-1">
                  <div className="p-4 border-b border-white/5 font-bold text-sm bg-white/5 flex justify-between items-center">
                    <span>
                      Preview ({ingredientPreview.length} ingredients)
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {ingredientPreview.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <div className="font-bold text-foreground text-sm">
                            {item.name}
                          </div>
                          <div className="text-muted-foreground">
                            {item.type} • {item.baseUnit} •{" "}
                            {item.baseUnitAmount}
                          </div>
                        </div>
                        <div className="text-muted-foreground">
                          Cost:{" "}
                          {item && item.orderCost !== undefined
                            ? item.orderCost.toFixed(2)
                            : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button variant="ghost" onClick={() => setMappingStep("map")}>
                    Back to Mapping
                  </Button>
                  <Button
                    onClick={handleIngredientImport}
                    disabled={ingredientPreview.length === 0}
                    className="px-12 bg-primary hover:bg-primary/90 text-primary-foreground h-12 shadow-lg shadow-primary/20"
                  >
                    Save Ingredients
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Rush Confirmation Modal */}
      {deletingRush && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative border border-white/10 shadow-2xl">
            <button
              onClick={() => setDeletingRush(null)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <Trash2 size={24} className="text-destructive" />
              <h2 className="text-2xl font-display font-bold text-destructive">
                Delete Rush Event
              </h2>
            </div>

            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete the rush event &quot;
              {deletingRush.title}&quot;? This action cannot be undone.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setDeletingRush(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteRush}
                disabled={deleteRush.isPending}
              >
                {deleteRush.isPending ? "..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Data Confirmation Modal */}
      {/* Audit Logs */}
      <section className="glass rounded-3xl p-6 space-y-6">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2 border-b border-white/5 pb-2">
          <Shield size={18} /> Audit Logs
        </h3>
        <div className="flex gap-2 mb-4">
          {["all", "tab", "inventory", "user"].map((filter) => {
            const isActive = auditFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => {
                  setAuditFilter(
                    filter as "all" | "tab" | "inventory" | "user",
                  );
                  setAuditOffset(0);
                  fetchAuditLogs(0, filter);
                }}
                className={
                  "px-4 py-2 rounded-lg font-medium text-sm transition-colors " +
                  (isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary border border-white/10 hover:bg-white/5")
                }
              >
                {filter === "all"
                  ? "All Events"
                  : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            );
          })}
        </div>

        {auditLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No audit logs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-muted-foreground text-xs">
                  <th className="p-3 font-medium">Timestamp</th>
                  <th className="p-3 font-medium">User</th>
                  <th className="p-3 font-medium">Action</th>
                  <th className="p-3 font-medium">Entity</th>
                  <th className="p-3 font-medium">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3 text-sm font-medium">
                      {log.userName || log.userId}
                    </td>
                    <td className="p-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary">
                        {log.action?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {log.entityType} / {log.entityId?.slice(0, 8)}...
                    </td>
                    <td className="p-3 text-xs">
                      {log.reason && (
                        <span className="text-muted-foreground">
                          {log.reason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {auditLogs.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => {
                const newOffset = Math.max(0, auditOffset - 50);
                setAuditOffset(newOffset);
                fetchAuditLogs(newOffset, auditFilter);
              }}
              disabled={auditOffset === 0}
              className="px-4 py-2 rounded-lg bg-secondary border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Offset: {auditOffset}
            </span>
            <button
              onClick={() => {
                const newOffset = auditOffset + 50;
                setAuditOffset(newOffset);
                fetchAuditLogs(newOffset, auditFilter);
              }}
              disabled={auditLogs.length < 50}
              className="px-4 py-2 rounded-lg bg-secondary border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Delete Data Modal */}
      {showDeleteDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative border border-white/10 shadow-2xl">
            <button
              onClick={() => setShowDeleteDataModal(false)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <Trash2 size={24} className="text-destructive" />
              <h2 className="text-2xl font-display font-bold text-destructive">
                Delete All Data
              </h2>
            </div>

            <p className="text-muted-foreground mb-6">
              <strong className="text-foreground block mb-3">
                Warning: This action cannot be undone!
              </strong>
              This will permanently delete ALL data including tabs, inventory,
              recipes, settings, and users. Your database will be reset to the
              seed state.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDataModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setIsResetting(true);
                  try {
                    const res = await fetch("/api/admin/reset-database", {
                      method: "POST",
                    });

                    if (!res.ok) {
                      throw new Error("Failed to reset database");
                    }

                    toast({
                      title: "Success",
                      description: "Database has been reset.",
                    });
                    setShowDeleteDataModal(false);
                    window.location.reload();
                  } catch (err: any) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: err.message || "Failed to reset",
                    });
                  } finally {
                    setIsResetting(false);
                  }
                }}
                disabled={isResetting}
              >
                {isResetting ? "Resetting..." : "Delete All"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
