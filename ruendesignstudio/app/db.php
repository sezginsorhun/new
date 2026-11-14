<?php
/**
 * SQLite veritabanı. Tek dosya (data/site.sqlite); ayrı bir MySQL kurulumu
 * gerektirmez, yedeği dosyayı indirmekten ibarettir.
 *
 * Şema sürümleri PRAGMA user_version ile izlenir:
 *   1 — ilk sürüm (kullanıcılar, ayarlar, mesajlar, medya + eski içerik)
 *   2 — yeni site yapısı: proje kategorileri, koleksiyonlar, ürünler,
 *       günce, showroomlar, sayfalar, bülten
 */
declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('sqlite:' . DATA . '/site.sqlite');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA busy_timeout = 5000');
    }
    return $pdo;
}

function q(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

function row(string $sql, array $params = []): ?array
{
    $r = q($sql, $params)->fetch();
    return $r === false ? null : $r;
}

function rows(string $sql, array $params = []): array
{
    return q($sql, $params)->fetchAll();
}

function val(string $sql, array $params = [])
{
    $v = q($sql, $params)->fetchColumn();
    return $v === false ? null : $v;
}

function db_migrate(): void
{
    $version = (int) db()->query('PRAGMA user_version')->fetchColumn();
    if ($version >= 2) return;

    // Kalıcı tablolar (her sürümde korunur)
    db()->exec(<<<SQL
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL DEFAULT '',
        password_hash TEXT NOT NULL,
        last_login_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', success INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_login_ip ON login_attempts(ip, created_at);
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
        subject TEXT NOT NULL DEFAULT '', body TEXT NOT NULL, ip TEXT NOT NULL DEFAULT '',
        is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE, original_name TEXT NOT NULL DEFAULT '',
        width INTEGER NOT NULL DEFAULT 0, height INTEGER NOT NULL DEFAULT 0, size INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    SQL);

    $cols = array_column(rows('PRAGMA table_info(messages)'), 'name');
    if (!in_array('type', $cols, true)) db()->exec("ALTER TABLE messages ADD COLUMN type TEXT NOT NULL DEFAULT 'iletisim'");
    if (!in_array('meta', $cols, true)) db()->exec("ALTER TABLE messages ADD COLUMN meta TEXT NOT NULL DEFAULT ''");

    // v1 içerik tabloları yeni yapıyla değişir. Tamamı tek işlemde: yarıda
    // kesilirse hiçbir değişiklik kalıcı olmaz ve sonraki istekte yeniden denenir.
    db()->beginTransaction();
    db()->exec(<<<SQL
    DROP TABLE IF EXISTS project_images;
    DROP TABLE IF EXISTS projects;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS slides;
    DROP TABLE IF EXISTS press;
    DROP TABLE IF EXISTS pages;

    CREATE TABLE newsletter (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE, ip TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE project_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
        intro TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '',
        sort INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER REFERENCES project_categories(id) ON DELETE SET NULL,
        title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
        location TEXT NOT NULL DEFAULT '', intro TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '',
        quote TEXT NOT NULL DEFAULT '', quote_author TEXT NOT NULL DEFAULT '',
        cover TEXT NOT NULL DEFAULT '', published INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0,
        seo_title TEXT NOT NULL DEFAULT '', seo_description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner TEXT NOT NULL, owner_id INTEGER NOT NULL,
        path TEXT NOT NULL, caption TEXT NOT NULL DEFAULT '', sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX idx_gallery_owner ON gallery(owner, owner_id, sort);
    CREATE TABLE collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, label TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '',
        sort INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE product_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section TEXT NOT NULL DEFAULT 'mobilya', group_name TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
        intro TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '',
        sort INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type_id INTEGER REFERENCES product_types(id) ON DELETE SET NULL,
        collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
        name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, price TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '', dimensions TEXT NOT NULL DEFAULT '', finishes TEXT NOT NULL DEFAULT '',
        craft TEXT NOT NULL DEFAULT '', making TEXT NOT NULL DEFAULT '',
        cover TEXT NOT NULL DEFAULT '', published INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE chronicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, label TEXT NOT NULL DEFAULT '',
        excerpt TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '',
        wide INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE showrooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, short TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', hours TEXT NOT NULL DEFAULT '',
        intro TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '',
        sort INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        place TEXT NOT NULL DEFAULT 'evren', image TEXT NOT NULL, title TEXT NOT NULL DEFAULT '',
        link TEXT NOT NULL DEFAULT '', sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE pages (
        slug TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    SQL);

    try {
        require_once APP . '/seed.php';
        seed_database();
        db()->exec('PRAGMA user_version = 2');
        db()->commit();
    } catch (Throwable $e) {
        if (db()->inTransaction()) db()->rollBack();
        throw $e;
    }
}
