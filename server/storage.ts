import { db } from "./db";
import { users, groups, groupMembers, bets, type InsertUser, type User, type InsertGroup, type Group, type InsertBet, type Bet } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createGroup(group: InsertGroup & { inviteCode: string }, userId: number): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getGroupByInviteCode(inviteCode: string): Promise<Group | undefined>;
  joinGroup(groupId: number, userId: number): Promise<void>;
  getUserGroups(userId: number): Promise<Group[]>;
  getGroupMembers(groupId: number): Promise<User[]>;
  
  createBet(bet: InsertBet): Promise<Bet>;
  updateBet(id: number, updates: Partial<InsertBet>): Promise<Bet | undefined>;
  getBet(id: number): Promise<Bet | undefined>;
  getUserBets(userId: number): Promise<Bet[]>;
  getGroupBets(groupId: number): Promise<Bet[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createGroup(insertGroup: InsertGroup & { inviteCode: string }, userId: number): Promise<Group> {
    const [group] = await db.insert(groups).values(insertGroup).returning();
    await db.insert(groupMembers).values({ groupId: group.id, userId });
    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async getGroupByInviteCode(inviteCode: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.inviteCode, inviteCode));
    return group;
  }

  async joinGroup(groupId: number, userId: number): Promise<void> {
    await db.insert(groupMembers).values({ groupId, userId });
  }

  async getUserGroups(userId: number): Promise<Group[]> {
    const memberships = await db.select().from(groupMembers).where(eq(groupMembers.userId, userId));
    if (memberships.length === 0) return [];
    
    const groupIds = memberships.map(m => m.groupId);
    // Fetch one by one or with inArray, since inArray needs at least 1 element, safe to use simple iteration for MVP
    const userGroups = [];
    for (const id of groupIds) {
      const g = await this.getGroup(id);
      if (g) userGroups.push(g);
    }
    return userGroups;
  }
  
  async getGroupMembers(groupId: number): Promise<User[]> {
    const memberships = await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
    if (memberships.length === 0) return [];
    
    const members = [];
    for (const m of memberships) {
      const u = await this.getUser(m.userId);
      if (u) members.push(u);
    }
    return members;
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const [bet] = await db.insert(bets).values(insertBet).returning();
    return bet;
  }

  async getBet(id: number): Promise<Bet | undefined> {
    const [bet] = await db.select().from(bets).where(eq(bets.id, id));
    return bet;
  }

  async updateBet(id: number, updates: Partial<InsertBet>): Promise<Bet | undefined> {
    const [bet] = await db.update(bets).set(updates).where(eq(bets.id, id)).returning();
    return bet;
  }

  async getUserBets(userId: number): Promise<Bet[]> {
    return await db.select().from(bets).where(eq(bets.userId, userId)).orderBy(desc(bets.createdAt));
  }
  
  async getGroupBets(groupId: number): Promise<Bet[]> {
    return await db.select().from(bets).where(eq(bets.groupId, groupId)).orderBy(desc(bets.createdAt));
  }
}

export const storage = new DatabaseStorage();