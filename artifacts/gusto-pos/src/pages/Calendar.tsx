import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useGetRushes,
  useGetDrinks,
  usePostRushes,
  useDeleteRushesId,
} from "@workspace/api-client-react";
import { usePosStore } from "@/store";
import { getTranslation } from "@/lib/utils";
import { PromoCodesSection } from "@/components/PromoCodesSection";
import { SpecialsSection } from "@/components/SpecialsSection";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Sparkles,
  Tag,
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Settings,
  AlertCircle,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";

type ViewMode = "calendar" | "list" | "manage";
type EventType = "rushes" | "specials" | "promos";
type ManageTab = "rushes" | "specials" | "promos";

export default function Calendar() {
  const { language, activeStaff } = usePosStore();
  const { toast } = useToast();
  const isAdmin =
    activeStaff?.role === "admin" || activeStaff?.role === "manager";
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedType, setSelectedType] = useState<EventType>("rushes");
  const [manageTab, setManageTab] = useState<ManageTab>("rushes");

  // Rush management state
  const [rushDays, setRushDays] = useState(7);
  const [showAllRushes, setShowAllRushes] = useState(false);
  const [showAddRush, setShowAddRush] = useState(false);
  const [deletingRush, setDeletingRush] = useState<any>(null);
  const [newRush, setNewRush] = useState({
    title: "",
    type: "cruise" as const,
    impact: "medium" as const,
    repeatEvent: 0,
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: "",
    description: "",
  });

  const { data: rushes, refetch: refetchRushes } = useGetRushes();
  const { data: drinks } = useGetDrinks();
  const [specials, setSpecials] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);

  const createRush = usePostRushes();
  const deleteRush = useDeleteRushesId();

  useQuery({
    queryKey: ["/api/specials"],
    queryFn: async () => {
      const res = await fetch("/api/specials");
      const data = await res.json();
      if (Array.isArray(data)) setSpecials(data);
      return data;
    },
  });
  useQuery({
    queryKey: ["/api/promo-codes"],
    queryFn: async () => {
      const res = await fetch("/api/promo-codes");
      const data = await res.json();
      if (Array.isArray(data)) setPromoCodes(data);
      return data;
    },
  });

  const allEvents = useMemo(() => {
    const events: Array<{
      id: string;
      title: string;
      type: EventType;
      startTime: string;
      endTime?: string;
      impact?: string;
      discountValue?: number;
      discountType?: string;
    }> = [];

    if (rushes) {
      rushes.forEach((rush: any) => {
        events.push({
          id: rush.id,
          title: rush.title,
          type: "rushes",
          startTime: rush.startTime,
          endTime: rush.endTime,
          impact: rush.impact,
        });
      });
    }

    if (specials) {
      specials.forEach((special: any) => {
        events.push({
          id: special.id,
          title: special.name || special.drinkName || "Special",
          type: "specials",
          startTime: special.startDate || new Date().toISOString(),
          endTime: special.endDate,
          discountValue: special.discountValue,
          discountType: special.discountType,
        });
      });
    }

    if (promoCodes) {
      promoCodes.forEach((promo: any) => {
        events.push({
          id: promo.id,
          title: `${promo.code} - ${promo.discountType === "percentage" ? `${promo.discountValue}%` : `$${promo.discountValue}`}`,
          type: "promos",
          startTime: promo.startDate || promo.createdAt,
          endTime: promo.endDate,
          discountValue: promo.discountValue,
          discountType: promo.discountType,
        });
      });
    }

    return events.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  }, [rushes, specials, promoCodes]);

  const filteredEvents = useMemo(() => {
    if (selectedType === "rushes") {
      return allEvents.filter((e) => e.type === "rushes");
    } else if (selectedType === "specials") {
      return allEvents.filter((e) => e.type === "specials");
    } else {
      return allEvents.filter((e) => e.type === "promos");
    }
  }, [allEvents, selectedType]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.startTime);
      return isSameDay(eventDate, day);
    });
  };

  const getTypeColor = (type: EventType) => {
    switch (type) {
      case "rushes":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "specials":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "promos":
        return "bg-green-500/20 text-green-400 border-green-500/30";
    }
  };

  const handleAddRush = () => {
    const startTimeUnix = Math.floor(
      new Date(newRush.startTime).getTime() / 1000,
    );
    const endTimeUnix = newRush.endTime
      ? Math.floor(new Date(newRush.endTime).getTime() / 1000)
      : undefined;

    createRush.mutate(
      {
        title: newRush.title,
        description: newRush.description || undefined,
        startTime: startTimeUnix,
        endTime: endTimeUnix,
        repeatEvent: newRush.repeatEvent as 0 | 1 | 2 | 3,
        impact: newRush.impact as "low" | "medium" | "high",
        type: newRush.type as "cruise" | "festival" | "music" | "other",
      },
      {
        onSuccess: () => {
          setShowAddRush(false);
          setNewRush({
            title: "",
            type: "cruise",
            impact: "medium",
            repeatEvent: 0,
            startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            endTime: "",
            description: "",
          });
          refetchRushes();
          toast({
            title: getTranslation("success", language),
            description: "Rush event scheduled successfully",
          });
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: getTranslation("error", language),
            description: err?.message || "Failed to schedule rush event",
          });
        },
      },
    );
  };

  const handleDeleteRush = (rush: any) => {
    setDeletingRush(rush);
  };

  const confirmDeleteRush = () => {
    if (!deletingRush) return;
    deleteRush.mutate(
      deletingRush.id,
      {
        onSuccess: () => {
          refetchRushes();
          toast({
            title: getTranslation("success", language),
            description: "Rush event deleted",
          });
          setDeletingRush(null);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: getTranslation("error", language),
            description: "Failed to delete rush",
          });
        },
      },
    );
  };

  const refetchPromoCodes = () => {
    fetch("/api/promo-codes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPromoCodes(data);
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: getTranslation("error", language),
          description: "Failed to load promo codes",
        });
      });
  };

  const refetchSpecials = () => {
    fetch("/api/specials")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSpecials(data);
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: getTranslation("error", language),
          description: "Failed to load specials",
        });
      });
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary flex items-center gap-2">
            <CalendarIcon size={24} />
            {language === "es" ? "Calendario de Eventos" : "Event Calendar"}
          </h1>
          <p className="text-muted-foreground">
            {language === "es"
              ? "Administrar Rushes, Specials y Códigos Promo"
              : "Manage Rushes, Specials, and Promo Codes"}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            <List size={18} />
            {language === "es" ? "Lista" : "List"}
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${viewMode === "calendar" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            <CalendarIcon size={18} />
            {language === "es" ? "Calendario" : "Calendar"}
          </button>
          {isAdmin && (
            <button
              onClick={() => setViewMode("manage")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${viewMode === "manage" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
            >
              <Settings size={18} />
              {language === "es" ? "Gestionar" : "Manage"}
            </button>
          )}
        </div>
      </div>

      {viewMode !== "manage" && (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedType("rushes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                selectedType === "rushes"
                  ? "bg-orange-500 text-white"
                  : "bg-secondary hover:bg-orange-500/20"
              }`}
            >
              <Zap size={18} />
              {language === "es" ? "Rushes" : "Rushes"}
            </button>
            <button
              onClick={() => setSelectedType("specials")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                selectedType === "specials"
                  ? "bg-purple-500 text-white"
                  : "bg-secondary hover:bg-purple-500/20"
              }`}
            >
              <Sparkles size={18} />
              {language === "es" ? "Specials" : "Specials"}
            </button>
            <button
              onClick={() => setSelectedType("promos")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                selectedType === "promos"
                  ? "bg-green-500 text-white"
                  : "bg-secondary hover:bg-green-500/20"
              }`}
            >
              <Tag size={18} />
              {language === "es" ? "Promos" : "Promo Codes"}
            </button>
          </div>

          {viewMode === "list" && (
            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {language === "es" ? "No hay eventos" : "No events"}
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`glass rounded-2xl p-4 border ${getTypeColor(event.type)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(event.startTime),
                            "MMM d, yyyy h:mm a",
                          )}
                          {event.endTime &&
                            ` - ${format(new Date(event.endTime), "MMM d, yyyy h:mm a")}`}
                        </p>
                      </div>
                      {event.discountValue && (
                        <span className="text-lg font-bold">
                          {event.discountType === "percentage"
                            ? `${event.discountValue}%`
                            : `$${event.discountValue}`}
                        </span>
                      )}
                    </div>
                    {event.impact && (
                      <span className="text-xs uppercase font-bold mt-2 inline-block px-2 py-0.5 rounded-full bg-secondary">
                        {event.impact}{" "}
                        {language === "es" ? "impacto" : "impact"}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {viewMode === "calendar" && (
            <div className="glass rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-secondary rounded-lg"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-xl font-display">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-secondary rounded-lg"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-muted-foreground p-2"
                    >
                      {day}
                    </div>
                  ),
                )}
                {daysInMonth.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[80px] p-2 rounded-xl border ${
                        isToday(day)
                          ? "bg-primary/10 border-primary"
                          : "bg-secondary/30 border-white/5"
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate ${
                              event.type === "rushes"
                                ? "bg-orange-500/30 text-orange-400"
                                : event.type === "specials"
                                  ? "bg-purple-500/30 text-purple-400"
                                  : "bg-green-500/30 text-green-400"
                            }`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === "manage" && isAdmin && (
        <div className="space-y-6">
          <div className="flex gap-2 border-b border-white/10 pb-4">
            <button
              onClick={() => setManageTab("rushes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                manageTab === "rushes"
                  ? "bg-orange-500 text-white"
                  : "bg-secondary hover:bg-orange-500/20"
              }`}
            >
              <Zap size={18} />
              {language === "es" ? "Rushes" : "Rush Events"}
            </button>
            <button
              onClick={() => setManageTab("specials")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                manageTab === "specials"
                  ? "bg-purple-500 text-white"
                  : "bg-secondary hover:bg-purple-500/20"
              }`}
            >
              <Sparkles size={18} />
              {language === "es" ? "Specials" : "Specials"}
            </button>
            <button
              onClick={() => setManageTab("promos")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                manageTab === "promos"
                  ? "bg-green-500 text-white"
                  : "bg-secondary hover:bg-green-500/20"
              }`}
            >
              <Tag size={18} />
              {language === "es" ? "Códigos Promo" : "Promo Codes"}
            </button>
          </div>

          {manageTab === "rushes" && (
            <div className="glass rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                  <Zap size={18} />
                  {language === "es"
                    ? "Gestionar Rushes"
                    : "Manage Rush Events"}
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={rushDays === 7 ? "default" : "outline"}
                    onClick={() => {
                      setRushDays(7);
                      setShowAllRushes(false);
                      refetchRushes();
                    }}
                  >
                    7 Days
                  </Button>
                  <Button
                    size="sm"
                    variant={rushDays === 30 ? "default" : "outline"}
                    onClick={() => {
                      setRushDays(30);
                      setShowAllRushes(false);
                      refetchRushes();
                    }}
                  >
                    30 Days
                  </Button>
                  <Button
                    size="sm"
                    variant={showAllRushes ? "default" : "outline"}
                    onClick={() => {
                      setShowAllRushes(true);
                      refetchRushes();
                    }}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddRush(true)}
                  >
                    <Plus size={16} className="mr-2" />
                    {language === "es" ? "Programar Rush" : "Schedule Rush"}
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-muted-foreground text-sm">
                      <th className="p-3 font-medium">
                        {language === "es" ? "Evento" : "Event"}
                      </th>
                      <th className="p-3 font-medium">
                        {language === "es" ? "Tipo" : "Type"}
                      </th>
                      <th className="p-3 font-medium">
                        {language === "es" ? "Impacto" : "Impact"}
                      </th>
                      <th className="p-3 font-medium">
                        {language === "es" ? "Inicio" : "Start Time"}
                      </th>
                      <th className="p-3 font-medium text-right">
                        {language === "es" ? "Acciones" : "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rushes?.map((rush: any) => (
                      <tr
                        key={rush.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="p-3 font-medium text-sm">
                          {rush.title}
                        </td>
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
            </div>
          )}

          {manageTab === "specials" && (
            <div className="glass rounded-3xl p-6">
              <SpecialsSection
                specials={specials}
                drinks={drinks || []}
                isAdmin={isAdmin}
                onRefetch={refetchSpecials}
              />
            </div>
          )}

          {manageTab === "promos" && (
            <div className="glass rounded-3xl p-6">
              <PromoCodesSection
                promoCodes={promoCodes}
                isAdmin={isAdmin}
                onRefetch={refetchPromoCodes}
              />
            </div>
          )}
        </div>
      )}

      {showAddRush && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative">
            <button
              onClick={() => setShowAddRush(false)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display mb-6">
              {language === "es" ? "Programar Rush" : "Schedule a Rush"}
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "es" ? "Título del Evento" : "Event Title"}
                </label>
                <input
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                  placeholder={
                    language === "es"
                      ? "Ej: Llegada del Carnival Panorama"
                      : "e.g. Carnival Panorama Arrival"
                  }
                  value={newRush.title}
                  onChange={(e) =>
                    setNewRush({ ...newRush, title: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {language === "es" ? "Tipo" : "Type"}
                  </label>
                  <select
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                    value={newRush.type}
                    onChange={(e) =>
                      setNewRush({ ...newRush, type: e.target.value as any })
                    }
                  >
                    <option value="cruise">
                      {language === "es" ? "Crucero" : "Cruise Ship"}
                    </option>
                    <option value="festival">
                      {language === "es" ? "Festival" : "Festival"}
                    </option>
                    <option value="music">
                      {language === "es" ? "Música en Vivo" : "Live Music"}
                    </option>
                    <option value="other">
                      {language === "es" ? "Otro" : "Other"}
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {language === "es" ? "Impacto" : "Impact"}
                  </label>
                  <select
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                    value={newRush.impact}
                    onChange={(e) =>
                      setNewRush({ ...newRush, impact: e.target.value as any })
                    }
                  >
                    <option value="low">
                      {language === "es" ? "Bajo" : "Low"}
                    </option>
                    <option value="medium">
                      {language === "es" ? "Medio" : "Medium"}
                    </option>
                    <option value="high">
                      {language === "es" ? "Alto" : "High"}
                    </option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "es" ? "Repetir" : "Repeat"}
                </label>
                <select
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                  value={newRush.repeatEvent}
                  onChange={(e) =>
                    setNewRush({
                      ...newRush,
                      repeatEvent: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>
                    {language === "es" ? "Nunca" : "Never"}
                  </option>
                  <option value={1}>
                    {language === "es" ? "Semanal" : "Weekly"}
                  </option>
                  <option value={2}>
                    {language === "es" ? "Mensual" : "Monthly"}
                  </option>
                  <option value={3}>
                    {language === "es" ? "Diario" : "Daily"}
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "es" ? "Hora de Inicio" : "Start Time"}
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "es"
                    ? "Hora de Fin (opcional)"
                    : "End Time (optional)"}
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                  value={newRush.endTime}
                  onChange={(e) =>
                    setNewRush({ ...newRush, endTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {language === "es"
                    ? "Descripción (opcional)"
                    : "Description (optional)"}
                </label>
                <textarea
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-foreground"
                  placeholder={
                    language === "es"
                      ? "Notas adicionales sobre el evento..."
                      : "Additional notes about the event..."
                  }
                  value={newRush.description}
                  onChange={(e) =>
                    setNewRush({ ...newRush, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <Button
                className="w-full h-14 mt-4"
                onClick={handleAddRush}
                disabled={createRush.isPending}
              >
                {createRush.isPending
                  ? language === "es"
                    ? "Programando..."
                    : "Scheduling..."
                  : language === "es"
                    ? "Programar Evento"
                    : "Schedule Event"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deletingRush && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-destructive" size={28} />
              <h2 className="text-xl font-display">
                {language === "es" ? "¿Eliminar Rush?" : "Delete Rush?"}
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              {language === "es"
                ? `¿Estás seguro de que quieres eliminar "${deletingRush.title}"? Esta acción no se puede deshacer.`
                : `Are you sure you want to delete "${deletingRush.title}"? This action cannot be undone.`}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeletingRush(null)}
              >
                {language === "es" ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirmDeleteRush}
              >
                {language === "es" ? "Eliminar" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
