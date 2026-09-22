import { config } from "../../config/env.js";
import { ApiError } from "../../lib/ApiError.js";
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

/**
 * Template names as created on the Teekrr platform. Keep this in sync with whatever
 * templates actually exist there — see server/README.md for the full list + params.
 */
const TEMPLATES = {
  otp: "c1_otp_share_finance",
  paymentReminder: "c1_payment_reminder_share_finance",
  paymentReceipt: "c1_payment_receipt_share_finance",
  payoutOrderChange: "c1_payout_order_change_share_finance",
  payoutReceipt: "c1_payout_receipt_share_finance",
  payoutHold: "c1_payout_hold_share_finance",
  extensionRequest: "c1_extension_request_share_finance",
  groupInvite: "c1_group_invite_share_finance",
} as const;

/** Teekrr expects recipients as bare MY numbers without the leading "+", e.g. "60123456789". */
function toTeekrrRecipient(phone: string): string {
  return phone.replace(/^\+/, "");
}

interface TeekrrRequestBody {
  templateName: string;
  campaignName: string;
  type: "quick broadcast";
  recipients: string[];
  variables: { templateParams: Record<string, string> };
}

export class TeekrrWhatsAppService implements WhatsAppService {
  private assertConfigured(): void {
    if (!config.TEEKRR_API_BASE_URL || !config.TEEKRR_API_KEY) {
      throw new ApiError(
        503,
        "NOTIFICATION_PROVIDER_NOT_CONFIGURED",
        "Teekrr API credentials are not configured (TEEKRR_API_BASE_URL / TEEKRR_API_KEY).",
      );
    }
  }

  private async send(
    phone: string,
    templateName: string,
    campaignName: string,
    templateParams: Record<string, string | number>,
  ): Promise<SendResult> {
    this.assertConfigured();

    // Teekrr's template engine rejects non-string variable values (e.g. a raw
    // roundNumber) with a 400, so every param is coerced to a string here.
    const stringParams = Object.fromEntries(
      Object.entries(templateParams).map(([key, value]) => [key, String(value)]),
    );

    const body: TeekrrRequestBody = {
      templateName,
      campaignName,
      type: "quick broadcast",
      recipients: [toTeekrrRecipient(phone)],
      variables: { templateParams: stringParams },
    };

    const response = await fetch(`${config.TEEKRR_API_BASE_URL}/whatsapp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.TEEKRR_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text().catch(() => "");
    if (!response.ok) {
      throw new ApiError(
        502,
        "NOTIFICATION_SEND_FAILED",
        `Teekrr API responded with ${response.status}`,
        responseText,
      );
    }

    const data = responseText ? (JSON.parse(responseText) as { id?: string }) : {};
    return { providerMessageId: data.id };
  }

  sendOtp(phone: string, message: OtpMessage): Promise<SendResult> {
    return this.send(phone, TEMPLATES.otp, "Share Finance Authentication", {
      verificationCode: message.code,
    });
  }

  sendPayoutOrderChange(phone: string, message: PayoutOrderChangeMessage): Promise<SendResult> {
    return this.send(phone, TEMPLATES.payoutOrderChange, "Share Finance Payout Order Change", {
      groupName: message.groupName,
      roundNumber: message.roundNumber,
      reason: message.reason,
    });
  }

  sendPaymentReminder(phone: string, message: PaymentReminderMessage): Promise<SendResult> {
    return this.send(phone, TEMPLATES.paymentReminder, "Share Finance Payment Reminder", {
      groupName: message.groupName,
      roundNumber: message.roundNumber,
      amount: message.amountLabel,
      dueDate: message.dueDateLabel,
    });
  }

  sendPaymentReceipt(phone: string, message: PaymentReceiptMessage): Promise<SendResult> {
    return this.send(phone, TEMPLATES.paymentReceipt, "Share Finance Payment Receipt", {
      groupName: message.groupName,
      roundNumber: message.roundNumber,
      amount: message.amountLabel,
      reference: message.ref,
    });
  }

  sendPayoutReceipt(phone: string, message: PayoutReceiptMessage): Promise<SendResult> {
    return this.send(phone, TEMPLATES.payoutReceipt, "Share Finance Payout Receipt", {
      groupName: message.groupName,
      roundNumber: message.roundNumber,
      amount: message.amountLabel,
      reference: message.ref,
    });
  }

  sendPayoutHold(phone: string, message: PayoutHoldMessage): Promise<SendResult> {
    return this.send(phone, TEMPLATES.payoutHold, "Share Finance Payout Hold", {
      groupName: message.groupName,
      roundNumber: message.roundNumber,
      reason: message.reason,
    });
  }

  sendExtensionRequest(phone: string, message: ExtensionRequestMessage): Promise<SendResult> {
    return this.send(phone, TEMPLATES.extensionRequest, "Share Finance Extension Request", {
      groupName: message.groupName,
      roundNumber: message.roundNumber,
      memberName: message.memberName,
      reason: message.reason,
    });
  }

  sendGroupInvite(phone: string, message: GroupInviteMessage): Promise<SendResult> {
    return this.send(phone, TEMPLATES.groupInvite, "Share Finance Group Invite", {
      groupName: message.groupName,
      inviteCode: message.inviteCode,
    });
  }
}
