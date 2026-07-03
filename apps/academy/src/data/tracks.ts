export interface Track {
  id: number;
  slug: string;
  title: {
    vi: string;
    en: string;
  };
  description: {
    vi: string;
    en: string;
  };
  lessonCount: number;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: string;
  isOnboarding?: boolean;
}

export const tracks: Track[] = [
  {
    id: 1,
    slug: 'ai-computer-fundamentals',
    title: {
      vi: 'Cơ bản về AI Computer',
      en: 'AI Computer Fundamentals',
    },
    description: {
      vi: 'Track onboarding — giới thiệu AI Computer, instance cá nhân và đội Agent. Bắt đầu tại đây nếu bạn mới đến với Nguyen AI.',
      en: 'Onboarding track — introduces the AI Computer, your personal instance and the Agent team. Start here if you are new to Nguyen AI.',
    },
    lessonCount: 10,
    duration: '45 min',
    difficulty: 'Beginner',
    icon: '💻',
    isOnboarding: true,
  },
  {
    id: 2,
    slug: 'agent-operation',
    title: {
      vi: 'Vận hành Agent',
      en: 'Agent Operation',
    },
    description: {
      vi: 'Học cách giao việc, phê duyệt và quản lý 9 Agent trong đội Nguyen AI.',
      en: 'Learn how to assign tasks, approve actions and manage the 9 Agents on the Nguyen AI team.',
    },
    lessonCount: 8,
    duration: '40 min',
    difficulty: 'Beginner',
    icon: '🤖',
  },
  {
    id: 3,
    slug: 'super-app-usage',
    title: {
      vi: 'Sử dụng Super App',
      en: 'Super App Usage',
    },
    description: {
      vi: 'Hướng dẫn sử dụng các Super App: AI Office, AI Research, AI Content, Nguyen Roots và hơn thế nữa.',
      en: 'Guides for using Super Apps: AI Office, AI Research, AI Content, Nguyen Roots and more.',
    },
    lessonCount: 12,
    duration: '60 min',
    difficulty: 'Beginner',
    icon: '🚀',
  },
  {
    id: 4,
    slug: 'command-pack-authoring',
    title: {
      vi: 'Tạo Command Pack',
      en: 'Command Pack Authoring',
    },
    description: {
      vi: 'Viết và đóng gói Command Pack — bộ lệnh tái sử dụng cho workflow của bạn.',
      en: 'Write and package Command Packs — reusable command sets for your workflows.',
    },
    lessonCount: 6,
    duration: '35 min',
    difficulty: 'Intermediate',
    icon: '📦',
  },
  {
    id: 5,
    slug: 'verification-evidence-methodology',
    title: {
      vi: 'Phương pháp Xác minh và Bằng chứng',
      en: 'Verification and Evidence Methodology',
    },
    description: {
      vi: 'Hệ thống nhãn bằng chứng: verified, primary source, secondary source, disputed, insufficient evidence.',
      en: 'The evidence label system: verified, primary source, secondary source, disputed, insufficient evidence.',
    },
    lessonCount: 8,
    duration: '45 min',
    difficulty: 'Intermediate',
    icon: '🔍',
  },
  {
    id: 6,
    slug: 'privacy-security-practices',
    title: {
      vi: 'Thực hành Quyền riêng tư và Bảo mật',
      en: 'Privacy and Security Practices',
    },
    description: {
      vi: 'Bảo vệ dữ liệu người sống, cây gia đình riêng tư và kiểm soát truy cập.',
      en: 'Protecting living-person data, private family trees and access control.',
    },
    lessonCount: 7,
    duration: '40 min',
    difficulty: 'Intermediate',
    icon: '🔒',
  },
  {
    id: 7,
    slug: 'founder-business-workflows',
    title: {
      vi: 'Workflow Founder và Doanh nghiệp',
      en: 'Founder and Business Workflows',
    },
    description: {
      vi: 'AI Founder OS, AI Business OS và các workflow cho nhà sáng lập và doanh nghiệp Nguyen.',
      en: 'AI Founder OS, AI Business OS and workflows for Nguyen founders and businesses.',
    },
    lessonCount: 10,
    duration: '55 min',
    difficulty: 'Advanced',
    icon: '🏢',
  },
  {
    id: 8,
    slug: 'chapter-governance',
    title: {
      vi: 'Quản trị Chapter',
      en: 'Chapter Governance',
    },
    description: {
      vi: 'Quản lý Nguyen Chapter, phân quyền và vận hành cộng đồng.',
      en: 'Managing Nguyen Chapters, role permissions and community operations.',
    },
    lessonCount: 6,
    duration: '35 min',
    difficulty: 'Advanced',
    icon: '🏛️',
  },
  {
    id: 9,
    slug: 'bilingual-content-creation',
    title: {
      vi: 'Tạo nội dung Song ngữ',
      en: 'Bilingual Content Creation',
    },
    description: {
      vi: 'Tạo nội dung VI/EN chất lượng cao với Agent hỗ trợ song ngữ.',
      en: 'Creating high-quality VI/EN content with bilingual Agent support.',
    },
    lessonCount: 5,
    duration: '30 min',
    difficulty: 'Intermediate',
    icon: '🌐',
  },
  {
    id: 10,
    slug: 'heritage-research-methodology',
    title: {
      vi: 'Phương pháp Nghiên cứu Di sản',
      en: 'Heritage Research Methodology',
    },
    description: {
      vi: 'Nghiên cứu gia phả, lịch sử và di sản Nguyen với phương pháp bằng chứng.',
      en: 'Researching genealogy, history and Nguyen heritage with evidence-based methodology.',
    },
    lessonCount: 9,
    duration: '50 min',
    difficulty: 'Advanced',
    icon: '📜',
  },
];

export function getTrackBySlug(slug: string): Track | undefined {
  return tracks.find((t) => t.slug === slug);
}

export function getOnboardingTrack(): Track {
  return tracks.find((t) => t.isOnboarding) ?? tracks[0];
}
