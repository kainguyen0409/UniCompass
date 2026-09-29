# FTU 2025: provenance and scope

Verified on 27 September 2026 against the official public PDF viewers linked by FTU's Academic Affairs Office. The final-cutoff PDF owner disables downloading; the tables and column headings were read in the public viewer and visually checked. No download restriction was bypassed.

## Official sources

- [Final cutoff announcement, 22 August 2025](https://qldt.ftu.edu.vn/thong-bao-nguong-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2025/), notice **766/TB-ĐHNT**, 22 August 2025: [official attachment](https://drive.google.com/file/d/1jMsr8uV6C241AA_XLwTmdIK0LFYlokcq/view).
- [Equivalent-score conversion announcement, posted 23 July 2025](https://qldt.ftu.edu.vn/thong-bao-quy-doi-diem-tuong-duong-giua-cac-phuong-thuc-xet-tuyen-nhom-doi-tuong-xet-tuyen-dai-hoc-chinh-quy-nam-2025/), notice **638/TB-ĐHNT**, dated 22 July 2025: [official attachment](https://drive.google.com/file/d/1enk6cyRVqoRTWZhMG1Y9yvvH2TgDKQ-r/view).
- [General 2025 admissions information, 8 May 2025](https://qldt.ftu.edu.vn/thong-tin-tuyen-sinh-trinh-do-dai-hoc-hinh-thuc-dao-tao-chinh-quy-nam-2025/), decision **1646/QĐ-ĐHNT**: [official attachment](https://drive.google.com/file/d/1_rtvAM5kcvW6DNk3I87fHX26BRntOmkJ/view). Appendix 2 confirms campus and combinations; sections 6.2.1.5 and 6.2.2.5 confirm weighting.

## Imported coverage

`server/src/data/ftu2025.ts` contains **77 published score records for 43 programs** across Hà Nội, Cơ sở II–TP. Hồ Chí Minh, and Quảng Ninh:

| Final PDF table (page) | Programs | Imported columns |
| --- | ---: | --- |
| Table 1 (4): advanced and high-quality programs | 12 | PT2 group 2.2, THPT + international foreign-language certificate |
| Table 2 (5): standard programs | 13 | PT2 group 2.1, THPT A00; PT3 converted HSA; PT3 converted V-ACT |
| Table 3 (6): computer science and data in economics/business | 1 | PT2 groups 2.1 and 2.2; PT3 converted HSA and V-ACT |
| Table 4 (7): international career/development-oriented programs | 10 | PT2 group 2.2, THPT + international foreign-language certificate |
| Table 5 (8): commercial languages | 7 | Published nonblank PT2 columns and converted HSA column (12 records total) |

These are final admission cutoffs, not minimum application-eligibility scores. Program names are expanded for readability, while distinctions between standard, high-quality, advanced and specialized programs remain. Campus and program code are separate data fields. The unusual code `TCHS2.1` is printed with a dot in final table 1 and is preserved exactly; the earlier general-admissions appendix prints `TCHS2_1`. Category IDs are application navigation labels, not an official FTU classification.

The general-admissions PDF's Hà Nội section starts on PDF page 52. Language rows are on pages 65–69 and the computer science row on page 70, before the TP. Hồ Chí Minh section begins on page 71. These establish Hà Nội for tables 3 and 5, whose final-cutoff tables do not repeat the campus heading.

## Score interpretation

- **Table 2 THPT:** the published figures use base combination **A00**, scale **30**. Conversion notice section 2.1 (page 2) lists a separate adjustment for A01/D01/D02/D03/D04/D06/D07. Only the published A00 value is imported; adjusted scores are not calculated or presented as additional records.
- **Table 2 HSA/V-ACT:** these columns are already converted to scale **30** by FTU. They must not be compared directly with raw HSA/150 or V-ACT/1,200 exam totals. No conversion is performed by the application.
- **Tables 1 and 4:** the first numerical column is PT2 group 2.2, **two THPT subjects plus an international foreign-language certificate**, not ordinary three-subject THPT admission. Conversion notice sections 2.2 and 2.3 (page 3) confirm scale **30** and base combination **D01**. The `D01` tag records the base combination, not a claim that all accepted combinations share an unadjusted cutoff.
- **Table 3:** all imported scores are **40-point** totals. THPT mathematics carries coefficient 2, including the THPT-plus-certificate method (general-admissions PDF pages 18 and 21). Conversion notice section 2.4 (pages 4–5) confirms the /40 scale and says there is no cutoff difference between accepted THPT combinations; A00/A01/D01/D07 are listed in the program appendix. HSA and V-ACT figures remain the published converted /40 scores.
- **Table 5:** all imported scores are **40-point** totals. Ordinary THPT rows use base D01 from conversion sections 2.5 and 2.7; the foreign-language exam component is doubled. The combined method uses Toán + Ngữ văn and a converted foreign-language component with coefficient 2 (general-admissions PDF page 21). Its program-specific subject tags come from appendix 2: D01 for English/integrated French, D06 for high-quality Japanese, D04 for high-quality Chinese. The generic conversion table's D01 reference is not used to imply Japanese/Chinese high-quality programs accept English certificates. Standard/integrated language HSA rows are converted /40 scores; the general-admissions rules require HSA part 3 in English for languages.
- Published admission totals include applicable priority components under FTU's rules. A total alone does not establish that an applicant meets every eligibility condition.

## Deliberate exclusions

- School-record and award-based applicant groups, and international-test-plus-certificate columns, remain separate in the source and are not merged into the imported methods.
- Table 4 HSA/V-ACT columns are also omitted from this subset. All 43 published program rows have at least one imported method, but not every method is represented.
- No missing cells, program scores, SAT cutoffs, or score conversions are inferred.
- The July eligibility-floor announcement and the late-August program-transfer intake for admitted students are not used as final cutoff data.
- This is a sourced subset, not FTU's complete 2025 admissions dataset.
