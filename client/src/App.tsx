import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog } from "./components/Dialog";
import { apiFetch } from "./lib/api";
import { useProgress } from "./lib/useProgress";
import { BenchmarksView } from "./components/BenchmarksView";
import { InterestsPicker } from "./components/InterestsPicker";
import type { AuthUser, Benchmark, Catalog, Interests, Milestone, RouteFilter, RouteId, RouteInfo, Source } from "./types";

// The three views the user can switch between
type View = "roadmap" | "benchmarks" | "sources";

const routeOrder: RouteId[] = ["thpt", "hsa", "sat"];

// Route metadata — kept client-side since it's static config, not DB content
const routes: Record<RouteId, RouteInfo> = {
  thpt: { label: "Điểm thi THPT", detail: "A00 · thang 30", scale: 30 },
  hsa: { label: "HSA · ĐHQGHN", detail: "Đánh giá năng lực · thang 150", scale: 150 },
  sat: { label: "SAT · College Board", detail: "Chứng chỉ quốc tế · thang 1.600", scale: 1600 }
};

// ── Main App ────────────────────────────────────

// This is where the page comes together: shared data and account state live here,
// while the view components below handle what the student sees and clicks.
function App() {
  const [view, setView] = useState<View>("roadmap");
  const [routeFilter, setRouteFilter] = useState<RouteFilter>("all");
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  const [showAuth, setShowAuth] = useState(false);
  const [showInterests, setShowInterests] = useState(false);
  const {
    user, progress: { completedTaskIds, interests }, updateProgress, login, logout,
    sessionLoading, sessionError, sessionNotice, saveStatus, retrySession, retrySave
  } = useProgress();
  // Wait until saved progress is available before letting the student change it.
  const editingDisabled = sessionLoading || !!sessionError;

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [catalog, setCatalog] = useState<Catalog>({ universities: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [dataErrors, setDataErrors] = useState<string[]>([]);
  const [reload, setReload] = useState(0);

  // Load the public admissions data on first opening the page and on each retry.
  // Account progress is loaded separately by useProgress.
  useEffect(() => {
    const controller = new AbortController();
    async function loadData() {
      setLoading(true);
      const options = { signal: controller.signal };
      // Keep the sections that load successfully usable if another request fails.
      const results = await Promise.allSettled([
        apiFetch<Milestone[]>("/api/milestones", options),
        apiFetch<Benchmark[]>("/api/benchmarks", options),
        apiFetch<Source[]>("/api/sources", options),
        apiFetch<Catalog>("/api/catalog", options).then((value) => {
          if (!value || !Array.isArray(value.universities) || !Array.isArray(value.categories)
            || value.universities.some((item) => !item || typeof item.id !== "string" || typeof item.name !== "string" || typeof item.shortName !== "string")
            || value.categories.some((item) => !item || typeof item.id !== "string" || typeof item.label !== "string")) {
            throw new Error("Danh sách trường, ngành chưa đúng định dạng.");
          }
          return value;
        })
      ]);
      if (controller.signal.aborted) return;
      const [m, b, s, c] = results;
      if (m.status === "fulfilled") setMilestones(m.value);
      if (b.status === "fulfilled") setBenchmarks(b.value);
      if (s.status === "fulfilled") setSources(s.value);
      if (c.status === "fulfilled") setCatalog(c.value);
      // These labels follow the request order above so failures name the right section.
      const names = ["lộ trình", "điểm chuẩn", "nguồn dữ liệu", "danh sách trường, ngành"];
      setDataErrors(results.flatMap((result, index) => result.status === "rejected" ? [names[index]] : []));
      setLoading(false);
    }
    void loadData();
    return () => controller.abort();
  }, [reload]);

  // Quick lookup for sources by ID (used by the badges)
  const sourceById = useMemo(
    () => Object.fromEntries(sources.map((s) => [s.id, s])),
    [sources]
  );

  // The roadmap routes are separate from university-specific cutoff methods.
  const filteredMilestones = milestones.filter(
    (m) => routeFilter === "all" || m.routeIds.includes(routeFilter)
  );


  // The API returns chronological order. Always resume at the first unfinished step.
  const nextTask = filteredMilestones.find((m) => !completedTaskIds.includes(m.id));
  // The progress bar describes the selected route, so count only its visible tasks.
  const completedCount = filteredMilestones.filter((m) => completedTaskIds.includes(m.id)).length;
  const completion = filteredMilestones.length
    ? Math.round(completedCount / filteredMilestones.length * 100) : 0;

  // Scroll to the workspace area when switching views
  function navigateTo(nextView: View) {
    setView(nextView);
    requestAnimationFrame(() => {
      document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // The checklist and the "next task" button both use this toggle, keeping them in sync.
  function toggleTask(taskId: string) {
    updateProgress((current) => ({
      ...current,
      completedTaskIds: current.completedTaskIds.includes(taskId)
        ? current.completedTaskIds.filter((id) => id !== taskId)
        : [...current.completedTaskIds, taskId]
    }));
  }

  async function handleAuth(email: string, password: string, name: string, isRegister: boolean, signupInterests: Interests) {
    const result = await apiFetch<{ token: string; user: AuthUser }>(
      isRegister ? "/api/auth/register" : "/api/auth/login",
      { method: "POST", body: JSON.stringify(isRegister ? { email, password, name, interests: signupInterests } : { email, password }) }
    );
    // Hand the token to useProgress so it can load this account's saved work.
    await login(result.token);
    setShowAuth(false);
  }

  // Small clickable badge that opens the source drawer
  const SourceBadge = useCallback(function SourceBadge({ sourceId }: { sourceId: string }) {
    const source = sourceById[sourceId];
    if (!source) return null;
    return (
      <button
        className="source-badge"
        aria-label={`Xem nguồn: ${source.title}`}
        onClick={() => setSelectedSource(source)}
        type="button"
      >
        {source.shortLabel}
      </button>
    );
  }, [sourceById]);

  // ── Render ──

  if (loading) {
    return (
      <div className="app-shell">
        <p role="status" style={{ textAlign: "center", marginTop: "100px", color: "#7b8698" }}>Đang tải dữ liệu…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Header + nav */}
      <header className="site-header">
        <a className="brand" href="#top" onClick={() => setView("roadmap")}>
          <span className="brand-mark" aria-hidden="true">↗</span>
          <span>
            <strong>Lộ Trình</strong>
            <small>Đại Học</small>
          </span>
        </a>

        <nav aria-label="Điều hướng chính">
          {([
            ["roadmap", "Lộ trình"],
            ["benchmarks", "Điểm chuẩn"],
            ["sources", "Nguồn dữ liệu"]
          ] as const).map(([target, label]) => (
            <button
              className={`nav-link ${view === target ? "is-active" : ""}`}
              aria-pressed={view === target}
              key={target}
              onClick={() => navigateTo(target)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        {user ? (
          <div className="student-chip" style={{ cursor: "default" }}>
            <span className="avatar">{user.name[0]}</span>
            <span>
              <strong>{user.name}</strong>
              <small>
                <button onClick={() => void logout()} disabled={sessionLoading || saveStatus === "saving"} type="button" style={{ all: "unset", cursor: "pointer", color: "#d87653", fontSize: "10px", fontWeight: 800 }}>
                  Đăng xuất
                </button>
              </small>
            </span>
          </div>
        ) : (
          <button className="student-chip" onClick={() => setShowAuth(true)} disabled={editingDisabled} type="button">
            <span className="avatar">?</span>
            <span>
              <strong>Đăng nhập</strong>
              <small>Lưu tiến độ và sở thích</small>
            </span>
          </button>
        )}
      </header>

      <main id="top">
        {/* Demo notice */}
        <section className="cycle-banner">
          <span className="banner-dot" aria-hidden="true" />
          <span>
            <strong>Demo tuyển sinh 2025.</strong> Khám phá lộ trình và điểm chuẩn của kỳ trước.
          </span>
          <button onClick={() => navigateTo("sources")} type="button">Xem nguồn →</button>
        </section>

        {/* Student profile strip with route filter pills */}
        <section className="profile-strip">
          <div className="profile-intro">
            <span className="profile-kicker">{user ? "Hồ sơ" : "Dùng thử"}</span>
            <strong>{user ? user.name : "Khách"}</strong>
            <span>{user ? (user.grade || "Đã đăng nhập") : "Không cần tài khoản"}</span>
          </div>
          {view === "roadmap" && <div className="profile-routes">
            {routeOrder.map((route) => (
              <button
                className={`route-pill ${routeFilter === route ? "is-selected" : ""}`}
                aria-pressed={routeFilter === route}
                key={route}
                onClick={() => {
                  setRouteFilter(routeFilter === route ? "all" : route);
                }}
                type="button"
              >
                {routes[route].label}
              </button>
            ))}
          </div>}
        </section>

        {/* Filter toolbar */}
        <div id="workspace">
          {view === "roadmap" && <RouteControls routeFilter={routeFilter} onChange={setRouteFilter} />}
          {dataErrors.length > 0 && (
            <div className="feedback-banner is-error" role="alert">
              <span>Chưa tải được {dataErrors.join(", ")}. Bạn thử lại nhé.</span>
              <button className="text-button" onClick={() => setReload((n) => n + 1)}>Thử lại</button>
            </div>
          )}
          {sessionLoading && <p className="feedback-banner" role="status">Đang tải tiến độ của bạn…</p>}
          {sessionError && (
            <div className="feedback-banner is-error" role="alert">
              <span>{sessionError}</span>
              <div className="feedback-actions">
                <button className="text-button" onClick={() => void retrySession()}>Thử lại</button>
                <button className="text-button" onClick={() => void logout()}>Dùng thử không đăng nhập</button>
              </div>
            </div>
          )}
          {sessionNotice && <p className="feedback-banner" role="status">{sessionNotice}</p>}
          {saveStatus === "error" && (
            <div className="feedback-banner is-error" role="alert">
              <span>Chưa lưu được thay đổi. Hãy thử lại trước khi rời trang.</span>
              <div className="feedback-actions">
                <button className="text-button" onClick={() => void retrySave()}>Lưu lại</button>
                <button className="text-button" onClick={() => void logout(true)}>Đăng xuất, bỏ thay đổi</button>
              </div>
            </div>
          )}
          <p className="save-caption" role="status">
            {sessionLoading || sessionError ? "" : !user
              ? "Bạn đang dùng thử. Đăng nhập để lưu tiến độ và sở thích."
              : saveStatus === "saving" ? "Đang lưu…"
              : saveStatus === "error" ? "Có thay đổi chưa lưu."
              : "Đã lưu thay đổi."}
          </p>

          {/* Conditionally render the active view */}
          {view === "roadmap" && !dataErrors.includes("lộ trình") && (
            <RoadmapView
              completion={completion}
              completedCount={completedCount}
              disabled={editingDisabled}
              completedTaskIds={completedTaskIds}
              milestones={filteredMilestones}
              nextTask={nextTask}
              onToggle={toggleTask}
              SourceBadge={SourceBadge}
            />
          )}

          {/* A different account gets a fresh search view, including fresh filters. */}
          {view === "benchmarks" && !dataErrors.includes("điểm chuẩn") && (
            <BenchmarksView
              key={user?.id ?? "guest"}
              benchmarks={benchmarks}
              catalog={catalog}
              interests={interests}
              disabled={editingDisabled}
              onEditInterests={() => setShowInterests(true)}
              SourceBadge={SourceBadge}
            />
          )}

          {view === "sources" && !dataErrors.includes("nguồn dữ liệu") && (
            <SourcesView sources={sources} onOpenSource={setSelectedSource} />
          )}
        </div>
      </main>

      {/* Source detail drawer */}
      {selectedSource && (
        <SourceDrawer source={selectedSource} onClose={() => setSelectedSource(null)} />
      )}

      {showInterests && <InterestsModal catalog={catalog} interests={interests} disabled={editingDisabled}
        onClose={() => setShowInterests(false)} onSave={(next) => {
          updateProgress((current) => ({ ...current, interests: next }));
          setShowInterests(false);
        }} />}

      {/* Auth modal */}
      {showAuth && (
        <AuthModal catalog={catalog} initialInterests={interests} onAuth={handleAuth} onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
}

function InterestsModal({ catalog, interests, disabled, onSave, onClose }: {
  catalog: Catalog; interests: Interests; disabled: boolean;
  onSave: (next: Interests) => void; onClose: () => void;
}) {
  // Keep choices local until Save is clicked. Closing or cancelling discards this draft.
  const [draft, setDraft] = useState(interests);
  return (
    <Dialog titleId="interests-title" onClose={onClose} maxWidth={640}>
      <div className="drawer-header"><h2 id="interests-title">Sở thích của bạn</h2>
        <button className="close-button" aria-label="Đóng" type="button" onClick={onClose}>×</button>
      </div>
      <InterestsPicker catalog={catalog} value={draft} onChange={setDraft} disabled={disabled} />
      <div className="interests-actions">
        <button className="button button-secondary" type="button" onClick={onClose}>Hủy</button>
        <button className="button button-primary" type="button" disabled={disabled} onClick={() => onSave(draft)}>Lưu sở thích</button>
      </div>
    </Dialog>
  );
}

// ── Auth modal ───────────────────────────

// Password rules (must match the server-side validation)
const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: "Ít nhất 8 ký tự" },
  { test: (p: string) => /[A-Z]/.test(p), label: "Có chữ hoa (A–Z)" },
  { test: (p: string) => /[0-9]/.test(p), label: "Có chữ số (0–9)" }
];

function AuthModal({
  catalog,
  initialInterests,
  onAuth,
  onClose
}: {
  catalog: Catalog;
  initialInterests: Interests;
  onAuth: (email: string, password: string, name: string, isRegister: boolean, interests: Interests) => Promise<void>;
  onClose: () => void;
}) {
  const [isRegister, setIsRegister] = useState(false);
  const [signupInterests, setSignupInterests] = useState<Interests>(initialInterests);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Keep one sign-in attempt active; a late response must not replace a newer account.
  const closeWhenReady = () => { if (!submitting) onClose(); };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Show password mistakes before sending a signup request. The server checks them too.
    if (isRegister) {
      const failedRule = PASSWORD_RULES.find((r) => !r.test(password));
      if (failedRule) {
        setError(failedRule.label);
        return;
      }
      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp");
        return;
      }
    }

    // Disable the form while the request runs, then show any error beside the inputs.
    setSubmitting(true);
    try {
      await onAuth(email, password, name, isRegister, signupInterests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa đăng nhập được. Bạn thử lại nhé.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog titleId="auth-title" onClose={closeWhenReady} maxWidth={isRegister ? 640 : 400}>
        <div className="drawer-header">
          <h2 id="auth-title" style={{ margin: 0, fontSize: 24 }}>{isRegister ? "Tạo tài khoản" : "Đăng nhập"}</h2>
          <button className="close-button" aria-label="Đóng" disabled={submitting} onClick={closeWhenReady} type="button">×</button>
        </div>
        <p style={{ margin: "12px 0 20px", color: "#6b778b", fontSize: 13 }}>
          {isRegister ? "Lưu tiến độ và xem điểm chuẩn theo sở thích." : "Đăng nhập để xem tiến độ đã lưu."}
        </p>
        <form onSubmit={handleSubmit} aria-busy={submitting}>
          <fieldset disabled={submitting} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: "grid", gap: 14 }}>
          {isRegister && (
            <label className="auth-field">
              <span>Tên</span>
              <input
                type="text"
                autoComplete="name"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên của bạn"
                required={isRegister}
              />
            </label>
          )}
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </label>
          <label className="auth-field">
            <span>Mật khẩu</span>
            <input
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={isRegister ? 8 : undefined}
            />
          </label>
          {/* Password strength hints (only during registration) */}
          {isRegister && password.length > 0 && (
            <ul className="password-rules">
              {PASSWORD_RULES.map((rule) => (
                <li key={rule.label} className={rule.test(password) ? "rule-pass" : "rule-fail"}>
                  {rule.test(password) ? "✓" : "✗"} {rule.label}
                </li>
              ))}
            </ul>
          )}
          {isRegister && (
            <label className="auth-field">
              <span>Xác nhận mật khẩu</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                required
              />
            </label>
          )}
          {isRegister && (catalog.universities.length > 0
            ? <InterestsPicker catalog={catalog} value={signupInterests} onChange={setSignupInterests} disabled={submitting} />
            : <p className="muted-copy">Chưa tải được danh sách trường, ngành. Bạn có thể chọn sở thích sau khi đăng ký.</p>)}
          {error && <p role="alert" style={{ margin: 0, color: "#b45c48", fontSize: 12 }}>{error}</p>}
          <button className="button button-primary" type="submit" disabled={submitting} style={{ width: "100%", marginTop: 4 }}>
            {submitting ? "Đang xử lý..." : isRegister ? "Đăng ký" : "Đăng nhập"}
          </button>
          </fieldset>
        </form>
        <p style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "#7b8698" }}>
          {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
          <button
            type="button"
            disabled={submitting}
            onClick={() => { setIsRegister(!isRegister); setError(""); setConfirmPassword(""); }}
            style={{ all: "unset", cursor: "pointer", color: "#1b8584", fontWeight: 800 }}
          >
            {isRegister ? "Đăng nhập" : "Đăng ký"}
          </button>
        </p>
    </Dialog>
  );
}

// ── Route filter buttons ────────────────────────────────────────

function RouteControls({
  routeFilter,
  onChange
}: {
  routeFilter: RouteFilter;
  onChange: (route: RouteFilter) => void;
}) {
  const filters: { id: RouteFilter; label: string }[] = [
    { id: "all", label: "Tất cả phương thức" },
    { id: "thpt", label: "THPT" },
    { id: "hsa", label: "HSA" },
    { id: "sat", label: "SAT" }
  ];

  return (
    <section className="section-toolbar">
      <div>
        <p className="section-kicker">Bộ lọc</p>
        <h2>Phương thức xét tuyển</h2>
      </div>
      <div className="filter-set" role="group" aria-label="Phương thức xét tuyển">
        {filters.map((f) => (
          <button
            className={`filter-button ${routeFilter === f.id ? "is-active" : ""}`}
            aria-pressed={routeFilter === f.id}
            key={f.id}
            onClick={() => onChange(f.id)}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>
    </section>
  );
}

// This view receives tasks already filtered by route. It reports clicks back to App,
// which updates progress, so the summary and the checklist always share the same state.

function RoadmapView({
  completion,
  completedCount,
  disabled,
  completedTaskIds,
  milestones: items,
  nextTask,
  onToggle,
  SourceBadge
}: {
  completion: number;
  completedCount: number;
  disabled: boolean;
  completedTaskIds: string[];
  milestones: Milestone[];
  nextTask: Milestone | undefined;
  onToggle: (taskId: string) => void;
  SourceBadge: ({ sourceId }: { sourceId: string }) => React.ReactNode;
}) {
  return (
    <section className="view-section">
      {/* Dashboard cards: next action + progress */}
      <div className="dashboard-grid">
        <article className="next-action-card">
          <div className="card-topline">
            <span className="next-label">Việc tiếp theo</span>
            <span className="time-badge">Dữ liệu 2025</span>
          </div>
          {nextTask ? (
            <>
              <p className="phase-line">{nextTask.phase}</p>
              <h2>{nextTask.title}</h2>
              <p>{nextTask.plainLanguage}</p>
              <div className="date-row">
                <span className="calendar-glyph" aria-hidden="true">▣</span>
                <strong>{nextTask.displayDate}</strong>
              </div>
              <div className="card-actions">
                <button className="button button-primary small" onClick={() => onToggle(nextTask.id)} disabled={disabled} type="button">
                  Đánh dấu hoàn tất
                </button>
                <SourceBadge sourceId={nextTask.sourceIds[0]} />
              </div>
            </>
          ) : (
            <h2>{items.length ? "Bạn đã hoàn tất lộ trình!" : "Chưa có mốc cho phương thức này."}</h2>
          )}
        </article>

        <article className="progress-card">
          <p className="section-kicker">Tiến độ</p>
          <div className="progress-number">{completion}<span>%</span></div>
          <div className="progress-track" role="progressbar" aria-label="Tiến độ" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion}>
            <span style={{ width: `${completion}%` }} />
          </div>
          <p>Đã xong <strong>{completedCount}</strong> / {items.length} bước.</p>
        </article>
      </div>

      {/* Timeline */}
      <div className="timeline-heading">
        <div>
          <p className="section-kicker">Tuyển sinh 2025</p>
          <h2>Các mốc quan trọng</h2>
        </div>
        <span className="caption">Đánh dấu từng bước bạn đã làm</span>
      </div>

      <div className="timeline">
        {items.map((milestone, index) => {
          // Completion comes from the student's saved IDs, not the demo status on the task.
          const complete = completedTaskIds.includes(milestone.id);
          return (
            <article className={`timeline-item ${complete ? "is-complete" : ""}`} key={milestone.id}>
              <div className="timeline-rail" aria-hidden="true">
                <span>{complete ? "✓" : index + 1}</span>
              </div>
              <div className="timeline-content">
                <div className="timeline-meta">
                  <span className={`status-tag status-${complete ? "complete" : nextTask?.id === milestone.id ? "next" : "later"}`}>
                    {complete ? "Đã hoàn tất" : nextTask?.id === milestone.id ? "Tiếp theo" : "Chưa làm"}
                  </span>
                  <span>{milestone.phase}</span>
                </div>
                <div className="timeline-title-row">
                  <div>
                    <h3>{milestone.title}</h3>
                    <p>{milestone.plainLanguage}</p>
                  </div>
                  <strong className="timeline-date">{milestone.displayDate}</strong>
                </div>
                <div className="checklist">
                  {milestone.checklist.map((item) => <span key={item}>• {item}</span>)}
                </div>
                <div className="timeline-footer">
                  <label className="task-check">
                    <input checked={complete} disabled={disabled} aria-label={`Hoàn tất: ${milestone.title}`} onChange={() => onToggle(milestone.id)} type="checkbox" />
                    <span>{complete ? "Đã hoàn tất" : "Đánh dấu hoàn tất"}</span>
                  </label>
                  <div className="source-row">
                    {milestone.sourceIds.map((sid) => <SourceBadge key={sid} sourceId={sid} />)}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function sourceStatusLabel(status: Source["status"]) {
  return { Verified: "Đã kiểm tra", Archived: "Lưu trữ", "Needs review": "Cần kiểm tra" }[status];
}

// ── Sources view ────────────────────────────────────────────────

function SourcesView({
  sources: items,
  onOpenSource
}: {
  sources: Source[];
  onOpenSource: (source: Source) => void;
}) {
  return (
    <section className="view-section">
      <div className="section-intro">
        <p className="section-kicker">Nguồn dữ liệu</p>
        <h2>Nguồn chính thức</h2>
        <p>
          Lịch tuyển sinh và điểm chuẩn từ Bộ GD&ĐT và các trường đại học.
        </p>
      </div>
      <div className="sources-grid">
        {items.map((source) => (
          <article className="source-card" key={source.id}>
            <div className="source-card-top">
              <span className="source-id">{source.shortLabel}</span>
              <span className={`source-status status-${source.status.toLowerCase().replace(" ", "-")}`}>
                {sourceStatusLabel(source.status)}
              </span>
            </div>
            <h3>{source.title}</h3>
            <p>{source.publisher}</p>
            <dl>
              <div><dt>Kỳ tuyển sinh</dt><dd>{source.cycle}</dd></div>
              <div><dt>Đã kiểm tra</dt><dd>{source.verifiedAt}</dd></div>
            </dl>
            <button className="text-button" onClick={() => onOpenSource(source)} type="button">
              Xem chi tiết →
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── Source drawer ────────────────────────────────────────────────

function SourceDrawer({ source, onClose }: { source: Source; onClose: () => void }) {
  return (
    <Dialog titleId="source-title" onClose={onClose}>
        <div className="drawer-header">
          <span className="source-id">{source.shortLabel}</span>
          <button className="close-button" aria-label="Đóng" onClick={onClose} type="button">×</button>
        </div>
        <span className={`source-status status-${source.status.toLowerCase().replace(" ", "-")}`}>
          {sourceStatusLabel(source.status)}
        </span>
        <h2 id="source-title">{source.title}</h2>
        <p className="drawer-publisher">{source.publisher}</p>
        <dl className="drawer-details">
          <div><dt>Kỳ tuyển sinh</dt><dd>{source.cycle}</dd></div>
          <div><dt>Ngày công bố</dt><dd>{source.publishedAt}</dd></div>
          <div><dt>Ngày kiểm tra</dt><dd>{source.verifiedAt}</dd></div>
        </dl>
        <div className="source-fields">
          <p className="section-kicker">Thông tin được sử dụng</p>
          <ul>{source.fields.map((field) => <li key={field}>{field}</li>)}</ul>
        </div>
        <p className="drawer-note">{source.note}</p>
        <a className="button button-primary drawer-link" href={source.url} rel="noreferrer" target="_blank">
          Mở nguồn chính thức ↗
        </a>
    </Dialog>
  );
}

export default App;
