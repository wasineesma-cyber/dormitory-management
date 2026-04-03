ALTER TABLE `users` MODIFY COLUMN `role` enum('user','manager','admin','superadmin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `permissions` json;