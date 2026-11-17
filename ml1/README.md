# ML1: Body Reconstruction (CameraHMR + SMPL-X)

Owner: Niya Traynham

This folder holds the ML1 code for the Twin Worker: four photos (front, back, left, right) go in, and one SMPL-X body comes out as OBJ and GLB files, with its shape parameters (betas) saved as JSON.

## Status (Sprint 2)

| Step | Status |
|---|---|
| Photo to CameraHMR to 16 SMPL-X betas | Working |
| Choose the target person (largest bounding box, not detection 0) | Working |
| One JSON file per photo (`front_body_data.json`, and so on) | Working |
| Process all four views in one run | Working (overlay renderer disabled; it crashed on Windows) |
| Saved betas to T-pose body, exported as OBJ and GLB | Working |
| Average the four views into one set of betas | In progress |
| Scale to user height, measurements, `body.json` | Next |

## Files

| File | What it does |
|---|---|
| `cameraHMR_ml1_changes.patch` | Our changes to CameraHMR: person selection, per-image JSON, Windows fixes |
| `load_body_data.py` | Loads saved betas from JSON, builds the SMPL-X body, exports OBJ and GLB |

## Setup

1. Clone CameraHMR next to this repository (not inside it) and follow its own install steps, including downloading the model files from the official sites under your own license:
   ```
   git clone https://github.com/pixelite1201/CameraHMR.git
   ```
2. Apply our changes from inside the CameraHMR folder:
   ```
   git apply ../Digital-Twin-for-Clothing-dev/ml1/cameraHMR_ml1_changes.patch
   ```
3. Copy `load_body_data.py` into the CameraHMR folder.

## Run

Put four photos named `front`, `back`, `left` and `right` in one folder, then:

```
python demo.py --image_folder my_views --output_folder output_my_views --model_type smplx
python load_body_data.py
```

The first command writes one `<view>_body_data.json` per photo and one posed OBJ per photo. The second rebuilds a body from saved betas and writes `saved_betas_body.obj` and `saved_betas_body.glb`, which the browser viewer can load.

## Windows changes in the patch

- Detectron2 runs on the CPU (the 8 GB laptop GPU ran out of memory).
- The forced EGL setting is commented out in both renderer files.
- DataLoader `num_workers=0` (more workers exhausted the paging file).
- The overlay renderer is commented out: it crashed the process after the first image, so only one photo was ever processed.

## Not in this repository

Model files (`.ckpt`, `.pkl`, `.npz`) are licensed and too large for GitHub. Photos of people and the body data made from them stay on the local machine. Test only with consented photos or synthetic data.
