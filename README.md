# 📋 GKY Gerendeng Milestone

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.90.1-3ECF8E?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Aplikasi web untuk mencatat milestone/event khusus dengan autentikasi dan manajemen admin. Dibangun dengan Next.js 16, Supabase, dan S3-compatible storage.

---

## ✨ Fitur

- 🔐 **Autentikasi** - Login via Google OAuth atau Email OTP
- 📝 **Milestones** - Catatan event/aktivitas dengan gambar
- 📷 **Image Upload** - Upload gambar ke S3-compatible storage (private bucket)
- 📅 **Calendar Picker** - Pilih tanggal dengan dropdown bulan/tahun
- 📄 **Markdown Support** - Deskripsi milestone mendukung format Markdown
- 👤 **Admin Only** - Hanya admin yang bisa create/edit/delete
- 🔒 **Protected Routes** - Semua halaman memerlukan login
- 🌙 **Dark Mode** - Support tema gelap

---

## 🛠️ Tech Stack

| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| [Next.js](https://nextjs.org/) | 16.1.3 | React framework dengan App Router |
| [React](https://react.dev/) | 19.2.3 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type-safe JavaScript |
| [Supabase](https://supabase.com/) | 2.90.1 | Auth + Database |
| [AWS SDK S3](https://aws.amazon.com/sdk-for-javascript/) | 3.x | S3-compatible storage |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Utility-first CSS |
| [Shadcn UI](https://ui.shadcn.com/) | - | Component library |
| [Zod](https://zod.dev/) | 4.3.5 | Schema validation |
| [React Markdown](https://github.com/remarkjs/react-markdown) | 10.x | Markdown renderer |
| [Tailwind Typography](https://tailwindcss.com/docs/typography-plugin) | 0.5.x | Prose styling |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) atau npm
- Akun [Supabase](https://supabase.com/) (gratis)
- S3-compatible storage (opsional, untuk image upload)

### Instalasi

```bash
# Clone repository
git clone https://github.com/GKY-Gerendeng/form-mailstone.git
cd form-mailstone

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local dengan kredensial Anda
# Lihat bagian Configuration di bawah

# Jalankan development server
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## ⚙️ Configuration

### Environment Variables

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Site URL (Required for production OAuth)
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# S3-Compatible Storage (Optional - for image upload)
S3_ENDPOINT=https://xxx.e2.idrivee2.com
S3_REGION=auto
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket
```

### Supabase Setup

1. **Buat project** di [supabase.com](https://supabase.com)
2. **Jalankan SQL** di SQL Editor:

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
CREATE POLICY "Authenticated users can read milestones" ON milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert milestones" ON milestones FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can update milestones" ON milestones FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can delete milestones" ON milestones FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
```

3. **Tambahkan admin:**
```sql
INSERT INTO admins (user_id) VALUES ('YOUR_USER_ID');
```

4. **Enable Google OAuth** di Authentication → Providers

---

## 📜 Scripts

| Script | Deskripsi |
|--------|-----------|
| `pnpm dev` | Development server (http://localhost:3000) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── account/            # Account page
│   ├── auth/callback/      # OAuth callback
│   ├── form/               # Admin form (protected)
│   │   └── [id]/           # Edit milestone
│   ├── login/              # Login page
│   └── otp/                # OTP verification
├── components/
│   ├── molecules/          # Medium components
│   ├── organism/           # Large components
│   └── shadcn/             # UI components
├── lib/
│   ├── actions/            # Server Actions
│   │   ├── auth.ts         # Authentication
│   │   ├── milestones.ts   # CRUD operations
│   │   └── storage.ts      # S3 upload/delete
│   ├── supabase/           # Supabase clients
│   └── types/              # TypeScript types
└── proxy.ts                # Auth middleware
```

---

## 🤝 Contributing

Kontribusi sangat diterima! Silakan baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan.

1. Fork repository ini
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'feat: Add AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

---

## 📖 Documentation

Lihat [DOKUMENTASI.md](DOKUMENTASI.md) untuk dokumentasi lengkap tentang:
- Arsitektur aplikasi
- Alur autentikasi
- Server Actions
- Image Upload ke S3
- Keamanan

---

## 👨‍💻 Author

**Iyan Sanjaya** - [@iyansanjaya](https://github.com/iyansanjaya)

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
