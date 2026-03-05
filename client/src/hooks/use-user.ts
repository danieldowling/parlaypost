import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useUserStats(userId?: number) {
  return useQuery({
    queryKey: [api.users.stats.path, userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID provided");
      const url = buildUrl(api.users.stats.path, { id: userId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user stats");
      const data = await res.json();
      return parseWithLogging(api.users.stats.responses[200], data, "users.stats");
    },
    enabled: !!userId,
  });
}

export function useUserBets(userId?: number) {
  return useQuery({
    queryKey: [api.users.bets.path, userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID provided");
      const url = buildUrl(api.users.bets.path, { id: userId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user bets");
      const data = await res.json();
      
      // Ensure date objects are correctly parsed
      const schemaWithDates = z.array(z.object({
        id: z.number(),
        userId: z.number(),
        groupId: z.number().nullable(),
        team: z.string(),
        betType: z.string(),
        line: z.number(),
        odds: z.number(),
        amount: z.coerce.number(),
        gameDate: z.coerce.date().nullable(),
        result: z.string().nullable(),
        profitLoss: z.coerce.number().nullable(),
        createdAt: z.coerce.date(),
      }));
      
      return parseWithLogging(schemaWithDates, data, "users.bets");
    },
    enabled: !!userId,
  });
}
