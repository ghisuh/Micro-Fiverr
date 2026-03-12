import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const password = await bcrypt.hash("password123", 12);

  // Users
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { email: "alice@example.com", name: "Alice Buyer", password },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: { email: "bob@example.com", name: "Bob Seller", password },
  });

  // Gigs
  const gig1 = await prisma.gig.create({
    data: {
      title: "Design a modern landing page",
      description: "Crisp, responsive landing page with Figma + handoff.",
      slug: "design-modern-landing-page",
      price: 120,
      tags: ["design", "landing page"],
      gallery: [],
      userId: bob.id,
      packages: {
        create: [
          { name: "Basic", description: "One section", price: 80, deliveryDays: 3, revisions: 1 },
          { name: "Standard", description: "Full page", price: 120, deliveryDays: 5, revisions: 2 },
          { name: "Premium", description: "Multi-page", price: 250, deliveryDays: 7, revisions: 3 },
        ],
      },
    },
  });

  const gig2 = await prisma.gig.create({
    data: {
      title: "Implement a Next.js API",
      description: "Secure REST endpoints with Prisma + PostgreSQL.",
      slug: "implement-nextjs-api",
      price: 180,
      tags: ["backend", "next.js"],
      gallery: [],
      userId: bob.id,
      packages: {
        create: [
          { name: "Basic", description: "One endpoint", price: 120, deliveryDays: 3, revisions: 1 },
          { name: "Standard", description: "Three endpoints", price: 180, deliveryDays: 5, revisions: 1 },
          { name: "Premium", description: "Full CRUD", price: 320, deliveryDays: 7, revisions: 2 },
        ],
      },
    },
  });

  // Orders with reviews
  const order = await prisma.order.create({
    data: {
      status: "COMPLETED",
      price: 120,
      paidAt: new Date(),
      gigId: gig1.id,
      packageId: (await prisma.gigPackage.findFirst({ where: { gigId: gig1.id, name: "Standard" } }))?.id,
      buyerId: alice.id,
      sellerId: bob.id,
      reviews: {
        create: {
          rating: 5,
          comment: "Fantastic design and fast delivery!",
          userId: alice.id,
          gigId: gig1.id,
        },
      },
      messages: {
        create: [{ text: "Thanks!", senderId: bob.id }],
      },
    },
  });

  console.log({ alice, bob, gig1: gig1.slug, gig2: gig2.slug, order: order.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
