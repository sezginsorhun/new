/**
 * ROLLER VE YETKİLER
 *
 * Tek bir "yönetici" rolü yerine, yapılan işe göre ayrılmış roller var.
 * Amaç: ürün girişi yapan kişinin sipariş tutarlarını, müşteri adreslerini
 * veya güvenlik kayıtlarını görmesine gerek yoktur. Herkese her şeyi açmak
 * kolaydır ama bir hesabın ele geçirilmesi hâlinde kaybı büyütür.
 *
 * TASARIM: rol → sayfa eşlemesi YAPILMADI. Roller YETKİLERE sahiptir,
 * sayfalar ve işlemler yetki ister. Yeni bir ekran eklendiğinde tek yapılacak
 * iş hangi yetkiyi istediğini yazmaktır; rol tanımlarına dokunmak gerekmez.
 *
 * KATMANLI KORUMA — yetki üç yerde birden kontrol edilir:
 *   1) Menü: yetkisi olmayan bağlantıyı görmez (kolaylık, güvenlik değil).
 *   2) Sayfa: requirePermission() veritabanındaki role bakar.
 *   3) Sunucu eylemi: aynı kontrol tekrar yapılır.
 * Menüyü gizlemek güvenlik DEĞİLDİR; adres elle yazılabilir. Asıl karar
 * 2 ve 3'te verilir, 1 yalnızca kullanıcıyı yormamak içindir.
 */

/* ------------------------------- ROLLER --------------------------------- */

export const ROLE_VALUES = [
  "CUSTOMER",
  "CATALOG",
  "ORDERS",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export type Role = (typeof ROLE_VALUES)[number];

/** Panele girebilen roller (müşteri hariç hepsi). */
export const STAFF_ROLES: Role[] = ["CATALOG", "ORDERS", "ADMIN", "SUPER_ADMIN"];

export function isStaffRole(role: string): role is Role {
  return (STAFF_ROLES as string[]).includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: "Müşteri",
  CATALOG: "Ürün sorumlusu",
  ORDERS: "Sipariş sorumlusu",
  ADMIN: "Yönetici",
  SUPER_ADMIN: "Süper yönetici",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  CUSTOMER: "Yalnızca vitrin. Panele giremez.",
  CATALOG:
    "Ürün, kategori, stok, medya ve ana sayfa düzeni. Siparişleri, müşteri bilgilerini ve ayarları göremez.",
  ORDERS:
    "Siparişler, müşteriler, mesajlar ve yorumlar. Ürün ve ayarlara dokunamaz.",
  ADMIN:
    "Kataloğun ve siparişlerin tamamı, ayarlar ve kuponlar. Kullanıcı/rol yönetimi ve güvenlik kayıtları hariç.",
  SUPER_ADMIN:
    "Her şey: kullanıcı ve rol yönetimi, güvenlik kayıtları dâhil. Site sahibinin rolü.",
};

/* ------------------------------ YETKİLER -------------------------------- */

export const PERMISSIONS = [
  "dashboard.view",     // panel özeti
  "orders.view",        // siparişleri görme
  "orders.manage",      // durum, kargo, iade
  "customers.view",     // müşteri listesi
  "customers.manage",   // müşteri hesabı açma/kapatma
  "products.manage",    // ürün ekleme/düzenleme
  "categories.manage",  // kategoriler
  "stock.manage",       // stok güncelleme
  "reviews.moderate",   // yorum onayı
  "content.manage",     // ana sayfa, carousel, medya, sayfalar
  "coupons.manage",     // kuponlar
  "messages.manage",    // iletişim mesajları
  "settings.manage",    // site ayarları
  "users.manage",       // kullanıcı ve rol yönetimi
  "security.view",      // denetim kaydı, oturumlar
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "dashboard.view": "Panel özeti",
  "orders.view": "Siparişleri görme",
  "orders.manage": "Sipariş yönetimi",
  "customers.view": "Müşterileri görme",
  "customers.manage": "Müşteri hesabı yönetimi",
  "products.manage": "Ürün yönetimi",
  "categories.manage": "Kategori yönetimi",
  "stock.manage": "Stok yönetimi",
  "reviews.moderate": "Yorum onaylama",
  "content.manage": "İçerik ve görünüm",
  "coupons.manage": "Kupon yönetimi",
  "messages.manage": "Mesajlar",
  "settings.manage": "Site ayarları",
  "users.manage": "Kullanıcı ve rol yönetimi",
  "security.view": "Güvenlik kayıtları",
};

/* --------------------------- ROL → YETKİ ------------------------------- */

const CATALOG_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "products.manage",
  "categories.manage",
  "stock.manage",
  "content.manage",
];

const ORDERS_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "orders.view",
  "orders.manage",
  "customers.view",
  "messages.manage",
  "reviews.moderate",
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...new Set([
    ...CATALOG_PERMISSIONS,
    ...ORDERS_PERMISSIONS,
    "customers.manage",
    "coupons.manage",
    "settings.manage",
  ] as Permission[]),
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CUSTOMER: [],
  CATALOG: CATALOG_PERMISSIONS,
  ORDERS: ORDERS_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  // Süper yönetici listeyle sınırlı değil: yeni bir yetki eklendiğinde
  // otomatik olarak ona da gelir. Aksi hâlde yetki eklemeyi unuttuğumuzda
  // site sahibi kendi sitesinde kilitli kalırdı.
  SUPER_ADMIN: [...PERMISSIONS],
};

/* ------------------------------ SORGULAR -------------------------------- */

export function can(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const list = ROLE_PERMISSIONS[role as Role];
  return Array.isArray(list) && list.includes(permission);
}

/** Bu rol panelde en az bir şey yapabiliyor mu? */
export function canEnterPanel(role: string | null | undefined): boolean {
  if (!role) return false;
  const list = ROLE_PERMISSIONS[role as Role];
  return Array.isArray(list) && list.length > 0;
}

export function permissionsOf(role: string | null | undefined): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role as Role] ?? [];
}
