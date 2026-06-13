# Odoo Café POS

A modern, full-featured Point-of-Sale system built for café and restaurant operations.

## Monorepo Structure

```
odoo-cafe/
├── apps/
│   └── pos/          # POS frontend (React + TanStack Start + Tailwind CSS)
├── packages/         # Shared libraries (future)
└── README.md
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) >= 18
- [Bun](https://bun.sh/) (recommended) or npm

### Install & Run

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

### Build for Production

```bash
bun run build
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 19 |
| Routing | TanStack Router |
| SSR | TanStack Start |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| Data Fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Build Tool | Vite |

## Features

- 🛒 **POS Interface** — Fast, intuitive order entry with product search and category filters
- 🏠 **Table Management** — Floor plan with live table status
- 👥 **Customer Management** — Customer profiles linked to orders
- 📋 **Order Tracking** — Real-time order status from POS to Kitchen Display
- 🍽️ **Kitchen Display System (KDS)** — Live ticket view for kitchen staff
- 📊 **Reports & Analytics** — Sales, revenue, and item performance dashboards
- 🏷️ **Coupon & Discount System** — Flexible coupon management
- 💳 **Payment Methods** — Multi-method payment support
- 👤 **Admin Panel** — Full backend management for products, categories, users, and settings

## License

MIT
