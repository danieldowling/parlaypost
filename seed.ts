import { storage } from "./server/storage";

async function seedDatabase() {
  console.log("Seeding database...");
  
  // Create users
  let user1, user2;
  try {
    user1 = await storage.getUserByEmail("alice@example.com");
    if (!user1) {
      user1 = await storage.createUser({
        email: "alice@example.com",
        password: "password123",
        name: "Alice",
      });
    }

    user2 = await storage.getUserByEmail("bob@example.com");
    if (!user2) {
      user2 = await storage.createUser({
        email: "bob@example.com",
        password: "password123",
        name: "Bob",
      });
    }

    // Create a group
    let group = await storage.getGroupByInviteCode("SEED123");
    if (!group) {
      group = await storage.createGroup({
        name: "Weekend Warriors",
        inviteCode: "SEED123"
      }, user1.id);
      
      await storage.joinGroup(group.id, user2.id);
    }
    
    // Add some bets for Alice
    const aliceBets = await storage.getUserBets(user1.id);
    if (aliceBets.length === 0) {
      await storage.createBet({
        userId: user1.id,
        groupId: group.id,
        team: "Knicks",
        betType: "spread",
        line: -4.5,
        odds: -110,
        amount: 50,
        gameDate: new Date(),
        result: "won",
        profitLoss: 45.45
      });
      await storage.createBet({
        userId: user1.id,
        groupId: group.id,
        team: "Lakers",
        betType: "moneyline",
        line: 0,
        odds: +120,
        amount: 100,
        gameDate: new Date(),
        result: "pending",
        profitLoss: 0
      });
    }

    // Add some bets for Bob
    const bobBets = await storage.getUserBets(user2.id);
    if (bobBets.length === 0) {
      await storage.createBet({
        userId: user2.id,
        groupId: group.id,
        team: "Bulls",
        betType: "spread",
        line: +4.5,
        odds: -110,
        amount: 50,
        gameDate: new Date(),
        result: "lost",
        profitLoss: -50
      });
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
