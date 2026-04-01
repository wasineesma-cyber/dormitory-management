CREATE TABLE `bill_edit_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`billId` int NOT NULL,
	`editedBy` int,
	`editedByName` varchar(100),
	`fieldChanged` varchar(100),
	`oldValue` text,
	`newValue` text,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bill_edit_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bill_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`billId` int NOT NULL,
	`description` varchar(200) NOT NULL,
	`quantity` decimal(10,2) DEFAULT '1',
	`unitPrice` decimal(10,2) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`itemType` enum('rent','water','electricity','service','penalty','discount','other') DEFAULT 'other',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bill_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`billNumber` varchar(30) NOT NULL,
	`roomId` int NOT NULL,
	`tenantId` int,
	`billingPeriod` varchar(7),
	`checkInDate` date,
	`checkOutDate` date,
	`numberOfNights` int,
	`rentAmount` decimal(10,2) DEFAULT '0',
	`waterAmount` decimal(10,2) DEFAULT '0',
	`electricityAmount` decimal(10,2) DEFAULT '0',
	`otherCharges` decimal(10,2) DEFAULT '0',
	`discount` decimal(10,2) DEFAULT '0',
	`penalty` decimal(10,2) DEFAULT '0',
	`totalAmount` decimal(10,2) NOT NULL,
	`paidAmount` decimal(10,2) DEFAULT '0',
	`dueDate` date,
	`status` enum('unpaid','paid','partial','pending_verification','overdue') NOT NULL DEFAULT 'unpaid',
	`promptPayId` varchar(50),
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bills_id` PRIMARY KEY(`id`),
	CONSTRAINT `bills_billNumber_unique` UNIQUE(`billNumber`)
);
--> statement-breakpoint
CREATE TABLE `meter_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`tenantId` int,
	`type` enum('water','electricity') NOT NULL,
	`previousReading` decimal(10,2) NOT NULL,
	`currentReading` decimal(10,2) NOT NULL,
	`unitsUsed` decimal(10,2) NOT NULL,
	`readingDate` date NOT NULL,
	`billingPeriod` varchar(7),
	`imageUrl` text,
	`ocrRawValue` varchar(50),
	`notes` text,
	`recordedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meter_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`billId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentDate` timestamp NOT NULL DEFAULT (now()),
	`paymentMethod` enum('cash','transfer','qr','other') DEFAULT 'cash',
	`referenceNumber` varchar(100),
	`notes` text,
	`recordedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomNumber` varchar(20) NOT NULL,
	`floor` varchar(10),
	`building` varchar(100),
	`type` enum('daily','monthly') NOT NULL DEFAULT 'monthly',
	`status` enum('vacant','occupied','reserved','maintenance') NOT NULL DEFAULT 'vacant',
	`pricePerMonth` decimal(10,2),
	`pricePerDay` decimal(10,2),
	`waterRatePerUnit` decimal(10,2) DEFAULT '0',
	`electricityRatePerUnit` decimal(10,2) DEFAULT '0',
	`depositAmount` decimal(10,2) DEFAULT '0',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`roomId` int,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`phone` varchar(20),
	`email` varchar(320),
	`idCardNumber` varchar(20),
	`passportNumber` varchar(30),
	`checkInDate` date,
	`checkOutDate` date,
	`contractStartDate` date,
	`contractEndDate` date,
	`depositPaid` decimal(10,2) DEFAULT '0',
	`depositStatus` enum('pending','paid','refunded') DEFAULT 'pending',
	`status` enum('active','inactive','checked_out') NOT NULL DEFAULT 'active',
	`notes` text,
	`emergencyContact` varchar(100),
	`emergencyPhone` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bill_edit_history` ADD CONSTRAINT `bill_edit_history_billId_bills_id_fk` FOREIGN KEY (`billId`) REFERENCES `bills`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bill_edit_history` ADD CONSTRAINT `bill_edit_history_editedBy_users_id_fk` FOREIGN KEY (`editedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bill_items` ADD CONSTRAINT `bill_items_billId_bills_id_fk` FOREIGN KEY (`billId`) REFERENCES `bills`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bills` ADD CONSTRAINT `bills_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bills` ADD CONSTRAINT `bills_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bills` ADD CONSTRAINT `bills_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meter_readings` ADD CONSTRAINT `meter_readings_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meter_readings` ADD CONSTRAINT `meter_readings_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meter_readings` ADD CONSTRAINT `meter_readings_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_billId_bills_id_fk` FOREIGN KEY (`billId`) REFERENCES `bills`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;