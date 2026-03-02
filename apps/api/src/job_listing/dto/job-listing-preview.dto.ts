export class JobListingPreviewDto {
  uuid: string;
  source: string;
  remote: boolean;
  expires_in: Date;
  type_of_job: string;
  verification_status: string;
  confidence_level: number | null;
  created_at: Date;
  job_text_preview: string;
}
