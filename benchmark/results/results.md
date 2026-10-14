# Captioning benchmark results

COCO val2017: 149 images (random sample, seed 42), 5 human reference captions each.

| Model | BLEU-4 | METEOR | CIDEr | CLIPScore | Avg. words | Median latency | p95 latency |
|---|---|---|---|---|---|---|---|
| Gemini (`gemini-3.1-flash-lite`) | 0.131 | 0.494 | 0.386 | 34.01 | 18.8 | 2.49 s | 5.92 s |
| BLIP (`Salesforce/blip-image-captioning-base`) | 0.348 | 0.497 | 1.213 | 29.40 | 8.4 | 0.24 s | 0.32 s |
| *Human (1 reference vs the other 4)* | 0.217 | 0.469 | 1.020 | n/a | 10.4 | n/a | n/a |

**Paired difference (Gemini − BLIP), mean per image with 95% bootstrap CI**

| Metric | Δ [95% CI] | Gemini better on |
|---|---|---|
| CIDEr | -0.828 [-0.974, -0.692] | 13% of images |
| METEOR | -0.003 [-0.035, +0.031] | 50% of images |
| CLIPScore | +4.610 [+4.011, +5.221] | 93% of images |

BLIP latency is local inference on a Tesla T4 GPU; Gemini latency is one API round trip on the free tier (4 retried requests, 1 image with no caption). METEOR is NLTK's implementation.
