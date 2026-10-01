/** Preferred recording formats, best first. */
const CANDIDATES = [
  { mime: 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"', ext: "mp4", label: "MP4 · H.264" },
  { mime: 'video/mp4;codecs="avc1.4D401E,mp4a.40.2"', ext: "mp4", label: "MP4 · H.264 main" },
  { mime: "video/mp4;codecs=avc1", ext: "mp4", label: "MP4 · H.264" },
  { mime: "video/mp4", ext: "mp4", label: "MP4" },
  { mime: 'video/webm;codecs="vp9,opus"', ext: "webm", label: "WebM · VP9" },
  { mime: 'video/webm;codecs="vp8,opus"', ext: "webm", label: "WebM · VP8" },
  { mime: "video/webm", ext: "webm", label: "WebM" },
];

export function detectFormats() {
  if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") {
    return { supported: false, mp4: null, best: null, all: [] };
  }
  const all = CANDIDATES.filter((c) => {
    try {
      return window.MediaRecorder.isTypeSupported(c.mime);
    } catch {
      return false;
    }
  });
  return {
    supported: all.length > 0,
    mp4: all.find((c) => c.ext === "mp4") || null,
    best: all[0] || null,
    all,
  };
}

export class Exporter {
  constructor(getCanvas, audioEngine) {
    this.getCanvas = getCanvas;
    this.audio = audioEngine;
    this.recorder = null;
    this.chunks = [];
    this.format = null;
    this.done = null;
  }

  get recording() {
    return Boolean(this.recorder);
  }

  start({ fps = 60, bitrate = 12_000_000 } = {}) {
    const canvas = this.getCanvas();
    if (!canvas) throw new Error("no canvas");

    const formats = detectFormats();
    if (!formats.best) throw new Error("MediaRecorder unsupported");

    const stream = canvas.captureStream(fps);
    const audioStream = this.audio?.stream;
    if (audioStream) {
      audioStream.getAudioTracks().forEach((t) => stream.addTrack(t));
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: formats.best.mime,
      videoBitsPerSecond: bitrate,
      audioBitsPerSecond: 320_000,
    });

    this.chunks = [];
    this.format = formats.best;
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) this.chunks.push(e.data);
    };

    this.done = new Promise((resolve) => {
      recorder.onstop = () => {
        const type = formats.best.mime.split(";")[0];
        resolve({ blob: new Blob(this.chunks, { type }), ext: formats.best.ext });
      };
    });

    recorder.start(250);
    this.recorder = recorder;
    return formats.best;
  }

  async stop() {
    if (!this.recorder) return null;
    const rec = this.recorder;
    this.recorder = null;
    if (rec.state !== "inactive") rec.stop();
    const result = await this.done;
    this.done = null;
    return result;
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return url;
}
