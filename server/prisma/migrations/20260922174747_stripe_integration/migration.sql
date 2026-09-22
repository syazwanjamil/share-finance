-- AlterTable
ALTER TABLE `payments` ADD COLUMN `gateway_failure_reason` VARCHAR(191) NULL,
    ADD COLUMN `gateway_payment_intent_id` VARCHAR(191) NULL,
    ADD COLUMN `gateway_provider` VARCHAR(191) NULL,
    ADD COLUMN `gateway_session_id` VARCHAR(191) NULL,
    MODIFY `method` ENUM('fpx', 'ewallet', 'qr', 'card') NULL;

-- AlterTable
ALTER TABLE `rounds` ADD COLUMN `gateway_transfer_id` VARCHAR(191) NULL,
    ADD COLUMN `payout_failure_reason` VARCHAR(191) NULL,
    MODIFY `status` ENUM('upcoming', 'current', 'held', 'payout_pending', 'paid_out') NOT NULL DEFAULT 'upcoming';

-- AlterTable
ALTER TABLE `users` ADD COLUMN `stripe_connect_account_id` VARCHAR(191) NULL,
    ADD COLUMN `stripe_connect_details_submitted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `stripe_connect_onboarded` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `stripe_connect_payouts_enabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `stripe_connect_updated_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `payment_gateway_events` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `event_type` VARCHAR(191) NOT NULL,
    `status` ENUM('received', 'processed', 'ignored', 'failed') NOT NULL DEFAULT 'received',
    `payload` JSON NOT NULL,
    `error_message` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,

    UNIQUE INDEX `payment_gateway_events_event_id_key`(`event_id`),
    INDEX `payment_gateway_events_provider_event_type_created_at_idx`(`provider`, `event_type`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `payments_gateway_session_id_key` ON `payments`(`gateway_session_id`);

-- CreateIndex
CREATE UNIQUE INDEX `users_stripe_connect_account_id_key` ON `users`(`stripe_connect_account_id`);

