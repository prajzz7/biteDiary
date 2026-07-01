# Codex Skills And Agents Quick Reference

This note summarizes how to structure Codex instructions for this project without wasting tokens.

## The Short Version

- Use `AGENTS.md` for lightweight project rules that should affect most work in that folder.
- Use a formal global `SKILL.md` when you want Codex to auto-discover a reusable capability across projects.
- Use `frontend/skills/*.md` for project-local reference instructions, then route to them from `frontend/AGENTS.md`.
- In prompts, name the skill or goal clearly: "Use the project frontend UI designer skill. Redesign the login page UI only."

## `AGENTS.md`

`AGENTS.md` is the project instruction file. It is good for rules Codex should know while working in a folder.

Good things to put in `AGENTS.md`:

- Project tech stack.
- Folder-specific conventions.
- Commands for typecheck, build, tests, dev server.
- UI rules that should always apply.
- Short routing instructions to bigger docs or skills.

Avoid putting huge design systems, long examples, large workflows, or repeated explanations directly in `AGENTS.md`. It is read often, so keep it lean.

Example:

```md
# Frontend Instructions

- Next.js App Router
- TypeScript
- Tailwind CSS
- Use lucide-react icons
- Mobile-first UI

When the user asks for frontend UI design, redesign, visual polish, layout improvement, or production-level UI, read and follow:

`frontend/skills/frontend-ui-designer.md`
```

## Formal Global Skills

A formal Codex skill is usually stored globally, for example:

```text
C:\Users\Welcome\.codex\skills\
  frontend-ui-designer\
    SKILL.md
```

The filename must be exactly `SKILL.md`.

Basic structure:

```md
---
name: frontend-ui-designer
description: Design and build polished frontend UI for web apps. Use when the user asks to build, redesign, improve, polish, style, or create frontend pages, components, layouts, dashboards, forms, mobile screens, or design systems.
---

# Frontend UI Designer

Follow these rules when designing frontend UI...
```

Why `SKILL.md`?

Codex uses the skill folder as the package and `SKILL.md` as the required entry file. The frontmatter `name` and `description` are what help Codex decide when to load it.

Use global skills when:

- You want the same skill available in many projects.
- The skill is general-purpose, like frontend design, Prisma debugging, API review, or test-writing.
- You want Codex to auto-discover it from the global skills list.

## Project-Local Skill Docs

You created:

```text
frontend/
  skills/
    frontend-ui-designer.md
```

That is useful, but it is not the same as a formal global `SKILL.md` unless your Codex setup specifically supports repo-local skill discovery.

In this project, treat it as a project-local reference skill. Make it easy for Codex to find by adding a short route in `frontend/AGENTS.md`:

```md
When the user asks for frontend UI design, redesign, visual polish, layout improvement, mobile UI, production-level UI, or web/app screen design, read and follow:

`frontend/skills/frontend-ui-designer.md`
```

Then you can prompt:

```text
Use the project frontend UI designer skill. Redesign the login page UI only.
```

## `SKILL.md` Vs `frontend/skills/frontend-ui-designer.md`

`SKILL.md`:

- Formal skill entry file.
- Usually global under `.codex/skills/<skill-name>/SKILL.md`.
- Auto-discoverable when loaded by Codex.
- Needs YAML frontmatter with `name` and `description`.

`frontend/skills/frontend-ui-designer.md`:

- Project-local documentation pattern.
- Not automatically a formal skill in this setup.
- Good for detailed project-specific instructions.
- Should be invoked explicitly or routed from `AGENTS.md`.

## What Goes Where

Put this in `AGENTS.md`:

- "This is a Next.js App Router frontend."
- "Use TypeScript and Tailwind."
- "Run `npm run typecheck:frontend` after frontend changes."
- "For UI redesign tasks, read `frontend/skills/frontend-ui-designer.md`."

Put this in `frontend/skills/frontend-ui-designer.md`:

- Detailed visual style.
- Design tokens.
- Component rules.
- UX states to include.
- Layout rules.
- Accessibility checklist.
- Examples of good UI patterns.

Put this in a formal global skill:

- Reusable workflows you want across projects.
- Broad trigger descriptions.
- General best practices not tied to BiteDiary only.
- Optional `references/`, `scripts/`, or `assets/` if the workflow is large.

## How To Create A New Global Skill

Recommended structure:

```text
C:\Users\Welcome\.codex\skills\
  my-skill-name\
    SKILL.md
    references\
      optional-reference.md
    scripts\
      optional-script.js
    assets\
      optional-template-file
```

Minimal `SKILL.md`:

```md
---
name: my-skill-name
description: Short but specific description. Include when Codex should use this skill.
---

# My Skill Name

Use these instructions when...
```

Tips:

- Keep the `description` very clear because it controls when the skill is selected.
- Keep `SKILL.md` concise.
- Move long examples or detailed references into `references/`.
- Use `scripts/` for repeatable, fragile, or mechanical tasks.
- Use `assets/` for reusable templates or files that may be copied into outputs.

## How To Create Project Instructions

For a project or folder:

```text
biteDiary/
  AGENTS.md
  frontend/
    AGENTS.md
    skills/
      frontend-ui-designer.md
```

Use root `AGENTS.md` for repo-wide rules.

Use nested `frontend/AGENTS.md` for frontend-only rules.

Use `frontend/skills/*.md` for detailed optional instructions that should not be loaded every time.

## Prompting For Efficient But Good UI

Use a short prompt that includes:

- Which skill to use.
- Which screen/component to change.
- Scope boundary.
- Quality level.
- Any logic restrictions.

Good prompt:

```text
Use the project frontend UI designer skill. Redesign the login page UI only. Make it production-quality, mobile-first, and keep backend logic unchanged.
```

Another good prompt:

```text
Use the project frontend UI designer skill. Build the Restaurants list page. Use cards instead of tables on mobile, include loading/empty/error states, and do not change API routes.
```

Avoid vague prompts:

```text
Make it better.
```

Better:

```text
Use the project frontend UI designer skill. Improve the Add Restaurant form for mobile speed and clarity. Keep the existing fields and validation behavior unchanged.
```

## When A Skill Is Invoked Automatically

A formal global skill can be auto-selected when:

- Its `description` matches the task.
- You explicitly name it in the prompt.
- The current Codex session has loaded that skill.

A project-local reference file like `frontend/skills/frontend-ui-designer.md` is usually invoked when:

- You explicitly ask for it.
- `AGENTS.md` tells Codex to read it for matching tasks.

## BiteDiary Current Setup

Current project-local UI skill:

```text
frontend/skills/frontend-ui-designer.md
```

Current routing instruction:

```text
frontend/AGENTS.md
```

Best prompt for future UI work:

```text
Use the project frontend UI designer skill. <Task>. Keep backend logic unchanged.
```

