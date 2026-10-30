import { View, div, svg, image } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme, spaces, panes, knownAgents, run, openOverlay, closeOverlay, props, window, shared, setShared } from "herdr";

// This mod's folder, for its own icons.
const DIR = "mods/new-menu-plus";
// Agent keys, persisted for every window, set under "Edit agents…".
const HIDDEN = "newMenu.hidden";
const PINNED = "newMenu.pinned";

/** @param {string} key @returns {string[]} */
function keys(key) {
  const v = shared(key);
  return Array.isArray(v) ? v.filter(k => typeof k === "string") : [];
}

/** @param {string} key @param {string} agent */
function toggle(key, agent) {
  const list = keys(key);
  setShared(key, list.includes(agent) ? list.filter(k => k !== agent) : [...list, agent]);
}

export default class NewMenu extends View {
  init(_props, cx) {
    this.agents = [];
    this.editing = false;
    this.handle = cx.focus_handle();
    this.handle.focus();
    cx.spawn(async cx => {
      try { this.agents = await knownAgents({ on: spaces().find(s => s.active)?.machine }); }
      catch { this.failed = true; }
      cx.notify();
    });
  }
  /** @param {any} hint */
  row(id, icon, name, action, hint = "", enabled = true, { close = true, dim = !enabled } = {}) {
    const t = theme();
    return h_flex().id(id).h(31).px(9).gap(10).rounded(7).items_center().flex_none()
      .text_color(dim ? t.dim : t.foreground).when(enabled, el => el.hover(s => s.bg(t.selected)))
      .on_click((_e, cx) => {
        if (!enabled) return;
        if (close) closeOverlay(props().overlay);
        action(cx);
      })
      .child(icon).child(div().flex_1().child(name)).child(div().text_size(11).text_color(t.dim).child(hint));
  }
  // Edit mode: the row itself doesn't click; its pin and eye buttons do.
  editRow(a, icon, pinned, hidden) {
    const t = theme();
    const button = (id, file, on, action) => div().id(id).size(22).rounded(5).flex().items_center().justify_center()
      .hover(s => s.bg(t.selected)).on_click(() => action())
      .child(svg(`${DIR}/${file}`).size(13).text_color(on ? t.foreground : t.dim));
    return h_flex().id(a.key).h(31).pl(9).pr(4).gap(10).rounded(7).items_center().flex_none()
      .text_color(hidden ? t.dim : t.foreground)
      .child(icon).child(div().flex_1().child(a.name))
      .child(button(`pin-${a.key}`, "pin.svg", pinned, () => toggle(PINNED, a.key)))
      .child(button(`eye-${a.key}`, hidden ? "eye-off.svg" : "eye.svg", !hidden, () => toggle(HIDDEN, a.key)));
  }
  render() {
    const t = theme();
    const space = spaces().find(s => s.active);
    const hidden = new Set(keys(HIDDEN));
    const pinned = keys(PINNED);
    const rank = a => { const i = pinned.indexOf(a.key); return i < 0 ? pinned.length : i; };
    const ordered = [...this.agents].sort((a, b) => rank(a) - rank(b));
    const installed = ordered.filter(a => a.installed && !hidden.has(a.key));
    const choices = this.editing ? ordered : [...installed, ...ordered.filter(a => !a.installed && !hidden.has(a.key)).slice(0, 2)];
    const mod = window()?.platform === "macos" ? "⌘" : "Ctrl";
    const icon = a => a.tint ? svg(a.icon).size(14).text_color(t.foreground) : image(a.icon).size(14);
    const agentRow = (a, i) => this.editing
      ? this.editRow(a, icon(a), pinned.includes(a.key), hidden.has(a.key))
      : this.row(a.key, icon(a), a.name, () => run("tab.new", { name: a.name, space: space?.id, argv: a.run }),
        a.installed ? (i < 9 ? `${mod} ${i + 1}` : "") : "not installed", a.installed);
    return v_flex().min_h(0).w_full().h(Math.min(491, 198 + Math.max(1, choices.length) * 31)).bg(t.popover).p(5).text_size(12.8)
      .id("new-menu").track_focus(this.handle)
      .on_key_down((e) => {
        if (!e.modifiers.control && !e.modifiers.platform) return;
        const agent = /^[1-9]$/.test(e.key) ? installed[Number(e.key) - 1] : null;
        if (!agent && e.key !== "t" && e.key !== "n") return;
        closeOverlay(props().overlay);
        if (agent) run("tab.new", { name: agent.name, space: space?.id, argv: agent.run });
        else if (e.key === "t") run("tab.new", { space: space?.id });
        else run("space.new");
      })
      .child(this.row("terminal", svg("icons/shell.svg").size(14), "Terminal", () => run("tab.new", { space: space?.id }), `${mod} T`))
      .child(div().px(9).pt(8).pb(4).text_size(11).text_color(t.dim).child(this.editing ? "Pin to top · show or hide" : "Start an agent"))
      .child(v_flex().flex_1().min_h(0).overflow_y_scrollbar()
        .children(choices.map(agentRow))
        .when(this.agents.length === 0, el => el.child(div().px(9).py(6).text_color(t.dim).child(this.failed ? "Could not load agents" : "Checking installed agents…"))))
      .child(this.row("edit-agents", svg(`${DIR}/${this.editing ? "check.svg" : "settings.svg"}`).size(14).text_color(t.dim),
        this.editing ? "Done" : "Edit agents\u2026", (cx) => { this.editing = !this.editing; cx.notify(); },
        this.editing || hidden.size === 0 ? "" : `${hidden.size} hidden`, this.agents.length > 0, { close: false, dim: true }))
      .child(div().h(1).mx(4).my(5).bg(t.border))
      .child(this.row("space", div().w(14).child("+"), "New space", () => run("space.new"), `${mod} N`))
      .child(this.row("worktree", svg("mods/workspace-chrome/branch.svg").size(14), "New worktree…", () => openOverlay({ mod: "worktree", kind: "dialog", width: 460, height: 280, props: { space: space?.id, folder: panes().find(p => p.focused)?.cwd, action: "new" } }), "", Boolean(space)))
      .child(this.row("worktree-open", svg("mods/workspace-chrome/branch.svg").size(14), "Open worktree\u2026", () => openOverlay({ mod: "worktree", kind: "dialog", width: 560, height: 480, props: { space: space?.id, folder: panes().find(p => p.focused)?.cwd, action: "open" } }), "", Boolean(space)));
  }
}
