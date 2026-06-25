// =============================================================================
// Integration Tests — POST /api/elections/:id/vote
//
// Tests:
//   1. Successful vote → 201 + anonymous ballot
//   2. ANONYMITY ASSERTION → Ballot has NO userId or identifying fields
//   3. Double-vote prevention → 409 on second attempt
//   4. RACE CONDITION ATTACK → Two concurrent requests, only one succeeds
//   5. Unregistered voter → 403
//   6. Invalid candidate → 404
// =============================================================================

import request from "supertest";
import app from "../src/server";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-for-ci";

// ---------------------------------------------------------------------------
// Test data factory
// ---------------------------------------------------------------------------
interface TestData {
  adminToken: string;
  voterToken: string;
  voterToken2: string;
  voterId: string;
  voterId2: string;
  electionId: string;
  candidateAId: string;
  candidateBId: string;
}

async function seedTestData(): Promise<TestData> {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: "Test Admin",
      email: `admin-${Date.now()}@test.com`,
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
  });

  // Create two voter users
  const voter1 = await prisma.user.create({
    data: {
      name: "Test Voter 1",
      email: `voter1-${Date.now()}@test.com`,
      passwordHash: await bcrypt.hash("voter123", 10),
      role: "VOTER",
    },
  });

  const voter2 = await prisma.user.create({
    data: {
      name: "Test Voter 2",
      email: `voter2-${Date.now()}@test.com`,
      passwordHash: await bcrypt.hash("voter123", 10),
      role: "VOTER",
    },
  });

  // Create an ACTIVE election (start in past, end in future)
  const election = await prisma.election.create({
    data: {
      title: `Test Election ${Date.now()}`,
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(Date.now() + 3600000), // 1 hour from now
      status: "ACTIVE",
    },
  });

  // Create two candidates
  const candidateA = await prisma.candidate.create({
    data: {
      name: "Candidate A",
      description: "First test candidate",
      electionId: election.id,
    },
  });

  const candidateB = await prisma.candidate.create({
    data: {
      name: "Candidate B",
      description: "Second test candidate",
      electionId: election.id,
    },
  });

  // Register both voters
  await prisma.voterRegistry.create({
    data: { userId: voter1.id, electionId: election.id, hasVoted: false },
  });

  await prisma.voterRegistry.create({
    data: { userId: voter2.id, electionId: election.id, hasVoted: false },
  });

  // Generate JWT tokens
  const adminToken = jwt.sign(
    { userId: admin.id, role: "ADMIN" },
    JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  const voterToken = jwt.sign(
    { userId: voter1.id, role: "VOTER" },
    JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  const voterToken2 = jwt.sign(
    { userId: voter2.id, role: "VOTER" },
    JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );

  return {
    adminToken,
    voterToken,
    voterToken2,
    voterId: voter1.id,
    voterId2: voter2.id,
    electionId: election.id,
    candidateAId: candidateA.id,
    candidateBId: candidateB.id,
  };
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe("POST /api/elections/:id/vote", () => {
  let data: TestData;

  beforeAll(async () => {
    data = await seedTestData();
  });

  afterAll(async () => {
    // Clean up test data (cascade deletes will handle related records)
    await prisma.ballot.deleteMany({
      where: { electionId: data.electionId },
    });
    await prisma.voterRegistry.deleteMany({
      where: { electionId: data.electionId },
    });
    await prisma.candidate.deleteMany({
      where: { electionId: data.electionId },
    });
    await prisma.election.delete({
      where: { id: data.electionId },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [data.voterId, data.voterId2] } },
    });
    await prisma.$disconnect();
  });

  // =========================================================================
  // TEST 1: Successful Vote
  // =========================================================================
  it("should cast a vote successfully and return 201 with voteHash", async () => {
    const res = await request(app)
      .post(`/api/elections/${data.electionId}/vote`)
      .set("Authorization", `Bearer ${data.voterToken}`)
      .send({ candidateId: data.candidateAId });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain("Vote cast successfully");
    expect(res.body.ballot).toBeDefined();
    expect(res.body.ballot.voteHash).toBeDefined();
    expect(typeof res.body.ballot.voteHash).toBe("string");
    expect(res.body.ballot.voteHash.length).toBeGreaterThan(0);
  });

  // =========================================================================
  // TEST 2: CRITICAL ANONYMITY ASSERTION
  //
  // Proves mathematically that NO userId or identifying information exists
  // on the Ballot record. This is the core privacy guarantee.
  // =========================================================================
  it("ANONYMITY: Ballot record must contain NO userId or identifying fields", async () => {
    // Fetch the ballot that was just created in Test 1
    const ballots = await prisma.ballot.findMany({
      where: { electionId: data.electionId },
    });

    expect(ballots.length).toBeGreaterThan(0);

    for (const ballot of ballots) {
      // Get ALL fields on the ballot record
      const ballotKeys = Object.keys(ballot);

      // Assert: No field named userId, user_id, voterId, voter_id, or similar
      const identifyingFields = [
        "userId",
        "user_id",
        "voterId",
        "voter_id",
        "userEmail",
        "user_email",
        "voterName",
        "voter_name",
      ];

      for (const field of identifyingFields) {
        expect(ballotKeys).not.toContain(field);
      }

      // Assert: The record only has exactly these expected anonymous fields
      expect(ballotKeys.sort()).toEqual(
        ["id", "electionId", "candidateId", "voteHash", "createdAt"].sort()
      );

      // Assert: No value in the ballot matches the voter's userId
      const allValues = Object.values(ballot).map(String);
      expect(allValues).not.toContain(data.voterId);
      expect(allValues).not.toContain(data.voterId2);
    }
  });

  // =========================================================================
  // TEST 3: Double-Vote Prevention
  // =========================================================================
  it("should reject a second vote from the same voter with 409", async () => {
    const res = await request(app)
      .post(`/api/elections/${data.electionId}/vote`)
      .set("Authorization", `Bearer ${data.voterToken}`)
      .send({ candidateId: data.candidateBId });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("already voted");
  });

  // =========================================================================
  // TEST 4: RACE CONDITION ATTACK
  //
  // Simulates a malicious actor sending two simultaneous vote requests
  // for the same voter to exploit potential race conditions in the
  // has_voted check. The Prisma $transaction MUST serialize these and
  // ensure only ONE succeeds.
  // =========================================================================
  it("RACE CONDITION: concurrent duplicate votes must result in exactly 1 success", async () => {
    // Use voter2 who hasn't voted yet
    const votePayload = { candidateId: data.candidateAId };

    // Fire two requests simultaneously
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/elections/${data.electionId}/vote`)
        .set("Authorization", `Bearer ${data.voterToken2}`)
        .send(votePayload),
      request(app)
        .post(`/api/elections/${data.electionId}/vote`)
        .set("Authorization", `Bearer ${data.voterToken2}`)
        .send(votePayload),
    ]);

    const statuses = [res1.status, res2.status].sort();

    // Exactly one 201 (success) and one 409 (already voted) or 500 (transaction conflict)
    expect(statuses).toContain(201);
    expect(
      statuses.includes(409) || statuses.includes(500)
    ).toBe(true);

    // Verify only ONE ballot was created for voter2's vote
    const voter2Ballots = await prisma.ballot.count({
      where: { electionId: data.electionId },
    });

    // Total should be 2: voter1's ballot from Test 1 + voter2's single ballot
    expect(voter2Ballots).toBe(2);

    // Verify VoterRegistry shows hasVoted = true exactly once
    const registry = await prisma.voterRegistry.findFirst({
      where: { userId: data.voterId2, electionId: data.electionId },
    });
    expect(registry?.hasVoted).toBe(true);
  });

  // =========================================================================
  // TEST 5: Unregistered Voter
  // =========================================================================
  it("should reject an unregistered voter with 403", async () => {
    // Create a voter who is NOT registered for this election
    const unregistered = await prisma.user.create({
      data: {
        name: "Unregistered Voter",
        email: `unreg-${Date.now()}@test.com`,
        passwordHash: await bcrypt.hash("pass123", 10),
        role: "VOTER",
      },
    });

    const token = jwt.sign(
      { userId: unregistered.id, role: "VOTER" },
      JWT_SECRET,
      { algorithm: "HS256", expiresIn: "1h" }
    );

    const res = await request(app)
      .post(`/api/elections/${data.electionId}/vote`)
      .set("Authorization", `Bearer ${token}`)
      .send({ candidateId: data.candidateAId });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("not registered");

    // Cleanup
    await prisma.user.delete({ where: { id: unregistered.id } });
  });

  // =========================================================================
  // TEST 6: Invalid Candidate
  // =========================================================================
  it("should reject a vote for a non-existent candidate with 404", async () => {
    // Create a fresh voter for this test
    const freshVoter = await prisma.user.create({
      data: {
        name: "Fresh Voter",
        email: `fresh-${Date.now()}@test.com`,
        passwordHash: await bcrypt.hash("pass123", 10),
        role: "VOTER",
      },
    });

    await prisma.voterRegistry.create({
      data: {
        userId: freshVoter.id,
        electionId: data.electionId,
        hasVoted: false,
      },
    });

    const token = jwt.sign(
      { userId: freshVoter.id, role: "VOTER" },
      JWT_SECRET,
      { algorithm: "HS256", expiresIn: "1h" }
    );

    const res = await request(app)
      .post(`/api/elections/${data.electionId}/vote`)
      .set("Authorization", `Bearer ${token}`)
      .send({ candidateId: "00000000-0000-0000-0000-000000000000" });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("Candidate not found");

    // Cleanup
    await prisma.voterRegistry.deleteMany({
      where: { userId: freshVoter.id },
    });
    await prisma.user.delete({ where: { id: freshVoter.id } });
  });

  // =========================================================================
  // TEST 7: Missing candidateId
  // =========================================================================
  it("should return 400 when candidateId is missing", async () => {
    const freshVoter = await prisma.user.create({
      data: {
        name: "Another Voter",
        email: `another-${Date.now()}@test.com`,
        passwordHash: await bcrypt.hash("pass123", 10),
        role: "VOTER",
      },
    });

    const token = jwt.sign(
      { userId: freshVoter.id, role: "VOTER" },
      JWT_SECRET,
      { algorithm: "HS256", expiresIn: "1h" }
    );

    const res = await request(app)
      .post(`/api/elections/${data.electionId}/vote`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("candidateId");

    // Cleanup
    await prisma.user.delete({ where: { id: freshVoter.id } });
  });

  // =========================================================================
  // TEST 8: Unauthenticated request
  // =========================================================================
  it("should return 401 when no auth token is provided", async () => {
    const res = await request(app)
      .post(`/api/elections/${data.electionId}/vote`)
      .send({ candidateId: data.candidateAId });

    expect(res.status).toBe(401);
  });
});
