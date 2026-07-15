/**
 * Education and scholarship catalog.
 *
 * YOUTH_PROGRAMS are the eight official Nguoi Tre Lam delivery programs.
 * SCHOLARSHIP_PROGRAMS are legacy Academy specialist pathways accepted by the
 * current scholarship API. They are not eight delivery programs and do not
 * imply an approved scholarship allocation.
 */

export const YOUTH_PROGRAMS = [
  { id: 'YF-01', nameVi: '90 ngày bước vào đời', nameEn: '90 Days into Adult Life' },
  { id: 'YF-02', nameVi: 'Một người một nghề số', nameEn: 'One Person, One Digital Career' },
  { id: 'YF-03', nameVi: 'Một người một sản phẩm', nameEn: 'One Person, One Product' },
  { id: 'YF-04', nameVi: 'Công nghệ về làng', nameEn: 'Technology for Local Communities' },
  { id: 'YF-05', nameVi: 'Đà Lạt sống và làm', nameEn: 'Live and Work in Da Lat' },
  { id: 'YF-06', nameVi: 'Gia đình cùng học công nghệ', nameEn: 'Families Learning Technology Together' },
  { id: 'YF-07', nameVi: 'Một dự án cho cộng đồng', nameEn: 'One Project for the Community' },
  { id: 'YF-08', nameVi: 'Người đã đi trước', nameEn: 'Those Who Went Before' },
] as const;

export const SCHOLARSHIP_PROGRAMS = [
  { id: 'nao', code: 'NAO', name: 'Nguyen AI Operator' },
  { id: 'acm', code: 'ACM', name: 'AI Creator and Media Studio' },
  { id: 'aca', code: 'ACA', name: 'AI Code and App Builder' },
  { id: 'abo', code: 'ABO', name: 'AI Business Operator' },
  { id: 'afs', code: 'AFS', name: 'AI Founder and Startup Builder' },
  { id: 'ark', code: 'ARK', name: 'AI Research and Knowledge Builder' },
  { id: 'acf', code: 'ACF', name: 'AI Career and Freelance Builder' },
  { id: 'afm', code: 'AFM', name: 'AI Family Memory and Digital Heritage' },
  { id: 'alc', code: 'ALC', name: 'AI Leadership and Community Builder' },
] as const;

export const SCHOLARSHIP_SUPPORT_OPTIONS = [
  { id: 'SA-01', nameVi: 'Học bổng học phí toàn phần', nameEn: 'Full tuition scholarship' },
  { id: 'SA-02', nameVi: 'Học bổng học phí một phần', nameEn: 'Partial tuition scholarship' },
  { id: 'SA-03', nameVi: 'Chương trình miễn phí', nameEn: 'Fee-free program place' },
  { id: 'SA-04', nameVi: 'Quyền sử dụng Máy Tính AI Nguyễn', nameEn: 'Nguyen AI Computer access' },
  { id: 'SA-05', nameVi: 'Thiết bị hoặc dữ liệu truy cập', nameEn: 'Device or connectivity support' },
  { id: 'SA-06', nameVi: 'Chỗ ở hoặc trải nghiệm Đà Lạt', nameEn: 'Da Lat accommodation or experience' },
  { id: 'SA-07', nameVi: 'Hỗ trợ đi lại', nameEn: 'Travel support' },
] as const;

export const SCHOLARSHIP_WORKFLOW = [
  { id: 1, vi: 'Nộp đơn và chọn nhu cầu hỗ trợ', en: 'Apply and select support needs' },
  { id: 2, vi: 'Xác minh danh tính, điều kiện và đồng thuận', en: 'Verify identity, eligibility and consent' },
  { id: 3, vi: 'Chấm điểm theo tiêu chí công bố', en: 'Score against published criteria' },
  { id: 4, vi: 'Người đánh giá độc lập xem xét', en: 'Independent reviewer assessment' },
  { id: 5, vi: 'Hội đồng ra quyết định có lý do', en: 'Council issues a reasoned decision' },
  { id: 6, vi: 'Gán nguồn tài trợ và quyền học cụ thể', en: 'Assign funding and scoped entitlement' },
  { id: 7, vi: 'Tiếp nhận và xử lý khiếu nại', en: 'Receive and resolve appeals' },
  { id: 8, vi: 'Theo dõi, tạm dừng hoặc thu hồi có phê duyệt', en: 'Monitor, suspend or revoke with approval' },
  { id: 9, vi: 'Báo cáo tác động bằng dữ liệu tổng hợp', en: 'Report impact using aggregate data' },
] as const;

export const SCHOLARSHIP_PILOT_POLICY = {
  slotsPerSelectedProgram: 11,
  selectedProgramIds: [] as string[],
  applicationStatus: 'funding_pending' as 'funding_pending' | 'applications_open',
  publicRuleVi: 'Chỉ công bố số suất khi chương trình đã được lựa chọn, có nguồn tài trợ, cohort và quyết định phê duyệt.',
  publicRuleEn: 'Publish award numbers only after program selection, funding, cohort setup and an approval decision.',
};
