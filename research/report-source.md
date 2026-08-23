# Internal research synthesis and claim ledger

## Decision

Build a cadence/cloud injection–recovery benchmark rather than another spectral retrieval or planet mapper.

## Primary evidence

1. NASA ExoPAG findings state that whole-disk Earth data are incomplete at some HWO-relevant visible wavelengths, lower illumination phases, and multi-rotation weather baselines: https://science.nasa.gov/astrophysics/programs/exep/exopag/resources/founding-documents-findings/
2. Jiang et al. use more than two years of DSCOVR data to infer rotation, clouds, surface and cadence: https://arxiv.org/abs/1805.05834
3. Fan et al. demonstrate two-dimensional mapping from point-source Earth light curves: https://arxiv.org/abs/1908.04350
4. Gu et al. find cloud components dominate much of the disk-integrated variance while finer land subtypes are extremely weak: https://arxiv.org/abs/2012.10556
5. Mettler et al. show that one rotation very poorly constrains the surface of a partially cloudy planet: https://academic.oup.com/mnras/article/511/1/440/6501216
6. Lustig-Yaeger et al. show multi-phase mapping can distinguish ocean glint from clouds under favorable assumptions: https://arxiv.org/abs/1901.05011

## Claim ledger

| Claim | Support | Confidence | Implementation consequence |
|---|---|---:|---|
| weather can dominate disk-integrated variability | Gu et al. | high | correlated clouds are a first-class control |
| one rotation is inadequate for robust mapping | Mettler et al. | high | warn below two rotations |
| phase diversity is important for glint | Lustig-Yaeger et al. | medium-high | include phase/glint leverage but label reduced physics |
| a community Earth-data gap exists for HWO planning | NASA ExoPAG | high | position as precursor benchmark |
| no exact open browser benchmark was found | targeted GitHub/software search | medium | claim a narrow workflow contribution, not absolute novelty |

## Competing-tool boundary

VPL Earth models, starry, skyscapes, POSEIDON, and published sparse-mapping algorithms address richer forward or inverse problems. This project does not duplicate them. It supplies a transparent pre-retrieval identifiability check.
