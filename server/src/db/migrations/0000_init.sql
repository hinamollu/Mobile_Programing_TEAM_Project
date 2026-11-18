CREATE TABLE `furniture` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`width` integer NOT NULL,
	`length` integer NOT NULL,
	`height` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `furniture_owner_id_idx` ON `furniture` (`owner_id`);--> statement-breakpoint
CREATE TABLE `layouts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `layouts_project_id_idx` ON `layouts` (`project_id`);--> statement-breakpoint
CREATE TABLE `placements` (
	`id` text PRIMARY KEY NOT NULL,
	`layout_id` text NOT NULL,
	`furniture_id` text,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`width` integer NOT NULL,
	`length` integer NOT NULL,
	`height` integer NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`rotation` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`layout_id`) REFERENCES `layouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`furniture_id`) REFERENCES `furniture`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "placements_rotation_check" CHECK("placements"."rotation" IN (0, 90, 180, 270))
);
--> statement-breakpoint
CREATE INDEX `placements_layout_id_idx` ON `placements` (`layout_id`);--> statement-breakpoint
CREATE INDEX `placements_furniture_id_idx` ON `placements` (`furniture_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `projects_owner_id_idx` ON `projects` (`owner_id`);--> statement-breakpoint
CREATE TABLE `room_openings` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`kind` text NOT NULL,
	`wall` text NOT NULL,
	`offset` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer,
	`sill_height` integer,
	`hinge` text,
	`swing` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "room_openings_kind_check" CHECK("room_openings"."kind" IN ('door', 'window', 'outlet')),
	CONSTRAINT "room_openings_wall_check" CHECK("room_openings"."wall" IN ('n', 'e', 's', 'w')),
	CONSTRAINT "room_openings_hinge_check" CHECK("room_openings"."hinge" IN ('left', 'right')),
	CONSTRAINT "room_openings_swing_check" CHECK("room_openings"."swing" IN ('in', 'out'))
);
--> statement-breakpoint
CREATE INDEX `room_openings_room_id_idx` ON `room_openings` (`room_id`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`project_id` text,
	`name` text NOT NULL,
	`width` integer NOT NULL,
	`length` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `rooms_owner_id_idx` ON `rooms` (`owner_id`);--> statement-breakpoint
CREATE INDEX `rooms_project_id_idx` ON `rooms` (`project_id`);--> statement-breakpoint
CREATE TABLE `friendships` (
	`requester_id` text NOT NULL,
	`addressee_id` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`requester_id`, `addressee_id`),
	FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`addressee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "friendships_status_check" CHECK("friendships"."status" IN ('pending', 'accepted')),
	CONSTRAINT "friendships_not_self_check" CHECK("friendships"."requester_id" <> "friendships"."addressee_id")
);
--> statement-breakpoint
CREATE INDEX `friendships_addressee_id_idx` ON `friendships` (`addressee_id`);--> statement-breakpoint
CREATE TABLE `project_members` (
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`invited_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`project_id`, `user_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "project_members_role_check" CHECK("project_members"."role" IN ('owner', 'editor')),
	CONSTRAINT "project_members_status_check" CHECK("project_members"."status" IN ('invited', 'active'))
);
--> statement-breakpoint
CREATE INDEX `project_members_user_id_idx` ON `project_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);