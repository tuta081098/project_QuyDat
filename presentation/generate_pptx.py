#!/usr/bin/env python3
"""
Script tạo file PowerPoint báo cáo đồ án: Web Shop Giày Lam Điền
Chạy: pip install python-pptx && python3 generate_pptx.py
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# ============================================================
# COLOR PALETTE
# ============================================================
TEAL_DARK    = RGBColor(0x0D, 0x5E, 0x5E)   # Header/Title
TEAL         = RGBColor(0x14, 0xB8, 0xA6)   # Accent
TEAL_LIGHT   = RGBColor(0xCC, 0xFB, 0xF1)   # Light background
WHITE        = RGBColor(0xFF, 0xFF, 0xFF)
BLACK        = RGBColor(0x1E, 0x29, 0x3B)
DARK_GRAY    = RGBColor(0x33, 0x42, 0x55)
MID_GRAY     = RGBColor(0x64, 0x74, 0x8B)
LIGHT_GRAY   = RGBColor(0xF1, 0xF5, 0xF9)
SLATE_BG     = RGBColor(0xF8, 0xFA, 0xFC)
EMERALD      = RGBColor(0x10, 0xB9, 0x81)
BLUE         = RGBColor(0x38, 0x82, 0xF6)
AMBER        = RGBColor(0xF5, 0x9E, 0x0B)
RED          = RGBColor(0xEF, 0x44, 0x44)
INDIGO       = RGBColor(0x63, 0x66, 0xF1)

SLIDE_W = Inches(13.33)
SLIDE_H = Inches(7.5)

# ============================================================
# HELPER FUNCTIONS
# ============================================================
def set_slide_bg(slide, color):
    """Set solid background color for a slide."""
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_shape_rect(slide, left, top, width, height, fill_color, border_color=None, radius=None):
    """Add a rounded rectangle shape."""
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1)
    else:
        shape.line.fill.background()
    if radius is not None:
        try:
            shape.adjustments[0] = radius
        except:
            pass
    return shape

def add_textbox(slide, left, top, width, height, text, font_size=14, bold=False, color=BLACK, alignment=PP_ALIGN.LEFT, font_name="Arial"):
    """Add a text box to the slide."""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.name = font_name
    p.alignment = alignment
    return txBox

def add_paragraph(text_frame, text, font_size=14, bold=False, color=BLACK, alignment=PP_ALIGN.LEFT, space_before=Pt(4), space_after=Pt(2), font_name="Arial"):
    """Add a new paragraph to an existing text frame."""
    p = text_frame.add_paragraph()
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.name = font_name
    p.alignment = alignment
    p.space_before = space_before
    p.space_after = space_after
    return p

def add_bullet_list(slide, left, top, width, height, items, font_size=13, color=DARK_GRAY, bullet_char="●"):
    """Add a bulleted text list."""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.text = f"  {bullet_char}  {item}"
        p.font.size = Pt(font_size)
        p.font.color.rgb = color
        p.font.name = "Arial"
        p.space_before = Pt(6)
        p.space_after = Pt(2)
    return txBox

def create_title_slide(slide, title_text, subtitle_text):
    """Create a styled title with accent bar."""
    # Top accent bar
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_W, Inches(0.06))
    bar.fill.solid()
    bar.fill.fore_color.rgb = TEAL
    bar.line.fill.background()

    # Left accent stripe
    stripe = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.08), SLIDE_H)
    stripe.fill.solid()
    stripe.fill.fore_color.rgb = TEAL_DARK
    stripe.line.fill.background()

    # Title
    add_textbox(slide, Inches(0.7), Inches(0.3), Inches(11), Inches(0.7),
                title_text, font_size=28, bold=True, color=TEAL_DARK)
    
    # Subtitle line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.7), Inches(0.95), Inches(1.5), Pt(3))
    line.fill.solid()
    line.fill.fore_color.rgb = TEAL
    line.line.fill.background()

    if subtitle_text:
        add_textbox(slide, Inches(0.7), Inches(1.1), Inches(11), Inches(0.4),
                    subtitle_text, font_size=13, bold=False, color=MID_GRAY)

def add_card(slide, left, top, width, height, title, items, icon_color=TEAL, title_size=14, item_size=12):
    """Add a styled card with title and bullet items."""
    card = add_shape_rect(slide, left, top, width, height, WHITE, RGBColor(0xE2, 0xE8, 0xF0), 0.05)
    
    # Color bar at top
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.06))
    bar.fill.solid()
    bar.fill.fore_color.rgb = icon_color
    bar.line.fill.background()
    
    add_textbox(slide, left + Inches(0.25), top + Inches(0.15), width - Inches(0.5), Inches(0.4),
                title, font_size=title_size, bold=True, color=TEAL_DARK)
    
    y = top + Inches(0.55)
    for item in items:
        add_textbox(slide, left + Inches(0.3), y, width - Inches(0.6), Inches(0.28),
                    f"▸ {item}", font_size=item_size, color=DARK_GRAY)
        y += Inches(0.3)
    return card

def add_notes(slide, notes_text):
    """Add speaker notes."""
    notes_slide = slide.notes_slide
    notes_slide.notes_text_frame.text = notes_text

# ============================================================
# MAIN - CREATE PRESENTATION
# ============================================================
prs = Presentation()
prs.slide_width = SLIDE_W
prs.slide_height = SLIDE_H
blank_layout = prs.slide_layouts[6]  # Blank layout

# ============================================================
# SLIDE 1: TRANG BÌA
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, RGBColor(0x0F, 0x17, 0x2A))

# Decorative circle top-left (muted teal to simulate transparency on dark bg)
circle1 = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(-2), Inches(-2), Inches(6), Inches(6))
circle1.fill.solid()
circle1.fill.fore_color.rgb = RGBColor(0x12, 0x2B, 0x3A)  # Dark muted teal
circle1.line.fill.background()

# Decorative circle bottom-right
circle2 = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(9), Inches(4), Inches(6), Inches(6))
circle2.fill.solid()
circle2.fill.fore_color.rgb = RGBColor(0x11, 0x28, 0x30)  # Dark muted emerald
circle2.line.fill.background()

# Main title
add_textbox(slide, Inches(1), Inches(1.5), Inches(11), Inches(1.2),
            "BÁO CÁO ĐỒ ÁN", font_size=18, bold=True, color=TEAL)
add_textbox(slide, Inches(1), Inches(2.2), Inches(11), Inches(1.5),
            "WEB SHOP GIÀY LAM ĐIỀN", font_size=44, bold=True, color=WHITE)
add_textbox(slide, Inches(1), Inches(3.5), Inches(11), Inches(0.8),
            "Hệ thống E-Commerce & Trang quản trị Admin", font_size=20, bold=False, color=RGBColor(0x94, 0xA3, 0xB8))

# Divider line
line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1), Inches(4.5), Inches(2), Pt(3))
line.fill.solid()
line.fill.fore_color.rgb = TEAL
line.line.fill.background()

# Info
add_textbox(slide, Inches(1), Inches(4.8), Inches(5), Inches(0.4),
            "Sinh viên: Quý Đạt", font_size=16, color=RGBColor(0xCB, 0xD5, 0xE1))
add_textbox(slide, Inches(1), Inches(5.3), Inches(5), Inches(0.4),
            "Công nghệ: Next.js 16 · React 19 · MongoDB · Prisma · TailwindCSS", font_size=13, color=MID_GRAY)

# Tech badges
techs = ["Next.js 16", "React 19", "MongoDB", "Prisma", "TailwindCSS"]
x_pos = Inches(1)
for tech in techs:
    badge = add_shape_rect(slide, x_pos, Inches(6), Inches(1.7), Inches(0.4), RGBColor(0x1E, 0x29, 0x3B), TEAL, 0.15)
    add_textbox(slide, x_pos + Inches(0.1), Inches(6.02), Inches(1.5), Inches(0.35),
                tech, font_size=10, bold=True, color=TEAL, alignment=PP_ALIGN.CENTER)
    x_pos += Inches(1.85)

add_notes(slide, "Slide bìa: Giới thiệu đồ án Web Shop Giày Lam Điền – hệ thống bán hàng trực tuyến fullstack với trang quản trị admin. Sinh viên thực hiện: Quý Đạt.")


# ============================================================
# SLIDE 2: MỤC LỤC
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "MỤC LỤC", "Nội dung trình bày")

items_left = [
    ("01", "Giới thiệu dự án"),
    ("02", "Công nghệ sử dụng"),
    ("03", "Kiến trúc hệ thống"),
    ("04", "Cơ sở dữ liệu (Database)"),
    ("05", "REST API Endpoints"),
    ("06", "Chức năng Web Shop"),
    ("07", "Chức năng Admin"),
    ("08", "Xác thực & Bảo mật"),
]

items_right = [
    ("09", "Luồng đặt hàng & Thanh toán"),
    ("10", "Giỏ hàng & Đồng bộ"),
    ("11", "Dashboard & Báo cáo KPI"),
    ("12", "Tìm kiếm & Lọc sản phẩm"),
    ("13", "Đánh giá sản phẩm"),
    ("14", "Upload ảnh Cloudinary"),
    ("15", "Responsive & UI/UX"),
    ("16", "Tổng kết & Hướng phát triển"),
]

y = Inches(1.8)
for num, title in items_left:
    badge = add_shape_rect(slide, Inches(0.8), y, Inches(0.5), Inches(0.4), TEAL_DARK, radius=0.15)
    add_textbox(slide, Inches(0.85), y + Inches(0.02), Inches(0.4), Inches(0.35),
                num, font_size=11, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, Inches(1.5), y + Inches(0.02), Inches(4.5), Inches(0.35),
                title, font_size=13, bold=False, color=DARK_GRAY)
    y += Inches(0.55)

y = Inches(1.8)
for num, title in items_right:
    badge = add_shape_rect(slide, Inches(7), y, Inches(0.5), Inches(0.4), TEAL_DARK, radius=0.15)
    add_textbox(slide, Inches(7.05), y + Inches(0.02), Inches(0.4), Inches(0.35),
                num, font_size=11, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, Inches(7.7), y + Inches(0.02), Inches(4.5), Inches(0.35),
                title, font_size=13, bold=False, color=DARK_GRAY)
    y += Inches(0.55)

add_notes(slide, "Mục lục gồm 16 phần chính, bao quát toàn bộ khía cạnh kỹ thuật và chức năng của dự án.")


# ============================================================
# SLIDE 3: GIỚI THIỆU DỰ ÁN
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "01 — GIỚI THIỆU DỰ ÁN", "Mục đích & Phạm vi")

# Left column
add_card(slide, Inches(0.7), Inches(1.6), Inches(5.8), Inches(3.2),
         "🎯  Mục đích dự án", [
             "Xây dựng website bán giày Lam Điền fullstack",
             "Cung cấp giao diện mua sắm cho khách hàng",
             "Trang Admin quản trị toàn bộ hệ thống",
             "Hỗ trợ đăng nhập Google (OAuth2) & tài khoản cục bộ",
             "Quản lý đơn hàng, sản phẩm, khách hàng, đánh giá",
             "Thanh toán COD & VietQR chuyển khoản",
             "Theo dõi doanh thu, KPIs, biểu đồ 7 ngày"
         ], TEAL)

# Right column
add_card(slide, Inches(6.8), Inches(1.6), Inches(5.8), Inches(3.2),
         "📦  Phạm vi hệ thống", [
             "Web Shop: Trang chủ hiển thị sản phẩm theo danh mục",
             "Giỏ hàng: Thêm/xóa sản phẩm, chọn size, số lượng",
             "Checkout: Đặt hàng với COD hoặc QR Payment",
             "Tra cứu đơn hàng bằng số điện thoại",
             "Admin Dashboard: Thống kê doanh thu, KPIs",
             "CRUD: Danh mục, Sản phẩm, Đơn hàng, Đánh giá",
             "Quản lý khách hàng & trạng thái tài khoản"
         ], EMERALD)

# Bottom info bar
info_bar = add_shape_rect(slide, Inches(0.7), Inches(5.2), Inches(11.9), Inches(0.8), WHITE, RGBColor(0xE2, 0xE8, 0xF0))
add_textbox(slide, Inches(1), Inches(5.3), Inches(11), Inches(0.6),
            "💡  Dự án áp dụng kiến trúc Fullstack Monorepo — Frontend & Backend cùng trong 1 project Next.js, "
            "sử dụng Server Components, API Routes, Middleware bảo vệ admin, và Prisma ORM kết nối MongoDB Atlas.",
            font_size=11, color=MID_GRAY)

add_notes(slide, "Shop Lam Điền là website bán giày dép trực tuyến. Gồm 2 phần chính: Web Shop cho khách hàng mua sắm và Admin Dashboard để quản trị viên quản lý toàn bộ nghiệp vụ kinh doanh.")


# ============================================================
# SLIDE 4: CÔNG NGHỆ SỬ DỤNG
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "02 — CÔNG NGHỆ SỬ DỤNG", "Technology Stack")

tech_groups = [
    ("Frontend", TEAL, [
        "Next.js 16.2.2 – App Router, SSR/SSG",
        "React 19.2.4 – Client Components",
        "TailwindCSS 4 – Utility-first CSS",
        "Lucide React – Icon Library",
        "ShadCN UI – Component Library"
    ]),
    ("Backend", BLUE, [
        "Next.js API Routes – RESTful APIs",
        "Prisma 5 – ORM & Schema Migration",
        "bcryptjs – Hash mật khẩu",
        "NextAuth.js 4 – OAuth2 (Google)",
        "JWT tùy chỉnh – Admin Session"
    ]),
    ("Database & Infra", EMERALD, [
        "MongoDB Atlas – Cloud NoSQL Database",
        "Cloudinary – CDN lưu trữ hình ảnh",
        "Environment Variables (.env)",
        "Middleware – Bảo vệ route admin",
        "TypeScript 5 – Type Safety"
    ]),
]

x = Inches(0.7)
for title, color, items in tech_groups:
    add_card(slide, x, Inches(1.6), Inches(3.8), Inches(3.5), title, items, color, title_size=16, item_size=12)
    x += Inches(4.1)

add_notes(slide, "Stack công nghệ: Next.js 16 (App Router) + React 19 cho frontend, API Routes cho backend, Prisma ORM kết nối MongoDB Atlas, NextAuth cho OAuth2 Google login, Cloudinary cho upload ảnh sản phẩm, TailwindCSS 4 cho styling.")


# ============================================================
# SLIDE 5: KIẾN TRÚC HỆ THỐNG
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "03 — KIẾN TRÚC HỆ THỐNG", "System Architecture Diagram")

# Architecture diagram using shapes
layers = [
    ("CLIENT (Browser)", TEAL_LIGHT, TEAL_DARK, Inches(0.8), Inches(1.8), Inches(11.7), Inches(1.1),
     ["React 19 Components  ·  TailwindCSS  ·  Client-Side State  ·  LocalStorage (Cart)"]),
    
    ("NEXT.JS SERVER (App Router)", RGBColor(0xDB, 0xEA, 0xFE), BLUE, Inches(0.8), Inches(3.1), Inches(11.7), Inches(1.5),
     ["Middleware (JWT Verify)  →  API Routes (/api/*)  →  Server Components  ·  NextAuth Handler"]),
    
    ("DATA LAYER", RGBColor(0xD1, 0xFA, 0xE5), EMERALD, Inches(0.8), Inches(4.8), Inches(11.7), Inches(1.1),
     ["Prisma ORM  →  MongoDB Atlas  ·  Cloudinary CDN (Images)  ·  Environment Config"]),
]

for title, bg_color, border_color, left, top, width, height, desc_list in layers:
    card = add_shape_rect(slide, left, top, width, height, bg_color, border_color, 0.03)
    add_textbox(slide, left + Inches(0.3), top + Inches(0.1), Inches(4), Inches(0.4),
                title, font_size=13, bold=True, color=border_color)
    add_textbox(slide, left + Inches(0.3), top + Inches(0.5), width - Inches(0.6), Inches(0.5),
                desc_list[0], font_size=11, color=DARK_GRAY)

# Arrows between layers
for y_top in [Inches(2.9), Inches(4.55)]:
    arrow = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(6.3), y_top, Inches(0.4), Inches(0.25))
    arrow.fill.solid()
    arrow.fill.fore_color.rgb = MID_GRAY
    arrow.line.fill.background()

# Side labels
add_textbox(slide, Inches(0.8), Inches(6.1), Inches(11.7), Inches(0.5),
            "📐  Kiến trúc Fullstack Monorepo  ·  SSR + Client Components  ·  RESTful API  ·  JWT Authentication  ·  MongoDB Atlas",
            font_size=11, color=MID_GRAY, alignment=PP_ALIGN.CENTER)

add_notes(slide, "Kiến trúc 3 tầng: Client Layer (React Components) → Server Layer (Next.js App Router + Middleware + API Routes) → Data Layer (Prisma + MongoDB + Cloudinary). Middleware bảo vệ tất cả route /admin bằng JWT verify.")


# ============================================================
# SLIDE 6: CẤU TRÚC SOURCE CODE
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "03.1 — CẤU TRÚC SOURCE CODE", "Tổ chức thư mục dự án shop-lam-dien")

code_text = """shop-lam-dien/
├── prisma/
│   └── schema.prisma          # 6 models: User, Account, Category, Product, Order, OrderItem, Review
├── src/
│   ├── app/
│   │   ├── page.tsx            # Trang chủ Web Shop (2126 dòng)
│   │   ├── layout.tsx          # Root Layout – Font, Metadata
│   │   ├── globals.css         # TailwindCSS + ShadCN design tokens
│   │   ├── admin/
│   │   │   ├── page.tsx        # Admin Dashboard (1500 dòng)
│   │   │   ├── layout.tsx      # Admin metadata
│   │   │   └── login/page.tsx  # Trang đăng nhập Admin
│   │   └── api/
│   │       ├── admin/          # auth/login, categories, products, orders, customers, dashboard, reviews
│   │       ├── auth/           # [...nextauth], login, register, me
│   │       ├── orders/         # POST đặt hàng, GET tra cứu
│   │       └── reviews/        # POST đánh giá sản phẩm
│   ├── lib/
│   │   ├── auth.ts             # JWT createToken / verifyToken (HMAC-SHA256)
│   │   └── prisma.ts           # Prisma Client Singleton
│   └── middleware.ts           # Bảo vệ /admin/* bằng JWT Cookie
├── package.json                # Dependencies & scripts
└── .env                        # MongoDB URL, Google OAuth, Cloudinary"""

txBox = slide.shapes.add_textbox(Inches(0.7), Inches(1.5), Inches(12), Inches(5.5))
tf = txBox.text_frame
tf.word_wrap = True
for line in code_text.split('\n'):
    if tf.paragraphs[0].text == '':
        p = tf.paragraphs[0]
    else:
        p = tf.add_paragraph()
    p.text = line
    p.font.size = Pt(10)
    p.font.name = "Courier New"
    p.font.color.rgb = DARK_GRAY
    p.space_before = Pt(1)
    p.space_after = Pt(1)

add_notes(slide, "Cấu trúc thư mục: Trang chủ Web Shop (page.tsx ~2126 dòng), Admin Dashboard (admin/page.tsx ~1500 dòng). API Routes tổ chức theo feature: admin (CRUD), auth (đăng nhập/đăng ký), orders (đặt hàng/tra cứu), reviews (đánh giá).")


# ============================================================
# SLIDE 7: DATABASE SCHEMA
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "04 — CƠ SỞ DỮ LIỆU", "MongoDB + Prisma ORM Schema")

models = [
    ("User", TEAL, ["id, email, password, name", "phone, address, role, status", "cartData, accounts[], reviews[]", "Google OAuth (Account relation)"]),
    ("Category", BLUE, ["id, name, slug, status", "isHeaderMenu, parentId", "Cây danh mục cha-con", "Đếm sản phẩm (_count)"]),
    ("Product", EMERALD, ["id, name, slug, price", "discountPrice, stock, sizes[]", "image (Cloudinary URL)", "categoryId → Category"]),
    ("Order", AMBER, ["id, customerName/Email/Phone", "address, totalAmount, status", "paymentMethod (COD/QR)", "paymentStatus (PENDING/PAID)"]),
    ("OrderItem", INDIGO, ["id, quantity, price (snapshot)", "productName (snapshot)", "size, orderId → Order", "productId → Product"]),
    ("Review", RED, ["id, rating (1-5 sao)", "comment, productId", "userId → User", "Chỉ đánh giá khi DELIVERED"]),
]

x_positions = [Inches(0.5), Inches(4.5), Inches(8.5)]
y_positions = [Inches(1.6), Inches(4.2)]

for i, (name, color, fields) in enumerate(models):
    col = i % 3
    row = i // 3
    x = x_positions[col]
    y = y_positions[row]
    
    card = add_shape_rect(slide, x, y, Inches(3.7), Inches(2.3), WHITE, color, 0.04)
    
    # Model name header
    header = add_shape_rect(slide, x, y, Inches(3.7), Inches(0.45), color, radius=0.04)
    add_textbox(slide, x + Inches(0.2), y + Inches(0.05), Inches(3.3), Inches(0.35),
                f"📋  {name}", font_size=13, bold=True, color=WHITE)
    
    y_field = y + Inches(0.55)
    for field in fields:
        add_textbox(slide, x + Inches(0.2), y_field, Inches(3.3), Inches(0.25),
                    f"  · {field}", font_size=10, color=DARK_GRAY)
        y_field += Inches(0.3)

add_notes(slide, "Database gồm 7 models (User, Account, Category, Product, Order, OrderItem, Review). Sử dụng MongoDB qua Prisma ORM. Category hỗ trợ cây phân cấp (parent-child). OrderItem lưu snapshot giá và tên sản phẩm tại thời điểm mua.")


# ============================================================
# SLIDE 8: API ENDPOINTS
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "05 — REST API ENDPOINTS", "Danh sách API chính")

api_groups = [
    ("🔐 Admin Auth", [
        "POST  /api/admin/auth/login  →  Đăng nhập Admin (ENV credentials + JWT Cookie)",
    ]),
    ("📊 Admin CRUD", [
        "GET   /api/admin/dashboard    →  Thống kê: doanh thu, KPIs, biểu đồ 7 ngày, top sản phẩm",
        "GET   /api/admin/categories   →  Danh sách danh mục (include parent, _count products)",
        "POST  /api/admin/categories   →  Thêm danh mục mới (tự tạo header menu nếu chưa có)",
        "GET   /api/admin/products     →  Danh sách sản phẩm (include category, reviews)",
        "POST  /api/admin/products     →  Thêm sản phẩm (name, price, sizes, image, stock)",
        "PATCH /api/admin/orders       →  Cập nhật trạng thái đơn hàng & thanh toán",
        "GET   /api/admin/customers    →  Danh sách khách hàng (role=USER)",
        "GET   /api/admin/reviews      →  Danh sách đánh giá",
    ]),
    ("👤 User Auth", [
        "POST  /api/auth/login         →  Đăng nhập (bcrypt compare)",
        "POST  /api/auth/register      →  Đăng ký (bcrypt hash + validate)",
        "GET   /api/auth/me            →  Lấy profile user theo email",
        "PATCH /api/auth/me            →  Cập nhật profile & đồng bộ giỏ hàng",
        "NextAuth [...nextauth]        →  Google OAuth2 (PrismaAdapter + JWT Session)",
    ]),
    ("🛒 Shop", [
        "POST  /api/orders             →  Đặt hàng (Transaction: tạo order + trừ stock)",
        "GET   /api/orders/track       →  Tra cứu đơn hàng bằng SĐT",
        "POST  /api/reviews            →  Gửi đánh giá (kiểm tra đã mua & DELIVERED)",
    ]),
]

y = Inches(1.5)
for group_title, endpoints in api_groups:
    add_textbox(slide, Inches(0.7), y, Inches(12), Inches(0.35),
                group_title, font_size=13, bold=True, color=TEAL_DARK)
    y += Inches(0.38)
    for ep in endpoints:
        add_textbox(slide, Inches(1.0), y, Inches(11.5), Inches(0.28),
                    ep, font_size=9.5, color=DARK_GRAY, font_name="Courier New")
        y += Inches(0.27)
    y += Inches(0.15)

add_notes(slide, "API RESTful tổ chức theo module: Admin Auth (JWT-based), Admin CRUD (dashboard, categories, products, orders, customers, reviews), User Auth (login/register/me + Google OAuth), Shop (orders với Prisma transaction, tra cứu, đánh giá).")


# ============================================================
# SLIDE 9: CHỨC NĂNG WEB SHOP
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "06 — CHỨC NĂNG WEB SHOP", "Giao diện mua sắm cho khách hàng")

features = [
    ("Hiển thị sản phẩm", TEAL, [
        "Phân loại theo tab: Tất cả, Nam, Nữ, Trẻ em, Phụ kiện, BST, Giảm giá",
        "Danh mục con (Sub-categories) dynamic",
        "Hiển thị giá gốc / giá khuyến mãi",
        "Hình ảnh sản phẩm từ Cloudinary CDN",
    ]),
    ("Tìm kiếm & Lọc", BLUE, [
        "Tìm kiếm thông minh (normalize Vietnamese)",
        "Scoring: exact match > starts with > contains",
        "Lọc theo size (35-44), khoảng giá",
        "Quick filter: Tất cả, Bán chạy, Giảm giá",
    ]),
    ("Giỏ hàng & Checkout", EMERALD, [
        "Thêm/xóa, chọn size, cập nhật số lượng",
        "Kiểm tra tồn kho real-time",
        "Đồng bộ giỏ hàng lên DB (cartData)",
        "Thanh toán COD hoặc QR VietQR",
    ]),
    ("Tài khoản & Khác", AMBER, [
        "Đăng ký/Đăng nhập email hoặc Google",
        "Cập nhật profile (tên, SĐT, địa chỉ)",
        "Tra cứu đơn hàng bằng SĐT",
        "Đánh giá sản phẩm (1-5 sao, comment)",
    ]),
]

x_positions = [Inches(0.5), Inches(3.6), Inches(6.7), Inches(9.8)]
for i, (title, color, items) in enumerate(features):
    add_card(slide, x_positions[i], Inches(1.6), Inches(2.9), Inches(3.6),
             title, items, color, title_size=12, item_size=9.5)

add_notes(slide, "Web Shop có 4 nhóm chức năng chính: Hiển thị sản phẩm theo danh mục phân cấp, Tìm kiếm thông minh với Vietnamese normalization và scoring, Giỏ hàng đồng bộ DB + thanh toán COD/QR, và Tài khoản người dùng (email/Google OAuth).")


# ============================================================
# SLIDE 10: CHỨC NĂNG ADMIN
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "07 — CHỨC NĂNG TRANG ADMIN", "Hệ thống quản trị Shop Lam Điền")

admin_tabs = [
    ("📊 Tổng quan (Dashboard)", TEAL, [
        "4 KPI cards: Doanh thu, Đơn hàng, AOV, Khách hàng",
        "Biểu đồ cột doanh thu 7 ngày gần nhất",
        "Phễu trạng thái đơn hàng (Pending → Shipping → Delivered)",
        "Phân tích thanh toán: VietQR vs COD, Đã thu / Chưa thu",
        "Top 5 sản phẩm bán chạy nhất",
        "Đơn hàng gần nhất với Quick Action buttons",
    ]),
    ("📦 Quản lý CRUD", BLUE, [
        "Danh mục: Thêm/Sửa/Xóa, thuộc Header Tab (NAM, NỮ, ...)",
        "Sản phẩm: Thêm/Sửa/Xóa, upload ảnh Cloudinary",
        "Đơn hàng: Cập nhật trạng thái (PENDING→SHIPPING→DELIVERED)",
        "Tự động đánh dấu 'Đã thanh toán' khi giao thành công",
        "Khách hàng: Danh sách users, email, SĐT, ngày tạo",
        "Đánh giá: Duyệt/Xóa review của khách hàng",
    ]),
]

for i, (title, color, items) in enumerate(admin_tabs):
    x = Inches(0.5) + i * Inches(6.2)
    add_card(slide, x, Inches(1.6), Inches(5.9), Inches(4.5), title, items, color, title_size=14, item_size=11)

add_notes(slide, "Admin Dashboard gồm 6 tab: Tổng quan (KPI, biểu đồ, alerts), Danh mục, Sản phẩm, Đơn hàng, Khách hàng, Đánh giá. Dashboard hiển thị doanh thu thực tế (chỉ tính đơn DELIVERED), biểu đồ 7 ngày, phễu trạng thái đơn, phân tích thanh toán QR vs COD.")


# ============================================================
# SLIDE 11: XÁC THỰC & BẢO MẬT
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "08 — XÁC THỰC & BẢO MẬT", "Authentication & Security")

# Admin Auth
add_card(slide, Inches(0.5), Inches(1.6), Inches(5.9), Inches(3.0),
         "🔐  Admin Authentication", [
             "Đăng nhập bằng username/password (lưu trong ENV)",
             "Tạo JWT token tùy chỉnh (HMAC-SHA256)",
             "Token lưu trong HttpOnly Cookie (không truy cập từ JS)",
             "Middleware kiểm tra & verify token mỗi request /admin/*",
             "Token hết hạn sau 24 giờ → redirect /admin/login",
             "Cookie: Secure (production), SameSite: Strict"
         ], RED)

# User Auth
add_card(slide, Inches(6.7), Inches(1.6), Inches(5.9), Inches(3.0),
         "👤  User Authentication", [
             "Đăng ký: Validate input + bcrypt hash password (salt=10)",
             "Đăng nhập: bcrypt compare + kiểm tra status (BANNED)",
             "Google OAuth2: NextAuth.js + PrismaAdapter",
             "Tự động tạo Account record khi đăng nhập Google",
             "Session strategy: JWT (NextAuth callbacks)",
             "Password không bao giờ trả về cho client"
         ], BLUE)

# Security highlights
add_shape_rect(slide, Inches(0.5), Inches(4.9), Inches(12.1), Inches(1.2), RGBColor(0xFE, 0xF2, 0xF2), RED, 0.03)
add_textbox(slide, Inches(0.8), Inches(5.0), Inches(11.5), Inches(0.9),
            "⚠️  Các biện pháp bảo mật chính:\n"
            "   ▸ JWT Middleware bảo vệ toàn bộ /admin/*  ·  HttpOnly Cookie chống XSS  ·  bcrypt hash password\n"
            "   ▸ Validate dữ liệu đầu vào (phone regex, email unique)  ·  Prisma Transaction cho đặt hàng  ·  Soft delete sản phẩm",
            font_size=10, color=RGBColor(0x7F, 0x1D, 0x1D))

add_notes(slide, "Bảo mật: Admin dùng JWT custom (HMAC-SHA256) lưu trong HttpOnly Cookie, Middleware verify mỗi request. User dùng bcrypt hash password, Google OAuth2 qua NextAuth. Validate phone regex, email unique, Prisma Transaction cho đặt hàng atomic.")


# ============================================================
# SLIDE 12: LUỒNG ĐẶT HÀNG
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "09 — LUỒNG ĐẶT HÀNG & THANH TOÁN", "Order Flow Diagram")

steps = [
    ("1. Chọn SP\n& Size", TEAL_LIGHT, TEAL_DARK),
    ("2. Thêm vào\nGiỏ hàng", RGBColor(0xDB, 0xEA, 0xFE), BLUE),
    ("3. Checkout\n(COD/QR)", RGBColor(0xD1, 0xFA, 0xE5), EMERALD),
    ("4. API tạo\nĐơn hàng", RGBColor(0xFE, 0xF3, 0xC7), AMBER),
    ("5. Trừ tồn kho\n(Transaction)", RGBColor(0xFC, 0xE7, 0xF3), RGBColor(0xDB, 0x27, 0x77)),
    ("6. Admin\nxử lý đơn", RGBColor(0xED, 0xE9, 0xFE), INDIGO),
]

x = Inches(0.5)
for i, (label, bg, text_color) in enumerate(steps):
    box = add_shape_rect(slide, x, Inches(2.0), Inches(1.7), Inches(1.3), bg, text_color, 0.08)
    add_textbox(slide, x + Inches(0.1), Inches(2.15), Inches(1.5), Inches(1.0),
                label, font_size=10, bold=True, color=text_color, alignment=PP_ALIGN.CENTER)
    if i < len(steps) - 1:
        arrow = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, x + Inches(1.75), Inches(2.45), Inches(0.35), Inches(0.3))
        arrow.fill.solid()
        arrow.fill.fore_color.rgb = MID_GRAY
        arrow.line.fill.background()
    x += Inches(2.1)

# Flow details
details = [
    ("Thanh toán COD", "Đơn hàng tạo với paymentStatus='PENDING'. Khi admin cập nhật status='DELIVERED', hệ thống tự động đánh dấu 'Đã thanh toán'."),
    ("Thanh toán QR (VietQR)", "Hiển thị mã QR, sau khi user xác nhận đã chuyển khoản → paymentStatus='PAID' ngay khi tạo đơn."),
    ("Prisma Transaction", "API /api/orders sử dụng prisma.$transaction: Tạo Order + OrderItems + Trừ stock atomically. Nếu hết hàng → rollback toàn bộ."),
]

y = Inches(3.8)
for title, desc in details:
    add_shape_rect(slide, Inches(0.5), y, Inches(12.1), Inches(0.65), WHITE, RGBColor(0xE2, 0xE8, 0xF0), 0.03)
    add_textbox(slide, Inches(0.8), y + Inches(0.05), Inches(2.2), Inches(0.5),
                title, font_size=11, bold=True, color=TEAL_DARK)
    add_textbox(slide, Inches(3.2), y + Inches(0.05), Inches(9), Inches(0.5),
                desc, font_size=10, color=DARK_GRAY)
    y += Inches(0.72)

add_notes(slide, "Luồng đặt hàng: Chọn sản phẩm → Thêm giỏ hàng → Checkout (COD hoặc QR) → API tạo đơn hàng bằng Prisma Transaction (atomic: tạo order + trừ stock) → Admin xử lý đơn (PENDING → SHIPPING → DELIVERED). Khi DELIVERED, hệ thống tự động đánh dấu đã thanh toán.")


# ============================================================
# SLIDE 13: GIỎ HÀNG & ĐỒNG BỘ
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "10 — GIỎ HÀNG & ĐỒNG BỘ", "Cart Synchronization Strategy")

add_card(slide, Inches(0.5), Inches(1.6), Inches(5.9), Inches(2.8),
         "🛒  Cơ chế Giỏ hàng", [
             "Cart ID = productId + '_' + size (unique per item)",
             "Lưu localStorage (lamdien_cart) cho guest user",
             "Khi đăng nhập: Đồng bộ lên DB (user.cartData)",
             "Mỗi lần thay đổi cart → PATCH /api/auth/me",
             "Kiểm tra tồn kho trước khi thêm sản phẩm",
             "Hỗ trợ tăng/giảm số lượng, xóa từng item"
         ], TEAL)

add_card(slide, Inches(6.7), Inches(1.6), Inches(5.9), Inches(2.8),
         "🔄  Luồng đồng bộ", [
             "1. Khi load trang → getSession() kiểm tra user",
             "2. Nếu có user → fetch /api/auth/me lấy cartData",
             "3. Parse cartData JSON → setCart(state)",
             "4. Nếu guest → load từ localStorage",
             "5. Khi thay đổi cart → lưu localStorage + PATCH DB",
             "6. Khi logout → xóa localStorage + reset state"
         ], BLUE)

# Code snippet
code_box = add_shape_rect(slide, Inches(0.5), Inches(4.7), Inches(12.1), Inches(1.5), RGBColor(0x1E, 0x29, 0x3B), radius=0.03)
code_text = '''const saveCart = (newCart) => {
  setCart(newCart);
  localStorage.setItem("lamdien_cart", JSON.stringify(newCart));
  if (currentUser?.id) {
    fetch('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ id: currentUser.id, cartData: JSON.stringify(newCart) })
    });
  }
};'''
txBox = slide.shapes.add_textbox(Inches(0.8), Inches(4.8), Inches(11.5), Inches(1.3))
tf = txBox.text_frame
tf.word_wrap = True
for line in code_text.split('\n'):
    if tf.paragraphs[0].text == '':
        p = tf.paragraphs[0]
    else:
        p = tf.add_paragraph()
    p.text = line
    p.font.size = Pt(10)
    p.font.name = "Courier New"
    p.font.color.rgb = TEAL
    p.space_before = Pt(1)
    p.space_after = Pt(1)

add_notes(slide, "Giỏ hàng đồng bộ 2 chiều: localStorage (guest) + MongoDB (logged-in user). Mỗi thay đổi cart gọi PATCH /api/auth/me để lưu cartData. Khi load trang, nếu có user → lấy cartData từ DB, nếu guest → lấy từ localStorage.")


# ============================================================
# SLIDE 14: DASHBOARD & KPIs
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "11 — DASHBOARD & BÁO CÁO KPI", "Admin Dashboard Analytics")

kpis = [
    ("💰 Doanh thu thực tế", "Tổng tiền các đơn DELIVERED\n+ Doanh thu hôm nay", EMERALD),
    ("📦 Đơn hàng hoàn tất", "Delivered / Tổng đơn\n+ Tỷ lệ giao thành công %", BLUE),
    ("📊 Giá trị đơn TB (AOV)", "Average Order Value\n= Doanh thu / Số đơn delivered", RGBColor(0xA8, 0x55, 0xF7)),
    ("👥 Khách hàng & Kho", "Tổng thành viên\n+ Sản phẩm hết hàng", TEAL),
]

x = Inches(0.5)
for title, desc, color in kpis:
    card = add_shape_rect(slide, x, Inches(1.6), Inches(2.9), Inches(1.5), WHITE, color, 0.04)
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(1.6), Inches(0.08), Inches(1.5))
    bar.fill.solid()
    bar.fill.fore_color.rgb = color
    bar.line.fill.background()
    add_textbox(slide, x + Inches(0.2), Inches(1.7), Inches(2.5), Inches(0.35),
                title, font_size=11, bold=True, color=color)
    add_textbox(slide, x + Inches(0.2), Inches(2.1), Inches(2.5), Inches(0.8),
                desc, font_size=9, color=MID_GRAY)
    x += Inches(3.1)

# Dashboard features
dashboard_features = [
    ("Biểu đồ 7 ngày", "Bar chart doanh thu 7 ngày gần nhất, highlight ngày hôm nay, hover tooltip hiển thị chi tiết"),
    ("Phễu đơn hàng", "Progress bars: Chờ xử lý → Đang giao → Giao thành công → Đã hủy (% từng trạng thái)"),
    ("Phân tích thanh toán", "So sánh VietQR vs COD: Số đơn, doanh thu. Tỷ lệ Đã thu / Chưa thu tiền"),
    ("Top 5 bán chạy", "Xếp hạng theo tổng số lượng bán ra (🥇🥈🥉), hiển thị hình ảnh + doanh số"),
    ("Quick Action", "Nút duyệt giao / xác nhận đã giao ngay trên dashboard. Cảnh báo đơn chờ & hết hàng"),
]

y = Inches(3.4)
for title, desc in dashboard_features:
    add_shape_rect(slide, Inches(0.5), y, Inches(12.1), Inches(0.55), WHITE, RGBColor(0xE2, 0xE8, 0xF0), 0.03)
    add_textbox(slide, Inches(0.7), y + Inches(0.05), Inches(2.2), Inches(0.4),
                f"▸  {title}", font_size=10, bold=True, color=TEAL_DARK)
    add_textbox(slide, Inches(3.0), y + Inches(0.05), Inches(9.3), Inches(0.4),
                desc, font_size=9.5, color=DARK_GRAY)
    y += Inches(0.6)

add_notes(slide, "Dashboard API trả về: tổng doanh thu (chỉ đơn DELIVERED), doanh thu hôm nay, thống kê trạng thái đơn, biểu đồ 7 ngày, phân tích thanh toán QR vs COD, top 5 sản phẩm bán chạy, đơn gần nhất, đánh giá gần nhất, sản phẩm sắp hết hàng, KPIs (AOV, delivery rate, paid rate).")


# ============================================================
# SLIDE 15: TÌM KIẾM & LỌC SẢN PHẨM
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "12 — TÌM KIẾM & LỌC SẢN PHẨM", "Smart Search & Filtering Algorithm")

add_card(slide, Inches(0.5), Inches(1.6), Inches(5.9), Inches(2.5),
         "🔍  Thuật toán tìm kiếm", [
             "Normalize Vietnamese: NFD → remove diacritics → lowercase",
             "Tokenize query → tìm trong: name, category, description, sizes",
             "Exact phrase match + All tokens match",
             "Scoring: exact name(200) > startsWith(120) > includes(80)",
             "Sắp xếp kết quả theo search score giảm dần"
         ], TEAL, item_size=10)

add_card(slide, Inches(6.7), Inches(1.6), Inches(5.9), Inches(2.5),
         "🔧  Bộ lọc sản phẩm", [
             "Lọc theo Header Tab: TẤT CẢ, NAM, NỮ, TRẺ EM, PHỤ KIỆN, BST, GIẢM GIÁ",
             "Lọc theo Sub-category (danh mục con)",
             "Lọc theo Size: 35, 36, 37, 38, 39, 40, 41, 42, 43, 44",
             "Lọc theo khoảng giá (price range slider 0-5.000.000đ)",
             "Quick filter: Tất cả, Bán chạy, Đang giảm giá"
         ], BLUE, item_size=10)

# Code highlight
code_box = add_shape_rect(slide, Inches(0.5), Inches(4.4), Inches(12.1), Inches(2.0), RGBColor(0x1E, 0x29, 0x3B), radius=0.03)
code_text = '''// Vietnamese search normalization
const normalizeVietnamese = (text) => text.normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "").replace(/đ/g, "d").toLowerCase();

// Search scoring system
if (nameNorm === cleanQuery)           searchScore += 200;  // Exact match
else if (nameNorm.startsWith(query))   searchScore += 120;  // Starts with
else if (nameNorm.includes(query))     searchScore += 80;   // Contains
if (catNorm.includes(query))           searchScore += 30;   // Category match'''

txBox = slide.shapes.add_textbox(Inches(0.8), Inches(4.5), Inches(11.5), Inches(1.8))
tf = txBox.text_frame
tf.word_wrap = True
for line in code_text.split('\n'):
    if tf.paragraphs[0].text == '':
        p = tf.paragraphs[0]
    else:
        p = tf.add_paragraph()
    p.text = line
    p.font.size = Pt(9.5)
    p.font.name = "Courier New"
    p.font.color.rgb = TEAL
    p.space_before = Pt(1)
    p.space_after = Pt(1)

add_notes(slide, "Tìm kiếm thông minh: Normalize tiếng Việt (bỏ dấu), tokenize query, tìm trong name+category+description+sizes. Scoring hệ thống: exact match (200 điểm) > startsWith (120) > includes (80) > category match (30). Kết hợp các bộ lọc: tab, sub-category, size, khoảng giá, quick filter.")


# ============================================================
# SLIDE 16: ĐÁNH GIÁ SẢN PHẨM
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "13 — HỆ THỐNG ĐÁNH GIÁ SẢN PHẨM", "Product Review System")

add_card(slide, Inches(0.5), Inches(1.6), Inches(5.9), Inches(3.0),
         "⭐  Quy trình đánh giá", [
             "1. User phải đăng nhập để đánh giá",
             "2. Kiểm tra user đã mua sản phẩm (kiểm tra đơn DELIVERED)",
             "3. Tìm đơn hàng theo email hoặc SĐT của user",
             "4. Lọc OrderItems có chứa productId đánh giá",
             "5. Nếu hợp lệ → tạo Review (rating 1-5, comment)",
             "6. Admin có thể xem và xóa đánh giá trong tab Reviews"
         ], AMBER, item_size=11)

add_card(slide, Inches(6.7), Inches(1.6), Inches(5.9), Inches(3.0),
         "🛡️  Validation Rules", [
             "Chỉ đánh giá sản phẩm đã mua & nhận hàng (DELIVERED)",
             "Không cho đánh giá nếu chưa đăng nhập",
             "Rating bắt buộc (1-5 sao), comment tùy chọn",
             "Review hiển thị tên user + ngày + rating",
             "Best seller sắp xếp theo số lượng review",
             "Admin dashboard hiển thị 5 review gần nhất"
         ], RED, item_size=11)

add_notes(slide, "Hệ thống đánh giá: User phải đăng nhập + đã mua sản phẩm + đơn hàng trạng thái DELIVERED mới được đánh giá. API kiểm tra bằng cách tìm đơn hàng theo email/SĐT, lọc OrderItems có productId. Rating 1-5 sao, comment tùy chọn.")


# ============================================================
# SLIDE 17: UPLOAD ẢNH CLOUDINARY
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "14 — UPLOAD ẢNH CLOUDINARY", "Image Management System")

add_card(slide, Inches(0.5), Inches(1.6), Inches(5.9), Inches(2.5),
         "☁️  Cloudinary Integration", [
             "Upload trực tiếp từ client → Cloudinary API",
             "Upload preset: 'lamdien_shop' (unsigned)",
             "URL từ env: NEXT_PUBLIC_CLOUDINARY_URL",
             "Trả về secure_url → lưu vào product.image",
             "Hỗ trợ preview ảnh trước khi lưu sản phẩm"
         ], INDIGO, item_size=11)

add_card(slide, Inches(6.7), Inches(1.6), Inches(5.9), Inches(2.5),
         "📸  Luồng upload", [
             "1. Admin chọn file ảnh từ input[type=file]",
             "2. Tạo FormData: file + upload_preset",
             "3. POST → Cloudinary API → nhận secure_url",
             "4. Set prodForm.image = secure_url",
             "5. Khi submit → lưu URL vào MongoDB",
             "6. Web Shop load ảnh từ Cloudinary CDN"
         ], EMERALD, item_size=11)

add_notes(slide, "Upload ảnh: Client-side upload trực tiếp lên Cloudinary (unsigned preset 'lamdien_shop'). Nhận secure_url, lưu vào product.image trong MongoDB. Web Shop load ảnh từ Cloudinary CDN. Admin có loading state khi đang upload.")


# ============================================================
# SLIDE 18: RESPONSIVE & UI/UX
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "15 — RESPONSIVE & UI/UX DESIGN", "Thiết kế giao diện người dùng")

add_card(slide, Inches(0.5), Inches(1.6), Inches(3.7), Inches(3.5),
         "📱  Responsive Design", [
             "Mobile-first approach (TailwindCSS)",
             "Mobile menu drawer (hamburger)",
             "Mobile filter bottom sheet",
             "Breakpoints: sm, md, lg",
             "Grid responsive: 1 → 2 → 4 cột",
             "Touch-friendly buttons & modals"
         ], TEAL, item_size=10)

add_card(slide, Inches(4.5), Inches(1.6), Inches(3.7), Inches(3.5),
         "🎨  UI Components", [
             "Toast notification system",
             "Modal dialogs (form, detail, confirm)",
             "Loading spinners (Loader2 animate)",
             "Chống double-click (isSubmitting state)",
             "Lucide React icon library",
             "ShadCN UI base components"
         ], BLUE, item_size=10)

add_card(slide, Inches(8.5), Inches(1.6), Inches(3.7), Inches(3.5),
         "✨  UX Features", [
             "Tìm kiếm real-time + pagination",
             "Size guide popup",
             "Quick filter tabs",
             "Hover tooltips trên biểu đồ",
             "Format tiền VND tự động",
             "Cảnh báo hết hàng, đơn chờ"
         ], AMBER, item_size=10)

# Design system info
add_shape_rect(slide, Inches(0.5), Inches(5.4), Inches(12.1), Inches(0.8), WHITE, RGBColor(0xE2, 0xE8, 0xF0), 0.03)
add_textbox(slide, Inches(0.8), Inches(5.5), Inches(11.5), Inches(0.6),
            "🎨  Design System:  Font Inter (Vietnamese)  ·  Color palette: Teal/Slate/Emerald  ·  Border radius 2xl-3xl  ·  "
            "Shadow-sm to shadow-2xl  ·  Glassmorphism (blur effects)  ·  Micro-animations (hover, fade-in, zoom-in)",
            font_size=10, color=MID_GRAY)

add_notes(slide, "UI/UX: Mobile-first responsive với TailwindCSS, mobile menu drawer, filter bottom sheet. Toast notifications, loading spinners, chống double-click. Font Inter hỗ trợ tiếng Việt. Color palette teal/slate/emerald. Glassmorphism effects trên login page.")


# ============================================================
# SLIDE 19: TỔNG KẾT
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, SLATE_BG)
create_title_slide(slide, "16 — TỔNG KẾT & HƯỚNG PHÁT TRIỂN", "Conclusion & Future Work")

# Achievements
add_card(slide, Inches(0.5), Inches(1.6), Inches(5.9), Inches(3.0),
         "✅  Kết quả đạt được", [
             "Hoàn thiện website bán giày fullstack",
             "Trang Web Shop đầy đủ chức năng mua sắm",
             "Trang Admin Dashboard với KPIs & Analytics",
             "Hệ thống auth đa lớp (Admin JWT + User bcrypt + Google)",
             "Tìm kiếm thông minh tiếng Việt + Bộ lọc nâng cao",
             "Giỏ hàng đồng bộ DB + Thanh toán COD/QR",
             "Đánh giá sản phẩm với validation nghiệp vụ"
         ], EMERALD, item_size=11)

# Future work
add_card(slide, Inches(6.7), Inches(1.6), Inches(5.9), Inches(3.0),
         "🚀  Hướng phát triển", [
             "Tích hợp thanh toán thực (VNPay, MoMo, ZaloPay)",
             "Notification realtime (WebSocket/SSE)",
             "Trang chi tiết sản phẩm riêng (/product/[slug])",
             "Phân quyền admin đa cấp (Super Admin, Staff)",
             "Báo cáo xuất Excel/PDF cho admin",
             "SEO optimization & sitemap generation",
             "CI/CD pipeline & Docker deployment"
         ], BLUE, item_size=11)

# Summary stats
stats_bar = add_shape_rect(slide, Inches(0.5), Inches(4.9), Inches(12.1), Inches(1.0), TEAL_DARK, radius=0.04)
stats = [
    ("6 Models", "Database"),
    ("18+ APIs", "Endpoints"),
    ("~3600 LOC", "Frontend Code"),
    ("3 Auth", "Methods"),
    ("2 Payment", "Methods"),
    ("7 Admin", "Modules"),
]
x = Inches(0.8)
for val, label in stats:
    add_textbox(slide, x, Inches(4.95), Inches(1.7), Inches(0.4),
                val, font_size=18, bold=True, color=TEAL, alignment=PP_ALIGN.CENTER)
    add_textbox(slide, x, Inches(5.35), Inches(1.7), Inches(0.3),
                label, font_size=10, color=RGBColor(0x94, 0xA3, 0xB8), alignment=PP_ALIGN.CENTER)
    x += Inches(2)

add_notes(slide, "Tổng kết: Dự án hoàn thiện fullstack web bán giày với ~3600 dòng code frontend, 6 database models, 18+ API endpoints, 3 phương thức xác thực, 2 phương thức thanh toán. Hướng phát triển: tích hợp thanh toán thực, realtime notification, SEO, Docker deployment.")


# ============================================================
# SLIDE 20: CẢM ƠN
# ============================================================
slide = prs.slides.add_slide(blank_layout)
set_slide_bg(slide, RGBColor(0x0F, 0x17, 0x2A))

# Decorative circles (same as cover)
circle1 = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(-2), Inches(-2), Inches(6), Inches(6))
circle1.fill.solid()
circle1.fill.fore_color.rgb = RGBColor(0x12, 0x2B, 0x3A)  # Dark muted teal
circle1.line.fill.background()

circle2 = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(9), Inches(4), Inches(6), Inches(6))
circle2.fill.solid()
circle2.fill.fore_color.rgb = RGBColor(0x11, 0x28, 0x30)  # Dark muted emerald
circle2.line.fill.background()

add_textbox(slide, Inches(0), Inches(2.0), SLIDE_W, Inches(1.2),
            "CẢM ƠN THẦY/CÔ & CÁC BẠN\nĐÃ LẮNG NGHE!", font_size=40, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)

line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.5), Inches(3.5), Inches(2.3), Pt(3))
line.fill.solid()
line.fill.fore_color.rgb = TEAL
line.line.fill.background()

add_textbox(slide, Inches(0), Inches(3.8), SLIDE_W, Inches(0.5),
            "Web Shop Giày Lam Điền — Đồ án Fullstack E-Commerce", font_size=16, color=RGBColor(0x94, 0xA3, 0xB8), alignment=PP_ALIGN.CENTER)

add_textbox(slide, Inches(0), Inches(4.5), SLIDE_W, Inches(0.5),
            "Sinh viên: Quý Đạt", font_size=14, color=MID_GRAY, alignment=PP_ALIGN.CENTER)

add_textbox(slide, Inches(0), Inches(5.5), SLIDE_W, Inches(0.4),
            "Q & A", font_size=24, bold=True, color=TEAL, alignment=PP_ALIGN.CENTER)

add_notes(slide, "Slide cảm ơn và Q&A. Sẵn sàng trả lời các câu hỏi về kiến trúc, công nghệ, và triển khai dự án.")


# ============================================================
# SAVE FILE
# ============================================================
output_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(output_dir, "project_QuyDatshop_lam_dien.pptx")
prs.save(output_path)
print(f"✅ Đã tạo file PowerPoint thành công!")
print(f"📁 Đường dẫn: {output_path}")
print(f"📊 Tổng số slide: {len(prs.slides)}")
