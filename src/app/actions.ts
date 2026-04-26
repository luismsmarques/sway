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

  let slugBase = emailPrefix
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
