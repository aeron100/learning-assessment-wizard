# Learning Assessment Wizard — private faculty studio

A static site for course outlines, AI-assisted SLO writing, practical assignments, and accessible exports. Designed for GitHub Pages. **No server, API key, account, analytics, or stored course content.**

## Publish on GitHub Pages

1. Create a GitHub repository, for example `learning-assessment-wizard`.
2. Put this folder’s **contents** in the repository root. Include `src/`, `vendor/`, and the hidden `.github/workflows/pages.yml` file. Do not upload `node_modules/`.
3. In the repository, select **Settings → Pages → Source → GitHub Actions**.
4. Push to the `main` branch, or run **Actions → Publish Learning Assessment Wizard to GitHub Pages → Run workflow**.
5. Open the URL shown by the completed deployment, normally `https://YOUR-NAME.github.io/learning-assessment-wizard/`.

The vendored browser libraries are included, so deploying does not require npm or a build. All asset paths are relative and support repository subpaths. The workflow stages only public application files. GitHub Pages availability for private repositories depends on the account plan.

Alternative: publish from the `main` branch root in Pages settings if uploading through GitHub’s web interface. The `.nojekyll` file prevents Jekyll processing. Keep the library files intact.

## Preview locally

With Node.js 22 or newer, open a terminal in this folder and run `node server.mjs`, then visit `http://127.0.0.1:4173`. Do not double-click `index.html`: browser modules and WebGPU need a web origin. The preview server binds only to the local computer.

## Free AI and WebGPU

The site runs **Qwen2.5-1.5B-Instruct-q4f16_1-MLC** locally using **WebLLM 0.2.82**. It charges no inference API fees. Initial model download is approximately 1 GB; around 2 GB of available GPU memory is a practical starting point. Memory, browser, driver, and network availability affect compatibility and speed. Download providers may change availability.

Use an updated desktop Chrome or Edge with “Use graphics acceleration when available” enabled. The site checks WebGPU and `shader-f16` before downloading. Institutional browser policies or graphics hardware can prevent support. No browser flags or weakened security settings are required. Manual SLO editing and export remain usable without the model; AI generation has no hidden template fallback.

The model downloads public artifacts from Hugging Face and the MLC repository. Those providers receive ordinary download requests and may log IP addresses. **Course text is never sent to them.** Model files can remain cached to avoid repeated downloads. “Remove cached model” deletes that model’s cache. Course content and generations live in memory only. No localStorage, sessionStorage, course IndexedDB, cookies, or service worker is used by the application. WebLLM uses browser cache for model assets only.

The local model is small and can make errors. Faculty must review disciplinary accuracy, meaningful scope, level, term attainability, criteria, source links, and assignments before use. Local generation can take minutes. Cancel terminates the worker. Generation errors preserve prior completed work. Course input is not silently truncated for a model request; oversized requests require shorter input.

WebLLM is pinned to 0.2.82 to avoid a reported GPU lifecycle regression in 0.2.83/0.2.84. Review upstream fixes and security notices before upgrading. Rebuild the vendored library with `pnpm install --frozen-lockfile` and `node build.mjs` after a deliberate version change. The app uses JSON mode, validates outputs, and retries one invalid response. See upstream: https://github.com/mlc-ai/web-llm/issues/844

## Faculty workflow

1. The app opens directly to the Assignments workflow. Type the course title, description, objectives, and SLOs on “Tell us about your course.” The optional “Use a course outline instead” section accepts pasted text or a TXT, DOCX, or text-based PDF.
2. Confirm extracted fields. Heading extraction is conservative and does not infer arbitrary table layouts. Scanned PDFs require OCR outside this app.
3. Select one or more SLOs, course objectives, and VARK activity elements for the assignment. The selected SLO wording is preserved and included in the generated assignment.
4. For SLOs only, continue directly to review/export. For Assignments, enter existing SLOs on “Tell us about your course.” Continue directly to assignment options, select one or more SLOs and course objectives, and choose VARK elements (Visual, Aural, Read/write, Kinesthetic). Set knowledge dimension, time, and optional AI resilience. Create one assignment per click; existing assignments remain available. Exports retain every selected SLO, objective, and VARK element.
5. Edit any assignment, rubric descriptor, or faculty adaptation. Review the complete plan.
6. Copy, download Word DOCX or a standalone HTML file, or choose **Save PDF → Save as PDF** in the browser print dialog. Exports include assignment instructions, assessment rubrics, and alignment explanations.

Changing course fields or an SLO clears dependent generated assignments to prevent stale alignment. Changes to assignment-generation settings do not relabel old assignments; regenerate to apply new settings. The report warns about objectives not covered by the SLO crosswalk.

Alignment is many-to-many: one SLO may support several objectives, and the same objective may support several SLOs. Each SLO has wizard-selected objective links and Bloom’s level, plus an explanation. A collapsed **Adjust alignment** section exposes optional overrides that apply immediately, with no confirmation step. The crosswalk and all exports retain every objective link. Supplied outcomes are analyzed without being rewritten; rewriting is a separate action. Finishing a wording edit triggers automatic reanalysis. Editing objective links or the Bloom’s level applies a faculty override immediately. Performance criteria and direct assessment fields are not shown under SLOs; assessment details belong to generated assignments. When AI is unavailable, supplied SLOs remain visible as pending rather than being assigned invented links. Unknown or non-measurable verbs are flagged for review instead of defaulting to Analyze.

## Frameworks

- Anderson & Krathwohl’s established **2001 revised Bloom’s taxonomy**: Remember, Understand, Apply, Analyze, Evaluate, Create. The four knowledge dimensions are also available. Newer proposals are not treated as an officially superseding taxonomy. Reference: https://assessment.ucdavis.edu/assessment/Bloom
- **VARK activity modalities**: Visual, Aural, Read/write, Kinesthetic. These are selectable ways an activity engages learners, not fixed student categories or claims that matching a learning style raises achievement. No proprietary VARK questionnaire is reproduced. Reference: https://vark-learn.com/about-vark/what-vark-is-and-isnt/
- **AI resilience**: staged evidence, local/course-specific artifacts, process records, accessible individual follow-ups, and clear disclosure. No detector, cheating score, or promise of AI-proof assessment.

## Input protections and limits

Files: TXT, DOCX, or text-based PDF; at most 5 MB, 40,000 extracted characters, and 60 PDF pages. DOCX preflight checks ZIP signatures, encryption, file count, expanded sizes, compression ratios, and known active-content parts before extraction. Embedded objects and active Word fields are rejected. DOCX reads run in a dedicated worker with a timeout. PDF.js extracts only text with evaluation disabled; active PDF markers are rejected conservatively. Unsupported, damaged, encrypted, or oversized files receive clear errors.

Course text is treated as data, escaped before rendering, and never executed. Active markup and dangerous control characters are rejected; multilingual and legitimate academic discussion is allowed. The local model receives no tools or credentials. Prompt injection cannot be perfectly detected; instructions in reference text are explicitly untrusted and model outputs are validated. No mechanism can guarantee that every malicious file is detected. Maintain browser and parser updates.

The Content Security Policy permits local scripts, WebAssembly, workers, and the specific public model-download origins. There are no third-party analytics, fonts, remote scripts, or outbound course-data requests. GitHub Pages cannot set arbitrary server headers; a meta CSP is included, but deployment on other hosts should also add response headers as appropriate.

## Validation

Run `node --test tests/*.test.mjs` for meaningful input-safety, SLO, reference, and malformed-output tests. Before a campus-wide rollout, pilot generated plans with faculty from several disciplines and test the model on representative institution-managed computers. Browser/device variation and small-model output quality need real deployment testing.

Validation performed for this delivery: 23 automated checks passed; browser checks covered TXT/DOCX/text-PDF imports, manual SLO editing and crosswalk updates, assignment controls, copy/DOCX/EPUB export actions, clearing data, and desktop/mobile layouts. DOCX and EPUB archive/XML checks confirmed full report content and Unicode preservation. The PDF option uses the browser’s print-to-PDF facility. **Live AI inference was not verified:** the available preview browser did not expose the required GPU features and correctly displayed the compatibility error. Test model loading, generated SLO quality, and generated assignments on a compatible computer before inviting faculty. GitHub deployment is configured but has not been run against your repository.

## Included libraries

- WebLLM 0.2.82 — Apache-2.0, bundled distribution.
- PDF.js 5.6.205 — Apache-2.0.
- JSZip 3.10.1 — MIT or GPLv3; used under MIT.
- Qwen2.5 1.5B model artifacts are downloaded on request, not included in this repository; see the model provider’s license and attribution.

See `vendor/` for library license files. Learning Assessment Wizard application code is released under the MIT license in `LICENSE`.
