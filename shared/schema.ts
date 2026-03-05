import { pgTable, text, serial, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
});

export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  groupId: integer("group_id"),
  team: text("team").notNull(),
  betType: text("bet_type").notNull(), // 'spread', 'moneyline', 'total'
  line: doublePrecision("line").notNull(),
  odds: integer("odds").notNull(), 
  amount: doublePrecision("amount").notNull(),
  gameDate: timestamp("game_date"),
  result: text("result").default('pending'), // 'won', 'lost', 'push', 'pending'
  profitLoss: doublePrecision("profit_loss"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, inviteCode: true });
export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({ id: true });
export const insertBetSchema = createInsertSchema(bets).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type GroupMember = typeof groupMembers.$inferSelect;

export type Bet = typeof bets.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;

export type RegisterRequest = InsertUser;
export type LoginRequest = Pick<InsertUser, 'email' | 'password'>;
export type CreateGroupRequest = InsertGroup;
export type JoinGroupRequest = { inviteCode: string };

export type UserStatsResponse = {
  totalBets: number;
  winPercentage: number;
  totalProfitLoss: number;
  recentForm: ('won' | 'lost' | 'push' | 'pending')[];
};

export type LeaderboardEntry = {
  userId: number;
  name: string;
  totalProfitLoss: number;
  winPercentage: number;
};
