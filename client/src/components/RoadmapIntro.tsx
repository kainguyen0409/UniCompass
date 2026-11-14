export function RoadmapIntro() {
  return <section className="editorial-intro" aria-labelledby="intro-title">
    <div><p className="section-kicker">Hành trình của bạn / 01</p>
      <h1 id="intro-title">Từng bước<br />đến <em>đại học.</em></h1>
      <p className="intro-copy">Hiểu các mốc quan trọng, khám phá ngành học và tự tin chọn hướng đi của riêng bạn.</p>
      <a className="intro-link" href="#workspace">Khám phá lộ trình <span aria-hidden="true">↘</span></a>
    </div>
    <div className="compass-panel" aria-hidden="true">
      <span className="illustration-label">MỖI HÀNH TRÌNH / MỘT HƯỚNG ĐI</span>
      <svg viewBox="0 0 440 360" fill="none">
        <path d="M-20 290C100 390 90 85 210 180S350 380 470 170" stroke="currentColor" strokeWidth="2" strokeDasharray="5 8" />
        <circle cx="230" cy="165" r="112" stroke="currentColor" />
        <circle cx="230" cy="165" r="94" stroke="currentColor" opacity=".25" />
        <path d="M230 36V62M230 268V294M101 165H127M333 165H359" stroke="currentColor" />
        <path d="M292 70L249 181L168 260L211 149Z" fill="#fac43a" stroke="currentColor" strokeWidth="2" />
        <path d="M292 70L230 165L168 260L211 149Z" fill="currentColor" />
        <circle cx="230" cy="165" r="9" fill="#fffdf7" stroke="currentColor" strokeWidth="2" />
        <circle cx="68" cy="271" r="7" fill="#fac43a" stroke="currentColor" />
        <path d="M361 65V89M349 77H373" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="illustration-caption">Bắt đầu từ chính bạn. ↗</span>
    </div>
  </section>;
}
