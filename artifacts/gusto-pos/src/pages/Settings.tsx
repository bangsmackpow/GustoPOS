import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  useGetSettings,
  useUpdateSettings,
  useGetUsers,
  useUpdateUser,
  useCreateUser,
  useGetCurrentAuthUser,
  useGetDrinks,
} from "@workspace/api-client-react";
import { usePosStore } from "@/store";
import { getTranslation } from "@/lib/utils";
import { ML_PER_OZ } from "@/lib/constants";
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
  Download,
  FileSpreadsheet,
  Database,
  RefreshCw,
  Sliders,
  ChevronDown,
  ClipboardList,
  Sparkles,
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
    label: "name",
    required: true,
    suggest: ["name"],
  },
  {
    key: "type",
    label: "type",
    required: true,
    suggest: ["type"],
  },
  {
    key: "subtype",
    label: "subtype",
    required: false,
    suggest: ["subtype"],
  },
  {
    key: "trackingMode",
    label: "tracking_mode",
    required: false,
    hint: "Pool, Collection, or Auto",
    suggest: ["tracking_mode"],
  },
  {
    key: "bottleSizeMl",
    label: "bottle_size_ml",
    required: false,
    hint: "Pool: ml per bottle | Collection: units per case",
    suggest: ["bottle_size_ml"],
  },
  {
    key: "fullBottleWeightG",
    label: "full_bottle_weight_g",
    required: false,
    hint: "Pool only - total weight of full bottle",
    suggest: ["full_bottle_weight_g"],
  },
  {
    key: "density",
    label: "density",
    required: false,
    hint: "Liquid density (default: 0.94)",
    suggest: ["density"],
  },
  {
    key: "servingSize",
    label: "serving_size",
    required: false,
    hint: "Pool: oz per serving | Collection: units per serving",
    suggest: ["serving_size"],
  },
  {
    key: "orderCost",
    label: "order_cost",
    required: false,
    hint: "Price per bottle/case",
    suggest: ["order_cost"],
  },
  {
    key: "lowStockThreshold",
    label: "low_stock_threshold",
    required: false,
    hint: "Minimum stock before alert",
    suggest: ["low_stock_threshold"],
  },
  {
    key: "isOnMenu",
    label: "is_on_menu",
    required: false,
    hint: "Available for sale",
    suggest: ["is_on_menu"],
  },
  {
    key: "currentSealed",
    label: "current_sealed",
    required: false,
    hint: "Pool: full bottles | Collection: unopened cases",
    suggest: ["current_sealed"],
  },
  {
    key: "currentPartial",
    label: "current_partial",
    required: false,
    hint: "Pool: partial bottle weight in grams | Collection: loose units",
    suggest: ["current_partial"],
  },
  {
    key: "menuPricePerServing",
    label: "price_per_serving",
    required: false,
    hint: "Manual menu price per serving",
    suggest: ["price_per_serving"],
  },
];

export default function Settings() {
  // For blank field import confirmation
  const [blankFieldRows, setBlankFieldRows] = useState<any[]>([]);
  const [showBlankFieldModal, setShowBlankFieldModal] = useState(false);
  const [pendingImport, setPendingImport] = useState<any[]>([]);
  const { language } = usePosStore();
  const [rushDays, setRushDays] = useState(7);
  const [showAllRushes, setShowAllRushes] = useState(false);
  const { data: settings } = useGetSettings();
  const { data: users, refetch: refetchUsers } = useGetUsers();
  const { data: drinks } = useGetDrinks();
  const updateSettings = useUpdateSettings();
  const updateUser = useUpdateUser();
  const createUser = useCreateUser();

  const { toast } = useToast();
  const { data: auth } = useGetCurrentAuthUser();
  const isAdmin = auth?.user?.role === "admin";
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    barName: "",
    barIcon: "Wine",
    usdToMxnRate: 0,
    cadToMxnRate: 0,
    defaultMarkupFactor: 3.0,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpFromEmail: "",
    inventoryAlertEmail: "",
    enableLitestream: false,
    enableUsbBackup: false,
    usbBackupPath: "",
    reportExportPath: "",
    pinLockTimeoutMin: 5,
    autoBackupEnabled: true,
    autoBackupIntervalMin: 15,
    maxAutoBackups: 5,
  });

  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  const qc = useQueryClient();
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [staffFilter, setStaffFilter] = useState<"all" | "active" | "archived">(
    "active",
  );

  const [showSeedModal, setShowSeedModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showSeedCocktailsModal, setShowSeedCocktailsModal] = useState(false);
  const [isSeedingCocktails, setIsSeedingCocktails] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);

  const [showRecipeImport, setShowRecipeImport] = useState(false);
  const [systemDefaults, setSystemDefaults] = useState<any>({
    defaultAlcoholDensity: 0.94,
    defaultServingSizeMl: 44.36,
    defaultBottleSizeMl: 750,
    defaultUnitsPerCase: 1,
    defaultLowStockThreshold: 0,
    defaultTrackingMode: "auto",
    defaultAuditMethod: "auto",
    varianceWarningThreshold: 5.0,
  });
  const [defaultsLoading, setDefaultsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditOffset, setAuditOffset] = useState(0);
  const [auditFilter, setAuditFilter] = useState<
    "all" | "tab" | "inventory" | "user"
  >("all");
  const [batchAuditLoading, setBatchAuditLoading] = useState(false);
  const [auditSessions, setAuditSessions] = useState<any[]>([]);
  const [auditSessionsLoading, setAuditSessionsLoading] = useState(false);
  const [servingSizeUnit, setServingSizeUnit] = useState<"ml" | "oz">("ml");
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
  const [importStrategy, setImportStrategy] = useState<
    "update" | "replace" | "skip" | "merge"
  >("update");
  const [newRush, setNewRush] = useState({
    title: "",
    type: "cruise" as const,
    impact: "medium" as const,
    repeatEvent: 0,
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: "",
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

  const handleStartBatchAudit = async (typeFilter: string) => {
    setBatchAuditLoading(true);
    try {
      const res = await fetch("/api/inventory/audit-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeFilter,
          startedByUserId: auth?.user?.id,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }
      const session = await res.json();
      fetchAuditSessions();
      setLocation("/settings/batch-audit/" + session.id);
    } catch (err: any) {
      console.error("Batch audit error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to start batch audit",
      });
    } finally {
      setBatchAuditLoading(false);
    }
  };

  const fetchAuditSessions = async () => {
    setAuditSessionsLoading(true);
    try {
      const res = await fetch("/api/inventory/audit-sessions");
      if (!res.ok) throw new Error("Failed to fetch audit sessions");
      const data = await res.json();
      setAuditSessions(data);
    } catch {
      // Silently fail
    } finally {
      setAuditSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditSessions();
  }, []);

  useEffect(() => {
    if (settings && !formData.barName) {
      setFormData({
        barName: settings.barName,
        barIcon: settings.barIcon || "Wine",
        usdToMxnRate: settings.usdToMxnRate,
        cadToMxnRate: settings.cadToMxnRate,
        defaultMarkupFactor: settings.defaultMarkupFactor ?? 3.0,
        smtpHost: settings.smtpHost || "",
        smtpPort: settings.smtpPort || 587,
        smtpUser: settings.smtpUser || "",
        smtpPassword: settings.smtpPassword || "",
        smtpFromEmail: settings.smtpFromEmail || "",
        inventoryAlertEmail: settings.inventoryAlertEmail || "",
        enableLitestream: settings.enableLitestream,
        enableUsbBackup: settings.enableUsbBackup,
        usbBackupPath: settings.usbBackupPath || "",
        reportExportPath: settings.reportExportPath || "",
        pinLockTimeoutMin: settings.pinLockTimeoutMin ?? 5,
        autoBackupEnabled: settings.autoBackupEnabled ?? true,
        autoBackupIntervalMin: settings.autoBackupIntervalMin ?? 15,
        maxAutoBackups: settings.maxAutoBackups ?? 5,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch("/api/admin/backups");
      const data = await res.json();
      setBackups(data.backups || []);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load backups",
      });
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchBackups();
    // Fetch system defaults
    (async () => {
      try {
        const res = await fetch("/api/settings/defaults");
        if (res.ok) {
          const data = await res.json();
          setSystemDefaults(data);
        }
      } catch {
        // Silently fail
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveSettings = () => {
    updateSettings.mutate(
      formData,
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
        if (normalized === keyword.toLowerCase()) {
          return csvHeader;
        }
      }
    }
    return "";
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    let i = 0;
    while (i < line.length) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        inQuotes = !inQuotes;
        i++;
        continue;
      }
      if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
        i++;
        continue;
      }
      current += char;
      i++;
    }
    values.push(current.trim());
    return values;
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

        const headers = parseCSVLine(lines[0]);
        const rows = lines.slice(1).map((line) => {
          const values = parseCSVLine(line);
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

    const normalizeSubtype = (
      subtype: string,
      _type: string,
    ): string | null => {
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
        return servingSizeVal * ML_PER_OZ;
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

        // Container Size: Pool = ml per bottle, Collection = units per case
        const rawContainerSize = columnMappings["bottleSizeMl"]
          ? row[columnMappings["bottleSizeMl"]] || ""
          : "";
        let containerSize = parseFloat(rawContainerSize.replace(/,/g, ""));
        if (isNaN(containerSize) || rawContainerSize === "") {
          if (type === "spirit") containerSize = 750;
          else if (type === "mixer") containerSize = 1000;
          else if (type === "beer") containerSize = 24;
          else if (type === "ingredient") containerSize = 1000;
          else containerSize = 1;
        }

        // Get trackingMode from CSV if present, otherwise determine from container size
        const rawTrackingMode = columnMappings["trackingMode"]
          ? row[columnMappings["trackingMode"]] || ""
          : "";
        let trackingMode = rawTrackingMode.toLowerCase().trim();
        if (
          trackingMode !== "pool" &&
          trackingMode !== "collection" &&
          trackingMode !== "auto"
        ) {
          // Failsafe: Determine trackingMode based on container size
          // >=100 = ml (pool), <100 = units (collection)
          trackingMode = containerSize >= 100 ? "pool" : "collection";

          // Override based on type for known categories
          if (
            type === "spirit" ||
            type === "mixer" ||
            (type === "ingredient" && subtype === "liquid")
          ) {
            trackingMode = "pool";
          } else if (
            type === "beer" ||
            type === "merch" ||
            type === "misc" ||
            (type === "ingredient" && subtype === "weighted")
          ) {
            trackingMode = "collection";
          }
        }

        // Determine if this is Pool or Collection based on final trackingMode
        const isPool = trackingMode === "pool";
        const isCollection = trackingMode === "collection";

        // Full Bottle Weight - Pool only
        const rawFullWeight = columnMappings["fullBottleWeightG"]
          ? row[columnMappings["fullBottleWeightG"]] || ""
          : "";
        const fullBottleWeightG = parseFloat(rawFullWeight) || 0;

        // Container weight - auto-calculated from fullBottleWeightG in bulk-import.ts
        // Do NOT read from CSV - it's calculated, not user input
        const containerWeightG = 0;

        // Density - Pool only
        const rawDensity = columnMappings["density"]
          ? row[columnMappings["density"]] || ""
          : "0.94";
        const density = parseFloat(rawDensity) || 0.94;

        // Serving Size in oz - convert to ml for backend
        const rawServingSize = columnMappings["servingSize"]
          ? row[columnMappings["servingSize"]] || ""
          : "";
        let servingSize = parseFloat(rawServingSize);
        if (isNaN(servingSize) || rawServingSize === "") {
          if (type === "spirit") servingSize = 1.5;
          else if (type === "mixer") servingSize = 1;
          else if (type === "beer") servingSize = 12;
          else if (type === "ingredient") servingSize = 1;
          else servingSize = 1;
        }
        // Convert oz to ml for backend
        servingSize = servingSize * ML_PER_OZ;

        // Order Cost
        const rawCost = columnMappings["orderCost"]
          ? row[columnMappings["orderCost"]] || "0"
          : "0";
        const orderCost = parseFloat(rawCost.replace(/[$,]/g, "")) || 0;

        // Low Stock Threshold
        const rawThreshold = columnMappings["lowStockThreshold"]
          ? row[columnMappings["lowStockThreshold"]] || ""
          : "1";
        const lowStockThreshold = parseFloat(rawThreshold) || 1;

        // On Menu
        const rawOnMenu = columnMappings["isOnMenu"]
          ? row[columnMappings["isOnMenu"]] || ""
          : "";
        const isOnMenu =
          rawOnMenu.toLowerCase().trim() === "true" ||
          rawOnMenu.toLowerCase().trim() === "1" ||
          rawOnMenu.toLowerCase().trim() === "yes" ||
          rawOnMenu.toLowerCase().trim() === "on" ||
          rawOnMenu.toLowerCase().trim() === "available"
            ? 1
            : 0;

        // Current Sealed (full bottles for Pool, unopened cases for Collection)
        const rawSealed = columnMappings["currentSealed"]
          ? row[columnMappings["currentSealed"]] || ""
          : "";
        const currentSealed = parseFloat(rawSealed.replace(/,/g, "")) || 0;

        // Current Partial (weight in grams for Pool, loose units for Collection)
        const rawPartial = columnMappings["currentPartial"]
          ? row[columnMappings["currentPartial"]] || ""
          : "";
        const currentPartial = parseFloat(rawPartial.replace(/,/g, "")) || 0;

        // Menu Price Per Serving
        const rawMenuPrice = columnMappings["menuPricePerServing"]
          ? row[columnMappings["menuPricePerServing"]] || ""
          : "";
        const menuPricePerServing =
          parseFloat(rawMenuPrice.replace(/,/g, "")) || null;

        // Calculate currentStock for backend compatibility
        let currentStock = 0;
        if (trackingMode === "pool") {
          currentStock = currentSealed * containerSize + currentPartial;
        } else {
          currentStock = currentSealed * containerSize + currentPartial;
        }

        return {
          name,
          type,
          subtype,
          trackingMode,
          baseUnit: trackingMode === "pool" ? "ml" : "unit",
          baseUnitAmount:
            trackingMode === "pool" ? containerSize : containerSize,
          // Pool fields
          bottleSizeMl: trackingMode === "pool" ? containerSize : 0,
          fullBottleWeightG: trackingMode === "pool" ? fullBottleWeightG : 0,
          // containerWeightG is auto-calculated from fullBottleWeightG in backend
          density: trackingMode === "pool" ? density : 0.94,
          servingSize: servingSize,
          // Collection fields
          unitsPerCase: trackingMode === "collection" ? containerSize : 0,
          // Common fields
          orderCost: orderCost,
          lowStockThreshold: lowStockThreshold,
          isOnMenu: isOnMenu,
          currentStock: currentStock,
          currentBulk: currentSealed,
          currentPartial: currentPartial,
          menuPricePerServing: menuPricePerServing,
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
        body: JSON.stringify({
          ingredients: ingredientPreview,
          strategy: importStrategy,
        }),
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

  const handleSeedCocktails = async () => {
    setIsSeedingCocktails(true);
    try {
      const res = await fetch("/api/seed-cocktails", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast({
          title: getTranslation("success", language),
          description: `${data.count} cocktails seeded successfully`,
        });
        qc.invalidateQueries({ queryKey: ["/api/drinks"] });
        setShowSeedCocktailsModal(false);
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
      setIsSeedingCocktails(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({
          title: getTranslation("success", language),
          description: "Backup created successfully",
        });
        fetchBackups();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: err.message || "Failed to create backup",
      });
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleResetDatabase = () => {
    setShowDeleteDataModal(true);
  };

  const handleSaveStaff = () => {
    if (!editingStaff) return;

    if (!editingStaff.firstName?.trim()) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: "First name is required",
      });
      return;
    }

    if (
      !editingStaff.role ||
      !["admin", "employee"].includes(editingStaff.role)
    ) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: "Valid role is required (admin or employee)",
      });
      return;
    }

    if (
      !editingStaff.language ||
      !["en", "es"].includes(editingStaff.language)
    ) {
      editingStaff.language = "en";
    }

    const { password, ...rest } = editingStaff;

    if (editingStaff.id) {
      const payload: any = { ...rest };
      if (password) payload.password = password;

      updateUser.mutate(
        { id: editingStaff.id, data: payload },
        {
          onSuccess: () => {
            setEditingStaff(null);
            toast({
              title: getTranslation("success", language),
              description: "Staff member updated successfully",
            });
          },
          onError: (err: any) => {
            toast({
              variant: "destructive",
              title: getTranslation("error", language),
              description: err?.message || "Failed to update staff member",
            });
          },
        },
      );
    } else {
      createUser.mutate(
        {
          ...rest,
          password: password || "",
        },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["/api/users"] });
            setEditingStaff(null);
            toast({
              title: getTranslation("success", language),
              description: "New staff member created successfully",
            });
          },
          onError: (err: any) => {
            toast({
              variant: "destructive",
              title: getTranslation("error", language),
              description: err?.message || "Failed to create staff member",
            });
          },
        },
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Quick Navigation */}
      <div className="glass rounded-3xl p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Quick Navigation
        </h3>
        <div className="flex flex-wrap gap-2">
          <a
            href="#bar-settings"
            className="px-3 py-1.5 rounded-lg bg-secondary border border-white/10 text-sm hover:bg-white/5"
          >
            Bar Settings
          </a>
          <a
            href="#backup-settings"
            className="px-3 py-1.5 rounded-lg bg-secondary border border-white/10 text-sm hover:bg-white/5"
          >
            Backups
          </a>
          <a
            href="#inventory-settings"
            className="px-3 py-1.5 rounded-lg bg-secondary border border-white/10 text-sm hover:bg-white/5"
          >
            Inventory
          </a>
          <a
            href="#system-defaults"
            className="px-3 py-1.5 rounded-lg bg-secondary border border-white/10 text-sm hover:bg-white/5"
          >
            System Defaults
          </a>
          <a
            href="#audit-logs"
            className="px-3 py-1.5 rounded-lg bg-secondary border border-white/10 text-sm hover:bg-white/5"
          >
            Audit Logs
          </a>
          <a
            href="#data-management"
            className="px-3 py-1.5 rounded-lg bg-secondary border border-white/10 text-sm hover:bg-white/5"
          >
            Data Management
          </a>
        </div>
      </div>

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

      {/* Audit Logs */}
      <section id="audit-logs" className="glass rounded-3xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h3 className="text-lg font-medium text-primary flex items-center gap-2">
            <Shield size={18} /> Audit Logs
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => (window.location.href = "/inventory")}
            >
              <ClipboardList size={16} className="mr-2" />
              Individual
            </Button>
            <div className="relative">
              <Button
                size="sm"
                disabled={batchAuditLoading}
                onClick={() => {
                  const menu = document.getElementById("batch-audit-menu");
                  if (menu) menu.classList.toggle("hidden");
                }}
              >
                <ClipboardList size={16} className="mr-2" />
                Batch Audit
                <ChevronDown size={14} className="ml-1" />
              </Button>
              <div
                id="batch-audit-menu"
                className="hidden absolute right-0 mt-1 w-48 glass rounded-xl border border-white/10 shadow-lg z-50"
              >
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 rounded-t-xl"
                  onClick={() => {
                    document
                      .getElementById("batch-audit-menu")
                      ?.classList.add("hidden");
                    handleStartBatchAudit("all");
                  }}
                >
                  All Items
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/5"
                  onClick={() => {
                    document
                      .getElementById("batch-audit-menu")
                      ?.classList.add("hidden");
                    handleStartBatchAudit("spirit");
                  }}
                >
                  Spirits
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/5"
                  onClick={() => {
                    document
                      .getElementById("batch-audit-menu")
                      ?.classList.add("hidden");
                    handleStartBatchAudit("beer");
                  }}
                >
                  Beer
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/5"
                  onClick={() => {
                    document
                      .getElementById("batch-audit-menu")
                      ?.classList.add("hidden");
                    handleStartBatchAudit("mixer");
                  }}
                >
                  Mixers
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 rounded-b-xl"
                  onClick={() => {
                    document
                      .getElementById("batch-audit-menu")
                      ?.classList.add("hidden");
                    handleStartBatchAudit("ingredient");
                  }}
                >
                  Ingredients
                </button>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          View past inventory audits or perform a new audit. Use Individual for
          single items or Batch Audit to audit multiple items at once.
        </p>
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

      {/* Batch Audit Sessions */}
      <section className="glass rounded-3xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h3 className="text-lg font-medium text-primary flex items-center gap-2">
            <ClipboardList size={18} /> Batch Audit Sessions
          </h3>
          <Button size="sm" variant="outline" onClick={fetchAuditSessions}>
            <RefreshCw
              size={14}
              className={auditSessionsLoading ? "animate-spin" : ""}
            />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          View and resume incomplete batch audit sessions.
        </p>
        {auditSessionsLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : auditSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No batch audit sessions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-muted-foreground">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Items</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditSessions.map((session: any) => (
                  <tr key={session.id} className="hover:bg-white/5">
                    <td className="p-3">
                      {session.startedAt
                        ? format(
                            new Date(session.startedAt * 1000),
                            "MMM d, yyyy",
                          )
                        : "—"}
                    </td>
                    <td className="p-3 capitalize">
                      {session.typeFilter || "all"}
                    </td>
                    <td className="p-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                        {session.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{session.itemCount || 0}</td>
                    <td className="p-3 text-right">
                      {session.status === "in_progress" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setLocation("/settings/batch-audit/" + session.id)
                          }
                        >
                          Resume
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setLocation(
                              "/settings/batch-audit/" + session.id + "/report",
                            )
                          }
                        >
                          View Report
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Staff Management */}
      <section className="glass rounded-3xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h3 className="text-lg font-medium text-primary flex items-center gap-2">
            <Users size={18} /> Staff Management
          </h3>
          <div className="flex gap-2">
            <div className="flex bg-secondary/50 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setStaffFilter("active")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  staffFilter === "active"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStaffFilter("archived")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  staffFilter === "archived"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Archived
              </button>
              <button
                type="button"
                onClick={() => setStaffFilter("all")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  staffFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
            </div>
            <Button
              size="sm"
              onClick={() =>
                setEditingStaff({
                  firstName: "",
                  lastName: "",
                  username: "",
                  email: "",
                  role: "employee",
                  language: "en",
                  pin: "",
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
                <th className="p-3 font-medium">Username</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">PIN</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users
                ?.filter((user: any) => {
                  if (staffFilter === "active")
                    return user.isActive === 1 || user.isActive === true;
                  if (staffFilter === "archived")
                    return user.isActive === 0 || user.isActive === false;
                  return true;
                })
                .map((user: any) => (
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
                      {user.username || user.email || "—"}
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
          </div>
        </div>
        <Button className="w-full" onClick={handleSaveSettings}>
          <Save size={16} className="mr-2" /> Save Configuration
        </Button>
      </section>

      {/* Backups / Disaster Recovery */}
      <section id="backup-settings" className="glass rounded-3xl p-6 space-y-6">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2 border-b border-white/5 pb-2">
          <Shield size={18} /> Backups & Disaster Recovery
        </h3>

        {/* Quick Backup Button */}
        <Button
          className="w-full"
          onClick={handleCreateBackup}
          disabled={creatingBackup}
        >
          {creatingBackup ? (
            <RefreshCw size={16} className="mr-2 animate-spin" />
          ) : (
            <HardDrive size={16} className="mr-2" />
          )}
          {creatingBackup ? "Creating Backup..." : "Create Backup Now"}
        </Button>

        {/* Backup List */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-muted-foreground">
              Available Backups
            </h4>
            <Button variant="ghost" size="sm" onClick={() => fetchBackups()}>
              <RefreshCw size={14} className="mr-1" /> Refresh
            </Button>
          </div>
          {loadingBackups ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading...
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No backups yet. Click &quot;Create Backup Now&quot; above.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {backups.slice(0, 10).map((backup: any) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm"
                >
                  <a
                    href={`/api/admin/backups/${backup.filename}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline flex items-center gap-2"
                  >
                    <span className="text-muted-foreground">
                      {format(new Date(backup.createdAt), "MMM d, HH:mm")} -{" "}
                      {(backup.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </a>
                  <span className="capitalize text-xs px-2 py-0.5 bg-white/10 rounded">
                    {backup.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

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
              {formData.enableUsbBackup && (
                <>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.webkitdirectory = true;
                          input.onchange = async () => {
                            const files = input.files;
                            if (files && files.length > 0) {
                              const path =
                                files[0].webkitRelativePath || files[0].name;
                              const dirPath = path.split("/")[0] || "";
                              setFormData({
                                ...formData,
                                usbBackupPath: dirPath,
                              });
                            }
                          };
                          input.click();
                        } catch {
                          // Silently fail
                        }
                      }}
                    >
                      Choose USB Location
                    </Button>
                    {formData.usbBackupPath && (
                      <span className="text-xs text-muted-foreground">
                        Selected: {formData.usbBackupPath}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">Nightly Report Export</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Choose where to save nightly sales reports
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.webkitdirectory = true;
                      input.onchange = async () => {
                        const files = input.files;
                        if (files && files.length > 0) {
                          const path =
                            files[0].webkitRelativePath || files[0].name;
                          const dirPath = path.split("/")[0] || "";
                          setFormData({
                            ...formData,
                            reportExportPath: dirPath,
                          });
                        }
                      };
                      input.click();
                    } catch {
                      // Silently fail
                    }
                  }}
                >
                  Choose Report Location
                </Button>
              </div>
              {formData.reportExportPath && (
                <span className="text-xs text-green-400">
                  Selected: {formData.reportExportPath}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Manual Data Export */}
        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <Download size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">Manual Data Export</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Download system data as CSV spreadsheets
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open("/api/export/sales", "_blank")}
              >
                Sales
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open("/api/export/inventory", "_blank")}
              >
                Inventory
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open("/api/export/cogs", "_blank")}
              >
                COGS
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open("/api/export/audit-logs", "_blank")}
              >
                Audit Logs
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open("/api/export/periods", "_blank")}
              >
                Periods
              </Button>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={handleSaveSettings}>
          <Save size={16} className="mr-2" /> Save Backup Settings
        </Button>
      </section>

      {/* System Defaults */}
      <section id="system-defaults" className="glass rounded-3xl p-6 space-y-6">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2 border-b border-white/5 pb-2">
          <Sliders size={18} /> System Defaults
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure default values for new inventory items. These can be
          overridden per item.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Default Alcohol Density
            </label>
            <input
              type="number"
              step="0.01"
              value={systemDefaults.defaultAlcoholDensity}
              onChange={(e) =>
                setSystemDefaults({
                  ...systemDefaults,
                  defaultAlcoholDensity: parseFloat(e.target.value) || 0.94,
                })
              }
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
            />
            <p className="text-xs text-muted-foreground">
              {" "}
              spirits (default: 0.94)
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Default Serving Size
              </label>
              <div className="flex bg-secondary/50 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setServingSizeUnit("ml");
                  }}
                  className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${
                    servingSizeUnit === "ml"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ml
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setServingSizeUnit("oz");
                  }}
                  className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${
                    servingSizeUnit === "oz"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  oz
                </button>
              </div>
            </div>
            <input
              type="number"
              step="0.1"
              value={
                servingSizeUnit === "oz"
                  ? (systemDefaults.defaultServingSizeMl / ML_PER_OZ).toFixed(2)
                  : systemDefaults.defaultServingSizeMl
              }
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setSystemDefaults({
                  ...systemDefaults,
                  defaultServingSizeMl:
                    servingSizeUnit === "oz" ? val * ML_PER_OZ : val,
                });
              }}
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
            />
            <p className="text-xs text-muted-foreground">
              Only for Pool (weight-based) tracking. Collection uses 1
              unit/serving.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Default Bottle Size (ml)
            </label>
            <input
              type="number"
              value={systemDefaults.defaultBottleSizeMl}
              onChange={(e) =>
                setSystemDefaults({
                  ...systemDefaults,
                  defaultBottleSizeMl: parseInt(e.target.value) || 750,
                })
              }
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
            />
            <p className="text-xs text-muted-foreground">
              {" "}
              standard bottle (default: 750)
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Default Units Per Case
            </label>
            <input
              type="number"
              value={systemDefaults.defaultUnitsPerCase}
              onChange={(e) =>
                setSystemDefaults({
                  ...systemDefaults,
                  defaultUnitsPerCase: parseInt(e.target.value) || 1,
                })
              }
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
            />
            <p className="text-xs text-muted-foreground">
              {" "}
              beer/merch (default: 1)
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Default Low Stock Threshold
            </label>
            <input
              type="number"
              step="0.1"
              value={systemDefaults.defaultLowStockThreshold}
              onChange={(e) =>
                setSystemDefaults({
                  ...systemDefaults,
                  defaultLowStockThreshold: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
            />
            <p className="text-xs text-muted-foreground">
              {" "}
              alert threshold (default: 0)
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Tracking Mode</label>
            <select
              value={systemDefaults.defaultTrackingMode}
              onChange={(e) =>
                setSystemDefaults({
                  ...systemDefaults,
                  defaultTrackingMode: e.target.value,
                })
              }
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
            >
              <option value="auto">Auto (based on type)</option>
              <option value="pool">Pool (weight-based)</option>
              <option value="collection">Collection (unit-based)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Audit Method</label>
            <select
              value={systemDefaults.defaultAuditMethod}
              onChange={(e) =>
                setSystemDefaults({
                  ...systemDefaults,
                  defaultAuditMethod: e.target.value,
                })
              }
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
            >
              <option value="auto">Auto</option>
              <option value="weight">Weight-based</option>
              <option value="count">Count-based</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Variance Warning (%)</label>
            <input
              type="number"
              step="0.1"
              value={systemDefaults.varianceWarningThreshold}
              onChange={(e) =>
                setSystemDefaults({
                  ...systemDefaults,
                  varianceWarningThreshold: parseFloat(e.target.value) || 5.0,
                })
              }
              className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2"
            />
            <p className="text-xs text-muted-foreground">
              {" "}
              alert threshold (default: 5%)
            </p>
          </div>
        </div>
        <Button
          className="w-full"
          onClick={async () => {
            setDefaultsLoading(true);
            try {
              const res = await fetch("/api/settings/defaults", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(systemDefaults),
              });
              if (!res.ok) throw new Error("Failed to save");
              toast({
                title: "Success",
                description: "System defaults saved",
              });
            } catch (err: any) {
              toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "Failed to save defaults",
              });
            } finally {
              setDefaultsLoading(false);
            }
          }}
          disabled={defaultsLoading}
        >
          <Save size={16} className="mr-2" />
          {defaultsLoading ? "Saving..." : "Save System Defaults"}
        </Button>
      </section>

      {/* SMTP / Notifications - DISABLED for offline-first deployment */}
      {/* Email notifications not available in local/offline mode */}

      {/* Data Management */}
      <section id="data-management" className="glass rounded-3xl p-6 space-y-6">
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
            className="flex flex-col items-center gap-2 h-auto py-6 hover:text-white"
            onClick={() => setShowSeedCocktailsModal(true)}
            disabled={isSeedingCocktails}
          >
            <Sparkles size={24} />
            <span>Seed Cocktails</span>
            <span className="text-xs text-muted-foreground font-normal">
              Add popular recipes
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
                    {getTranslation("first_name", language)}{" "}
                    <span className="text-red-500">*</span>
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
                  Username
                </label>
                <input
                  type="text"
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                  placeholder="login username"
                  value={editingStaff.username || ""}
                  onChange={(e) =>
                    setEditingStaff({
                      ...editingStaff,
                      username: e.target.value,
                    })
                  }
                />
              </div>

              {(editingStaff.role === "admin" ||
                editingStaff.role === "employee") && (
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
                    {getTranslation("role", language)}{" "}
                    <span className="text-red-500">*</span>
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
                    <option value="employee">
                      {getTranslation("employee", language)}
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {getTranslation("language", language)}
                </label>
                <select
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                  value={editingStaff.language || "en"}
                  onChange={(e) =>
                    setEditingStaff({
                      ...editingStaff,
                      language: e.target.value,
                    })
                  }
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
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

      {/* Seed Cocktails Modal */}
      {showSeedCocktailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative">
            <button
              onClick={() => setShowSeedCocktailsModal(false)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-2 flex items-center gap-2">
              <Sparkles className="text-primary" /> Seed Cocktails
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              This will add 8 popular cocktail recipes to your menu. Requires
              ingredients to be available. Continue?
            </p>
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => setShowSeedCocktailsModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSeedCocktails}
                disabled={isSeedingCocktails}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                {isSeedingCocktails ? "Seeding..." : "Add Cocktails"}
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
                    Import Strategy
                  </h3>
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setImportStrategy("update")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        importStrategy === "update"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Update Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportStrategy("merge")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        importStrategy === "merge"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Merge (Keep Existing)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportStrategy("skip")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        importStrategy === "skip"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Skip Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportStrategy("replace")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        importStrategy === "replace"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Replace All
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {importStrategy === "update" &&
                      "Updates existing items with same name, creates new items if they don't exist"}
                    {importStrategy === "merge" &&
                      "Only updates empty/missing fields, keeps existing values intact"}
                    {importStrategy === "skip" &&
                      "Creates new items only, skips items with matching names"}
                    {importStrategy === "replace" &&
                      "Deletes ALL inventory items first, then imports all items from CSV"}
                  </p>
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
                            {item.type} •{" "}
                            {item.trackingMode === "pool" ||
                            (item.trackingMode === "auto" &&
                              item.type === "spirit") ||
                            (item.trackingMode === "auto" &&
                              item.type === "mixer")
                              ? `${item.bottleSizeMl || 0}ml`
                              : `${item.unitsPerCase || item.bottleSizeMl || 0} units`}{" "}
                            • {item.servingSize}
                            {item.trackingMode === "pool" ||
                            (item.trackingMode === "auto" &&
                              item.type === "spirit") ||
                            (item.trackingMode === "auto" &&
                              item.type === "mixer")
                              ? "oz"
                              : "units"}
                            {(item.currentBulk > 0 ||
                              item.currentPartial > 0) && (
                              <span className="ml-2 text-primary">
                                • Stock: {item.currentBulk || 0} sealed,{" "}
                                {item.currentPartial || 0}{" "}
                                {item.trackingMode === "pool" ||
                                (item.trackingMode === "auto" &&
                                  item.type === "spirit") ||
                                (item.trackingMode === "auto" &&
                                  item.type === "mixer")
                                  ? "g"
                                  : "units"}{" "}
                                open
                              </span>
                            )}
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
