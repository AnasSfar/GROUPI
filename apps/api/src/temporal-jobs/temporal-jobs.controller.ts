import { Controller, Get, UseGuards } from '@nestjs/common';
import { TemporalJobsService } from './temporal-jobs.service';
import { CronSecretGuard } from './cron-secret.guard';

/**
 * Déclenché par Vercel Cron (voir `crons` dans apps/api/vercel.json) — équivalent HTTP des
 * `@Cron` de TemporalJobsService, qui ne peuvent jamais se déclencher en serverless (pas de
 * process persistant pour porter leur minuteur). GET uniquement : Vercel Cron ne fait que des GET.
 */
@Controller('internal/temporal-jobs')
@UseGuards(CronSecretGuard)
export class TemporalJobsController {
  constructor(private readonly temporalJobs: TemporalJobsService) {}

  @Get('hourly')
  runHourly() {
    return this.temporalJobs.runHourlyJobs();
  }

  @Get('daily')
  runDaily() {
    return this.temporalJobs.runDailyDigest();
  }
}
