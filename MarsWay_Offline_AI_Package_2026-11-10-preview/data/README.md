# Offline Mars dust model training data

The first offline risk model is trained from the Mars Dust Storm Sequence Dataset (MDSSD), Version 6. The labels describe storm locations and extents manually identified from MRO MARCI daily global maps. The release covers selected observing phases in Mars years 28–34, with updates through 2024-11-26. It is a historical climatology sample, not a current Mars weather feed.

The source files and original compressed sequences are retained here:

- `mdssd.txt` — storm-centroid observations, area, Mars solar longitude, and confidence.
- `*_data.tar.gz` — original regional image-label sequences supplied with MDSSD.
- `mars-dust-mdssd-metadata.json` — public Harvard Dataverse API metadata and file checksums.
- `readme_mdssd_202406.pdf` — dataset usage notes.
- `nasa_mcs_2025073116_DDR.LBL` and `.TAB` — one four-hour MRO Mars Climate Sounder derived-data block from 2025-07-31, containing 1,183 profiles. `nasa_mcs_DDR1.FMT` defines its 1,652-column record layout, including solar longitude, profile position, temperature, dust-column opacity, and pressure. It is included as a recent NASA PDS source sample; the current model trainer does not yet ingest this profile table as a storm label.

## Rebuild the model

From the repository root, run:

```sh
npm run train:dust-model
```

This writes `src/data/offlineDustRiskModel.ts`. The trainer holds out the latest Mars year in the label set (MY 34) for a basic leakage check, then fits the compact frequency table used for inference. It filters observations below confidence level 2 and uses storm area to mark coarse spatial cells. The table resolution is 5° latitude × 10° longitude × 15° solar longitude. The current run used 2,507 training map-days and 52 validation map-days. On the held-out cells, Brier score was 0.13418; at a 0.10 risk threshold, precision was 0.8365 and recall was 0.2820. At 0.05, precision was 0.5140 and recall was 0.6548. This coarse model favors neither a guaranteed detection nor a route safety claim; it needs more labeled seasons and sensor-matched labels before operational use.

## Sources

- Saidel, M. et al. (2022; Version 6 released 2024), *Mars Dust Storm Sequence Dataset (MDSSD)*, Harvard Dataverse, DOI: https://doi.org/10.7910/DVN/0XB6KN. Dataset licence: CC0 1.0.
- Wang, H., Battalio, M. J., & Huber, Z. (2023), *MRO MARCI Mars Daily Global Maps*, NASA Planetary Data System, DOI: https://doi.org/10.17189/x8jj-8326.
- McCleese & Schofield, *MRO Mars Climate Sounder Level 5 DDR v6.2*, NASA Planetary Data System, DOI: https://doi.org/10.17189/6khc-s052. Archive documentation: https://atmos.nmsu.edu/data_and_services/atmospheres_data/MARS/aerosols.html.
