export interface OtpMessage {
  code: string;
  expiresInMinutes: number;
}

export interface PayoutOrderChangeMessage {
  groupName: string;
  roundNumber: number;
  reason: string;
}

export interface PaymentReminderMessage {
  groupName: string;
  roundNumber: number;
  amountLabel: string;
  dueDateLabel: string;
}

export interface PaymentReceiptMessage {
  groupName: string;
  roundNumber: number;
  amountLabel: string;
  ref: string;
}

export interface PayoutReceiptMessage {
  groupName: string;
  roundNumber: number;
  amountLabel: string;
  ref: string;
}

export interface PayoutHoldMessage {
  groupName: string;
  roundNumber: number;
  reason: string;
}

export interface ExtensionRequestMessage {
  groupName: string;
  roundNumber: number;
  memberName: string;
  reason: string;
}

export interface GroupInviteMessage {
  groupName: string;
  inviteCode: string;
}

export interface SendResult {
  providerMessageId?: string;
}

/**
 * Abstraction over the outbound WhatsApp channel. Every call site depends only on this
 * interface — the concrete implementation (mock vs Teekrr) is chosen at boot by
 * `services/notification/index.ts` based on `NOTIFICATION_PROVIDER`, so wiring real
 * credentials later never touches a call site.
 */
export interface WhatsAppService {
  sendOtp(phone: string, message: OtpMessage): Promise<SendResult>;
  sendPayoutOrderChange(phone: string, message: PayoutOrderChangeMessage): Promise<SendResult>;
  sendPaymentReminder(phone: string, message: PaymentReminderMessage): Promise<SendResult>;
  sendPaymentReceipt(phone: string, message: PaymentReceiptMessage): Promise<SendResult>;
  sendPayoutReceipt(phone: string, message: PayoutReceiptMessage): Promise<SendResult>;
  sendPayoutHold(phone: string, message: PayoutHoldMessage): Promise<SendResult>;
  sendExtensionRequest(phone: string, message: ExtensionRequestMessage): Promise<SendResult>;
  sendGroupInvite(phone: string, message: GroupInviteMessage): Promise<SendResult>;
}
