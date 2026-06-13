import * as couponService from '../services/coupon.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const createCoupon = async (req, res) => {
  try {
    const coupon = await couponService.createCoupon(req.body);
    return successResponse(res, coupon, 'Coupon created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await couponService.getAllCoupons();
    return successResponse(res, coupons, 'Coupons retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const getCouponByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await couponService.getCouponByCode(code);
    return successResponse(res, coupon, 'Coupon retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await couponService.updateCoupon(id, req.body);
    return successResponse(res, coupon, 'Coupon updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const deactivateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await couponService.deactivateCoupon(id);
    return successResponse(res, coupon, 'Coupon deactivated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};
