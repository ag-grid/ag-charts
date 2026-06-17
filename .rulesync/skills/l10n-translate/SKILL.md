---
targets: ['*']
name: l10n-translate
description: 'Synchronise ag-charts-locale translations with the en-US source of truth. Use when en-US.ts changes, when adding a new locale, or when translations have drifted (missing/extra/stale keys). Diffs en-US against each locale file, translates missing or changed values, removes keys no longer in en-US, and writes the locale files — preserving placeholders, formatters, and the per-file disclaimer.'
---

# Translate AG Charts locales

Keeps the translated locale files in `packages/ag-charts-locale/src/` complete and consistent with
the English source of truth, `en-US.ts`. You (Claude) perform the translation directly — there is no
external translation API or script dependency.

See `.rulesync/rules/l10n-maintenance.md` for the maintenance contract this skill enforces.

## Scope

- **Source of truth:** `packages/ag-charts-locale/src/en-US.ts`.
- **Targets:** every other `packages/ag-charts-locale/src/<locale>.ts` (e.g. `de-DE.ts`, `fr-FR.ts`,
  `ja-JP.ts`, …), or a subset the user names. Never modify `en-US.ts` here — change it first, then
  run this skill to propagate.
- Each file exports `AG_CHARTS_LOCALE_<XX_XX>: Record<string, string>` (uppercased locale code).

## Procedure

1. **Read `en-US.ts`.** Its keys define the required key set and order. The comment above each key
   (or group of keys) is the *context* for translating that key — use it to disambiguate meaning.

2. **For each target locale, diff against `en-US`:**
   - **Missing key** (in `en-US`, absent in the locale) → translate the `en-US` value and insert it,
     mirroring `en-US` ordering where practical (key order is not enforced by the test).
   - **Extra key** (in the locale, absent from `en-US`) → remove it.
   - **Changed key** (the `en-US` value or its context comment changed) → re-translate the value.
   - Unchanged keys → leave as-is.

   To find drift quickly, compare the key lists. For example:
   ```bash
   cd packages/ag-charts-locale/src
   keys() { grep -oE '^\s+[a-zA-Z0-9_]+:' "$1" | tr -d ' :'; }
   comm -23 <(keys en-US.ts | sort -u) <(keys de-DE.ts | sort -u)   # missing from de-DE
   comm -13 <(keys en-US.ts | sort -u) <(keys de-DE.ts | sort -u)   # extra in de-DE
   ```

3. **Translate using this system prompt** (the canonical instruction, kept in step with the rule).
   *context* is the en-US comment for the key/group; *productDescription* is "AG Charts":
   ```
   Translate the values in the JSON object to the specified language.
   Return the JSON object with the translated values in the same format and structure.
   Do not translate variable placeholders inside '{}' and '[]', e.g. '${variable}', '[number]' and '[percent]'.
   Do not add any additional properties to the object - it should be returned with the same properties as it was provided to you.
   For Time Format values, ensure these are translated and the translated value must reflect the same component order, and punctuation style. For example, "DD/MM/YYYY" becomes JJ/MM/AAAA in fr-FR.ts
   For context, the JSON Object contains the {context} Locale Key/Values for {productDescription}.
   Ensure translations are appropriate within the given context.
   ```

4. **Preserve file structure when writing:** keep the existing export name, the `Record<string, string>`
   typing, the explanatory comments, and the per-file translation disclaimer. Do not reformat
   untouched lines — `yarn nx format` handles final formatting.

5. **Verify** from the repo root:
   ```bash
   yarn nx format
   yarn nx build:types ag-charts-locale
   yarn nx lint ag-charts-locale
   yarn nx test ag-charts-locale
   ```
   The `translations` suite in `main.test.ts` asserts the contract: every locale has the same keys
   as `en-US`, formatters are within the allowed set, and `${variables}` match `en-US`.

## Notes

- The allowed formatter tokens are `number`, `percent`, `percent0to2dp`, `date`, `time`, `datetime`.
  Any bracketed token in a value must be one of these and must survive translation unchanged.
- Translate in the locale's natural script and conventions; do not transliterate placeholder names.
- For right-to-left locales (e.g. `ar-EG`, `he-IL`, `fa-IR`, `ur-PK`) translate the text normally —
  placeholder syntax is unchanged.
