import { useState } from "react";
import { useGetStaffShifts } from "@workspace/api-client-react";
import { usePosStore } from "@/store";
import { Users, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { es as esLocale } from "date-fns/locale/es";

interface StaffClockInWidgetProps {
  shiftId: string | undefined;
}

export function StaffClockInWidget({ shiftId }: StaffClockInWidgetProps) {
  const { language } = usePosStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staffShifts = [] } = useGetStaffShifts(shiftId || "", {
    query: { enabled: !!shiftId, staleTime: 10000 },
  } as any);
  const [showAll, setShowAll] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeStaffList = (staffShifts || []).filter((s: any) => !s.clockOutAt);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clockedOutStaffList = (staffShifts || []).filter(
    (s: any) => s.clockOutAt,
  );

  const displayedActive = showAll
    ? activeStaffList
    : activeStaffList.slice(0, 3);
  const remainingCount = Math.max(0, activeStaffList.length - 3);

  if (!shiftId) return null;

  return (
    <div className="glass p-6 rounded-3xl border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Users size={20} />
          </div>
          <h3 className="font-semibold text-white">
            {language === "es" ? "Personal Activo" : "Active Staff"}
          </h3>
        </div>
        <span className="text-sm font-medium px-3 py-1 rounded-full bg-blue-500/20 text-blue-300">
          {activeStaffList.length}
        </span>
      </div>

      <div className="space-y-2">
        {displayedActive.length > 0 ? (
          <>
            {displayedActive.map((staff: any) => (
              <div
                key={staff.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock size={16} className="text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {staff.staffName}
                    </p>
                    <p className="text-xs text-white/50">
                      {language === "es" ? "Desde hace " : "For "}
                      {formatDistanceToNow(
                        new Date(
                          typeof staff.clockInAt === "string"
                            ? parseInt(staff.clockInAt) * 1000
                            : staff.clockInAt * 1000,
                        ),
                        {
                          locale: language === "es" ? esLocale : undefined,
                          addSuffix: false,
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {!showAll && remainingCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                onClick={() => setShowAll(true)}
              >
                {language === "es"
                  ? `+${remainingCount} más`
                  : `+${remainingCount} more`}
              </Button>
            )}

            {showAll && remainingCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                onClick={() => setShowAll(false)}
              >
                {language === "es" ? "Ver menos" : "Show less"}
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-white/50 text-center py-4">
            {language === "es" ? "No hay personal activo" : "No active staff"}
          </p>
        )}
      </div>

      {clockedOutStaffList.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs font-medium text-white/60 mb-2">
            {language === "es"
              ? `${clockedOutStaffList.length} ya salió`
              : `${clockedOutStaffList.length} clocked out`}
          </p>
          <div className="flex flex-wrap gap-2">
            {clockedOutStaffList.slice(0, 3).map((staff: any) => (
              <span
                key={staff.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs text-white/60"
              >
                <LogOut size={12} />
                {staff.staffName.split(" ")[0]}
              </span>
            ))}
            {clockedOutStaffList.length > 3 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs text-white/60">
                +{clockedOutStaffList.length - 3}{" "}
                {language === "es" ? "más" : "more"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
