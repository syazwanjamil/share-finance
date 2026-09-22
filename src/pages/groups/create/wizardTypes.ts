import type { Frequency, PayoutOrderMethod } from "../../../types";

export interface GroupDraft {
  name: string;
  contributionAmount: number;
  frequency: Frequency;
  totalSlots: number;
  firstPayoutDate: string;
  lateFeeEnabled: boolean;
  payoutOrderMethod: PayoutOrderMethod;
}

export const initialDraft: GroupDraft = {
  name: "Ibu-Ibu Blok C",
  contributionAmount: 500,
  frequency: "monthly",
  totalSlots: 10,
  firstPayoutDate: "2026-10-25",
  lateFeeEnabled: true,
  payoutOrderMethod: "assigned",
};
