# 📋 DOKUMENTASI WEBSITE GKY GERENDENG MILESTONE

Dokumentasi lengkap untuk developer website internal GKY Gerendeng Milestone.

---

## 📑 Daftar Isi

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Struktur Folder](#struktur-folder)
4. [Setup & Instalasi](#setup--instalasi)
5. [Konfigurasi Supabase](#konfigurasi-supabase)
6. [Konfigurasi S3 Storage](#konfigurasi-s3-storage)
7. [Arsitektur Aplikasi](#arsitektur-aplikasi)
8. [Autentikasi](#autentikasi)
9. [Milestones CRUD](#milestones-crud)
10. [Image Upload](#image-upload)
11. [Proteksi Route](#proteksi-route)
12. [Komponen](#komponen)
13. [Debugging](#debugging)
14. [Deployment](#deployment)
15. [Keamanan](#keamanan)

---

## Overview

Website internal untuk mencatat milestone/event khusus GKY Gerendeng. Fitur utama:
- **Login** via Google OAuth atau Email OTP
- **Milestones** - Catatan event/aktivitas dengan gambar
- **Form Admin** - Halaman khusus admin untuk menambah milestone
- **Admin-only** - Hanya admin yang bisa create/edit/delete
- **Protected Routes** - Semua halaman memerlukan login

---

## Tech Stack

| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| **Next.js** | 16.1.3 | React framework dengan App Router |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Supabase** | 2.90.1 | Backend-as-a-service (Auth + Database) |
| **AWS SDK S3** | 3.x | S3-compatible storage client |
| **Tailwind CSS** | 4.x | Utility-first CSS |
| **Zod** | 4.3.5 | Schema validation |
| **Shadcn UI** | - | Component library |
| **date-fns** | - | Date formatting |
| **react-day-picker** | - | Calendar component |
| **Sonner** | - | Toast notification library |
| **react-markdown** | 10.x | Markdown renderer |
| **@tailwindcss/typography** | 0.5.x | Prose styling untuk Markdown |

---

## Struktur Folder

```
src/
├── app/                      # Next.js App Router
│   ├── account/              # Halaman akun user
│   │   └── page.tsx
│   ├── auth/                 # Auth routes
│   │   └── callback/         # OAuth callback handler
│   │       └── route.ts
│   ├── form/                 # Halaman form admin (protected)
│   │   ├── [id]/             # Halaman edit milestone
│   │   │   └── page.tsx
│   │   └── page.tsx          # Form tambah milestone
│   ├── loading.tsx           # Global Loading UI
│   ├── not-found.tsx         # 404 Page
│   ├── login/                # Halaman login
│   │   └── page.tsx
│   ├── otp/                  # Halaman verifikasi OTP
│   │   └── page.tsx
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page (milestones)
│
├── components/
│   ├── molecules/            # Komponen medium
│   │   ├── docks-menu.tsx    # Bottom navigation
│   │   ├── error-notification.tsx # Toast notifikasi error
│   │   ├── image-upload.tsx  # Komponen upload gambar reusable
│   │   ├── milestone-card-grid.tsx # Grid kartu milestone
│   │   └── mode-toggle.tsx   # Toggle dark/light mode
│   ├── organism/             # Komponen besar
│   │   ├── account-card.tsx  # Card info akun
│   │   ├── login-form.tsx    # Form login
│   │   ├── otp-form.tsx      # Form OTP
│   │   ├── milestone-edit-form.tsx # Form edit milestone
│   │   └── milestone-form.tsx # Form tambah milestone (admin)
│   ├── shadcn/               # Shadcn UI components
│   └── theme-provider.tsx    # Theme context
│
├── lib/
│   ├── actions/              # Server Actions
│   │   ├── auth.ts           # Auth actions
│   │   ├── milestones.ts     # Milestones CRUD
│   │   └── storage.ts        # S3 image upload/delete
│   ├── supabase/             # Supabase clients
│   │   ├── client.ts         # Browser client
│   │   ├── server.ts         # Server client
│   │   ├── middleware.ts     # Middleware helper
│   │   └── index.ts          # Barrel export
│   ├── types/                # TypeScript types
│   │   └── milestones.ts
│   ├── validations/          # Zod schemas
│   │   └── auth.ts
│   └── utils.ts              # Utility functions
│
└── proxy.ts                  # Next.js 16 proxy (middleware)
```

---

## Setup & Instalasi

### Prerequisites

- Node.js 18+
- pnpm (recommended) atau npm
- Akun Supabase

### Langkah Instalasi

```bash
# 1. Clone repository
git clone <repository-url>
cd form-mailstone

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Edit .env.local dengan kredensial Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# 5. Jalankan development server
pnpm dev
```

### Scripts

| Script | Deskripsi |
|--------|-----------|
| `pnpm dev` | Development server (http://localhost:3000) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

---

## Konfigurasi Supabase

### 1. Buat Project di Supabase

1. Buka [supabase.com](https://supabase.com)
2. Create new project
3. Copy `Project URL` dan `anon public key`

### 2. Konfigurasi Authentication

**Dashboard → Authentication → Providers:**
- Enable **Google** provider
- Add Google Client ID & Secret dari Google Cloud Console

**Dashboard → Authentication → URL Configuration:**
```
Site URL: http://localhost:3000 (dev) / https://your-domain.com (prod)
Redirect URLs: 
  - http://localhost:3000/auth/callback
  - https://your-domain.com/auth/callback
```

### 3. Buat Database Tables

Jalankan SQL berikut di **SQL Editor**:

```sql
-- ===== TABLE: admins =====
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can check admin status"
  ON admins FOR SELECT
  TO authenticated
  USING (true);

-- ===== TABLE: milestones =====
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Read: semua user authenticated
CREATE POLICY "Authenticated users can read milestones"
  ON milestones FOR SELECT TO authenticated USING (true);

-- Insert: admin only
CREATE POLICY "Admins can insert milestones"
  ON milestones FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Update: admin only
CREATE POLICY "Admins can update milestones"
  ON milestones FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Delete: admin only
CREATE POLICY "Admins can delete milestones"
  ON milestones FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- ===== TRIGGER: updated_at =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4. Tambahkan Admin

```sql
-- Ganti YOUR_USER_ID dengan ID dari Authentication → Users
INSERT INTO admins (user_id) VALUES ('YOUR_USER_ID');
```

---

## Arsitektur Aplikasi

```
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER                              │
│  React Components (Client)                                   │
│  - login-form.tsx, otp-form.tsx, milestone-card-grid.tsx    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Request
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      PROXY (proxy.ts)                        │
│  - Session refresh                                           │
│  - Route protection                                          │
│  - Redirect logic                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER ACTIONS                            │
│  - auth.ts: signInWithGoogle, signInWithOTP, verifyOTP      │
│  - milestones.ts: getMilestones, createMilestone, etc       │
│  Features:                                                   │
│  - Input validation (Zod)                                    │
│  - Admin authorization check                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE                                 │
│  - Auth: Google OAuth, Email OTP, Session                   │
│  - Database: PostgreSQL with RLS                            │
│  - Real-time (jika diaktifkan)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Autentikasi

### Flow Google OAuth

```
1. User klik "Continue with Google"
2. signInWithGoogle() → redirect ke Google
3. User login di Google
4. Google redirect ke /auth/callback?code=xxx
5. route.ts exchange code → session cookie
6. Redirect ke home page
```

### Flow Email OTP

```
1. User masukkan email → klik Login
2. signInWithOTP(email) → kirim OTP ke email
3. Email disimpan di HTTP-only cookie
4. Redirect ke /otp
5. User masukkan 6-digit OTP
6. verifyOTP(otp) → validasi via Supabase
7. Session cookie dibuat → redirect ke home
```

### Session Management

- Session disimpan di **HTTP-only cookies**
- Proxy refresh session setiap request
- Session expire mengikuti Supabase config (default 1 minggu)

### Konfigurasi Registrasi Email OTP

Registrasi user baru melalui email OTP dapat dikontrol di file `src/lib/actions/auth.ts`:

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: validationResult.data,
  options: {
    shouldCreateUser: true,  // true = user baru bisa register, false = hanya existing user
  },
});
```

| Nilai | Deskripsi |
|-------|-----------|
| `true` | User baru akan otomatis dibuat saat login dengan email yang belum terdaftar |
| `false` | Hanya user yang sudah ada di database yang bisa login via email OTP |

> **⚠️ Catatan Penting:** Pengaturan ini sering diubah. Pastikan nilainya sesuai kebutuhan:
> - **Development/Testing**: `true` (memudahkan testing)
> - **Production (terbatas)**: `false` (hanya user yang di-invite manual yang bisa akses)

---

## Milestones CRUD

### Server Actions (`src/lib/actions/milestones.ts`)

| Function | Access | Deskripsi |
|----------|--------|-----------|
| `getMilestones()` | All authenticated | Fetch semua milestones |
| `getMilestoneById(id)` | All authenticated | Fetch single milestone |
| `createMilestone(input)` | Admin only | Buat milestone baru |
| `updateMilestone(input)` | Admin only | Update milestone |
| `deleteMilestone(id)` | Admin only | Hapus milestone |
| `isAdmin()` | All authenticated | Check admin status |

### Input Validation

```typescript
// Create milestone schema
const createMilestoneSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  image_url: z.string().optional(), // S3 key, bukan URL
});
```

---

## Image Upload

### Arsitektur

Gambar di-upload ke **S3-compatible storage** (iDrive E2) dengan private bucket. Presigned URLs digunakan untuk akses gambar.

```
1. Admin upload gambar → Server validate (MIME + magic bytes)
2. Upload ke S3 → Return S3 key (milestones/xxx.jpg)
3. Key disimpan di database (field image_url)
4. Saat fetch data → Generate presigned URL (valid 1 jam)
5. Browser akses gambar via presigned URL
```

### Server Actions (`src/lib/actions/storage.ts`)

| Function | Akses | Deskripsi |
|----------|-------|-----------|
| `uploadMilestoneImage(formData)` | Admin only | Upload gambar ke S3 |
| `getPresignedImageUrl(key)` | All authenticated | Generate presigned URL |
| `deleteMilestoneImage(key)` | Admin only | Hapus gambar dari S3 |

### Validasi Keamanan

```typescript
// 1. MIME type validation
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// 2. File size limit
const MAX_FILE_SIZE = 1000 * 1024; // 1MB

// 3. Magic bytes validation (mencegah MIME spoofing)
const FILE_SIGNATURES = {
  "image/jpeg": { bytes: [0xff, 0xd8, 0xff] },
  "image/png": { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  "image/webp": { bytes: [0x52, 0x49, 0x46, 0x46] }, // + "WEBP" at offset 8
};
```

### Environment Variables

```env
# S3-Compatible Storage (Private Bucket)
S3_ENDPOINT=https://xxx.e2.idrivee2.com
S3_REGION=auto
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket
```

### Contoh Penggunaan

```typescript
// Server Component
import { getMilestones, isAdmin } from "@/lib/actions/milestones";

export default async function Page() {
  const [result, adminStatus] = await Promise.all([
    getMilestones(),
    isAdmin(),
  ]);
  
  if (!result.success) {
    return <p>Error loading milestones</p>;
  }
  
  return <MilestoneCardGrid milestones={result.data} isAdmin={adminStatus} />;
}
```

---

## Proteksi Route

### Konfigurasi (`src/proxy.ts`)

```typescript
const protectedRoutes = [
  "/",           // Home
  "/account",    // Account page
  "/form",       // Form admin (admin-only di page level)
  "/dashboard",  // Dashboard (jika ada)
  "/profile",
  "/settings",
];

const authRoutes = ["/login", "/otp"];
```

### Behavior

| Kondisi | Hasil |
|---------|-------|
| Unauthenticated + Protected route | Redirect ke /login |
| Authenticated + Auth route | Redirect ke / |
| Authenticated + Protected route | Allow access |
| Non-admin + /form | Redirect ke / + Toast Error "Akses Ditolak" |

---

## Komponen

### LoginForm (`src/components/organism/login-form.tsx`)

Form login dengan:
- Google OAuth button
- Email input + OTP flow
- Error handling dari URL hash (Supabase OAuth errors)

### OTPForm (`src/components/organism/otp-form.tsx`)

Form verifikasi OTP dengan:
- 6-digit input
- Resend dengan cooldown 60 detik
- Email dari HTTP-only cookie (tidak dari URL)
- Email masking untuk keamanan

### MilestoneCardGrid (`src/components/molecules/milestone-card-grid.tsx`)

Grid kartu milestone dengan:
- Dialog detail on click dengan ScrollArea
- **Markdown rendering** untuk description menggunakan `react-markdown`
- Admin-only edit button
- Image fallback
- Responsive grid

### MilestoneForm (`src/components/organism/milestone-form.tsx`)

Form untuk menambah milestone (admin only) dengan:
- Input judul, deskripsi, tanggal, URL gambar
- Calendar popover (Shadcn Calendar)
- Validasi client-side
- Preview gambar
- Reset dan submit handling

### MilestoneEditForm (`src/components/organism/milestone-edit-form.tsx`)

Form untuk mengedit milestone (admin only) dengan:
- Pre-filled data dari server
- Fitur update data
- Fitur **Delete** dengan konfirmasi dialog modal
- Calendar popover & validasi

### ErrorNotification (`src/components/molecules/error-notification.tsx`)

Komponen client-side untuk menampilkan feedback:
- Mendeteksi query param `?error=unauthorized`
- Menampilkan toast notification menggunakan **Sonner**
- Auto-clean URL param setelah notifikasi muncul

### Loading UI (`src/app/loading.tsx`)

Menggunakan native Next.js Loading UI untuk pengalaman pengguna yang lebih baik:
- Otomatis aktif saat navigasi antar route
- Menampilkan spinner animasi di tengah layar
- Menggantikan konten lama secara instan saat memuat konten baru (React Suspense)

### Not Found Page (`src/app/not-found.tsx`)

Halaman 404 kustom dengan:
- Desain konsisten dengan tema aplikasi
- Tombol kembali ke beranda

### ImageUpload (`src/components/molecules/image-upload.tsx`)

Komponen reusable untuk upload gambar dengan:
- Drag and drop support
- Validasi file size (max 1MB)
- Validasi MIME type (JPEG, PNG, WebP)
- Preview gambar
- Link ke compressjpeg.com untuk file terlalu besar

### ModeToggle (`src/components/molecules/mode-toggle.tsx`)

Toggle untuk switch dark/light mode:
- Dropdown menu dengan opsi Light, Dark, System
- Integrasi dengan next-themes

---

## Debugging

### Common Issues

#### 1. "Supabase environment variables not set"

**Penyebab:** `.env.local` tidak ada atau tidak terisi

**Solusi:**
```bash
cp .env.example .env.local
# Edit dan isi dengan kredensial Supabase
```

#### 2. "signups not allowed" / "Pendaftaran tidak dibuka"

**Penyebab:** User baru mencoba login tapi signup disabled

**Solusi:**
- Buka Supabase Dashboard → Authentication → Users
- Invite user secara manual, atau
- Enable signup di Authentication → Settings

#### 3. OAuth redirect error

**Penyebab:** Redirect URL tidak terdaftar di Supabase

**Solusi:**
- Buka Authentication → URL Configuration
- Tambahkan redirect URL: `http://localhost:3000/auth/callback`

#### 4. Avatar Google tidak muncul

**Penyebab:** Domain tidak di-allow di next.config.ts

**Solusi:**
Pastikan `next.config.ts` berisi:
```typescript
images: {
  remotePatterns: [
    { hostname: "lh3.googleusercontent.com" },
  ],
}
```

#### 5. OTP session expired

**Penyebab:** Cookie `otp_session` expired (10 menit)

**Solusi:** Kembali ke login dan request OTP baru

---

### Debug Tools

#### 1. Check Session di Server Action

```typescript
export async function debugSession() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log("User:", user);
  console.log("Error:", error);
  return { user, error };
}
```

#### 2. Check Admin Status

```typescript
import { isAdmin } from "@/lib/actions/milestones";

// Di server component
const adminStatus = await isAdmin();
console.log("Is Admin:", adminStatus);
```

#### 3. Check RLS Policies di Supabase

```sql
-- Lihat semua policies
SELECT * FROM pg_policies WHERE tablename = 'milestones';

-- Test query sebagai user tertentu
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM milestones;
```

#### 4. Browser DevTools

- **Network tab:** Lihat response dari Server Actions
- **Application tab → Cookies:** Lihat session cookies
- **Console:** Error messages

---

## Deployment

### Vercel (Recommended)

```bash
# 1. Install Vercel CLI
pnpm i -g vercel

# 2. Deploy
vercel

# 3. Set environment variables di Vercel Dashboard
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Environment Variables

| Variable | Deskripsi | Required |
|----------|-----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase | ✅ |
| `NEXT_PUBLIC_SITE_URL` | URL production site | Optional |

---

## Keamanan

### Implementasi Saat Ini

| Feature | Status | Detail |
|---------|--------|--------|
| HTTP-only cookies | ✅ | Session tidak akses JavaScript |
| PKCE OAuth flow | ✅ | Supabase default |
| Row Level Security | ✅ | Database-level protection |
| Input validation | ✅ | Zod schemas |
| Admin authorization | ✅ | Double check (app + RLS) |
| Email masking | ✅ | OTP form shows ```ab***@gmail.com``` |
| CSRF protection | ✅ | Next.js Server Actions + SameSite |

### Best Practices

1. **Jangan expose** database credentials di client
2. **Selalu validasi** input dengan Zod
3. **Check admin** status di setiap write operation
4. **Jangan log** sensitive data di production
5. **Update** dependencies secara berkala

---

## Kontributor

- Developer: Iyan Sanjaya

---

*Dokumentasi terakhir diperbarui: 20 Januari 2026*
