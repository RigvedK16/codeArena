import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as blazeface from "@tensorflow-models/blazeface";
import "@tensorflow/tfjs";

import { api } from "../utils/api";

const OVERLAY_WIDTH = 200;
const OVERLAY_HEIGHT = 150;

const DETECTION_INTERVAL_MS = 700;
const VIOLATION_COOLDOWN_MS = 15000;

const UI_VIOLATION_COOLDOWN_MS = 2000;

// Allow some movement while still considering the face "centered".
const CENTER_TOLERANCE_X = 0.14;
const CENTER_TOLERANCE_Y = 0.16;

// Treat "moved away" as face getting too small in frame.
const MIN_FACE_AREA_RATIO = 0.028;

function stopStreamTracks(stream) {
  try {
    stream?.getTracks?.().forEach((t) => t.stop());
  } catch {
    // ignore
  }
}

function getVideoEl(webcamRef) {
  return webcamRef?.current?.video || null;
}

function isVideoReady(videoEl) {
  // HAVE_ENOUGH_DATA === 4
  return Boolean(videoEl && videoEl.readyState >= 3);
}

function getFaceCenter(prediction) {
  const tl = prediction?.topLeft;
  const br = prediction?.bottomRight;
  if (!tl || !br) return null;

  const x1 = Array.isArray(tl) ? tl[0] : tl?.[0];
  const y1 = Array.isArray(tl) ? tl[1] : tl?.[1];
  const x2 = Array.isArray(br) ? br[0] : br?.[0];
  const y2 = Array.isArray(br) ? br[1] : br?.[1];

  if (![x1, y1, x2, y2].every((v) => Number.isFinite(Number(v)))) return null;

  return {
    x: (Number(x1) + Number(x2)) / 2,
    y: (Number(y1) + Number(y2)) / 2,
  };
}

function getFaceAreaRatio(prediction, videoEl) {
  const tl = prediction?.topLeft;
  const br = prediction?.bottomRight;
  const width = Number(videoEl?.videoWidth || 0);
  const height = Number(videoEl?.videoHeight || 0);
  if (!tl || !br || !width || !height) return null;

  const x1 = Array.isArray(tl) ? tl[0] : tl?.[0];
  const y1 = Array.isArray(tl) ? tl[1] : tl?.[1];
  const x2 = Array.isArray(br) ? br[0] : br?.[0];
  const y2 = Array.isArray(br) ? br[1] : br?.[1];

  if (![x1, y1, x2, y2].every((v) => Number.isFinite(Number(v)))) return null;

  const faceW = Math.max(0, Number(x2) - Number(x1));
  const faceH = Math.max(0, Number(y2) - Number(y1));
  const faceArea = faceW * faceH;
  const frameArea = width * height;
  if (!frameArea) return null;
  return faceArea / frameArea;
}

function getCenteredStatus(faceCenter, videoEl) {
  const width = Number(videoEl?.videoWidth || 0);
  const height = Number(videoEl?.videoHeight || 0);
  if (!faceCenter || !width || !height) return { ok: true };

  const cx = width / 2;
  const cy = height / 2;
  const dx = Math.abs(faceCenter.x - cx);
  const dy = Math.abs(faceCenter.y - cy);

  const okX = dx <= width * CENTER_TOLERANCE_X;
  const okY = dy <= height * CENTER_TOLERANCE_Y;
  return { ok: okX && okY };
}

export default function ContestProctoringOverlay({
  contestId,
  problemId,
  enabled = true,
}) {
  const webcamRef = useRef(null);
  const modelRef = useRef(null);
  const loopRef = useRef(null);
  const stoppedRef = useRef(false);
  const lastLoggedAtRef = useRef({});
  const lastUiEmittedAtRef = useRef({});

  const [cameraError, setCameraError] = useState(null);
  const [facesCount, setFacesCount] = useState(null);

  const emitUiViolation = useCallback(
    (type) => {
      if (!contestId) return;

      const now = Date.now();
      const last = Number(lastUiEmittedAtRef.current?.[type] || 0);
      if (now - last < UI_VIOLATION_COOLDOWN_MS) return;
      lastUiEmittedAtRef.current = { ...lastUiEmittedAtRef.current, [type]: now };

      try {
        window.dispatchEvent(
          new CustomEvent("contest:proctor-violation", {
            detail: { contestId, problemId, type },
          }),
        );
      } catch {
        // ignore
      }
    },
    [contestId, problemId],
  );

  const logViolation = useCallback(
    async (type) => {
      if (!contestId) return;

      const now = Date.now();
      const last = Number(lastLoggedAtRef.current?.[type] || 0);
      if (now - last < VIOLATION_COOLDOWN_MS) return;
      lastLoggedAtRef.current = { ...lastLoggedAtRef.current, [type]: now };

      try {
        await api(`/contests/${contestId}/violation`, {
          method: "POST",
          body: { type, problemId },
        });
      } catch {
        // Avoid surfacing noisy errors during proctoring; backend may rate-limit.
      }
    },
    [contestId, problemId],
  );

  const stopProctoring = () => {
    stoppedRef.current = true;

    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }

    const videoEl = getVideoEl(webcamRef);
    if (videoEl?.srcObject) stopStreamTracks(videoEl.srcObject);
  };

  useEffect(() => {
    if (!enabled || !contestId) return;

    const handler = (e) => {
      const incomingContestId = e?.detail?.contestId;
      if (!incomingContestId || incomingContestId !== contestId) return;
      stopProctoring();
    };

    window.addEventListener("contest:proctor-stop", handler);
    return () => window.removeEventListener("contest:proctor-stop", handler);
  }, [enabled, contestId]);

  useEffect(() => {
    if (!enabled || !contestId) return;

    stoppedRef.current = false;

    let mounted = true;

    const loadModel = async () => {
      if (modelRef.current) return modelRef.current;
      const model = await blazeface.load();
      modelRef.current = model;
      return model;
    };

    const runDetection = async () => {
      try {
        const model = await loadModel();

        const tick = async () => {
          if (!mounted || stoppedRef.current) return;

          const videoEl = getVideoEl(webcamRef);
          if (!isVideoReady(videoEl)) return;

          let predictions = [];
          try {
            predictions = await model.estimateFaces(videoEl, false);
          } catch {
            return;
          }

          const count = Array.isArray(predictions) ? predictions.length : 0;
          setFacesCount(count);

          if (count === 0) {
            emitUiViolation("NO_FACE");
            await logViolation("NO_FACE");
            return;
          }

          if (count > 1) {
            emitUiViolation("MULTIPLE_FACES");
            await logViolation("MULTIPLE_FACES");
            return;
          }

          const center = getFaceCenter(predictions[0]);
          const centered = getCenteredStatus(center, videoEl);
          const areaRatio = getFaceAreaRatio(predictions[0], videoEl);
          const isTooSmall =
            Number.isFinite(areaRatio) && Number(areaRatio) < MIN_FACE_AREA_RATIO;

          if (!centered.ok || isTooSmall) {
            emitUiViolation("FACE_NOT_CENTERED");
            await logViolation("FACE_NOT_CENTERED");
          }
        };

        loopRef.current = setInterval(() => {
          // Avoid unhandled promise warnings
          tick();
        }, DETECTION_INTERVAL_MS);
      } catch (err) {
        if (!mounted) return;
        setCameraError(err?.message || "Failed to start proctoring");
      }
    };

    runDetection();

    return () => {
      mounted = false;
      stopProctoring();
    };
  }, [enabled, contestId, problemId, logViolation, emitUiViolation]);

  if (!enabled || !contestId) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-20 overflow-hidden rounded-xl border border-gray-200 bg-white"
      style={{ width: OVERLAY_WIDTH, height: OVERLAY_HEIGHT }}
    >
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored={true}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "user" }}
        onUserMedia={() => setCameraError(null)}
        onUserMediaError={(err) =>
          setCameraError(err?.message || "Camera permission denied")
        }
        className="h-full w-full object-cover"
      />

      {cameraError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white p-2">
          <div className="text-center text-xs text-gray-700">
            {String(cameraError)}
          </div>
        </div>
      ) : null}

      {Number.isFinite(facesCount) && !cameraError ? (
        <div className="absolute left-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-gray-700">
          {facesCount} face{facesCount === 1 ? "" : "s"}
        </div>
      ) : null}
    </div>
  );
}
