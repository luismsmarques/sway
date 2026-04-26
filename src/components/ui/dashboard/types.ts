export type TemplateType = "PRIVATE" | "GROUP";
export type QuickFilter = "TODAY" | "TOMORROW" | "WEEK";

export type Slot = {
  id: string;
  ownerId: string;
  templateId: string;
  templateTitle: string;
  templateType: TemplateType;
  start: Date;
  end: Date;
  capacity: number;
  booked: number;
};

export type Booking = {
  id: string;
  ownerId: string;
  slotId: string;
  studentId: string | null;
  studentName: string;
  studentPhone: string;
  status: "PENDING" | "CONFIRMED" | "CANCELED";
  createdAt: string;
};

export type Student = { id: string; ownerId: string; phone: string; name: string };

export type Template = {
  id: string;
  title: string;
  durationMins: number;
  type: TemplateType;
};
