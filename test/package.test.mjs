import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { validateDeclarativeWidgetRecipe } from "piphi-network-widget-sdk/declarative";

const source = JSON.parse(readFileSync(new URL("../package.source.json", import.meta.url), "utf8"));

test("package identity and integration linkage are stable", () => {
  assert.deepEqual(source.identity, {
    publisher_id: "io.piphi",
    package_id: "airthings-air-quality",
    version: "0.1.7",
  });
  assert.equal(source.owning_integration_id, "airthings-consumer-cloud-api");
  assert.ok(source.recommended_for_integrations.includes("airthings-consumer-cloud-api"));
  assert.equal(source.requires_integrations[0].integration_id, "airthings-consumer-cloud-api");
});

test("all 1 native recipes and theme assets pass the Widget SDK contract", () => {
  assert.equal(source.widgets.length, 1);
  for (const widget of source.widgets) {
    assert.equal(widget.runtime, "declarative");
    const diagnostics = validateDeclarativeWidgetRecipe(widget.recipe, {
      bindingSlotIds: widget.binding_slots.map((slot) => slot.id),
      settingIds: (widget.settings ?? []).map((setting) => setting.id),
    });
    assert.deepEqual(diagnostics, []);
    for (const theme of widget.themes ?? []) {
      assert.equal(existsSync(new URL(`../${theme.stylesheet}`, import.meta.url)), true);
    }
  }
});

test("the package is read-only and requests no browser or command permissions", () => {
  for (const widget of source.widgets) {
    assert.deepEqual(widget.permissions ?? [], []);
    assert.deepEqual(widget.allowed_commands ?? [], []);
    assert.ok(widget.binding_slots.every((slot) => slot.binding_modes.length === 1 && slot.binding_modes[0] === "read"));
  }
});
