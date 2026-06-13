import prisma from '../config/database.js';

export const createCoupon = async (data) => {
  const { code, name, discountType, discountValue, promotionType,
          productId, minQuantity, minOrderAmount, isActive } = data;

  // If it has a promotionType, it's a Promotion (goes into promotions table)
  if (promotionType) {
    const promotion = await prisma.promotion.create({
      data: {
        name: name || code || 'Untitled Promotion',
        type: promotionType,          // PRODUCT or ORDER
        discountType: discountType || 'PERCENTAGE',
        discountValue: discountValue ?? 0,
        productId: productId || null,
        minQuantity: minQuantity ?? null,
        minOrderAmount: minOrderAmount ?? null,
        isActive: isActive ?? true,
      },
    });
    // Return with a flag so the frontend knows it's a promotion
    return { ...promotion, _isPromotion: true };
  }

  // Otherwise it's a Coupon
  if (!code) throw new Error('Coupon code is required');

  const existingCoupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (existingCoupon) {
    throw new Error('Coupon code already exists');
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      discountType: discountType || 'PERCENTAGE',
      discountValue: discountValue ?? 0,
      isActive: isActive ?? true,
    },
  });

  return coupon;
};

export const getAllCoupons = async () => {
  // Fetch both coupons and promotions, return them merged
  const [coupons, promotions] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.promotion.findMany({ orderBy: { createdAt: 'desc' }, include: { product: { select: { id: true, name: true } } } }),
  ]);

  // Tag each so the frontend can differentiate
  const taggedCoupons = coupons.map(c => ({ ...c, _kind: 'coupon' }));
  const taggedPromos = promotions.map(p => ({ ...p, _kind: 'promotion', promotionType: p.type }));

  return [...taggedCoupons, ...taggedPromos];
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
  // Try coupon first, then promotion
  try {
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.discountType && { discountType: data.discountType }),
        ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return coupon;
  } catch {
    // Not found in coupons, try promotions
    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.discountType && { discountType: data.discountType }),
        ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.productId !== undefined && { productId: data.productId || null }),
        ...(data.minQuantity !== undefined && { minQuantity: data.minQuantity }),
        ...(data.minOrderAmount !== undefined && { minOrderAmount: data.minOrderAmount }),
      },
    });
    return { ...promotion, _isPromotion: true };
  }
};

export const deleteCoupon = async (id) => {
  // Try coupon first, then promotion
  try {
    return await prisma.coupon.delete({ where: { id } });
  } catch {
    return await prisma.promotion.delete({ where: { id } });
  }
};

export const deactivateCoupon = async (id) => {
  // Try coupon first, then promotion
  try {
    return await prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });
  } catch {
    return await prisma.promotion.update({
      where: { id },
      data: { isActive: false },
    });
  }
};
