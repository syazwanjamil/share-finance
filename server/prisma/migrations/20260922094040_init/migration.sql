-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `initials` VARCHAR(191) NULL,
    `phone_verified` BOOLEAN NOT NULL DEFAULT false,
    `mykad_verified` BOOLEAN NOT NULL DEFAULT false,
    `mykad_verified_at` DATETIME(3) NULL,
    `bank_account_label` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_codes` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `code_hash` VARCHAR(191) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `max_attempts` INTEGER NOT NULL DEFAULT 5,
    `expires_at` DATETIME(3) NOT NULL,
    `consumed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `otp_codes_phone_consumed_at_idx`(`phone`, `consumed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `replaced_by_token_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_agent` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groups` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `contribution_amount` DECIMAL(10, 2) NOT NULL,
    `frequency` ENUM('weekly', 'monthly') NOT NULL,
    `total_slots` INTEGER NOT NULL,
    `total_rounds` INTEGER NOT NULL,
    `current_round` INTEGER NOT NULL DEFAULT 1,
    `trust_account_verified` BOOLEAN NOT NULL DEFAULT false,
    `organizer_id` VARCHAR(191) NOT NULL,
    `late_fee_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `late_fee_grace_days` INTEGER NOT NULL DEFAULT 3,
    `payout_order_method` ENUM('assigned', 'random', 'join_order') NOT NULL DEFAULT 'assigned',
    `invite_code` VARCHAR(191) NOT NULL,
    `started_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `groups_slug_key`(`slug`),
    UNIQUE INDEX `groups_invite_code_key`(`invite_code`),
    INDEX `groups_organizer_id_idx`(`organizer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `members` (
    `id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `role` ENUM('organizer', 'member') NOT NULL DEFAULT 'member',
    `status` ENUM('active', 'invited', 'empty') NOT NULL DEFAULT 'empty',
    `invited_phone` VARCHAR(191) NULL,
    `joined_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `members_group_id_idx`(`group_id`),
    INDEX `members_user_id_idx`(`user_id`),
    UNIQUE INDEX `members_group_id_user_id_key`(`group_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rounds` (
    `id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `round_number` INTEGER NOT NULL,
    `recipient_member_id` VARCHAR(191) NOT NULL,
    `scheduled_date` DATETIME(3) NOT NULL,
    `status` ENUM('upcoming', 'current', 'held', 'paid_out') NOT NULL DEFAULT 'upcoming',
    `auto_release` BOOLEAN NOT NULL DEFAULT true,
    `paid_out_at` DATETIME(3) NULL,
    `paid_out_ref` VARCHAR(191) NULL,
    `moved_up_from` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rounds_group_id_status_idx`(`group_id`, `status`),
    UNIQUE INDEX `rounds_group_id_round_number_key`(`group_id`, `round_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `priority_requests` (
    `id` VARCHAR(191) NOT NULL,
    `round_id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('pending', 'approved', 'declined') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    UNIQUE INDEX `priority_requests_round_id_key`(`round_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `round_id` VARCHAR(191) NOT NULL,
    `round_number` INTEGER NOT NULL,
    `status` ENUM('unpaid', 'paid', 'paid_late', 'failed') NOT NULL DEFAULT 'unpaid',
    `amount` DECIMAL(10, 2) NOT NULL,
    `late_fee_applied` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `method` ENUM('fpx', 'ewallet', 'qr') NULL,
    `ref` VARCHAR(191) NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_ref_key`(`ref`),
    INDEX `payments_group_id_round_number_idx`(`group_id`, `round_number`),
    UNIQUE INDEX `payments_member_id_round_number_key`(`member_id`, `round_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payout_order_change_logs` (
    `id` VARCHAR(191) NOT NULL,
    `batch_id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `round_id` VARCHAR(191) NOT NULL,
    `previous_recipient_member_id` VARCHAR(191) NOT NULL,
    `new_recipient_member_id` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `notify_channel` ENUM('whatsapp', 'in_app', 'sms') NOT NULL DEFAULT 'whatsapp',
    `require_confirm` BOOLEAN NOT NULL DEFAULT false,
    `changed_by_user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payout_order_change_logs_group_id_batch_id_idx`(`group_id`, `batch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `autopay_settings` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `autopay_settings_user_id_group_id_key`(`user_id`, `group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payout_holds` (
    `id` VARCHAR(191) NOT NULL,
    `round_id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `placed_by_user_id` VARCHAR(191) NOT NULL,
    `released_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payout_holds_round_id_released_at_idx`(`round_id`, `released_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_extension_requests` (
    `id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `round_id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `payment_id` VARCHAR(191) NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('pending', 'approved', 'declined') NOT NULL DEFAULT 'pending',
    `requested_by_user_id` VARCHAR(191) NOT NULL,
    `handled_by_user_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    INDEX `payment_extension_requests_group_id_status_idx`(`group_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_logs` (
    `id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NULL,
    `to_phone` VARCHAR(191) NOT NULL,
    `template` ENUM('otp', 'payout_order_change', 'payment_reminder', 'payment_receipt', 'payout_receipt', 'payout_hold', 'extension_request', 'group_invite') NOT NULL,
    `payload` JSON NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `provider_message_id` VARCHAR(191) NULL,
    `status` ENUM('queued', 'sent', 'failed') NOT NULL DEFAULT 'queued',
    `error_message` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sent_at` DATETIME(3) NULL,

    INDEX `notification_logs_to_phone_created_at_idx`(`to_phone`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `otp_codes` ADD CONSTRAINT `otp_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `groups` ADD CONSTRAINT `groups_organizer_id_fkey` FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rounds` ADD CONSTRAINT `rounds_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rounds` ADD CONSTRAINT `rounds_recipient_member_id_fkey` FOREIGN KEY (`recipient_member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `priority_requests` ADD CONSTRAINT `priority_requests_round_id_fkey` FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `priority_requests` ADD CONSTRAINT `priority_requests_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_round_id_fkey` FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_order_change_logs` ADD CONSTRAINT `payout_order_change_logs_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_order_change_logs` ADD CONSTRAINT `payout_order_change_logs_round_id_fkey` FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_order_change_logs` ADD CONSTRAINT `payout_order_change_logs_new_recipient_member_id_fkey` FOREIGN KEY (`new_recipient_member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_order_change_logs` ADD CONSTRAINT `payout_order_change_logs_changed_by_user_id_fkey` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `autopay_settings` ADD CONSTRAINT `autopay_settings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `autopay_settings` ADD CONSTRAINT `autopay_settings_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_holds` ADD CONSTRAINT `payout_holds_round_id_fkey` FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_holds` ADD CONSTRAINT `payout_holds_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payout_holds` ADD CONSTRAINT `payout_holds_placed_by_user_id_fkey` FOREIGN KEY (`placed_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_extension_requests` ADD CONSTRAINT `payment_extension_requests_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_extension_requests` ADD CONSTRAINT `payment_extension_requests_round_id_fkey` FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_extension_requests` ADD CONSTRAINT `payment_extension_requests_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_extension_requests` ADD CONSTRAINT `payment_extension_requests_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_extension_requests` ADD CONSTRAINT `payment_extension_requests_requested_by_user_id_fkey` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_extension_requests` ADD CONSTRAINT `payment_extension_requests_handled_by_user_id_fkey` FOREIGN KEY (`handled_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
