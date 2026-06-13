import prisma from '../config/database.js';

export const getAllPaymentMethods = async () => {
  return prisma.paymentMethod.findMany({ orderBy: { createdAt: 'asc' } });
};

export const createPaymentMethod = async (data) => {
  return prisma.paymentMethod.create({
    data: { name: data.name || "Payment Method", type: data.type, isEnabled: data.isEnabled ?? true, upiId: data.upiId ?? null },
  });
};

export const updatePaymentMethod = async (id, data) => {
  return prisma.paymentMethod.update({
    where: { id },
    data: { name: data.name, type: data.type, isEnabled: data.isEnabled, upiId: data.upiId ?? null },
  });
};

export const deletePaymentMethod = async (id) => {
  return prisma.paymentMethod.delete({ where: { id } });
};
