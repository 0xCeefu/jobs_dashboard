import { Controller, Delete, Get, Param, Post, Query, Request } from '@nestjs/common';
import { JobListingService } from './job_listing.service';
import type { UUID } from 'crypto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('job-listing')
export class JobListingController {
  constructor(private readonly jobListingService: JobListingService) {}

  @Public()
  @Get('public')
  findAllPublic(@Query() query: any) {
    return this.jobListingService.findAllPublic(query);
  }

  @Public()
  @Get('public/:id')
  findOnePublic(@Param('id') id: UUID) {
    return this.jobListingService.findOnePublic(id);
  }

  @Public()
  @Get('location/:location')
  findByLocation(@Param('location') location: string) {
    return this.jobListingService.findByLocation(location);
  }

  @Get('applied/me')
  getAppliedJobs(@Request() req, @Query() query: any) {
    return this.jobListingService.getAppliedJobsForUser(req.user.id, query);
  }

  @Post(':id/apply')
  markApplied(@Request() req, @Param('id') id: UUID) {
    return this.jobListingService.markApplied(req.user.id, id);
  }

  @Delete(':id/apply')
  unmarkApplied(@Request() req, @Param('id') id: UUID) {
    return this.jobListingService.unmarkApplied(req.user.id, id);
  }

  @Get()
  findAll(@Request() req, @Query() query: any) {
    return this.jobListingService.findAll(query, req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: UUID) {
    return this.jobListingService.findOne(id, req.user.id);
  }
}
