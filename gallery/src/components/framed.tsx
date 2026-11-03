/**
 * Framed: whether a whole screen stands alone or sits inside a page that already has its own main landmark and h1,
 * such as a preview in a docs site.
 *
 * - A block is written as the whole app: one <Main> and one <Heading level={1}>, its sections at level 2.
 * - Inside <Framed>, Main is a div and every Heading is one level lower (1 becomes 2, 2 becomes 3), so the host page
 *   keeps one main and one h1 and its outline never skips a level. Classes set the look, so nothing you see changes.
 * - Without a Framed above it nothing changes: a block in an app renders main and h1.
 */
import { createContext, useContext, type HTMLAttributes, type ReactNode } from "react";

const FramedContext = createContext(false);

/**
 * Marks what is inside as a screen shown within a page that owns the main landmark and the h1. Mount it around a
 * block's preview; an app that renders the block as its page leaves it out.
 */
export function Framed({
  children,
}: {
  /** The screen shown inside the page. */
  children: ReactNode;
}) {
  return <FramedContext value={true}>{children}</FramedContext>;
}

/** True inside a Framed. */
export function useFramed(): boolean {
  return useContext(FramedContext);
}

/** The screen's main landmark: a main, or a div inside a Framed. */
export function Main(props: HTMLAttributes<HTMLElement>) {
  const Tag = useFramed() ? "div" : "main";
  return <Tag {...props} />;
}

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  /** The level when the screen stands alone. Inside a Framed it renders one level lower. */
  level: 1 | 2 | 3 | 4 | 5;
};

const TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

/** A heading whose level follows the screen: as given when it stands alone, one lower inside a Framed. */
export function Heading({ level, ...props }: HeadingProps) {
  const Tag = TAGS[level - 1 + (useFramed() ? 1 : 0)];
  return <Tag {...props} />;
}
