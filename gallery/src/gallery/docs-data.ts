/**
 * Typed access to src/generated/docs.json, which scripts/gen-docs.mjs writes
 * from the components (predev, prebuild and verify run it). Never edit the JSON.
 */
import data from "../generated/docs.json";

export type PropDoc = {
  name: string;
  /** The printed type, for example `"primary" | "secondary" | "ghost"`, `ReactNode`, `() => void`. */
  type: string;
  required: boolean;
  /** Source text of the destructuring default in the signature, for example `"secondary"` or `false`. */
  default?: string;
  /** The JSDoc text of the prop, if it has one. */
  description?: string;
};

export type ExportDoc = {
  name: string;
  /** "function" is any other exported camelCase function, for example `toast()`. */
  kind: "component" | "hook" | "function";
  /** Props declared in our own source. For a hook or function, its parameters (an options object is followed by `options.x` rows). */
  props: PropDoc[];
  /** A note when the props also take a DOM or library type, for example "Every <button> attribute". */
  extends?: string;
  /** The JSDoc on the export itself, if any. */
  description?: string;
};

export type ComponentDoc = {
  /** The file name without its extension: "button". */
  stem: string;
  /** Repo-relative: "gallery/src/components/button.tsx". */
  file: string;
  /** Components, hooks and functions, in source order. */
  exports: ExportDoc[];
  /** Repo-relative local files needed to copy the component: itself plus its "@/…" and "./…" imports. */
  files: string[];
  /** npm packages those files import, by package name, sorted. */
  packages: string[];
};

const docs = data as unknown as Record<string, ComponentDoc>;

export function componentDoc(stem: string): ComponentDoc {
  const doc = docs[stem];
  if (!doc) {
    throw new Error(`No generated docs for "${stem}". scripts/gen-docs.mjs reads src/components/${stem}.tsx; check the stem, then run \`npm run gen:docs\`.`);
  }
  return doc;
}

/** Every documented export across the components, in file order. */
export function allExports(): ExportDoc[] {
  return Object.values(docs).flatMap((d) => d.exports);
}
