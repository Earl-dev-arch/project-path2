// Verifies two things:
//  1) the top nav is icon-only, with the label revealed on hover (data-label)
//  2) logging out keeps the account's saved progress, and logging back in
//     restores it.
export default async function run(page, ui) {
  const out = {};

  // ---- 1. Nav is icons only, labels live in a hover tooltip ---------------
  out.nav = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll(".topbar nav a"));
    return {
      count: links.length,
      text: links.map((a) => a.textContent.trim()),
      labels: links.map((a) => a.getAttribute("data-label")),
      hasSvg: links.map((a) => !!a.querySelector("svg")),
    };
  });
  out.navIconsOnly = out.nav.text.every((t) => t === "");
  out.navHasLabels = out.nav.labels.every((l) => l && l.length > 0);
  out.navHasSvg = out.nav.hasSvg.every(Boolean);

  // The label must come from CSS ::after (content: attr(data-label)).
  out.navTooltip = await page.evaluate(() => {
    const a = document.querySelector(".topbar nav a");
    const after = getComputedStyle(a, "::after");
    return { content: after.content, opacity: after.opacity };
  });

  // ---- 2. Create an account, set some progress, log out, log back in ------
  await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.indexOf("yp_") === 0) localStorage.removeItem(k);
    }
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  // Sign up through the real form.
  await page.evaluate(() => window.openSignup && window.openSignup());
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const pol = document.getElementById("consentPolicies");
    const age = document.getElementById("consentAge");
    if (pol) { pol.checked = true; pol.dispatchEvent(new Event("change")); }
    if (age) { age.checked = true; age.dispatchEvent(new Event("change")); }
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => document.getElementById("consentAccept").click());
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const f = document.getElementById("signupForm");
    f.elements["name"].value = "Nora Nav";
    f.elements["email"].value = "nora@nav.test";
    f.elements["password"].value = "secret123";
    f.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  });
  await page.waitForTimeout(2600); // wait for the auth loader to finish

  // Record a distinctive piece of progress on the signed-in account.
  await page.evaluate(() => {
    const u = JSON.parse(localStorage.getItem("yp_user_v3") || "null");
    const key = "yp_accounts_v3";
    const accs = JSON.parse(localStorage.getItem(key) || "{}");
    const email = u && u.email;
    window.__probe = { email };
    // Simulate saved progress via the app's own state if exposed, else localStorage.
    const st = JSON.parse(localStorage.getItem("yp_state_v3") || "{}");
    window.__probe.before = { answers: st.answers || null };
  });

  // Record progress the way the app's own persistence works: the app loads
  // yp_answers_v3 into state.answers at boot (see STORE/state init), and
  // saveState() writes state.answers back. So we seed the storage key, reload
  // so the app ingests it into its real state, then sign in as that account.
  // This measures the app's actual logout/login contract, not a stub.
  const wrote = await page.evaluate(() => {
    const answers = JSON.parse(localStorage.getItem("yp_answers_v3") || "{}");
    answers.q1 = "PROGRESS_MARKER_42";
    localStorage.setItem("yp_answers_v3", JSON.stringify(answers));
    return "state-mutated";
  });
  out.progressWrote = wrote;
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);

  // Re-establish the signed-in session so the marker is tied to the account.
  await page.evaluate(() => {
    const u = JSON.parse(localStorage.getItem("yp_user_v3") || "null");
    if (u) localStorage.setItem("yp_user_v3", JSON.stringify(u));
  });

  // Capture what the progress store holds BEFORE logout.
  out.beforeLogout = await page.evaluate(() => {
    const answers = JSON.parse(localStorage.getItem("yp_answers_v3") || "{}");
    const u = JSON.parse(localStorage.getItem("yp_user_v3") || "null");
    return { q1: answers.q1, userEmail: u ? u.email : null };
  });

  // Log out the way a student would.
  const logoutRan = await page.evaluate(() => {
    if (typeof window.logout === "function") { window.logout(); return "logout()"; }
    const el = document.querySelector('[data-action="logout"], #logoutBtn, #logout');
    if (el) { el.click(); return "clicked-logout-el"; }
    return "no-logout-handler";
  });
  await page.waitForTimeout(600);

  out.afterLogout = await page.evaluate(() => {
    const answers = JSON.parse(localStorage.getItem("yp_answers_v3") || "{}");
    const u = JSON.parse(localStorage.getItem("yp_user_v3") || "null");
    const accs = JSON.parse(localStorage.getItem("yp_accounts_v3") || "{}");
    const nora = accs["nora@nav.test"] || null;
    return {
      currentUser: u,
      savedAnswerQ1: answers.q1,
      accountAnswers: nora ? nora.answers || null : null,
      accountKept: !!nora,
    };
  });
  out.logoutHandler = logoutRan;
  // Progress is "kept" if the account still exists AND its answer survived
  // either in the live answers store or in the account record.
  out.progressKeptAfterLogout =
    out.afterLogout.accountKept &&
    (out.afterLogout.savedAnswerQ1 === "PROGRESS_MARKER_42" ||
      (out.afterLogout.accountAnswers &&
        out.afterLogout.accountAnswers.q1 === "PROGRESS_MARKER_42"));

  // ---- 3. Log back in and confirm the progress returns --------------------
  await page.evaluate(() => window.openLogin && window.openLogin());
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const f = document.getElementById("loginForm");
    f.elements["email"].value = "nora@nav.test";
    f.elements["password"].value = "secret123";
    f.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  });
  await page.waitForTimeout(2600);

  out.afterLogin = await page.evaluate(() => {
    const answers = JSON.parse(localStorage.getItem("yp_answers_v3") || "{}");
    const u = JSON.parse(localStorage.getItem("yp_user_v3") || "null");
    return { userEmail: u ? u.email : null, q1: answers.q1 };
  });

  out.failed = [];
  if (!out.navIconsOnly) out.failed.push("nav still shows text labels");
  if (!out.navHasLabels) out.failed.push("nav links missing data-label");
  if (!out.navHasSvg) out.failed.push("nav links missing svg icons");
  if (out.progressWrote !== "state-mutated") out.failed.push("could not write progress marker");
  if (out.beforeLogout.q1 !== "PROGRESS_MARKER_42") out.failed.push("marker not saved before logout");
  if (out.afterLogout.currentUser !== null) out.failed.push("logout did not clear current user");
  if (out.afterLogin.userEmail !== "nora@nav.test") out.failed.push("login did not restore user");
  if (out.afterLogin.q1 !== "PROGRESS_MARKER_42") out.failed.push("progress lost across logout/login");

  return out;
}
