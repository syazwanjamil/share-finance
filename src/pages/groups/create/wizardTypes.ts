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
  name: "",
  contributionAmount: 0,
  frequency: "monthly",
  totalSlots: 2,
  firstPayoutDate: "",
  lateFeeEnabled: false,
  payoutOrderMethod: "assigned",
};
