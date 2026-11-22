/**
 * Device Room prototype (plans/026, Phase 1a): one compact machined Device module (Slider + Switch + LCD readout)
 * sitting in a live CSS 3D studio room on `#canvas`, with Step In (0° flat, transform:none on settle), Explode
 * (separating frame -> plate -> well/slot -> lcd -> cap/key along Z), true full-chain inverse-matrix drag (plane.ts),
 * Device Web Audio voices (sound.ts PlayOptions.root), and only the three room controls needed to judge the prototype
 * (tilt angle, Z-extrusion depth, explode spacing).
 *
 * Lives strictly in gallery/src/canvas/. Nothing in src/components, src/worlds or src/motion/hand.ts changes here.
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

/* #canvas runs in Flat, which sets Pill radii on <html>. Restate Device's own control/surface corners on each frame. */
const DEVICE_OWN = {
  "--radius-control": `${LIMITS.control}px`,
  "--radius-surface": `${shapeSurface(LIMITS.control)}px`,
} as CSSProperties;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

type RoomParams = {
  mode: "room" | "flat";
  exploded: boolean;
  tilt: number;
  depth: number;
  explodeStep: number;
  muted: boolean;
};

type DeviceRoomFrameProps = RoomParams & {
  dark: boolean;
  onExitFlat: () => void;
};

function DeviceRoomModule({
  dark,
  mode,
  exploded,
  tilt,
  depth,
  explodeStep,
  onExitFlat,
}: Omit<DeviceRoomFrameProps, "muted">) {
  const frameRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
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
  const [settledFlat, setSettledFlat] = useState(mode === "flat");
  const dragPointer = useRef<number | null>(null);
  const lastBucket = useRef(Math.floor(64 / 10));
  const progressRef = useRef(mode === "room" ? 1 : 0);

  /* Apply tilt angles directly to the rig CSS vars so the spring never triggers per-frame React renders. */
  const writeTilt = useCallback(
    (progress: number, tiltDeg: number) => {
      const rig = rigRef.current;
      if (!rig) return;
      rig.style.setProperty("--dr-tilt-x", `${(tiltDeg * progress).toFixed(3)}deg`);
      rig.style.setProperty("--dr-tilt-z", `${(-tiltDeg * 0.62 * progress).toFixed(3)}deg`);
    },
    [],
  );

  /* Animate Room <-> Step In on the expressive spring, then clear to transform:none once settled flat. */
  useEffect(() => {
    const target = mode === "room" ? 1 : 0;
    const prefersReduced =
      Boolean(reduced) ||
      (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) ||
      ("duration" in expressive && expressive.duration === 0);
    if (prefersReduced) {
      progressRef.current = target;
      writeTilt(target, tilt);
      setSettledFlat(mode === "flat");
      return;
    }
    if (mode === "room") {
      setSettledFlat(false);
    }
    const ctrl = animate(progressRef.current, target, {
      ...expressive,
      onUpdate: (v) => {
        progressRef.current = v;
        writeTilt(v, tilt);
      },
      onComplete: () => {
        progressRef.current = target;
        writeTilt(target, tilt);
        if (mode === "flat") setSettledFlat(true);
      },
    });
    return () => ctrl.stop();
  }, [mode, reduced, expressive, tilt, writeTilt]);

  /* Live updates to the Tilt slider while in Room mode update the rig immediately. */
  useEffect(() => {
    if (mode === "room" && !settledFlat) writeTilt(progressRef.current, tilt);
  }, [tilt, mode, settledFlat, writeTilt]);

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
    /* Escape leaves Step In only while focus is inside this module (never a window-level listener). */
    if (e.key === "Escape" && mode === "flat") {
      e.preventDefault();
      e.stopPropagation();
      onExitFlat();
    }
  };

  const toggleArmed = () => {
    setArmed((prev) => !prev);
    play("switch", { root: frameRef.current });
  };

  const isFlat = mode === "flat";
  const activeExplode = exploded && !settledFlat ? explodeStep : 0;
  const formattedGain = String(gain).padStart(3, "0");
  const statusWord = armed ? "ARMED" : "STANDBY";

  const rigVars = {
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
          {dark ? "Device · Dark" : "Device · Light"}
        </span>
        <span className="text-caption text-fg-subtle">
          {settledFlat ? "0° flat · transform: none" : isFlat ? "Stepping in…" : exploded ? `Room · ${tilt}° · Exploded` : `Room · ${tilt}°`}
        </span>
      </div>

      {/* 3D Perspective Stage */}
      <div className="dr-stage" data-settled-flat={settledFlat ? "true" : "false"}>
        <div
          ref={rigRef}
          className="dr-rig"
          data-flat={isFlat ? "true" : "false"}
          data-settled-flat={settledFlat ? "true" : "false"}
          style={rigVars}
        >
          {/* Grounded studio desk shadow */}
          <div aria-hidden="true" className="dr-plinth-shadow" />

          {/* Stratum 0: Machined outer chassis + laminated CNC extrusion */}
          <div data-part="frame" className="dr-chassis">
            {SLICES.map((t, idx) => (
              <div
                key={idx}
                aria-hidden="true"
                className="dr-slice"
                style={{ "--dr-slice-t": t, "--dr-slice-shade": Math.round(8 + t * 24) } as CSSProperties}
              />
            ))}

            {/* Stratum 1: Brushed aluminium face plate */}
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

              {/* Stratum 2: Recessed fader slot + raised physical cap (Stratum 4) */}
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
                  {/* Recessed slot (leaf overflow-hidden only) */}
                  <span aria-hidden="true" data-part="slot" className="dr-slot">
                    <span className="dr-slot-fill" style={{ width: `${gain}%` }} />
                  </span>
                  {/* Engraved detent ticks */}
                  {NOTCHES.map((n) => (
                    <span
                      key={n}
                      aria-hidden="true"
                      className="dr-tick"
                      data-major={n === 0 || n === 50 || n === 100 ? "true" : "false"}
                      style={{ left: `calc(${TRACK_PAD}px + (100% - ${TRACK_PAD * 2}px) * ${n / 100})` }}
                    />
                  ))}
                  {/* Physical raised cap — real role="slider" focusable control */}
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
      </div>

      {/* Sibling 2D reference at native transform:none for crispness checks at 100% zoom (0 key) */}
      <div className="flex items-center justify-between gap-4 rounded-surface bg-surface-1 px-4 py-3 shadow-[inset_0_0_0_1px_var(--line)]">
        <div className="grid gap-0.5">
          <span className="text-caption font-label tracking-(--label-tracking) uppercase text-fg-subtle">
            2D reference · native transform: none
          </span>
          <span className="text-caption text-fg-muted">
            CH-01 · GAIN · compare against Step in at 100% zoom (0 key)
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
 * - Explicit Room / Step in and Explode controls
 * - Strictly 3 room sliders (Tilt, Extrusion, Explode spacing)
 * - Paired Light and Dark Device frames, each properly scoped with MaterialProvider + lookAttributes
 */
export function DeviceRoomPreview() {
  const [mode, setMode] = useState<"room" | "flat">("room");
  const [exploded, setExploded] = useState(false);
  const [tilt, setTilt] = useState(38);
  const [depth, setDepth] = useState(14);
  const [explodeStep, setExplodeStep] = useState(20);
  const [muted, setMuted] = useState(false);

  const tiltId = useId();
  const depthId = useId();
  const explodeId = useId();

  const btnBase =
    "h-8 cursor-pointer rounded-control px-3 text-caption font-label transition-[background-color,color,box-shadow] duration-(--dur-instant) ease-litt " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
  const btnIdle = "bg-surface-2 text-fg-muted shadow-[inset_0_0_0_1px_var(--line)] hover:text-fg";
  const btnOn = "bg-fg text-canvas";

  return (
    <div className="grid gap-6">
      {/* Compact header bar: mode toggles + strictly 3 room controls (Tilt, Extrusion, Explode spacing) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-surface bg-surface-2 p-4 shadow-[inset_0_0_0_1px_var(--line)]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={mode === "room"}
            onClick={() => setMode("room")}
            className={`${btnBase} ${mode === "room" ? btnOn : btnIdle}`}
          >
            Room
          </button>
          <button
            type="button"
            aria-pressed={mode === "flat"}
            onClick={() => setMode("flat")}
            className={`${btnBase} ${mode === "flat" ? btnOn : btnIdle}`}
          >
            Step in (0°)
          </button>
          <button
            type="button"
            aria-pressed={exploded}
            onClick={() => setExploded((e) => !e)}
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
          <label htmlFor={tiltId} className="flex items-center gap-2 text-caption text-fg-muted">
            <span className="font-label">Tilt</span>
            <input
              id={tiltId}
              type="range"
              min={20}
              max={52}
              step={1}
              value={tilt}
              onChange={(e) => setTilt(Number(e.target.value))}
              className="w-24 accent-fg"
            />
            <span className="w-8 tabular-nums text-fg-subtle">{tilt}°</span>
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

      {/* Paired Light & Dark Device rooms */}
      <MaterialProvider material="device">
        <SoundProvider muted={muted}>
          <div className="grid gap-6 lg:grid-cols-2">
            <DeviceRoomModule
              dark={false}
              mode={mode}
              exploded={exploded}
              tilt={tilt}
              depth={depth}
              explodeStep={explodeStep}
              onExitFlat={() => setMode("room")}
            />
            <DeviceRoomModule
              dark={true}
              mode={mode}
              exploded={exploded}
              tilt={tilt}
              depth={depth}
              explodeStep={explodeStep}
              onExitFlat={() => setMode("room")}
            />
          </div>
        </SoundProvider>
      </MaterialProvider>
    </div>
  );
}
