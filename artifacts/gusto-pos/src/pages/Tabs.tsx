import React, { useState } from "react";
import { useGetTabs } from "@workspace/api-client-react";
import { useCreateTabMutation } from "@/hooks/use-pos-mutations";
import { usePosStore } from "@/store";
import { getTranslation, formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Users,
  Clock,
  Receipt,
  Loader2,
  Trash2,
  X,
  Search,
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { es as esLocale } from "date-fns/locale/es";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Tabs() {
    const [sortBy, setSortBy] = useState<"name" | "openedAt" | "totalMxn">("openedAt");
    const [sortAsc, setSortAsc] = useState(false);
  const { language, activeStaff } = usePosStore();
  const { data: tabs, isLoading } = useGetTabs({ status: "open" });
  const createTab = useCreateTabMutation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newTabName, setNewTabName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTabId, setDeleteTabId] = useState<string | null>(null);
  const [deleteTabName, setDeleteTabName] = useState("");
  const [search, setSearch] = useState("");

  const handleCreate = () => {
    if (!activeStaff) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: "Please enter PIN to switch user first.",
      });
      return;
    }
    if (!newTabName.trim()) return;
    if (newTabName.trim().length > 30) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: "Tab name must be 30 characters or less.",
      });
      return;
    }
    createTab.mutate(
      {
        data: {
          nickname: newTabName,
          staffUserId: activeStaff.id,
          currency: "MXN",
        },
      },
      {
        onSuccess: () => {
          setNewTabName("");
          setIsCreating(false);
          toast({
            title: getTranslation("success", language),
            description: `Tab "${newTabName}" created successfully.`,
          });
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: getTranslation("error", language),
            description: error.message || "Failed to create tab.",
          });
        },
      },
    );
  };

  const handleDeleteTab = async () => {
    if (!deleteTabId) return;
    try {
      const res = await fetch(`/api/tabs/${deleteTabId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const errorMessage = "Failed to delete tab";
      try {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || errorMessage);
        }
      } catch {
        if (!res.ok) {
          throw new Error(errorMessage);
        }
      }
      toast({
        title: getTranslation("success", language),
        description: `Tab "${deleteTabName}" deleted.`,
      });
      setDeleteTabId(null);
      setDeleteTabName("");
      qc.invalidateQueries({ queryKey: ["/api/tabs"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: getTranslation("error", language),
        description: error.message || "Failed to delete tab.",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-display">
            {getTranslation("tabs", language)}
          </h1>
          <p className="text-muted-foreground mt-1">
            {getTranslation("manage_tables_customers", language)}
          </p>
        </div>

        {!isCreating ? (
          <Button size="lg" onClick={() => setIsCreating(true)}>
            <Plus className="mr-2" size={20} />
            {getTranslation("new_tab", language)}
          </Button>
        ) : (
          <div className="flex items-center gap-3 glass p-2 rounded-2xl">
            <input
              autoFocus
              maxLength={30}
              className="bg-transparent border-none outline-none px-4 text-foreground placeholder:text-muted-foreground w-48"
              placeholder={getTranslation(
                "table_or_name_placeholder",
                language,
              )}
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={createTab.isPending}
            >
              {createTab.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                getTranslation("add", language)
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsCreating(false)}
            >
              {getTranslation("cancel", language)}
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative w-full sm:w-auto flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder={getTranslation("search_tabs", language)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md bg-secondary/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Sort by:</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-secondary border border-white/10 rounded-lg px-2 py-1 text-sm"
          >
            <option value="openedAt">Opened Time</option>
            <option value="name">Name</option>
            <option value="totalMxn">Total</option>
          </select>
          <button
            type="button"
            onClick={() => setSortAsc(a => !a)}
            className="ml-1 px-2 py-1 rounded border border-white/10 bg-secondary text-xs"
            title={sortAsc ? "Ascending" : "Descending"}
          >
            {sortAsc ? "↑" : "↓"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="mb-4 h-12 w-12 animate-spin opacity-50" />
            <p className="text-lg">
              {getTranslation("loading_tabs", language)}
            </p>
          </div>
        ) : tabs?.length === 0 && !isCreating ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Receipt size={48} className="mb-4 opacity-20" />
            <p className="text-lg">
              {getTranslation("no_open_tabs_msg", language)}
            </p>
          </div>
        ) : (
          tabs
            ?.filter(
              (tab) =>
                !search ||
                tab.nickname.toLowerCase().includes(search.toLowerCase()),
            )
            .sort((a, b) => {
              let cmp = 0;
              if (sortBy === "name") {
                cmp = a.nickname.localeCompare(b.nickname);
              } else if (sortBy === "openedAt") {
                cmp = new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime();
              } else if (sortBy === "totalMxn") {
                cmp = (a.totalMxn || 0) - (b.totalMxn || 0);
              }
              return sortAsc ? cmp : -cmp;
            })
            .map((tab) => (
              <div key={tab.id} className="relative group">
                <Link href={`/tabs/${tab.id}`}>
                  <div className="glass p-6 rounded-3xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-primary/30">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {tab.nickname}
                      </h3>
                      <div className="bg-secondary px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium">
                        <Users size={12} className="text-muted-foreground" />
                        {tab.staffUserName?.split(" ")[0]}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-end justify-between">
                        <span className="text-muted-foreground text-sm">
                          {getTranslation("total", language)}
                        </span>
                        <span className="text-2xl font-bold text-foreground">
                          {formatMoney(tab.totalMxn, "MXN")}
                        </span>
                      </div>

                      <div className="h-px bg-white/5 w-full" />

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={14} />
                        {getTranslation("opened_x_ago", language).replace(
                          "{time}",
                          formatDistanceToNow(new Date(tab.openedAt)),
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTabId(tab.id);
                    setDeleteTabName(tab.nickname);
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                  title="Delete tab"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
        )}
      </div>

      {/* Delete Tab Confirmation Modal */}
      {deleteTabId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-3xl w-full max-w-md relative border border-white/10">
            <button
              onClick={() => {
                setDeleteTabId(null);
                setDeleteTabName("");
              }}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400">
                <Trash2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-display">
                  {getTranslation("delete_tab_confirm", language).split("?")[0]}
                </h2>
                <p className="text-sm text-muted-foreground">{deleteTabName}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {getTranslation("delete_tab_confirm", language)}
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => {
                  setDeleteTabId(null);
                  setDeleteTabName("");
                }}
              >
                {getTranslation("cancel", language)}
              </Button>
              <Button variant="destructive" onClick={handleDeleteTab}>
                {getTranslation("delete", language)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
