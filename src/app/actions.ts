"use server";

import { BookingStatus, TemplateType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireOwnerProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sessao invalida. Inicia sessao novamente.");
  }

  const existing = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (existing) {
    return existing;
  }

  const emailPrefix = user.email?.split("@")[0] ?? "instrutor";
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : emailPrefix;

  const desiredSlug =
    typeof user.user_metadata?.slug === "string" ? user.user_metadata.slug : "";

  let slugBase = (desiredSlug || emailPrefix)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slugBase) {
    slugBase = "instrutor";
  }

  let slug = slugBase;
  let suffix = 1;
  while (await prisma.profile.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugBase}-${suffix}`;
  }

  return prisma.profile.create({
    data: {
      userId: user.id,
      name: fullName,
      slug,
      settings: {},
    },
  });
}

export async function getDashboardData() {
  const owner = await requireOwnerProfile();

  const [templates, slots, bookings, students] = await Promise.all([
    prisma.template.findMany({
      where: { ownerId: owner.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.slot.findMany({
      where: { ownerId: owner.id },
      include: { template: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        slot: {
          ownerId: owner.id,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.findMany({
      where: { ownerId: owner.id },
    }),
  ]);

  return {
    owner: { id: owner.id, slug: owner.slug, name: owner.name },
    templates: templates.map((template) => ({
      id: template.id,
      title: template.title,
      durationMins: template.durationMins,
      type: template.type,
    })),
    slots: slots.map((slot) => ({
      id: slot.id,
      ownerId: slot.ownerId,
      templateId: slot.templateId,
      templateTitle: slot.template.title,
      templateType: slot.template.type,
      start: slot.startTime.toISOString(),
      end: slot.endTime.toISOString(),
      capacity: slot.maxCapacity,
      booked: slot.currentCapacity,
    })),
    bookings: bookings.map((booking) => ({
      id: booking.id,
      ownerId: owner.id,
      slotId: booking.slotId,
      studentId: booking.studentId,
      studentName: booking.studentName,
      studentPhone: booking.studentPhone,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    })),
    students: students.map((student) => ({
      id: student.id,
      ownerId: student.ownerId,
      phone: student.phone,
      name: student.name,
      createdAt: student.createdAt.toISOString(),
    })),
  };
}

export async function createSlotAction(input: { templateId: string; startAtISO: string }) {
  const owner = await requireOwnerProfile();

  const template = await prisma.template.findFirst({
    where: { id: input.templateId, ownerId: owner.id },
  });
  if (!template) {
    throw new Error("Template invalido.");
  }

  const startTime = new Date(input.startAtISO);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + template.durationMins);

  await prisma.slot.create({
    data: {
      ownerId: owner.id,
      templateId: template.id,
      startTime,
      endTime,
      maxCapacity: template.capacity,
      currentCapacity: 0,
    },
  });
}

export async function createRecurringSlotsAction(input: {
  templateId: string;
  startAtISO: string;
  recurrence: {
    weekdays: number[];
    weeks: number;
  };
}) {
  const owner = await requireOwnerProfile();

  const template = await prisma.template.findFirst({
    where: { id: input.templateId, ownerId: owner.id },
  });
  if (!template) {
    throw new Error("Template invalido.");
  }

  const baseStart = new Date(input.startAtISO);
  const baseHour = baseStart.getHours();
  const baseMinute = baseStart.getMinutes();
  const weekdays = Array.from(new Set(input.recurrence.weekdays)).filter(
    (day) => day >= 0 && day <= 6,
  );

  if (weekdays.length === 0) {
    throw new Error("Seleciona pelo menos um dia da semana para repetir.");
  }
  if (input.recurrence.weeks < 1 || input.recurrence.weeks > 12) {
    throw new Error("A repeticao deve estar entre 1 e 12 semanas.");
  }

  const rangeStart = new Date(baseStart);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + input.recurrence.weeks * 7);

  const existingSlots = await prisma.slot.findMany({
    where: {
      ownerId: owner.id,
      startTime: {
        gte: rangeStart,
        lt: rangeEnd,
      },
    },
    select: { startTime: true },
  });

  const existingKeySet = new Set(
    existingSlots.map((slot) => {
      const date = new Date(slot.startTime);
      return date.toISOString();
    }),
  );

  const slotsToCreate: Array<{
    ownerId: string;
    templateId: string;
    startTime: Date;
    endTime: Date;
    maxCapacity: number;
    currentCapacity: number;
  }> = [];

  for (let day = new Date(rangeStart); day < rangeEnd; day.setDate(day.getDate() + 1)) {
    const current = new Date(day);
    if (!weekdays.includes(current.getDay())) {
      continue;
    }

    current.setHours(baseHour, baseMinute, 0, 0);
    if (current < baseStart) {
      continue;
    }

    const key = current.toISOString();
    if (existingKeySet.has(key)) {
      continue;
    }

    const endTime = new Date(current);
    endTime.setMinutes(endTime.getMinutes() + template.durationMins);

    slotsToCreate.push({
      ownerId: owner.id,
      templateId: template.id,
      startTime: current,
      endTime,
      maxCapacity: template.capacity,
      currentCapacity: 0,
    });
  }

  if (slotsToCreate.length === 0) {
    return { createdCount: 0 };
  }

  await prisma.slot.createMany({
    data: slotsToCreate,
  });

  return { createdCount: slotsToCreate.length };
}

export async function removeBookingFromSlotAction(input: { bookingId: string }) {
  const owner = await requireOwnerProfile();

  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: { slot: true },
    });
    if (!booking) {
      throw new Error("Booking nao encontrado.");
    }
    if (booking.slot.ownerId !== owner.id) {
      throw new Error("Sem permissao para remover este inscrito.");
    }

    await tx.booking.delete({
      where: { id: input.bookingId },
    });

    await tx.slot.update({
      where: { id: booking.slotId },
      data: {
        currentCapacity: {
          decrement: booking.slot.currentCapacity > 0 ? 1 : 0,
        },
      },
    });
  });
}

export async function cancelClassAction(input: { slotId: string }) {
  const owner = await requireOwnerProfile();

  await prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({ where: { id: input.slotId } });
    if (!slot || slot.ownerId !== owner.id) {
      throw new Error("Sem permissao para cancelar esta aula.");
    }

    await tx.booking.updateMany({
      where: { slotId: input.slotId },
      data: { status: BookingStatus.CANCELED },
    });
    await tx.slot.delete({
      where: { id: input.slotId },
    });
  });
}

export async function deleteSlotAction(input: { slotId: string }) {
  const owner = await requireOwnerProfile();

  await prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({ where: { id: input.slotId } });
    if (!slot || slot.ownerId !== owner.id) {
      throw new Error("Sem permissao para eliminar este slot.");
    }

    await tx.booking.deleteMany({
      where: { slotId: input.slotId },
    });
    await tx.slot.delete({
      where: { id: input.slotId },
    });
  });
}

export async function getPublicBookingData(slug: string) {
  const owner = await prisma.profile.findUnique({ where: { slug } });
  if (!owner) {
    return { owner: null, slots: [] };
  }

  const slots = await prisma.slot.findMany({
    where: {
      ownerId: owner.id,
      startTime: {
        gte: new Date(),
      },
    },
    include: { template: true },
    orderBy: { startTime: "asc" },
  });

  return {
    owner: {
      id: owner.id,
      slug: owner.slug,
      name: owner.name,
      avatarUrl: owner.avatarUrl,
      bio:
        typeof owner.settings === "object" &&
        owner.settings &&
        "bio" in owner.settings
          ? String(owner.settings.bio)
          : "",
    },
    slots: slots.map((slot) => ({
      id: slot.id,
      title: slot.template.title,
      type: slot.template.type as TemplateType,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      totalCapacity: slot.maxCapacity,
      currentCapacity: Math.max(slot.maxCapacity - slot.currentCapacity, 0),
    })),
  };
}

export async function createBookingAction(input: {
  ownerSlug: string;
  slotId: string;
  studentName: string;
  studentPhone: string;
}) {
  const normalizedPhone = input.studentPhone.replace(/\s+/g, "");

  await prisma.$transaction(async (tx) => {
    const owner = await tx.profile.findUnique({ where: { slug: input.ownerSlug } });
    if (!owner) {
      throw new Error("Instrutor nao encontrado.");
    }

    const slot = await tx.slot.findFirst({
      where: {
        id: input.slotId,
        ownerId: owner.id,
      },
    });

    if (!slot) {
      throw new Error("Slot nao encontrado.");
    }

    if (slot.currentCapacity >= slot.maxCapacity) {
      throw new Error("Desculpe, esta aula acabou de esgotar!");
    }

    let student = await tx.student.findFirst({
      where: {
        ownerId: owner.id,
        phone: normalizedPhone,
      },
    });

    if (!student) {
      student = await tx.student.create({
        data: {
          ownerId: owner.id,
          phone: normalizedPhone,
          name: input.studentName,
        },
      });
    } else if (student.name !== input.studentName) {
      student = await tx.student.update({
        where: { id: student.id },
        data: { name: input.studentName },
      });
    }

    await tx.slot.update({
      where: { id: slot.id },
      data: {
        currentCapacity: {
          increment: 1,
        },
      },
    });

    await tx.booking.create({
      data: {
        slotId: slot.id,
        studentId: student.id,
        studentPhone: normalizedPhone,
        studentName: input.studentName,
        status: BookingStatus.CONFIRMED,
      },
    });
  });
}

export async function getReconfirmationDataAction(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      slot: {
        include: {
          template: true,
          owner: true,
        },
      },
    },
  });

  if (!booking) {
    return null;
  }

  return {
    id: booking.id,
    status: booking.status,
    studentName: booking.studentName,
    studentPhone: booking.studentPhone,
    slot: {
      id: booking.slot.id,
      startTime: booking.slot.startTime.toISOString(),
      endTime: booking.slot.endTime.toISOString(),
      templateTitle: booking.slot.template.title,
      ownerName: booking.slot.owner.name,
    },
  };
}

export async function respondReconfirmationAction(input: {
  bookingId: string;
  decision: "CONFIRM" | "CANCEL";
}) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: { slot: true },
    });

    if (!booking) {
      throw new Error("Reserva nao encontrada.");
    }

    if (input.decision === "CONFIRM") {
      if (booking.status === BookingStatus.CANCELED) {
        throw new Error("Esta reserva ja foi cancelada.");
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CONFIRMED },
      });

      return { status: BookingStatus.CONFIRMED };
    }

    if (booking.status === BookingStatus.CANCELED) {
      return { status: BookingStatus.CANCELED };
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CANCELED },
    });

    await tx.slot.update({
      where: { id: booking.slotId },
      data: {
        currentCapacity: {
          decrement: booking.slot.currentCapacity > 0 ? 1 : 0,
        },
      },
    });

    return { status: BookingStatus.CANCELED };
  });
}

export async function getSettingsDataAction() {
  const owner = await requireOwnerProfile();

  const templates = await prisma.template.findMany({
    where: { ownerId: owner.id },
    orderBy: { createdAt: "asc" },
  });

  const settings =
    typeof owner.settings === "object" && owner.settings ? owner.settings : {};

  return {
    profile: {
      id: owner.id,
      name: owner.name,
      slug: owner.slug,
      avatarUrl: owner.avatarUrl,
      bio: "bio" in settings ? String(settings.bio ?? "") : "",
      instagramUrl: "instagramUrl" in settings ? String(settings.instagramUrl ?? "") : "",
      websiteUrl: "websiteUrl" in settings ? String(settings.websiteUrl ?? "") : "",
    },
    templates: templates.map((template) => ({
      id: template.id,
      title: template.title,
      type: template.type,
      durationMins: template.durationMins,
      capacity: template.capacity,
      price: Number(template.price),
    })),
  };
}

export async function updateProfileSettingsAction(input: {
  name: string;
  bio: string;
  instagramUrl: string;
  websiteUrl: string;
  avatarUrl?: string | null;
}) {
  const owner = await requireOwnerProfile();

  const nextSettings = {
    ...(typeof owner.settings === "object" && owner.settings ? owner.settings : {}),
    bio: input.bio,
    instagramUrl: input.instagramUrl,
    websiteUrl: input.websiteUrl,
  };

  await prisma.profile.update({
    where: { id: owner.id },
    data: {
      name: input.name.trim() || owner.name,
      avatarUrl: input.avatarUrl === undefined ? owner.avatarUrl : input.avatarUrl,
      settings: nextSettings,
    },
  });
}

export async function createTemplateSettingsAction(input: {
  title: string;
  type: TemplateType;
  durationMins: number;
  capacity: number;
  price: number;
}) {
  const owner = await requireOwnerProfile();

  await prisma.template.create({
    data: {
      ownerId: owner.id,
      title: input.title.trim(),
      type: input.type,
      durationMins: input.durationMins,
      capacity: input.capacity,
      price: input.price,
    },
  });
}

export async function updateTemplateSettingsAction(input: {
  templateId: string;
  title: string;
  type: TemplateType;
  durationMins: number;
  capacity: number;
  price: number;
}) {
  const owner = await requireOwnerProfile();

  const template = await prisma.template.findFirst({
    where: { id: input.templateId, ownerId: owner.id },
  });
  if (!template) {
    throw new Error("Template nao encontrado.");
  }

  await prisma.template.update({
    where: { id: template.id },
    data: {
      title: input.title.trim(),
      type: input.type,
      durationMins: input.durationMins,
      capacity: input.capacity,
      price: input.price,
    },
  });
}

export async function deleteTemplateSettingsAction(input: { templateId: string }) {
  const owner = await requireOwnerProfile();

  const template = await prisma.template.findFirst({
    where: { id: input.templateId, ownerId: owner.id },
  });
  if (!template) {
    throw new Error("Template nao encontrado.");
  }

  const attachedSlots = await prisma.slot.count({
    where: { templateId: input.templateId, ownerId: owner.id },
  });
  if (attachedSlots > 0) {
    throw new Error(
      "Este template ja tem aulas associadas. Remove ou reatribui esses slots antes de eliminar.",
    );
  }

  await prisma.template.delete({
    where: { id: input.templateId },
  });
}
