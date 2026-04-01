ALTER TABLE `rooms` ADD `waterBillingType` enum('per_unit','flat_rate') DEFAULT 'per_unit' NOT NULL;--> statement-breakpoint
ALTER TABLE `rooms` ADD `waterFlatRate` decimal(10,2) DEFAULT '0';