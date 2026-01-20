# GKY Gerendeng Milestone

Aplikasi web internal untuk mencatat milestone/event khusus GKY Gerendeng.

---

## 📋 Fitur

- 🔐 **Autentikasi** - Login via Google OAuth atau Email OTP
- 📝 **Milestones** - Catatan event/aktivitas dengan gambar
- 📅 **Form Admin** - Halaman admin untuk menambah milestone dengan calendar picker
- 👤 **Admin Only** - Hanya admin yang bisa create/edit/delete
- 🔒 **Protected Routes** - Semua halaman memerlukan login

---

## 🛠️ Tech Stack

| Teknologi | Versi |
|-----------|-------|
| Next.js | 16.1.3 |
| React | 19.2.3 |
| TypeScript | 5.x |
| Supabase | 2.90.1 |
| Tailwind CSS | 4.x |
| Zod | 4.3.5 |
| Shadcn UI | - |
| date-fns | - |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Akun Supabase

### Instalasi

```bash
# Clone repository
git clone <repository-url>
cd form-mailstone

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local dengan kredensial Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Jalankan development server
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 📜 Scripts

| Script | Deskripsi |
|--------|-----------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

---

## 📁 Struktur Folder

```
src/
├── app/                    # Next.js App Router
│   ├── account/            # Halaman akun
│   ├── auth/callback/      # OAuth callback
│   ├── form/               # Halaman form admin (protected)
│   ├── login/              # Halaman login
│   ├── otp/                # Halaman OTP
│   └── page.tsx            # Home (milestones)
├── components/
│   ├── molecules/          # Komponen medium
│   ├── organism/           # Komponen besar (termasuk milestone-form)
│   └── shadcn/             # Shadcn UI (termasuk calendar)
├── lib/
│   ├── actions/            # Server Actions
│   ├── supabase/           # Supabase clients
│   ├── types/              # TypeScript types
│   └── validations/        # Zod schemas
└── proxy.ts                # Auth middleware
```

---

## 🔧 Konfigurasi Supabase

### 1. Buat Table

Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Table admins
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can check admin status" ON admins FOR SELECT TO authenticated USING (true);

-- Table milestones  
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

-- Policies
CREATE POLICY "Authenticated users can read milestones" ON milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert milestones" ON milestones FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can update milestones" ON milestones FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can delete milestones" ON milestones FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
```

### 2. Tambahkan Admin

```sql
INSERT INTO admins (user_id) VALUES ('YOUR_USER_ID');
```

### 3. Konfigurasi OAuth

- **Providers**: Enable Google di Authentication → Providers
- **Redirect URLs**: Tambahkan `http://localhost:3000/auth/callback`

### 4. Konfigurasi Registrasi Email OTP

> **⚠️ PENTING:** Untuk mengaktifkan/menonaktifkan registrasi user baru via email, ubah `shouldCreateUser` di `src/lib/actions/auth.ts`:

```typescript
// true = user baru bisa register, false = hanya existing user
shouldCreateUser: true,
```

---

## 📖 Dokumentasi Lengkap

Lihat [DOKUMENTASI.md](./DOKUMENTASI.md) untuk dokumentasi detail tentang:
- Arsitektur aplikasi
- Alur autentikasi
- Server Actions
- Form Admin & Calendar
- Debugging
- Deployment
- Keamanan

---

## 👨‍💻 Developer

Iyan Sanjaya

---

## 📄 License

Private - Internal use only

