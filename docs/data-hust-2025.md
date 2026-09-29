# HUST 2025 data provenance

The demo contains a curated set of final **2025** admission cutoffs. It does not claim to reproduce all 65 programs or every admission method. Every number is a published value; no interpolation, conversion formula, prediction, or 2026 cutoff is used.

## Official sources checked on 27 September 2026

- [22 August 2025 announcement](https://hust.edu.vn/vi/news/savefile/hoat-dong-chung/dai-hoc-bach-khoa-ha-noi-cong-bo-diem-chuan-xet-tuyen-dai-hoc-nam-2025-655575.html): final cutoffs, scales, priority/bonus rules, and subject-group differences. Its text explicitly gives ET1 28.07, TROY-BA 19.00, EM3 D01 24.30 and FL3 D01/D04 24.86. The original full-table images could not be retrieved; their unread values were not transcribed.
- [SoICT historical cutoffs](https://soict.hust.edu.vn/diem-chuan-tham-khao.html), updated 9 March 2026: the **2025 column** of each of three separately titled THPT, TSA and XTTN **1.3** tables. Seven programs have 21 verified records. The THPT table also gives their subject groups. Its IT-1/IT-2 typography is normalized to the admission codes IT1/IT2 used in the main announcement.
- [School of Materials historical table](https://smse.hust.edu.vn/vi/tuyen-sinh/savefile/tuyen-sinh-truong-vat-lieu/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-2026-12.html): the **2025 column** in the three-year historical table gives six programs and two methods. The column headed “Chỉ tiêu/Tổ hợp xét (2025)” supplies subject groups. K00 is separated as TSA. The page was updated for 2026 while retaining an older creation date, so the source record does not misstate that creation date as the cutoff publication date.
- [HUST admissions document, 2026 edition](https://hust.edu.vn/uploads/sys/tuyen-sinh/2023_06/thong-tin-tuyen-sinh-dai-hoc-2026.pdf): historical **2025** columns on printed pages 28–34. The indexed extracts expose complete 2025/2024 column headers and /30 or /100 scale labels. Page 28 covers EE1, EE2, EE-E18 and EE-E8; page 29 continues EE-E8 then EE-EP, EM1, EM2, EM3 and EM5; page 33 covers ME1/ME2; page 34 covers ME-E1, ME-GU, ME-LUH, ME-NUT and MI1. The visible EM5 excerpt ends before its THPT value, so only its fully visible TSA value is included.
- [Signed HUST admissions document, 2026 edition](https://hust.edu.vn/uploads/sys/tuyen-sinh/2023_06/thong-tin-tuyen-sinh-dai-hoc-2026f.pdf), Decision 5788 of 3 June 2026: historical **2025** columns on page 32 (FL1, FL2, HE1), page 35 (MI2) and page 37 (FL3 TSA). FL3 THPT and its D01/D04 basis are explicitly corroborated in the 22 August 2025 announcement.

## Meaning of each record

- THPT uses a 30-point **admission score**, including the school's weighting and applicable priority rules. It is not always the plain sum of three exam subjects.
- TSA uses the published 100-point **admission score**, including applicable priority and bonus points.
- XTTN 1.2 and 1.3 are separate methods on a 100-point scale in 2025. Generic “XTTN” rows in the 2026 historical documents are deliberately omitted because those extracts do not distinguish the two subtypes. No XTTN 1.2 record is imported: the accessible announcement gives an overall maximum, but a named-program 1.2 table row could not be inspected.
- No extra score rows are created by adding the published subject-group difference. EM3 and FL3 retain their explicitly verified D01/D04 bases, with the official +0.50 rule described in notes.
- When a historical extract does not state the subject groups, `subjectGroups` is empty and the record says to check the original announcement. Groups from a 2026 admissions plan are not assigned to 2025 records.
- Hyphens removed by PDF extraction in program codes (for example EEE18) are restored using the 2025 program names/codes in HUST's announcements. Category labels are only navigation aids chosen for this demo.

## Deliberate coverage limits

The verified set covers computing, engineering, science, business, economics, finance, and languages. It is a curated subset, not the complete HUST 2025 table. Omitted methods or programs indicate missing verification in this dataset, not that HUST did not admit students through them. Expanding coverage requires another readable official table, not inferred cutoffs.

EM5 specifically retains its verified TSA record only. A focused follow-up search of official HUST sources still returned the page-29 excerpt ending before its THPT row, so no THPT value was guessed from EM3, the matching TSA score, or the neighboring language-program rows. The visible record tells users that the demo lacks this verified THPT cutoff; HUST's [2025 admissions plan](https://hust.edu.vn/vi/tuyen-sinh/dai-hoc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2025-651872.html) separately confirms EM5 offered THPT admission.
