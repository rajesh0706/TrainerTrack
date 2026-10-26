import { expect, test, type Locator } from "@playwright/test";

const email = process.env.E2E_EMAIL ?? process.env.SEED_TRAINER_EMAIL;
const password = process.env.E2E_PASSWORD ?? process.env.SEED_TRAINER_PASSWORD;

test.describe("trainer flows", () => {
  test.skip(
    !email || !password,
    "Set E2E_EMAIL and E2E_PASSWORD (or seed trainer env) to run Playwright tests.",
  );

  test("login, add a client, mark attendance, download a PDF", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const stamp = Date.now();
    const clientName = `E2E Client ${stamp}`;
    const clientEmail = `e2e.${stamp}@example.com`;

    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("link", { name: "Clients" }).click();
    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
    await page.getByRole("button", { name: "Add client" }).click();
    const clientDialog = page.getByRole("dialog");
    await clientDialog.getByLabel("Full name").fill(clientName);
    await clientDialog.getByLabel("Email").fill(clientEmail);
    await clientDialog.getByRole("button", { name: "Add client" }).click();
    await expect(page.getByText("Client added")).toBeVisible();

    await page.getByLabel("Search").fill(clientName);
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("link", { name: clientName })).toBeVisible();

    await page.getByRole("link", { name: "Attendance", exact: true }).click();
    await page.getByRole("button", { name: "Add session" }).click();
    const sessionDialog = page.getByRole("dialog");
    await chooseOption(sessionDialog, "Client", clientName);
    await sessionDialog.getByLabel("Start time").fill("16:45");
    await sessionDialog.getByRole("button", { name: "Add session" }).click();
    await expect(page.getByText("Session added")).toBeVisible();
    await expect(page.getByText(clientName)).toBeVisible();

    await page.getByRole("button", { name: "Missed" }).first().click();
    await expect(page.getByText("Marked missed")).toBeVisible();

    await page.getByRole("link", { name: "Reports" }).click();
    await expect(page.getByText("Report builder")).toBeVisible();
    await page.locator("#report-client").selectOption({ label: clientName });
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("download-pdf").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });
});

async function chooseOption(root: Locator, label: string, option: string) {
  await root.getByLabel(label).click();
  await root.page().getByRole("option", { name: option }).click();
}
