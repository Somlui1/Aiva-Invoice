// Mock Users Master
export const MOCK_USERS = [
  { id: "u1", name: "Somchai (Accounting Officer)", role: "ACC", email: "somchai@aapico.com" },
  { id: "u2", name: "Suda (Approver)", role: "FIN", email: "suda@aapico.com" },
  { id: "u3", name: "Wichai (System Admin)", role: "ADM", email: "wichai@aapico.com" },
  { id: "u4", name: "Anan (Auditor)", role: "SA", email: "anan@aapico.com" },
  { id: "u5", name: "Kanda (End User / Receiver)", role: "EU", email: "kanda@aapico.com" }
];

export const INITIAL_MAPS = [
  { userId: "u1", account: "01-100-1110" },
  { userId: "u5", account: "01-200-2110" }
];

export function acctsOf(u, maps = INITIAL_MAPS) {
  if (!u) return [];
  return maps.filter(m => m.userId === u.id).map(m => m.account);
}

export default MOCK_USERS;
