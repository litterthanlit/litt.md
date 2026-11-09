/** Press's scenes (scene.ts): a placeholder until the scenes are built. */
import { Button } from "@/components/button";
import type { SystemScenes } from "./scene";

function First() {
  return (
    <div className="grid gap-3">
      <p className="text-small text-fg">A Press scene.</p>
      <Button variant="secondary">Open</Button>
    </div>
  );
}

export const press: SystemScenes = {
  scenes: [{ id: "first", title: "First scene", line: "A placeholder.", Render: First }],
  cover: "first",
};
