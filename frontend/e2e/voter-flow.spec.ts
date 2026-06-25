// =============================================================================
// E2E Test — Voter Flow
//
// Simulates the complete voter journey:
//   1. Navigate to login page
//   2. Enter credentials and sign in
//   3. View voter dashboard with election feed
//   4. Click "Vote Now" on an available election
//   5. Select a candidate from radio-cards
//   6. Confirm the vote
//   7. Verify the cryptographic vote_hash receipt is displayed
//   8. Verify copy-to-clipboard button is present
//
// Prerequisites:
//   - Backend running on http://localhost:3000
//   - Frontend running on http://localhost:3001
//   - A test voter account exists (registered & eligible to vote)
//   - An active election with candidates exists
// =============================================================================

import { test, expect } from "@playwright/test";

// Test credentials — update these to match your seeded test data
const TEST_VOTER_EMAIL = process.env.TEST_VOTER_EMAIL || "voter@test.com";
const TEST_VOTER_PASSWORD = process.env.TEST_VOTER_PASSWORD || "voter123";

test.describe("Voter Voting Flow", () => {
  test("complete voting journey: login → dashboard → vote → receipt", async ({
    page,
  }) => {
    // =====================================================================
    // STEP 1: Navigate to Voter Login
    // =====================================================================
    await page.goto("/login");

    // Verify login page elements are present
    await expect(page.locator("text=Voter Sign In")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // =====================================================================
    // STEP 2: Enter credentials and sign in
    // =====================================================================
    await page.fill("#email", TEST_VOTER_EMAIL);
    await page.fill("#password", TEST_VOTER_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // =====================================================================
    // STEP 3: Verify voter dashboard loads
    // =====================================================================
    await expect(page.locator("text=My Elections")).toBeVisible();

    // Look for an election card with a "Vote Now" button
    const voteNowButton = page.locator('a:has-text("Vote Now")').first();

    // If no elections available, skip the rest (test environment may not be seeded)
    const hasElection = await voteNowButton.isVisible().catch(() => false);
    if (!hasElection) {
      console.log(
        "⚠️  No active elections found. Skipping voting flow. Seed test data to run full E2E."
      );
      return;
    }

    // =====================================================================
    // STEP 4: Click "Vote Now" to enter the ballot station
    // =====================================================================
    await voteNowButton.click();
    await page.waitForURL("**/vote/**", { timeout: 10000 });

    // Verify ballot station loaded
    await expect(
      page.locator("text=Select your candidate")
    ).toBeVisible();

    // =====================================================================
    // STEP 5: Select a candidate (click the first candidate card)
    // =====================================================================
    const candidateCard = page
      .locator("button")
      .filter({ hasText: /Candidate|candidate/i })
      .first();

    if (await candidateCard.isVisible()) {
      await candidateCard.click();
    } else {
      // Fallback: click first button-like element in the candidate list area
      await page.locator("button.rounded-2xl").first().click();
    }

    // Click "Continue to Confirm"
    const continueButton = page.locator('button:has-text("Continue to Confirm")');
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // =====================================================================
    // STEP 6: Confirm the vote
    // =====================================================================
    // Verify confirmation warning is visible
    await expect(
      page.locator("text=This action is final and cannot be undone")
    ).toBeVisible();

    // Click "Confirm & Cast Vote"
    await page.click('button:has-text("Confirm & Cast Vote")');

    // =====================================================================
    // STEP 7: Verify the cryptographic receipt
    // =====================================================================
    // Wait for receipt screen
    await expect(
      page.locator("text=Vote Cast Successfully")
    ).toBeVisible({ timeout: 15000 });

    // Verify vote hash is displayed
    await expect(
      page.locator("text=Vote Hash")
    ).toBeVisible();

    // Verify the hash value exists (UUID format: 8-4-4-4-12)
    const hashElement = page.locator(".font-mono").first();
    await expect(hashElement).toBeVisible();
    const hashText = await hashElement.textContent();
    expect(hashText).toBeTruthy();
    expect(hashText!.length).toBeGreaterThanOrEqual(36); // UUID length

    // =====================================================================
    // STEP 8: Verify copy button and anonymity explanation
    // =====================================================================
    const copyButton = page.locator('button:has-text("Copy Vote Hash")');
    await expect(copyButton).toBeVisible();

    // Verify the anonymity explanation text
    await expect(
      page.locator("text=anonymous verification receipt")
    ).toBeVisible();

    await expect(
      page.locator("text=cannot trace this hash back to you")
    ).toBeVisible();

    // Verify "Back to My Elections" link
    await expect(
      page.locator('button:has-text("Back to My Elections")')
    ).toBeVisible();
  });

  test("should display login page with all required elements", async ({
    page,
  }) => {
    await page.goto("/login");

    // Brand
    await expect(page.locator("text=VoteSecure")).toBeVisible();
    await expect(page.locator("text=Voter Sign In")).toBeVisible();

    // Form fields
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(
      page.locator('button:has-text("Sign In to Vote")')
    ).toBeVisible();

    // Admin link
    await expect(
      page.locator("text=Access admin portal")
    ).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#email", "fake@nonexistent.com");
    await page.fill("#password", "wrongpassword");
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(
      page.locator(".bg-red-50, .bg-red-500\\/10").first()
    ).toBeVisible({ timeout: 5000 });
  });
});
