/* Recordings: the video and the sound on the Media player page, made for the gallery with ffmpeg from its own
   sources, so they load as a site's would: the length first, the rest when someone presses Play.

   The reel is three of the field studies (plates.ts: Open water, Dusk tide and Silk) at 960 by 540 and 30 frames a
   second, each pushed in slowly by 6% over 5.5 seconds, with one-second cross-fades, 14.5 seconds in all. Under it
   is a synthesized chord (A2, E3, A3, and E4 from 5 seconds) over brown noise that swells every 4.8 seconds. It is
   VP9 and Opus in WebM, and H.264 and AAC in MP4 for Safari before 17.4. Its captions say what is heard, because
   there is no speech.

   Tide is 42 seconds of brown noise swelling like a tide every 7 seconds, a hiss of pink noise on each crest and a
   low chord (E2, B2, B3) under it, as a 64 kbps MP3. The files are in gallery/public/media. */
import type { MediaCaptions, MediaFile } from "@/components/media-player";
import { OPEN_WATER } from "./plates";

const BASE = `${import.meta.env.BASE_URL}media/`;

/** Field studies, the reel: the same video twice, best first. */
export const REEL: MediaFile[] = [
  { src: `${BASE}field-studies.webm`, type: "video/webm" },
  { src: `${BASE}field-studies.mp4`, type: "video/mp4" },
];
export const REEL_CAPTIONS: MediaCaptions = { src: `${BASE}field-studies.vtt`, lang: "en", label: "English" };
/** The reel's first study, as its poster. */
export const REEL_POSTER = OPEN_WATER;
export const REEL_LENGTH = 14.5;

/** Tide, a sound study. */
export const TIDE: MediaFile[] = [{ src: `${BASE}tide.mp3`, type: "audio/mpeg" }];
export const TIDE_LENGTH = 42;
