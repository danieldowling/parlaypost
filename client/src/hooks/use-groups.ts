import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export function useGroups() {
  return useQuery({
    queryKey: [api.groups.list.path],
    queryFn: async () => {
      const res = await fetch(api.groups.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch groups");
      const data = await res.json();
      return parseWithLogging(api.groups.list.responses[200], data, "groups.list");
    },
  });
}

export function useGroupLeaderboard(groupId: number, period: string = 'all') {
  return useQuery({
    queryKey: [api.groups.leaderboard.path, groupId, period],
    queryFn: async () => {
      const base = buildUrl(api.groups.leaderboard.path, { id: groupId });
      const url = period !== 'all' ? `${base}?period=${period}` : base;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();
      return parseWithLogging(api.groups.leaderboard.responses[200], data, "groups.leaderboard");
    },
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupData: z.infer<typeof api.groups.create.input>) => {
      const res = await fetch(api.groups.create.path, {
        method: api.groups.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create group");
      const data = await res.json();
      return parseWithLogging(api.groups.create.responses[201], data, "groups.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (joinData: z.infer<typeof api.groups.join.input>) => {
      const res = await fetch(api.groups.join.path, {
        method: api.groups.join.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinData),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Invalid invite code");
        throw new Error("Failed to join group");
      }
      const data = await res.json();
      return parseWithLogging(api.groups.join.responses[200], data, "groups.join");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
    },
  });
}
