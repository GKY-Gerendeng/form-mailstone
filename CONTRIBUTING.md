# Panduan Kontribusi

Terima kasih telah tertarik untuk berkontribusi pada proyek GKY Gerendeng Milestone! 🎉

## 📋 Daftar Isi

- [Code of Conduct](#code-of-conduct)
- [Cara Berkontribusi](#cara-berkontribusi)
- [Development Setup](#development-setup)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Commit Message Convention](#commit-message-convention)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

Proyek ini mengadopsi [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Dengan berpartisipasi, Anda diharapkan untuk mematuhi kode etik ini.

## Cara Berkontribusi

### 🐛 Melaporkan Bug

1. Cek [Issues](https://github.com/GKY-Gerendeng/form-milestone/issues) untuk memastikan bug belum dilaporkan
2. Buat issue baru dengan template "Bug Report"
3. Sertakan langkah-langkah untuk mereproduksi bug
4. Sertakan screenshot jika membantu

### 💡 Mengusulkan Fitur

1. Cek [Issues](https://github.com/GKY-Gerendeng/form-milestone/issues) untuk memastikan fitur belum diusulkan
2. Buat issue baru dengan template "Feature Request"
3. Jelaskan use case dan manfaat fitur tersebut

### 🔧 Mengirim Pull Request

1. Fork repository ini
2. Buat branch baru: `git checkout -b feature/nama-fitur`
3. Lakukan perubahan
4. Commit dengan pesan yang jelas
5. Push ke fork Anda: `git push origin feature/nama-fitur`
6. Buat Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm
- Akun Supabase (untuk development)

### Langkah Setup

```bash
# 1. Fork dan clone repository
git clone https://github.com/YOUR_USERNAME/form-milestone.git
cd form-milestone

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Edit .env.local dengan kredensial Anda
# (Lihat README.md untuk panduan setup Supabase)

# 5. Jalankan development server
pnpm dev
```

### Scripts

| Script | Deskripsi |
|--------|-----------|
| `pnpm dev` | Jalankan development server |
| `pnpm build` | Build untuk production |
| `pnpm lint` | Jalankan ESLint |
| `pnpm start` | Jalankan production server |

## Pull Request Guidelines

### Sebelum Submit PR

- [ ] Pastikan kode bisa di-build tanpa error: `pnpm build`
- [ ] Pastikan linter tidak ada error: `pnpm lint`
- [ ] Update dokumentasi jika diperlukan
- [ ] Tulis deskripsi yang jelas tentang perubahan

### Review Process

1. Maintainer akan review PR Anda
2. Mungkin ada request untuk perubahan
3. Setelah approved, PR akan di-merge

## Commit Message Convention

Kami menggunakan [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Deskripsi |
|------|-----------|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `docs` | Perubahan dokumentasi |
| `style` | Formatting, missing semicolons, dll |
| `refactor` | Refactoring kode |
| `perf` | Peningkatan performa |
| `test` | Menambah atau memperbaiki tests |
| `chore` | Maintenance tasks |

### Contoh

```
feat(auth): add Google OAuth login
fix(form): resolve date picker validation issue
docs(readme): update installation instructions
```

## Issue Guidelines

### Bug Report

Sertakan:
- Versi Node.js dan pnpm
- Browser dan versinya
- Langkah untuk mereproduksi
- Expected behavior vs actual behavior
- Screenshot/video jika membantu

### Feature Request

Sertakan:
- Use case yang jelas
- Manfaat untuk pengguna lain
- Mockup/wireframe jika ada

---

## ❓ Pertanyaan?

Jika ada pertanyaan, silakan buat issue dengan label `question` atau hubungi maintainer.

Terima kasih telah berkontribusi! 🙏
