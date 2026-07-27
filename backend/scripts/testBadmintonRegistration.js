/**
 * Manual QA script for badminton registration API.
 * Run: node scripts/testBadmintonRegistration.js
 */
import "dotenv/config";

const BASE = process.env.TEST_API_BASE || "http://localhost:5001";

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

function basePerson(overrides = {}) {
  const n = String(Date.now()).slice(-6);
  return {
    fullName: `Test Player ${n}`,
    mobile: `98${String(10000000 + (Number(n) % 89999999)).padStart(8, "0")}`.slice(0, 10),
    email: `test.player.${n}@example.com`,
    gender: "male",
    dateOfBirth: "1960-01-15",
    city: "Jaipur",
    state: "Rajasthan",
    emergencyContact: "Emergency 9876543210",
    isEvolveMember: false,
    membershipId: "",
    playerLevel: "amateur",
    clubName: "",
    partnerName: "",
    partnerMobile: "",
    categories: ["womens_doubles_open"],
    ...overrides,
  };
}

async function main() {
  console.log(`\n=== Badminton API tests → ${BASE} ===\n`);

  // 1. Health
  {
    const { status, json } = await req("GET", "/api/health");
    log(
      "GET /api/health",
      status === 200 && json?.data?.database === "connected",
      `status=${status} db=${json?.data?.database} mongo=${json?.data?.mongoDatabase}`
    );
  }

  // 2. Status
  let statusData = null;
  {
    const { status, json } = await req("GET", "/api/badminton/status");
    statusData = json?.data;
    const cats = statusData?.categories ?? [];
    log(
      "GET /api/badminton/status",
      status === 200 && Array.isArray(cats) && cats.length >= 10,
      `status=${status} open=${statusData?.open} cashfree=${statusData?.cashfreeEnabled ?? statusData?.razorpayEnabled} categories=${cats.length} counts=${cats.map((c) => `${c.id}:${c.count}`).join(",")}`
    );
  }

  // 3. Free member registration (doubles → needs partner)
  {
    const n = String(Date.now()).slice(-5);
    const body = basePerson({
      fullName: `Member Dummy ${n}`,
      mobile: `91${n}12345`.replace(/\D/g, "").slice(0, 10).padEnd(10, "1"),
      email: `member.dummy.${n}@evolve.test`,
      isEvolveMember: true,
      dateOfBirth: "1995-05-01",
      categories: ["mens_doubles_member"],
      partnerName: "Partner Dummy",
      partnerMobile: "9876543210",
      gender: "male",
    });
    // ensure valid 10-digit starting 6-9
    body.mobile = `9${String(800000000 + Number(n)).slice(0, 9)}`;
    body.partnerMobile = `8${String(700000000 + Number(n)).slice(0, 9)}`;

    const { status, json } = await req(
      "POST",
      "/api/badminton/register/initiate",
      body
    );
    const reg = json?.data?.registration;
    log(
      "Free member doubles registration",
      status === 201 &&
        json?.data?.free === true &&
        reg?.status === "confirmed" &&
        reg?.paymentStatus === "waived",
      `http=${status} msg=${json?.message || ""} free=${json?.data?.free} id=${reg?.registrationId} amount=${reg?.amountInr} payment=${reg?.paymentStatus}`
    );
  }

  // 4. Free member missing partner → expect 422
  {
    const n = String(Date.now() + 1).slice(-5);
    const body = basePerson({
      fullName: `No Partner ${n}`,
      mobile: `9${String(810000000 + Number(n)).slice(0, 9)}`,
      email: `nopartner.${n}@evolve.test`,
      isEvolveMember: true,
      dateOfBirth: "1990-01-01",
      categories: ["mixed_doubles_member"],
      partnerName: "",
      partnerMobile: "",
    });
    const { status, json } = await req(
      "POST",
      "/api/badminton/register/initiate",
      body
    );
    log(
      "Member doubles without partner (expect 422)",
      status === 422 && /partner/i.test(json?.message || ""),
      `http=${status} msg=${json?.message}`
    );
  }

  // 5. Open age-restricted too young → expect 422
  {
    const n = String(Date.now() + 2).slice(-5);
    const body = basePerson({
      fullName: `Young Open ${n}`,
      mobile: `9${String(820000000 + Number(n)).slice(0, 9)}`,
      email: `young.${n}@evolve.test`,
      isEvolveMember: false,
      dateOfBirth: "2000-01-01",
      categories: ["mens_60_plus"],
    });
    const { status, json } = await req(
      "POST",
      "/api/badminton/register/initiate",
      body
    );
    log(
      "Open 60+ with young DOB (expect 422 age)",
      status === 422 && /age|60/i.test(json?.message || ""),
      `http=${status} msg=${json?.message}`
    );
  }

  // 6. Open singles 60+ with valid age — needs Razorpay
  {
    const n = String(Date.now() + 3).slice(-5);
    const body = basePerson({
      fullName: `Senior Open ${n}`,
      mobile: `9${String(830000000 + Number(n)).slice(0, 9)}`,
      email: `senior.${n}@evolve.test`,
      isEvolveMember: false,
      dateOfBirth: "1960-06-01",
      categories: ["mens_60_plus"],
      gender: "male",
    });
    const { status, json } = await req(
      "POST",
      "/api/badminton/register/initiate",
      body
    );
    const razorpayOff = statusData?.razorpayEnabled === false;
    const expectedFail = razorpayOff && status === 503;
    const expectedOk =
      !razorpayOff && status === 201 && json?.data?.free === false;
    log(
      "Open paid singles 60+ (Razorpay path)",
      expectedFail || expectedOk,
      `http=${status} msg=${json?.message || ""} free=${json?.data?.free} orderId=${json?.data?.orderId || "n/a"} razorpayEnabled=${statusData?.razorpayEnabled}`
    );
  }

  // 7. Open women's doubles with partner + fee
  {
    const n = String(Date.now() + 4).slice(-5);
    const body = basePerson({
      fullName: `Open WD ${n}`,
      mobile: `9${String(840000000 + Number(n)).slice(0, 9)}`,
      email: `openwd.${n}@evolve.test`,
      isEvolveMember: false,
      dateOfBirth: "1992-03-10",
      gender: "female",
      categories: ["womens_doubles_open"],
      partnerName: "WD Partner",
      partnerMobile: `8${String(750000000 + Number(n)).slice(0, 9)}`,
    });
    const { status, json } = await req(
      "POST",
      "/api/badminton/register/initiate",
      body
    );
    const razorpayOff = statusData?.razorpayEnabled === false;
    log(
      "Open women's doubles (expects pay or 503)",
      (razorpayOff && status === 503) ||
        (status === 201 && json?.data?.amountInr === 500),
      `http=${status} msg=${json?.message || ""} amount=${json?.data?.amountInr}`
    );
  }

  // 8. Professional blocked
  {
    const n = String(Date.now() + 5).slice(-5);
    const body = basePerson({
      fullName: `Pro ${n}`,
      mobile: `9${String(850000000 + Number(n)).slice(0, 9)}`,
      email: `pro.${n}@evolve.test`,
      isEvolveMember: true,
      categories: ["mens_doubles_member"],
      partnerName: "P",
      partnerMobile: `8${String(760000000 + Number(n)).slice(0, 9)}`,
      playerLevel: "professional",
      dateOfBirth: "1990-01-01",
    });
    const { status, json } = await req(
      "POST",
      "/api/badminton/register/initiate",
      body
    );
    log(
      "Professional player blocked (expect 422)",
      status === 422 && /professional/i.test(json?.message || ""),
      `http=${status} msg=${json?.message}`
    );
  }

  // 9. Semi-pro without club
  {
    const n = String(Date.now() + 6).slice(-5);
    const body = basePerson({
      fullName: `Semi ${n}`,
      mobile: `9${String(860000000 + Number(n)).slice(0, 9)}`,
      email: `semi.${n}@evolve.test`,
      isEvolveMember: true,
      categories: ["womens_doubles_member"],
      partnerName: "P2",
      partnerMobile: `8${String(770000000 + Number(n)).slice(0, 9)}`,
      playerLevel: "semi_pro",
      clubName: "",
      gender: "female",
      dateOfBirth: "1991-01-01",
    });
    const { status, json } = await req(
      "POST",
      "/api/badminton/register/initiate",
      body
    );
    log(
      "Semi-pro without club (expect 422)",
      status === 422 && /club/i.test(json?.message || ""),
      `http=${status} msg=${json?.message}`
    );
  }

  // 10. Member selecting open category
  {
    const n = String(Date.now() + 7).slice(-5);
    const body = basePerson({
      fullName: `Wrong Mix ${n}`,
      mobile: `9${String(870000000 + Number(n)).slice(0, 9)}`,
      email: `mix.${n}@evolve.test`,
      isEvolveMember: true,
      categories: ["mens_60_plus"],
      dateOfBirth: "1955-01-01",
    });
    const { status, json } = await req(
      "POST",
      "/api/badminton/register/initiate",
      body
    );
    log(
      "Member + open category (expect 422)",
      status === 422 && /member/i.test(json?.message || ""),
      `http=${status} msg=${json?.message}`
    );
  }

  // 11. Duplicate registration
  {
    const n = String(Date.now() + 8).slice(-5);
    const mobile = `9${String(880000000 + Number(n)).slice(0, 9)}`;
    const email = `dup.${n}@evolve.test`;
    const body = basePerson({
      fullName: `Dup One ${n}`,
      mobile,
      email,
      isEvolveMember: true,
      categories: ["mixed_doubles_member"],
      partnerName: "Dup Partner",
      partnerMobile: `8${String(780000000 + Number(n)).slice(0, 9)}`,
      dateOfBirth: "1988-01-01",
    });
    const first = await req("POST", "/api/badminton/register/initiate", body);
    const second = await req("POST", "/api/badminton/register/initiate", {
      ...body,
      fullName: `Dup Two ${n}`,
    });
    log(
      "Duplicate email/mobile blocked",
      first.status === 201 &&
        second.status === 409 &&
        /already/i.test(second.json?.message || ""),
      `first=${first.status} id=${first.json?.data?.registration?.registrationId} second=${second.status} msg=${second.json?.message}`
    );
  }

  // 12. Another free member category
  {
    const n = String(Date.now() + 9).slice(-5);
    const body = basePerson({
      fullName: `Member WD ${n}`,
      mobile: `9${String(890000000 + Number(n)).slice(0, 9)}`,
      email: `memberwd.${n}@evolve.test`,
      isEvolveMember: true,
      gender: "female",
      categories: ["womens_doubles_member", "mixed_doubles_member"],
      partnerName: "Multi Partner",
      partnerMobile: `8${String(790000000 + Number(n)).slice(0, 9)}`,
      dateOfBirth: "1993-08-08",
    });
    const { status, json } = await req(
      "POST",
      "/api/badminton/register/initiate",
      body
    );
    log(
      "Member 2 categories free",
      status === 201 &&
        json?.data?.registration?.amountInr === 0 &&
        (json?.data?.registration?.categories?.length || 0) === 2,
      `http=${status} id=${json?.data?.registration?.registrationId} cats=${JSON.stringify(json?.data?.registration?.categories)} amount=${json?.data?.registration?.amountInr}`
    );
  }

  // 13. Re-check status counts after creates
  {
    const { status, json } = await req("GET", "/api/badminton/status");
    const cats = json?.data?.categories ?? [];
    const memberMd = cats.find((c) => c.id === "mens_doubles_member");
    log(
      "Status counts after dummy creates",
      status === 200 && (memberMd?.count ?? 0) >= 1,
      cats.map((c) => `${c.shortLabel || c.id}=${c.count}`).join(" | ")
    );
  }

  // Summary
  const failed = results.filter((r) => !r.ok);
  console.log("=== SUMMARY ===");
  console.log(`Total: ${results.length}  Pass: ${results.length - failed.length}  Fail: ${failed.length}`);
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
