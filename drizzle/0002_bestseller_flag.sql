-- ÇOK SATAN İŞARETİ
--
-- Ana sayfadaki "Çok satanlar" bölümü yalnızca satış adedine (sold_count)
-- bakıyordu. Yeni açılan bir mağazada bu sayı herkeste sıfırdır, dolayısıyla
-- bölüm rastgele görünür. Bu bayrak, hangi ürünlerin öne çıkacağına ELLE
-- karar vermeyi sağlar; işaretli ürünler listenin başında gelir, kalan yerler
-- gerçek satış adedine göre dolar.
ALTER TABLE `products` ADD `is_bestseller` boolean NOT NULL DEFAULT false;
