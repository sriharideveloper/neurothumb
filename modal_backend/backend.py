"""
Croissant – Modal.com Backend
TRIBE v2 thumbnail analysis endpoint.

Deploy: modal deploy backend.py
Test locally: modal run backend.py
"""

import modal
import io
import base64
import json
import traceback
import tempfile
import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Modal App & Image
# ---------------------------------------------------------------------------
app = modal.App("croissant-tribe-analyzer")

tribe_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "git", "libgl1-mesa-glx", "libglib2.0-0")
    .pip_install(
        "fastapi[standard]",
        "tribev2[plotting] @ git+https://github.com/facebookresearch/tribev2.git",
        "exca",
        "pillow",
        "moviepy",
        "pandas",
        "yt-dlp",
        "numpy>=1.26.4,<2.3",
        "scipy>=1.13",
        "matplotlib",
        "requests",
        "nibabel",
        "nilearn",
        "neuralset",
        "neuraltrain",
    )
)

VOLUME_NAME = "croissant-model-cache"
model_volume = modal.Volume.from_name(VOLUME_NAME, create_if_missing=True)
CACHE_DIR = "/cache"

THUMBNAIL_VIDEO_SECONDS = 6
THUMBNAIL_FPS = 10


def _extract_json_payload(data):
    """Normalize Modal/HTTP inputs into a dict payload."""
    if isinstance(data, dict):
        return data

    if isinstance(data, (bytes, bytearray)):
        data = data.decode("utf-8", errors="replace")

    if isinstance(data, str):
        data = data.strip()
        if not data:
            return {}
        try:
            parsed = json.loads(data)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON payload: {exc.msg}") from exc
        if isinstance(parsed, dict):
            return parsed
        raise ValueError("JSON payload must be an object")

    raise ValueError(f"Unsupported payload type: {type(data).__name__}")


# ---------------------------------------------------------------------------
# Helpers loaded inside the container
# ---------------------------------------------------------------------------
@app.cls(
    image=tribe_image,
    gpu="T4",
    timeout=2400,
    volumes={CACHE_DIR: model_volume},
)
@modal.concurrent(max_inputs=4)
class TribeAnalyzer:
    @modal.enter()
    def load_model(self):
        """Load TRIBE v2 model on container startup (cached in volume)."""
        import numpy as np
        from tribev2.demo_utils import TribeModel
        from tribev2.plotting.cortical import PlotBrainNilearn
        from tribev2.utils import get_hcp_labels, summarize_by_roi

        self.np = np
        self.summarize_by_roi = summarize_by_roi
        self.get_hcp_labels = get_hcp_labels

        self.model = TribeModel.from_pretrained(
            "facebook/tribev2",
            cache_folder=CACHE_DIR,
            config_update={"data": {"features_to_use": ["video"]}},
        )
        self.plotter = PlotBrainNilearn(mesh="fsaverage5")

        # Pre-compute ROI labels and group indices
        left_labels = list(get_hcp_labels(mesh="fsaverage5", combine=False, hemi="left").keys())
        right_labels = list(get_hcp_labels(mesh="fsaverage5", combine=False, hemi="right").keys())
        self.roi_labels = [f"{name}-lh" for name in left_labels] + [f"{name}-rh" for name in right_labels]

        self.roi_groups = {
            "visual": {
                "V1", "V2", "V3", "V4", "V3A", "V3B", "V6", "V6A", "V7",
                "LO1", "LO2", "LO3", "MT", "MST", "FFC", "PIT", "PHA1", "PHA2", "PHA3",
                "VMV1", "VMV2", "VMV3", "VVC",
            },
            "auditory_speech": {
                "A1", "A4", "A5", "LBelt", "MBelt", "PBelt", "RI", "STGa", "TA2",
                "STSda", "STSdp", "STSva", "STSvp",
            },
            "language_semantic": {
                "44", "45", "47l", "p47r", "IFJa", "IFJp", "IFSa", "IFSp",
                "TGd", "TGv", "TE1a", "TE1p", "TE2a", "TE2p",
            },
            "attention_control": {
                "FEF", "PEF", "IP0", "IP1", "IP2", "LIPd", "LIPv", "AIP", "MIP", "VIP",
                "8Av", "8Ad", "8BL", "8C", "9-46d", "9-46v", "SCEF",
            },
            "motor_somato": {
                "1", "2", "3a", "3b", "4", "5m", "5mv", "5L", "5hv",
                "6a", "6d", "6ma", "6mp", "6r", "6v", "24dd", "24dv",
            },
        }

        def strip_hemi(roi_name):
            return roi_name.replace("-lh", "").replace("-rh", "")

        self.group_indices = {
            group_name: [i for i, roi in enumerate(self.roi_labels) if strip_hemi(roi) in members]
            for group_name, members in self.roi_groups.items()
        }

        model_volume.commit()

    def _normalize_channel_handle(self, handle: str) -> str:
        handle = (handle or "").strip()
        if not handle:
            raise ValueError("Missing channel handle")
        if handle.startswith("http://") or handle.startswith("https://"):
            raise ValueError("Provide channel handle only (e.g. '@veritasium'), not a full URL")
        if not handle.startswith("@"):
            handle = f"@{handle}"
        return handle

    def _build_video_events(self, clip_path: str, duration_sec: float, timeline: str, subject: str):
        import pandas as pd

        return pd.DataFrame(
            [
                {
                    "type": "Video",
                    "filepath": clip_path,
                    "start": 0.0,
                    "duration": float(duration_sec),
                    "timeline": timeline,
                    "subject": subject,
                }
            ]
        )

    def _analyze_image_url(self, image_url: str, *, timeline: str, subject: str) -> dict:
        """Shared TRIBE inference path for single thumbnail + channel batch."""
        import requests
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from PIL import Image

        try:
            from moviepy import ImageClip
        except ImportError:
            from moviepy.editor import ImageClip

        np = self.np

        response = requests.get(image_url, timeout=30)
        response.raise_for_status()
        img = Image.open(io.BytesIO(response.content)).convert("RGB")

        with tempfile.TemporaryDirectory() as tmpdir:
            img_path = os.path.join(tmpdir, "thumbnail.jpg")
            clip_path = os.path.join(tmpdir, "thumbnail_clip.mp4")

            img.save(img_path, quality=95)

            clip = ImageClip(img_path, duration=THUMBNAIL_VIDEO_SECONDS)
            clip.write_videofile(
                clip_path,
                fps=THUMBNAIL_FPS,
                codec="libx264",
                audio=False,
                logger=None,
            )
            clip.close()

            events = self._build_video_events(
                clip_path,
                THUMBNAIL_VIDEO_SECONDS,
                timeline=timeline,
                subject=subject,
            )

            preds, _segments = self.model.predict(events=events, verbose=False)

            group_series = {name: [] for name in self.roi_groups}
            top_scores = []
            top_rois = []

            for t in range(preds.shape[0]):
                roi_scores = self.summarize_by_roi(preds[t], hemi="both_separate", mesh="fsaverage5")
                top_idx = int(np.argmax(roi_scores))
                top_score = float(roi_scores[top_idx])
                top_roi = self.roi_labels[top_idx]
                top_scores.append(top_score)
                top_rois.append(top_roi)

                for group_name, indices in self.group_indices.items():
                    group_value = float(np.mean(roi_scores[indices])) if indices else 0.0
                    group_series[group_name].append(group_value)

            peak_timestep = int(np.argmax(top_scores))
            metrics = {
                "n_timesteps": int(preds.shape[0]),
                "peak_timestep": peak_timestep,
                "peak_top_roi": top_rois[peak_timestep],
                "peak_top_roi_score": round(float(np.max(top_scores)), 4),
                "mean_top_roi_score": round(float(np.mean(top_scores)), 4),
                "peak_vertex_response": round(float(np.max(preds)), 4),
                "mean_vertex_response": round(float(np.mean(preds)), 4),
                "visual_mean": round(float(np.mean(group_series["visual"])), 4),
                "auditory_speech_mean": round(float(np.mean(group_series["auditory_speech"])), 4),
                "language_semantic_mean": round(float(np.mean(group_series["language_semantic"])), 4),
                "attention_control_mean": round(float(np.mean(group_series["attention_control"])), 4),
                "motor_somato_mean": round(float(np.mean(group_series["motor_somato"])), 4),
                "visual_peak": round(float(np.max(group_series["visual"])), 4),
                "attention_control_peak": round(float(np.max(group_series["attention_control"])), 4),
            }

            peak_brain = preds[peak_timestep]
            peak_max = float(np.max(peak_brain))
            dynamic_vmin = 0.6 if peak_max >= 0.6 else peak_max * 0.4

            fig = plt.figure(figsize=(10, 8))
            ax = fig.add_subplot(111, projection="3d")
            self.plotter.plot_surf(
                peak_brain,
                axes=ax,
                views="left",
                cmap="fire",
                norm_percentile=99,
                vmin=dynamic_vmin,
                alpha_cmap=(0, 0.2),
            )
            ax.set_title(
                f"Peak Response: {top_rois[peak_timestep]} (t={peak_timestep})",
                fontsize=11,
                fontweight="bold",
            )
            plt.tight_layout()

            buf = io.BytesIO()
            fig.savefig(buf, format="png", dpi=150, bbox_inches="tight", facecolor="white")
            plt.close(fig)
            buf.seek(0)
            heatmap_base64 = base64.b64encode(buf.read()).decode("utf-8")

        return {"metrics": metrics, "heatmap_base64": heatmap_base64}

    @modal.method()
    def analyze_thumbnail(self, image_url: str) -> dict:
        """Single-thumbnail analysis. Expects an image URL."""
        return self._analyze_image_url(
            image_url,
            timeline="thumbnail-analysis",
            subject="croissant-user",
        )

    @modal.method()
    def analyze_channel(
        self,
        channel_handle: str,
        total_videos: int = 10,
        days_old_min: int = 14,
        min_duration_sec: int = 180,
        playlist_end: int = 80,
    ) -> dict:
        import subprocess
        from datetime import datetime, timedelta, timezone

        handle = self._normalize_channel_handle(channel_handle)
        total_videos = int(total_videos)
        if total_videos < 1:
            raise ValueError("total_videos must be >= 1")

        channel_url = f"https://www.youtube.com/{handle}/videos"
        cutoff = datetime.now(timezone.utc) - timedelta(days=int(days_old_min))

        def yt_dlp_json(url: str, *, flat: bool = False):
            cmd = ["yt-dlp", "--dump-single-json", "--no-warnings"]
            if flat:
                cmd.insert(1, "--flat-playlist")
                cmd += ["--playlist-end", str(int(playlist_end))]
            cmd.append(url)
            payload = subprocess.check_output(cmd, text=True)
            return json.loads(payload)

        playlist = yt_dlp_json(channel_url, flat=True)
        entries = playlist.get("entries") or []
        video_ids = [e.get("id") for e in entries if e.get("id")]

        candidates = []
        for vid in video_ids:
            info = yt_dlp_json(f"https://www.youtube.com/watch?v={vid}")
            upload_date = info.get("upload_date")
            duration = info.get("duration")
            view_count = info.get("view_count")
            if not upload_date or duration is None or view_count is None:
                continue
            try:
                published = datetime.strptime(upload_date, "%Y%m%d").replace(tzinfo=timezone.utc)
            except Exception:
                continue
            if published > cutoff:
                continue
            if int(duration) < int(min_duration_sec):
                continue
            if int(view_count) <= 0:
                continue

            candidates.append(
                {
                    "video_id": info.get("id", vid),
                    "title": info.get("title") or vid,
                    "view_count": int(view_count),
                    "duration_sec": int(duration),
                    "published_at": published.isoformat(),
                    "thumbnail_url": info.get("thumbnail") or f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                    "webpage_url": info.get("webpage_url") or f"https://www.youtube.com/watch?v={vid}",
                }
            )

        if not candidates:
            return {
                "channel_handle": handle,
                "error": "No eligible videos found. Try reducing days_old_min/min_duration_sec or increasing playlist_end.",
            }

        candidates.sort(key=lambda x: x["view_count"], reverse=True)

        top_n = total_videos // 2 if total_videos > 1 else 1
        bottom_n = total_videos - top_n

        selected = []
        seen = set()

        for item in candidates[:top_n]:
            if item["video_id"] not in seen:
                selected.append({**item, "selection_bucket": "top_views"})
                seen.add(item["video_id"])

        for item in list(reversed(candidates))[:bottom_n]:
            if item["video_id"] not in seen:
                selected.append({**item, "selection_bucket": "low_views"})
                seen.add(item["video_id"])

        # Fill if needed
        if len(selected) < total_videos:
            for item in candidates:
                if item["video_id"] in seen:
                    continue
                selected.append({**item, "selection_bucket": "fill"})
                seen.add(item["video_id"])
                if len(selected) >= total_videos:
                    break

        results = []
        for item in selected:
            analysis = self._analyze_image_url(
                item["thumbnail_url"],
                timeline=item["video_id"],
                subject=f"channel:{handle}",
            )
            results.append({**item, **analysis})

        # Correlations (Pearson on log10 views)
        import math
        import numpy as np

        def pearsonr(x, y):
            x = np.asarray(x, dtype=float)
            y = np.asarray(y, dtype=float)
            if len(x) < 2:
                return None
            x = x - x.mean()
            y = y - y.mean()
            denom = float(np.sqrt((x * x).sum()) * np.sqrt((y * y).sum()))
            if denom == 0:
                return None
            return float((x * y).sum() / denom)

        log_views = [math.log10(max(1, r["view_count"])) for r in results]
        corr_metrics = [
            "peak_top_roi_score",
            "mean_top_roi_score",
            "visual_mean",
            "attention_control_mean",
            "language_semantic_mean",
        ]
        correlations = {
            m: pearsonr(log_views, [r["metrics"].get(m, 0) for r in results]) for m in corr_metrics
        }

        return {
            "channel_handle": handle,
            "channel_url": channel_url,
            "parameters": {
                "total_videos": total_videos,
                "days_old_min": int(days_old_min),
                "min_duration_sec": int(min_duration_sec),
                "playlist_end": int(playlist_end),
            },
            "correlations": correlations,
            "results": results,
        }


# ---------------------------------------------------------------------------
# Web endpoint for Next.js to call
# ---------------------------------------------------------------------------
@app.function(image=tribe_image, timeout=1200)
@modal.fastapi_endpoint(method="POST")
def analyze(data: dict):
    """HTTP POST endpoint. Expects JSON: {"image_url": "https://..."}."""
    try:
        payload = _extract_json_payload(data)
        image_url = payload.get("image_url") or payload.get("imageUrl")
        if not image_url:
            return {"error": "Missing image_url"}, 400

        analyzer = TribeAnalyzer()
        return analyzer.analyze_thumbnail.remote(image_url)
    except ValueError as exc:
        return {"error": str(exc)}, 400
    except Exception as exc:
        print("Modal analyze endpoint error:")
        traceback.print_exc()
        return {"error": str(exc)}, 500


@app.function(image=tribe_image, timeout=1200)
@modal.fastapi_endpoint(method="POST")
def analyze_async(data: dict):
    """
    Starts a durable Modal job and returns immediately.

    Expected JSON: {"image_url": "https://..."}
    Returns: {"job_id": "..."}.
    """
    try:
        payload = _extract_json_payload(data)
        image_url = payload.get("image_url") or payload.get("imageUrl")
        if not image_url:
            return {"error": "Missing image_url"}, 400

        analyzer = TribeAnalyzer()
        call = analyzer.analyze_thumbnail.spawn(image_url)
        return {"job_id": call.object_id}
    except ValueError as exc:
        return {"error": str(exc)}, 400
    except Exception as exc:
        print("Modal analyze_async endpoint error:")
        traceback.print_exc()
        return {"error": str(exc)}, 500


@app.function(image=tribe_image, timeout=1200)
@modal.fastapi_endpoint(method="POST")
def analyze_result(data: dict):
    """
    Fetches the result for a previously started job.

    Expected JSON: {"job_id": "..."}
    Returns:
      - {"status": "processing"} while running
      - {"status": "complete", "result": {...}} when done
      - {"status": "error", "error": "..."} on failure
    """
    try:
        payload = _extract_json_payload(data)
        job_id = payload.get("job_id") or payload.get("jobId")
        if not job_id:
            return {"error": "Missing job_id"}, 400

        # Modal returns a FunctionCall-like handle by id; `get(timeout=0)` should
        # raise if not ready (varies by runtime), which we treat as "processing".
        call = modal.FunctionCall.from_id(str(job_id))
        try:
            result = call.get(timeout=0)
        except Exception:
            return {"status": "processing"}

        return {"status": "complete", "result": result}
    except ValueError as exc:
        return {"error": str(exc)}, 400
    except Exception as exc:
        print("Modal analyze_result endpoint error:")
        traceback.print_exc()
        return {"status": "error", "error": str(exc)}, 500


@app.function(image=tribe_image, timeout=1200)
@modal.fastapi_endpoint(method="POST")
def analyze_channel(data: dict):
    """HTTP POST endpoint. Expects JSON: {"channel_handle": "@...", "total_videos": 10, ...}."""
    try:
        payload = _extract_json_payload(data)
        channel_handle = payload.get("channel_handle") or payload.get("channel") or payload.get("handle")
        if not channel_handle:
            return {"error": "Missing channel_handle"}, 400

        analyzer = TribeAnalyzer()
        return analyzer.analyze_channel.remote(
            channel_handle,
            total_videos=int(payload.get("total_videos", 10)),
            days_old_min=int(payload.get("days_old_min", 14)),
            min_duration_sec=int(payload.get("min_duration_sec", 180)),
            playlist_end=int(payload.get("playlist_end", 80)),
        )
    except ValueError as exc:
        return {"error": str(exc)}, 400
    except Exception as exc:
        print("Modal analyze_channel endpoint error:")
        traceback.print_exc()
        return {"error": str(exc)}, 500


# ---------------------------------------------------------------------------
# Local test entrypoint
# ---------------------------------------------------------------------------
@app.local_entrypoint()
def main():
    """Test with a sample thumbnail."""
    test_url = "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    print(f"Testing with: {test_url}")
    analyzer = TribeAnalyzer()
    result = analyzer.analyze_thumbnail.remote(test_url)
    print(json.dumps(result["metrics"], indent=2))
    print(f"Heatmap base64 length: {len(result['heatmap_base64'])} chars")
