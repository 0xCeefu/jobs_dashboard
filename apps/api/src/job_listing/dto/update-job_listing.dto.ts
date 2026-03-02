import { PartialType } from '@nestjs/mapped-types';
import { CreateJobListingDto } from './create-job_listing.dto';

export class UpdateJobListingDto extends PartialType(CreateJobListingDto) {}
