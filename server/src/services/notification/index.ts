import { config } from "../../config/env.js";
import { MockWhatsAppService } from "./MockWhatsAppService.js";
import { TeekrrWhatsAppService } from "./TeekrrWhatsAppService.js";
import type { WhatsAppService } from "./WhatsAppService.js";

function createWhatsAppService(): WhatsAppService {
  switch (config.NOTIFICATION_PROVIDER) {
    case "teekrr":
      return new TeekrrWhatsAppService();
    case "mock":
    default:
      return new MockWhatsAppService();
  }
}

export const whatsAppService: WhatsAppService = createWhatsAppService();
export type { WhatsAppService } from "./WhatsAppService.js";
