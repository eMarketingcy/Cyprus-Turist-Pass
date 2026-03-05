import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.qrToken.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.merchantProfile.deleteMany();
  await prisma.rentalContract.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformSettings.deleteMany();

  // Create platform settings
  await prisma.platformSettings.create({
    data: {
      defaultPlatformFee: 10,
      minimumDiscountRate: 5,
      maximumDiscountRate: 25,
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  // Create Admin user
  await prisma.user.create({
    data: {
      email: "admin@cypruspass.com",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  });

  // Create Customer user with active contract
  const customer = await prisma.user.create({
    data: {
      email: "tourist@example.com",
      passwordHash,
      firstName: "John",
      lastName: "Tourist",
      role: "CUSTOMER",
      customerProfile: { create: {} },
    },
    include: { customerProfile: true },
  });

  // Create rental contract
  const contract = await prisma.rentalContract.create({
    data: {
      contractNumber: "TEST-12345",
      agencyName: "Sixt",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      vehicleClass: "Compact SUV",
      isValid: true,
    },
  });

  // Link contract to customer
  await prisma.customerProfile.update({
    where: { id: customer.customerProfile!.id },
    data: { activeContractId: contract.id },
  });

  // Create Merchant users with profiles
  const merchants = [
    {
      email: "ocean@merchant.com",
      firstName: "Maria",
      lastName: "Stavrou",
      business: {
        businessName: "Ocean View Seafood",
        businessType: "RESTAURANT",
        description: "Fresh Mediterranean seafood with stunning ocean views. Try our famous grilled octopus and local wines.",
        address: "Poseidonos Ave 42",
        city: "Paphos",
        latitude: 34.7553,
        longitude: 32.4218,
        imageUrl: "https://picsum.photos/seed/seafood/400/250",
        discountRate: 15,
        status: "APPROVED",
        platformFeeRate: 10,
      },
    },
    {
      email: "aphrodite@merchant.com",
      firstName: "Andreas",
      lastName: "Christou",
      business: {
        businessName: "Aphrodite Hills Resort",
        businessType: "HOTEL",
        description: "Luxury 5-star resort set among rolling hills with spa, golf course, and infinity pool overlooking the sea.",
        address: "Aphrodite Hills Road 1",
        city: "Limassol",
        latitude: 34.7225,
        longitude: 32.6519,
        imageUrl: "https://picsum.photos/seed/hotel/400/250",
        discountRate: 10,
        status: "APPROVED",
        platformFeeRate: 8,
      },
    },
    {
      email: "bluelagoon@merchant.com",
      firstName: "Elena",
      lastName: "Paphitis",
      business: {
        businessName: "Blue Lagoon Cruises",
        businessType: "ACTIVITY",
        description: "Daily boat trips to the stunning Blue Lagoon. Includes snorkeling gear, lunch, and unlimited drinks.",
        address: "Latchi Harbour",
        city: "Akamas",
        latitude: 35.0426,
        longitude: 32.3841,
        imageUrl: "https://picsum.photos/seed/cruise/400/250",
        discountRate: 20,
        status: "APPROVED",
        platformFeeRate: 12,
      },
    },
    {
      email: "taverna@merchant.com",
      firstName: "Nikos",
      lastName: "Georgiou",
      business: {
        businessName: "Taverna Agia Napa",
        businessType: "RESTAURANT",
        description: "Traditional Cypriot meze in a charming courtyard. Live bouzouki music every Friday and Saturday.",
        address: "Nissi Avenue 18",
        city: "Ayia Napa",
        latitude: 34.9823,
        longitude: 33.9982,
        imageUrl: "https://picsum.photos/seed/taverna/400/250",
        discountRate: 5,
        status: "APPROVED",
        platformFeeRate: 10,
      },
    },
    {
      email: "spa@merchant.com",
      firstName: "Katerina",
      lastName: "Loizou",
      business: {
        businessName: "Cyprus Zen Spa",
        businessType: "SPA",
        description: "Award-winning spa offering traditional hammam treatments, hot stone massage, and aromatherapy.",
        address: "Old Town Square 7",
        city: "Larnaca",
        latitude: 34.9186,
        longitude: 33.6340,
        imageUrl: "https://picsum.photos/seed/spa/400/250",
        discountRate: 12,
        status: "APPROVED",
        platformFeeRate: 10,
      },
    },
    {
      email: "pending@merchant.com",
      firstName: "George",
      lastName: "Demetriou",
      business: {
        businessName: "Mountain Adventures Cyprus",
        businessType: "ACTIVITY",
        description: "Guided hiking, mountain biking, and rock climbing in the Troodos Mountains.",
        address: "Troodos Road 5",
        city: "Troodos",
        latitude: 34.9285,
        longitude: 32.8809,
        imageUrl: "https://picsum.photos/seed/mountain/400/250",
        discountRate: 15,
        status: "PENDING",
        platformFeeRate: null,
      },
    },
  ];

  for (const m of merchants) {
    await prisma.user.create({
      data: {
        email: m.email,
        passwordHash,
        firstName: m.firstName,
        lastName: m.lastName,
        role: "MERCHANT",
        merchantProfile: { create: m.business },
      },
    });
  }

  // Create some sample transactions
  const customerProfile = customer.customerProfile!;
  const approvedMerchants = await prisma.merchantProfile.findMany({ where: { status: "APPROVED" } });

  for (const merchant of approvedMerchants.slice(0, 4)) {
    const originalAmount = Math.floor(Math.random() * 200) + 30;
    const discountRate = merchant.discountRate;
    const discountAmount = originalAmount * (discountRate / 100);
    const finalAmount = originalAmount - discountAmount;
    const platformFeeRate = merchant.platformFeeRate ?? 10;
    const platformFee = finalAmount * (platformFeeRate / 100);
    const merchantPayout = finalAmount - platformFee;

    await prisma.transaction.create({
      data: {
        customerId: customerProfile.id,
        merchantId: merchant.id,
        originalAmount,
        discountRate,
        discountAmount: Number(discountAmount.toFixed(2)),
        finalAmount: Number(finalAmount.toFixed(2)),
        platformFeeRate,
        platformFee: Number(platformFee.toFixed(2)),
        merchantPayout: Number(merchantPayout.toFixed(2)),
        status: "COMPLETED",
        stripePaymentId: `pi_seed_${Math.random().toString(36).substr(2, 12)}`,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
      },
    });
  }

  console.log("Database seeded successfully!");
  console.log("");
  console.log("Demo accounts:");
  console.log("  Admin:    admin@cypruspass.com / password123");
  console.log("  Tourist:  tourist@example.com / password123");
  console.log("  Merchant: ocean@merchant.com / password123");
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
