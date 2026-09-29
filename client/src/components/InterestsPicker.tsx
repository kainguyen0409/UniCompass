import type { Catalog, Interests } from "../types";

export function InterestsPicker({ catalog, value, onChange, disabled = false }: {
  catalog: Catalog; value: Interests; onChange: (next: Interests) => void; disabled?: boolean;
}) {
  function toggle(key: keyof Interests, id: string) {
    const selected = value[key];
    onChange({ ...value, [key]: selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id] });
  }

  return (
    <div className="interests-picker">
      <p className="muted-copy">Chọn nhiều mục nếu bạn muốn. Để trống để xem tất cả; bạn có thể đổi sau.</p>
      <fieldset disabled={disabled}>
        <legend>Trường bạn quan tâm</legend>
        <div className="interest-options university-options">
          {catalog.universities.map((item) => (
            <label className={`interest-option ${value.universityIds.includes(item.id) ? "is-selected" : ""}`} key={item.id}>
              <input type="checkbox" checked={value.universityIds.includes(item.id)} onChange={() => toggle("universityIds", item.id)} />
              <span><strong>{item.shortName}</strong><small>{item.name}</small></span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset disabled={disabled}>
        <legend>Nhóm ngành bạn quan tâm</legend>
        <div className="interest-options">
          {catalog.categories.map((item) => (
            <label className={`interest-option ${value.categoryIds.includes(item.id) ? "is-selected" : ""}`} key={item.id}>
              <input type="checkbox" checked={value.categoryIds.includes(item.id)} onChange={() => toggle("categoryIds", item.id)} />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button type="button" className="text-button" disabled={disabled}
        onClick={() => onChange({ universityIds: [], categoryIds: [] })}>Chưa xác định · xem tất cả</button>
    </div>
  );
}
