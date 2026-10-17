"""Scores a finished benchmark run from its saved captions, without calling any model.

The notebook's first full run scored captions with pycocoevalcap's Java PTB tokenizer, which silently
misaligned references and images on Colab (BLIP CIDEr came out at 0.06 instead of ~1.2). This script
recomputes the reference-based metrics with a pure-Python tokenizer and refuses to report numbers
unless a human-caption sanity check passes.

Inputs (from the run folder):   blip_captions.json, gemini_captions.json, captions.json (for CLIPScore)
COCO references:                captions_val2017.json
Outputs (to results/):          results.json, results.md, examples.md, captions.json

Usage:
    pip install pycocoevalcap nltk numpy
    python rescore.py --run-dir path/to/full --coco path/to/captions_val2017.json --out results
"""
import argparse
import datetime
import json
import os
import re

import nltk
import numpy as np
from nltk.translate.meteor_score import meteor_score
from pycocoevalcap.bleu.bleu import Bleu
from pycocoevalcap.cider.cider import Cider

SEED = 42
BOOTSTRAP_SAMPLES = 2000
N_EXAMPLES = 3
MODELS = {"Gemini": "gemini", "BLIP": "blip"}

# Pure-Python stand-in for the COCO pipeline (Stanford PTBTokenizer -lowerCase + punctuation removal).
# Matches the Java tokenizer on 99.5% of this run's 1,044 captions; the rest differ only in
# abbreviation periods ("t.v." vs "t.v") and bracket tokens.
_TOKEN = re.compile(r"n't\b|'(?:s|re|ve|ll|d|m)\b|[a-z0-9]+(?:[.,:/-][a-z0-9]+)*|\S")
_PUNCT = set("'`.?!,:;-\"()[]{}") | {"''", "``", "--", "..."}


def tokenize_caption(text):
    text = text.lower().replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    text = re.sub(r"([a-z])n't\b", r"\1 n't", text)  # don't -> do n't, as PTB does
    return " ".join(t for t in _TOKEN.findall(text) if t not in _PUNCT)


def reference_metrics(gts, res):
    """Corpus BLEU-4 and CIDEr-D, plus per-image CIDEr and METEOR (NLTK), keyed by image id."""
    keys = list(gts)
    bleu, _ = Bleu(4).compute_score(gts, res, verbose=0)
    cider, cider_scores = Cider().compute_score(gts, res)
    meteor = {i: float(meteor_score([r.split() for r in gts[i]], res[i][0].split())) for i in keys}
    return (
        {"BLEU-4": float(bleu[3]), "CIDEr": float(cider), "METEOR": float(np.mean(list(meteor.values())))},
        {"CIDEr": dict(zip(keys, map(float, cider_scores))), "METEOR": meteor},
    )


def latency_stats(values):
    return {
        "mean_s": float(np.mean(values)),
        "median_s": float(np.median(values)),
        "p95_s": float(np.percentile(values, 95)),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--run-dir", required=True, help="folder with blip_captions.json, gemini_captions.json, captions.json")
    parser.add_argument("--coco", required=True, help="path to COCO captions_val2017.json")
    parser.add_argument("--out", default="results", help="output folder")
    parser.add_argument("--gemini-model", default="gemini-3.1-flash-lite")
    args = parser.parse_args()

    for resource in ["wordnet", "omw-1.4"]:
        nltk.download(resource, quiet=True)

    load = lambda name: json.load(open(os.path.join(args.run_dir, name), encoding="utf8"))
    raw = {"BLIP": load("blip_captions.json"), "Gemini": load("gemini_captions.json")}
    raw = {m: {int(k): v for k, v in r.items()} for m, r in raw.items()}
    run_rows = {row["image_id"]: row for row in load("captions.json")}

    coco = json.load(open(args.coco, encoding="utf8"))
    file_names = {img["id"]: img["file_name"] for img in coco["images"]}
    references = {}
    for ann in coco["annotations"]:
        references.setdefault(ann["image_id"], []).append(ann["caption"].strip())

    sampled = list(raw["BLIP"])  # BLIP captions every sampled image
    eval_ids = [i for i in sampled if raw["Gemini"].get(i, {}).get("caption") and i in run_rows]
    captions = {m: {i: raw[m][i]["caption"] for i in eval_ids} for m in MODELS}
    gts = {i: [tokenize_caption(c) for c in references[i]] for i in eval_ids}

    # Sanity check: a held-out human caption scored against the other references. On COCO this lands
    # around CIDEr 0.8-1.0; a broken pipeline (e.g. misaligned references) scores near 0.
    human_gts = {i: gts[i][1:] for i in eval_ids}
    human_res = {i: [gts[i][0]] for i in eval_ids}
    human_metrics, _ = reference_metrics(human_gts, human_res)
    print("Human baseline (1 reference vs the other 4):", {k: round(v, 3) for k, v in human_metrics.items()})
    if human_metrics["CIDEr"] < 0.5:
        raise SystemExit("Sanity check failed: human CIDEr is implausibly low, the scoring pipeline is broken.")

    metrics, per_image = {}, {}
    for model_name, key in MODELS.items():
        res = {i: [tokenize_caption(captions[model_name][i])] for i in eval_ids}
        metrics[model_name], per_image[model_name] = reference_metrics(gts, res)
        # CLIPScore was computed in the notebook from the image itself, so it is unaffected by tokenization
        per_image[model_name]["CLIPScore"] = {i: run_rows[i][key]["CLIPScore"] for i in eval_ids}
        metrics[model_name]["CLIPScore"] = float(np.mean(list(per_image[model_name]["CLIPScore"].values())))
        metrics[model_name]["avg_words"] = float(np.mean([len(captions[model_name][i].split()) for i in eval_ids]))
        metrics[model_name]["latency"] = latency_stats([raw[model_name][i]["latency_s"] for i in eval_ids])
        print(model_name, {k: round(v, 3) for k, v in metrics[model_name].items() if k != "latency"})

    rng = np.random.default_rng(SEED)
    comparisons = {}
    for metric_name in ["CIDEr", "METEOR", "CLIPScore"]:
        diffs = np.array([per_image["Gemini"][metric_name][i] - per_image["BLIP"][metric_name][i] for i in eval_ids])
        boot = [diffs[rng.integers(0, len(diffs), len(diffs))].mean() for _ in range(BOOTSTRAP_SAMPLES)]
        low, high = np.percentile(boot, [2.5, 97.5])
        comparisons[metric_name] = {
            "mean_diff_gemini_minus_blip": float(diffs.mean()),
            "ci95": [float(low), float(high)],
            "gemini_win_rate": float((diffs > 0).mean()),
        }

    ref_avg_words = float(np.mean([len(c.split()) for i in eval_ids for c in references[i]]))
    gemini_failed = sum(1 for i in sampled if not raw["Gemini"].get(i, {}).get("caption"))
    gemini_retries = sum(raw["Gemini"][i].get("attempts", 1) - 1 for i in eval_ids)
    results = {
        "scored_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "dataset": "COCO val2017",
        "seed": SEED,
        "n_sampled": len(sampled),
        "n_evaluated": len(eval_ids),
        "models": {
            "Gemini": {"id": args.gemini_model, "prompt": "Write a one-sentence caption that describes this image.", "temperature": 0.0},
            "BLIP": {"id": "Salesforce/blip-image-captioning-base", "generation": {"num_beams": 3, "max_length": 30, "min_length": 5}},
        },
        "scoring": {
            "tokenizer": "pure-Python PTB-style (lowercase, clitic split, punctuation removed)",
            "bleu_cider": "pycocoevalcap (BLEU-4 corpus, CIDEr-D)",
            "meteor": "nltk.translate.meteor_score, mean of per-image scores",
            "clipscore": "100 * max(cos, 0), openai/clip-vit-base-patch32, computed in the notebook",
        },
        "human_baseline": human_metrics,
        "metrics": metrics,
        "paired_comparison": comparisons,
        "gemini": {"retries": gemini_retries, "failed_images": gemini_failed},
        "reference_avg_words": ref_avg_words,
    }

    os.makedirs(args.out, exist_ok=True)
    with open(os.path.join(args.out, "results.json"), "w", encoding="utf8") as f:
        json.dump(results, f, indent=2)

    fmt_ci = lambda c: f"{c['mean_diff_gemini_minus_blip']:+.3f} [{c['ci95'][0]:+.3f}, {c['ci95'][1]:+.3f}]"
    lines = [
        "# Captioning benchmark results",
        "",
        f"COCO val2017: {len(eval_ids)} images (random sample, seed {SEED}), 5 human reference captions each.",
        "",
        "| Model | BLEU-4 | METEOR | CIDEr | CLIPScore | Avg. words | Median latency | p95 latency |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for model_name in ["Gemini", "BLIP"]:
        m = metrics[model_name]
        lines.append(
            f"| {model_name} (`{results['models'][model_name]['id']}`) | {m['BLEU-4']:.3f} | {m['METEOR']:.3f} | {m['CIDEr']:.3f} "
            f"| {m['CLIPScore']:.2f} | {m['avg_words']:.1f} | {m['latency']['median_s']:.2f} s | {m['latency']['p95_s']:.2f} s |"
        )
    h = human_metrics
    lines += [
        f"| *Human (1 reference vs the other 4)* | {h['BLEU-4']:.3f} | {h['METEOR']:.3f} | {h['CIDEr']:.3f} | n/a | {ref_avg_words:.1f} | n/a | n/a |",
        "",
        "**Paired difference (Gemini − BLIP), mean per image with 95% bootstrap CI**",
        "",
        "| Metric | Δ [95% CI] | Gemini better on |",
        "|---|---|---|",
        *[f"| {name} | {fmt_ci(c)} | {c['gemini_win_rate']:.0%} of images |" for name, c in comparisons.items()],
        "",
        "BLIP latency is local inference on a Tesla T4 GPU; Gemini latency is one API round trip on the free tier "
        f"({gemini_retries} retried requests, {gemini_failed} image with no caption). METEOR is NLTK's implementation.",
    ]
    with open(os.path.join(args.out, "results.md"), "w", encoding="utf8") as f:
        f.write("\n".join(lines) + "\n")
    print("\n".join(lines))

    cider_diff = {i: per_image["Gemini"]["CIDEr"][i] - per_image["BLIP"]["CIDEr"][i] for i in eval_ids}
    ranked = sorted(eval_ids, key=cider_diff.get)
    ex = ["# Where the models disagree most (per-image CIDEr)", ""]
    for title, ids in [("BLIP scores much higher", ranked[:N_EXAMPLES]), ("Gemini scores much higher", ranked[::-1][:N_EXAMPLES])]:
        ex += [f"## {title}", ""]
        for i in ids:
            ex += [f"### COCO image {i}", "", f"![COCO {i}](http://images.cocodataset.org/val2017/{file_names[i]})", ""]
            for model_name in ["Gemini", "BLIP"]:
                p = per_image[model_name]
                ex.append(f"- **{model_name}:** {captions[model_name][i]}  (CIDEr {p['CIDEr'][i]:.2f}, CLIPScore {p['CLIPScore'][i]:.1f})")
            ex += ["- **References:**", *[f"  - {r}" for r in references[i]], ""]
    with open(os.path.join(args.out, "examples.md"), "w", encoding="utf8") as f:
        f.write("\n".join(ex))

    with open(os.path.join(args.out, "captions.json"), "w", encoding="utf8") as f:
        json.dump(
            [
                {
                    "image_id": i,
                    "file_name": file_names[i],
                    "references": references[i],
                    **{
                        key: {"caption": captions[m][i], **{k: per_image[m][k][i] for k in ["CIDEr", "METEOR", "CLIPScore"]}}
                        for m, key in MODELS.items()
                    },
                }
                for i in eval_ids
            ],
            f,
            indent=2,
        )
    print("\nWrote", sorted(os.listdir(args.out)))


if __name__ == "__main__":
    main()
