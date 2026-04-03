CREATE TABLE `maintenance_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`houseId` int NOT NULL,
	`tenantId` int NOT NULL,
	`roomId` int NOT NULL,
	`issueType` varchar(100),
	`description` text NOT NULL,
	`status` enum('pending','in_progress','resolved','cancelled') NOT NULL DEFAULT 'pending',
	`imageUrl` text,
	`reportedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`adminNotes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `maintenance_requests` ADD CONSTRAINT `maintenance_requests_houseId_houses_id_fk` FOREIGN KEY (`houseId`) REFERENCES `houses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_requests` ADD CONSTRAINT `maintenance_requests_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_requests` ADD CONSTRAINT `maintenance_requests_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;