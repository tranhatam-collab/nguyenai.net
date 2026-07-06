import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routes = [
  // Vietnamese
  { path: '/', lang: 'vi', title: 'Nguyen AI Computer - Máy Tính AI cho thế hệ Nguyễn toàn cầu', desc: 'Nguyen AI Computer là dòng Máy Tính AI đám mây chuyên biệt cho cá nhân, gia đình, nhà sáng lập, doanh nghiệp và cộng đồng Nguyễn toàn cầu.' },
  { path: '/ai-computer/', lang: 'vi', title: 'AI Computer - Nguyen AI Computer', desc: 'Nguyen AI Computer - Máy Tính AI chuyên biệt cho thế hệ Nguyễn toàn cầu.' },
  { path: '/how-it-works/', lang: 'vi', title: 'Cách hoạt động - Nguyen AI Computer', desc: 'Cách hoạt động của Nguyen AI Computer - Máy Tính AI cho thế hệ Nguyễn toàn cầu.' },
  { path: '/agents/', lang: 'vi', title: 'Agents - Nguyen AI Computer', desc: 'Đội ngũ AI Agent chuyên biệt cho thế hệ Nguyễn toàn cầu.' },
  { path: '/super-apps/', lang: 'vi', title: 'Super Apps - Nguyen AI Computer', desc: 'Các ứng dụng AI chuyên biệt cho thế hệ Nguyễn toàn cầu.' },
  { path: '/models/', lang: 'vi', title: 'Models - Nguyen AI Computer', desc: 'Các mô hình AI chuyên biệt cho thế hệ Nguyễn toàn cầu.' },
  { path: '/command-packs/', lang: 'vi', title: 'Command Packs - Nguyen AI Computer', desc: 'Các gói lệnh AI chuyên biệt cho thế hệ Nguyễn toàn cầu.' },
  { path: '/plans/', lang: 'vi', title: 'Plans - Nguyen AI Computer', desc: 'Các gói dịch vụ AI chuyên biệt cho thế hệ Nguyễn toàn cầu.' },
  { path: '/personal/', lang: 'vi', title: 'Personal - Nguyen AI Computer', desc: 'Gói cá nhân cho Máy Tính AI chuyên biệt.' },
  { path: '/family/', lang: 'vi', title: 'Family - Nguyen AI Computer', desc: 'Gói gia đình cho Máy Tính AI chuyên biệt.' },
  { path: '/creator/', lang: 'vi', title: 'Creator - Nguyen AI Computer', desc: 'Gói nhà sáng tạo cho Máy Tính AI chuyên biệt.' },
  { path: '/founder/', lang: 'vi', title: 'Founder - Nguyen AI Computer', desc: 'Gói nhà sáng lập cho Máy Tính AI chuyên biệt.' },
  { path: '/business/', lang: 'vi', title: 'Business - Nguyen AI Computer', desc: 'Gói doanh nghiệp cho Máy Tính AI chuyên biệt.' },
  { path: '/enterprise/', lang: 'vi', title: 'Enterprise - Nguyen AI Computer', desc: 'Gói doanh nghiệp lớn cho Máy Tính AI chuyên biệt.' },
  { path: '/network/', lang: 'vi', title: 'Network - Nguyen AI Computer', desc: 'Mạng lưới kết nối cho thế hệ Nguyễn toàn cầu.' },
  { path: '/heritage/', lang: 'vi', title: 'Heritage - Nguyen AI Computer', desc: 'Di sản văn hóa cho thế hệ Nguyễn toàn cầu.' },
  { path: '/chapter/', lang: 'vi', title: 'Chapter - Nguyen AI Computer', desc: 'Chương hoạt động cho thế hệ Nguyễn toàn cầu.' },
  { path: '/security/', lang: 'vi', title: 'Security - Nguyen AI Computer', desc: 'Bảo mật an toàn cho Máy Tính AI chuyên biệt.' },
  { path: '/trust/', lang: 'vi', title: 'Trust - Nguyen AI Computer', desc: 'Niềm tin và uy tín cho Máy Tính AI chuyên biệt.' },
  { path: '/terms/', lang: 'vi', title: 'Terms - Nguyen AI Computer', desc: 'Điều khoản sử dụng cho Máy Tính AI chuyên biệt.' },
  { path: '/privacy/', lang: 'vi', title: 'Privacy - Nguyen AI Computer', desc: 'Chính sách bảo mật cho Máy Tính AI chuyên biệt.' },
  { path: '/docs/', lang: 'vi', title: 'Docs - Nguyen AI Computer', desc: 'Tài liệu hướng dẫn cho Máy Tính AI chuyên biệt.' },
  { path: '/research/', lang: 'vi', title: 'Research - Nguyen AI Computer', desc: 'Nghiên cứu phát triển cho Máy Tính AI chuyên biệt.' },
  { path: '/about/', lang: 'vi', title: 'About - Nguyen AI Computer', desc: 'Giới thiệu về Nguyen AI Computer.' },
  { path: '/contact/', lang: 'vi', title: 'Contact - Nguyen AI Computer', desc: 'Liên hệ với Nguyen AI Computer.' },
  { path: '/invest/', lang: 'vi', title: 'Invest - Nguyen AI Computer', desc: 'Cơ hội đầu tư vào Nguyen AI Computer.' },
  { path: '/academy/', lang: 'vi', title: 'Academy - Nguyen AI Computer', desc: 'Nguyen AI Academy - Học tập và chứng chỉ cho thế hệ Nguyễn toàn cầu.' },
  // English
  { path: '/en/', lang: 'en', title: 'Nguyen AI Computer - AI Computer for the global Nguyen community', desc: 'Nguyen AI Computer is a specialized cloud AI Computer line for individuals, families, founders, businesses, and the global Nguyen community.' },
  { path: '/en/ai-computer/', lang: 'en', title: 'AI Computer - Nguyen AI Computer', desc: 'Nguyen AI Computer - Specialized AI Computer for the global Nguyen community.' },
  { path: '/en/how-it-works/', lang: 'en', title: 'How it works - Nguyen AI Computer', desc: 'How Nguyen AI Computer works - AI Computer for the global Nguyen community.' },
  { path: '/en/agents/', lang: 'en', title: 'Agents - Nguyen AI Computer', desc: 'Specialized AI Agent team for the global Nguyen community.' },
  { path: '/en/super-apps/', lang: 'en', title: 'Super Apps - Nguyen AI Computer', desc: 'Specialized AI applications for the global Nguyen community.' },
  { path: '/en/models/', lang: 'en', title: 'Models - Nguyen AI Computer', desc: 'Specialized AI models for the global Nguyen community.' },
  { path: '/en/command-packs/', lang: 'en', title: 'Command Packs - Nguyen AI Computer', desc: 'Specialized AI command packs for the global Nguyen community.' },
  { path: '/en/plans/', lang: 'en', title: 'Plans - Nguyen AI Computer', desc: 'Specialized AI service plans for the global Nguyen community.' },
  { path: '/en/personal/', lang: 'en', title: 'Personal - Nguyen AI Computer', desc: 'Personal plan for specialized AI Computer.' },
  { path: '/en/family/', lang: 'en', title: 'Family - Nguyen AI Computer', desc: 'Family plan for specialized AI Computer.' },
  { path: '/en/creator/', lang: 'en', title: 'Creator - Nguyen AI Computer', desc: 'Creator plan for specialized AI Computer.' },
  { path: '/en/founder/', lang: 'en', title: 'Founder - Nguyen AI Computer', desc: 'Founder plan for specialized AI Computer.' },
  { path: '/en/business/', lang: 'en', title: 'Business - Nguyen AI Computer', desc: 'Business plan for specialized AI Computer.' },
  { path: '/en/enterprise/', lang: 'en', title: 'Enterprise - Nguyen AI Computer', desc: 'Enterprise plan for specialized AI Computer.' },
  { path: '/en/network/', lang: 'en', title: 'Network - Nguyen AI Computer', desc: 'Network connections for the global Nguyen community.' },
  { path: '/en/heritage/', lang: 'en', title: 'Heritage - Nguyen AI Computer', desc: 'Cultural heritage for the global Nguyen community.' },
  { path: '/en/chapter/', lang: 'en', title: 'Chapter - Nguyen AI Computer', desc: 'Chapter operations for the global Nguyen community.' },
  { path: '/en/security/', lang: 'en', title: 'Security - Nguyen AI Computer', desc: 'Security and safety for specialized AI Computer.' },
  { path: '/en/trust/', lang: 'en', title: 'Trust - Nguyen AI Computer', desc: 'Trust and reputation for specialized AI Computer.' },
  { path: '/en/terms/', lang: 'en', title: 'Terms - Nguyen AI Computer', desc: 'Terms of service for specialized AI Computer.' },
  { path: '/en/privacy/', lang: 'en', title: 'Privacy - Nguyen AI Computer', desc: 'Privacy policy for specialized AI Computer.' },
  { path: '/en/docs/', lang: 'en', title: 'Docs - Nguyen AI Computer', desc: 'Documentation for specialized AI Computer.' },
  { path: '/en/research/', lang: 'en', title: 'Research - Nguyen AI Computer', desc: 'Research and development for specialized AI Computer.' },
  { path: '/en/about/', lang: 'en', title: 'About - Nguyen AI Computer', desc: 'About Nguyen AI Computer.' },
  { path: '/en/contact/', lang: 'en', title: 'Contact - Nguyen AI Computer', desc: 'Contact Nguyen AI Computer.' },
  { path: '/en/invest/', lang: 'en', title: 'Invest - Nguyen AI Computer', desc: 'Investment opportunities in Nguyen AI Computer.' },
  { path: '/en/academy/', lang: 'en', title: 'Academy - Nguyen AI Computer', desc: 'Nguyen AI Academy - Learning and certification for the global Nguyen community.' },
];

const distDir = path.join(__dirname, 'dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

routes.forEach(route => {
  const filePath = route.path === '/' 
    ? path.join(distDir, 'index.html')
    : path.join(distDir, route.path, 'index.html');
  
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const html = `<!DOCTYPE html>
<html lang="${route.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${route.title}</title>
  <meta name="description" content="${route.desc}">
  <link rel="canonical" href="https://nguyenai.net${route.path}">
</head>
<body>
  <h1>Nguyen AI Computer</h1>
  <p>${route.lang === 'vi' ? 'Máy Tính AI cho thế hệ Nguyễn toàn cầu.' : 'AI Computer for the global Nguyen community.'}</p>
  <p><a href="https://app.nguyenai.net">${route.lang === 'vi' ? 'Đăng nhập Console' : 'Login to Console'}</a></p>
  <p><a href="https://edu.nguyenai.net">${route.lang === 'vi' ? 'Học tại Academy' : 'Learn at Academy'}</a></p>
  <p><a href="https://invest.nguyenai.net">${route.lang === 'vi' ? 'Đầu tư' : 'Invest'}</a></p>
  <p>Route: ${route.path}</p>
</body>
</html>`;

  fs.writeFileSync(filePath, html);
  console.log(`Created: ${filePath}`);
});

console.log(`\nBuild complete! Created ${routes.length} HTML files.`);
