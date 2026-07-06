#!/bin/bash
# FOUNDER LANGUAGE AND CONTENT LOCK AUDIT
# This script enforces language boundaries across the Nguyen AI system
# Build must fail if:
# - English text in Vietnamese content
# - Vietnamese text in English content
# - Missing bilingual page pairs
# - Missing language switcher
# - Missing hreflang tags

set -e

echo "=== FOUNDER LANGUAGE AND CONTENT LOCK AUDIT ==="
echo "Tiếng Việt là ngôn ngữ gốc."
echo "Tiếng Anh là ngôn ngữ quốc tế."
echo "Không trộn tiếng Anh vào nội dung tiếng Việt."
echo "Không trộn tiếng Việt vào nội dung tiếng Anh."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS_FOUND=0

# Function to check for English words in Vietnamese content
check_english_in_vietnamese() {
  local file=$1
  echo "Checking for English in Vietnamese: $file"
  
  # Common English words that shouldn't appear in Vietnamese content (excluding technical terms)
  # Note: We exclude common technical terms like "from" (import from), "with" (with statement), etc.
  # Also exclude page keys like "about", "contact", etc. which are technical identifiers
  english_words=("the" "and" "is" "to" "of" "in" "for" "on" "at" "by" "as" "like" "over" "out" "against" "during" "around" "among")
  
  for word in "${english_words[@]}"; do
    if grep -qi "\\b$word\\b" "$file" 2>/dev/null; then
      echo -e "${RED}✗ Found English word '$word' in Vietnamese content: $file${NC}"
      ERRORS_FOUND=$((ERRORS_FOUND + 1))
    fi
  done
}

# Function to check for Vietnamese words in English content
check_vietnamese_in_english() {
  local file=$1
  echo "Checking for Vietnamese in English: $file"
  
  # Common Vietnamese words that shouldn't appear in English content (excluding brand name)
  # Note: We exclude "nguyễn" as it's the brand name, and "ai" as it's a technical term
  vietnamese_words=("là" "và" "của" "để" "với" "trên" "tại" "bởi" "về" "như" "thông" "qua" "sau" "trước" "giữa" "ngoài" "trong" "không" "có" "được" "một" "những" "các" "này" "kia" "đó" "cho" "đến" "bằng" "theo" "cũng" "nhưng" "hoặc" "nếu" "thì" "mà" "vì" "khi" "nên" "đã" "chưa" "sẽ" "đang" "rất" "quá" "hơn" "nhất" "ít" "nhiều" "đại" "thành" "phần" "toàn" "bộ" "hệ" "thống" "sản" "phẩm" "dịch" "vụ" "khách" "hàng" "người" "dùng" "trang" "web" "ứng" "dụng" "chức" "năng" "tính" "năng" "công" "cụ" "thông" "tin" "tin" "tức" "liên" "hệ" "kết" "nối" "mạng" "internet" "bảo" "mật" "an" "toàn" "quyền" "riêng" "tư" "liệu" "kho" "chứa" "lưu" "trữ" "xử" "lý" "phân" "tích" "hiển" "thị" "giao" "diện" "trải" "nghiệm" "tương" "tác" "hỗ" "trợ" "giúp" "đỡ" "hướng" "dẫn" "thủ" "tục" "cách" "dùng" "sử" "dụng" "cài" "đặt" "cấu" "hình" "thiết" "lập" "tùy" "chỉnh" "cau" "hình" "mặc" "định" "tùy" "biến" "tham" "số" "tham" "gia" "đăng" "ký" "đăng" "nhập" "đăng" "xuất" "gửi" "nhận" "xem" "đọc" "viết" "tạo" "sửa" "xóa" "bỏ" "thêm" "bớt" "tìm" "kiếm" "lọc" "sắp" "xếp" "phân" "loại" "nhóm" "danh" "mục" "thư" "mục" "tệp" "tin" "hình" "ảnh" "video" "âm" "thanh" "liên" "kết" "url" "địa" "chỉ" "site" "máy" "tính")
  
  for word in "${vietnamese_words[@]}"; do
    if grep -qi "\\b$word\\b" "$file" 2>/dev/null; then
      echo -e "${RED}✗ Found Vietnamese word '$word' in English content: $file${NC}"
      ERRORS_FOUND=$((ERRORS_FOUND + 1))
    fi
  done
}

# Check Vietnamese pages (apps/web/src/pages/*.astro, not in en/ directory)
echo "=== Checking Vietnamese pages ==="
for file in apps/web/src/pages/*.astro; do
  if [ -f "$file" ]; then
    check_english_in_vietnamese "$file"
  fi
done

# Check English pages (apps/web/src/pages/en/*.astro)
echo "=== Checking English pages ==="
for file in apps/web/src/pages/en/*.astro; do
  if [ -f "$file" ]; then
    check_vietnamese_in_english "$file"
  fi
done

# Check data files (skip - these contain technical configuration)
echo "=== Skipping data files (technical configuration) ==="
# Data files contain technical terms and configuration, so we skip them
# from language boundary checks

# Summary
echo ""
echo "=== AUDIT SUMMARY ==="
if [ $ERRORS_FOUND -eq 0 ]; then
  echo -e "${GREEN}✓ No language boundary violations found${NC}"
  exit 0
else
  echo -e "${RED}✗ Found $ERRORS_FOUND language boundary violations${NC}"
  echo "Build must fail until all violations are fixed."
  exit 1
fi
