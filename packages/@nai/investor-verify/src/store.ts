/**
 * @nai/investor-verify — In-memory store
 *
 * For dev/test. Production swaps to D1/Postgres via the InvestorVerifyStore
 * interface. See ./d1-store.ts (TODO) for the D1 implementation.
 */

import type {
  InvestorVerifyStore,
  VerificationState,
  IdentityDeclaration,
  IdentityVerificationRecord,
  PaymentRecord,
  PaymentReceipt,
  TwoFactorEnrollment,
  AccessGrant,
} from './types';

export class InMemoryInvestorVerifyStore implements InvestorVerifyStore {
  private states = new Map<string, VerificationState>();
  private declarations = new Map<string, IdentityDeclaration>();
  private verifications = new Map<string, IdentityVerificationRecord>();
  private payments = new Map<string, PaymentRecord>();
  private paymentsByInvestor = new Map<string, PaymentRecord>();
  private receipts = new Map<string, PaymentReceipt>();
  private receiptsByPayment = new Map<string, PaymentReceipt[]>();
  private enrollments = new Map<string, TwoFactorEnrollment>();
  private grants = new Map<string, AccessGrant>();

  async getState(investor_id: string): Promise<VerificationState | null> {
    return this.states.get(investor_id) ?? null;
  }

  async upsertState(state: VerificationState): Promise<void> {
    this.states.set(state.investor_id, state);
  }

  async getDeclaration(investor_id: string): Promise<IdentityDeclaration | null> {
    return this.declarations.get(investor_id) ?? null;
  }

  async saveDeclaration(decl: IdentityDeclaration): Promise<void> {
    this.declarations.set(decl.investor_id, decl);
  }

  async getVerification(investor_id: string): Promise<IdentityVerificationRecord | null> {
    return this.verifications.get(investor_id) ?? null;
  }

  async saveVerification(record: IdentityVerificationRecord): Promise<void> {
    this.verifications.set(record.investor_id, record);
  }

  async getPayment(payment_id: string): Promise<PaymentRecord | null> {
    return this.payments.get(payment_id) ?? null;
  }

  async getPaymentByInvestor(investor_id: string): Promise<PaymentRecord | null> {
    return this.paymentsByInvestor.get(investor_id) ?? null;
  }

  async savePayment(payment: PaymentRecord): Promise<void> {
    this.payments.set(payment.payment_id, payment);
    this.paymentsByInvestor.set(payment.investor_id, payment);
  }

  async getReceipt(receipt_id: string): Promise<PaymentReceipt | null> {
    return this.receipts.get(receipt_id) ?? null;
  }

  async getReceiptsByPayment(payment_id: string): Promise<PaymentReceipt[]> {
    return this.receiptsByPayment.get(payment_id) ?? [];
  }

  async saveReceipt(receipt: PaymentReceipt): Promise<void> {
    this.receipts.set(receipt.receipt_id, receipt);
    const list = this.receiptsByPayment.get(receipt.payment_id) ?? [];
    list.push(receipt);
    this.receiptsByPayment.set(receipt.payment_id, list);
  }

  async getEnrollment(investor_id: string): Promise<TwoFactorEnrollment | null> {
    return this.enrollments.get(investor_id) ?? null;
  }

  async saveEnrollment(enrollment: TwoFactorEnrollment): Promise<void> {
    this.enrollments.set(enrollment.investor_id, enrollment);
  }

  async getGrant(investor_id: string): Promise<AccessGrant | null> {
    return this.grants.get(investor_id) ?? null;
  }

  async saveGrant(grant: AccessGrant): Promise<void> {
    this.grants.set(grant.investor_id, grant);
  }

  async listActiveGrants(): Promise<AccessGrant[]> {
    const now = new Date().toISOString();
    return Array.from(this.grants.values()).filter(
      (g) => g.revoked_at === null && g.expires_at > now,
    );
  }

  async deleteInvestorData(investor_id: string): Promise<void> {
    this.states.delete(investor_id);
    this.declarations.delete(investor_id);
    this.verifications.delete(investor_id);
    const payment = this.paymentsByInvestor.get(investor_id);
    if (payment) {
      this.payments.delete(payment.payment_id);
      this.paymentsByInvestor.delete(investor_id);
      const receipts = this.receiptsByPayment.get(payment.payment_id) ?? [];
      for (const r of receipts) this.receipts.delete(r.receipt_id);
      this.receiptsByPayment.delete(payment.payment_id);
    }
    this.enrollments.delete(investor_id);
    this.grants.delete(investor_id);
  }
}
