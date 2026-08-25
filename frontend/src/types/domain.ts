export type CaseState =
  | 'DRAFT'
  | 'FROZEN'
  | 'LOCKED'
  | 'NOT_APPLICABLE'
  | 'UNRESOLVED'
  | 'SUPERSEDED_BY_SUCCESSOR';

export type Outcome =
  | 'EDITION_APPLIES'
  | 'NOT_YET_EFFECTIVE'
  | 'SUPERSEDED_FOR_DATE'
  | 'NO_BOUND_REFERENCE'
  | 'UNRESOLVED';

export interface CaseRecord {
  case_id: string;
  owner: string;
  title: number;
  part: string;
  section: string;
  activity_date: string;
  standard_designation_hint: string;
  state: CaseState;
  predecessor_case_id: string;
  successor_case_id: string;
  client_nonce: string;
  fingerprint: string;
  attempt_count: number;
  last_attempt_epoch: number;
  last_attempt_at: string;
  current_assessment_id: string;
  created_at: string;
  frozen_at: string;
}

export interface AuthorityDocument {
  document_number: string;
  publication_date: string;
  effective_on: string;
  canonical_url: string;
}

export interface AssessmentRecord {
  assessment_id: string;
  case_id: string;
  attempt_number: number;
  schema_version: string;
  outcome: Outcome;
  standard_body: string;
  designation_family: string;
  edition: string;
  effective_from: string;
  effective_to: string;
  ecfr_date: string;
  ecfr_section_fingerprint: string;
  authority_documents: AuthorityDocument[];
  reason_code: string;
  source_statuses: Record<string, string>;
  observed_at: string;
}

export interface IntegrationRecord {
  caller: string;
  namespace: string;
  case_id: string;
  previous_case_id: string;
  state: string;
  registered_at: string;
  updated_at: string;
}

export interface EventRecord {
  event_id: string;
  event_type: string;
  subject_id: string;
  actor: string;
  timestamp: string;
}

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  provider: any | null;
  providerName: string | null;
  isCorrectChain: boolean;
}

export type TxStep = 'IDLE' | 'SIGNING' | 'SUBMITTED' | 'FINALIZING' | 'SUCCESS' | 'ERROR';

export interface PendingOperation {
  id: string;
  type: string;
  txHash?: string;
  timestamp: number;
  params: Record<string, any>;
  status: 'PRE_SIGN' | 'SUBMITTED' | 'FINALIZED' | 'FAILED';
  error?: string;
}
