import type { User } from "../types";

export const currentUser: User = {
  id: "u-sari",
  name: "Sari W.",
  initials: "S",
  phone: "+60 12-345 6789",
  phoneVerified: true,
  mykadVerified: true,
  mykadVerifiedDate: "2026-06-14",
  bankAccount: "Maybank ···4821",
};

export const users: User[] = [
  currentUser,
  // Ibu-Ibu Blok C
  { id: "u-rina", name: "Rina H.", initials: "R", phone: "+60 13-201 4455", phoneVerified: true, mykadVerified: true },
  { id: "u-ahmad", name: "Ahmad F.", initials: "A", phone: "+60 17-889 2201", phoneVerified: true, mykadVerified: true },
  { id: "u-nia", name: "Nia P.", initials: "N", phone: "+60 19-224 7781", phoneVerified: true, mykadVerified: true },
  { id: "u-dewi", name: "Dewi A.", initials: "D", phone: "+60 12-908 3312", phoneVerified: true, mykadVerified: true, bankAccount: "Maybank ···7702" },
  { id: "u-budi", name: "Budi S.", initials: "B", phone: "+60 16-773 5540", phoneVerified: true, mykadVerified: true },
  { id: "u-lim", name: "Lim K.", initials: "L", phone: "+60 11-664 9902", phoneVerified: true, mykadVerified: true },
  { id: "u-eka", name: "Eka R.", initials: "E", phone: "+60 18-330 1187", phoneVerified: true, mykadVerified: true },
  { id: "u-farah", name: "Farah N.", initials: "F", phone: "+60 19-882 1130", phoneVerified: true, mykadVerified: true },
  { id: "u-zaid", name: "Zaid K.", initials: "Z", phone: "+60 14-556 2290", phoneVerified: true, mykadVerified: true },
  // Warung Circle
  { id: "u-amir", name: "Amir R.", initials: "A", phone: "+60 12-771 0043", phoneVerified: true, mykadVerified: true },
  { id: "u-zul", name: "Zul H.", initials: "Z", phone: "+60 13-440 9021", phoneVerified: true, mykadVerified: true },
  { id: "u-mei", name: "Mei L.", initials: "M", phone: "+60 16-227 8834", phoneVerified: true, mykadVerified: true },
  { id: "u-hafiz", name: "Hafiz R.", initials: "H", phone: "+60 17-990 1123", phoneVerified: true, mykadVerified: true },
  { id: "u-aina", name: "Aina S.", initials: "A", phone: "+60 19-115 6602", phoneVerified: true, mykadVerified: true },
];

export function getUserById(id: string | null): User | undefined {
  if (!id) return undefined;
  return users.find((u) => u.id === id);
}
