export type TemplateType = "PRIVATE" | "GROUP";

export type PublicInstructor = {
  slug: string;
  name: string;
  avatarUrl: string | null;
  bio: string;
};

export type PublicSlot = {
  id: string;
  title: string;
  type: TemplateType;
  startTime: string;
  endTime: string;
  totalCapacity: number;
  currentCapacity: number;
};

export type CapacityState = {
  label: string;
  className: string;
};
