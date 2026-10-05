CREATE TABLE `addresses` (
	`id` varchar(30) NOT NULL,
	`user_id` varchar(30) NOT NULL,
	`title` varchar(60) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`phone` varchar(25) NOT NULL,
	`city` varchar(60) NOT NULL,
	`district` varchar(60) NOT NULL,
	`line1` text NOT NULL,
	`zip_code` varchar(12),
	`is_corporate` boolean NOT NULL DEFAULT false,
	`company_name` varchar(200),
	`tax_office` varchar(120),
	`tax_number` varchar(30),
	`is_default` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(30),
	`actor_email` varchar(255),
	`action` varchar(80) NOT NULL,
	`entity` varchar(60),
	`entity_id` varchar(60),
	`summary` varchar(400),
	`meta` json,
	`ip` varchar(60),
	`user_agent` varchar(400),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `banners` (
	`id` varchar(30) NOT NULL,
	`eyebrow` varchar(80),
	`title` varchar(200),
	`subtitle` varchar(250),
	`image_url` text NOT NULL,
	`mobile_image_url` text,
	`image_alt` varchar(250),
	`link_url` text,
	`button_label` varchar(60),
	`secondary_label` varchar(60),
	`secondary_url` text,
	`align` varchar(10) NOT NULL DEFAULT 'left',
	`theme` varchar(10) NOT NULL DEFAULT 'light',
	`overlay` int NOT NULL DEFAULT 25,
	`position` varchar(40) NOT NULL DEFAULT 'home_hero',
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`starts_at` datetime,
	`ends_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brands` (
	`id` varchar(30) NOT NULL,
	`name` varchar(150) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`logo_url` text,
	CONSTRAINT `brands_id` PRIMARY KEY(`id`),
	CONSTRAINT `brands_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` varchar(30) NOT NULL,
	`cart_id` varchar(30) NOT NULL,
	`variant_id` varchar(30) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `cart_items_uq` UNIQUE(`cart_id`,`variant_id`)
);
--> statement-breakpoint
CREATE TABLE `carts` (
	`id` varchar(30) NOT NULL,
	`user_id` varchar(30),
	`token` varchar(60) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `carts_id` PRIMARY KEY(`id`),
	CONSTRAINT `carts_token_uq` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` varchar(30) NOT NULL,
	`name` varchar(150) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`description` text,
	`image_url` text,
	`parent_id` varchar(30),
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`show_in_menu` boolean NOT NULL DEFAULT true,
	`meta_title` varchar(200),
	`meta_description` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(25),
	`subject` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `counters` (
	`name` varchar(40) NOT NULL,
	`value` int NOT NULL DEFAULT 0,
	CONSTRAINT `counters_name` PRIMARY KEY(`name`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` varchar(30) NOT NULL,
	`code` varchar(40) NOT NULL,
	`type` enum('PERCENT','FIXED','FREE_SHIPPING') NOT NULL,
	`value` int NOT NULL,
	`min_order_total` int NOT NULL DEFAULT 0,
	`max_discount` int,
	`usage_limit` int,
	`used_count` int NOT NULL DEFAULT 0,
	`starts_at` datetime,
	`ends_at` datetime,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_uq` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`user_id` varchar(30) NOT NULL,
	`product_id` varchar(30) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `favorites_user_id_product_id_pk` PRIMARY KEY(`user_id`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `home_sections` (
	`id` varchar(30) NOT NULL,
	`type` varchar(40) NOT NULL,
	`title` varchar(200),
	`subtitle` varchar(250),
	`config` json,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `home_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifier` varchar(120) NOT NULL,
	`success` boolean NOT NULL DEFAULT false,
	`ip` varchar(60),
	`user_agent` varchar(400),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `login_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` varchar(30) NOT NULL,
	`url` text NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`size_bytes` int NOT NULL DEFAULT 0,
	`width` int,
	`height` int,
	`alt` varchar(250),
	`folder` varchar(60) NOT NULL DEFAULT 'genel',
	`uploaded_by` varchar(30),
	`storage` varchar(10) NOT NULL DEFAULT 'db',
	`data` longblob,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `media_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` varchar(30) NOT NULL,
	`order_id` varchar(30) NOT NULL,
	`variant_id` varchar(30),
	`product_slug` varchar(280),
	`product_name` varchar(250) NOT NULL,
	`variant_info` varchar(120) NOT NULL,
	`sku` varchar(80) NOT NULL,
	`image_url` text,
	`unit_price` int NOT NULL,
	`quantity` int NOT NULL,
	`tax_rate` int NOT NULL DEFAULT 10,
	`line_total` int NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(30) NOT NULL,
	`order_number` varchar(30) NOT NULL,
	`user_id` varchar(30),
	`email` varchar(255) NOT NULL,
	`phone` varchar(25) NOT NULL,
	`status` enum('PENDING','PAID','PREPARING','SHIPPED','DELIVERED','CANCELLED','REFUNDED','FAILED') NOT NULL DEFAULT 'PENDING',
	`payment_method` enum('CREDIT_CARD','BANK_TRANSFER','CASH_ON_DELIVERY') NOT NULL,
	`payment_status` enum('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
	`subtotal` int NOT NULL,
	`discount_total` int NOT NULL DEFAULT 0,
	`shipping_total` int NOT NULL DEFAULT 0,
	`grand_total` int NOT NULL,
	`coupon_code` varchar(40),
	`installment` int NOT NULL DEFAULT 1,
	`shipping_address` json NOT NULL,
	`billing_address` json NOT NULL,
	`shipping_company` varchar(80),
	`tracking_number` varchar(80),
	`shipped_at` datetime,
	`delivered_at` datetime,
	`customer_note` text,
	`admin_note` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_number_uq` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` varchar(30) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pages_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(30) NOT NULL,
	`order_id` varchar(30) NOT NULL,
	`provider` varchar(40) NOT NULL DEFAULT 'iyzico',
	`status` enum('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
	`amount` int NOT NULL,
	`conversation_id` varchar(60),
	`iyzico_payment_id` varchar(60),
	`iyzico_transaction_id` varchar(60),
	`installment` int NOT NULL DEFAULT 1,
	`card_family` varchar(40),
	`card_association` varchar(40),
	`last_four_digits` varchar(4),
	`bin_number` varchar(8),
	`error_code` varchar(40),
	`error_message` text,
	`raw_response` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`product_id` varchar(30) NOT NULL,
	`category_id` varchar(30) NOT NULL,
	CONSTRAINT `product_categories_product_id_category_id_pk` PRIMARY KEY(`product_id`,`category_id`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` varchar(30) NOT NULL,
	`product_id` varchar(30) NOT NULL,
	`url` text NOT NULL,
	`alt` varchar(250),
	`sort_order` int NOT NULL DEFAULT 0,
	`color_name` varchar(60),
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` varchar(30) NOT NULL,
	`product_id` varchar(30) NOT NULL,
	`sku` varchar(80) NOT NULL,
	`barcode` varchar(60),
	`size` varchar(30) NOT NULL,
	`color_name` varchar(60) NOT NULL,
	`color_hex` varchar(9) NOT NULL DEFAULT '#000000',
	`price_override` int,
	`stock` int NOT NULL DEFAULT 0,
	`low_stock_alert` int NOT NULL DEFAULT 3,
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `variants_sku_uq` UNIQUE(`sku`),
	CONSTRAINT `variants_combo_uq` UNIQUE(`product_id`,`size`,`color_name`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(30) NOT NULL,
	`name` varchar(250) NOT NULL,
	`slug` varchar(280) NOT NULL,
	`sku` varchar(60) NOT NULL,
	`description` text NOT NULL,
	`short_description` text,
	`price` int NOT NULL,
	`compare_at_price` int,
	`cost_price` int,
	`tax_rate` int NOT NULL DEFAULT 10,
	`brand_id` varchar(30),
	`is_active` boolean NOT NULL DEFAULT true,
	`is_featured` boolean NOT NULL DEFAULT false,
	`is_new` boolean NOT NULL DEFAULT false,
	`weight_gr` int,
	`material` varchar(250),
	`care_info` text,
	`model_info` text,
	`meta_title` varchar(200),
	`meta_description` text,
	`view_count` int NOT NULL DEFAULT 0,
	`sold_count` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_uq` UNIQUE(`slug`),
	CONSTRAINT `products_sku_uq` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` varchar(30) NOT NULL,
	`product_id` varchar(30) NOT NULL,
	`user_id` varchar(30) NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(200),
	`comment` text NOT NULL,
	`is_approved` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_product_user_uq` UNIQUE(`product_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(30) NOT NULL,
	`user_id` varchar(30) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`user_agent` varchar(400),
	`ip` varchar(60),
	`two_factor_at` datetime,
	`last_seen_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`expires_at` datetime NOT NULL,
	`revoked_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(80) NOT NULL,
	`value` text NOT NULL,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`variant_id` varchar(30) NOT NULL,
	`type` enum('PURCHASE','SALE','RETURN','CANCEL','MANUAL') NOT NULL,
	`quantity` int NOT NULL,
	`note` text,
	`order_id` varchar(30),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trusted_devices` (
	`id` varchar(30) NOT NULL,
	`user_id` varchar(30) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`label` varchar(160),
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `trusted_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `trusted_devices_token_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `two_factor_codes` (
	`id` varchar(30) NOT NULL,
	`user_id` varchar(30) NOT NULL,
	`code_hash` text NOT NULL,
	`purpose` varchar(30) NOT NULL DEFAULT 'login',
	`attempts` int NOT NULL DEFAULT 0,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `two_factor_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_security` (
	`user_id` varchar(30) NOT NULL,
	`failed_count` int NOT NULL DEFAULT 0,
	`locked_until` datetime,
	`last_login_at` datetime,
	`last_login_ip` varchar(60),
	`password_changed_at` datetime,
	`two_factor_enabled` boolean NOT NULL DEFAULT false,
	`backup_codes` json,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_security_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(30) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` text,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`phone` varchar(25),
	`role` enum('CUSTOMER','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
	`is_active` boolean NOT NULL DEFAULT true,
	`accepts_marketing` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_cart_id_carts_id_fk` FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carts` ADD CONSTRAINT `carts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_brand_id_brands_id_fk` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trusted_devices` ADD CONSTRAINT `trusted_devices_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `two_factor_codes` ADD CONSTRAINT `two_factor_codes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_security` ADD CONSTRAINT `user_security_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `addresses_user_idx` ON `addresses` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_user_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `banners_position_idx` ON `banners` (`position`,`sort_order`);--> statement-breakpoint
CREATE INDEX `carts_user_idx` ON `carts` (`user_id`);--> statement-breakpoint
CREATE INDEX `categories_parent_idx` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE INDEX `home_sections_sort_idx` ON `home_sections` (`sort_order`);--> statement-breakpoint
CREATE INDEX `login_attempts_idx` ON `login_attempts` (`identifier`,`created_at`);--> statement-breakpoint
CREATE INDEX `media_folder_idx` ON `media_assets` (`folder`);--> statement-breakpoint
CREATE INDEX `media_created_idx` ON `media_assets` (`created_at`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_created_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`order_id`);--> statement-breakpoint
CREATE INDEX `payments_conversation_idx` ON `payments` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `product_images_product_idx` ON `product_images` (`product_id`);--> statement-breakpoint
CREATE INDEX `variants_product_idx` ON `product_variants` (`product_id`);--> statement-breakpoint
CREATE INDEX `products_active_idx` ON `products` (`is_active`);--> statement-breakpoint
CREATE INDEX `reviews_product_idx` ON `reviews` (`product_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `stock_movements_variant_idx` ON `stock_movements` (`variant_id`);--> statement-breakpoint
CREATE INDEX `trusted_devices_user_idx` ON `trusted_devices` (`user_id`);--> statement-breakpoint
CREATE INDEX `two_factor_user_idx` ON `two_factor_codes` (`user_id`,`created_at`);