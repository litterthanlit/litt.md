/**
 * Device Room prototype (plans/026, Phase 1a — First-person portal & walk-into-the-room):
 *
 * You stand outside a framed architectural doorway looking straight into Device's lab room (doorframe, left/right
 * aluminium walls, ceiling light fixture, perspective floor, and the live CNC-extruded Device console mounted on the
 * back wall). Scroll over the portal, click the room, or scrub Walk to dolly the camera forward along +Z right
 * through the doorway until you stand flush in front of the console — where it clears to `transform: none` for
 * razor-sharp 2D text. Subtle first-person mouse-look parallax lets you peer inside while standing at the doorway.
 *
 * Every control (Slider + Switch + LCD) stays live at any walk depth via `plane.ts`'s full-chain inverse matrix
 * projection and Device's Web Audio voices (`sound.ts` PlayOptions.root).
 */
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { animate, useReducedMotion } from "motion/react";
import { lookAttributes } from "@/gallery/look";
import { MaterialProvider, useTransition } from "@/motion";
import { LIMITS, shapeSurface } from "@/motion/rules";
import { SoundProvider, useSound } from "@/motion/sound";
import { projectClientToElement } from "./plane";
import "./device-room.css";

const TRACK_PAD = 18; // px from track edge to cap center at 0% and 100%
const NOTCHES = Array.from({ length: 11 }, (_, i) => i * 10);
const SLICES = [1 / 7, 2 / 7, 3 / 7, 4 / 7, 5 / 7, 6 / 7, 1];

const CAM_OUT = -60; // z at doorway (walk = 0)
const CAM_IN = 460; // z flush with back wall (walk = 1)
const DOOR_PASS_Z = 140; // hide doorway jambs once they sweep past viewport edges

/* #canvas runs in Flat, which sets Pill radii on <html>. Restate Device's own control/surface corners on each frame. */
const DEVICE_OWN = {
  "--radius-control": `${LIMITS.control}px`,
  "--radius-surface": `${shapeSurface(LIMITS.control)}px`,
} as CSSProperties;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

type RoomParams = {
  walkTarget: number; // 0 (doorway) .. 1 (flush inside)
  exploded: boolean;
  depth: number;
  explodeStep: number;
  onWalkChange: (next: number) => void;
};

type DeviceRoomModuleProps = RoomParams & {
  dark: boolean;
};

function DeviceRoomModule({
  dark,
  walkTarget,
  exploded,
  depth,
  explodeStep,
  onWalkChange,
}: DeviceRoomModuleProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const doorwayRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderLabelId = useId();
  const switchLabelId = useId();

  const { play } = useSound();
  const reduced = useReducedMotion();
  const expressive = useTransition("expressive");

  const [gain, setGain] = useState(64);
  const [armed, setArmed] = useState(true);
  const [held, setHeld] = useState(false);
  const [keyPressed, setKeyPressed] = useState(false);
  const [settledInside, setSettledInside] = useState(walkTarget >= 0.999);
  const dragPointer = useRef<number | null>(null);
  const lastBucket = useRef(Math.floor(64 / 10));

  /* Imperative camera & mouse-look refs so spring frames never trigger React re-renders. */
  const walkRef = useRef(walkTarget);
  const lookTargetRef = useRef({ x: 0, y: 0 });
  const lookCurrentRef = useRef({ x: 0, y: 0 });
  const walkTargetRef = useRef(walkTarget);
  walkTargetRef.current = walkTarget;

  const isReducedMotion = useCallback(
    () =>
      Boolean(reduced) ||
      (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) ||
      ("duration" in expressive && expressive.duration === 0),
    [reduced, expressive],
  );

  const writeCamera = useCallback((w: number, lookX: number, lookY: number) => {
    const cam = cameraRef.current;
    if (!cam) return;
    const z = CAM_OUT + (CAM_IN - CAM_OUT) * w;
    const dampen = Math.max(0, 1 - w);
    cam.style.setProperty("--dr-cam-z", `${z.toFixed(2)}px`);
    cam.style.setProperty("--dr-look-x", `${(lookX * dampen).toFixed(3)}deg`);
    cam.style.setProperty("--dr-look-y", `${(lookY * dampen).toFixed(3)}deg`);
    if (doorwayRef.current) {
      doorwayRef.current.dataset.passed = z >= DOOR_PASS_Z ? "true" : "false";
    }
  }, []);

  /* Smoothly animate camera Z when walkTarget changes; clear to transform:none once settled at 100% inside. */
  useEffect(() => {
    const wantsInside = walkTarget >= 0.999 && !exploded;
    if (isReducedMotion()) {
      walkRef.current = walkTarget;
      lookCurrentRef.current = { x: 0, y: 0 };
      writeCamera(walkTarget, 0, 0);
      setSettledInside(wantsInside);
      return;
    }
    if (!wantsInside) {
      setSettledInside(false);
    }
    const ctrl = animate(walkRef.current * 100, walkTarget * 100, {
      ...expressive,
      restDelta: 0.15,
      restSpeed: 0.5,
      onUpdate: (v) => {
        const w = v / 100;
        walkRef.current = w;
        writeCamera(w, lookCurrentRef.current.x, lookCurrentRef.current.y);
      },
      onComplete: () => {
        walkRef.current = walkTarget;
        if (wantsInside) {
          lookCurrentRef.current = { x: 0, y: 0 };
          writeCamera(1, 0, 0);
          setSettledInside(true);
        } else {
          writeCamera(walkTarget, lookCurrentRef.current.x, lookCurrentRef.current.y);
        }
      },
    });
    return () => ctrl.stop();
  }, [walkTarget, exploded, expressive, isReducedMotion, writeCamera]);

  /* Gentle mouse-look parallax smoothing while outside the console (paused when settled inside or reduced motion). */
  useEffect(() => {
    if (settledInside) return;
    let raf = 0;
    const step = () => {
      raf = 0;
      if (isReducedMotion()) return;
      const cur = lookCurrentRef.current;
      const tgt = lookTargetRef.current;
      const dx = tgt.x - cur.x;
      const dy = tgt.y - cur.y;
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        cur.x += dx * 0.14;
        cur.y += dy * 0.14;
        writeCamera(walkRef.current, cur.x, cur.y);
        raf = requestAnimationFrame(step);
      }
    };
    const portal = portalRef.current;
    if (!portal) return;
    const onMove = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== "mouse" || isReducedMotion()) return;
      const r = portal.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      const ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      lookTargetRef.current = { x: -ny * 3.5, y: nx * 5.5 };
      if (!raf) raf = requestAnimationFrame(step);
    };
    const onLeave = () => {
      lookTargetRef.current = { x: 0, y: 0 };
      if (!raf) raf = requestAnimationFrame(step);
    };
    portal.addEventListener("pointermove", onMove);
    portal.addEventListener("pointerleave", onLeave);
    return () => {
      portal.removeEventListener("pointermove", onMove);
      portal.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [settledInside, isReducedMotion, writeCamera]);

  /* Scroll over the portal walks forward/backward smoothly along Z (Ctrl/⌘ + wheel passes through to #canvas zoom). */
  useEffect(() => {
    const portal = portalRef.current;
    if (!portal) return;
    const onWheel = (e: globalThis.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      e.stopPropagation();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const dy = e.deltaY * unit;
      /* Scrolling down / forward walks into the room; scrolling up / back walks out toward the doorway. */
      const next = clamp(walkTargetRef.current + dy / 520, 0, 1);
      onWalkChange(Math.round(next * 100) / 100);
    };
    portal.addEventListener("wheel", onWheel, { passive: false });
    return () => portal.removeEventListener("wheel", onWheel);
  }, [onWalkChange]);

  const updateGain = useCallback(
    (next: number, playNotch: boolean) => {
      const clamped = clamp(Math.round(next), 0, 100);
      setGain(clamped);
      const bucket = Math.floor(clamped / 10);
      if (playNotch && bucket !== lastBucket.current) {
        play("notch", { root: frameRef.current, pitch: 0.9 + (clamped / 100) * 0.2 });
      }
      lastBucket.current = bucket;
    },
    [play],
  );

  const projectToGain = useCallback((clientX: number, clientY: number): number | null => {
    const track = trackRef.current;
    if (!track) return null;
    const pt = projectClientToElement(track, clientX, clientY);
    if (!pt) return null;
    const usable = track.clientWidth - TRACK_PAD * 2;
    if (usable <= 0) return null;
    const p = clamp((pt.u - TRACK_PAD) / usable, 0, 1);
    return p * 100;
  }, []);

  const onTrackPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragPointer.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
    sliderRef.current?.focus({ preventScroll: true });
    setHeld(true);
    play("key-down", { root: frameRef.current });
    const next = projectToGain(e.clientX, e.clientY);
    if (next !== null) updateGain(next, true);
  };

  const onTrackPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragPointer.current !== e.pointerId) return;
    const next = projectToGain(e.clientX, e.clientY);
    if (next !== null) updateGain(next, true);
  };

  const endTrackDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (dragPointer.current !== e.pointerId) return;
    dragPointer.current = null;
    setHeld(false);
    play("key-up", { root: frameRef.current });
  };

  const onSliderKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = gain + step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = gain - step;
    else if (e.key === "PageUp") next = gain + 10;
    else if (e.key === "PageDown") next = gain - 10;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 100;
    if (next === null) return;
    e.preventDefault();
    e.stopPropagation();
    updateGain(next, true);
  };

  const onModuleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    /* Escape walks back out to the doorway only while focus is inside this module (never a window listener). */
    if (e.key === "Escape" && walkTarget > 0) {
      e.preventDefault();
      e.stopPropagation();
      onWalkChange(0);
    }
  };

  const onPortalBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    /* Clicking empty room/doorway space while standing outside walks straight into the room. */
    if (walkTarget >= 0.85) return;
    const target = e.target as Element | null;
    if (target?.closest('[role="slider"], [role="switch"], button, .dr-slider-track')) return;
    onWalkChange(1);
  };

  const toggleArmed = () => {
    setArmed((prev) => !prev);
    play("switch", { root: frameRef.current });
  };

  const activeExplode = exploded && !settledInside ? explodeStep : 0;
  const formattedGain = String(gain).padStart(3, "0");
  const statusWord = armed ? "ARMED" : "STANDBY";
  const walkPct = Math.round(walkTarget * 100);

  const consoleVars = {
    "--dr-depth": `${depth}px`,
    "--dr-explode": `${activeExplode}px`,
    "--dr-cap-lift": `${Math.max(4, Math.round(depth * 0.45))}px`,
    "--dr-key-lift": `${Math.max(3, Math.round(depth * 0.35))}px`,
  } as CSSProperties;

  const switchVars = {
    "--dr-sw-x": armed ? "26px" : "0px",
  } as CSSProperties;

  const capLeft = `calc(${TRACK_PAD}px + (100% - ${TRACK_PAD * 2}px) * ${gain / 100})`;

  return (
    <div
      ref={frameRef}
      {...lookAttributes({ accent: "world", material: "device" }, dark)}
      style={DEVICE_OWN}
      onKeyDown={onModuleKeyDown}
      className="grid gap-4 rounded-surface bg-canvas p-6 text-fg"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-caption font-label tracking-(--label-tracking) uppercase text-fg-subtle">
          {dark ? "Room 01 · Device Dark" : "Room 01 · Device Light"}
        </span>
        <span className="text-caption tabular-nums text-fg-subtle">
          {settledInside
            ? "Inside · 100% · transform: none"
            : walkPct === 0
              ? "Doorway · scroll or click to walk in"
              : `Walking in · ${walkPct}%`}
        </span>
      </div>

      {/* First-person 3D Portal Viewport */}
      <div
        ref={portalRef}
        className="dr-portal"
        data-settled-inside={settledInside ? "true" : "false"}
        onClick={onPortalBackgroundClick}
      >
        <div
          ref={cameraRef}
          className="dr-camera"
          data-settled-inside={settledInside ? "true" : "false"}
        >
          {/* Architectural room interior (hidden cleanly when settled 100% flat inside) */}
          <div aria-hidden="true" className="dr-arch dr-wall dr-wall-left" />
          <div aria-hidden="true" className="dr-arch dr-wall dr-wall-right" />
          <div aria-hidden="true" className="dr-arch dr-wall dr-wall-ceiling">
            <div className="dr-ceiling-fixture" />
          </div>
          <div aria-hidden="true" className="dr-arch dr-wall dr-wall-floor" />

          {/* Back wall (z = -460) holding the live, wall-mounted Device console */}
          <div className="dr-back-wall">
            <div data-part="frame" className="dr-chassis" style={consoleVars}>
              <div aria-hidden="true" className="dr-wall-shadow" />
              {SLICES.map((t, idx) => (
                <div
                  key={idx}
                  aria-hidden="true"
                  className="dr-slice"
                  style={{ "--dr-slice-t": t, "--dr-slice-shade": Math.round(10 + t * 26) } as CSSProperties}
                />
              ))}

              {/* Stratum 1: Brushed aluminium plate */}
              <div data-part="plate" className="dr-plate">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption font-label tracking-(--label-tracking) uppercase text-fg-muted">
                    CH-01 · GAIN
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-caption font-label tracking-(--label-tracking) uppercase text-fg-subtle">
                    <span aria-hidden="true" data-part="light" className="dr-lamp" data-lit={armed ? "true" : "false"} />
                    {statusWord}
                  </span>
                </div>

                {/* Stratum 3: Dark LCD glass behind bezel */}
                <div data-part="bezel" className="dr-lcd-bezel">
                  <div data-part="lcd" className="dr-lcd-glass" aria-live="polite">
                    <div className="grid gap-0.5">
                      <span className="text-caption tracking-(--label-tracking) uppercase text-(--field-ink-subtle)">
                        OUTPUT LEVEL
                      </span>
                      <span className="text-figure font-title tabular-nums">
                        {formattedGain}%
                      </span>
                    </div>
                    <span
                      data-part="chip"
                      className="rounded-control bg-(--chip) px-2 py-1 text-caption font-label tracking-(--label-tracking) uppercase text-(--chip-ink)"
                    >
                      {armed ? "LIVE" : "SAFE"}
                    </span>
                  </div>
                </div>

                {/* Stratum 2 + 4: Recessed fader slot + raised physical cap */}
                <div className="dr-stratum-well grid gap-2">
                  <div className="flex items-center justify-between text-caption font-label tracking-(--label-tracking) uppercase text-fg-subtle">
                    <span id={sliderLabelId}>FADER</span>
                    <span className="tabular-nums text-fg-muted">{formattedGain} / 100</span>
                  </div>
                  <div
                    ref={trackRef}
                    className="dr-slider-track"
                    data-held={held ? "true" : "false"}
                    onPointerDown={onTrackPointerDown}
                    onPointerMove={onTrackPointerMove}
                    onPointerUp={endTrackDrag}
                    onPointerCancel={endTrackDrag}
                    onLostPointerCapture={endTrackDrag}
                  >
                    <span aria-hidden="true" data-part="slot" className="dr-slot">
                      <span className="dr-slot-fill" style={{ width: `${gain}%` }} />
                    </span>
                    {NOTCHES.map((n) => (
                      <span
                        key={n}
                        aria-hidden="true"
                        className="dr-tick"
                        data-major={n === 0 || n === 50 || n === 100 ? "true" : "false"}
                        style={{ left: `calc(${TRACK_PAD}px + (100% - ${TRACK_PAD * 2}px) * ${n / 100})` }}
                      />
                    ))}
                    <div
                      ref={sliderRef}
                      role="slider"
                      tabIndex={0}
                      aria-labelledby={sliderLabelId}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={gain}
                      aria-valuetext={`${gain} percent`}
                      data-part="cap"
                      data-held={held ? "true" : "false"}
                      onKeyDown={onSliderKeyDown}
                      className="dr-cap-wrap"
                      style={{ left: capLeft }}
                    >
                      <span aria-hidden="true" className="dr-cap-skirt" style={{ "--dr-cap-skirt-z": "-2px" } as CSSProperties} />
                      <span aria-hidden="true" className="dr-cap-skirt" style={{ "--dr-cap-skirt-z": "-4px" } as CSSProperties} />
                      <span className="dr-cap-face">
                        <span aria-hidden="true" className="dr-cap-grip" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stratum 2 + 4: Recessed Switch well + raised toggle key */}
                <div className="dr-stratum-well flex items-center justify-between gap-3 pt-1">
                  <div className="grid gap-0.5">
                    <span id={switchLabelId} className="text-caption font-label tracking-(--label-tracking) uppercase text-fg-muted">
                      BUS ARM
                    </span>
                    <span className="text-caption text-fg-subtle">
                      {armed ? "Routing active" : "Output muted"}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={armed}
                    aria-labelledby={switchLabelId}
                    data-part="well"
                    className="dr-switch-btn"
                    onPointerDown={() => {
                      setKeyPressed(true);
                      play("key-down", { root: frameRef.current });
                    }}
                    onPointerUp={() => setKeyPressed(false)}
                    onPointerLeave={() => setKeyPressed(false)}
                    onPointerCancel={() => setKeyPressed(false)}
                    onClick={toggleArmed}
                  >
                    <span
                      aria-hidden="true"
                      data-part="key"
                      data-pressed={keyPressed ? "true" : "false"}
                      className="dr-switch-key"
                      style={switchVars}
                    >
                      <span className="dr-key-skirt" />
                      <span className="h-3 w-px bg-[color-mix(in_oklab,var(--fg)_28%,transparent)]" />
                      <span className="h-3 w-px bg-[color-mix(in_oklab,var(--fg)_28%,transparent)]" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Foreground architectural doorway surround (z = 0) — sweeps past the camera as you walk in */}
          <div ref={doorwayRef} aria-hidden="true" className="dr-arch dr-doorway" data-passed="false">
            <div className="dr-door-jamb dr-door-top">
              <span className="text-caption font-label tracking-(--label-tracking) uppercase text-fg-muted">
                ROOM 01 · DEVICE LAB
              </span>
              <span className="text-caption font-label tracking-(--label-tracking) uppercase text-fg-subtle">
                {statusWord} · {formattedGain}%
              </span>
            </div>
            <div className="dr-door-jamb dr-door-left" />
            <div className="dr-door-jamb dr-door-right" />
            <div className="dr-door-jamb dr-door-bottom" />
          </div>
        </div>
      </div>

      {/* Sibling 2D reference at native transform:none for crispness checks at 100% zoom (0 key) */}
      <div className="flex items-center justify-between gap-4 rounded-surface bg-surface-1 px-4 py-3 shadow-[inset_0_0_0_1px_var(--line)]">
        <div className="grid gap-0.5">
          <span className="text-caption font-label tracking-(--label-tracking) uppercase text-fg-subtle">
            2D reference · native transform: none
          </span>
          <span className="text-caption text-fg-muted">
            CH-01 · GAIN · compare once walked 100% inside (0 key)
          </span>
        </div>
        <div className="inline-flex items-center gap-3 rounded-control bg-field px-3 py-1.5 font-field text-fg shadow-(--field-shade)">
          <span className="text-body font-title tabular-nums text-(--field-ink)">{formattedGain}%</span>
          <span className="text-caption font-label tracking-(--label-tracking) uppercase text-(--field-ink-subtle)">
            {statusWord}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Top-level `#canvas` item for Plan 026 Phase 1a:
 * - First-person doorway portal into Device's room (Light & Dark)
 * - Scroll or click to walk forward/back along Z, with subtle mouse-look parallax
 * - Strictly 3 room sliders (Walk depth, Extrusion, Explode spacing) + quick depth buttons
 */
export function DeviceRoomPreview() {
  const [walkTarget, setWalkTarget] = useState(0);
  const [exploded, setExploded] = useState(false);
  const [depth, setDepth] = useState(14);
  const [explodeStep, setExplodeStep] = useState(20);
  const [muted, setMuted] = useState(false);

  const walkId = useId();
  const depthId = useId();
  const explodeId = useId();

  const btnBase =
    "h-8 cursor-pointer rounded-control px-3 text-caption font-label transition-[background-color,color,box-shadow] duration-(--dur-instant) ease-litt " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
  const btnIdle = "bg-surface-2 text-fg-muted shadow-[inset_0_0_0_1px_var(--line)] hover:text-fg";
  const btnOn = "bg-fg text-canvas";

  const walkPct = Math.round(walkTarget * 100);

  return (
    <div className="grid gap-6">
      {/* Compact header bar: doorway/walk-in controls + strictly 3 room sliders */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-surface bg-surface-2 p-4 shadow-[inset_0_0_0_1px_var(--line)]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={walkPct === 0}
            onClick={() => setWalkTarget(0)}
            className={`${btnBase} ${walkPct === 0 ? btnOn : btnIdle}`}
          >
            Doorway
          </button>
          <button
            type="button"
            aria-pressed={walkPct > 0 && walkPct < 100}
            onClick={() => setWalkTarget(0.55)}
            className={`${btnBase} ${walkPct > 0 && walkPct < 100 ? btnOn : btnIdle}`}
          >
            Mid-room
          </button>
          <button
            type="button"
            aria-pressed={walkPct === 100}
            onClick={() => {
              setExploded(false);
              setWalkTarget(1);
            }}
            className={`${btnBase} ${walkPct === 100 ? btnOn : btnIdle}`}
          >
            Walk in (2D)
          </button>
          <button
            type="button"
            aria-pressed={exploded}
            onClick={() => {
              setExploded((e) => {
                const next = !e;
                if (next && walkTarget >= 0.99) setWalkTarget(0.55);
                return next;
              });
            }}
            className={`${btnBase} ${exploded ? btnOn : btnIdle}`}
          >
            Explode
          </button>
          <button
            type="button"
            aria-pressed={!muted}
            onClick={() => setMuted((m) => !m)}
            className={`${btnBase} ${!muted ? btnIdle : btnOn}`}
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label htmlFor={walkId} className="flex items-center gap-2 text-caption text-fg-muted">
            <span className="font-label">Walk</span>
            <input
              id={walkId}
              type="range"
              min={0}
              max={100}
              step={1}
              value={walkPct}
              onChange={(e) => setWalkTarget(Number(e.target.value) / 100)}
              className="w-28 accent-fg"
            />
            <span className="w-9 tabular-nums text-fg-subtle">{walkPct}%</span>
          </label>
          <label htmlFor={depthId} className="flex items-center gap-2 text-caption text-fg-muted">
            <span className="font-label">Extrusion</span>
            <input
              id={depthId}
              type="range"
              min={4}
              max={24}
              step={1}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-24 accent-fg"
            />
            <span className="w-9 tabular-nums text-fg-subtle">{depth}px</span>
          </label>
          <label htmlFor={explodeId} className="flex items-center gap-2 text-caption text-fg-muted">
            <span className="font-label">Explode</span>
            <input
              id={explodeId}
              type="range"
              min={8}
              max={28}
              step={1}
              value={explodeStep}
              onChange={(e) => setExplodeStep(Number(e.target.value))}
              className="w-24 accent-fg"
            />
            <span className="w-9 tabular-nums text-fg-subtle">{explodeStep}px</span>
          </label>
        </div>
      </div>

      {/* Paired Light & Dark Device portals */}
      <MaterialProvider material="device">
        <SoundProvider muted={muted}>
          <div className="grid gap-6 lg:grid-cols-2">
            <DeviceRoomModule
              dark={false}
              walkTarget={walkTarget}
              exploded={exploded}
              depth={depth}
              explodeStep={explodeStep}
              onWalkChange={setWalkTarget}
            />
            <DeviceRoomModule
              dark={true}
              walkTarget={walkTarget}
              exploded={exploded}
              depth={depth}
              explodeStep={explodeStep}
              onWalkChange={setWalkTarget}
            />
          </div>
        </SoundProvider>
      </MaterialProvider>
    </div>
  );
}
