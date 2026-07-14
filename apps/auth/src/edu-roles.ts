/**
 * EDU Role & Permission Definitions — 5 vai trò (Kế hoạch V2 / PHASE 10)
 *
 * Roles: learner · mentor · employer · reviewer · admin
 *
 * These are EDU-specific roles layered on top of the existing membership
 * system (USER, MEMBER, STUDENT, FOUNDER, etc.). An edu role is stored in
 * the `roles` JSON array on the session, prefixed with `edu:`.
 *
 * Source: CURRICULUM_ARCHITECTURE.md + MENTOR_AND_EXPERT_POLICY.md +
 *         WORK_PROJECT_AND_EMPLOYER_POLICY.md + YOUTH_DATA_PRIVACY_POLICY.md
 */

/** 5 vai trò EDU (KHÓA) */
export const EDU_ROLES = [
  "edu:learner",
  "edu:mentor",
  "edu:employer",
  "edu:reviewer",
  "edu:admin",
] as const;

export type EduRole = (typeof EDU_ROLES)[number];

/** Permission matrix — mỗi role có tập quyền cụ thể */
export const EDU_PERMISSIONS: Record<EduRole, string[]> = {
  /** Người học — đăng ký, học, nộp bài, xem hồ sơ mình */
  "edu:learner": [
    "edu:enroll",
    "edu:lesson:read",
    "edu:quiz:take",
    "edu:assignment:submit",
    "edu:product:create",
    "edu:product:read_own",
    "edu:product:update_own",
    "edu:career_map:create",
    "edu:career_map:read_own",
    "edu:profile:read_own",
    "edu:profile:update_own",
    "edu:certificate:read_own",
    "edu:verification:lookup",
    "edu:project:apply",
    "edu:job:apply",
    "edu:scholarship:apply",
    "edu:mentor:book_session",
    "edu:offline:register",
  ],

  /** Mentor — hướng dẫn, chấm rubric, cấp biên nhận */
  "edu:mentor": [
    "edu:learner:list_assigned",
    "edu:submission:review",
    "edu:review:create",
    "edu:review:update_own",
    "edu:rubric:read",
    "edu:evidence:issue",
    "edu:mentor_session:create",
    "edu:mentor_session:read_own",
    "edu:career_map:approve",
    "edu:certificate:nominate",
    "edu:profile:read_assigned",
    "edu:product:read_assigned",
  ],

  /** Doanh nghiệp — đăng dự án, đăng việc, xem hồ sơ ứng viên */
  "edu:employer": [
    "edu:project:create",
    "edu:project:update_own",
    "edu:job:create",
    "edu:job:update_own",
    "edu:application:read_own",
    "edu:application:update_status",
    "edu:evidence:confirm_completion",
    "edu:profile:read_applicant",
    "edu:employer:register",
  ],

  /** Reviewer/QA — audit, kiểm tra ngôn ngữ, privacy, chất lượng */
  "edu:reviewer": [
    "edu:audit:read",
    "edu:review:read_all",
    "edu:submission:read_all",
    "edu:product:read_all",
    "edu:certificate:read_all",
    "edu:verification:read_all",
    "edu:privacy:audit",
    "edu:language:audit",
    "edu:quality:flag",
  ],

  /** Admin — toàn quyền + quản lý hệ thống */
  "edu:admin": [
    "edu:*",
    "edu:course:create",
    "edu:course:update",
    "edu:course:publish",
    "edu:lesson:create",
    "edu:lesson:update",
    "edu:lesson:publish",
    "edu:rubric:create",
    "edu:rubric:update",
    "edu:employer:verify",
    "edu:employer:suspend",
    "edu:mentor:approve",
    "edu:mentor:suspend",
    "edu:certificate:revoke",
    "edu:certificate:issue",
    "edu:user:suspend",
    "edu:offline:manage",
    "edu:scholarship:manage",
    "edu:audit:read",
    "edu:audit:export",
  ],
};

/** Kiểm tra xem role có permission không */
export function hasEduPermission(
  roles: string[],
  permission: string,
): boolean {
  for (const role of roles) {
    if (!role.startsWith("edu:")) continue;
    const perms = EDU_PERMISSIONS[role as EduRole];
    if (!perms) continue;
    if (perms.includes("edu:*")) return true;
    if (perms.includes(permission)) return true;
  }
  return false;
}

/** Lấy tất cả permissions từ danh sách roles */
export function getEduPermissions(roles: string[]): string[] {
  const perms = new Set<string>();
  for (const role of roles) {
    if (!role.startsWith("edu:")) continue;
    const rolePerms = EDU_PERMISSIONS[role as EduRole];
    if (!rolePerms) continue;
    if (rolePerms.includes("edu:*")) {
      perms.add("edu:*");
      return Array.from(perms);
    }
    for (const p of rolePerms) perms.add(p);
  }
  return Array.from(perms);
}

/** Kiểm tra role hợp lệ */
export function isValidEduRole(role: string): role is EduRole {
  return EDU_ROLES.includes(role as EduRole);
}

/** Gán edu role cho user — trả về roles array mới để lưu vào session */
export function assignEduRole(
  existingRoles: string[],
  eduRole: EduRole,
): string[] {
  const filtered = existingRoles.filter((r) => !r.startsWith("edu:"));
  return [...filtered, eduRole];
}

/** Gỡ edu role */
export function removeEduRole(existingRoles: string[]): string[] {
  return existingRoles.filter((r) => !r.startsWith("edu:"));
}
