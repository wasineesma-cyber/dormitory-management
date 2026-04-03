CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`houseId` int NOT NULL,
	`tenantId` int NOT NULL,
	`roomId` int NOT NULL,
	`status` enum('draft','signed','terminated') NOT NULL DEFAULT 'draft',
	`signatureUrl` text,
	`signedAt` timestamp,
	`termsData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bills` ADD `pendingSlipUrl` text;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_houseId_houses_id_fk` FOREIGN KEY (`houseId`) REFERENCES `houses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;