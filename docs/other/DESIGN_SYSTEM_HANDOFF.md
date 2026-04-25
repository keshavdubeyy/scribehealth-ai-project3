# Scribe Health — Design System & UI/UX Handoff Document

> This document is a complete extraction of all design tokens, components, user flows, acceptance criteria, and UI/UX functionality from the Scribe Health codebase. Intended for teams implementing the same product in a different tech stack (e.g., Java/Spring + a frontend framework).

---

## TABLE OF CONTENTS

1. [Design Tokens](#1-design-tokens)
2. [Typography](#2-typography)
3. [Spacing & Border Radius](#3-spacing--border-radius)
4. [Animations & Transitions](#4-animations--transitions)
5. [Component Library](#5-component-library)
6. [Feature Components](#6-feature-components)
7. [Layout & Navigation](#7-layout--navigation)
8. [Routes & Pages](#8-routes--pages)
9. [User Flows](#9-user-flows)
10. [UI/UX Functional Patterns](#10-uiux-functional-patterns)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [API Endpoints](#12-api-endpoints)
13. [Data Models](#13-data-models)
14. [Status & Badge System](#14-status--badge-system)
15. [Access Control & Auth](#15-access-control--auth)

---

## 1. DESIGN TOKENS

### Color Palette (Light Mode)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | oklch(1 0 0) | Page background (white) |
| `--foreground` | oklch(0.141 0.005 285.82) | Primary text |
| `--primary` | oklch(0.41 0.072 222) | Brand teal — buttons, sidebar, links |
| `--primary-foreground` | oklch(0.985 0.001 106.42) | Text on primary (near white) |
| `--secondary` | oklch(0.95 0.018 222) | Light teal backgrounds |
| `--secondary-foreground` | oklch(0.21 0.006 285.88) | Text on secondary |
| `--muted` | oklch(0.94 0.005 90) | Disabled/muted backgrounds |
| `--muted-foreground` | oklch(0.552 0.016 285.94) | Muted text (gray) |
| `--accent` | oklch(0.95 0.018 222) | Accent/hover highlights |
| `--accent-foreground` | oklch(0.21 0.006 285.88) | Text on accent |
| `--destructive` | oklch(0.577 0.245 27.325) | Error/danger red |
| `--destructive-foreground` | oklch(0.985 0.001 106.42) | Text on destructive |
| `--border` | oklch(0.90 0.010 222) | Borders (light teal-gray) |
| `--input` | oklch(0.90 0.010 222) | Input borders |
| `--ring` | oklch(0.41 0.072 222) | Focus ring color |
| `--card` | oklch(1 0 0) | Card backgrounds |
| `--card-foreground` | oklch(0.141 0.005 285.82) | Card text |
| `--popover` | oklch(1 0 0) | Popover/dropdown background |
| `--popover-foreground` | oklch(0.141 0.005 285.82) | Popover text |

### Color Palette (Dark Mode)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | #0D1B26 | Dark navy background |
| `--foreground` | oklch(0.985 0.001 106.42) | Light text |
| `--primary` | #5B9BBF | Lighter teal for dark mode |
| `--secondary` | oklch(0.20 0.02 222) | Dark teal secondary |
| `--muted` | oklch(0.21 0.006 285.88) | Muted dark backgrounds |
| `--muted-foreground` | oklch(0.712 0.005 56.259) | Muted text |
| `--border` | rgba(255,255,255,0.08) | Subtle border |
| `--input` | rgba(255,255,255,0.08) | Input border |
| `--card` | #162332 | Card background |
| `--popover` | #1E3346 | Popover/dropdown background |
| `--destructive` | oklch(0.704 0.191 22.216) | Danger red (lighter) |

### Sidebar Colors

| Token | Value |
|-------|-------|
| `--sidebar` | oklch(0.41 0.072 222) — brand teal |
| `--sidebar-foreground` | oklch(0.985 0.001 106.42) — white |
| `--sidebar-primary` | oklch(0.985 0.001 106.42) |
| `--sidebar-primary-foreground` | oklch(0.41 0.072 222) |
| `--sidebar-accent` | rgba(255,255,255,0.12) |
| `--sidebar-accent-foreground` | oklch(0.985 0.001 106.42) |
| `--sidebar-border` | rgba(255,255,255,0.10) |
| `--sidebar-ring` | oklch(0.41 0.072 222) |

### Chart Colors (Data Visualization)

| Token | Value |
|-------|-------|
| `--chart-1` | oklch(0.41 0.072 222) — brand teal |
| `--chart-2` | oklch(0.55 0.080 222) |
| `--chart-3` | oklch(0.65 0.060 222) |
| `--chart-4` | oklch(0.75 0.040 222) |
| `--chart-5` | oklch(0.85 0.020 222) |

### Hex References (For Teams Not Using oklch)

| Semantic | Approximate Hex |
|----------|----------------|
| Brand Teal (primary) | `#2E5A73` |
| Dark Mode Primary | `#5B9BBF` |
| Dark Background | `#0D1B26` |
| Dark Card | `#162332` |
| Dark Popover | `#1E3346` |

---

## 2. TYPOGRAPHY

| Property | Value |
|----------|-------|
| Font Family (sans) | Geist (Google Fonts) — `--font-sans` variable |
| Font Family (mono) | Geist Mono — `--font-geist-mono` variable |
| Font Family (heading) | Geist (same as sans) |
| Base font size | 16px (browser default) |
| Locale | `en-IN` for date/number formatting |

---

## 3. SPACING & BORDER RADIUS

### Border Radius System

| Variable | Formula | Approx Value |
|----------|---------|-------------|
| `--radius` (base) | 0.625rem | 10px |
| `--radius-sm` | calc(var(--radius) * 0.6) | 6px |
| `--radius-md` | calc(var(--radius) * 0.8) | 8px |
| `--radius-lg` | calc(var(--radius) * 1.0) | 10px |
| `--radius-xl` | calc(var(--radius) * 1.4) | 14px |
| `--radius-2xl` | calc(var(--radius) * 1.8) | 18px |
| `--radius-3xl` | calc(var(--radius) * 2.2) | 22px |
| `--radius-4xl` | calc(var(--radius) * 2.6) | 26px |

### Spacing Scale

Uses standard Tailwind 4px-based spacing scale (4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px…).

### Layout Dimensions

| Element | Value |
|---------|-------|
| Sidebar width | 224px (14rem / w-56) |
| Button height (default) | 32px (h-8) |
| Button height (xs) | 24px (h-6) |
| Button height (sm) | 28px (h-7) |
| Button height (lg) | 36px (h-9) |
| Input height | 32px (h-8) |
| Badge height | 20px (h-5) |
| Avatar (sm) | 24px |
| Avatar (default) | 32px |
| Avatar (lg) | 40px |

---

## 4. ANIMATIONS & TRANSITIONS

| Animation | Usage |
|-----------|-------|
| `animate-in` | Entering elements (dialogs, toasts, dropdowns) |
| `animate-out` | Exiting elements |
| `fade-in` / `fade-out` | Opacity transitions |
| `zoom-in-95` / `zoom-out-95` | Scale from 95% |
| `slide-in-from-top-2` | Dropdowns entering from top |
| `slide-in-from-bottom-2` | Modals entering from bottom |
| `slide-in-from-left-2` | Sidebar/left panels |
| `slide-in-from-right-2` | Right panels |
| `animate-pulse` | Loading skeletons, recording dot indicator |
| `animate-spin` | Loading spinners (Loader2 icon) |
| Debounce | 800ms for auto-save in note editor |
| Polling interval | 3000ms for session status |

---

## 5. COMPONENT LIBRARY

All components use **shadcn/ui** built on **Radix UI** primitives with **Tailwind CSS**.

### Button

**Variants:**
| Variant | Style |
|---------|-------|
| `default` | Primary teal background, white text |
| `outline` | Transparent background, teal border |
| `secondary` | Light teal background |
| `ghost` | No background, hover shows light teal |
| `destructive` | Red background, white text |
| `link` | No background, underline on hover |

**Sizes:**
| Size | Height | Use |
|------|--------|-----|
| `xs` | 24px | Compact actions |
| `sm` | 28px | Secondary actions |
| `default` | 32px | Standard actions |
| `lg` | 36px | Primary CTAs |
| `icon` | 32x32px | Icon-only buttons |
| `icon-xs` | 24x24px | Compact icon buttons |
| `icon-sm` | 28x28px | Small icon buttons |
| `icon-lg` | 36x36px | Large icon buttons |

**States:** default, hover, active (slight translate-y), focus (ring), disabled (opacity 50%), aria-invalid.

---

### Card

**Subcomponents:** `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`

**Size variants:**
- `default` — standard padding
- `sm` — reduced padding

---

### Input

- Height: 32px
- Supports: text, file, disabled, placeholder, aria-invalid (red border)
- Full width by default

---

### Badge

**Variants:** `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`
- Height: 20px
- Inline flex with auto-sizing icons

---

### Dialog / Modal

**Subcomponents:** `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`
- Overlay: backdrop blur
- Animation: zoom-in-95 on enter, zoom-out-95 on exit
- `showCloseButton` prop: shows X button in corner
- Centered on screen

---

### Alert Dialog (Confirmation)

**Subcomponents:** `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogMedia`
- Size variants: `default`, `sm`
- `AlertDialogMedia` for icon area above title

---

### Tabs

**Subcomponents:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

**Variants:**
| Variant | Style |
|---------|-------|
| `default` | Muted background container, active tab is white |
| `line` | Transparent, active tab has underline indicator |

**Orientations:** horizontal (default), vertical

---

### Select

**Subcomponents:** `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectSeparator`
- Size variants: `sm`, `default`
- Selected items show CheckIcon
- Scroll indicators for long lists

---

### Checkbox

- Size: 16x16px
- Border: 1px solid input color
- Checked: shows CheckIcon, background filled with primary color

---

### Dropdown Menu

**Subcomponents:** `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuShortcut`
- `destructive` variant for dangerous actions (delete, etc.)
- `inset` prop for sub-items alignment

---

### Avatar

**Subcomponents:** `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount`
- Fallback: displays initials (first letter of name)
- Group: overlapping avatars with negative margin
- `AvatarGroupCount`: shows "+N" for overflow

---

### Separator

- Orientation: horizontal (default), vertical
- Color: `border-border`

---

### Scroll Area

- Custom scrollbar styling (rounded-full, bg-border)
- Orientation: vertical (default), horizontal

---

### Toast (Sonner)

**Types with custom icons:**
| Type | Icon |
|------|------|
| success | CircleCheckIcon (green) |
| info | InfoIcon (blue) |
| warning | TriangleAlertIcon (yellow) |
| error | OctagonXIcon (red) |
| loading | Loader2Icon (spinning) |

CSS variables: `--normal-bg`, `--normal-text`, `--normal-border`, `--border-radius`

---

### Textarea

- Min height: 64px (min-h-16)
- Auto-grows with content (field-sizing-content)
- Supports aria-invalid

---

### Label

- Flex row with 8px gap
- Text-sm
- Supports peer-disabled state (opacity 50%)

---

## 6. FEATURE COMPONENTS

### Session Recorder

**States (sequential):**
1. `setup` — Patient selection dropdown
2. `consent` — Consent screen with checkbox
3. `recording` — Active recording with timer
4. `processing` — Upload & AI processing
5. `review` — View generated note

**Functionality:**
- Uses browser MediaRecorder API
- Audio format: `audio/webm;codecs=opus` (fallback: `audio/webm`)
- Streams audio in 1000ms chunks
- Tracks elapsed duration in seconds
- Uploads audio to Supabase Storage
- POSTs to `/api/transcribe` for transcription
- POSTs to `/api/generate-note` for note generation

---

### Note Editor

**Templates (6):**
| ID | Display Name |
|----|-------------|
| `general_opd` | General OPD |
| `mental_health_soap` | Mental Health (SOAP) |
| `physiotherapy` | Physiotherapy |
| `pediatric` | Pediatric |
| `cardiology` | Cardiology |
| `surgical_followup` | Surgical Follow-up |

**Functionality:**
- Debounced auto-save (800ms after last keystroke)
- Template selector (changing template triggers note regeneration)
- POSTs to `/api/regenerate-note` for template change
- PATCHes to `/api/sessions/[id]/edits` for each edit
- "Save & complete" button finalizes session
- All fields are editable textareas

---

### Consent Screen

**Required disclosures (4 items):**
1. Patient is informed that the session is being recorded
2. Recording will be used only for generating clinical notes
3. Data is stored securely and not shared with third parties
4. Patient has the right to request deletion of their recording

**Acceptance:** Checkbox must be checked before proceeding.

**Icon:** ShieldCheck (teal)

---

### Recording Indicator (Active Recording Bar)

- Fixed top bar (full width, z-index high)
- Background: destructive red
- Shows: pulsing red dot + elapsed time (MM:SS or HH:MM:SS)
- "End session" button on the right

---

### Session Processing View

- Full-screen overlay with large spinner
- Text: "Processing your session..."
- Polls `/api/sessions/[id]` every 3000ms
- Auto-redirects when `session.status === "completed"`

---

### Transcript Panel

- Displays raw transcript text
- Empty state: "No transcript available" with icon
- "Re-transcribe" button — calls `/api/transcribe` manually
- Loading state on re-transcribe button

---

### Report View (Print Layout)

**Sections:**
1. Doctor header: name, specialty, clinic, email
2. Patient info: name, age, date of session
3. Chief complaint
4. All note fields (varies by template)
5. Signature placeholder

**Actions:**
- Print / Save as PDF button (triggers browser print)
- Copy to clipboard button

**Print CSS:** Hides non-printable elements via `@media print`

---

### Prescription Tab (Prescription Generator)

**Left Panel (Editor):**
- Patient name, age
- Chief complaint
- Diagnosis
- Medicines table:
  - Medicine name
  - Dose
  - Frequency (dropdown)
  - Duration
  - Timing (dropdown)
  - Remove button per row
- "Add medicine" button
- Next steps (bullet list editor)
- "Auto-fill from notes" button
- "Download PDF" button

**Right Panel (Live Preview):**
- Shows letterhead image
- Overlays text in configured safe zone
- Safe zone highlighted with dashed overlay
- Updates in real-time as editor changes

**Frequency Options:**
- Once daily, Twice daily, Three times daily, Four times daily, Every 8 hours, Every 12 hours, At bedtime, As needed (SOS)

**Timing Options:**
- After food, Before food, With food, Empty stomach, At bedtime, Any time

---

### Prescription Template Setup

- Upload letterhead image (JPG/PNG)
- Canvas: click and drag to draw safe zone rectangle
- Font size input (range: 7–16pt)
- Line height input (range: 10–30pt)
- Save / Delete template buttons

---

### Patients List

**Search:** by name, phone, notes fields
**Filters:** All | Has sessions | No sessions
**Sort options:** Name A-Z, Name Z-A, Age (youngest), Age (oldest), Most sessions, Recently active
**Row display:** Avatar with initial, name, age, phone, session count badge, chevron icon

---

### Sessions List

**Search:** by patient name, chief complaint
**Filters:** All statuses | Completed | Processing | by Template
**Sort options:** Newest first, Oldest first, Patient A-Z, Patient Z-A, Longest duration
**Row display:** Session name, chief complaint, template badge, status badge, date, duration

---

## 7. LAYOUT & NAVIGATION

### Sidebar

| Property | Value |
|----------|-------|
| Width | 224px (fixed) |
| Background | Brand teal (#2E5A73) |
| Text color | White |
| Logo | Image (white version) at top |

**Navigation Items (with Lucide icons):**
| Item | Icon | Route |
|------|------|-------|
| Dashboard | LayoutDashboard | `/dashboard` |
| Patients | Users | `/dashboard/patients` |
| Sessions | FileText | `/dashboard/sessions` |
| Prescription Template | ClipboardList | `/dashboard/prescription-template` |

**CTA:** "New session" button with Plus icon (prominent, below logo)

**Footer:** Sign out button with LogOut icon

**Active state:** Lighter teal background highlight on active nav item

---

### Page Layout

```
[Sidebar 224px] | [Main Content Area - fills remaining width]
                  [Page Header: back button, title, badges, actions]
                  [Page Body: scrollable content]
```

---

### Session Detail Page Layout

**Header:**
- Back arrow button → sessions list
- Session name (auto-generated)
- Badges: status, template, duration, patient age, recording
- Buttons: Link patient, View report, Delete

**Body (Tabs):**
1. Clinical Note — NoteEditor component
2. Prescription — PrescriptionTab component
3. Transcript — TranscriptPanel component
4. Audio — Audio player (if recording exists)
5. Edit History — Table of all field edits

---

## 8. ROUTES & PAGES

| Route | Page | Auth Required |
|-------|------|--------------|
| `/` | Root redirect | Yes |
| `/sign-in` | Login/sign-up tabs | No |
| `/sign-up` | Create account | No |
| `/auth/callback` | Clerk auth callback | No |
| `/auth/verify` | Email verification | No |
| `/dashboard` | Dashboard (stats + recent sessions) | Yes |
| `/dashboard/sessions` | All sessions list | Yes |
| `/dashboard/sessions/new` | New session recorder | Yes |
| `/dashboard/sessions/[id]` | Session detail | Yes |
| `/dashboard/patients` | All patients list | Yes |
| `/dashboard/patients/new` | Add patient form | Yes |
| `/dashboard/patients/[id]` | Patient detail | Yes |
| `/dashboard/prescription-template` | Template setup | Yes |
| `/sessions/[id]/report` | Print-friendly report | Yes |

### Query Parameters

| Route | Param | Usage |
|-------|-------|-------|
| `/dashboard/sessions/new` | `patient_id` | Pre-select patient in recorder |

---

## 9. USER FLOWS

### Flow 1: New Recording Session

```
Dashboard / "New session" button
  ↓
/dashboard/sessions/new
  ↓
Step 1: Setup
  - Select patient from dropdown (or "Unknown patient" / "New patient")
  - Patient list pre-loaded
  ↓
Step 2: Consent
  - Doctor confirms patient consent verbally
  - Checks checkbox: "I confirm the patient has given informed consent"
  - Click "Start recording"
  ↓
Step 3: Recording
  - RecordingIndicator bar appears at top (red, pulsing dot, timer)
  - Mic access requested from browser
  - Audio streamed in 1s chunks
  - Click "End session" when done
  ↓
Step 4: Processing
  - Full-screen spinner
  - Audio uploaded to storage
  - Transcription API called
  - Note generation AI called
  - Polls every 3s for completion
  ↓
Step 5: Review (redirects to session detail)
  - /dashboard/sessions/[id]
  - Clinical note displayed
  - Doctor can edit, change template, view transcript
```

---

### Flow 2: Edit Clinical Note

```
/dashboard/sessions/[id] → Clinical Note tab
  ↓
View auto-generated note fields
  ↓
Edit any field (textarea)
  → Auto-saves after 800ms debounce
  → Logs edit to edit history
  ↓
(Optional) Change template
  → Confirmation dialog
  → Regenerates note via AI
  ↓
Click "Save & complete"
  → Session status → "completed"
```

---

### Flow 3: Generate Prescription PDF

```
/dashboard/sessions/[id] → Prescription tab
  ↓
(Optional) Click "Auto-fill from notes"
  → AI parses note for medicines, diagnosis
  → Pre-fills prescription fields
  ↓
Add/edit medicines (name, dose, frequency, duration, timing)
Add next steps
  ↓
Live preview updates on right panel
  ↓
Click "Download prescription PDF"
  → PDF generated with letterhead + text in safe zone
  → Browser download triggered
```

---

### Flow 4: Manage Patients

```
/dashboard/patients
  ↓
Search / Filter / Sort patient list
  ↓
Click patient → /dashboard/patients/[id]
  ↓
View: age, phone, notes, all sessions
  ↓
Edit (dialog): update name, age, phone, notes
  OR
Delete (alert dialog): confirm deletion
  ↓
"New session for this patient" → /dashboard/sessions/new?patient_id=[id]
```

---

### Flow 5: View & Print Report

```
/dashboard/sessions/[id]
  ↓
Click "View report" button → opens /sessions/[id]/report in new tab
  ↓
Report page shows:
  - Doctor/clinic header
  - Patient info, date
  - Chief complaint
  - All note fields
  - Signature placeholder
  ↓
Click "Print / Save PDF" → browser print dialog
  OR
Click "Copy" → copies text to clipboard
```

---

### Flow 6: Setup Prescription Template

```
/dashboard/prescription-template
  ↓
Upload letterhead image (JPG/PNG)
  ↓
Draw safe zone on canvas (click + drag rectangle)
  ↓
Set font size (7–16pt) and line height (10–30pt)
  ↓
Click "Save template"
  → Template stored
  → Used for PDF generation
```

---

### Flow 7: Link/Unlink Patient to Session

```
/dashboard/sessions/[id]
  ↓
Click "Link patient" button
  ↓
Dialog opens: dropdown of patients
  ↓
Select patient → Click "Link"
  → Session updated with patient_id
  OR
Click "Unlink" → Removes patient association
```

---

## 10. UI/UX FUNCTIONAL PATTERNS

### Search Pattern

All list pages support real-time search:
- Filters rows client-side (case-insensitive substring)
- Search fields vary per page (see component descriptions)
- "X" button to clear search
- Results update instantly (no debounce on search)

---

### Filter Pattern

- Dropdown or tabs above list
- Filter options are mutually exclusive (single selection)
- Combined with active search
- "All" option always available

---

### Sort Pattern

- Dropdown next to filter
- Sort applied after filter + search
- Remembers selection within session

---

### Loading States

| Context | Pattern |
|---------|---------|
| Page data loading | Spinner centered |
| Button action in progress | Button disabled, text → loading text |
| Session processing | Full-screen spinner overlay |
| Re-transcribe | Spinner inside button |
| Auto-fill from notes | Button disabled with spinner |

---

### Error States

| Context | Pattern |
|---------|---------|
| API errors | Sonner error toast (OctagonX icon, red) |
| Form validation | aria-invalid + red border on input |
| Microphone denied | Toast with instructions |
| Upload failure | Error toast with retry hint |

---

### Empty States

| Context | Pattern |
|---------|---------|
| No sessions | Illustration + "Record your first session" CTA |
| No patients | Illustration + "Add your first patient" CTA |
| No transcript | Icon + "No transcript available" text |
| No prescription template | Setup prompt |

---

### Confirmation Dialogs

Used before destructive actions:
- Delete session (with option to also delete audio file)
- Delete patient
- Change template (will regenerate note)

Pattern: AlertDialog with title, description, Cancel + Confirm buttons.

---

### Toast Notifications

| Event | Type | Message |
|-------|------|---------|
| Patient added | success | "Patient added successfully" |
| Session saved | success | "Session saved" |
| Note generated | success | "Clinical note generated" |
| Template changed | success | "Template updated, regenerating note..." |
| Copy to clipboard | success | "Copied to clipboard" |
| Microphone denied | error | "Microphone access denied" |
| Upload failed | error | "Failed to upload audio" |
| API error | error | Error message from API |

---

### Data Display Formats

| Data | Format |
|------|--------|
| Session name | `PatientName_10Apr2026_0542PM` |
| Date | `10 April 2026` (en-IN locale) |
| Recording duration in bar | `00:05:30` (HH:MM:SS or MM:SS) |
| Age display | `28 yrs` |
| Confidence | `High confidence` / `Medium confidence` / `Low confidence` |
| Session status | `completed` / `processing` |

---

## 11. ACCEPTANCE CRITERIA

### Authentication & Access

- [ ] Users must authenticate before accessing any dashboard route
- [ ] Doctor profile is auto-created on first login if not exists
- [ ] All data queries are scoped by `doctor_id` — doctors cannot access other doctors' data
- [ ] Unauthenticated access to protected routes redirects to `/sign-in`

---

### Session Recording

- [ ] Browser must request microphone permission before recording
- [ ] If microphone is denied, show error toast with explanation
- [ ] Audio recorded as `audio/webm;codecs=opus` (fallback: `audio/webm`)
- [ ] Audio data streamed in 1000ms chunks during recording
- [ ] Recording duration tracked and displayed in real-time in MM:SS format
- [ ] "End session" button visible at all times during recording (in top bar)
- [ ] After ending, audio is uploaded to cloud storage before transcription

---

### Consent

- [ ] Consent screen must appear before recording can start
- [ ] Checkbox must be explicitly checked to enable "Start recording" button
- [ ] Four specific consent disclosures must be displayed (see component section)
- [ ] Consent is per-session (not remembered across sessions)

---

### Transcription

- [ ] Audio file is sent to transcription API after recording ends
- [ ] If transcription fails, session can still be created (empty transcript)
- [ ] Doctor can manually re-trigger transcription from the Transcript tab
- [ ] Transcript displayed as plain text in read-only panel

---

### Note Generation

- [ ] Note is auto-generated from transcript using AI immediately after transcription
- [ ] System auto-detects which of 6 templates best fits the conversation
- [ ] Detected template used by default; doctor can change it
- [ ] Changing template triggers note regeneration (with confirmation dialog)
- [ ] All note fields are editable after generation
- [ ] Changes auto-save after 800ms of inactivity
- [ ] Every edit is logged to edit history (field name, old value, new value, timestamp)
- [ ] "Save & complete" button marks session as `completed`

---

### Template System

- [ ] 6 note templates available: General OPD, Mental Health SOAP, Physiotherapy, Pediatric, Cardiology, Surgical Follow-up
- [ ] Each template has different fields (not all templates have same fields)
- [ ] Template badge shown on session card and session detail header
- [ ] Template can be changed on any session (triggers regeneration)

---

### Patient Management

- [ ] Patient requires: name (mandatory), age (optional), phone (optional), notes (optional)
- [ ] Patient can be linked/unlinked from any session post-creation
- [ ] Deleting a patient does NOT delete their sessions (sessions become "unlinked")
- [ ] Patient detail shows all sessions linked to them
- [ ] Patients can be created mid-session-recording from the recorder setup screen

---

### Prescription

- [ ] Auto-fill parses existing note to extract medicines and diagnosis
- [ ] Medicines must have at minimum: name and dose
- [ ] Frequency and timing are dropdowns (not free text)
- [ ] PDF is generated server-side, overlaid on letterhead in configured safe zone
- [ ] PDF download is triggered as browser file download
- [ ] Safe zone is defined per-doctor via template setup (percentage-based coordinates)

---

### Prescription Template

- [ ] Letterhead image upload: JPG or PNG only
- [ ] Safe zone defined by drawing rectangle on canvas
- [ ] Font size range: 7–16pt
- [ ] Line height range: 10–30pt
- [ ] Only one template per doctor (create or update, no multiple templates)
- [ ] If no template configured, prescription PDF download is disabled or shows setup prompt

---

### AI Confidence Score

- [ ] Each session has an AI confidence score (0–100%)
- [ ] Confidence badge shown on session detail header
- [ ] Color coding:
  - 80%+ → green → "High confidence"
  - 60–79% → yellow → "Medium confidence"
  - <60% → red → "Low confidence"

---

### Session Status

| Status | When | Display |
|--------|------|---------|
| `processing` | During/after recording, while AI works | Orange/outline badge, spinner shown |
| `completed` | After doctor clicks "Save & complete" | Default/filled badge |

---

### Report

- [ ] Report opens in new browser tab
- [ ] Report is printable via browser print dialog (non-essential UI hidden via CSS)
- [ ] Report can be copied as plain text to clipboard
- [ ] Report includes: doctor name, specialty, clinic, email, patient name, age, date, all note fields, signature placeholder

---

## 12. API ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transcribe` | Transcribe audio file |
| POST | `/api/generate-note` | Generate clinical note from transcript |
| POST | `/api/regenerate-note` | Regenerate note with new template |
| GET | `/api/sessions/[id]` | Get session by ID |
| PATCH | `/api/sessions/[id]` | Update session (link patient, update fields) |
| DELETE | `/api/sessions/[id]` | Delete session (optionally delete audio) |
| PATCH | `/api/sessions/[id]/edits` | Log a note field edit |
| GET | `/api/patients` | List all patients for doctor |
| POST | `/api/patients` | Create patient |
| GET | `/api/patients/[id]` | Get patient by ID |
| PATCH | `/api/patients/[id]` | Update patient |
| DELETE | `/api/patients/[id]` | Delete patient |
| POST | `/api/prescriptions/parse` | Parse medicines from note text |
| POST | `/api/prescriptions/generate` | Generate prescription PDF |
| GET | `/api/prescription-templates` | Get doctor's prescription template |
| POST | `/api/prescription-templates` | Create prescription template |
| PATCH | `/api/prescription-templates` | Update prescription template |
| DELETE | `/api/prescription-templates` | Delete prescription template |

---

## 13. DATA MODELS

### Session

```
session {
  id: uuid
  doctor_id: uuid (FK → doctors)
  patient_id: uuid? (FK → patients, nullable)
  name: string (e.g. "PatientName_10Apr2026_0542PM")
  chief_complaint: string?
  transcript: string?
  note: json (template-specific fields)
  template: NoteTemplate (enum)
  status: "processing" | "completed"
  duration: integer (seconds)
  ai_confidence: float (0.0 – 1.0)
  audio_url: string? (Supabase storage URL)
  created_at: timestamp
  updated_at: timestamp
}
```

### Session Edit

```
session_edit {
  id: uuid
  session_id: uuid (FK → sessions)
  field_path: string (e.g. "subjective", "medications[0].dose")
  old_value: string?
  new_value: string?
  edited_at: timestamp
}
```

### Patient

```
patient {
  id: uuid
  doctor_id: uuid (FK → doctors)
  name: string
  age: integer?
  phone: string?
  notes: string?
  created_at: timestamp
  updated_at: timestamp
}
```

### Doctor

```
doctor {
  id: uuid
  user_id: string (Clerk user ID)
  name: string
  specialty: string?
  clinic_name: string?
  email: string
  created_at: timestamp
}
```

### Prescription Template

```
prescription_template {
  id: uuid
  doctor_id: uuid (FK → doctors)
  image_url: string (Supabase storage URL)
  safe_zone: {
    x: float (% from left)
    y: float (% from top)
    width: float (% of image width)
    height: float (% of image height)
  }
  font_size: integer (pt, 7–16)
  line_height: integer (pt, 10–30)
  created_at: timestamp
  updated_at: timestamp
}
```

### Note Templates (NoteTemplate enum)

```
"general_opd"         → General OPD note
"mental_health_soap"  → Mental Health (SOAP format)
"physiotherapy"       → Physiotherapy note
"pediatric"           → Pediatric note
"cardiology"          → Cardiology note
"surgical_followup"   → Surgical Follow-up note
```

---

## 14. STATUS & BADGE SYSTEM

### Session Status Badges

| Status | Variant | Color |
|--------|---------|-------|
| `completed` | `default` | Primary teal |
| `processing` | `outline` | Outline with text |

### Confidence Badges

| Score | Label | Color |
|-------|-------|-------|
| ≥ 80% | High confidence | Green |
| 60–79% | Medium confidence | Yellow |
| < 60% | Low confidence | Red |

### Template Badges

Each template displayed as readable label (see template list above) in a `secondary` variant badge.

### Supplementary Badges on Session Detail

| Badge | Example | Source |
|-------|---------|--------|
| Duration | `5m 30s` | session.duration |
| Patient age | `28 yrs` | patient.age |
| Recording | `Recording saved` | session.audio_url exists |
| Medicine count | `2 medicines` | prescription.medicines.length |

---

## 15. ACCESS CONTROL & AUTH

### Authentication Provider

- Clerk (JWT-based, supports SSO + email/password)
- Sessions managed via Clerk tokens
- Doctor profile auto-created on first authenticated dashboard visit

### Authorization Rules

- All resources (sessions, patients, prescription templates) are owned by a `doctor_id`
- Every API query must filter by `doctor_id` derived from authenticated user
- Doctors cannot read/write other doctors' data
- No role-based access (single doctor role only in this version)

### Data Storage

- Database: Supabase (PostgreSQL)
- File Storage: Supabase Storage (audio files, letterhead images)
- Row Level Security (RLS) enforced on Supabase tables

---

## TECH STACK REFERENCE (For Java Team Context)

| Layer | Technology Used |
|-------|----------------|
| Frontend Framework | Next.js 16 (React 19) |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| AI (note generation) | Anthropic Claude API |
| AI (transcription) | Sarvam API |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS 4 |
| PDF Generation | pdf-lib |
| Icons | Lucide React |
| Toasts | Sonner |
| Fonts | Geist (sans), Geist Mono |

---

*End of Scribe Health Design System & UI/UX Handoff Document*
