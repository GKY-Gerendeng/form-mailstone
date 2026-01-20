# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Rate limiting untuk upload
- Image compression otomatis

---

## [1.0.0] - 2026-01-20

### Added
- 🔐 **Autentikasi**
  - Login via Google OAuth
  - Login via Email OTP
  - Session management dengan HTTP-only cookies
  - Konfigurasi `shouldCreateUser` untuk kontrol registrasi

- 📝 **Milestone Management**
  - Create, Read, Update, Delete milestones
  - Admin-only access untuk operasi write
  - Validasi input dengan Zod schema

- 📷 **Image Upload**
  - Upload gambar ke S3-compatible storage (iDrive E2)
  - Private bucket dengan presigned URLs
  - Validasi file size (max 1MB)
  - Validasi MIME type (JPEG, PNG, WebP)
  - Magic bytes validation (mencegah MIME spoofing)
  - Link ke compressjpeg.com untuk file terlalu besar

- 📅 **Calendar Picker**
  - Dropdown bulan dan tahun
  - Range 100 tahun ke belakang, 50 tahun ke depan
  - Format tanggal Indonesia

- 🎨 **UI/UX**
  - Dark mode support
  - Responsive design
  - Toast notifications (Sonner)
  - Loading states dan error handling

- 🔒 **Keamanan**
  - Row Level Security (RLS) di Supabase
  - Admin-only routes
  - Protected routes dengan proxy middleware
  - Magic bytes validation untuk upload

- 📖 **Dokumentasi**
  - README.md dengan setup guide
  - DOKUMENTASI.md lengkap
  - CONTRIBUTING.md untuk kontributor
  - CODE_OF_CONDUCT.md
  - Issue dan PR templates

### Security
- Validasi magic bytes untuk mencegah file upload attacks
- Presigned URLs dengan expiry 1 jam
- Error logging yang aman (tidak expose details di production)

---

## Template untuk Rilis Berikutnya

<!--
## [X.Y.Z] - YYYY-MM-DD

### Added
- Fitur baru

### Changed
- Perubahan pada fitur existing

### Deprecated
- Fitur yang akan dihapus di versi mendatang

### Removed
- Fitur yang dihapus

### Fixed
- Bug fixes

### Security
- Perbaikan keamanan
-->

---

## Panduan Versioning

| Tipe Perubahan | Contoh | Versi |
|----------------|--------|-------|
| Bug fix, patch | Fix typo, small fix | 1.0.0 → 1.0.**1** |
| Fitur baru (backward compatible) | Add dark mode | 1.0.0 → 1.**1**.0 |
| Breaking change | Ubah API, hapus fitur | 1.0.0 → **2**.0.0 |

---

[Unreleased]: https://github.com/GKY-Gerendeng/form-milestone/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/GKY-Gerendeng/form-milestone/releases/tag/v1.0.0
