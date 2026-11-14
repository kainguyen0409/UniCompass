import { useEffect, useRef, useState } from "react";
import { Dialog } from "./Dialog";
import { useAssistant } from "../lib/useAssistant";
import type { AssistantAction, RouteFilter } from "../types";

const suggestions = ["Tìm các chương trình CNTT ở UET và HUST.", "Tôi còn bước nào chưa hoàn thành trong lộ trình demo?", "Điểm chuẩn 2025 có đảm bảo trúng tuyển kỳ sau không?"];
export function AssistantPanel({ token, disabled, context, onSignIn, onNavigate }: {
  token?: string; disabled: boolean;
  context: { view: "roadmap" | "benchmarks" | "sources"; route: RouteFilter };
  onSignIn: () => void; onNavigate: (action: AssistantAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const chat = useAssistant(token, context);
  const conversation = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = conversation.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [open, chat.turns, chat.pending, chat.error]);
  function close() { chat.cancel(); setOpen(false); }
  function navigate(action: AssistantAction) { close(); onNavigate(action); }
  const blocked = disabled || !token || !chat.enabled || !!chat.pending;
  return <>
    <button className="assistant-launcher" type="button" onClick={() => setOpen(true)}>✦ Hỏi UniCompass</button>
    {open && <Dialog titleId="assistant-title" className="assistant-panel" onClose={close} maxWidth={560}>
      <div className="drawer-header"><div><p className="section-kicker">Trợ lý tuyển sinh</p><h2 id="assistant-title">Hỏi UniCompass</h2></div>
        <button className="close-button" type="button" aria-label="Đóng trợ lý" onClick={close}>×</button></div>
      <p className="assistant-notice"><strong>Dữ liệu tuyển sinh 2025.</strong> Tham khảo kỳ trước. Câu hỏi, sở thích và tiến độ liên quan được gửi tới Groq để tạo câu trả lời. Hội thoại chỉ giữ trong phiên mở trang này.</p>
      {!token ? <div className="empty-state"><p>Đăng nhập để hỏi về chương trình và lộ trình của bạn.</p><button className="button button-primary" onClick={() => { close(); onSignIn(); }}>Đăng nhập</button></div>
        : <>
          {chat.enabled === null && <p role="status">Đang kiểm tra trợ lý…</p>}
          {chat.enabled === false && <div className="feedback-banner" role="status"><span>{chat.availabilityError ? "Chưa kết nối được trợ lý." : "Trợ lý chưa được bật. Bạn vẫn có thể xem điểm chuẩn và lộ trình."}</span><button type="button" onClick={chat.retryAvailability}>Kiểm tra lại</button></div>}
          {disabled && <p role="status">Vui lòng đợi tiến độ được tải và lưu trước khi gửi câu hỏi.</p>}
          <div ref={conversation} className="assistant-conversation" aria-label="Hội thoại">
            {!chat.turns.length && !chat.pending && <div className="assistant-suggestions"><p>Bạn muốn tìm hiểu điều gì?</p>{suggestions.map(s => <button type="button" disabled={blocked} key={s} onClick={() => void chat.send(s)}>{s}</button>)}</div>}
            {chat.turns.map((turn, index) => <div className="assistant-turn" key={index}>
              <p className="assistant-question">{turn.question}</p>
              <div className="assistant-answer">
                {turn.answer.sections.map((section, i) => <div key={i}><p>{section.text}</p><div className="source-row">{[...new Set(section.sourceIds)].map(id => {
                  const source = turn.answer.sources.find(s => s.id === id);
                  return source ? <button className="source-badge" type="button" key={id} onClick={() => navigate({ kind: "source", source })} aria-label={`Xem nguồn: ${source.title}`}>{source.shortLabel}</button> : null;
                })}</div></div>)}
                {turn.answer.programs.map(p => <article className="assistant-card" key={p.programRef}>
                  <strong>{p.records[0].university} · {p.records[0].program}</strong>
                  <p>{p.records[0].code} · {p.records[0].campus || ""} · {p.records[0].admissionRound} · {p.records[0].cycle}</p>
                  <ul>{p.records.map(r => <li key={r.id}>{r.methodLabel}: <strong>{r.score.toLocaleString("vi-VN")} / {r.scale}</strong></li>)}</ul>
                  <button type="button" className="text-button" onClick={() => navigate({ kind: "program", programRef: p.programRef })}>Xem chương trình →</button>
                </article>)}
                {turn.answer.milestones.map(m => <article className="assistant-card" key={m.id}><strong>{m.title}</strong><p>{m.displayDate} · Dữ liệu 2025</p><p>{m.status === "complete" ? "Đã hoàn tất" : m.status === "next" ? "Bước chưa hoàn tất tiếp theo" : "Chưa hoàn tất"}</p><button type="button" className="text-button" onClick={() => navigate({ kind: "milestone", milestone: m })}>Xem trong lộ trình →</button></article>)}
              </div>
            </div>)}
            {chat.pending && <><p className="assistant-question">{chat.pending}</p><p role="status">Đang tra cứu nguồn và chuẩn bị câu trả lời…</p><button type="button" onClick={chat.cancel}>Dừng</button></>}
            {chat.error && <div className="feedback-banner is-error" role="alert"><span>{chat.error}</span><button type="button" disabled={blocked} onClick={() => void chat.send(chat.retryQuestion)}>Thử lại</button></div>}
          </div>
          <form className="assistant-composer" onSubmit={event => { event.preventDefault(); if (!blocked) void chat.send(); }}>
            <label htmlFor="assistant-message">Câu hỏi của bạn</label>
            <textarea id="assistant-message" maxLength={2000} rows={3} value={chat.draft} onChange={e => chat.setDraft(e.target.value)} placeholder="Hỏi về ngành, điểm chuẩn hoặc bước tiếp theo…" disabled={!!chat.pending} />
            <div className="assistant-controls"><button type="button" className="text-button" onClick={chat.reset}>Cuộc trò chuyện mới</button><button className="button button-primary small" type="submit" disabled={blocked || !chat.draft.trim()}>Gửi câu hỏi</button></div>
          </form>
        </>}
    </Dialog>}
  </>;
}
