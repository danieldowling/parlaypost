import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { getLiveOdds } from "./odds";

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
      // In a real app we'd hash and compare passwords, but keeping it simple for MVP
      if (user.password !== password) return done(null, false, { message: 'Incorrect password.' });
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

  // Auth routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const user = await storage.createUser(input);
      req.login(user, (err) => {
        if (err) throw err;
        res.status(201).json(user);
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
    res.json(req.user);
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
    res.json(req.user);
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
    const members = await storage.getGroupMembers(groupId);
    
    const leaderboard = await Promise.all(members.map(async (member) => {
      const userBets = await storage.getUserBets(member.id);
      // Only count bets for this group if we wanted to isolate them, 
      // but typical sports betting groups just compare overall performance.
      // We'll calculate their total P/L
      
      let totalProfitLoss = 0;
      let wins = 0;
      let finishedBets = 0;
      
      userBets.forEach(bet => {
        if (bet.profitLoss) totalProfitLoss += bet.profitLoss;
        if (bet.result !== 'pending') finishedBets++;
        if (bet.result === 'won') wins++;
      });
      
      return {
        userId: member.id,
        name: member.name,
        totalProfitLoss,
        winPercentage: finishedBets > 0 ? (wins / finishedBets) * 100 : 0
      };
    }));
    
    // Sort by profit/loss descending
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

  // Webhook for SMS parsing (Twilio example)
  app.post('/api/webhook/sms', async (req, res) => {
    const { Body, From } = req.body;
    
    console.log(`Received SMS from ${From}: ${Body}`);
    
    try {
      // Improved regex parser for "$50 Knicks -4.5 vs Bulls"
      // Matches amount: $50, $50.50
      const amountMatch = Body.match(/\$(\d+(\.\d+)?)/);
      
      // Matches team name after the amount (e.g., Knicks, Bulls, Lakers)
      // Look for the first word after the dollar amount
      const teamMatch = Body.match(/\$\d+(?:\.\d+)?\s+([A-Za-z]+)/);
      
      // Matches the line/spread (e.g., -4.5, +7, -110)
      // Only looks for numbers with a sign (+/-)
      const lineMatch = Body.match(/([+-]\d+(\.\d+)?)/);

      if (amountMatch && teamMatch) {
        const amount = parseFloat(amountMatch[1]);
        const team = teamMatch[1];
        // If line is found, use it, otherwise default to 0 (moneyline)
        const line = lineMatch ? parseFloat(lineMatch[1]) : 0;
        
        // Find Alice as the default user for simulation if phone lookup isn't implemented
        const alice = await storage.getUserByEmail("alice@example.com");
        
        if (alice) {
          await storage.createBet({
            userId: alice.id,
            team: team,
            betType: line !== 0 ? 'spread' : 'moneyline',
            line: line,
            odds: -110, // Default odds for simulation
            amount: amount,
            result: 'pending',
            profitLoss: 0
          });
          console.log(`Bet stored: ${amount} on ${team} ${line}`);
        }
      }
    } catch (err) {
      console.error("Error parsing SMS bet:", err);
    }
    
    res.type('text/xml');
    res.send('<Response><Message>Bet logged in ParlayPost!</Message></Response>');
  });

  return httpServer;
}