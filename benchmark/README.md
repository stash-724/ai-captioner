# Captioning benchmark: Gemini vs BLIP on COCO

This benchmark compares a general-purpose multimodal LLM with a dedicated captioning model on the
same images, using the standard captioning metrics plus a reference-free one.

| | Gemini Flash-Lite | BLIP base |
|---|---|---|
| Model | `gemini-3.1-flash-lite` | `Salesforce/blip-image-captioning-base` |
| Kind | General multimodal LLM, prompted | Captioning model (ViT encoder + text decoder) fine-tuned on COCO |
| Runs on | Google API (network) | Local GPU |
| Settings | Prompt *"Write a one-sentence caption that describes this image."*, temperature 0 | Beam search: 3 beams, length 5–30 tokens |

## Method

1. Sample **150 images from COCO val2017** with a fixed seed (42). Each has 5 human reference captions.
2. Caption every image with both models. Gemini gets the same neutral prompt for every image, with no
   tone, so its style is as close as possible to COCO's plain descriptions.
3. Score both models on the images where both returned a caption (a paired comparison).
4. Report a 95% paired bootstrap confidence interval for each difference, so we can tell a real gap from noise.
5. As a sanity check, score one human reference caption against the other four. A correct pipeline puts
   humans around CIDEr 0.8–1.0 on COCO; the scoring refuses to report results if it doesn't.

## Metrics

| Metric | What it measures | Uses references? |
|---|---|---|
| **BLEU-4** | Fraction of 1- to 4-word phrases in the caption that also appear in the references (geometric mean), with a penalty for captions shorter than the references. From machine translation. | Yes |
| **METEOR** | Matches words exactly, by stem or by synonym, combines precision and recall (weighted towards recall), and penalises scrambled word order. Computed with NLTK's implementation, whose values run higher than the official COCO METEOR, so they are not comparable with published numbers. | Yes |
| **CIDEr** | Represents captions as TF-IDF-weighted n-gram vectors and takes the cosine similarity with each reference. Words that are rare across the dataset (*giraffe*) count far more than common ones (*a*, *is*). Built for captioning; COCO leaderboards rank by it. | Yes |
| **CLIPScore** | Cosine similarity between the CLIP embedding of the image and the CLIP embedding of the caption: does the caption describe *this image*? Reported as `100 × max(cos, 0)` (computed with Hugging Face `CLIPModel`, ViT-B/32). | **No** |
| **Latency** | Wall-clock time per caption. BLIP is local GPU inference; Gemini includes the network round trip and the free tier's queueing, so the two are not like-for-like. | n/a |

The reference-based metrics reward phrasing captions the way COCO's annotators did: short, plain,
"A man riding a bike down a street." CLIPScore ignores phrasing and checks whether the caption fits the
image. Comparing the two families is the point of the benchmark.

## Caveats to keep in mind

- **BLIP has a home advantage on the reference metrics.** It was fine-tuned on COCO captions, so it writes
  in exactly the style the references use. COCO's 2017 validation images come from the 2014 validation set,
  parts of which are commonly used for training in the Karpathy split. Some sampled images may therefore
  have been seen by BLIP during fine-tuning. Gemini was not tuned for COCO's style.
- **150 images is a small sample.** The confidence intervals show how much the averages could move.
- **CIDEr depends on the evaluated set**, because its IDF weights come from the references of the sampled
  images. Scores are comparable between the two models here, not with published leaderboard numbers.
- **Gemini is a moving target.** The API model can change over time; the run date is recorded in `results.json`.

## How to run (Google Colab, free GPU)

1. Open `caption_benchmark.ipynb` in Colab (*File → Upload notebook*, or open it from GitHub).
2. *Runtime → Change runtime type → T4 GPU*.
3. In the 🔑 *Secrets* panel add `GEMINI_API_KEY` and enable notebook access.
4. Run all cells with `SMOKE_TEST = True` (5 images, a few minutes) to check the pipeline.
5. Set `SMOKE_TEST = False` and run all cells again for the full benchmark.

Gemini captions are cached after every request. Set `USE_DRIVE = True` to keep the cache on Google Drive (optional; it asks for broad Drive permissions). If the daily
free quota runs out, run the notebook again later and it continues from where it stopped.

The outputs (`results.json`, `results.md`, `examples.md`, `captions.json`) go into `results/` in this folder.

To rescore saved captions without calling any model (for example after changing a metric):

```bash
pip install pycocoevalcap nltk numpy
python rescore.py --run-dir results --coco path/to/captions_val2017.json --out results
```

## Results

Run on 14 October 2026: 149 of the 150 sampled images (Gemini returned an empty response for one), Tesla T4 GPU on Colab.
Full numbers in [`results/results.md`](results/results.md), per-image scores in [`results/captions.json`](results/captions.json).

| Model | BLEU-4 | METEOR | CIDEr | CLIPScore | Avg. words | Median latency | p95 latency |
|---|---|---|---|---|---|---|---|
| Gemini (`gemini-3.1-flash-lite`) | 0.131 | 0.494 | 0.386 | **34.01** | 18.8 | 2.49 s | 5.92 s |
| BLIP (`blip-image-captioning-base`) | **0.348** | 0.497 | **1.213** | 29.40 | 8.4 | **0.24 s** | **0.32 s** |
| *Human (1 reference vs the other 4)* | 0.217 | 0.469 | 1.020 | n/a | 10.4 | n/a | n/a |

**Paired difference, Gemini − BLIP** (mean per image, 95% bootstrap confidence interval):

| Metric | Δ [95% CI] | Gemini better on |
|---|---|---|
| CIDEr | −0.828 [−0.974, −0.692] | 13% of images |
| METEOR | −0.003 [−0.035, +0.031] | 50% of images |
| CLIPScore | +4.61 [+4.01, +5.22] | 93% of images |

### What the numbers say

**The two metric families disagree, and both differences are real.** Neither CIDEr's nor CLIPScore's
confidence interval comes near zero.

- **On the reference metrics, BLIP wins clearly.** It scores 3× Gemini's CIDEr and 2.7× its BLEU-4, and
  it even beats the human baseline on CIDEr (1.21 vs 1.02). That isn't BLIP describing images better than
  people. It was fine-tuned on COCO, so it reproduces the *consensus* wording of COCO's annotators
  ("a man riding a motorcycle on the beach"), which is exactly what CIDEr rewards.
- **On CLIPScore, Gemini wins on 93% of images.** It names more of what's actually there. Its captions are
  more than twice as long (18.8 words vs 8.4; humans write 10.4), and every extra detail that isn't in the
  references costs n-gram precision.
- **METEOR can't separate them** (Δ −0.003, interval spans zero). Its recall weighting and synonym matching
  partly offset Gemini's length penalty.

### Where they disagree most

| Image | Gemini | BLIP |
|---|---|---|
| [207306](http://images.cocodataset.org/val2017/000000207306.jpg) | "A plush teddy bear dressed in a striped prisoner costume sits atop a city trash can on a New York street corner." CIDEr 0.40 | "a white teddy bear sitting on a trash can" CIDEr 4.11 |
| [252216](http://images.cocodataset.org/val2017/000000252216.jpg) | "A white horse and a llama stand together in a sunny, grassy field." CIDEr 1.61 | "two white horses standing next to each other horses" CIDEr 0.63 |
| [430875](http://images.cocodataset.org/val2017/000000430875.jpg) | "A set of traffic lights glows green against a twilight sky." CIDEr 0.94 | "the sky is clear" CIDEr 0.16 |

The first row is typical of BLIP's wins: Gemini is more specific, but the references are short. The other
two show BLIP's failure modes, which the averages hide: misidentifying an object (a llama as a horse) and
missing the subject entirely. More in [`results/examples.md`](results/examples.md).

### Latency

BLIP takes a median 0.24 s per image on a T4 GPU; Gemini takes 2.49 s per API call on the free tier
(p95 5.9 s), timed on the successful request; 4 requests first had to be retried after "model overloaded" errors. These aren't
like-for-like (local GPU vs a network round trip to a shared service), but they're what each option
costs in practice.

### Takeaways for the app

- **Benchmark choice decides the winner.** Reference-based metrics measure conformity to a dataset's style;
  a reference-free metric like CLIPScore measures fit to the image. Reporting only one would tell half the story.
- **Gemini fits AI Captioner better.** The app's point is styled captions (witty, poetic…), which needs
  instruction following that BLIP doesn't have, and Gemini's captions describe the image more fully.
- **BLIP would be a good fallback.** It's fast, free and runs locally, so it could caption when the Gemini
  API is overloaded (which happened 4 times in 150 requests).

### Caveat: how the scoring was validated

The first scoring pass used pycocoevalcap's Java tokenizer, which on Colab silently paired references with
the wrong images. BLIP's CIDEr came out at 0.06, far below the ~1.2 expected. The captions themselves were
correct, so they were rescored offline with [`rescore.py`](rescore.py): a pure-Python tokenizer (identical
to the Java one on 99.5% of these 1,044 captions) plus the human-baseline check above, which now runs
before any result is reported. CLIPScore and latency never went through the tokenizer and are unchanged
from the original run.
