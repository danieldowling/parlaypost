import { z } from 'zod';
import { insertUserSchema, insertGroupSchema, users, groups, bets } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ email: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  groups: {
    list: {
      method: 'GET' as const,
      path: '/api/groups' as const,
      responses: {
        200: z.array(z.custom<typeof groups.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/groups' as const,
      input: insertGroupSchema,
      responses: {
        201: z.custom<typeof groups.$inferSelect>(),
      }
    },
    join: {
      method: 'POST' as const,
      path: '/api/groups/join' as const,
      input: z.object({ inviteCode: z.string() }),
      responses: {
        200: z.custom<typeof groups.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    leaderboard: {
      method: 'GET' as const,
      path: '/api/groups/:id/leaderboard' as const,
      responses: {
        200: z.array(z.object({
          userId: z.number(),
          name: z.string(),
          totalProfitLoss: z.number(),
          winPercentage: z.number(),
          wins: z.number(),
          losses: z.number(),
          pushes: z.number(),
          totalBets: z.number(),
        }))
      }
    }
  },
  odds: {
    live: {
      method: 'GET' as const,
      path: '/api/odds/live' as const,
      responses: {
        200: z.array(z.object({
          id: z.string(),
          sport: z.string(),
          sportTitle: z.string(),
          commenceTime: z.string(),
          homeTeam: z.string(),
          awayTeam: z.string(),
          bookmaker: z.string(),
          moneyline: z.object({ home: z.number(), away: z.number() }).optional(),
          spread: z.object({ homePoint: z.number(), homeOdds: z.number(), awayPoint: z.number(), awayOdds: z.number() }).optional(),
          total: z.object({ point: z.number(), overOdds: z.number(), underOdds: z.number() }).optional(),
        }))
      }
    }
  },
  bets: {
    update: {
      method: 'PATCH' as const,
      path: '/api/bets/:id' as const,
      responses: {
        200: z.custom<typeof bets.$inferSelect>(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    }
  },
  users: {
    stats: {
      method: 'GET' as const,
      path: '/api/users/:id/stats' as const,
      responses: {
        200: z.object({
          totalBets: z.number(),
          winPercentage: z.number(),
          totalProfitLoss: z.number(),
          recentForm: z.array(z.string())
        })
      }
    },
    bets: {
      method: 'GET' as const,
      path: '/api/users/:id/bets' as const,
      responses: {
        200: z.array(z.custom<typeof bets.$inferSelect>())
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
