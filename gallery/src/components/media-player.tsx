/**
 * Media player (components.md, "Media player"): sound or moving pictures that someone plays, such as a case study's
 * walkthrough, a launch film or a sound study. VideoPlayer is a Media frame with its controls in a bar under the
 * picture; AudioPlayer is the same bar under a title. Both sit on a raised card and run the native <video> and <audio>.
 *
 * - Never on its own: nothing autoplays, loops or plays muted in the background (foundations.md, Motion). It loads the
 *   file's metadata only, so the length shows before anyone presses play; preload="none" waits for the press, and
 *   `duration` gives the length until then. Starting one player pauses any other that is playing.
 * - Frame: Media's look inside the card's 4px: a fixed shape (16/9 by default), the control radius, still surface-2
 *   while it loads and an inset --line hairline over the picture. The poster is an image of its own, lazy, fading in
 *   on the instant tier as Media's does, with a round disc on it until the first play: a solid surface-1 with the
 *   secondary button's edge, so it reads on any picture, and the only thing that ever sits on one. A press anywhere on
 *   the picture plays and pauses.
 * - Controls under the picture, never over it: over it they would need a scrim and still fail contrast somewhere in
 *   the picture. So they never hide either. Play is a round secondary button and the rest are round ghosts, each only
 *   where it applies: Captions, Speed, Mute and Full screen. 32px on a fine pointer, 44px on a coarse one.
 * - Rail: the Slider's, 4px at the control radius on fg 12%, with what has loaded at fg 24% and what has played in
 *   --fg, never the accent (P1), under the Slider's 20px thumb. The elapsed time sits at its start and the length at
 *   its end, in the mono at the caption size in --fg-subtle, each as wide as the length, so the rail never shifts as
 *   the digits change. On a fine pointer the time under the pointer shows above it in the chart tooltip's look, and
 *   while dragging on any pointer. In a box under 28rem the rail takes a row of its own above the buttons.
 * - Motion: the playhead follows the media one to one, with no easing, painted on every frame while it plays and
 *   without a render (two CSS variables on the rail). Under reduced motion it steps as the time does, a few times a
 *   second. The time above the rail fades on the responsive tier and colors on the instant tier. Nothing else moves.
 * - Buffering: while the media waits for data, Play shows the Button's spinner in place of its mark and stays Pause,
 *   so it can still be pressed. The spinner is the one loop, because it is the loading signal.
 * - Ended: Play becomes Play again, with the retry mark, over the last frame. Failed: the frame keeps its size and says
 *   "Video didn't load" beside a mark in --fg-subtle, as Media's; Play and the rail are disabled, and the times and the
 *   other controls hidden.
 * - Captions: one WebVTT track. On, its cues show in a line under the picture at the small size in --fg, never on it,
 *   with two lines kept so the bar does not move between cues. The browser's own drawing over the picture stays off.
 *   The button is a toggle (aria-pressed) whose mark fills while they are on.
 * - Speed: with `rates`, a ghost button that says the speed ("1.5×") and steps to the next one on each press. A menu
 *   would open outside a full-screen player, where nobody could see it.
 * - Volume: Mute is a toggle whose mark is crossed while it is on. On a fine pointer in a wide box a 64px volume rail
 *   sits beside it; a touch screen has the device's own volume, which a page cannot set on iOS.
 * - Full screen (video only): the card fills the screen on --canvas, with the picture letterboxed and the bar under
 *   it. On an iPhone, which gives a page no full screen, the system's own player takes over.
 * - Keys, anywhere in the player: Space (when not on a button) and K play and pause, ← and → move 5 seconds, J and L
 *   10, Home and End go to the ends, M mutes, C turns the captions on and off, F is full screen, < and > change the
 *   speed. On the rail, the arrows move 5 seconds and Page Up and Page Down a tenth of the length.
 * - Accessibility: a group named by the label. The rail is a slider whose value text says the time in words
 *   ("1 minute 12 seconds of 3 minutes"), updated once a second, never on every frame. Every control is a real
 *   button with a name; the picture's own press is a shortcut for Play, not a second tab stop.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref, type RefObject, type SVGProps } from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import { Button, Spinner } from "@/components/button";
import { ExpandIcon, PauseIcon, PlayIcon, RetryIcon, ShrinkIcon } from "@/components/icons";
import { useDevice, useMotionDial } from "@/motion";

/** One file of the same recording. List the same video or sound in several formats and the browser plays the first it can. */
export type MediaFile = {
  /** The file's address. */
  src: string;
  /** Its type, such as "video/webm" or "audio/mpeg", so the browser skips a format it cannot play without fetching it. */
  type: string;
};

/** A WebVTT file of captions for what is heard: speech, and the sounds that matter. */
export type MediaCaptions = {
  /** The .vtt file's address. */
  src: string;
  /** The language of the cues, such as "en". */
  lang: string;
  /** What the track is called, such as "English". */
  label?: string;
};

/** The frame's shapes: Media's, less auto, because a video's frame has to hold its shape before the file says its size. */
export type VideoRatio = "16/9" | "8/5" | "4/3" | "1/1" | "4/5";

type Shared = {
  /** The file, or the same recording in several formats, best first. */
  src: string | MediaFile[];
  /** Captions for what is heard. With them the bar gets a Captions button and the cues show under the picture. */
  captions?: MediaCaptions;
  /** Turns the captions on from the start. Off by default; the button turns them on and off. */
  defaultCaptions?: boolean;
  /** The speeds the Speed button steps through, such as [1, 1.5, 2]. Leave it out for no Speed button. Keep it to three or four. */
  rates?: number[];
  /** metadata loads the length before anyone presses play; none waits for the press. Pass duration with none. */
  preload?: "metadata" | "none";
  /** The length in seconds, shown until the file says it, such as with preload="none". */
  duration?: number;
  /** For a file on another origin that needs CORS, such as captions served from a CDN. */
  crossOrigin?: "anonymous" | "use-credentials";
  /** Called with true when it starts playing and false when it pauses or ends. */
  onPlayingChange?: (playing: boolean) => void;
  /** Called once when it plays to the end. */
  onEnded?: () => void;
  /** Extra classes for the outermost element, such as a width. */
  className?: string;
};

export type VideoPlayerProps = Shared & {
  /** Names the player for screen readers, in a few words: "The Halo walkthrough". It is not shown. */
  label: string;
  /** The picture shown before the first play. Without one, the frame is surface-2 until the video's first frame. */
  poster?: string;
  /** Other sizes of the poster, for the browser to pick from. Pair it with sizes. */
  posterSrcSet?: string;
  /** How wide the poster is drawn, for posterSrcSet: "(min-width: 64rem) 50vw, 100vw". */
  sizes?: string;
  /** The frame's shape: 16/9 (the default), 8/5, 4/3, 1/1, 4/5, or a number such as 2.39 (width over height). */
  ratio?: VideoRatio | number;
  /** A line under the player, as Media's. It wraps the player in a figure. */
  caption?: ReactNode;
  /** The video element, for your own control: currentTime, play(), pause(). */
  ref?: Ref<HTMLVideoElement>;
};

export type AudioPlayerProps = Shared & {
  /** What it is, shown at the top and naming the player: "Tide". */
  title: string;
  /** A line under the title in the grey: who made it, when, what it is. */
  byline?: ReactNode;
  /** A square picture before the title, such as a cover. It decorates, so the title must say what it is. */
  cover?: string;
  /** The audio element, for your own control: currentTime, play(), pause(). */
  ref?: Ref<HTMLAudioElement>;
};

/* Literal classes, because Tailwind only generates what it can read. */
const RATIO: Record<VideoRatio, string> = {
  "16/9": "aspect-video",
  "8/5": "aspect-[8/5]",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
  "4/5": "aspect-[4/5]",
};

/** Seconds that ← and → (and the rail's arrows) move, and that J and L move. */
const SKIP = 5;
const LEAP = 10;

/* ---------------------------------------------------------------- the marks */

/* The icon set's grid (icons.tsx): 16 units, a 1.5 stroke, round caps and joins, currentColor, decorative. */
function Glyph({ children, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}
const SPEAKER = "M1.75 6.25v3.5h2.5L8 12.75V3.25L4.25 6.25z";
const VolumeIcon = () => <Glyph><path d={SPEAKER} /><path d="M10.5 6.1a2.5 2.5 0 0 1 0 3.8M12.25 4.25a5.25 5.25 0 0 1 0 7.5" /></Glyph>;
const MutedIcon = () => <Glyph><path d={SPEAKER} /><path d="m10.75 6.25 3.5 3.5M14.25 6.25l-3.5 3.5" /></Glyph>;
const CC = "M7.25 6.25h-1.5a1 1 0 0 0-1 1v1.5a1 1 0 0 0 1 1h1.5M11.75 6.25h-1.5a1 1 0 0 0-1 1v1.5a1 1 0 0 0 1 1h1.5";
const CaptionsIcon = () => <Glyph><rect x="1.75" y="3.25" width="12.5" height="9.5" /><path d={CC} /></Glyph>;
/** Captions on: the same box filled, with the letters in the surface's color, as if cut out of it. */
const CaptionsOnIcon = () => (
  <Glyph>
    <rect x="1.75" y="3.25" width="12.5" height="9.5" fill="currentColor" />
    <path d={CC} stroke="var(--surface-1)" />
  </Glyph>
);
const VideoIcon = () => <Glyph><rect x="1.75" y="3.75" width="8.5" height="8.5" /><path d="m10.25 6.75 4-2.25v7l-4-2.25" /></Glyph>;

/* ---------------------------------------------------------------- time */

/** "1:05", or "1:01:05" when the length runs past an hour, so the two times always share a format. */
function clock(seconds: number, length: number) {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const pad = (n: number) => String(n).padStart(2, "0");
  if (length >= 3600) return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

/** The time in words, for the rail's value text: "1 minute 5 seconds". */
function spoken(seconds: number) {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;
  const out: string[] = [];
  if (s >= 3600) out.push(part(Math.floor(s / 3600), "hour"));
  if (s % 3600 >= 60) out.push(part(Math.floor((s % 3600) / 60), "minute"));
  if (s % 60 || out.length === 0) out.push(part(s % 60, "second"));
  return out.join(" ");
}

const rateText = (rate: number) => `${rate}×`;
const rateSpoken = (rate: number) => (rate === 1 ? "normal" : `${rate} times`);

/** Hands an element to a ref the caller passed, of either kind. */
function setRef<T>(ref: Ref<T> | undefined, el: T | null) {
  if (typeof ref === "function") ref(el);
  else if (ref) (ref as RefObject<T | null>).current = el;
}

/* ---------------------------------------------------------------- the engine */

/** The one player that is playing, so starting another pauses it. */
let playingNow: HTMLMediaElement | null = null;

type Playback = {
  media: RefObject<HTMLMediaElement | null>;
  /** It has played or been moved at least once, so the poster is gone. */
  started: boolean;
  playing: boolean;
  /** Playing, but waiting for data that has not arrived. */
  waiting: boolean;
  ended: boolean;
  failed: boolean;
  /** The length in seconds, or NaN until it is known. */
  duration: number;
  muted: boolean;
  volume: number;
  rate: number;
  captionsOn: boolean;
  /** The words of the cues showing now, or "" between them. */
  cue: string;
  toggle: () => void;
  seek: (seconds: number) => void;
  skip: (seconds: number) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setRate: (rate: number) => void;
  setCaptionsOn: (on: boolean) => void;
};

type EngineOptions = {
  defaultCaptions: boolean;
  duration?: number;
  /** For the system's media controls (a lock screen, a keyboard's media keys). */
  title: string;
  artist?: string;
  artwork?: string;
  sourceKey: string;
  onPlayingChange?: (playing: boolean) => void;
  onEnded?: () => void;
};

function usePlayback(media: RefObject<HTMLMediaElement | null>, track: RefObject<HTMLTrackElement | null>, o: EngineOptions): Playback {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [known, setKnown] = useState(NaN);
  const [muted, setMutedState] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [rate, setRateState] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(o.defaultCaptions);
  const [cue, setCue] = useState("");

  /* The latest callbacks and metadata, read by the listeners, which are added once per file. */
  const latest = useRef(o);
  latest.current = o;

  useEffect(() => {
    const el = media.current;
    if (!el) return;
    const sync = () => {
      setPlaying(!el.paused && !el.ended);
      setMutedState(el.muted);
      setVolumeState(el.volume);
      setKnown(Number.isFinite(el.duration) && el.duration > 0 ? el.duration : NaN);
      if (el.error) setFailed(true);
    };
    /* A file that failed before these listeners came (a page rendered on the server) leaves no source. A new element
       passes through that state too while it picks its file, so look once it has had a moment to pick. */
    const late = window.setTimeout(() => {
      if (el.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) setFailed(true);
    });
    const onPlay = () => {
      if (playingNow && playingNow !== el) playingNow.pause();
      playingNow = el;
      setPlaying(true);
      setEnded(false);
      latest.current.onPlayingChange?.(true);
      const session = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
      if (session && typeof MediaMetadata !== "undefined") {
        const { title, artist, artwork } = latest.current;
        session.metadata = new MediaMetadata({ title, artist, artwork: artwork ? [{ src: artwork }] : [] });
      }
    };
    const onPause = () => {
      if (playingNow === el) playingNow = null;
      setPlaying(false);
      setWaiting(false);
      latest.current.onPlayingChange?.(false);
    };
    const onPlaying = () => {
      setStarted(true);
      setWaiting(false);
    };
    /* A seek waits for data too; only a stall says so, or the spinner would flash on every move of the rail. */
    const onWaiting = () => setWaiting(!el.seeking);
    const onSeeked = () => {
      if (el.currentTime > 0) setStarted(true);
      setWaiting(false);
    };
    const onEnd = () => {
      setEnded(true);
      latest.current.onEnded?.();
    };
    const onVolume = () => {
      setMutedState(el.muted);
      setVolumeState(el.volume);
    };
    const onLength = () => setKnown(Number.isFinite(el.duration) && el.duration > 0 ? el.duration : NaN);
    /* A <source> that fails fires its error on itself, and it does not bubble: listen in the capture phase. The player
       has failed when the video does, or when the last source does. */
    const onError = (event: Event) => {
      const target = event.target;
      if (target === el || (target instanceof HTMLSourceElement && target === el.querySelector("source:last-of-type"))) setFailed(true);
    };
    const events: [string, EventListener][] = [
      ["play", onPlay],
      ["pause", onPause],
      ["playing", onPlaying],
      ["waiting", onWaiting],
      ["canplay", () => setWaiting(false)],
      ["seeked", onSeeked],
      ["ended", onEnd],
      ["volumechange", onVolume],
      ["durationchange", onLength],
      ["loadedmetadata", onLength],
      ["emptied", onLength],
    ];
    for (const [name, fn] of events) el.addEventListener(name, fn);
    el.addEventListener("error", onError, true);
    sync();
    return () => {
      window.clearTimeout(late);
      for (const [name, fn] of events) el.removeEventListener(name, fn);
      el.removeEventListener("error", onError, true);
      if (playingNow === el) playingNow = null;
    };
  }, [media]);

  /* Another file: load it, and start over. The first render's file loads on its own. */
  const loadedSource = useRef(o.sourceKey);
  useEffect(() => {
    const el = media.current;
    if (!el || loadedSource.current === o.sourceKey) return;
    loadedSource.current = o.sourceKey;
    setStarted(false);
    setEnded(false);
    setFailed(false);
    setWaiting(false);
    el.load();
  }, [media, o.sourceKey]);

  /* Captions: the track is "hidden", so it loads and reports its cues while the browser draws nothing on the picture,
     and "disabled" while they are off. */
  useEffect(() => {
    const el = track.current;
    const text = el?.track;
    if (!el || !text) return;
    text.mode = captionsOn ? "hidden" : "disabled";
    if (!captionsOn) {
      setCue("");
      return;
    }
    const update = () => {
      const lines: string[] = [];
      for (const c of Array.from(text.activeCues ?? [])) {
        const vtt = c as VTTCue;
        const words = typeof vtt.getCueAsHTML === "function" ? vtt.getCueAsHTML().textContent : vtt.text.replace(/<[^>]+>/g, "");
        if (words) lines.push(words);
      }
      setCue(lines.join("\n"));
    };
    /* A track turned on mid-cue reports no change for the cue it lands in, so read the cues again once it has loaded. */
    text.addEventListener("cuechange", update);
    el.addEventListener("load", update);
    update();
    return () => {
      text.removeEventListener("cuechange", update);
      el.removeEventListener("load", update);
    };
  }, [track, captionsOn, o.sourceKey]);

  const duration = Number.isFinite(known) ? known : o.duration !== undefined && o.duration > 0 ? o.duration : NaN;
  /* Before the file is loaded (preload="none") a seek is where it will start. */
  const seek = (seconds: number) => {
    const el = media.current;
    const d = el && Number.isFinite(el.duration) ? el.duration : duration;
    if (!el || failed || !Number.isFinite(d)) return;
    el.currentTime = Math.min(d, Math.max(0, seconds));
  };
  return {
    media,
    started,
    playing,
    waiting,
    ended,
    failed,
    duration,
    muted,
    volume,
    rate,
    captionsOn,
    cue,
    toggle: () => {
      const el = media.current;
      if (!el || failed) return;
      /* The play() promise rejects when a pause comes first, or when the browser refuses; neither is a failure. */
      if (el.paused || el.ended) el.play().catch(() => {});
      else el.pause();
    },
    seek,
    skip: (seconds: number) => seek((media.current?.currentTime ?? 0) + seconds),
    setMuted: (next: boolean) => {
      if (media.current) media.current.muted = next;
    },
    setVolume: (next: number) => {
      const el = media.current;
      if (!el) return;
      el.volume = Math.min(1, Math.max(0, next));
      if (next > 0 && el.muted) el.muted = false;
    },
    setRate: (next: number) => {
      const el = media.current;
      setRateState(next);
      if (!el) return;
      /* The default rate too, or loading the file again would put it back to 1. */
      el.defaultPlaybackRate = next;
      el.playbackRate = next;
    },
    setCaptionsOn,
  };
}

/* ---------------------------------------------------------------- the rail */

const RAIL_TRACK = "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]";

/* The Slider's thumb (slider.tsx), on a rail it does not own. */
const THUMB =
  "absolute top-1/2 left-0 -mt-2.5 block size-5 rounded-pill bg-surface-1 " +
  "shadow-[inset_0_0_0_1px_var(--line-control),var(--highlight)] " +
  "transition-[background-color,box-shadow] duration-(--dur-instant) ease-litt " +
  "hover:bg-surface-2 pointer-coarse:active:bg-surface-2 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
  "aria-disabled:bg-surface-2 aria-disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border";

/* The volume rail: the Slider's look at 64px, on Radix Slider for its keys. */
const VOLUME_ROOT = "relative flex h-5 w-16 shrink-0 touch-pan-y select-none items-center cursor-pointer";
const VOLUME_RAIL = "relative h-1 grow overflow-hidden rounded-control forced-colors:border " + RAIL_TRACK;
const VOLUME_RANGE = "absolute h-full rounded-control bg-fg forced-colors:bg-[Highlight]";
const VOLUME_THUMB =
  "block size-3 rounded-pill bg-surface-1 shadow-[inset_0_0_0_1px_var(--line-control),var(--highlight)] " +
  "transition-[background-color] duration-(--dur-instant) ease-litt hover:bg-surface-2 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border";

type BarProps = {
  playback: Playback;
  /** Full screen, for a video: whether it is on and how to change it, or undefined for none. */
  fullscreen?: { on: boolean; toggle: () => void };
  rates?: number[];
  hasCaptions: boolean;
};

/** The controls: Play, the elapsed time, the rail, the length, then Captions, Speed, Mute, the volume and Full screen. */
function Bar({ playback: p, fullscreen, rates, hasCaptions }: BarProps) {
  const { coarse } = useDevice();
  const { reduced } = useMotionDial();
  const size = coarse ? "md" : "sm";
  const hintId = useId();

  const seekRoot = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const elapsed = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const tipText = useRef<HTMLSpanElement>(null);
  /** The time a drag has put the playhead at, painted instead of the media's until the drag ends. */
  const scrub = useRef<number | null>(null);
  const dragging = useRef(false);
  const [tipShown, setTipShown] = useState(false);
  const paintRef = useRef<() => void>(() => {});

  const known = Number.isFinite(p.duration);
  const length = known ? p.duration : 0;
  const total = known ? clock(length, length) : "";
  /* Both times are as wide as the length, in the mono's even digits, so the rail never moves as they count. */
  const width = { minWidth: `${Math.max(4, clock(length, length).length)}ch` };
  const off = p.failed;
  const seekable = known && !off;

  /* The playhead and the buffered band are two CSS variables on the rail, painted on every frame while it plays (or on
     each timeupdate under reduced motion), so the page never renders for it. The elapsed text and the value text
     change only when the second does. */
  useLayoutEffect(() => {
    const el = p.media.current;
    const root = seekRoot.current;
    if (!el || !root) return;
    let frame = 0;
    let second = -1;
    let format = -1;
    const paint = () => {
      const d = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : length;
      const t = scrub.current ?? el.currentTime;
      const played = d > 0 ? Math.min(1, Math.max(0, t / d)) : 0;
      let loaded = 0;
      for (let i = 0; i < el.buffered.length; i++) {
        if (el.buffered.start(i) <= t + 0.5 && el.buffered.end(i) >= t) loaded = d > 0 ? Math.min(1, el.buffered.end(i) / d) : 0;
      }
      root.style.setProperty("--played", String(played));
      root.style.setProperty("--loaded", String(Math.max(loaded, played)));
      const s = Math.floor(t);
      if (s !== second || d !== format) {
        second = s;
        format = d;
        if (elapsed.current) elapsed.current.textContent = clock(t, d);
        thumb.current?.setAttribute("aria-valuenow", String(Math.min(s, Math.floor(d))));
        thumb.current?.setAttribute("aria-valuetext", d > 0 ? `${spoken(t)} of ${spoken(d)}` : spoken(t));
      }
    };
    paintRef.current = paint;
    const loop = () => {
      paint();
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!reduced && !frame && !el.paused) frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      paint();
    };
    const events: [string, () => void][] = [
      ["playing", start],
      ["play", start],
      ["pause", stop],
      ["ended", stop],
      ["waiting", stop],
      ["timeupdate", paint],
      ["seeking", paint],
      ["seeked", paint],
      ["progress", paint],
      ["durationchange", paint],
      ["loadedmetadata", paint],
      ["emptied", paint],
    ];
    for (const [name, fn] of events) el.addEventListener(name, fn);
    paint();
    start();
    return () => {
      for (const [name, fn] of events) el.removeEventListener(name, fn);
      cancelAnimationFrame(frame);
    };
  }, [p.media, reduced, length]);

  /** The time under a pointer at x, on the rail. */
  const timeAt = (x: number) => {
    const r = seekRoot.current?.getBoundingClientRect();
    if (!r || r.width === 0) return 0;
    return Math.min(1, Math.max(0, (x - r.left) / r.width)) * length;
  };
  /** Puts the time readout above the pointer, kept inside the rail. */
  const placeTip = (x: number, seconds: number) => {
    const r = seekRoot.current?.getBoundingClientRect();
    const box = tip.current;
    if (!r || !box || !tipText.current) return;
    tipText.current.textContent = clock(seconds, length);
    const w = box.offsetWidth;
    const left = Math.min(r.width - w, Math.max(0, x - r.left - w / 2));
    box.style.transform = `translateX(${left}px)`;
  };
  const scrubTo = (x: number) => {
    const t = timeAt(x);
    scrub.current = t;
    paintRef.current();
    placeTip(x, t);
    /* fastSeek lands on a nearby keyframe at once where the browser has it; the release seeks exactly. */
    const el = p.media.current;
    if (el && typeof el.fastSeek === "function") el.fastSeek(t);
    else p.seek(t);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!seekable || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = true;
    thumb.current?.focus({ preventScroll: true });
    setTipShown(true);
    scrubTo(event.clientX);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!seekable) return;
    if (dragging.current) scrubTo(event.clientX);
    else if (event.pointerType === "mouse") {
      placeTip(event.clientX, timeAt(event.clientX));
      setTipShown(true);
    }
  };
  const release = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const t = scrub.current;
    scrub.current = null;
    if (t !== null) p.seek(t);
    setTipShown(false);
  };
  const onPointerLeave = () => {
    if (!dragging.current) setTipShown(false);
  };

  const onThumbKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!seekable) return;
    const now = p.media.current?.currentTime ?? 0;
    const page = Math.max(SKIP, length / 10);
    let to: number;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = now - SKIP;
    else if (event.key === "ArrowRight" || event.key === "ArrowUp") to = now + SKIP;
    else if (event.key === "PageDown") to = now - page;
    else if (event.key === "PageUp") to = now + page;
    else if (event.key === "Home") to = 0;
    else if (event.key === "End") to = length;
    else return;
    event.preventDefault();
    p.seek(to);
  };

  const icon = p.waiting ? <Spinner /> : p.playing ? <PauseIcon /> : p.ended ? <RetryIcon /> : <PlayIcon />;
  const playLabel = p.playing ? "Pause" : p.ended ? "Play again" : "Play";
  const nextRate = rates && rates.length > 1 ? rates[(rates.indexOf(p.rate) + 1) % rates.length] ?? rates[0] ?? 1 : undefined;

  return (
    <div className="@container/bar p-1">
      <div className="flex flex-wrap items-center gap-x-1 @md/bar:flex-nowrap">
        <Button variant="secondary" size={size} iconOnly aria-label={playLabel} disabled={off} onClick={p.toggle}>
          {icon}
        </Button>

        {/* The timeline: on its own row above the buttons in a narrow box, between them in a wide one. */}
        <div className="order-first flex min-w-0 basis-full items-center gap-3 px-2 @md/bar:order-none @md/bar:flex-1 @md/bar:basis-auto">
          <span
            ref={elapsed}
            aria-hidden="true"
            className={"shrink-0 text-right font-mono text-caption font-normal text-fg-subtle tabular-nums " + (off ? "invisible" : "")}
            style={width}
          />
          <div
            ref={seekRoot}
            data-no-drag=""
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={release}
            onPointerLeave={onPointerLeave}
            /* The two variables the effect above paints. React sets them once and, as they never change here, never again. */
            style={{ "--played": 0, "--loaded": 0 } as CSSProperties}
            className={
              "@container relative flex h-5 min-w-0 flex-1 touch-pan-y select-none items-center pointer-coarse:h-control-md " +
              (seekable ? "cursor-pointer" : "cursor-not-allowed")
            }
          >
            <div className={"relative h-1 w-full overflow-hidden rounded-control forced-colors:border " + RAIL_TRACK}>
              <div
                className="absolute inset-0 origin-left bg-[color-mix(in_oklab,var(--fg)_24%,transparent)] forced-colors:bg-[GrayText]"
                style={{ transform: "scaleX(var(--loaded, 0))" }}
              />
              <div
                className={"absolute inset-0 origin-left forced-colors:bg-[Highlight] " + (off ? "bg-fg-disabled" : "bg-fg")}
                style={{ transform: "scaleX(var(--played, 0))" }}
              />
            </div>
            {/* Kept inside the rail, as the Slider's thumb is: its left edge runs from 0 to the rail less its own width. */}
            <div
              ref={thumb}
              role="slider"
              tabIndex={seekable ? 0 : -1}
              aria-label="Seek"
              aria-describedby={hintId}
              aria-valuemin={0}
              aria-valuemax={Math.floor(length)}
              /* Painted from here on, once a second, by the effect above. React never sets them again, so it never
                 writes over the painted time. */
              aria-valuenow={0}
              aria-valuetext="0 seconds"
              aria-disabled={seekable ? undefined : true}
              onKeyDown={onThumbKey}
              className={THUMB}
              style={{ transform: "translateX(calc(var(--played, 0) * (100cqw - 100%)))" }}
            />
            <div
              ref={tip}
              aria-hidden="true"
              className={
                "pointer-events-none absolute bottom-full left-0 mb-2 transition-opacity duration-(--dur-responsive) ease-responsive " +
                (tipShown && seekable ? "opacity-100" : "opacity-0")
              }
            >
              <span
                ref={tipText}
                className="block rounded-control bg-surface-3 px-2 py-1.5 font-mono text-caption font-normal whitespace-nowrap text-fg tabular-nums shadow-tooltip inset-shadow-highlight"
              />
            </div>
          </div>
          <span
            aria-hidden="true"
            className={"shrink-0 font-mono text-caption font-normal text-fg-subtle tabular-nums " + (off ? "invisible" : "")}
            style={width}
          >
            {total}
          </span>
          <span id={hintId} className="sr-only">
            Arrow keys move {SKIP} seconds.
          </span>
        </div>

        {/* A file that failed has nothing to mute, caption or enlarge: only the disabled Play and rail stay, to keep the shape. */}
        <div className={"ml-auto flex shrink-0 items-center gap-1 " + (off ? "hidden" : "")}>
          {hasCaptions && (
            <Button variant="ghost" size={size} iconOnly aria-label="Captions" aria-pressed={p.captionsOn} disabled={off} onClick={() => p.setCaptionsOn(!p.captionsOn)}>
              {p.captionsOn ? <CaptionsOnIcon /> : <CaptionsIcon />}
            </Button>
          )}
          {nextRate !== undefined && (
            <Button
              variant="ghost"
              size={size}
              aria-label={`Speed, ${rateSpoken(p.rate)}`}
              disabled={off}
              onClick={() => p.setRate(nextRate)}
              className="tabular-nums"
            >
              {rateText(p.rate)}
            </Button>
          )}
          <Button variant="ghost" size={size} iconOnly aria-label="Mute" aria-pressed={p.muted} disabled={off} onClick={() => p.setMuted(!p.muted)}>
            {p.muted ? <MutedIcon /> : <VolumeIcon />}
          </Button>
          {/* A touch screen has the device's volume, and iOS lets no page set it: the rail is for a fine pointer in a wide box. */}
          <RadixSlider.Root
            min={0}
            max={1}
            step={0.05}
            value={[p.muted ? 0 : p.volume]}
            onValueChange={(v) => v[0] !== undefined && p.setVolume(v[0])}
            disabled={off}
            data-no-drag=""
            className={"me-2 ms-1 hidden pointer-fine:@md/bar:flex " + VOLUME_ROOT}
          >
            <RadixSlider.Track className={VOLUME_RAIL}>
              <RadixSlider.Range className={VOLUME_RANGE} />
            </RadixSlider.Track>
            <RadixSlider.Thumb aria-label="Volume" aria-valuetext={`${Math.round((p.muted ? 0 : p.volume) * 100)}%`} className={VOLUME_THUMB} />
          </RadixSlider.Root>
          {fullscreen && (
            <Button variant="ghost" size={size} iconOnly aria-label="Full screen" aria-pressed={fullscreen.on} disabled={off} onClick={fullscreen.toggle}>
              {fullscreen.on ? <ShrinkIcon /> : <ExpandIcon />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** The keys that work anywhere in the player. A key the focused control already uses (Space on a button, an arrow on a rail) is left to it. */
function useShortcuts(p: Playback, rates: number[] | undefined, hasCaptions: boolean, fullscreen?: { toggle: () => void }) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const onButton = (event.target as HTMLElement).closest("button") !== null;
    const step = (dir: 1 | -1) => {
      if (!rates || rates.length < 2) return;
      const sorted = [...rates].sort((a, b) => a - b);
      const at = sorted.indexOf(p.rate);
      const next = sorted[Math.min(sorted.length - 1, Math.max(0, (at < 0 ? sorted.indexOf(1) : at) + dir))];
      if (next !== undefined) p.setRate(next);
    };
    switch (event.key) {
      case " ":
        if (onButton) return;
        p.toggle();
        break;
      case "k":
      case "K":
        p.toggle();
        break;
      case "ArrowLeft":
        p.skip(-SKIP);
        break;
      case "ArrowRight":
        p.skip(SKIP);
        break;
      case "j":
      case "J":
        p.skip(-LEAP);
        break;
      case "l":
      case "L":
        p.skip(LEAP);
        break;
      case "Home":
        p.seek(0);
        break;
      case "End":
        p.seek(p.duration);
        break;
      case "m":
      case "M":
        p.setMuted(!p.muted);
        break;
      case "c":
      case "C":
        if (!hasCaptions) return;
        p.setCaptionsOn(!p.captionsOn);
        break;
      case "f":
      case "F":
        if (!fullscreen) return;
        fullscreen.toggle();
        break;
      case ">":
        step(1);
        break;
      case "<":
        step(-1);
        break;
      default:
        return;
    }
    event.preventDefault();
  };
}

/** The sources and the captions track, the same for both elements. */
function Sources({ src, captions, track }: { src: string | MediaFile[]; captions?: MediaCaptions; track: RefObject<HTMLTrackElement | null> }) {
  const files = typeof src === "string" ? [{ src, type: undefined }] : src;
  return (
    <>
      {files.map((f) => (
        <source key={f.src} src={f.src} type={f.type} />
      ))}
      {captions && <track ref={track} kind="captions" src={captions.src} srcLang={captions.lang} label={captions.label ?? captions.lang} />}
    </>
  );
}

const sourceKey = (src: string | MediaFile[]) => (typeof src === "string" ? src : src.map((f) => f.src).join(" "));

/** The cue line, kept two lines tall while the captions are on so the bar never moves between cues. */
function CueLine({ cue }: { cue: string }) {
  return <p className="min-h-[2lh] px-3 pt-3 text-small whitespace-pre-line text-fg">{cue}</p>;
}

/* ---------------------------------------------------------------- VideoPlayer */

type WebkitVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

/** Moving pictures in a frame that keeps its shape, with the controls in a bar under the picture. Nothing plays until someone presses Play. */
export function VideoPlayer({
  src,
  label,
  poster,
  posterSrcSet,
  sizes,
  ratio = "16/9",
  caption,
  captions,
  defaultCaptions = false,
  rates,
  preload = "metadata",
  duration,
  crossOrigin,
  onPlayingChange,
  onEnded,
  className = "",
  ref,
}: VideoPlayerProps) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const track = useRef<HTMLTrackElement | null>(null);
  const key = sourceKey(src);
  const p = usePlayback(video, track, { defaultCaptions, duration, title: label, artwork: poster, sourceKey: key, onPlayingChange, onEnded });

  /* The poster fades in when it arrives, as a Media image does. Its status belongs to its address. */
  const [posterLoaded, setPosterLoaded] = useState<string | null>(null);
  const posterImg = useRef<HTMLImageElement>(null);
  useLayoutEffect(() => {
    const el = posterImg.current;
    if (el?.complete && el.naturalWidth > 0) setPosterLoaded(poster ?? null);
  }, [poster]);

  /* Full screen, read after hydration: the page's own, or on an iPhone the system player's. */
  const [canFull, setCanFull] = useState(false);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const el = video.current as WebkitVideo | null;
    setCanFull(document.fullscreenEnabled || typeof el?.webkitEnterFullscreen === "function");
    const change = () => setFull(document.fullscreenElement === root.current && root.current !== null);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  const toggleFull = () => {
    const el = video.current as WebkitVideo | null;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (document.fullscreenEnabled && root.current) root.current.requestFullscreen().catch(() => {});
    else el?.webkitEnterFullscreen?.();
  };
  const fullscreen = canFull ? { on: full, toggle: toggleFull } : undefined;
  const onKeyDown = useShortcuts(p, rates, captions !== undefined, fullscreen);

  const shape = full ? "min-h-0 flex-1" : typeof ratio === "number" ? "" : RATIO[ratio];
  const fit = full ? "object-contain" : "object-cover";

  const player = (
    <div
      ref={root}
      role="group"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={[
        full ? "flex h-full flex-col bg-canvas p-4" : "litt-raised grid min-w-0 p-1",
        caption ? "" : className,
      ].join(" ")}
    >
      <div
        className={"group/frame @container relative overflow-hidden rounded-control bg-surface-2 " + shape}
        style={!full && typeof ratio === "number" ? { aspectRatio: ratio } : undefined}
      >
        <video
          ref={(el) => {
            video.current = el;
            setRef(ref, el);
          }}
          playsInline
          preload={preload}
          crossOrigin={crossOrigin}
          onClick={p.toggle}
          className={"absolute inset-0 size-full " + fit + (p.failed ? " invisible" : " cursor-pointer")}
        >
          <Sources src={src} captions={captions} track={track} />
        </video>
        {poster && !p.started && !p.failed && (
          <img
            ref={posterImg}
            src={poster}
            srcSet={posterSrcSet}
            sizes={sizes}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={() => setPosterLoaded(poster)}
            className={
              "pointer-events-none absolute inset-0 size-full transition-opacity duration-(--dur-instant) ease-litt " +
              fit +
              (posterLoaded === poster ? " opacity-100" : " opacity-0")
            }
          />
        )}
        {/* Until the first play: the disc says it is a video, and a press anywhere on the picture plays it. */}
        {!p.started && !p.failed && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
            <span
              className={
                "grid size-control-lg place-items-center rounded-pill bg-surface-1 text-fg " +
                "shadow-[inset_0_0_0_1px_var(--line-strong),var(--highlight)] " +
                "transition-[background-color] duration-(--dur-instant) ease-litt group-hover/frame:bg-surface-2"
              }
            >
              {p.waiting ? <Spinner /> : <PlayIcon />}
            </span>
          </span>
        )}
        {p.failed && (
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center gap-2 p-4 text-fg-subtle">
            <VideoIcon />
            <span className="truncate text-small @max-[10rem]:hidden">Video didn&apos;t load</span>
          </span>
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-control shadow-[inset_0_0_0_1px_var(--line)]" />
      </div>
      {p.captionsOn && <CueLine cue={p.cue} />}
      <Bar playback={p} fullscreen={fullscreen} rates={rates} hasCaptions={captions !== undefined} />
      {p.failed && (
        <span role="status" className="sr-only">
          {label}: the video didn&apos;t load.
        </span>
      )}
    </div>
  );

  if (!caption) return player;
  return (
    <figure className={"grid min-w-0 content-start gap-2 " + className}>
      {player}
      <figcaption className="text-small text-fg-subtle">{caption}</figcaption>
    </figure>
  );
}

/* ---------------------------------------------------------------- AudioPlayer */

/** A sound with a title, on a raised card, with the same bar as a video's. Nothing plays until someone presses Play. */
export function AudioPlayer({
  src,
  title,
  byline,
  cover,
  captions,
  defaultCaptions = false,
  rates,
  preload = "metadata",
  duration,
  crossOrigin,
  onPlayingChange,
  onEnded,
  className = "",
  ref,
}: AudioPlayerProps) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const track = useRef<HTMLTrackElement | null>(null);
  const titleId = useId();
  const p = usePlayback(audio, track, {
    defaultCaptions,
    duration,
    title,
    artist: typeof byline === "string" ? byline : undefined,
    artwork: cover,
    sourceKey: sourceKey(src),
    onPlayingChange,
    onEnded,
  });
  const onKeyDown = useShortcuts(p, rates, captions !== undefined);

  return (
    <div role="group" aria-labelledby={titleId} onKeyDown={onKeyDown} className={"litt-raised grid min-w-0 p-1 " + className}>
      <audio
        ref={(el) => {
          audio.current = el;
          setRef(ref, el);
        }}
        preload={preload}
        crossOrigin={crossOrigin}
      >
        <Sources src={src} captions={captions} track={track} />
      </audio>
      <div className="flex min-w-0 items-center gap-3 px-3 pt-3 pb-2">
        {cover && (
          <span className="relative size-12 shrink-0 overflow-hidden rounded-control bg-surface-2">
            <img src={cover} alt="" loading="lazy" decoding="async" draggable={false} className="size-full object-cover" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-control shadow-[inset_0_0_0_1px_var(--line)]" />
          </span>
        )}
        <div className="grid min-w-0 gap-1">
          <p id={titleId} className="truncate text-body font-title text-fg">
            {title}
          </p>
          {p.failed ? (
            <p className="truncate text-small text-fg-subtle">Sound didn&apos;t load</p>
          ) : (
            byline && <p className="truncate text-small text-fg-subtle">{byline}</p>
          )}
        </div>
      </div>
      {p.captionsOn && <CueLine cue={p.cue} />}
      <Bar playback={p} rates={rates} hasCaptions={captions !== undefined} />
    </div>
  );
}
