CREATE TABLE `houses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`code` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `houses_id` PRIMARY KEY(`id`),
	CONSTRAINT `houses_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`houseId` int NOT NULL,
	`tenantId` int,
	`roomId` int,
	`carrier` varchar(100),
	`trackingNumber` varchar(100),
	`itemName` varchar(200) NOT NULL,
	`recipientName` varchar(150),
	`status` enum('arrived','picked_up') NOT NULL DEFAULT 'arrived',
	`arrivedAt` timestamp NOT NULL DEFAULT (now()),
	`pickedUpAt` timestamp,
	`notes` text,
	`createdBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `settings` DROP INDEX `settings_settingKey_unique`;--> statement-breakpoint
ALTER TABLE `bills` ADD `houseId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `meter_readings` ADD `houseId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `rooms` ADD `houseId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `houseId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `houseId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `houseId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `authProvider` enum('oauth','local') DEFAULT 'oauth' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD CONSTRAINT `settings_house_setting_key_unique` UNIQUE(`houseId`,`settingKey`);--> statement-breakpoint
ALTER TABLE `packages` ADD CONSTRAINT `packages_houseId_houses_id_fk` FOREIGN KEY (`houseId`) REFERENCES `houses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `packages` ADD CONSTRAINT `packages_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `packages` ADD CONSTRAINT `packages_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `packages` ADD CONSTRAINT `packages_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bills` ADD CONSTRAINT `bills_houseId_houses_id_fk` FOREIGN KEY (`houseId`) REFERENCES `houses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meter_readings` ADD CONSTRAINT `meter_readings_houseId_houses_id_fk` FOREIGN KEY (`houseId`) REFERENCES `houses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_houseId_houses_id_fk` FOREIGN KEY (`houseId`) REFERENCES `houses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `settings` ADD CONSTRAINT `settings_houseId_houses_id_fk` FOREIGN KEY (`houseId`) REFERENCES `houses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_houseId_houses_id_fk` FOREIGN KEY (`houseId`) REFERENCES `houses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_houseId_houses_id_fk` FOREIGN KEY (`houseId`) REFERENCES `houses`(`id`) ON DELETE no action ON UPDATE no action;