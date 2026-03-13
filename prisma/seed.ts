import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);

  const seller = await prisma.user.upsert({
    where: { email: "demo-seller@microfiverr.com" },
    update: {},
    create: {
      email: "demo-seller@microfiverr.com",
      name: "Bob Seller",
      password,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "demo-buyer@microfiverr.com" },
    update: {},
    create: {
      email: "demo-buyer@microfiverr.com",
      name: "Jane Doe",
      password,
    },
  });

  const gig = await prisma.gig.upsert({
    where: { slug: "implement-a-nextjs-api" },
    update: {},
    create: {
      title: "Implement a Next.js API",
      description: "Secure REST endpoints with Prisma + PostgreSQL.",
      slug: "implement-a-nextjs-api",
      price: 120,
      tags: ["backend", "next.js"],
      gallery: [],
      userId: seller.id,
      packages: {
        create: [
          {
            name: "Basic",
            description: "One endpoint",
            price: 120,
            deliveryDays: 3,
            revisions: 1,
          },
          {
            name: "Standard",
            description: "Three endpoints",
            price: 180,
            deliveryDays: 5,
            revisions: 1,
          },
          {
            name: "Premium",
            description: "Full CRUD",
            price: 320,
            deliveryDays: 7,
            revisions: 2,
          },
        ],
      },
    },
    include: { packages: true },
  });

  await prisma.order.upsert({
    where: { id: "seed-order-1" },
    update: {},
    create: {
      id: "seed-order-1",
      status: "COMPLETED",
      price: gig.packages[0]?.price ?? 120,
      paidAt: new Date(),
      gigId: gig.id,
      packageId: gig.packages[0]?.id,
      buyerId: buyer.id,
      sellerId: seller.id,
    },
  });

  console.log("Seed data ready:");
  console.log("- Demo seller: demo-seller@microfiverr.com / password123");
  console.log("- Demo buyer:  demo-buyer@microfiverr.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
