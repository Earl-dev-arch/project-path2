export default async function run(page, ui) {
  const out = { checks: [], errors: [] };

  // Start from a clean slate so no leftover account exists.
  await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.indexOf("yp_") === 0) localStorage.removeItem(k);
    }
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);

  // 1. Create a real account through the signup form.
  await page.evaluate(() => {
    if (typeof openSignup === "function") openSignup();
    else
      document.querySelector('[data-open="signupModal"], #openSignup')?.click();
  });
  await page.waitForTimeout(400);

  const signupVisible = await page.evaluate(
    () =>
      !!document.querySelector("#signupForm") &&
      document.querySelector("#signupForm").offsetParent !== null,
  );
  out.checks.push({ name: "signup form reachable", pass: signupVisible });

  if (signupVisible) {
    await page
      .fill('#signupForm input[name="name"]', "Real Student")
      .catch(() => {});
    await page
      .fill('#signupForm input[name="email"]', "real@student.test")
      .catch(() => {});
    await page
      .fill('#signupForm input[name="password"]', "secret123")
      .catch(() => {});
    await page.evaluate(() =>
      document
        .querySelector("#signupForm")
        .dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true }),
        ),
    );
    await page.waitForTimeout(1200);
  }

  const afterSignup = await page.evaluate(() => {
    const raw = localStorage.getItem("yp_accounts_v3");
    return { accounts: raw ? Object.keys(JSON.parse(raw)) : [] };
  });
  out.checks.push({
    name: "signup created the account",
    pass: afterSignup.accounts.includes("real@student.test"),
    detail: afterSignup.accounts,
  });

  // 2. Log out, then try to LOG IN with an email that was never created.
  await page.evaluate(() => {
    localStorage.removeItem("yp_user_v3");
    if (typeof openLogin === "function") openLogin();
    else
      document.querySelector('[data-open="loginModal"], #openLogin')?.click();
  });
  await page.waitForTimeout(400);

  const loginVisible = await page.evaluate(
    () =>
      !!document.querySelector("#loginForm") &&
      document.querySelector("#loginForm").offsetParent !== null,
  );
  out.checks.push({ name: "login form reachable", pass: loginVisible });

  if (loginVisible) {
    await page
      .fill('#loginForm input[name="email"]', "ghost@nowhere.test")
      .catch(() => {});
    await page
      .fill('#loginForm input[name="password"]', "anything123")
      .catch(() => {});
    await page.evaluate(() =>
      document
        .querySelector("#loginForm")
        .dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true }),
        ),
    );
    await page.waitForTimeout(900);
  }

  // The critical assertion: no account invented for the unknown email,
  // and the app did not log anyone in as that address.
  const afterGhost = await page.evaluate(() => {
    const accs = JSON.parse(localStorage.getItem("yp_accounts_v3") || "{}");
    const user = JSON.parse(localStorage.getItem("yp_user_v3") || "null");
    return {
      accountKeys: Object.keys(accs),
      ghostCreated: !!accs["ghost@nowhere.test"],
      userEmail: user && user.email,
    };
  });
  out.checks.push({
    name: "unknown email NOT auto-created",
    pass: afterGhost.ghostCreated === false,
    detail: afterGhost.accountKeys,
  });
  out.checks.push({
    name: "not logged in as unknown email",
    pass: afterGhost.userEmail !== "ghost@nowhere.test",
    detail: { userEmail: afterGhost.userEmail },
  });

  // 3. The real account must still log in successfully.
  await page.evaluate(() => {
    if (typeof openLogin === "function") openLogin();
  });
  await page.waitForTimeout(300);
  await page
    .fill('#loginForm input[name="email"]', "real@student.test")
    .catch(() => {});
  await page
    .fill('#loginForm input[name="password"]', "secret123")
    .catch(() => {});
  await page.evaluate(() =>
    document
      .querySelector("#loginForm")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })),
  );
  await page.waitForTimeout(900);

  const realLogin = await page.evaluate(() => {
    const user = JSON.parse(localStorage.getItem("yp_user_v3") || "null");
    return {
      userEmail: user && user.email,
      accounts: Object.keys(
        JSON.parse(localStorage.getItem("yp_accounts_v3") || "{}"),
      ),
    };
  });
  out.checks.push({
    name: "existing account CAN log in",
    pass: realLogin.userEmail === "real@student.test",
    detail: realLogin,
  });

  // 4. Wrong password for the real account must be refused.
  await page.evaluate(() => {
    localStorage.removeItem("yp_user_v3");
    if (typeof openLogin === "function") openLogin();
  });
  await page.waitForTimeout(300);
  await page
    .fill('#loginForm input[name="email"]', "real@student.test")
    .catch(() => {});
  await page
    .fill('#loginForm input[name="password"]', "wrongpass")
    .catch(() => {});
  await page.evaluate(() =>
    document
      .querySelector("#loginForm")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })),
  );
  await page.waitForTimeout(900);

  const wrongPw = await page.evaluate(() => {
    const user = JSON.parse(localStorage.getItem("yp_user_v3") || "null");
    return { userEmail: user && user.email };
  });
  out.checks.push({
    name: "wrong password refused",
    pass: wrongPw.userEmail !== "real@student.test",
    detail: wrongPw,
  });

  out.failed = out.checks.filter((c) => !c.pass).map((c) => c.name);
  return out;
}
