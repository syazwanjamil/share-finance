import type {
  ExtensionRequestMessage,
  GroupInviteMessage,
  OtpMessage,
  PaymentReceiptMessage,
  PaymentReminderMessage,
  PayoutHoldMessage,
  PayoutOrderChangeMessage,
  PayoutReceiptMessage,
  SendResult,
  WhatsAppService,
} from "./WhatsAppService.js";

/** Logs every "send" to the console instead of calling a real API. Always succeeds. */
export class MockWhatsAppService implements WhatsAppService {
  private log(kind: string, phone: string, message: unknown): SendResult {
    console.log(`[MockWhatsAppService] ${kind} -> ${phone}`, message);
    return { providerMessageId: `mock-${Date.now()}` };
  }

  async sendOtp(phone: string, message: OtpMessage): Promise<SendResult> {
    return this.log("otp", phone, message);
  }

  async sendPayoutOrderChange(phone: string, message: PayoutOrderChangeMessage): Promise<SendResult> {
    return this.log("payout_order_change", phone, message);
  }

  async sendPaymentReminder(phone: string, message: PaymentReminderMessage): Promise<SendResult> {
    return this.log("payment_reminder", phone, message);
  }

  async sendPaymentReceipt(phone: string, message: PaymentReceiptMessage): Promise<SendResult> {
    return this.log("payment_receipt", phone, message);
  }

  async sendPayoutReceipt(phone: string, message: PayoutReceiptMessage): Promise<SendResult> {
    return this.log("payout_receipt", phone, message);
  }

  async sendPayoutHold(phone: string, message: PayoutHoldMessage): Promise<SendResult> {
    return this.log("payout_hold", phone, message);
  }

  async sendExtensionRequest(phone: string, message: ExtensionRequestMessage): Promise<SendResult> {
    return this.log("extension_request", phone, message);
  }

  async sendGroupInvite(phone: string, message: GroupInviteMessage): Promise<SendResult> {
    return this.log("group_invite", phone, message);
  }
}
