import { expect, test, type Page } from "@playwright/test";

const heading = "Ask the C# book anything.";

async function ask(page: Page, question: string) {
  const answers = page.locator("article");
  const count = await answers.count();
  await page.getByLabel("Your question").fill(question);
  await page.getByLabel("Your question").press("Enter");
  await expect(answers).toHaveCount(count + 1);
  return answers.last();
}

test("shows the empty state with example questions @mobile", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  await expect(page.getByRole("list", { name: "Example questions" }).getByRole("button")).toHaveCount(4);
  await expect(page.getByLabel("Your question")).toBeVisible();
});

test("answers a C# question with sources, then a follow-up in context", async ({ page }) => {
  await page.goto("/");

  const first = await ask(page, "What is a record type in C#?");
  await expect(first).toContainText(/record/i);
  await expect(first.getByRole("list", { name: "Sources" }).getByRole("listitem").first()).toContainText(/\.pdf, pages? \d+/);

  const followUp = await ask(page, "Show me a short code example of that.");
  await expect(followUp.locator("pre code")).toContainText(/record/);
});

test("answers an example question when clicked @mobile", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "When should I use async and await?" }).click();

  await expect(page.locator("article")).toContainText(/async|await/i);
});

test("says when a question is outside the knowledge base", async ({ page }) => {
  await page.goto("/");

  const answer = await ask(page, "What is the recipe for a classic French onion soup?");
  await expect(answer).toContainText(/(knowledge base|not cover|doesn't cover|does not cover|no information)/i);
});

test("New chat resets the conversation", async ({ page }) => {
  await page.goto("/");
  await ask(page, "What is a namespace?");

  await page.getByRole("button", { name: "New chat" }).click();

  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  await expect(page.locator("article")).toHaveCount(0);
});
