// Drives the real login form with the demo credentials and reports what the
// app did: whether the account was seeded, whether login succeeded, and what
// toast (if any) the user would have seen.
export default async function run(page, ui) {
  const out = {};

  // Start from a clean slate, then reload so ensureDemoAccount() seeds.
  await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.indexOf("yp_") === 0) localStorage.removeItem(k);
    }
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  out.seeded = await page.evaluate(() => {
    const raw = localStorage.getItem("yp_accounts_v3");
    const accs = raw ? JSON.parse(raw) : {};
    return {
      keys: Object.keys(accs),
      demo: accs["yourpath@gmail.com"] || null,
    };
  });

  // Open login the way a student would, then fill and submit.
  await page.evaluate(() => {
    if (typeof openLogin === "function") openLogin();
    else document.querySelector('[data-open="loginModal"], #openLogin')?.click();
  });
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    const f = document.querySelector("#loginForm");
    const set = (sel, val) => {
      const el = f.querySelector(sel);
      el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    set('input[name="email"]', "yourpath@gmail.com");
    set('input[name="password"]', "yourpath2026");
  });
  out.filled = await page.evaluate(() => {
    const f = document.querySelector("#loginForm");
    return {
      email: f ? f.querySelector('input[name="email"]').value : null,
      password: f ? f.querySelector('input[name="password"]').value : null,
    };
  });

  await page.evaluate(() => {
    document
      .querySelector("#loginForm")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  });
  await page.waitForTimeout(2800);

  out.afterLogin = await page.evaluate(() => {
    const user = JSON.parse(localStorage.getItem("yp_user_v3") || "null");
    const dashboard = document.getElementById("dashboard");
    const loader = document.getElementById("authLoader");
    return {
      userEmail: user ? user.email : null,
      userName: user ? user.name : null,
      dashboardVisible: dashboard ? !dashboard.classList.contains("hidden") : false,
      flip: dashboard ? dashboard.classList.contains("yp-flip-in") : false,
      loaderVisible: loader ? !loader.classList.contains("hidden") : false,
      loginModalVisible: (() => {
        const m = document.getElementById("loginModal");
        return m ? !m.classList.contains("hidden") : false;
      })(),
      toasts: window.__toasts ? window.__toasts.slice(-3) : [],
    };
  });

  return out;
}
