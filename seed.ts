import { storage } from "./server/storage";

async function seedDatabase() {
  console.log("Seeding database...");
  
  try {
    // Create users
    let user1 = await storage.getUserByEmail("alice@example.com");
    if (!user1) {
      user1 = await storage.createUser({
        email: "alice@example.com",
        password: "password123",
        name: "Alice",
      });
    }

    let user2 = await storage.getUserByEmail("bob@example.com");
    if (!user2) {
      user2 = await storage.createUser({
        email: "bob@example.com",
        password: "password123",
        name: "Bob",
      });
    }

    let user3 = await storage.getUserByEmail("charlie@example.com");
    if (!user3) {
      user3 = await storage.createUser({
        email: "charlie@example.com",
        password: "password123",
        name: "Charlie",
      });
    }

    let user4 = await storage.getUserByEmail("diana@example.com");
    if (!user4) {
      user4 = await storage.createUser({
        email: "diana@example.com",
        password: "password123",
        name: "Diana",
      });
    }

    // Create a group (or fetch existing)
    let group = await storage.getGroupByInviteCode("SEED123");
    if (!group) {
      group = await storage.createGroup({
        name: "Weekend Warriors",
        inviteCode: "SEED123"
      }, user1.id);
    }

    // Ensure all users are members of the group
    const members = await storage.getGroupMembers(group.id);
    const memberIds = members.map((m: any) => m.id);

    if (!memberIds.includes(user2.id)) await storage.joinGroup(group.id, user2.id);
    if (!memberIds.includes(user3.id)) await storage.joinGroup(group.id, user3.id);
    if (!memberIds.includes(user4.id)) await storage.joinGroup(group.id, user4.id);

    // Bets for Alice (strong record)
    const aliceBets = await storage.getUserBets(user1.id);
    if (aliceBets.length === 0) {
      await storage.createBet({ userId: user1.id, groupId: group.id, team: "Knicks", betType: "spread", line: -4.5, odds: -110, amount: 50, gameDate: new Date("2026-02-01"), result: "won", profitLoss: 45.45 });
      await storage.createBet({ userId: user1.id, groupId: group.id, team: "Lakers", betType: "moneyline", line: 0, odds: 120, amount: 100, gameDate: new Date("2026-02-05"), result: "won", profitLoss: 120 });
      await storage.createBet({ userId: user1.id, groupId: group.id, team: "Warriors", betType: "total", line: 220.5, odds: -110, amount: 110, gameDate: new Date("2026-02-10"), result: "won", profitLoss: 100 });
      await storage.createBet({ userId: user1.id, groupId: group.id, team: "Celtics", betType: "spread", line: -5.5, odds: -110, amount: 55, gameDate: new Date("2026-02-15"), result: "lost", profitLoss: -55 });
      await storage.createBet({ userId: user1.id, groupId: group.id, team: "Suns", betType: "moneyline", line: 0, odds: -150, amount: 150, gameDate: new Date("2026-02-20"), result: "won", profitLoss: 100 });
    }

    // Bets for Bob (decent record)
    const bobBets = await storage.getUserBets(user2.id);
    if (bobBets.length === 0) {
      await storage.createBet({ userId: user2.id, groupId: group.id, team: "Bulls", betType: "spread", line: 4.5, odds: -110, amount: 50, gameDate: new Date("2026-02-01"), result: "lost", profitLoss: -50 });
      await storage.createBet({ userId: user2.id, groupId: group.id, team: "Heat", betType: "moneyline", line: 0, odds: 110, amount: 100, gameDate: new Date("2026-02-07"), result: "won", profitLoss: 110 });
      await storage.createBet({ userId: user2.id, groupId: group.id, team: "Bucks", betType: "spread", line: -3, odds: -110, amount: 110, gameDate: new Date("2026-02-12"), result: "won", profitLoss: 100 });
      await storage.createBet({ userId: user2.id, groupId: group.id, team: "Nets", betType: "total", line: 215, odds: -110, amount: 55, gameDate: new Date("2026-02-18"), result: "lost", profitLoss: -55 });
      await storage.createBet({ userId: user2.id, groupId: group.id, team: "Pacers", betType: "moneyline", line: 0, odds: 130, amount: 100, gameDate: new Date("2026-02-22"), result: "won", profitLoss: 130 });
    }

    // Bets for Charlie (bad record — mostly loses)
    const charlieBets = await storage.getUserBets(user3.id);
    if (charlieBets.length === 0) {
      await storage.createBet({ userId: user3.id, groupId: group.id, team: "Clippers", betType: "spread", line: -6, odds: -110, amount: 110, gameDate: new Date("2026-02-02"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user3.id, groupId: group.id, team: "Pistons", betType: "moneyline", line: 0, odds: -180, amount: 180, gameDate: new Date("2026-02-06"), result: "lost", profitLoss: -180 });
      await storage.createBet({ userId: user3.id, groupId: group.id, team: "Magic", betType: "spread", line: 2.5, odds: -110, amount: 110, gameDate: new Date("2026-02-11"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user3.id, groupId: group.id, team: "Hornets", betType: "total", line: 218, odds: -110, amount: 110, gameDate: new Date("2026-02-16"), result: "won", profitLoss: 100 });
      await storage.createBet({ userId: user3.id, groupId: group.id, team: "Wizards", betType: "moneyline", line: 0, odds: -130, amount: 130, gameDate: new Date("2026-02-21"), result: "lost", profitLoss: -130 });
      await storage.createBet({ userId: user3.id, groupId: group.id, team: "Thunder", betType: "spread", line: -7, odds: -110, amount: 110, gameDate: new Date("2026-02-25"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user3.id, groupId: group.id, team: "Jazz", betType: "moneyline", line: 0, odds: 150, amount: 100, gameDate: new Date("2026-02-28"), result: "lost", profitLoss: -100 });
    }

    // Bets for Diana (very bad record — almost all losses)
    const dianaBets = await storage.getUserBets(user4.id);
    if (dianaBets.length === 0) {
      await storage.createBet({ userId: user4.id, groupId: group.id, team: "Cavaliers", betType: "spread", line: -4, odds: -110, amount: 110, gameDate: new Date("2026-02-03"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user4.id, groupId: group.id, team: "Raptors", betType: "moneyline", line: 0, odds: -160, amount: 160, gameDate: new Date("2026-02-08"), result: "lost", profitLoss: -160 });
      await storage.createBet({ userId: user4.id, groupId: group.id, team: "Grizzlies", betType: "total", line: 224, odds: -110, amount: 110, gameDate: new Date("2026-02-13"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user4.id, groupId: group.id, team: "Pelicans", betType: "spread", line: 5.5, odds: -110, amount: 110, gameDate: new Date("2026-02-17"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user4.id, groupId: group.id, team: "Rockets", betType: "moneyline", line: 0, odds: 140, amount: 100, gameDate: new Date("2026-02-23"), result: "won", profitLoss: 140 });
      await storage.createBet({ userId: user4.id, groupId: group.id, team: "Kings", betType: "spread", line: -2, odds: -110, amount: 110, gameDate: new Date("2026-02-26"), result: "lost", profitLoss: -110 });
      await storage.createBet({ userId: user4.id, groupId: group.id, team: "Timberwolves", betType: "moneyline", line: 0, odds: -200, amount: 200, gameDate: new Date("2026-03-01"), result: "lost", profitLoss: -200 });
      await storage.createBet({ userId: user4.id, groupId: group.id, team: "Spurs", betType: "total", line: 210, odds: -110, amount: 110, gameDate: new Date("2026-03-04"), result: "lost", profitLoss: -110 });
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
