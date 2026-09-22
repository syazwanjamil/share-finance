import type { Group, Member, Payment, Round } from "../../types";
import { blokCGroup, blokCMembers, blokCPayments, blokCRounds } from "./blokC";
import {
  warungCircleGroup,
  warungCircleMembers,
  warungCirclePayments,
  warungCircleRounds,
} from "./warungCircle";

export interface GroupBundle {
  group: Group;
  members: Member[];
  rounds: Round[];
  payments: Payment[];
}

export const initialGroupBundles: GroupBundle[] = [
  { group: blokCGroup, members: blokCMembers, rounds: blokCRounds, payments: blokCPayments },
  {
    group: warungCircleGroup,
    members: warungCircleMembers,
    rounds: warungCircleRounds,
    payments: warungCirclePayments,
  },
];
