#!/bin/bash
# Simple build script to bypass Astro build hanging issue

set -e

echo "Starting simple build..."

# Clean dist directory
rm -rf dist
mkdir -p dist

# Copy static assets
cp -r public/* dist/ 2>/dev/null || true

# Create simple HTML files for each route
# This is a workaround until Astro build issue is resolved

# Vietnamese routes
routes_vi=(
  "/"
  "/ai-computer/"
  "/how-it-works/"
  "/agents/"
  "/super-apps/"
  "/models/"
  "/command-packs/"
  "/plans/"
  "/personal/"
  "/family/"
  "/creator/"
  "/founder/"
  "/business/"
  "/enterprise/"
  "/network/"
  "/heritage/"
  "/chapter/"
  "/security/"
  "/trust/"
  "/terms/"
  "/privacy/"
  "/docs/"
  "/research/"
  "/about/"
  "/contact/"
  "/invest/"
  "/academy/"
)

# English routes
routes_en=(
  "/en/"
  "/en/ai-computer/"
  "/en/how-it-works/"
  "/en/agents/"
  "/en/super-apps/"
  "/en/models/"
  "/en/command-packs/"
  "/en/plans/"
  "/en/personal/"
  "/en/family/"
  "/en/creator/"
  "/en/founder/"
  "/en/business/"
  "/en/enterprise/"
  "/en/network/"
  "/en/heritage/"
  "/en/chapter/"
  "/en/security/"
  "/en/trust/"
  "/en/terms/"
  "/en/privacy/"
  "/en/docs/"
  "/en/research/"
  "/en/about/"
  "/en/contact/"
  "/en/invest/"
  "/en/academy/"
)

# Create HTML files
for route in "${routes_vi[@]}"; do
  if [ "$route" = "/" ]; then
    filename="dist/index.html"
  else
    filename="dist${route}index.html"
    mkdir -p "$(dirname "$filename")"
  fi

  cat > "$filename" << EOF
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nguyen AI Computer - Máy Tính AI cho thế hệ Nguyễn toàn cầu</title>
  <meta name="description" content="Nguyen AI Computer là dòng Máy Tính AI đám mây chuyên biệt cho cá nhân, gia đình, nhà sáng lập, doanh nghiệp và cộng đồng Nguyễn toàn cầu.">
  <link rel="canonical" href="https://nguyenai.net${route}">
</head>
<body>
  <h1>Nguyen AI Computer</h1>
  <p>Máy Tính AI cho thế hệ Nguyễn toàn cầu.</p>
  <p><a href="https://app.nguyenai.net">Đăng nhập Console</a></p>
  <p><a href="https://edu.nguyenai.net">Học tại Academy</a></p>
  <p><a href="https://invest.nguyenai.net">Đầu tư</a></p>
  <p>Route: ${route}</p>
</body>
</html>
EOF
  echo "Created: $filename"
done

for route in "${routes_en[@]}"; do
  filename="dist${route}index.html"
  mkdir -p "$(dirname "$filename")"

  cat > "$filename" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nguyen AI Computer - AI Computer for the global Nguyen community</title>
  <meta name="description" content="Nguyen AI Computer is a specialized cloud AI Computer line for individuals, families, founders, businesses, and the global Nguyen community.">
  <link rel="canonical" href="https://nguyenai.net${route}">
</head>
<body>
  <h1>Nguyen AI Computer</h1>
  <p>AI Computer for the global Nguyen community.</p>
  <p><a href="https://app.nguyenai.net">Login to Console</a></p>
  <p><a href="https://edu.nguyenai.net">Learn at Academy</a></p>
  <p><a href="https://invest.nguyenai.net">Invest</a></p>
  <p>Route: ${route}</p>
</body>
</html>
EOF
  echo "Created: $filename"
done

echo "Build complete! Created $(find dist -name '*.html' | wc -l) HTML files."
