/**
 * commercial-objects.ts — Commercial object boundary contract.
 *
 * Per PRODUCT_BOUNDARY_CONTRACT.md §2 (LOCKED):
 * 5 commercial objects defined in the RFC.
 *
 * 2 additional objects required by V4 (EDU_MASTER_PLAN_V4 + INVESTOR_ACCESS_POLICY):
 * - Scholarship Sponsorship — co-sponsor a scholar (recurring or one-time)
 * - Investor Data Room Access — time-limited private room access (per grant)
 *
 * Total: 7 commercial objects. They are NOT bundable by default and NOT interchangeable.
 */

export type CommercialObjectId =
  | 'ai_computer_subscription'
  | 'academy_pass'
  | 'certification_fee'
  | 'sme_deployment'
  | 'marketplace_purchase'
  // === 2 missing objects (per V4) ===
  | 'scholarship_sponsorship'
  | 'investor_data_room_access';

export interface CommercialObject {
  id: CommercialObjectId;
  name: string;
  name_vi: string;
  owner_layer: string;
  sold_as: 'recurring_plan' | 'one_time' | 'per_item' | 'contract' | 'per_grant' | 'recurring_or_one_time';
  entitlement_key: string;
  description: string;
  description_vi: string;
}

export const COMMERCIAL_OBJECTS: Record<CommercialObjectId, CommercialObject> = {
  ai_computer_subscription: {
    id: 'ai_computer_subscription',
    name: 'AI Computer Subscription',
    name_vi: 'Đăng ký Máy AI',
    owner_layer: 'Gen 2',
    sold_as: 'recurring_plan',
    entitlement_key: 'machine.plan',
    description: 'Recurring plan for AI Computer instance access.',
    description_vi: 'Gói định kỳ cho truy cập Máy AI.',
  },
  academy_pass: {
    id: 'academy_pass',
    name: 'Academy Pass',
    name_vi: 'Thẻ Học viện',
    owner_layer: 'Gen 2 + Proof service',
    sold_as: 'recurring_or_one_time',
    entitlement_key: 'academy.pass',
    description: 'Access to Academy tracks and lessons.',
    description_vi: 'Truy cập các track và bài học Học viện.',
  },
  certification_fee: {
    id: 'certification_fee',
    name: 'Certification Fee',
    name_vi: 'Phí Chứng nhận',
    owner_layer: 'Proof service',
    sold_as: 'per_item',
    entitlement_key: 'cert.fee.paid',
    description: 'Per certification attempt fee.',
    description_vi: 'Phí mỗi lần thi chứng nhận.',
  },
  sme_deployment: {
    id: 'sme_deployment',
    name: 'SME Deployment',
    name_vi: 'Triển khai Doanh nghiệp vừa',
    owner_layer: 'Gen 2',
    sold_as: 'contract',
    entitlement_key: 'sme.deployment.id',
    description: 'Dedicated deployment for SME customers.',
    description_vi: 'Triển khai riêng cho khách hàng doanh nghiệp vừa.',
  },
  marketplace_purchase: {
    id: 'marketplace_purchase',
    name: 'Marketplace Purchase',
    name_vi: 'Mua sắm Marketplace',
    owner_layer: 'Gen 2',
    sold_as: 'per_item',
    entitlement_key: 'marketplace.purchase.id',
    description: 'Per-item marketplace purchase.',
    description_vi: 'Mua từng mục trên marketplace.',
  },
  // === 2 missing objects (per V4) ===
  scholarship_sponsorship: {
    id: 'scholarship_sponsorship',
    name: 'Scholarship Sponsorship',
    name_vi: 'Tài trợ Học bổng',
    owner_layer: 'Gen 2 + Scholarship service',
    sold_as: 'recurring_or_one_time',
    entitlement_key: 'scholarship.sponsor.allowed',
    description: 'Co-sponsor a scholarship recipient. Recurring or one-time contribution.',
    description_vi: 'Đồng tài trợ học bổng cho một học viên. Đóng góp định kỳ hoặc một lần.',
  },
  investor_data_room_access: {
    id: 'investor_data_room_access',
    name: 'Investor Data Room Access',
    name_vi: 'Truy cập Phòng dữ liệu Nhà đầu tư',
    owner_layer: 'Gen 2 + Investor service',
    sold_as: 'per_grant',
    entitlement_key: 'invest.private.scope',
    description: 'Time-limited, revocable access to private investor data room. Per grant.',
    description_vi: 'Truy cập có thời hạn, có thể thu hồi, vào phòng dữ liệu nhà đầu tư riêng tư.',
  },
};

// ============================================================
// Hard separation rules (per PRODUCT_BOUNDARY_CONTRACT.md §2.1)
// ============================================================

export const NON_BUNDABLE_PAIRS: ReadonlyArray<[CommercialObjectId, CommercialObjectId]> = [
  ['ai_computer_subscription', 'academy_pass'],
  ['academy_pass', 'certification_fee'],
  ['certification_fee', 'sme_deployment'],
  ['sme_deployment', 'marketplace_purchase'],
  ['scholarship_sponsorship', 'ai_computer_subscription'],
  ['investor_data_room_access', 'ai_computer_subscription'],
];

// ============================================================
// Helpers
// ============================================================

export function getCommercialObject(id: CommercialObjectId): CommercialObject {
  return COMMERCIAL_OBJECTS[id];
}

export function listCommercialObjects(): CommercialObjectId[] {
  return Object.keys(COMMERCIAL_OBJECTS) as CommercialObjectId[];
}

export function isBundable(a: CommercialObjectId, b: CommercialObjectId): boolean {
  return !NON_BUNDABLE_PAIRS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}
