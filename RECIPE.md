# Agent Menu

The tab bar's + menu, with the agent list under your control: pin the agents you use to the top, hide the ones you never start, and leave out agents that aren't installed. "Edit agents…" turns the menu into an editor for that list. This is a piece you add to your current layout, not a whole window.

![Agent Menu in edit mode](preview.png)

This file is the brief: enough to build Agent Menu from an empty folder. The files next to it are one build of it. If they don't work on your Herdr, or you want it different, build it again from here.

## What you see

- The same popup as Herdr's own + menu, 250px wide, under the + button. It is as tall as its content.
- Top to bottom: Terminal; a small "Start an agent" label; the agent list; "Edit agents…"; a divider; New space, New worktree…, Open worktree….
- The agent list holds only installed agents you haven't hidden, pinned ones first, each with its icon and a `⌘ 1`–`⌘ 9` hint (`Ctrl` off macOS). Up to nine rows show; more scroll inside the list while everything else stays put.
- "Edit agents…" is dimmed, with a gear, and "2 hidden" on the right when you've hidden installed agents.
- In edit mode the label reads "Installed (6) · pin or hide". Every installed agent gets two small buttons on the right: a pin, in your theme's accent color when pinned, and an eye, crossed out when the agent is hidden. Hidden agents are dimmed. Below them, a folded "› Not installed (10)" line opens a dimmed, read-only list of the agents Herdr knows but this machine doesn't have. "Edit agents…" becomes "Done" with a check mark.
- Your theme's popup background, foreground and dim text; rows are 31px with rounded hover, text 12.8px, labels 11px.

## How it behaves

| Action | Result |
| --- | --- |
| Click an agent, or `⌘ 1`–`⌘ 9` while the menu is open | Starts that agent in a new tab and closes the menu |
| `⌘ T` / `⌘ N` while the menu is open | New terminal tab / new space |
| Edit agents… | Switches to edit mode; the menu stays open |
| Pin | Pins or unpins the agent. Pinned agents come first, in the order you pinned them |
| Eye | Hides or shows the agent in the menu |
| › Not installed | Unfolds or folds the list of agents that aren't installed |
| Done | Back to the menu with your changes |

Hidden agents don't take a number: hide the second agent and the third becomes `⌘ 2`. Pins and hidden agents are saved for every window and survive restarts. In edit mode the rows themselves don't react to clicks; only the buttons and the "Not installed" line do. "Not installed" opens folded every time. While the agent list loads the menu says "Checking installed agents…", and "Could not load agents" if that fails.

## Built from

- **One mod**, `mods/agent-menu/`, with `main.js`, `mod.json` (`place: "none"`, it only opens as a popup) and seven Lucide glyphs (ISC): `pin`, `eye`, `eye-off`, `check`, `settings`, `chevron-right`, `chevron-down`. A `DIR` constant at the top holds the folder for the icon paths. It started as a copy of Herdr's shipped `new-menu` mod.
- **A tab bar that opens it.** The + button lives in the shipped `tabs` mod and opens `new-menu`. Clone it and point the clone at this mod:

  ```sh
  herdr-app do mod.clone '{"name":"tabs","as":"tabs-plus"}'
  ```

  In `mods/tabs-plus/main.js`, change the + button's `openOverlay({ mod: "new-menu", … })` to `mod: "agent-menu"`, then use `"mod": "tabs-plus"` instead of `"tabs"` in your own layout (clone a shipped layout first if you use one). Clones are never updated, so the change survives Herdr updates.
- **The agents:** `knownAgents({ on })` for the active space's machine, once on open: Herdr's program table entries that have a `run` command, each marked installed or not. Agents start with `run("tab.new", { name, space, argv: agent.run })`.
- **State:** `shared` / `setShared` with `agentMenu.pinned` and `agentMenu.hidden`, arrays of agent keys. `setShared` re-renders every mod, which refreshes the open popup.
- **Sizing:** no height on the popup's root, so it takes its content's height. The agent list gets `h(min(9, rows) * 31)` with `overflow_y_scrollbar()`.
- **Commands:** `tab.new`, `space.new`, and `openOverlay` for the shipped `worktree` dialog (`action: "new"` at 460×280, `"open"` at 560×480). It closes itself with `closeOverlay(props().overlay)`.
- No network, no `exec` or `hc`, no files outside its folder except the shipped `icons/shell.svg` and `mods/workspace-chrome/branch.svg`.

## Watch out

- Never edit the shipped `tabs` or `new-menu` in place: on the next start Herdr moves an edited shipped mod to `<name>-edited` and restores its own, and the + button opens the original again.
- A scroll area has no height of its own. Without an explicit `h` under a content-sized root it collapses to nothing and the agent rows vanish.
- The shipped menu sizes its root as `167 + rows * 31`, which left its list about 6px short in testing and showed a scrollbar. Size the list, not the root.
- Read the pin and hide lists in `render()`, not `init()`, so a toggle shows at once.
- `shared()` values are untyped: keep only strings before using them.
- Installed agents are checked on the active space's machine and cached for up to a minute. A remote space can list different agents; pins and hidden agents apply on every machine.
- Follow the installed `herdr.d.ts` and `gpui-kit.d.ts`.

## Done when

- `herdr-app check mods/agent-menu` passes with the matching Herdr binary and home.
- The + button opens Agent Menu, listing only installed agents with `⌘ 1…` hints and no scrollbar.
- Edit agents… → eye on an agent → Done: the agent is gone, the hint shows "1 hidden" and the next agent took its number.
- Pinning an agent makes it the first row with `⌘ 1` after Done.
- "› Not installed" unfolds and folds the not-installed list.
- With more than nine rows the list scrolls while Terminal, Edit agents and New space stay in place.
- Pins and hidden agents survive closing and reopening Herdr.
