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

## Metrics

| Metric | What it measures | Uses references? |
|---|---|---|
| **BLEU-4** | Fraction of 1- to 4-word phrases in the caption that also appear in the references (geometric mean), with a penalty for captions shorter than the references. From machine translation. | Yes |
| **METEOR** | Matches words exactly, by stem or by synonym, combines precision and recall (weighted towards recall), and penalises scrambled word order. | Yes |
| **CIDEr** | Represents captions as TF-IDF-weighted n-gram vectors and takes the cosine similarity with each reference. Words that are rare across the dataset (*giraffe*) count far more than common ones (*a*, *is*). Built for captioning; COCO leaderboards rank by it. | Yes |
| **CLIPScore** | Cosine similarity between the CLIP embedding of the image and the CLIP embedding of the caption: does the caption describe *this image*? torchmetrics reports `100 × max(cos, 0)`. | **No** |
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

## Results

*Not run yet.* This section will contain the measured numbers from `results/results.md` and a short analysis.
