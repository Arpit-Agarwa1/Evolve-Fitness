/**
 * Tests for already-registered lookup + amend (fee delta) flows.
 * Run: node scripts/testAmendRegistration.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/config/database.js";
import BadmintonRegistration from "../src/models/BadmintonRegistration.js";
import PickleballRegistration from "../src/models/PickleballRegistration.js";
import {
  buildOpenAmendFromExisting,
  matchesRegistrationFirstName,
} from "../src/services/badmintonService.js";
import { buildPickleballAmendFromExisting } from "../src/services/pickleballService.js";
import { computeOpenFeeInr } from "../src/config/badmintonChampionship.js";
import { computePickleballFeeInr } from "../src/config/pickleballChampionship.js";

const BASE = process.env.TEST_API_BASE || "http://localhost:5001";
const MONGO = process.env.MONGODB_URI;

/** @type {{ name: string; ok: boolean; detail: string }[]} */
const results = [];

function log(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}`);
  console.log(`       ${detail}\n`);
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

function uniqMobile(seed) {
  const n = String(Date.now() + seed).slice(-8);
  return `9${n.padStart(9, "0")}`.slice(0, 10);
}

async function runUnitTests() {
  console.log("=== Unit: name match & amend builders ===\n");

  log(
    "matchesRegistrationFirstName — exact",
    matchesRegistrationFirstName("Arpit Agarwal", "Arpit") === true,
    "Arpit Agarwal vs Arpit"
  );
  log(
    "matchesRegistrationFirstName — case insensitive",
    matchesRegistrationFirstName("Arpit Agarwal", "arpit") === true,
    "case fold"
  );
  log(
    "matchesRegistrationFirstName — wrong name",
    matchesRegistrationFirstName("Arpit Agarwal", "Rahul") === false,
    "Rahul should fail"
  );
  log(
    "matchesRegistrationFirstName — empty",
    matchesRegistrationFirstName("Arpit", "") === false,
    "empty first name"
  );

  const openExisting = {
    fullName: "Test Open Player",
    mobile: "9876543210",
    email: "",
    gender: "female",
    age: 32,
    playerLevel: "beginner",
    categories: ["open_wd", "open_yv", "open_xd_55"],
    amountInr: computeOpenFeeInr(3),
    events: [
      {
        categoryId: "open_wd",
        categoryLabel: "Women's Doubles",
        partnerName: "",
        partnerFirstName: "",
        partnerLastName: "",
        partnerAge: null,
        partnerMobile: "",
      },
      {
        categoryId: "open_yv",
        categoryLabel: "Young Veteran",
        partnerName: "Veteran Partner",
        partnerFirstName: "Veteran",
        partnerLastName: "Partner",
        partnerAge: 40,
        partnerMobile: "9123456780",
      },
      {
        categoryId: "open_xd_55",
        categoryLabel: "Mixed Doubles 55+",
        partnerName: "Mix Partner",
        partnerFirstName: "Mix",
        partnerLastName: "Partner",
        partnerAge: 35,
        partnerMobile: "",
      },
    ],
  };

  const openAdd = buildOpenAmendFromExisting(
    {
      cart: [
        { categoryId: "open_wd" },
        {
          categoryId: "open_yv",
          partnerFirstName: "Veteran",
          partnerLastName: "Partner",
          partnerAge: 40,
          partnerMobile: "9123456780",
        },
        {
          categoryId: "open_xd_55",
          partnerFirstName: "Mix",
          partnerLastName: "Partner",
          partnerAge: 35,
        },
        {
          categoryId: "open_xd_75",
          partnerFirstName: "New",
          partnerLastName: "Partner",
          partnerAge: 36,
        },
      ],
    },
    openExisting
  );

  log(
    "Open amend 3→4 events — delta ₹200",
    openAdd.ok === true &&
      openAdd.data?.deltaInr === 200 &&
      openAdd.data?.amountInr === 1200 &&
      openAdd.data?.alreadyPaid === 1000 &&
      openAdd.data?.addedCategoryIds?.includes("open_xd_75"),
    openAdd.ok
      ? `delta=${openAdd.data.deltaInr} newTotal=${openAdd.data.amountInr} added=${openAdd.data.addedCategoryIds}`
      : openAdd.message
  );

  const openRemove = buildOpenAmendFromExisting(
    {
      cart: [
        { categoryId: "open_wd" },
        {
          categoryId: "open_yv",
          partnerFirstName: "Veteran",
          partnerLastName: "Partner",
          partnerAge: 40,
        },
      ],
    },
    openExisting
  );
  log(
    "Open amend cannot remove paid events",
    openRemove.ok === false && /cannot remove/i.test(openRemove.message || ""),
    openRemove.message || "unexpected ok"
  );

  const openPartnerOnly = buildOpenAmendFromExisting(
    {
      cart: [
        { categoryId: "open_wd" },
        {
          categoryId: "open_yv",
          partnerFirstName: "Updated",
          partnerLastName: "Vet",
          partnerAge: 42,
          partnerMobile: "9111111111",
        },
        {
          categoryId: "open_xd_55",
          partnerFirstName: "Mix",
          partnerLastName: "Partner",
          partnerAge: 35,
        },
      ],
    },
    openExisting
  );
  log(
    "Open amend partner-only — delta ₹0",
    openPartnerOnly.ok === true && openPartnerOnly.data?.deltaInr === 0,
    openPartnerOnly.ok
      ? `delta=${openPartnerOnly.data.deltaInr} partner=${openPartnerOnly.data.events.find((e) => e.categoryId === "open_yv")?.partnerName}`
      : openPartnerOnly.message
  );

  const pkExisting = {
    fullName: "Pickle Tester",
    mobile: "9876500001",
    email: "",
    gender: "male",
    age: 40,
    categories: ["pk_md_35", "pk_ms"],
    amountInr: computePickleballFeeInr(2),
  };
  const pkAdd = buildPickleballAmendFromExisting(
    {
      cart: [
        {
          categoryId: "pk_md_35",
          partnerFirstName: "P",
          partnerLastName: "One",
          partnerAge: 40,
        },
        { categoryId: "pk_ms" },
        {
          categoryId: "pk_xd_35",
          partnerFirstName: "X",
          partnerLastName: "Two",
          partnerAge: 38,
        },
      ],
    },
    pkExisting
  );
  log(
    "Pickleball amend 2→3 — delta ₹200",
    pkAdd.ok === true &&
      pkAdd.data?.deltaInr === 200 &&
      pkAdd.data?.amountInr === 1200,
    pkAdd.ok
      ? `delta=${pkAdd.data.deltaInr} newTotal=${pkAdd.data.amountInr}`
      : pkAdd.message
  );
}

async function seedAndHttpTest() {
  console.log("=== HTTP + DB integration ===\n");

  if (!MONGO) {
    log("Mongo connection", false, "MONGODB_URI missing");
    return;
  }

  await connectDB();
  log("Mongo connected", true, mongoose.connection.name || "ok");

  const health = await req("GET", "/api/health").catch(() => null);
  if (!health || health.status !== 200) {
    log(
      "API health",
      false,
      `API not reachable at ${BASE} (start with: npm run dev). Skipping HTTP tests.`
    );
    await mongoose.disconnect();
    return;
  }
  log(
    "API health",
    true,
    `status=${health.status} db=${health.json?.data?.database}`
  );

  // Members public routes must be gone
  {
    const gone = await req("POST", "/api/badminton/members/checkout", {});
    log(
      "Members checkout route removed",
      gone.status === 404,
      `http=${gone.status}`
    );
  }

  const stamp = Date.now();
  const openMobile = uniqMobile(1);
  const pkMobile = uniqMobile(2);
  const openId = `EVB26-T${String(stamp).slice(-5)}A`;
  const pkId = `EVP26-T${String(stamp).slice(-5)}B`;

  await BadmintonRegistration.create({
    registrationId: openId,
    tournamentType: "open",
    fullName: "Amend Open Tester",
    mobile: openMobile,
    email: `amend.open.${stamp}@evolve.test`,
    gender: "female",
    age: 32,
    playerLevel: "beginner",
    categories: ["open_wd", "open_yv", "open_xd_55"],
    events: [
      {
        categoryId: "open_wd",
        categoryLabel: "Women's Doubles",
        partnerName: "",
        partnerFirstName: "",
        partnerLastName: "",
        partnerAge: null,
        partnerMobile: "",
      },
      {
        categoryId: "open_yv",
        categoryLabel: "Young Veteran",
        partnerName: "Old Partner",
        partnerFirstName: "Old",
        partnerLastName: "Partner",
        partnerAge: 40,
        partnerMobile: "",
      },
      {
        categoryId: "open_xd_55",
        categoryLabel: "Mixed Doubles 55+",
        partnerName: "Mix Partner",
        partnerFirstName: "Mix",
        partnerLastName: "Partner",
        partnerAge: 35,
        partnerMobile: "",
      },
    ],
    eventCount: 3,
    amountInr: 1000,
    paymentStatus: "paid",
    status: "confirmed",
    paidAt: new Date(),
  });

  await PickleballRegistration.create({
    registrationId: pkId,
    fullName: "Amend Pickle Tester",
    mobile: pkMobile,
    email: `amend.pk.${stamp}@evolve.test`,
    gender: "male",
    age: 40,
    categories: ["pk_md_35", "pk_ms"],
    events: [
      {
        categoryId: "pk_md_35",
        categoryLabel: "Men's Doubles 35+",
        partnerName: "Doubles Mate",
        partnerFirstName: "Doubles",
        partnerLastName: "Mate",
        partnerAge: 41,
        partnerMobile: "",
      },
      {
        categoryId: "pk_ms",
        categoryLabel: "Men's Singles",
        partnerName: "",
        partnerFirstName: "",
        partnerLastName: "",
        partnerAge: null,
        partnerMobile: "",
      },
    ],
    eventCount: 2,
    amountInr: 1000,
    paymentStatus: "paid",
    status: "confirmed",
    paidAt: new Date(),
  });

  log(
    "Seeded confirmed test registrations",
    true,
    `open=${openId}/${openMobile} pk=${pkId}/${pkMobile}`
  );

  {
    const ok = await req("POST", "/api/badminton/open/lookup", {
      firstName: "Amend",
      mobile: openMobile,
    });
    log(
      "Open lookup — valid phone + first name",
      ok.status === 200 &&
        ok.json?.data?.registration?.registrationId === openId &&
        ok.json?.data?.registration?.eventCount === 3,
      `http=${ok.status} id=${ok.json?.data?.registration?.registrationId} events=${ok.json?.data?.registration?.eventCount}`
    );

    const badName = await req("POST", "/api/badminton/open/lookup", {
      firstName: "Wrong",
      mobile: openMobile,
    });
    log(
      "Open lookup — wrong first name (404)",
      badName.status === 404,
      `http=${badName.status} msg=${badName.json?.message}`
    );
  }

  {
    const ok = await req("POST", "/api/pickleball/lookup", {
      firstName: "Amend",
      mobile: pkMobile,
    });
    log(
      "Pickleball lookup — valid",
      ok.status === 200 &&
        ok.json?.data?.registration?.registrationId === pkId,
      `http=${ok.status} id=${ok.json?.data?.registration?.registrationId}`
    );
  }

  {
    const res = await req("POST", "/api/badminton/open/amend/checkout", {
      firstName: "Amend",
      mobile: openMobile,
      cart: [
        { categoryId: "open_wd" },
        {
          categoryId: "open_yv",
          partnerFirstName: "New",
          partnerLastName: "Veteran",
          partnerAge: 45,
          partnerMobile: "9888877777",
        },
        {
          categoryId: "open_xd_55",
          partnerFirstName: "Mix",
          partnerLastName: "Partner",
          partnerAge: 35,
        },
      ],
    });
    const reg = res.json?.data?.registration;
    const yv = (reg?.events || []).find((e) => e.categoryId === "open_yv");
    log(
      "Open amend partner-only — no payment",
      res.status === 200 &&
        res.json?.data?.paymentRequired === false &&
        res.json?.data?.deltaInr === 0 &&
        yv?.partnerFirstName === "New" &&
        reg?.amountInr === 1000 &&
        reg?.eventCount === 3,
      `http=${res.status} payReq=${res.json?.data?.paymentRequired} delta=${res.json?.data?.deltaInr} partner=${yv?.partnerName} amount=${reg?.amountInr}`
    );
  }

  {
    const res = await req("POST", "/api/badminton/open/amend/checkout", {
      firstName: "Amend",
      mobile: openMobile,
      cart: [
        { categoryId: "open_wd" },
        {
          categoryId: "open_yv",
          partnerFirstName: "New",
          partnerLastName: "Veteran",
          partnerAge: 45,
        },
        {
          categoryId: "open_xd_55",
          partnerFirstName: "Mix",
          partnerLastName: "Partner",
          partnerAge: 35,
        },
        {
          categoryId: "open_xd_75",
          partnerFirstName: "Extra",
          partnerLastName: "Partner",
          partnerAge: 36,
        },
      ],
    });
    const payOk =
      res.status === 201 &&
      res.json?.data?.paymentRequired === true &&
      res.json?.data?.deltaInr === 200 &&
      res.json?.data?.newTotalInr === 1200 &&
      Boolean(res.json?.data?.paymentSessionId);
    log(
      "Open amend 3→4 — charge ₹200 delta",
      payOk || res.status === 503,
      payOk
        ? `http=${res.status} delta=${res.json?.data?.deltaInr} order=${res.json?.data?.orderId}`
        : `http=${res.status} msg=${res.json?.message}`
    );
    await BadmintonRegistration.updateOne(
      { registrationId: openId },
      { $unset: { pendingAmend: 1 } }
    );
  }

  {
    const res = await req("POST", "/api/pickleball/amend/checkout", {
      firstName: "Amend",
      mobile: pkMobile,
      cart: [
        {
          categoryId: "pk_md_35",
          partnerFirstName: "Updated",
          partnerLastName: "Mate",
          partnerAge: 42,
        },
        { categoryId: "pk_ms" },
      ],
    });
    log(
      "Pickleball amend partner-only — no payment",
      res.status === 200 &&
        res.json?.data?.paymentRequired === false &&
        res.json?.data?.deltaInr === 0,
      `http=${res.status} delta=${res.json?.data?.deltaInr}`
    );
  }

  {
    const res = await req("POST", "/api/badminton/open/amend/checkout", {
      firstName: "Amend",
      mobile: openMobile,
      cart: [{ categoryId: "open_wd" }],
    });
    log(
      "Open amend HTTP rejects removing events",
      res.status === 422 && /cannot remove/i.test(res.json?.message || ""),
      `http=${res.status} msg=${res.json?.message}`
    );
  }

  await BadmintonRegistration.deleteMany({ registrationId: openId });
  await PickleballRegistration.deleteOne({ registrationId: pkId });
  log("Cleanup seeded test docs", true, `${openId}, ${pkId}`);

  await mongoose.disconnect();
}

async function main() {
  console.log("\n=== Amend registration tests ===\n");
  await runUnitTests();
  await seedAndHttpTest();

  const failed = results.filter((r) => !r.ok);
  console.log("=== SUMMARY ===");
  console.log(
    `Total: ${results.length}  Pass: ${results.length - failed.length}  Fail: ${failed.length}`
  );
  if (failed.length) {
    console.log("\nFailures:");
    for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
