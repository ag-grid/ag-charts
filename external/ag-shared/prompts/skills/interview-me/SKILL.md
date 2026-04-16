---
targets: ['*']
name: interview-me
description: "Interview the user about ambiguities, low-confidence areas, and open questions in the current conversation. Only invoke when explicitly requested via /iterview-me."
invocable: user-only
---

# Interview Me

Review the current conversation and interview the user about anything that is ambiguous, uncertain, or unresolved. The goal is to surface gaps in understanding *before* they cause wrong assumptions or wasted work.

## Why This Matters

Agents often proceed with best-guess assumptions rather than pausing to clarify. This leads to rework when the assumption was wrong. A short interview at the right moment — before implementation, after a complex discussion, or when switching context — can save significant time and produce better results.

## How to Conduct the Interview

### Step 1: Mine the Conversation

Read through the conversation history and identify:

- **Ambiguities** — requirements, terms, or instructions that could be interpreted in more than one way
- **Low-confidence areas** — places where you made an assumption or chose between alternatives without clear guidance
- **Open questions** — things that were raised but never resolved, or topics where you need more information to proceed
- **Implicit assumptions** — things you're treating as given that the user may not agree with
- **Scope uncertainty** — unclear boundaries around what's in or out of scope

### Step 2: Prioritise and Group

Don't dump every micro-question at once. Group related questions together and prioritise by impact — ask about things that would cause the most rework if wrong.

Aim for 2-5 questions per round. If there are more, conduct multiple rounds rather than overwhelming with a long list.

### Step 3: Ask Using AskUserQuestion

For each question (or small group of related questions):

1. Briefly explain *why* you're asking — what assumption you're currently making and what would change depending on the answer
2. Ask the question clearly
3. If there are likely options, offer them as choices to make it easy to respond

Use the AskUserQuestion tool so the user gets a clear prompt for each question rather than a wall of text.

### Step 4: Summarise

After the interview, briefly summarise what you learned and how it changes your understanding or approach. If it affects an existing plan, update the plan.

## When There's Nothing to Ask

If the conversation is clear and you have high confidence in your understanding, say so. Don't manufacture questions just to justify the skill being invoked. A quick "I've reviewed the conversation and I'm confident in my understanding — no open questions" is a perfectly valid outcome.
