import prisma from '../config/database.js';

export const createCoupon = async (data) => {
  const { code, discountType, discountValue } = data;

  const existingCoupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (existingCoupon) {
    throw new Error('Coupon code already exists');
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      discountType,
      discountValue,
      isActive: true,
    },
  });

  return coupon;
};

export const getAllCoupons = async () => {
  return await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

export const getCouponByCode = async (code) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    throw new Error('Coupon not found');
  }

  if (!coupon.isActive) {
    throw new Error('Coupon is inactive');
  }

  return coupon;
};

export const updateCoupon = async (id, data) => {
  const coupon = await prisma.coupon.update({
    where: { id },
    data,
  });

  return coupon;
};

export const deactivateCoupon = async (id) => {
  const coupon = await prisma.coupon.update({
    where: { id },
    data: { isActive: false },
  });

  return coupon;
};
