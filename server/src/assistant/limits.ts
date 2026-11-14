import { AssistantError } from "./contracts.js";
export function createLimiter(now = Date.now) {
  const users = new Map<number, number[]>();
  const active = new Set<number>();
  let daily: number[] = [];
  return {
    acquire(userId: number) {
      const time = now();
      for (const [id, entries] of users) {
        const recent = entries.filter(t => t > time - 3600000);
        if (recent.length) users.set(id, recent); else users.delete(id);
      }
      daily = daily.filter(t => t > time - 86400000);
      if (active.has(userId) || active.size >= 2) throw new AssistantError(429, "Trợ lý đang bận. Bạn thử lại sau nhé.", 5);
      const user = users.get(userId) ?? [];
      if (user.length >= 20 || daily.length >= 100) {
        const expires = Math.max(user.length >= 20 ? user[0] + 3600000 : 0, daily.length >= 100 ? daily[0] + 86400000 : 0);
        throw new AssistantError(429, "Đã đạt giới hạn dùng thử. Bạn quay lại sau nhé.", Math.max(1, Math.ceil((expires - time) / 1000)));
      }
      user.push(time); daily.push(time); users.set(userId, user); active.add(userId);
      return () => { active.delete(userId); };
    }
  };
}
