import {
  db,
  usersTable,
  categoriesTable,
  productsTable,
  paymentMethodsTable,
  floorsTable,
  tablesTable,
  couponsTable,
  customersTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Admin user
  const [existingAdmin] = await db.select().from(usersTable).limit(1);
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin", 10);
    await db.insert(usersTable).values([
      { name: "Admin", email: "admin@cafe.com", passwordHash, role: "User", active: true },
      { name: "Cashier One", email: "cashier@cafe.com", passwordHash: await bcrypt.hash("cashier", 10), role: "Employee", active: true },
    ]);
    console.log("✓ Users created");
  }

  // Categories
  const [existingCat] = await db.select().from(categoriesTable).limit(1);
  let cats: { id: number; name: string }[] = [];
  if (!existingCat) {
    cats = await db.insert(categoriesTable).values([
      { name: "Coffee", color: "#6F4E37" },
      { name: "Tea", color: "#22C55E" },
      { name: "Pastry", color: "#F59E0B" },
      { name: "Cold Drinks", color: "#3B82F6" },
      { name: "Snacks", color: "#EF4444" },
    ]).returning();
    console.log("✓ Categories created");
  } else {
    cats = await db.select().from(categoriesTable);
  }

  const catMap = new Map(cats.map(c => [c.name, c.id]));

  // Products
  const [existingProd] = await db.select().from(productsTable).limit(1);
  if (!existingProd && cats.length > 0) {
    await db.insert(productsTable).values([
      { name: "Espresso", categoryId: catMap.get("Coffee")!, price: 120, unit: "piece", tax: 5, sendToKitchen: true },
      { name: "Cappuccino", categoryId: catMap.get("Coffee")!, price: 160, unit: "piece", tax: 5, sendToKitchen: true },
      { name: "Latte", categoryId: catMap.get("Coffee")!, price: 180, unit: "piece", tax: 5, sendToKitchen: true },
      { name: "Americano", categoryId: catMap.get("Coffee")!, price: 140, unit: "piece", tax: 5, sendToKitchen: true },
      { name: "Cold Coffee", categoryId: catMap.get("Cold Drinks")!, price: 200, unit: "piece", tax: 12, sendToKitchen: true },
      { name: "Masala Chai", categoryId: catMap.get("Tea")!, price: 80, unit: "piece", tax: 5, sendToKitchen: true },
      { name: "Green Tea", categoryId: catMap.get("Tea")!, price: 100, unit: "piece", tax: 5, sendToKitchen: true },
      { name: "Croissant", categoryId: catMap.get("Pastry")!, price: 120, unit: "piece", tax: 5, sendToKitchen: false },
      { name: "Muffin", categoryId: catMap.get("Pastry")!, price: 100, unit: "piece", tax: 5, sendToKitchen: false },
      { name: "Brownie", categoryId: catMap.get("Pastry")!, price: 140, unit: "piece", tax: 5, sendToKitchen: false },
      { name: "Sandwich", categoryId: catMap.get("Snacks")!, price: 180, unit: "piece", tax: 5, sendToKitchen: true },
      { name: "Lemonade", categoryId: catMap.get("Cold Drinks")!, price: 120, unit: "piece", tax: 12, sendToKitchen: false },
    ]);
    console.log("✓ Products created");
  }

  // Payment Methods
  const [existingPM] = await db.select().from(paymentMethodsTable).limit(1);
  if (!existingPM) {
    await db.insert(paymentMethodsTable).values([
      { name: "Cash", type: "Cash", active: true },
      { name: "Card", type: "Card", active: true },
      { name: "UPI", type: "UPI", upiId: "cafe@upi", active: true },
    ]);
    console.log("✓ Payment methods created");
  }

  // Floors & Tables
  const [existingFloor] = await db.select().from(floorsTable).limit(1);
  if (!existingFloor) {
    const [floor1, floor2] = await db.insert(floorsTable).values([
      { name: "Ground Floor" },
      { name: "First Floor" },
    ]).returning();

    await db.insert(tablesTable).values([
      { floorId: floor1.id, number: 1, seats: 4, active: true },
      { floorId: floor1.id, number: 2, seats: 4, active: true },
      { floorId: floor1.id, number: 3, seats: 6, active: true },
      { floorId: floor1.id, number: 4, seats: 2, active: true },
      { floorId: floor1.id, number: 5, seats: 8, active: true },
      { floorId: floor2.id, number: 6, seats: 4, active: true },
      { floorId: floor2.id, number: 7, seats: 4, active: true },
      { floorId: floor2.id, number: 8, seats: 6, active: true },
    ]);
    console.log("✓ Floors and tables created");
  }

  // Coupons
  const [existingCoupon] = await db.select().from(couponsTable).limit(1);
  if (!existingCoupon) {
    await db.insert(couponsTable).values([
      { name: "Welcome Discount", type: "Coupon", code: "WELCOME10", discountKind: "percent", discountValue: 10, active: true },
      { name: "Flat 50 Off", type: "Coupon", code: "FLAT50", discountKind: "amount", discountValue: 50, active: true },
    ]);
    console.log("✓ Coupons created");
  }

  // Customers
  const [existingCustomer] = await db.select().from(customersTable).limit(1);
  if (!existingCustomer) {
    await db.insert(customersTable).values([
      { name: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210" },
      { name: "Priya Patel", email: "priya@example.com", phone: "9123456789" },
    ]);
    console.log("✓ Customers created");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
