import { Building2, Users } from "lucide-react";
import { getInitials } from "../utils/formatters";

type EntityChipsProps = {
  entities: string[];
};

export function EntityChips({ entities }: EntityChipsProps) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Users className="h-4 w-4 text-blue-600" />
        Entities involved
      </div>
      <div className="flex flex-col gap-2">
        {entities.map((entity) => (
          <div
            key={entity}
            className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {getInitials(entity)}
            </div>
            <div className="min-w-0">
              <p className="break-words text-sm font-medium text-slate-900">{entity}</p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Building2 className="h-3 w-3" />
                Entity
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
