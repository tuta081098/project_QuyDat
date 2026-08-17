# Hướng Dẫn Cấu Trúc & Khởi Chạy Dự Án

Workspace này đã được phân chia rõ ràng thành **2 dự án độc lập** với cấu trúc tối ưu:

```text
project_QuyDat/
├── shop-lam-dien/           # 🛒 Dự án Web Shop Giày Lam Điền + Admin
│   ├── prisma/              # Schema riêng (User, Account, Category, Product, Order, OrderItem, Review)
│   ├── public/              # Ảnh, assets
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx     # Trang chủ Web Shop (/)
│   │   │   ├── admin/       # Trang quản trị Admin (/admin, /admin/login)
│   │   │   └── api/         # APIs (admin, auth, orders, reviews)
│   │   ├── lib/             # prisma client, JWT auth helpers
│   │   └── middleware.ts    # Bảo vệ route /admin
│   ├── package.json
│   └── tsconfig.json
│
└── quy-dat/                 # 🏢 Dự án Quản Lý Dự Án Quỹ Đất & Tạo Văn Bản
    ├── prisma/              # Schema riêng (Project, ProjectDetail, ProjectState, ProjectHistory, DocTemplate, DocHistory)
    ├── public/              # Assets
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx     # Dashboard quản lý dự án (/)
    │   │   ├── tao-van-ban/ # Công cụ tạo văn bản Word/Excel (/tao-van-ban)
    │   │   └── api/         # APIs (projects, tao-van-ban)
    │   ├── components/      # Dashboard client, Tạo văn bản client
    │   ├── constants/       # Text & configurations
    │   └── lib/             # prisma client
    ├── package.json
    └── tsconfig.json
```

---

## 1. Khởi chạy Web Shop Lam Điền

```bash
cd shop-lam-dien
npm install
npx prisma generate
npm run dev
```
> Web Shop sẽ chạy tại: **http://localhost:3000**  
> Admin Shop: **http://localhost:3000/admin**

---

## 2. Khởi chạy Quản Lý Dự Án Quỹ Đất

```bash
cd quy-dat
npm install
npx prisma generate
npm run dev
```
> Dashboard Quỹ Đất sẽ chạy tại: **http://localhost:3001** (hoặc port do Next.js phân bổ)  
> Tạo văn bản: **http://localhost:3001/tao-van-ban**
