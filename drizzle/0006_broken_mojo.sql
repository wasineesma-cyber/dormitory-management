CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`houseId` int NOT NULL,
	`tenantId` int,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('bill','parcel','general') NOT NULL DEFAULT 'general',
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `houses` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `houses` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `houses` ADD `subscriptionStatus` varchar(50);--> statement-breakpoint
ALTER TABLE `houses` ADD `planType` enum('free','premium') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `houses` ADD `trialEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `hasCompletedOnboarding` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_houseId_houses_id_fk` FOREIGN KEY (`houseId`) REFERENCES `houses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;