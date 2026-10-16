CREATE TABLE `github_repos` (
	`repo` text PRIMARY KEY NOT NULL,
	`data` text,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`reset_at` integer NOT NULL
);
