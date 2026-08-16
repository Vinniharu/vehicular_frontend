export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Turn a relative upload path (e.g. "/uploads/xyz.jpg", returned by the
 * backend) into an absolute URL against the API origin. Frontend and backend
 * are separate origins in production, so a bare relative path in an <img src>
 * or <a href> would otherwise resolve against the frontend's own origin.
 */
export function resolveMediaUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;
}

/**
 * Convert kobo amount to formatted Naira string (e.g., 3000000 -> ₦30,000.00)
 */
export function koboToNaira(kobo = 0) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(kobo / 100);
}

/**
 * Mirrors the backend's FEE_SCHEDULE (app/core/payment_helpers.py) — used
 * only by the offline/demo mock-fallback layer below to seed realistic
 * payment_options amounts.
 */
const MOCK_FEE_SCHEDULE_KOBO = {
  fresh: { "3 years": 3867500, "5 years": 4577500 },
  renewal: { "3 years": 3000000, "5 years": 3500000 },
};
function mockFeeKobo(applicationType, validityPeriod) {
  const bucket = applicationType === "fresh" ? MOCK_FEE_SCHEDULE_KOBO.fresh : MOCK_FEE_SCHEDULE_KOBO.renewal;
  return bucket[validityPeriod] || bucket["5 years"];
}

/**
 * Storage helpers for authentication token and user profile
 */
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vh_access_token");
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("vh_access_token", token);
  } else {
    localStorage.removeItem("vh_access_token");
  }
}

// Reads the `exp` claim (seconds since epoch) straight out of the JWT's
// payload segment — no signature verification, this is purely a client-side
// UX signal for when to proactively log the user out; the backend is the
// real authority and rejects the token independently once it's expired.
export function getTokenExpiryMs(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function removeToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("vh_access_token");
  localStorage.removeItem("vh_user");
}

export function getCachedUser() {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem("vh_user");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setCachedUser(user) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("vh_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("vh_user");
  }
}

/* ─── Mock Reference Data for Fallback Simulation (Endpoints.md Section 2) ─── */
const MOCK_STATES = [
  { id: 25, code: "LA", name: "Lagos", capital: "Ikeja" },
  { id: 15, code: "FC", name: "FCT - Abuja", capital: "Abuja" },
  { id: 33, code: "RI", name: "Rivers", capital: "Port Harcourt" },
  { id: 30, code: "OY", name: "Oyo", capital: "Ibadan" },
  { id: 28, code: "OG", name: "Ogun", capital: "Abeokuta" },
  { id: 18, code: "KD", name: "Kaduna", capital: "Kaduna" },
  { id: 19, code: "KN", name: "Kano", capital: "Kano" },
  { id: 14, code: "EN", name: "Enugu", capital: "Enugu" },
  { id: 11, code: "DE", name: "Delta", capital: "Asaba" },
  { id: 4, code: "AN", name: "Anambra", capital: "Awka" }
];

const MOCK_LGAS = {
  25: [
    { id: 512, state_id: 25, name: "Agege" },
    { id: 513, state_id: 25, name: "Alimosho" },
    { id: 514, state_id: 25, name: "Eti-Osa" },
    { id: 515, state_id: 25, name: "Ibeju-Lekki" },
    { id: 516, state_id: 25, name: "Ikeja" },
    { id: 517, state_id: 25, name: "Lagos Island" },
    { id: 518, state_id: 25, name: "Lagos Mainland" },
    { id: 519, state_id: 25, name: "Surulere" }
  ],
  15: [
    { id: 301, state_id: 15, name: "Abaji" },
    { id: 302, state_id: 15, name: "Abuja Municipal (AMAC)" },
    { id: 303, state_id: 15, name: "Bwari" },
    { id: 304, state_id: 15, name: "Gwagwalada" },
    { id: 305, state_id: 15, name: "Kuje" }
  ],
  33: [
    { id: 601, state_id: 33, name: "Obio/Akpor" },
    { id: 602, state_id: 33, name: "Port Harcourt" },
    { id: 603, state_id: 33, name: "Eleme" }
  ],
  30: [
    { id: 551, state_id: 30, name: "Ibadan North" },
    { id: 552, state_id: 30, name: "Ibadan South-West" },
    { id: 553, state_id: 30, name: "Egbeda" }
  ]
};

/**
 * Handles mock simulation fallback when backend server is offline
 */
function handleMockFallback(endpoint, method, body, reqHeaders) {
  const reqId = "vhc-mock-" + Math.random().toString(36).substring(2, 11);
  const token = reqHeaders["Authorization"]?.replace("Bearer ", "") || getToken();

  // 1. GET /reference/states
  if (endpoint === "/reference/states" && method === "GET") {
    return { data: MOCK_STATES, error: null, status: 200, requestId: reqId };
  }

  // 2. GET /reference/states/{id}/lgas
  if (endpoint.startsWith("/reference/states/") && endpoint.endsWith("/lgas") && method === "GET") {
    const parts = endpoint.split("/");
    const stateId = parseInt(parts[3], 10);
    const lgas = MOCK_LGAS[stateId] || [
      { id: stateId * 10 + 1, state_id: stateId, name: "Municipal Area 1" },
      { id: stateId * 10 + 2, state_id: stateId, name: "Central District" }
    ];
    return { data: lgas, error: null, status: 200, requestId: reqId };
  }

  // 3. POST /auth/register
  if (endpoint === "/auth/register" && method === "POST") {
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    if (payload.role && payload.role !== "customer") {
      return { data: null, error: "Forbidden: Public registration is for customer accounts only.", status: 403, requestId: reqId };
    }
    if (!payload.email || !payload.password || !payload.name) {
      return { data: null, error: "Bad Request: Name, email, and password are required.", status: 400, requestId: reqId };
    }

    const newUser = {
      id: Math.floor(Math.random() * 9000) + 1000,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || "+2348000000000",
      role: "customer",
      is_active: true,
      must_change_password: false,
      state_id: null,
      lga_id: null
    };

    // Save mock user locally
    if (typeof window !== "undefined") {
      localStorage.setItem("vh_mock_user_" + payload.email, JSON.stringify(newUser));
      localStorage.setItem("vh_mock_pass_" + payload.email, payload.password);
    }

    return { data: newUser, error: null, status: 201, requestId: reqId };
  }

  // 4. POST /auth/login
  if (endpoint === "/auth/login" && method === "POST") {
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    const { email, password } = payload;
    if (!email || !password) {
      return { data: null, error: "Email and password are required.", status: 400, requestId: reqId };
    }

    let user = null;
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("vh_mock_user_" + email);
      if (storedUser) {
        user = JSON.parse(storedUser);
      }
    }

    // Default demo user if not explicitly registered
    if (!user && (email === "ada.obi@example.com" || email.includes("@"))) {
      const isAdmin = email.toLowerCase().includes("admin");
      user = {
        id: isAdmin ? 999 : 1,
        name: isAdmin ? "System Administrator" : email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        email: email,
        phone: isAdmin ? "+2348000000000" : "+2348011112222",
        role: isAdmin ? "admin" : "customer",
        is_active: true,
        must_change_password: false,
        state_id: isAdmin ? null : 25,
        lga_id: isAdmin ? null : 516
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("vh_mock_user_" + email, JSON.stringify(user));
      }
    }

    const mockToken = "vhc_jwt_" + btoa(encodeURIComponent(JSON.stringify(user))) + "_" + Date.now();
    setToken(mockToken);
    setCachedUser(user);

    return {
      data: {
        access_token: mockToken,
        token_type: "bearer",
        must_change_password: false,
        user: user
      },
      error: null,
      status: 200,
      requestId: reqId
    };
  }

  // 5. GET /auth/me
  if (endpoint === "/auth/me" && method === "GET") {
    if (!token) {
      return { data: null, error: "Unauthorized: Missing authorization header", status: 401, requestId: reqId };
    }

    let user = getCachedUser();
    if (!user && token.startsWith("vhc_jwt_")) {
      try {
        const payloadStr = decodeURIComponent(atob(token.split("_")[2]));
        user = JSON.parse(payloadStr);
      } catch { /* ignore */ }
    }

    if (!user) {
      user = {
        id: 1,
        name: "Ada Obi",
        email: "ada.obi@example.com",
        phone: "+2348011112222",
        role: "customer",
        is_active: true,
        must_change_password: false,
        state_id: 25,
        lga_id: 516
      };
    }

    setCachedUser(user);
    return { data: user, error: null, status: 200, requestId: reqId };
  }

  // GET /customers/me — alias for /auth/me for customer sessions
  if (endpoint === "/customers/me" && method === "GET") {
    if (!token) {
      return { data: null, error: "Unauthorized: Missing authorization header", status: 401, requestId: reqId };
    }
    let user = getCachedUser();
    if (!user && token.startsWith("vhc_jwt_")) {
      try {
        const payloadStr = decodeURIComponent(atob(token.split("_")[2]));
        user = JSON.parse(payloadStr);
      } catch { /* ignore */ }
    }
    if (!user) {
      user = { id: 1, name: "Ada Obi", email: "ada.obi@example.com", phone: "+2348011112222", role: "customer", is_active: true, state_id: 25, lga_id: 516 };
    }
    setCachedUser(user);
    return { data: user, error: null, status: 200, requestId: reqId };
  }

  // 6. PATCH /auth/me
  if (endpoint === "/auth/me" && method === "PATCH") {
    if (!token) {
      return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    }
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    let user = getCachedUser() || {
      id: 1,
      name: "Ada Obi",
      email: "ada.obi@example.com",
      phone: "+2348011112222",
      role: "customer"
    };

    if (payload.state_id !== undefined) user.state_id = payload.state_id;
    if (payload.lga_id !== undefined) user.lga_id = payload.lga_id;
    if (payload.name !== undefined) user.name = payload.name;
    if (payload.phone !== undefined) user.phone = payload.phone;

    setCachedUser(user);
    return { data: user, error: null, status: 200, requestId: reqId };
  }


  // 6b. POST /auth/set-password
  if (endpoint === "/auth/set-password" && method === "POST") {
    if (!token) {
      return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    }
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    if (!payload.new_password || payload.new_password.length < 6) {
      return { data: null, error: "Password must be at least 6 characters.", status: 400, requestId: reqId };
    }
    let user = getCachedUser();
    if (user) {
      user.must_change_password = false;
      setCachedUser(user);
      if (typeof window !== "undefined" && user.email) {
        localStorage.setItem("vh_mock_user_" + user.email, JSON.stringify(user));
        localStorage.setItem("vh_mock_pass_" + user.email, payload.new_password);
      }
    }
    return { data: { status: "success", message: "Password updated successfully." }, error: null, status: 200, requestId: reqId };
  }

  // 7. Admin Management — Staff & Agents (Section 4)
  if (endpoint === "/admin/staff" && method === "GET") {
    let staffList = [
      { id: 101, name: "Tunde Staff", email: "tunde@vehiculars.com", phone: "+2348022223333", role: "staff", is_active: true, must_change_password: true, created_at: "2026-07-01T10:00:00Z" },
      { id: 102, name: "Bisi Verification", email: "bisi@vehiculars.com", phone: "+2348022224444", role: "staff", is_active: true, must_change_password: false, created_at: "2026-07-05T14:30:00Z" }
    ];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vh_mock_admin_staff");
      if (stored) {
        try { staffList = JSON.parse(stored); } catch {}
      } else {
        localStorage.setItem("vh_mock_admin_staff", JSON.stringify(staffList));
      }
    }
    return { data: staffList, error: null, status: 200, requestId: reqId };
  }

  // GET /admin/metrics/overview
  if (endpoint === "/admin/metrics/overview" && method === "GET") {
    return {
      data: {
        gross_payments_kobo: 18540000,
        platform_profit_kobo: 4720000,
        agent_service_fees_kobo: 13820000,
        agent_payables_paid_kobo: 11200000,
        total_customers: 42,
        total_staff: 3,
        total_agents: 8,
        applications_by_status: { submitted: 6, staff_review: 3, driving_school_enrolled: 2, routed: 4, agent_accepted: 5, completed: 12 },
      },
      error: null,
      status: 200,
      requestId: reqId,
    };
  }

  // GET /admin/revenue/transactions
  if (endpoint.startsWith("/admin/revenue/transactions") && method === "GET") {
    const urlObj = endpoint.includes("?") ? new URLSearchParams(endpoint.split("?")[1]) : null;
    const page = parseInt(urlObj?.get("page") || "1", 10);
    const pageSize = parseInt(urlObj?.get("page_size") || "20", 10);
    const mockItems = [
      { payment_id: 501, application_id: 501, reference: "ref_seed_501", applicant_name: "Chinedu Okafor", application_type: "fresh", validity_period: "3 years", amount_kobo: 3867500, amount_paid_kobo: 3867500, platform_profit_kobo: 1000000, service_fee_kobo: 2867500, status: "success", source: "monnify_card", agent_name: "Chika Agent", agent_transfer_status: "success", created_at: "2026-07-20T10:00:00Z" },
      { payment_id: 502, application_id: 502, reference: "ref_seed_502", applicant_name: "Fatima Abubakar", application_type: "fresh", validity_period: "5 years", amount_kobo: 4577500, amount_paid_kobo: 4577500, platform_profit_kobo: 1100000, service_fee_kobo: 3477500, status: "success", source: "wallet", agent_name: null, agent_transfer_status: null, created_at: "2026-07-19T09:30:00Z" },
      { payment_id: 504, application_id: 504, reference: "ref_seed_504", applicant_name: "Emeka Eze", application_type: "renewal", validity_period: "3 years", amount_kobo: 3000000, amount_paid_kobo: 1000000, platform_profit_kobo: 500000, service_fee_kobo: 2500000, status: "pending", source: null, agent_name: null, agent_transfer_status: null, created_at: "2026-07-18T16:15:00Z" },
    ];
    const statusFilter = urlObj?.get("status");
    const typeFilter = urlObj?.get("application_type");
    const filtered = mockItems.filter(
      (t) => (!statusFilter || t.status === statusFilter) && (!typeFilter || t.application_type === typeFilter)
    );
    return {
      data: {
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
        page,
        page_size: pageSize,
        total_pages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
      error: null,
      status: 200,
      requestId: reqId,
    };
  }

  // GET /admin/metrics/applications
  if (endpoint === "/admin/metrics/applications" && method === "GET") {
    return {
      data: {
        total_applications: 32,
        by_status: { submitted: 6, staff_review: 3, driving_school_enrolled: 2, routed: 4, agent_accepted: 5, completed: 12 },
        by_type: { fresh: 22, renewal: 9, reissue: 1 },
      },
      error: null,
      status: 200,
      requestId: reqId,
    };
  }

  // GET /admin/metrics/agents
  if (endpoint === "/admin/metrics/agents" && method === "GET") {
    return {
      data: [
        { agent_name: "Chika Agent", jobs_accepted: 9, jobs_completed: 8, lifetime_earnings_kobo: 22940000 },
        { agent_name: "Bola Fieldman", jobs_accepted: 6, jobs_completed: 6, lifetime_earnings_kobo: 17205000 },
        { agent_name: "Musa Okon", jobs_accepted: 4, jobs_completed: 3, lifetime_earnings_kobo: 8602500 },
      ],
      error: null,
      status: 200,
      requestId: reqId,
    };
  }

  // GET /admin/metrics/wallets
  if (endpoint === "/admin/metrics/wallets" && method === "GET") {
    return {
      data: { total_wallets: 42, total_balance_kobo: 32500000, total_funded_kobo: 61000000, total_spent_kobo: 28500000 },
      error: null,
      status: 200,
      requestId: reqId,
    };
  }

  // GET /admin/metrics/lga-coverage
  if (endpoint.startsWith("/admin/metrics/lga-coverage") && method === "GET") {
    return {
      data: [
        { state_name: "Lagos", lga_name: "Ikeja", active_agents: 3, pending_applications: 5 },
        { state_name: "Lagos", lga_name: "Surulere", active_agents: 1, pending_applications: 2 },
        { state_name: "FCT", lga_name: "Abuja Municipal", active_agents: 2, pending_applications: 1 },
      ],
      error: null,
      status: 200,
      requestId: reqId,
    };
  }

  // GET /admin/transfers/failed
  if (endpoint === "/admin/transfers/failed" && method === "GET") {
    return { data: [], error: null, status: 200, requestId: reqId };
  }

  if (endpoint === "/admin/staff" && method === "POST") {
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    if (!payload.name || !payload.email || !payload.temp_password) {
      return { data: null, error: "Bad Request: Name, email, and temporary password are required.", status: 400, requestId: reqId };
    }
    let staffList = [];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vh_mock_admin_staff");
      if (stored) {
        try { staffList = JSON.parse(stored); } catch {}
      }
    }
    const newStaff = {
      id: Math.floor(Math.random() * 900) + 103,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || "+2348000000000",
      role: "staff",
      is_active: true,
      must_change_password: true,
      created_at: new Date().toISOString()
    };
    staffList.unshift(newStaff);
    if (typeof window !== "undefined") {
      localStorage.setItem("vh_mock_admin_staff", JSON.stringify(staffList));
    }
    return { data: newStaff, error: null, status: 201, requestId: reqId };
  }

  if (endpoint.startsWith("/admin/staff/") && endpoint.endsWith("/deactivate") && method === "PATCH") {
    const id = parseInt(endpoint.split("/")[3], 10);
    let staffList = [];
    let target = null;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vh_mock_admin_staff");
      if (stored) {
        try { staffList = JSON.parse(stored); } catch {}
      }
    }
    staffList = staffList.map((s) => {
      if (s.id === id) {
        target = { ...s, is_active: false };
        return target;
      }
      return s;
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("vh_mock_admin_staff", JSON.stringify(staffList));
    }
    return { data: target || { id, is_active: false, role: "staff" }, error: null, status: 200, requestId: reqId };
  }

  if (endpoint === "/admin/agents" && method === "GET") {
    let agentsList = [
      {
        id: 201,
        name: "Officer Chika",
        email: "chika@vio.gov.ng",
        phone: "+2348033334444",
        role: "agent",
        is_active: true,
        must_change_password: false,
        created_by: 1,
        state_id: 25,
        lga_id: 516,
        created_at: "2026-07-02T09:15:00Z",
        updated_at: "2026-07-22T08:30:00Z",
        agent_profile: {
          id: 1,
          vio_office: "Ikeja VIO Headquarters",
          state: "Lagos",
          lga: "Ikeja",
          state_id: 25,
          lga_id: 516,
          capabilities: ["driver_licence", "roadworthiness"],
          created_at: "2026-07-02T09:15:00Z",
          updated_at: "2026-07-22T08:30:00Z"
        },
        bank_account: {
          bank_code: "058",
          account_number: "0123456789",
          account_name: "CHIKA VIO SETTLEMENT"
        },
        wallet: {
          balance_kobo: 4500000,
          currency: "NGN"
        }
      },
      {
        id: 202,
        name: "Inspector Ibrahim",
        email: "ibrahim@vio.gov.ng",
        phone: "+2348033335555",
        role: "agent",
        is_active: true,
        must_change_password: false,
        created_by: 1,
        state_id: 15,
        lga_id: 302,
        created_at: "2026-07-10T11:20:00Z",
        updated_at: "2026-07-20T14:10:00Z",
        agent_profile: {
          id: 2,
          vio_office: "Wuse VIO Center",
          state: "FCT - Abuja",
          lga: "Abuja Municipal (AMAC)",
          state_id: 15,
          lga_id: 302,
          capabilities: ["driver_licence"],
          created_at: "2026-07-10T11:20:00Z",
          updated_at: "2026-07-20T14:10:00Z"
        },
        bank_account: null,
        wallet: {
          balance_kobo: 1000000,
          currency: "NGN"
        }
      }
    ];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vh_mock_admin_agents");
      if (stored) {
        try { agentsList = JSON.parse(stored); } catch {}
      } else {
        localStorage.setItem("vh_mock_admin_agents", JSON.stringify(agentsList));
      }
    }
    return { data: agentsList, error: null, status: 200, requestId: reqId };
  }

  if (endpoint.match(/^\/admin\/agents\/\d+$/) && method === "GET") {
    const id = parseInt(endpoint.split("/")[3], 10);
    let agentsList = [];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vh_mock_admin_agents");
      if (stored) {
        try { agentsList = JSON.parse(stored); } catch {}
      }
    }
    const found = agentsList.find((a) => a.id === id || a.agent_profile?.id === id);
    if (!found) return { data: null, error: "Agent not found", status: 404, requestId: reqId };
    return { data: found, error: null, status: 200, requestId: reqId };
  }

  if (endpoint === "/admin/agents" && method === "POST") {
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    if (!payload.name || !payload.email || !payload.temp_password || !payload.vio_office) {
      return { data: null, error: "Bad Request: Name, email, temporary password, and VIO office are required.", status: 400, requestId: reqId };
    }
    let agentsList = [];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vh_mock_admin_agents");
      if (stored) {
        try { agentsList = JSON.parse(stored); } catch {}
      }
    }
    const now = new Date().toISOString();
    const newId = Math.floor(Math.random() * 900) + 203;
    const newAgent = {
      id: newId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || "+2348000000000",
      role: "agent",
      is_active: true,
      must_change_password: true,
      created_by: 1,
      state_id: payload.state_id || 25,
      lga_id: payload.lga_id || 516,
      created_at: now,
      updated_at: now,
      agent_profile: {
        id: newId - 100,
        vio_office: payload.vio_office,
        state: payload.state || "Lagos",
        lga: payload.lga || "Ikeja",
        state_id: payload.state_id || 25,
        lga_id: payload.lga_id || 516,
        capabilities: payload.capabilities || ["driver_licence", "roadworthiness"],
        created_at: now,
        updated_at: now
      },
      bank_account: null,
      wallet: {
        balance_kobo: 0,
        currency: "NGN"
      }
    };
    agentsList.unshift(newAgent);
    if (typeof window !== "undefined") {
      localStorage.setItem("vh_mock_admin_agents", JSON.stringify(agentsList));
    }
    return { data: newAgent, error: null, status: 201, requestId: reqId };
  }

  if (endpoint.startsWith("/admin/agents/") && endpoint.endsWith("/deactivate") && method === "PATCH") {
    const id = parseInt(endpoint.split("/")[3], 10);
    let agentsList = [];
    let target = null;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vh_mock_admin_agents");
      if (stored) {
        try { agentsList = JSON.parse(stored); } catch {}
      }
    }
    agentsList = agentsList.map((a) => {
      if (a.id === id) {
        target = { ...a, is_active: false };
        return target;
      }
      return a;
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("vh_mock_admin_agents", JSON.stringify(agentsList));
    }
    return { data: target || { id, is_active: false, role: "agent" }, error: null, status: 200, requestId: reqId };
  }

  // ─── Section 5: Customer Applications (Driver's Licence) ───────────────────

  // POST /applications/driver-licence
  if (endpoint === "/applications/driver-licence" && method === "POST") {
    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    let appList = [];
    if (typeof window !== "undefined") {
      try { appList = JSON.parse(localStorage.getItem("vh_mock_applications") || "[]"); } catch {}
    }
    const newApp = {
      id: Date.now(),
      status: "submitted",
      application_type: payload.application_type || "fresh",
      first_name: payload.first_name || "",
      middle_name: payload.middle_name || "",
      last_name: payload.last_name || "",
      date_of_birth: payload.date_of_birth || "",
      gender: payload.gender || "",
      state_of_origin: payload.state_of_origin || "",
      lga_of_origin: payload.lga_of_origin || "",
      nationality: payload.nationality || "",
      marital_status: payload.marital_status || "",
      residential_address: payload.residential_address || "",
      nin: payload.nin || "",
      blood_group: payload.blood_group || "",
      driving_school_certificate_number: payload.driving_school_certificate_number || "",
      validity_period: payload.validity_period || "",
      licence_class: payload.licence_class || "",
      state_of_residence: payload.state_of_residence || "",
      lga: payload.lga || "",
      state_id: payload.state_id || null,
      lga_id: payload.lga_id || null,
      next_of_kin_name: payload.next_of_kin_name || "",
      next_of_kin_relationship: payload.next_of_kin_relationship || "",
      next_of_kin_phone: payload.next_of_kin_phone || "",
      documents: payload.id_document ? [{ id: 1, application_id: null, ...payload.id_document }] : [],
      events: [{ id: 1, status: "submitted", note: "Application submitted successfully.", created_at: new Date().toISOString() }],
      payment_options: {
        payment_id: Math.floor(Math.random() * 9000) + 1000,
        application_id: null,
        amount_kobo: mockFeeKobo(payload.application_type, payload.validity_period),
        checkout_url: "https://sandbox.monnify.com/checkout/demo_ref",
        payment_reference: `vhc_ref_${Date.now()}`,
        payment_status: "pending",
        wallet_balance_kobo: 0,
        can_pay_from_wallet: false,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    newApp.documents = newApp.documents.map((d) => ({ ...d, application_id: newApp.id }));
    newApp.payment_options.application_id = newApp.id;
    appList.unshift(newApp);
    if (typeof window !== "undefined") {
      localStorage.setItem("vh_mock_applications", JSON.stringify(appList));
    }
    return { data: newApp, error: null, status: 201, requestId: reqId };
  }

  // GET /applications
  if (endpoint === "/applications" && method === "GET") {
    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    let appList = [];
    if (typeof window !== "undefined") {
      try { appList = JSON.parse(localStorage.getItem("vh_mock_applications") || "[]"); } catch {}
    }
    return { data: appList, error: null, status: 200, requestId: reqId };
  }

  // GET /applications/{id}
  if (endpoint.match(/^\/applications\/\d+$/) && method === "GET") {
    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    const id = parseInt(endpoint.split("/")[2], 10);
    let appList = [];
    if (typeof window !== "undefined") {
      try { appList = JSON.parse(localStorage.getItem("vh_mock_applications") || "[]"); } catch {}
    }
    const found = appList.find((a) => a.id === id);
    if (!found) return { data: null, error: "Application not found.", status: 404, requestId: reqId };
    return { data: found, error: null, status: 200, requestId: reqId };
  }

  // POST /applications/{id}/documents
  if (endpoint.match(/^\/applications\/\d+\/documents$/) && method === "POST") {
    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    const id = parseInt(endpoint.split("/")[2], 10);
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    let appList = [];
    if (typeof window !== "undefined") {
      try { appList = JSON.parse(localStorage.getItem("vh_mock_applications") || "[]"); } catch {}
    }
    const newDoc = { id: Date.now(), application_id: id, doc_type: payload.doc_type, file_url: payload.file_url };
    appList = appList.map((a) => a.id === id ? { ...a, documents: [...(a.documents || []), newDoc] } : a);
    if (typeof window !== "undefined") {
      localStorage.setItem("vh_mock_applications", JSON.stringify(appList));
    }
    return { data: newDoc, error: null, status: 201, requestId: reqId };
  }

  // PATCH /applications/{id}/reapply
  if (endpoint.match(/^\/applications\/\d+\/reapply$/) && method === "PATCH") {
    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    const id = parseInt(endpoint.split("/")[2], 10);
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    let appList = [];
    if (typeof window !== "undefined") {
      try { appList = JSON.parse(localStorage.getItem("vh_mock_applications") || "[]"); } catch {}
    }
    const appIndex = appList.findIndex((a) => a.id === id);
    if (appIndex === -1) return { data: null, error: "Application not found.", status: 404, requestId: reqId };
    const targetApp = appList[appIndex];
    if (targetApp.status !== "staff_rejected") {
      return { data: null, error: "Application can only be resubmitted when it has been rejected.", status: 400, requestId: reqId };
    }
    // Apply all changed fields
    const updatableFields = [
      "first_name","middle_name","last_name","date_of_birth","gender",
      "state_of_origin","lga_of_origin","nationality","marital_status",
      "residential_address","nin","blood_group",
      "state_of_residence","lga","state_id","lga_id",
      "next_of_kin_name","next_of_kin_relationship","next_of_kin_phone",
    ];
    updatableFields.forEach((f) => { if (payload[f] !== undefined) targetApp[f] = payload[f]; });
    // Append any new documents
    if (Array.isArray(payload.documents) && payload.documents.length > 0) {
      const newDocs = payload.documents.map((d, i) => ({ id: Date.now() + i, application_id: id, ...d, uploaded_at: new Date().toISOString() }));
      targetApp.documents = [...(targetApp.documents || []), ...newDocs];
    }
    // Reset status and clear rejection note
    targetApp.status = "submitted";
    targetApp.rejection_reason = null;
    targetApp.staff_note = null;
    targetApp.updated_at = new Date().toISOString();
    targetApp.payment_status = "pending";
    if (targetApp.payment_options) targetApp.payment_options.payment_status = "pending";
    targetApp.events = [...(targetApp.events || []), {
      id: Date.now(), old_status: "staff_rejected", new_status: "submitted",
      note: "Customer resubmitted application with corrections.",
      created_at: new Date().toISOString()
    }];
    appList[appIndex] = targetApp;
    if (typeof window !== "undefined") {
      localStorage.setItem("vh_mock_applications", JSON.stringify(appList));
    }
    return { data: targetApp, error: null, status: 200, requestId: reqId };
  }

  // ─── Customer Wallet & Dedicated Virtual Account ────────────────
  // GET /wallet
  if (endpoint === "/wallet" && method === "GET") {
    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    let wallet = { balance_kobo: 5000000, virtual_account: { bank_name: "Wema Bank", account_number: "9800000015", account_name: "VEHICULARS-CHINEDU CUSTOMER" } };
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("vh_mock_wallet");
        if (stored) wallet = JSON.parse(stored);
        else localStorage.setItem("vh_mock_wallet", JSON.stringify(wallet));
      } catch {}
    }
    return { data: wallet, error: null, status: 200, requestId: reqId };
  }

  // POST /wallet/activate
  if (endpoint === "/wallet/activate" && method === "POST") {
    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    if (!payload.bvn && !payload.nin) {
      return { data: null, error: "BVN or NIN is required to activate your wallet", status: 400, requestId: reqId };
    }
    let wallet = { balance_kobo: 5000000, virtual_account: null, needs_identity_verification: true };
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("vh_mock_wallet");
        if (stored) wallet = JSON.parse(stored);
      } catch {}
    }
    const userObj = getCachedUser();
    const accountName = userObj?.name ? `VEHICULARS-${userObj.name.toUpperCase()}` : "VEHICULARS-CUSTOMER";
    wallet.virtual_account = {
      bank_name: "Moniepoint MFB",
      bank_code: "50515",
      account_number: `99${String(userObj?.id || 1).padStart(8, "0")}`,
      account_name: accountName,
    };
    wallet.needs_identity_verification = false;
    if (typeof window !== "undefined") {
      localStorage.setItem("vh_mock_wallet", JSON.stringify(wallet));
    }
    return { data: wallet, error: null, status: 200, requestId: reqId };
  }

  // POST /wallet/deposit/initialize
  if (endpoint === "/wallet/deposit/initialize" && method === "POST") {
    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    const amount = parseInt(payload.amount_kobo || 0, 10);
    if (amount <= 0) return { data: null, error: "Deposit amount must be greater than zero.", status: 400, requestId: reqId };
    
    const ref = `dep_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    if (typeof window !== "undefined") {
      localStorage.setItem("vh_mock_pending_deposit", JSON.stringify({ reference: ref, amount }));
    }

    return { 
      data: {
        authorization_url: `/dashboard/wallet?reference=${ref}`,
        reference: ref,
        amount_kobo: amount
      }, 
      error: null, 
      status: 200, 
      requestId: reqId 
    };
  }

  // POST /wallet/deposit/verify
  if (endpoint === "/wallet/deposit/verify" && method === "POST") {
    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    const ref = payload.reference;
    if (!ref) return { data: null, error: "Missing reference.", status: 400, requestId: reqId };
    
    let wallet = { balance_kobo: 5000000, virtual_account: { bank_name: "Wema Bank", account_number: "9800000015", account_name: "VEHICULARS-CHINEDU CUSTOMER" } };
    let txs = [];
    let amount = 3000000;
    
    if (typeof window !== "undefined") {
      try {
        const storedPending = localStorage.getItem("vh_mock_pending_deposit");
        if (storedPending) {
          const pending = JSON.parse(storedPending);
          if (pending.reference === ref) {
             amount = pending.amount;
             localStorage.removeItem("vh_mock_pending_deposit");
          }
        }
        
        const stored = localStorage.getItem("vh_mock_wallet");
        if (stored) wallet = JSON.parse(stored);
        const storedTxs = localStorage.getItem("vh_mock_wallet_txs");
        if (storedTxs) txs = JSON.parse(storedTxs);
      } catch {}
    }
    
    if (txs.find(tx => tx.reference === ref)) {
      return { data: wallet, error: null, status: 200, requestId: reqId };
    }

    wallet.balance_kobo += amount;
    const newTx = {
      id: Date.now(),
      wallet_id: 1,
      type: "credit",
      amount_kobo: amount,
      reference: ref,
      source: "monnify_deposit",
      created_at: new Date().toISOString()
    };
    txs.unshift(newTx);
    if (typeof window !== "undefined") {
      localStorage.setItem("vh_mock_wallet", JSON.stringify(wallet));
      localStorage.setItem("vh_mock_wallet_txs", JSON.stringify(txs));
    }
    return { data: wallet, error: null, status: 200, requestId: reqId };
  }

  // GET /wallet/transactions
  if (endpoint === "/wallet/transactions" && method === "GET") {
    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    let txs = [
      { id: 1, wallet_id: 1, type: "credit", amount_kobo: 5000000, reference: "dva_dep_init_001", source: "virtual_account_deposit", created_at: new Date().toISOString() }
    ];
    if (typeof window !== "undefined") {
      try {
        const storedTxs = localStorage.getItem("vh_mock_wallet_txs");
        if (storedTxs) txs = JSON.parse(storedTxs);
        else localStorage.setItem("vh_mock_wallet_txs", JSON.stringify(txs));
      } catch {}
    }
    return { data: txs, error: null, status: 200, requestId: reqId };
  }

  // POST /wallet/pay OR POST /applications/{id}/pay-from-wallet
  if ((endpoint === "/wallet/pay" || endpoint.match(/^\/applications\/\d+\/pay-from-wallet$/)) && method === "POST") {
    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    let appId = payload.application_id;
    if (endpoint.match(/^\/applications\/\d+\/pay-from-wallet$/)) {
      appId = parseInt(endpoint.split("/")[2], 10);
    }
    let wallet = { balance_kobo: 5000000, virtual_account: { bank_name: "Wema Bank", account_number: "9800000015", account_name: "VEHICULARS-CHINEDU CUSTOMER" } };
    let appList = [];
    let txs = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("vh_mock_wallet");
        if (stored) wallet = JSON.parse(stored);
        const storedApps = localStorage.getItem("vh_mock_applications");
        if (storedApps) appList = JSON.parse(storedApps);
        const storedTxs = localStorage.getItem("vh_mock_wallet_txs");
        if (storedTxs) txs = JSON.parse(storedTxs);
      } catch {}
    }
    const appIndex = appList.findIndex((a) => a.id === appId);
    const targetApp = appIndex >= 0 ? appList[appIndex] : null;
    const fee = payload.amount_kobo || (targetApp?.payment_options?.amount_kobo || mockFeeKobo(targetApp?.application_type, targetApp?.validity_period));
    if (wallet.balance_kobo < fee) {
      return { data: null, error: "Insufficient wallet balance to pay for this application.", status: 400, requestId: reqId };
    }
    wallet.balance_kobo -= fee;
    if (targetApp) {
      targetApp.payment_status = "paid";
      if (targetApp.payment_options) {
        targetApp.payment_options.payment_status = "paid";
        targetApp.payment_options.wallet_balance_kobo = wallet.balance_kobo;
      }
      targetApp.status = "staff_review";
      targetApp.events = [...(targetApp.events || []), {
        id: Date.now(),
        application_id: targetApp.id,
        old_status: "submitted",
        new_status: "staff_review",
        actor_id: 15,
        note: `Paid ${fee / 100} NGN via virtual wallet`,
        created_at: new Date().toISOString()
      }];
      appList[appIndex] = targetApp;
    }
    const newTx = {
      id: Date.now(),
      wallet_id: 1,
      type: "debit",
      amount_kobo: fee,
      reference: `wal_deb_${appId || Date.now()}`,
      source: "application_payment",
      created_at: new Date().toISOString()
    };
    txs.unshift(newTx);
    if (typeof window !== "undefined") {
      localStorage.setItem("vh_mock_wallet", JSON.stringify(wallet));
      localStorage.setItem("vh_mock_applications", JSON.stringify(appList));
      localStorage.setItem("vh_mock_wallet_txs", JSON.stringify(txs));
    }
    return { data: { status: "success", amount_paid_kobo: fee, remaining_wallet_balance_kobo: wallet.balance_kobo }, error: null, status: 200, requestId: reqId };
  }

  /* ────────────────────────────────────────────────────────────
     Customer Reapply — PATCH /applications/{id}/reapply
     ──────────────────────────────────────────────────────────── */
  const reapplyMatch = endpoint.match(/^\/applications\/(\d+)\/reapply$/);
  if (reapplyMatch && method === "PATCH") {
    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    const targetId = parseInt(reapplyMatch[1], 10);
    let appList = [];
    if (typeof window !== "undefined") {
      try { appList = JSON.parse(localStorage.getItem("vh_mock_applications") || "[]"); } catch {}
    }
    const appIndex = appList.findIndex((a) => a.id === targetId);
    if (appIndex === -1) return { data: null, error: "Application not found.", status: 404, requestId: reqId };
    const targetApp = appList[appIndex];
    if (targetApp.status !== "staff_rejected") {
      return { data: null, error: "Only rejected applications can be resubmitted.", status: 422, requestId: reqId };
    }
    const payload = typeof body === "string" ? JSON.parse(body) : body || {};
    // Merge updated fields
    Object.assign(targetApp, payload);
    // Remove nested id_document from top-level merge — handle separately
    if (payload.id_document) {
      delete targetApp.id_document;
      const newDoc = {
        id: Date.now(),
        application_id: targetApp.id,
        doc_type: payload.id_document.doc_type || "proof_of_identity",
        file_url: payload.id_document.file_url || "",
        uploaded_at: new Date().toISOString(),
      };
      targetApp.documents = [...(targetApp.documents || []), newDoc];
    }
    targetApp.status = "submitted";
    targetApp.staff_note = null;
    targetApp.events = [...(targetApp.events || []), {
      id: Date.now(),
      status: "submitted",
      note: "Application details corrected and resubmitted by customer.",
      created_at: new Date().toISOString(),
    }];
    appList[appIndex] = targetApp;
    if (typeof window !== "undefined") localStorage.setItem("vh_mock_applications", JSON.stringify(appList));
    return { data: targetApp, error: null, status: 200, requestId: reqId };
  }

  /* ────────────────────────────────────────────────────────────
     Staff Review, Verification & Dispatch Routing
     ──────────────────────────────────────────────────────────── */
  if (endpoint.startsWith("/staff/applications")) {

    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    const user = getCachedUser();
    if (user?.role !== "staff" && user?.role !== "admin") {
      return { data: null, error: "Forbidden: Staff or Admin role required.", status: 403, requestId: reqId };
    }

    let appList = [];
    if (typeof window !== "undefined") {
      try { appList = JSON.parse(localStorage.getItem("vh_mock_applications") || "[]"); } catch {}
    }

    // Seed realistic demo applications if queue is empty or low so staff has immediate rich data to act upon
    if (appList.length === 0) {
      const now = new Date();
      const seedApps = [
        {
          id: 501,
          application_type: "fresh",
          validity_period: "3 years",
          status: "submitted",
          first_name: "Chinedu",
          last_name: "Okafor",
          date_of_birth: "1994-06-14",
          state_of_residence: "Lagos",
          lga: "Ikeja",
          next_of_kin_name: "Ngozi Okafor",
          next_of_kin_phone: "+2348033331111",
          payment_status: "paid",
          payment_options: { amount_kobo: 3867500, payment_status: "paid", payment_reference: "ref_seed_501" },
          documents: [
            { id: 1, application_id: 501, doc_type: "nin_slip", file_url: "https://example.com/nin_chinedu.pdf", uploaded_at: now.toISOString() },
            { id: 2, application_id: 501, doc_type: "passport_photo", file_url: "https://example.com/photo_chinedu.jpg", uploaded_at: now.toISOString() }
          ],
          events: [{ id: 1, status: "submitted", note: "Application and initial fee submitted online.", created_at: now.toISOString() }],
          created_at: now.toISOString()
        },
        {
          id: 502,
          application_type: "fresh",
          validity_period: "3 years",
          status: "staff_review",
          first_name: "Fatima",
          last_name: "Abubakar",
          date_of_birth: "1998-11-20",
          state_of_residence: "Lagos",
          lga: "Surulere",
          next_of_kin_name: "Sani Abubakar",
          next_of_kin_phone: "+2348022229999",
          payment_status: "paid",
          payment_options: { amount_kobo: 3867500, payment_status: "paid", payment_reference: "ref_seed_502" },
          documents: [
            { id: 3, application_id: 502, doc_type: "nin_slip", file_url: "https://example.com/nin_fatima.pdf", uploaded_at: now.toISOString() }
          ],
          events: [
            { id: 1, status: "submitted", note: "Application submitted online.", created_at: now.toISOString() },
            { id: 2, status: "staff_review", note: "NIN slip and biodata verified by staff.", created_at: now.toISOString() }
          ],
          staff_id: 101,
          staff_note: "NIN slip and biodata verified by staff.",
          created_at: now.toISOString()
        },
        {
          id: 503,
          application_type: "fresh",
          validity_period: "3 years",
          status: "driving_school_enrolled",
          first_name: "Babajide",
          last_name: "Alabi",
          date_of_birth: "1991-03-05",
          state_of_residence: "Lagos",
          lga: "Ikeja",
          next_of_kin_name: "Kemi Alabi",
          next_of_kin_phone: "+2348055554444",
          payment_status: "paid",
          payment_options: { amount_kobo: 3867500, payment_status: "paid", payment_reference: "ref_seed_503" },
          documents: [
            { id: 4, application_id: 503, doc_type: "nin_slip", file_url: "https://example.com/nin_babajide.pdf", uploaded_at: now.toISOString() }
          ],
          driving_school: { name: "Lagos State Accredited Driving Academy (Ikeja)", target_date: "2026-08-10" },
          driving_school_target_date: "2026-08-10",
          events: [
            { id: 1, status: "submitted", note: "Application submitted.", created_at: now.toISOString() },
            { id: 2, status: "driving_school_enrolled", note: "Enrolled in driving school: Lagos State Accredited Driving Academy (Ikeja). Target: 2026-08-10", created_at: now.toISOString() }
          ],
          created_at: now.toISOString()
        },
        {
          id: 504,
          application_type: "renewal",
          validity_period: "3 years",
          status: "submitted",
          first_name: "Emeka",
          last_name: "Eze",
          date_of_birth: "1985-09-12",
          state_of_residence: "Lagos",
          lga: "Lekki",
          next_of_kin_name: "Amaka Eze",
          next_of_kin_phone: "+2348099998888",
          payment_status: "paid",
          payment_options: { amount_kobo: 3000000, payment_status: "paid", payment_reference: "ref_seed_504" },
          documents: [],
          events: [{ id: 1, status: "submitted", note: "Renewal application submitted.", created_at: now.toISOString() }],
          created_at: now.toISOString()
        }
      ];
      appList = seedApps;
      if (typeof window !== "undefined") {
        localStorage.setItem("vh_mock_applications", JSON.stringify(appList));
      }
    }

    // GET /staff/applications -> list fresh applications, filter out renewals/reissues
    if (method === "GET") {
      let freshApps = appList.filter((a) => a.application_type === "fresh" || !a.application_type);
      const urlObj = endpoint.includes("?") ? new URLSearchParams(endpoint.split("?")[1]) : null;
      const statusParam = urlObj?.get("status");
      if (statusParam) {
        freshApps = freshApps.filter((a) => a.status === statusParam);
      }
      return { data: freshApps, error: null, status: 200, requestId: reqId };
    }

    // Extract target ID for POST actions
    const idMatch = endpoint.match(/^\/staff\/applications\/(\d+)\/([a-z-]+)$/);
    if (!idMatch && method === "POST") {
      return { data: null, error: "Invalid staff action endpoint path.", status: 400, requestId: reqId };
    }

    const targetId = parseInt(idMatch[1], 10);
    const action = idMatch[2];
    const appIndex = appList.findIndex((a) => a.id === targetId);
    if (appIndex === -1) {
      return { data: null, error: "Application not found.", status: 404, requestId: reqId };
    }

    const targetApp = appList[appIndex];

    // Policy check: Rejects renewals/reissues with 403
    if (targetApp.application_type === "renewal" || targetApp.application_type === "reissue") {
      return {
        data: null,
        error: `Forbidden: ${targetApp.application_type.toUpperCase()} applications bypass staff review directly to routing per verification rules.`,
        status: 403,
        requestId: reqId
      };
    }

    const payload = typeof body === "string" ? JSON.parse(body) : body || {};

    // POST /staff/applications/{id}/approve
    if (action === "approve") {
      targetApp.status = "staff_review";
      targetApp.staff_id = user?.id || 101;
      targetApp.staff_note = payload.note || "Verified and approved by staff officer.";
      targetApp.events.push({
        id: Date.now(),
        status: "staff_review",
        note: targetApp.staff_note,
        created_at: new Date().toISOString()
      });
      appList[appIndex] = targetApp;
      if (typeof window !== "undefined") localStorage.setItem("vh_mock_applications", JSON.stringify(appList));
      return {
        data: { id: targetApp.id, status: targetApp.status, staff_id: targetApp.staff_id, staff_note: targetApp.staff_note },
        error: null,
        status: 200,
        requestId: reqId
      };
    }

    // POST /staff/applications/{id}/reject
    if (action === "reject") {
      targetApp.status = "staff_rejected";
      targetApp.staff_note = payload.reason || "Rejected during staff verification check.";
      targetApp.events.push({
        id: Date.now(),
        status: "staff_rejected",
        note: targetApp.staff_note,
        created_at: new Date().toISOString()
      });
      appList[appIndex] = targetApp;
      if (typeof window !== "undefined") localStorage.setItem("vh_mock_applications", JSON.stringify(appList));
      return {
        data: { id: targetApp.id, status: targetApp.status, staff_note: targetApp.staff_note },
        error: null,
        status: 200,
        requestId: reqId
      };
    }

    // POST /staff/applications/{id}/enroll-driving-school
    if (action === "enroll-driving-school") {
      targetApp.status = "driving_school_enrolled";
      targetApp.driving_school_target_date = payload.target_date || new Date().toISOString();
      const verifImg = payload.verification_image_url || "https://storage.vehiculars.com/certs/driving_school_slip.png";
      targetApp.driving_school = {
        name: payload.driving_school_name || "Accredited Partner Academy",
        target_date: targetApp.driving_school_target_date,
        instructions: "Attend mandatory theory and practical driving sessions before graduation.",
        verification_image_url: verifImg
      };
      if (!targetApp.documents) targetApp.documents = [];
      targetApp.documents.push({
        id: Date.now(),
        application_id: targetApp.id,
        doc_type: "driving_school_verification_slip",
        file_url: verifImg,
        uploaded_at: new Date().toISOString()
      });
      targetApp.events.push({
        id: Date.now(),
        status: "driving_school_enrolled",
        note: `Enrolled in driving school: ${targetApp.driving_school.name} (Graduation target: ${targetApp.driving_school_target_date}). Verification image attached.`,
        created_at: new Date().toISOString()
      });
      appList[appIndex] = targetApp;
      if (typeof window !== "undefined") localStorage.setItem("vh_mock_applications", JSON.stringify(appList));
      return {
        data: { id: targetApp.id, status: targetApp.status, driving_school_target_date: targetApp.driving_school_target_date, driving_school: targetApp.driving_school },
        error: null,
        status: 200,
        requestId: reqId
      };
    }

    // POST /staff/applications/{id}/upload-driving-school-certificate
    if (action === "upload-driving-school-certificate") {
      targetApp.status = "driving_school_graduated";
      const certUrl = payload.certificate_url || "https://storage.vehiculars.com/certs/grad_certificate_demo.pdf";
      targetApp.driving_school_certificate_url = certUrl;
      if (!targetApp.documents) targetApp.documents = [];
      targetApp.documents.push({
        id: Date.now(),
        application_id: targetApp.id,
        doc_type: "driving_school_certificate",
        file_url: certUrl,
        uploaded_at: new Date().toISOString()
      });
      targetApp.events.push({
        id: Date.now(),
        status: "driving_school_graduated",
        note: "Driving school graduation certificate verified and attached.",
        created_at: new Date().toISOString()
      });
      appList[appIndex] = targetApp;
      if (typeof window !== "undefined") localStorage.setItem("vh_mock_applications", JSON.stringify(appList));
      return {
        data: { id: targetApp.id, status: targetApp.status },
        error: null,
        status: 200,
        requestId: reqId
      };
    }

    // POST /staff/applications/{id}/route
    if (action === "route") {
      targetApp.status = "routed";
      targetApp.events.push({
        id: Date.now(),
        status: "routed",
        note: `Routed to VIO Field Agents in ${targetApp.lga || "LGA"} sector. Offers dispatched.`,
        created_at: new Date().toISOString()
      });
      appList[appIndex] = targetApp;
      if (typeof window !== "undefined") localStorage.setItem("vh_mock_applications", JSON.stringify(appList));
      return {
        data: { application_id: targetApp.id, offers_created: 2, status: targetApp.status },
        error: null,
        status: 200,
        requestId: reqId
      };
    }


    return { data: null, error: `Unhandled staff action ${action}`, status: 400, requestId: reqId };
  }

  /* ────────────────────────────────────────────────────────────
     Agent Operations — Offers, Applications, Wallet, Bank Account
     ──────────────────────────────────────────────────────────── */
  if (endpoint.startsWith("/agent")) {
    if (!token) return { data: null, error: "Unauthorized", status: 401, requestId: reqId };
    const user = getCachedUser();
    if (user?.role !== "agent") {
      return { data: null, error: "Forbidden: Agent role required.", status: 403, requestId: reqId };
    }

    // GET /agent/wallet — earnings balance and transaction history
    if (endpoint === "/agent/wallet" && method === "GET") {
      let txs = [];
      if (typeof window !== "undefined") {
        try { txs = JSON.parse(localStorage.getItem("vh_mock_agent_wallet_txs") || "[]"); } catch {}
      }
      const balanceKobo = txs.reduce((sum, tx) => sum + (tx.type === "credit" ? tx.amount_kobo : -tx.amount_kobo), 0);
      return {
        data: {
          agent_id: user?.id || 1,
          user_id: user?.id || 1,
          balance_kobo: Math.max(0, balanceKobo),
          balance_naira: Math.max(0, balanceKobo) / 100,
          vio_office: "Ikeja VIO",
          lga: user?.lga || "Ikeja",
          state: "Lagos",
          transactions: [...txs].reverse(),
        },
        error: null, status: 200, requestId: reqId,
      };
    }

    // GET /agent/bank-account
    if (endpoint === "/agent/bank-account" && method === "GET") {
      let bankAccount = null;
      if (typeof window !== "undefined") {
        try { bankAccount = JSON.parse(localStorage.getItem("vh_mock_agent_bank_account") || "null"); } catch {}
      }
      return { data: bankAccount || {}, error: null, status: 200, requestId: reqId };
    }

    // POST /agent/bank-account
    if (endpoint === "/agent/bank-account" && method === "POST") {
      const payload = typeof body === "string" ? JSON.parse(body) : body || {};
      const bankNames = {
        "044": "Access Bank", "011": "First Bank of Nigeria", "058": "Guaranty Trust Bank",
        "033": "United Bank For Africa", "057": "Zenith Bank", "035": "Wema Bank",
        "232": "Sterling Bank", "082": "Keystone Bank", "070": "Fidelity Bank",
      };
      const saved = {
        bank_code: payload.bank_code,
        bank_name: bankNames[payload.bank_code] || "Bank",
        account_number: payload.account_number,
        account_name: (user?.name || "VIO FIELD AGENT").toUpperCase(),
        verified: true,
        created_at: new Date().toISOString(),
      };
      if (typeof window !== "undefined") localStorage.setItem("vh_mock_agent_bank_account", JSON.stringify(saved));
      return { data: saved, error: null, status: 200, requestId: reqId };
    }

    // GET /agent/offers
    if (endpoint === "/agent/offers" && method === "GET") {
      let appList = [];
      if (typeof window !== "undefined") {
        try { appList = JSON.parse(localStorage.getItem("vh_mock_applications") || "[]"); } catch {}
      }
      const offers = appList
        .filter((a) => a.status === "routed")
        .map((a) => ({
          id: a.id * 100 + 1,
          application_id: a.id,
          application_type: a.application_type || "fresh",
          lga: a.lga || "Ikeja",
          service_fee_kobo: a.payment_options?.amount_kobo ? Math.round(a.payment_options.amount_kobo * 0.85) : 2550000,
          created_at: a.created_at,
        }));
      return { data: offers, error: null, status: 200, requestId: reqId };
    }

    // POST /agent/offers/{id}/accept
    const offerAcceptMatch = endpoint.match(/^\/agent\/offers\/(\d+)\/accept$/);
    if (offerAcceptMatch && method === "POST") {
      const offerId = parseInt(offerAcceptMatch[1], 10);
      // Offer ID → application ID: offerId = appId * 100 + 1
      const appId = Math.floor(offerId / 100);
      let appList = [];
      if (typeof window !== "undefined") {
        try { appList = JSON.parse(localStorage.getItem("vh_mock_applications") || "[]"); } catch {}
      }
      const appIndex = appList.findIndex((a) => a.id === appId);
      if (appIndex !== -1) {
        const app = appList[appIndex];
        app.status = "agent_accepted";
        app.assigned_agent = { id: user?.id || 1, name: user?.name || "Agent", lga: app.lga };
        app.events = [...(app.events || []), {
          id: Date.now(), status: "agent_accepted",
          note: `Agent ${user?.name || "Field Agent"} accepted this application.`,
          created_at: new Date().toISOString(),
        }];
        appList[appIndex] = app;

        // Credit agent wallet
        const earnedKobo = app.payment_options?.amount_kobo
          ? Math.round(app.payment_options.amount_kobo * 0.85)
          : 2550000;
        let txs = [];
        if (typeof window !== "undefined") {
          try { txs = JSON.parse(localStorage.getItem("vh_mock_agent_wallet_txs") || "[]"); } catch {}
        }
        txs.push({
          id: Date.now(), type: "credit", amount_kobo: earnedKobo,
          amount_naira: earnedKobo / 100,
          reference: `agent_credit_${appId}_${user?.id || 1}_${Math.floor(Date.now() / 1000)}`,
          source: `application_payment_app_${appId}`,
          description: `Earnings for accepting application #${appId}`,
          created_at: new Date().toISOString(),
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("vh_mock_applications", JSON.stringify(appList));
          localStorage.setItem("vh_mock_agent_wallet_txs", JSON.stringify(txs));
        }
        const newBalance = txs.reduce((sum, tx) => sum + (tx.type === "credit" ? tx.amount_kobo : -tx.amount_kobo), 0);
        return {
          data: {
            offer_id: offerId, application_id: appId, status: "agent_accepted",
            wallet_credit: { amount_kobo: earnedKobo, new_balance_kobo: newBalance, reference: txs[txs.length - 1].reference },
          },
          error: null, status: 200, requestId: reqId,
        };
      }
      return { data: null, error: "Application not found for this offer.", status: 404, requestId: reqId };
    }

    // POST /agent/offers/{id}/decline
    const offerDeclineMatch = endpoint.match(/^\/agent\/offers\/(\d+)\/decline$/);
    if (offerDeclineMatch && method === "POST") {
      return { data: { message: "Offer declined." }, error: null, status: 200, requestId: reqId };
    }

    // GET /agent/applications
    if (endpoint === "/agent/applications" && method === "GET") {
      let appList = [];
      if (typeof window !== "undefined") {
        try { appList = JSON.parse(localStorage.getItem("vh_mock_applications") || "[]"); } catch {}
      }
      const agentApps = appList.filter((a) => a.assigned_agent);
      return { data: agentApps, error: null, status: 200, requestId: reqId };
    }

    // GET /agent/transfers
    if (endpoint === "/agent/transfers" && method === "GET") {
      let txs = [];
      if (typeof window !== "undefined") {
        try { txs = JSON.parse(localStorage.getItem("vh_mock_agent_wallet_txs") || "[]"); } catch {}
      }
      return { data: [...txs].reverse(), error: null, status: 200, requestId: reqId };
    }

    return { data: null, error: `Agent endpoint ${endpoint} not handled in mock.`, status: 404, requestId: reqId };
  }

  // GET /applications/driver-licence/fee-schedule (optionally ?state_id=)
  if (endpoint.startsWith("/applications/driver-licence/fee-schedule") && method === "GET") {
    const prices = [
      { application_type: "fresh", validity_period: "3 years", amount_kobo: MOCK_FEE_SCHEDULE_KOBO.fresh["3 years"] },
      { application_type: "fresh", validity_period: "5 years", amount_kobo: MOCK_FEE_SCHEDULE_KOBO.fresh["5 years"] },
      { application_type: "renewal", validity_period: "3 years", amount_kobo: MOCK_FEE_SCHEDULE_KOBO.renewal["3 years"] },
      { application_type: "renewal", validity_period: "5 years", amount_kobo: MOCK_FEE_SCHEDULE_KOBO.renewal["5 years"] },
      { application_type: "reissue", validity_period: "3 years", amount_kobo: MOCK_FEE_SCHEDULE_KOBO.renewal["3 years"] },
      { application_type: "reissue", validity_period: "5 years", amount_kobo: MOCK_FEE_SCHEDULE_KOBO.renewal["5 years"] },
      { application_type: "international_permit", validity_period: null, amount_kobo: 3500000 },
    ];
    return { data: { prices }, error: null, status: 200, requestId: reqId };
  }

  return { data: null, error: `Endpoint ${endpoint} not found in mock fallback`, status: 404, requestId: reqId };

}


/**
 * Core API request wrapper that enforces Vehiculars headers & rules:
 * - Attaches Authorization: Bearer <token>
 * - Captures X-Request-ID for tracing
 * - Handles 401 Unauthorized / 403 Forbidden / 429 Rate Limiting
 */
// FastAPI validation errors (422) send `detail` as an array of
// {type, loc, msg, input, ctx} objects rather than a string — rendering that
// array directly as a React child crashes with "Objects are not valid as a
// React child". Normalize any shape `detail`/`message`/`error` can take into
// a plain, human-readable string.
function stringifyErrorDetail(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const field = Array.isArray(item.loc) ? item.loc.filter((p) => p !== "body").join(".") : null;
          const msg = item.msg || item.message;
          if (field && msg) return `${field}: ${msg}`;
          if (msg) return msg;
        }
        return null;
      })
      .filter(Boolean);
    return parts.length ? parts.join("; ") : null;
  }
  if (typeof value === "object") {
    return value.msg || value.message || null;
  }
  return String(value);
}

export async function apiFetch(endpoint, { method = "GET", body, headers = {} } = {}) {
  const token = getToken();
  const url = `${API_BASE}${endpoint}`;

  const reqHeaders = {
    "Accept": "application/json",
    ...headers,
  };

  if (body && !(body instanceof FormData)) {
    reqHeaders["Content-Type"] = "application/json";
  }

  if (token && !reqHeaders["Authorization"]) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers: reqHeaders,
  };

  if (body) {
    options.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const requestId = response.headers.get("X-Request-ID") || response.headers.get("x-request-id") || null;
    const status = response.status;

    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => "");
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      if (status === 401) {
        removeToken();
      }
      const errorMessage =
        stringifyErrorDetail(data?.detail) ||
        stringifyErrorDetail(data?.message) ||
        stringifyErrorDetail(data?.error) ||
        (status === 429 ? "Too Many Requests. Rate limit exceeded. Please wait a moment." : `Error ${status}: Request failed`);

      if (requestId) {
        console.warn(`[API Error ${status}] X-Request-ID: ${requestId} — ${errorMessage}`);
      }

      return {
        data: null,
        error: errorMessage,
        status,
        requestId,
      };
    }

    return {
      data,
      error: null,
      status,
      requestId,
    };
  } catch (err) {
    // Mock fallback is opt-in only — without it, a real backend outage or CORS
    // misconfiguration surfaces as a visible error instead of silently switching
    // to fake, persisted data.
    if (process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK === "true") {
      console.info(`[API Fallback Notice] Live server not reachable. Using local simulated endpoints for ${method} ${endpoint}.`);
      return handleMockFallback(endpoint, method, options.body, reqHeaders);
    }
    console.error(`[API Error] Live server unreachable for ${method} ${endpoint}:`, err);
    return {
      data: null,
      error: `Could not reach the server. Please check your internet connection and try again.`,
      status: 0,
      requestId: null,
    };
  }
}
