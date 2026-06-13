import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import paymentMethodsRouter from "./payment-methods";
import floorsRouter from "./floors";
import tablesRouter from "./tables";
import couponsRouter from "./coupons";
import customersRouter from "./customers";
import sessionsRouter from "./sessions";
import ordersRouter from "./orders";
import kdsRouter from "./kds";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(paymentMethodsRouter);
router.use(floorsRouter);
router.use(tablesRouter);
router.use(couponsRouter);
router.use(customersRouter);
router.use(sessionsRouter);
router.use(ordersRouter);
router.use(kdsRouter);
router.use(reportsRouter);

export default router;
