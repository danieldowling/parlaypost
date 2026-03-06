import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { getLiveOdds } from "./odds";
import { parseBet, betConfirmationMessage } from "./bet-parser";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Authentication setup
  app.use(session({
    secret: process.env.SESSION_SECRET || 'parlaypost-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" }
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) return done(null, false, { message: 'Incorrect email.' });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return done(null, false, { message: 'Incorrect password.' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  const safeUser = (user: any) => {
    const { password: _, ...rest } = user;
    return rest;
  };

  // Auth routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      req.login(user, (err) => {
        if (err) throw err;
        res.status(201).json(safeUser(user));
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.auth.login.path, passport.authenticate('local'), (req, res) => {
    res.json(safeUser(req.user));
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(safeUser(req.user));
  });

  // User Stats and Bets
  app.get(api.users.stats.path, async (req, res) => {
    const userId = Number(req.params.id);
    const userBets = await storage.getUserBets(userId);
    
    const totalBets = userBets.length;
    let wins = 0;
    let totalProfitLoss = 0;
    const recentForm = [];
    
    for (const bet of userBets) {
      if (bet.result === 'won') wins++;
      if (bet.profitLoss) totalProfitLoss += bet.profitLoss;
      
      if (recentForm.length < 5) {
        recentForm.push(bet.result || 'pending');
      }
    }
    
    const winPercentage = totalBets > 0 ? (wins / totalBets) * 100 : 0;
    
    res.json({
      totalBets,
      winPercentage,
      totalProfitLoss,
      recentForm
    });
  });

  app.get(api.users.bets.path, async (req, res) => {
    const userId = Number(req.params.id);
    const bets = await storage.getUserBets(userId);
    res.json(bets);
  });

  // Groups routes
  app.get(api.groups.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const groups = await storage.getUserGroups(user.id);
    res.json(groups);
  });

  app.post(api.groups.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    
    try {
      const input = api.groups.create.input.parse(req.body);
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const group = await storage.createGroup({ ...input, inviteCode }, user.id);
      res.status(201).json(group);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.groups.join.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    
    try {
      const input = api.groups.join.input.parse(req.body);
      const group = await storage.getGroupByInviteCode(input.inviteCode);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      await storage.joinGroup(group.id, user.id);
      res.json(group);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.groups.leaderboard.path, async (req, res) => {
    const groupId = Number(req.params.id);
    const period = (req.query.period as string) || 'all';
    const members = await storage.getGroupMembers(groupId);

    const now = new Date();
    let since: Date | null = null;
    if (period === 'ytd') {
      since = new Date(now.getFullYear(), 0, 1);
    } else if (period === '1month') {
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === '1week') {
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const leaderboard = await Promise.all(members.map(async (member) => {
      const allBets = await storage.getUserBets(member.id);
      const userBets = since
        ? allBets.filter(b => new Date(b.createdAt) >= since!)
        : allBets;

      let totalProfitLoss = 0;
      let wins = 0;
      let losses = 0;
      let pushes = 0;

      userBets.forEach(bet => {
        if (bet.profitLoss) totalProfitLoss += bet.profitLoss;
        if (bet.result === 'won') wins++;
        else if (bet.result === 'lost') losses++;
        else if (bet.result === 'push') pushes++;
      });

      const finishedBets = wins + losses + pushes;

      return {
        userId: member.id,
        name: member.name,
        totalProfitLoss,
        winPercentage: finishedBets > 0 ? (wins / finishedBets) * 100 : 0,
        wins,
        losses,
        pushes,
        totalBets: userBets.length,
      };
    }));

    leaderboard.sort((a, b) => b.totalProfitLoss - a.totalProfitLoss);
    res.json(leaderboard);
  });

  // Live odds endpoint
  app.get(api.odds.live.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const sports = (req.query.sports as string)?.split(',') || ["basketball_nba", "americanfootball_nfl"];
      const games = await getLiveOdds(sports);
      res.json(games);
    } catch (err: any) {
      console.error("Odds fetch error:", err);
      res.status(500).json({ message: err.message || "Failed to fetch odds" });
    }
  });

  // Update a bet (correct bad SMS parse data)
  app.patch('/api/bets/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const betId = Number(req.params.id);
    const existing = await storage.getBet(betId);
    if (!existing) return res.status(404).json({ message: "Bet not found" });

    const userId = (req.user as any).id;
    if (existing.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    const { team, betType, line, odds, amount, result, gameDate } = req.body;

    // Recalculate profitLoss whenever result is provided
    let profitLoss = existing.profitLoss ?? 0;
    const effectiveResult = result ?? existing.result;
    const effectiveAmount = amount ?? existing.amount;
    const effectiveOdds = odds ?? existing.odds;

    if (effectiveResult === 'won') {
      profitLoss = effectiveOdds >= 0
        ? effectiveAmount * (effectiveOdds / 100)
        : effectiveAmount * (100 / Math.abs(effectiveOdds));
    } else if (effectiveResult === 'lost') {
      profitLoss = -effectiveAmount;
    } else if (effectiveResult === 'push') {
      profitLoss = 0;
    } else if (effectiveResult === 'pending') {
      profitLoss = 0;
    }

    const updates: Record<string, any> = { profitLoss };
    if (team !== undefined) updates.team = team;
    if (betType !== undefined) updates.betType = betType;
    if (line !== undefined) updates.line = Number(line);
    if (odds !== undefined) updates.odds = Number(odds);
    if (amount !== undefined) updates.amount = Number(amount);
    if (result !== undefined) updates.result = result;
    if (gameDate !== undefined) updates.gameDate = gameDate ? new Date(gameDate) : null;

    const updated = await storage.updateBet(betId, updates);
    res.json(updated);
  });

  // Webhook for SMS parsing (Twilio)
  app.post('/api/webhook/sms', async (req, res) => {
    const { Body, From } = req.body;
    console.log(`Received SMS from ${From}: ${Body}`);

    let replyMessage = "Sorry, couldn't parse that bet. Try: \"$50 Knicks -4.5\" or \"Lakers ML for $100\"";

    try {
      const parsed = parseBet(Body);

      if (parsed) {
        const alice = await storage.getUserByEmail("alice@example.com");

        if (alice) {
          await storage.createBet({
            userId: alice.id,
            team: parsed.team,
            betType: parsed.betType,
            line: parsed.line,
            odds: parsed.odds,
            amount: parsed.amount,
            result: 'pending',
            profitLoss: 0
          });
          replyMessage = betConfirmationMessage(parsed);
          console.log(`Bet stored: ${JSON.stringify(parsed)}`);
        }
      } else {
        console.log(`Could not parse bet from: "${Body}"`);
      }
    } catch (err) {
      console.error("Error parsing SMS bet:", err);
    }

    res.type('text/xml');
    res.send(`<Response><Message>${replyMessage}</Message></Response>`);
  });

  return httpServer;
}