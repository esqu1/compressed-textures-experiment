#!/bin/bash
mkdir -p generated-assets

ktx create --format ASTC_12x12_SRGB_BLOCK capybara-4k.png generated-assets/capybara-4k-quality-3.ktx2 --astc-quality medium
ktx create --format ASTC_12x12_SRGB_BLOCK capybara-4k.png generated-assets/capybara-4k-quality-2.ktx2 --astc-quality fast
ktx create --format ASTC_12x12_SRGB_BLOCK capybara-4k.png generated-assets/capybara-4k-quality-1.ktx2 --astc-quality fastest

ktx create --format ASTC_12x12_SRGB_BLOCK capybara.png generated-assets/capybara-quality-3.ktx2 --astc-quality medium
ktx create --format ASTC_12x12_SRGB_BLOCK capybara.png generated-assets/capybara-quality-2.ktx2 --astc-quality fast
ktx create --format ASTC_12x12_SRGB_BLOCK capybara.png generated-assets/capybara-quality-1.ktx2 --astc-quality fastest

esbuild index.ts --bundle --outfile=index.js --watch=forever &
python3 -m http.server 4004
