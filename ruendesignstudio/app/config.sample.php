<?php
/**
 * Bu dosyayı app/config.php olarak kopyalayın ve değerleri doldurun.
 * config.php depoya eklenmez (.gitignore).
 */
return [
    // Yönetim paneli bu gizli adresten açılır: https://alanadi.com/<admin_path>/
    // Tahmin edilmesi zor bir son ek seçin, örn. yonetim-7f3a91
    'admin_path' => 'yonetim-DEGISTIR',

    // İlk açılışta oluşturulacak yönetici. Şifre DÜZ METİN DEĞİL, hash olarak yazılır:
    //   php -r "echo password_hash('Sifreniz', PASSWORD_DEFAULT), PHP_EOL;"
    // Panelde Hesabım ekranından sonradan değiştirilebilir.
    'admin_email' => 'info@ruendesignstudio.com',
    'admin_name' => 'Yönetici',
    'admin_password_hash' => '',

    // Oturum ve form imzaları için rastgele uzun bir metin (en az 32 karakter):
    //   php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
    'secret' => '',

    'base_url' => 'https://ruendesignstudio.com',
    'debug' => false,
];
