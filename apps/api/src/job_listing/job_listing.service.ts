import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JobListing } from './entities/job_listing.entity';
import { Repository } from 'typeorm';
import type { UUID } from 'crypto';
import { JobListingPreviewDto } from './dto/job-listing-preview.dto';
import { JobListingFullDto } from './dto/job-listing-full.dto';
import { AppliedJob } from './entities/applied_job.entity';

type PaginatedResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

@Injectable()
export class JobListingService {
  constructor(
    @InjectRepository(JobListing)
    private jobListingRepository: Repository<JobListing>,
    @InjectRepository(AppliedJob)
    private appliedJobRepository: Repository<AppliedJob>,
  ) {}

  private normalizePage(value: unknown) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  }

  private normalizeLimit(value: unknown) {
    const parsed = Number(value);
    const defaultLimit = 50;
    const maxLimit = 100;

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return defaultLimit;
    }

    return Math.min(Math.floor(parsed), maxLimit);
  }

  private async getFilteredListings(
    query: any,
  ): Promise<PaginatedResult<JobListing>> {
    const remote = query.remote as string | undefined;
    const typeOfJob = query.type_of_job as string | undefined;
    const verificationStatus = query.verification_status as string | undefined;
    const page = this.normalizePage(query.page);
    const limit = this.normalizeLimit(query.limit);
    const skip = (page - 1) * limit;

    const queryBuilder = this.jobListingRepository
      .createQueryBuilder('job')
      .orderBy('job.created_at', 'DESC')
      .addOrderBy('job.uuid', 'DESC')
      .skip(skip)
      .take(limit);

    if (remote === 'true' || remote === 'false') {
      queryBuilder.andWhere('job.remote = :remote', { remote: remote === 'true' });
    }

    if (typeOfJob) {
      queryBuilder.andWhere('job.type_of_job = :typeOfJob', { typeOfJob });
    }

    if (verificationStatus) {
      queryBuilder.andWhere('job.verification_status = :verificationStatus', {
        verificationStatus,
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      page,
      limit,
      total,
      hasMore: skip + items.length < total,
    };
  }

  private toFullDto(job: JobListing): JobListingFullDto {
    return {
      uuid: job.uuid,
      source: job.source,
      remote: job.remote,
      expires_in: job.expires_in,
      type_of_job: job.type_of_job,
      verification_status: job.verification_status,
      confidence_level: job.confidence_level,
      created_at: job.created_at,
      job_link: job.job_link,
      job_text: job.job_text,
    };
  }

  private async getAppliedJobIdSet(userId: string, jobUuids: string[]) {
    if (jobUuids.length === 0) {
      return new Set<string>();
    }

    const appliedJobs = await this.appliedJobRepository
      .createQueryBuilder('applied')
      .select('applied.job_uuid', 'job_uuid')
      .where('applied.user_id = :userId', { userId })
      .andWhere('applied.job_uuid IN (:...jobUuids)', { jobUuids })
      .getRawMany<{ job_uuid: string }>();

    return new Set(appliedJobs.map((item) => item.job_uuid));
  }

  private toPreviewDto(job: JobListing): JobListingPreviewDto {
    return {
      uuid: job.uuid,
      source: job.source,
      remote: job.remote,
      expires_in: job.expires_in,
      type_of_job: job.type_of_job,
      verification_status: job.verification_status,
      confidence_level: job.confidence_level,
      created_at: job.created_at,
      job_text_preview: job.job_text.slice(0, 180),
    };
  }

  async findAll(query: any, userId?: string) {
    const result = await this.getFilteredListings(query);
    const appliedIds = userId
      ? await this.getAppliedJobIdSet(
          userId,
          result.items.map((job) => String(job.uuid)),
        )
      : new Set<string>();

    return {
      ...result,
      items: result.items.map((job) => {
        const dto = this.toFullDto(job);
        if (userId) {
          return { ...dto, applied: appliedIds.has(String(job.uuid)) };
        }
        return dto;
      }),
    };
  }

  async findOne(id: UUID, userId?: string) {
    const jobListing = await this.jobListingRepository.findOneBy({ uuid: id });
    if (!jobListing) {
      return null;
    }
    const dto = this.toFullDto(jobListing);
    if (!userId) {
      return dto;
    }

    const applied = await this.appliedJobRepository.findOne({
      where: {
        user_id: userId as UUID,
        job_uuid: id,
      },
    });

    return { ...dto, applied: Boolean(applied) };
  }

  async findByLocation(location: string) {
    const jobListings = await this.jobListingRepository.find({
      where: {
        remote: false,
      },
      order: {
        created_at: 'DESC',
      },
    });
    return jobListings
      .filter((job) =>
        job.job_text.toLowerCase().includes(location.toLowerCase()),
      )
      .map((job) => this.toFullDto(job));
  }

  async findAllPublic(query: any) {
    const result = await this.getFilteredListings(query);
    return {
      ...result,
      items: result.items.map((job) => this.toPreviewDto(job)),
    };
  }

  async findOnePublic(id: UUID) {
    const fullListing = await this.findOne(id);
    if (!fullListing) {
      return null;
    }
    return {
      uuid: fullListing.uuid,
      source: fullListing.source,
      remote: fullListing.remote,
      expires_in: fullListing.expires_in,
      type_of_job: fullListing.type_of_job,
      verification_status: fullListing.verification_status,
      confidence_level: fullListing.confidence_level,
      created_at: fullListing.created_at,
      job_text_preview: fullListing.job_text.slice(0, 180),
    };
  }

  async markApplied(userId: string, jobId: UUID) {
    const jobExists = await this.jobListingRepository.exist({
      where: { uuid: jobId },
    });

    if (!jobExists) {
      throw new NotFoundException({ message: 'Job not found' });
    }

    let applied = await this.appliedJobRepository.findOne({
      where: { user_id: userId as UUID, job_uuid: jobId },
    });

    if (!applied) {
      applied = this.appliedJobRepository.create({
        user_id: userId as UUID,
        job_uuid: jobId,
      });
      applied = await this.appliedJobRepository.save(applied);
    }

    return {
      applied: true,
      applied_at: applied.applied_at,
      job_uuid: jobId,
    };
  }

  async unmarkApplied(userId: string, jobId: UUID) {
    await this.appliedJobRepository.delete({
      user_id: userId as UUID,
      job_uuid: jobId,
    });

    return {
      applied: false,
      job_uuid: jobId,
    };
  }

  async getAppliedJobsForUser(userId: string, query: any) {
    const page = this.normalizePage(query.page);
    const limit = this.normalizeLimit(query.limit);
    const skip = (page - 1) * limit;

    const [items, total] = await this.appliedJobRepository.findAndCount({
      where: { user_id: userId as UUID },
      relations: { job: true },
      order: { applied_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items: items.map((applied) => ({
        applied_at: applied.applied_at,
        job: this.toPreviewDto(applied.job),
      })),
      page,
      limit,
      total,
      hasMore: skip + items.length < total,
    };
  }
}
