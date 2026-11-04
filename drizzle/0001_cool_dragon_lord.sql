ALTER TABLE `users` MODIFY COLUMN `role` enum('CUSTOMER','CATALOG','ORDERS','ADMIN','SUPER_ADMIN') NOT NULL DEFAULT 'CUSTOMER';--> statement-breakpoint
-- Mevcut yöneticiler SÜPER YÖNETİCİ olur.
--
-- Neden: bu göçten önce "ADMIN" tek ve tam yetkili roldü. Yeni modelde
-- ADMIN, kullanıcı/rol yönetimi ve güvenlik kayıtlarını KAPSAMIYOR. Satır
-- olduğu gibi bırakılsaydı site sahibi kendi sitesinde kullanıcı yönetimine
-- erişemez hâle gelir ve geri dönüş yalnızca veritabanına elle müdahaleyle
-- mümkün olurdu. Bu yüzden mevcut yetki seviyesi korunuyor.
--
-- Rolü sonradan düşürmek panelden tek tıkla yapılabilir; yükseltmek ise
-- kilitlenmiş bir sistemde mümkün olmazdı. Güvenli yön budur.
UPDATE `users` SET `role` = 'SUPER_ADMIN' WHERE `role` = 'ADMIN';
