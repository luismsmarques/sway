export type SemanticTemplateType = "PRIVATE" | "GROUP";

export type SemanticBadgeState = {
  label: string;
  className: string;
};

export const TEMPLATE_BADGE_STYLES: Record<SemanticTemplateType, string> = {
  PRIVATE: "bg-sky-50 text-sky-700 ring-sky-200",
  GROUP: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export const INFO_BADGE_STYLE = "bg-sky-50 text-sky-700 ring-sky-200";
export const WARNING_SURFACE_STYLE = "bg-rose-50 ring-rose-200";
export const WARNING_TEXT_STYLE = "text-rose-700";

export function getCapacityBadgeState(currentCapacity: number): SemanticBadgeState {
  if (currentCapacity <= 0) {
    return { label: "Esgotado", className: "bg-rose-50 text-rose-700 ring-rose-200" };
  }

  if (currentCapacity <= 2) {
    return {
      label: "Ultimas Vagas",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
    };
  }

  return { label: "Livre", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
}
