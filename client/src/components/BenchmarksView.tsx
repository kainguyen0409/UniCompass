import { useEffect, useMemo, useState } from "react";
import { groupBenchmarks, matchesInterests, searchText } from "../lib/benchmarks";
import type { Benchmark, Catalog, Interests } from "../types";

// Turn the cutoff records into searchable program cards. A card can contain several
// admission methods, each shown with the score scale published by its university.
export function BenchmarksView({ benchmarks, catalog, interests, disabled, onEditInterests, SourceBadge }: {
  benchmarks: Benchmark[]; catalog: Catalog; interests: Interests; disabled: boolean;
  onEditInterests: () => void;
  SourceBadge: ({ sourceId }: { sourceId: string }) => React.ReactNode;
}) {
  const [scope, setScope] = useState<"interests" | "all">("interests");
  const [query, setQuery] = useState("");
  const [university, setUniversity] = useState("");
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState(12);
  const hasInterests = interests.universityIds.length + interests.categoryIds.length > 0;
  // Saved interests contain IDs; look up their names for the summary above the filters.
  const interestLabels = [
    ...catalog.universities.filter((item) => interests.universityIds.includes(item.id)).map((item) => item.shortName),
    ...catalog.categories.filter((item) => interests.categoryIds.includes(item.id)).map((item) => item.label)
  ];
  // Apply all filters first, then collect matching methods under their program card.
  // Every search word must appear somewhere in the school, program, code, or campus text.
  const groups = useMemo(() => {
    const words = searchText(query).split(/\s+/).filter(Boolean);
    return groupBenchmarks(benchmarks.filter((item) => {
      const school = catalog.universities.find((entry) => entry.id === item.universityId);
      const searchable = searchText([item.university, school?.shortName, item.program, item.code, item.campus].join(" "));
      return (scope === "all" || matchesInterests(item, interests))
        && (!university || item.universityId === university)
        && (!category || item.categoryIds.includes(category))
        && words.every((word) => searchable.includes(word));
    }));
  }, [benchmarks, catalog, interests, scope, query, university, category]);

  // Start each new search with 12 cards; "show more" only expands the current results.
  useEffect(() => setLimit(12), [query, university, category, scope, interests]);
  // After interests change, remove old search filters so the new choices are visible.
  useEffect(() => {
    setScope("interests"); setQuery(""); setUniversity(""); setCategory("");
  }, [interests]);

  // The empty-state button clears every filter, including the saved-interest restriction.
  function showAll() {
    setScope("all"); setQuery(""); setUniversity(""); setCategory("");
  }

  return (
    <section className="view-section">
      <div className="cutoff-intro">
        <div className="section-intro">
          <p className="section-kicker">Tuyển sinh 2025</p>
          <h1>Tìm ngành bạn muốn học</h1>
          <p>Tra điểm chuẩn đã công bố. Mỗi phương thức giữ đúng thang điểm của trường.</p>
        </div>
        <span className="archive-chip">Dữ liệu kỳ trước</span>
      </div>

      <div className="interest-summary">
        <div><strong>Sở thích của bạn</strong>
          <p>{hasInterests ? interestLabels.join(" · ") : "Chưa chọn trường, ngành. Bạn đang xem tất cả."}</p>
        </div>
        <button className="button button-secondary small" type="button" disabled={disabled || !catalog.universities.length}
          onClick={onEditInterests}>{hasInterests ? "Đổi sở thích" : "Chọn sở thích"}</button>
      </div>

      <div className="cutoff-controls">
        <div className="filter-set" role="group" aria-label="Phạm vi điểm chuẩn">
          <button type="button" className={`filter-button ${scope === "interests" ? "is-active" : ""}`}
            aria-pressed={scope === "interests"} onClick={() => setScope("interests")}>Theo sở thích</button>
          <button type="button" className={`filter-button ${scope === "all" ? "is-active" : ""}`}
            aria-pressed={scope === "all"} onClick={() => setScope("all")}>Tất cả</button>
        </div>
        <div className="cutoff-search-row">
          <label className="cutoff-search"><span>Tìm ngành hoặc trường</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên ngành, mã ngành, trường…" />
          </label>
          <label><span>Trường</span><select value={university} onChange={(event) => setUniversity(event.target.value)}>
            <option value="">Tất cả trường</option>
            {catalog.universities.map((item) => <option value={item.id} key={item.id}>{item.shortName} · {item.name}</option>)}
          </select></label>
          <label><span>Nhóm ngành</span><select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Tất cả nhóm ngành</option>
            {catalog.categories.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select></label>
        </div>
      </div>

      <div className="cutoff-results-heading">
        <p role="status"><strong>{groups.length}</strong> ngành / chương trình{scope === "interests" && hasInterests ? " phù hợp" : ""}</p>
        <span>Một số ngành tại 4 trường · đang bổ sung</span>
      </div>
      <div className="benchmark-grid cutoff-grid">
        {groups.slice(0, limit).map(({ id, records }) => {
          // All records in this group share the heading; only their admission details differ.
          const program = records[0];
          return (
            <article className="benchmark-card cutoff-card" key={id}>
              <div className="benchmark-heading">
                <span>{program.university}</span>
                <h3>{program.program}</h3>
                <small>{program.code}{program.campus ? ` · ${program.campus}` : ""} · {program.admissionRound}</small>
              </div>
              <dl className="cutoff-scores">
                {records.map((item) => (
                  <div className="cutoff-score-row" key={item.id}>
                    <dt>{item.methodLabel}{item.subjectGroups.length > 0 && <small>{item.subjectGroups.join(", ")}</small>}</dt>
                    <dd><strong>{item.score.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><span> / {item.scale}</span></dd>
                  </div>
                ))}
              </dl>
              {/* Several methods can cite the same source, so show each source badge once. */}
              <div className="cutoff-card-footer">
                <span>Điểm chuẩn {program.cycle}</span>
                <div className="source-row">{[...new Set(records.map((item) => item.sourceId))].map((sourceId) => <SourceBadge key={sourceId} sourceId={sourceId} />)}</div>
              </div>
              {records.some((item) => item.note) && <details className="cutoff-details"><summary>Ghi chú xét tuyển</summary>
                {[...new Set(records.map((item) => item.note).filter(Boolean))].map((note) => <p key={note}>{note}</p>)}
              </details>}
            </article>
          );
        })}
      </div>
      {groups.length === 0 && <div className="empty-state">
        <h3>Chưa tìm thấy ngành phù hợp</h3>
        <p>Thử tên khác hoặc mở rộng bộ lọc. Một số ngành chưa có trong bản demo.</p>
        <button className="button button-secondary" type="button" onClick={showAll}>Xem tất cả ngành</button>
      </div>}
      {groups.length > limit && <div className="load-more">
        <button className="button button-secondary" type="button" onClick={() => setLimit((value) => value + 12)}>Xem thêm 12 ngành</button>
        <span>Đang xem {Math.min(limit, groups.length)} / {groups.length}</span>
      </div>}
      <aside className="disclaimer-panel"><strong>Tham khảo kỳ trước.</strong><span>Điểm chuẩn 2025 không đảm bảo trúng tuyển kỳ sau. Xem nguồn để biết điều kiện và tiêu chí phụ.</span></aside>
    </section>
  );
}
