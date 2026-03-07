import { storage } from "./server/storage";
import bcrypt from "bcryptjs";

async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

async function seedDatabase() {
  console.log("Seeding database...");

  try {
    // ── Weekend Warriors users ──────────────────────────────────────────────
    let user1 = await storage.getUserByEmail("alice@example.com");
    if (!user1) {
      user1 = await storage.createUser({ email: "alice@example.com", password: await hashPassword("password123"), name: "Alice" });
    }

    let user2 = await storage.getUserByEmail("bob@example.com");
    if (!user2) {
      user2 = await storage.createUser({ email: "bob@example.com", password: await hashPassword("password123"), name: "Bob" });
    }

    let user3 = await storage.getUserByEmail("charlie@example.com");
    if (!user3) {
      user3 = await storage.createUser({ email: "charlie@example.com", password: await hashPassword("password123"), name: "Charlie" });
    }

    let user4 = await storage.getUserByEmail("diana@example.com");
    if (!user4) {
      user4 = await storage.createUser({ email: "diana@example.com", password: await hashPassword("password123"), name: "Diana" });
    }

    // ── Weekend Warriors group ──────────────────────────────────────────────
    let wwGroup = await storage.getGroupByInviteCode("SEED123");
    if (!wwGroup) {
      wwGroup = await storage.createGroup({ name: "Weekend Warriors", inviteCode: "SEED123" }, user1.id);
    }

    const wwMembers = await storage.getGroupMembers(wwGroup.id);
    const wwMemberIds = wwMembers.map((m: any) => m.id);
    if (!wwMemberIds.includes(user2.id)) await storage.joinGroup(wwGroup.id, user2.id);
    if (!wwMemberIds.includes(user3.id)) await storage.joinGroup(wwGroup.id, user3.id);
    if (!wwMemberIds.includes(user4.id)) await storage.joinGroup(wwGroup.id, user4.id);

    // Bets — Alice (strong record)
    const aliceBets = await storage.getUserBets(user1.id);
    if (aliceBets.length === 0) {
      await storage.createBet({ userId: user1.id, groupId: wwGroup.id, team: "Knicks",   betType: "spread",    line: -4.5,  odds: -110, amount: 50,  gameDate: new Date("2026-02-01"), result: "won",  profitLoss: 45.45 });
      await storage.createBet({ userId: user1.id, groupId: wwGroup.id, team: "Lakers",   betType: "moneyline", line: 0,     odds:  120, amount: 100, gameDate: new Date("2026-02-05"), result: "won",  profitLoss: 120 });
      await storage.createBet({ userId: user1.id, groupId: wwGroup.id, team: "Warriors", betType: "total",     line: 220.5, odds: -110, amount: 110, gameDate: new Date("2026-02-10"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: user1.id, groupId: wwGroup.id, team: "Celtics",  betType: "spread",    line: -5.5,  odds: -110, amount: 55,  gameDate: new Date("2026-02-15"), result: "lost", profitLoss: -55 });
      await storage.createBet({ userId: user1.id, groupId: wwGroup.id, team: "Suns",     betType: "moneyline", line: 0,     odds: -150, amount: 150, gameDate: new Date("2026-02-20"), result: "won",  profitLoss: 100 });
    }

    // Bets — Bob (decent record)
    const bobBets = await storage.getUserBets(user2.id);
    if (bobBets.length === 0) {
      await storage.createBet({ userId: user2.id, groupId: wwGroup.id, team: "Bulls",  betType: "spread",    line:  4.5, odds: -110, amount: 50,  gameDate: new Date("2026-02-01"), result: "lost", profitLoss: -50 });
      await storage.createBet({ userId: user2.id, groupId: wwGroup.id, team: "Heat",   betType: "moneyline", line:  0,   odds:  110, amount: 100, gameDate: new Date("2026-02-07"), result: "won",  profitLoss: 110 });
      await storage.createBet({ userId: user2.id, groupId: wwGroup.id, team: "Bucks",  betType: "spread",    line: -3,   odds: -110, amount: 110, gameDate: new Date("2026-02-12"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: user2.id, groupId: wwGroup.id, team: "Nets",   betType: "total",     line: 215,  odds: -110, amount: 55,  gameDate: new Date("2026-02-18"), result: "lost", profitLoss: -55 });
      await storage.createBet({ userId: user2.id, groupId: wwGroup.id, team: "Pacers", betType: "moneyline", line:  0,   odds:  130, amount: 100, gameDate: new Date("2026-02-22"), result: "won",  profitLoss: 130 });
    }

    // Bets — Charlie (mostly loses)
    const charlieBets = await storage.getUserBets(user3.id);
    if (charlieBets.length === 0) {
      await storage.createBet({ userId: user3.id, groupId: wwGroup.id, team: "Clippers", betType: "spread",    line: -6,   odds: -110, amount: 110, gameDate: new Date("2026-02-02"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user3.id, groupId: wwGroup.id, team: "Pistons",  betType: "moneyline", line:  0,   odds: -180, amount: 180, gameDate: new Date("2026-02-06"), result: "lost", profitLoss: -180 });
      await storage.createBet({ userId: user3.id, groupId: wwGroup.id, team: "Magic",    betType: "spread",    line:  2.5, odds: -110, amount: 110, gameDate: new Date("2026-02-11"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user3.id, groupId: wwGroup.id, team: "Hornets",  betType: "total",     line: 218,  odds: -110, amount: 110, gameDate: new Date("2026-02-16"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: user3.id, groupId: wwGroup.id, team: "Wizards",  betType: "moneyline", line:  0,   odds: -130, amount: 130, gameDate: new Date("2026-02-21"), result: "lost", profitLoss: -130 });
      await storage.createBet({ userId: user3.id, groupId: wwGroup.id, team: "Thunder",  betType: "spread",    line: -7,   odds: -110, amount: 110, gameDate: new Date("2026-02-25"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user3.id, groupId: wwGroup.id, team: "Jazz",     betType: "moneyline", line:  0,   odds:  150, amount: 100, gameDate: new Date("2026-02-28"), result: "lost", profitLoss: -100 });
    }

    // Bets — Diana (almost all losses)
    const dianaBets = await storage.getUserBets(user4.id);
    if (dianaBets.length === 0) {
      await storage.createBet({ userId: user4.id, groupId: wwGroup.id, team: "Cavaliers",    betType: "spread",    line: -4,   odds: -110, amount: 110, gameDate: new Date("2026-02-03"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user4.id, groupId: wwGroup.id, team: "Raptors",      betType: "moneyline", line:  0,   odds: -160, amount: 160, gameDate: new Date("2026-02-08"), result: "lost", profitLoss: -160 });
      await storage.createBet({ userId: user4.id, groupId: wwGroup.id, team: "Grizzlies",    betType: "total",     line: 224,  odds: -110, amount: 110, gameDate: new Date("2026-02-13"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user4.id, groupId: wwGroup.id, team: "Pelicans",     betType: "spread",    line:  5.5, odds: -110, amount: 110, gameDate: new Date("2026-02-17"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user4.id, groupId: wwGroup.id, team: "Rockets",      betType: "moneyline", line:  0,   odds:  140, amount: 100, gameDate: new Date("2026-02-23"), result: "won",  profitLoss: 140 });
      await storage.createBet({ userId: user4.id, groupId: wwGroup.id, team: "Kings",        betType: "spread",    line: -2,   odds: -110, amount: 110, gameDate: new Date("2026-02-26"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user4.id, groupId: wwGroup.id, team: "Timberwolves", betType: "moneyline", line:  0,   odds: -200, amount: 200, gameDate: new Date("2026-03-01"), result: "lost", profitLoss: -200 });
      await storage.createBet({ userId: user4.id, groupId: wwGroup.id, team: "Spurs",        betType: "total",     line: 210,  odds: -110, amount: 110, gameDate: new Date("2026-03-04"), result: "lost", profitLoss: -110 });
    }

    // ── NGLG BETS users ─────────────────────────────────────────────────────
    let deez = await storage.getUserByEmail("deez@nglg.com");
    if (!deez) {
      deez = await storage.createUser({ email: "deez@nglg.com", password: await hashPassword("password123"), name: "Deez" });
    }

    let hags = await storage.getUserByEmail("hags@nglg.com");
    if (!hags) {
      hags = await storage.createUser({ email: "hags@nglg.com", password: await hashPassword("password123"), name: "Hags" });
    }

    let heuss = await storage.getUserByEmail("heuss@nglg.com");
    if (!heuss) {
      heuss = await storage.createUser({ email: "heuss@nglg.com", password: await hashPassword("password123"), name: "Heuss" });
    }

    let campy = await storage.getUserByEmail("campy@nglg.com");
    if (!campy) {
      campy = await storage.createUser({ email: "campy@nglg.com", password: await hashPassword("password123"), name: "Campy" });
    }

    let mrzee = await storage.getUserByEmail("mrzee@nglg.com");
    if (!mrzee) {
      mrzee = await storage.createUser({ email: "mrzee@nglg.com", password: await hashPassword("password123"), name: "Mr. Zee" });
    }

    let beej = await storage.getUserByEmail("beej@nglg.com");
    if (!beej) {
      beej = await storage.createUser({ email: "beej@nglg.com", password: await hashPassword("password123"), name: "Beej" });
    }

    let ump = await storage.getUserByEmail("ump@nglg.com");
    if (!ump) {
      ump = await storage.createUser({ email: "ump@nglg.com", password: await hashPassword("password123"), name: "UMP" });
    }

    // ── NGLG BETS group ─────────────────────────────────────────────────────
    let nglgGroup = await storage.getGroupByInviteCode("NGLG24");
    if (!nglgGroup) {
      nglgGroup = await storage.createGroup({ name: "NGLG BETS", inviteCode: "NGLG24" }, deez.id);
    }

    const nglgMembers = await storage.getGroupMembers(nglgGroup.id);
    const nglgMemberIds = nglgMembers.map((m: any) => m.id);
    for (const u of [hags, heuss, campy, mrzee, beej, ump]) {
      if (!nglgMemberIds.includes(u.id)) await storage.joinGroup(nglgGroup.id, u.id);
    }

    // Bets — Deez (positive P/L, solid record)
    const deezBets = await storage.getUserBets(deez.id);
    if (deezBets.length === 0) {
      await storage.createBet({ userId: deez.id, groupId: nglgGroup.id, team: "Chiefs",   betType: "spread",    line: -3,   odds: -110, amount: 110, gameDate: new Date("2026-01-15"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: deez.id, groupId: nglgGroup.id, team: "Eagles",   betType: "moneyline", line:  0,   odds: -130, amount: 130, gameDate: new Date("2026-01-20"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: deez.id, groupId: nglgGroup.id, team: "Cowboys",  betType: "spread",    line:  6.5, odds: -110, amount: 110, gameDate: new Date("2026-01-25"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: deez.id, groupId: nglgGroup.id, team: "49ers",    betType: "total",     line: 47.5, odds: -110, amount: 55,  gameDate: new Date("2026-02-01"), result: "lost", profitLoss: -55 });
      await storage.createBet({ userId: deez.id, groupId: nglgGroup.id, team: "Ravens",   betType: "moneyline", line:  0,   odds:  115, amount: 100, gameDate: new Date("2026-02-08"), result: "won",  profitLoss: 115 });
      await storage.createBet({ userId: deez.id, groupId: nglgGroup.id, team: "Dolphins", betType: "spread",    line:  4,   odds: -110, amount: 110, gameDate: new Date("2026-02-15"), result: "won",  profitLoss: 100 });
    }

    // Bets — Hags (positive P/L, hot streak)
    const hagsBets = await storage.getUserBets(hags.id);
    if (hagsBets.length === 0) {
      await storage.createBet({ userId: hags.id, groupId: nglgGroup.id, team: "Celtics",  betType: "spread",    line: -4,   odds: -110, amount: 110, gameDate: new Date("2026-01-18"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: hags.id, groupId: nglgGroup.id, team: "Nuggets",  betType: "moneyline", line:  0,   odds: -140, amount: 140, gameDate: new Date("2026-01-22"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: hags.id, groupId: nglgGroup.id, team: "Bucks",    betType: "total",     line: 222,  odds: -110, amount: 110, gameDate: new Date("2026-01-28"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: hags.id, groupId: nglgGroup.id, team: "Heat",     betType: "spread",    line:  5,   odds: -110, amount: 110, gameDate: new Date("2026-02-03"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: hags.id, groupId: nglgGroup.id, team: "Knicks",   betType: "moneyline", line:  0,   odds:  125, amount: 100, gameDate: new Date("2026-02-10"), result: "won",  profitLoss: 125 });
      await storage.createBet({ userId: hags.id, groupId: nglgGroup.id, team: "Warriors", betType: "spread",    line: -2.5, odds: -110, amount: 110, gameDate: new Date("2026-02-17"), result: "won",  profitLoss: 100 });
    }

    // Bets — Heuss (positive P/L, consistent winner)
    const heussBets = await storage.getUserBets(heuss.id);
    if (heussBets.length === 0) {
      await storage.createBet({ userId: heuss.id, groupId: nglgGroup.id, team: "Lakers",    betType: "moneyline", line:  0,   odds:  110, amount: 100, gameDate: new Date("2026-01-16"), result: "won",  profitLoss: 110 });
      await storage.createBet({ userId: heuss.id, groupId: nglgGroup.id, team: "Suns",      betType: "spread",    line:  3,   odds: -110, amount: 110, gameDate: new Date("2026-01-21"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: heuss.id, groupId: nglgGroup.id, team: "Pacers",    betType: "total",     line: 228,  odds: -110, amount: 110, gameDate: new Date("2026-01-27"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: heuss.id, groupId: nglgGroup.id, team: "Clippers",  betType: "moneyline", line:  0,   odds:  130, amount: 100, gameDate: new Date("2026-02-04"), result: "won",  profitLoss: 130 });
      await storage.createBet({ userId: heuss.id, groupId: nglgGroup.id, team: "Thunder",   betType: "spread",    line: -5,   odds: -110, amount: 110, gameDate: new Date("2026-02-11"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: heuss.id, groupId: nglgGroup.id, team: "Cavaliers", betType: "moneyline", line:  0,   odds: -120, amount: 120, gameDate: new Date("2026-02-18"), result: "won",  profitLoss: 100 });
    }

    // Bets — Campy (positive P/L, big bettor who wins)
    const campyBets = await storage.getUserBets(campy.id);
    if (campyBets.length === 0) {
      await storage.createBet({ userId: campy.id, groupId: nglgGroup.id, team: "Chiefs",     betType: "moneyline", line:  0,   odds: -150, amount: 300, gameDate: new Date("2026-01-17"), result: "won",  profitLoss: 200 });
      await storage.createBet({ userId: campy.id, groupId: nglgGroup.id, team: "Bills",      betType: "spread",    line: -3,   odds: -110, amount: 220, gameDate: new Date("2026-01-23"), result: "won",  profitLoss: 200 });
      await storage.createBet({ userId: campy.id, groupId: nglgGroup.id, team: "Buccaneers", betType: "total",     line: 49,   odds: -110, amount: 220, gameDate: new Date("2026-01-29"), result: "lost", profitLoss: -220 });
      await storage.createBet({ userId: campy.id, groupId: nglgGroup.id, team: "Vikings",    betType: "moneyline", line:  0,   odds:  140, amount: 200, gameDate: new Date("2026-02-05"), result: "won",  profitLoss: 280 });
      await storage.createBet({ userId: campy.id, groupId: nglgGroup.id, team: "Bears",      betType: "spread",    line:  7,   odds: -110, amount: 220, gameDate: new Date("2026-02-12"), result: "won",  profitLoss: 200 });
      await storage.createBet({ userId: campy.id, groupId: nglgGroup.id, team: "Packers",    betType: "moneyline", line:  0,   odds: -125, amount: 250, gameDate: new Date("2026-02-19"), result: "won",  profitLoss: 200 });
    }

    // Bets — Mr. Zee (positive P/L, methodical bettor)
    const mrzeeBets = await storage.getUserBets(mrzee.id);
    if (mrzeeBets.length === 0) {
      await storage.createBet({ userId: mrzee.id, groupId: nglgGroup.id, team: "Nuggets",  betType: "spread",    line: -2,   odds: -110, amount: 110, gameDate: new Date("2026-01-19"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: mrzee.id, groupId: nglgGroup.id, team: "Grizzlies",betType: "moneyline", line:  0,   odds:  145, amount: 100, gameDate: new Date("2026-01-24"), result: "won",  profitLoss: 145 });
      await storage.createBet({ userId: mrzee.id, groupId: nglgGroup.id, team: "Jazz",     betType: "total",     line: 219,  odds: -110, amount: 110, gameDate: new Date("2026-01-30"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: mrzee.id, groupId: nglgGroup.id, team: "Nets",     betType: "spread",    line:  8.5, odds: -110, amount: 110, gameDate: new Date("2026-02-06"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: mrzee.id, groupId: nglgGroup.id, team: "Raptors",  betType: "moneyline", line:  0,   odds:  160, amount: 100, gameDate: new Date("2026-02-13"), result: "won",  profitLoss: 160 });
      await storage.createBet({ userId: mrzee.id, groupId: nglgGroup.id, team: "Magic",    betType: "spread",    line:  3.5, odds: -110, amount: 110, gameDate: new Date("2026-02-20"), result: "won",  profitLoss: 100 });
    }

    // Bets — Beej (negative P/L, can't catch a break)
    const beejBets = await storage.getUserBets(beej.id);
    if (beejBets.length === 0) {
      await storage.createBet({ userId: beej.id, groupId: nglgGroup.id, team: "Cowboys",    betType: "moneyline", line:  0,   odds: -170, amount: 170, gameDate: new Date("2026-01-16"), result: "lost", profitLoss: -170 });
      await storage.createBet({ userId: beej.id, groupId: nglgGroup.id, team: "Patriots",   betType: "spread",    line:  3.5, odds: -110, amount: 110, gameDate: new Date("2026-01-22"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: beej.id, groupId: nglgGroup.id, team: "Steelers",   betType: "total",     line: 43.5, odds: -110, amount: 110, gameDate: new Date("2026-01-28"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: beej.id, groupId: nglgGroup.id, team: "Broncos",    betType: "moneyline", line:  0,   odds:  120, amount: 100, gameDate: new Date("2026-02-04"), result: "lost", profitLoss: -100 });
      await storage.createBet({ userId: beej.id, groupId: nglgGroup.id, team: "Seahawks",   betType: "spread",    line: -4,   odds: -110, amount: 110, gameDate: new Date("2026-02-11"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: beej.id, groupId: nglgGroup.id, team: "Rams",       betType: "moneyline", line:  0,   odds: -145, amount: 145, gameDate: new Date("2026-02-18"), result: "lost", profitLoss: -145 });
      await storage.createBet({ userId: beej.id, groupId: nglgGroup.id, team: "Cardinals",  betType: "spread",    line:  9,   odds: -110, amount: 110, gameDate: new Date("2026-02-25"), result: "lost", profitLoss: -110 });
    }

    // Bets — UMP (negative P/L, consistently wrong)
    const umpBets = await storage.getUserBets(ump.id);
    if (umpBets.length === 0) {
      await storage.createBet({ userId: ump.id, groupId: nglgGroup.id, team: "Falcons",    betType: "spread",    line: -3.5, odds: -110, amount: 110, gameDate: new Date("2026-01-17"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: ump.id, groupId: nglgGroup.id, team: "Saints",     betType: "moneyline", line:  0,   odds: -160, amount: 160, gameDate: new Date("2026-01-23"), result: "lost", profitLoss: -160 });
      await storage.createBet({ userId: ump.id, groupId: nglgGroup.id, team: "Panthers",   betType: "total",     line: 41,   odds: -110, amount: 110, gameDate: new Date("2026-01-29"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: ump.id, groupId: nglgGroup.id, team: "Jaguars",    betType: "spread",    line:  6.5, odds: -110, amount: 110, gameDate: new Date("2026-02-05"), result: "won",  profitLoss: 100 });
      await storage.createBet({ userId: ump.id, groupId: nglgGroup.id, team: "Titans",     betType: "moneyline", line:  0,   odds:  135, amount: 100, gameDate: new Date("2026-02-12"), result: "lost", profitLoss: -100 });
      await storage.createBet({ userId: ump.id, groupId: nglgGroup.id, team: "Raiders",    betType: "spread",    line: -1.5, odds: -110, amount: 110, gameDate: new Date("2026-02-19"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: ump.id, groupId: nglgGroup.id, team: "Chargers",   betType: "moneyline", line:  0,   odds: -130, amount: 130, gameDate: new Date("2026-02-26"), result: "lost", profitLoss: -130 });
      await storage.createBet({ userId: ump.id, groupId: nglgGroup.id, team: "Colts",      betType: "total",     line: 44.5, odds: -110, amount: 110, gameDate: new Date("2026-03-04"), result: "lost", profitLoss: -110 });
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
