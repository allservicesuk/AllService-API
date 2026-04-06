/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Prometheus metrics registry exposing HTTP, DB, Redis, auth, and session metrics plus defaults.
 */
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

const HTTP_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
const DB_BUCKETS = [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5];
const REDIS_BUCKETS = [0.0005, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5];
const MAIL_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30];

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();
  readonly httpRequestDuration: Histogram<'method' | 'path' | 'status_code' | 'region'>;
  readonly httpRequestsTotal: Counter<'method' | 'path' | 'status_code' | 'region'>;
  readonly activeConnections: Gauge<'region'>;
  readonly dbQueryDuration: Histogram<'operation' | 'region'>;
  readonly redisOperationDuration: Histogram<'operation' | 'region'>;
  readonly authLoginTotal: Counter<'status' | 'region'>;
  readonly authRegisterTotal: Counter<'region'>;
  readonly activeSessions: Gauge<'region'>;
  readonly mailEnqueuedTotal: Counter<'type' | 'region'>;
  readonly mailSentTotal: Counter<'type' | 'status' | 'region'>;
  readonly mailSendDuration: Histogram<'type' | 'region'>;
  readonly queueJobCompletedTotal: Counter<'queue' | 'name' | 'region'>;
  readonly queueJobFailedTotal: Counter<'queue' | 'name' | 'region'>;
  readonly queueJobStalledTotal: Counter<'queue' | 'region'>;
  readonly queueActiveJobs: Gauge<'queue' | 'region'>;
  readonly queueWaitingJobs: Gauge<'queue' | 'region'>;
  readonly queueDepthTotal: Gauge<'queue' | 'state' | 'region'>;
  readonly queueOldestWaitingAgeSeconds: Gauge<'queue' | 'region'>;

  constructor() {
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status_code', 'region'],
      buckets: HTTP_BUCKETS,
      registers: [this.registry],
    });
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'path', 'status_code', 'region'],
      registers: [this.registry],
    });
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Active HTTP connections',
      labelNames: ['region'],
      registers: [this.registry],
    });
    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'region'],
      buckets: DB_BUCKETS,
      registers: [this.registry],
    });
    this.redisOperationDuration = new Histogram({
      name: 'redis_operation_duration_seconds',
      help: 'Redis operation duration in seconds',
      labelNames: ['operation', 'region'],
      buckets: REDIS_BUCKETS,
      registers: [this.registry],
    });
    this.authLoginTotal = new Counter({
      name: 'auth_login_total',
      help: 'Total login attempts',
      labelNames: ['status', 'region'],
      registers: [this.registry],
    });
    this.authRegisterTotal = new Counter({
      name: 'auth_register_total',
      help: 'Total registrations',
      labelNames: ['region'],
      registers: [this.registry],
    });
    this.activeSessions = new Gauge({
      name: 'active_sessions',
      help: 'Active user sessions',
      labelNames: ['region'],
      registers: [this.registry],
    });
    this.mailEnqueuedTotal = new Counter({
      name: 'mail_enqueued_total',
      help: 'Total mail jobs enqueued',
      labelNames: ['type', 'region'],
      registers: [this.registry],
    });
    this.mailSentTotal = new Counter({
      name: 'mail_sent_total',
      help: 'Total mail messages sent (by status)',
      labelNames: ['type', 'status', 'region'],
      registers: [this.registry],
    });
    this.mailSendDuration = new Histogram({
      name: 'mail_send_duration_seconds',
      help: 'SMTP send duration in seconds',
      labelNames: ['type', 'region'],
      buckets: MAIL_BUCKETS,
      registers: [this.registry],
    });
    this.queueJobCompletedTotal = new Counter({
      name: 'queue_job_completed_total',
      help: 'Total queue jobs completed successfully',
      labelNames: ['queue', 'name', 'region'],
      registers: [this.registry],
    });
    this.queueJobFailedTotal = new Counter({
      name: 'queue_job_failed_total',
      help: 'Total queue jobs failed',
      labelNames: ['queue', 'name', 'region'],
      registers: [this.registry],
    });
    this.queueJobStalledTotal = new Counter({
      name: 'queue_job_stalled_total',
      help: 'Total queue jobs that stalled',
      labelNames: ['queue', 'region'],
      registers: [this.registry],
    });
    this.queueActiveJobs = new Gauge({
      name: 'queue_active_jobs',
      help: 'Active queue jobs currently being processed',
      labelNames: ['queue', 'region'],
      registers: [this.registry],
    });
    this.queueWaitingJobs = new Gauge({
      name: 'queue_waiting_jobs',
      help: 'Waiting queue jobs awaiting processing',
      labelNames: ['queue', 'region'],
      registers: [this.registry],
    });
    this.queueDepthTotal = new Gauge({
      name: 'queue_depth_total',
      help: 'Queue depth by job state',
      labelNames: ['queue', 'state', 'region'],
      registers: [this.registry],
    });
    this.queueOldestWaitingAgeSeconds = new Gauge({
      name: 'queue_oldest_waiting_age_seconds',
      help: 'Age of the oldest waiting job in seconds',
      labelNames: ['queue', 'region'],
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
