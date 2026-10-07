import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import model from './model/openfga-model.json';
import { OPENFGA_SEED_TUPLES } from '../database/seed';

export interface FgaTupleKey {
  user: string;
  relation: string;
  object: string;
}

export interface ClientConfig {
  url?: string;
  storeName?: string;
}

/**
 * Thin REST client for OpenFGA. The client bootstraps the store on init:
 * ensures the store exists, pushes the authorization model from
 * `model/openfga-model.json` (a new version each boot, so model edits apply
 * on restart), and writes the seed tuples only if the store is empty.
 */
@Injectable()
export class OpenFgaClient implements OnModuleInit {
  private readonly logger = new Logger(OpenFgaClient.name);
  private readonly url: string;
  private readonly storeName: string;
  private storeId: string | null = null;

  constructor(@Optional() config?: ClientConfig) {
    this.url = config?.url ?? process.env.OPENFGA_URL ?? 'http://openfga:8080';
    this.storeName = config?.storeName ?? process.env.OPENFGA_STORE_NAME ?? 'fga';
  }

  async onModuleInit(): Promise<void> {
    // OpenFGA may still be starting (migrations + boot); retry until ready.
    for (let attempt = 1; ; attempt++) {
      try {
        await this.request('GET', '/stores?page_size=1');
        break;
      } catch (error) {
        if (attempt >= 30) {
          throw error;
        }
        this.logger.warn(`OpenFGA not ready yet (attempt ${attempt}/30), retrying in 2s...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    this.storeId = await this.ensureStore();
    await this.pushModel();
    await this.seedIfEmpty();
    this.logger.log(`OpenFGA ready (store "${this.storeName}" id ${this.storeId})`);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.url}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`OpenFGA ${method} ${path} failed (${response.status}): ${text}`);
    }
    return (text ? JSON.parse(text) : {}) as T;
  }

  private storePath(suffix = ''): string {
    if (!this.storeId) {
      throw new Error('OpenFGA store not initialized');
    }
    return `/stores/${this.storeId}${suffix}`;
  }

  private async ensureStore(): Promise<string> {
    const list = await this.request<{ stores: { id: string; name: string }[] }>(
      'GET',
      `/stores?name=${encodeURIComponent(this.storeName)}`,
    );
    const existing = list.stores.find((store) => store.name === this.storeName);
    if (existing) {
      return existing.id;
    }
    const created = await this.request<{ id: string }>('POST', '/stores', {
      name: this.storeName,
    });
    return created.id;
  }

  private async pushModel(): Promise<void> {
    const response = await this.request<{ authorization_model_id: string }>(
      'POST',
      this.storePath('/authorization-models'),
      model,
    );
    this.logger.log(`Authorization model pushed (${response.authorization_model_id})`);
  }

  private async seedIfEmpty(): Promise<void> {
    const { tuples } = await this.read({}, 1);
    if (tuples.length > 0) {
      return;
    }
    await this.writeTuples(OPENFGA_SEED_TUPLES);
    this.logger.log(`Seeded ${OPENFGA_SEED_TUPLES.length} tuples into OpenFGA`);
  }

  async deleteStore(): Promise<void> {
    if (this.storeId) {
      await this.request('DELETE', this.storePath());
      this.storeId = null;
    }
  }

  async check(user: string, relation: string, object: string): Promise<boolean> {
    const response = await this.request<{ allowed: boolean }>(
      'POST',
      this.storePath('/check'),
      { tuple_key: { user, relation, object } },
    );
    return response.allowed;
  }

  /** Reads tuples matching the non-empty parts of the filter. */
  async read(
    filter: Partial<FgaTupleKey>,
    pageSize = 100,
  ): Promise<{ tuples: { key: FgaTupleKey }[] }> {
    const tupleKey: Record<string, string> = {};
    if (filter.user) {
      tupleKey.user = filter.user;
    }
    if (filter.relation) {
      tupleKey.relation = filter.relation;
    }
    if (filter.object) {
      tupleKey.object = filter.object;
    }
    let continuationToken = '';
    const collected: { key: FgaTupleKey }[] = [];
    // Single page is enough for the demo, but loop defensively with a cap.
    for (let page = 0; page < 10; page++) {
      const response = await this.request<{
        tuples: { key: FgaTupleKey }[];
        continuation_token?: string;
      }>(
        'POST',
        this.storePath('/read'),
        {
          page_size: pageSize,
          ...(Object.keys(tupleKey).length > 0 ? { tuple_key: tupleKey } : {}),
          ...(continuationToken ? { continuation_token: continuationToken } : {}),
        },
      );
      collected.push(...response.tuples);
      continuationToken = response.continuation_token ?? '';
      if (!continuationToken || response.tuples.length === 0) {
        break;
      }
    }
    return { tuples: collected };
  }

  async writeTuples(tupleKeys: FgaTupleKey[]): Promise<void> {
    try {
      await this.request('POST', this.storePath('/write'), {
        writes: { tuple_keys: tupleKeys },
      });
    } catch (error) {
      // Idempotent grants: writing an existing tuple is a no-op for the caller.
      if (error instanceof Error && error.message.includes('already exists')) {
        return;
      }
      throw error;
    }
  }

  async deleteTuples(tupleKeys: FgaTupleKey[]): Promise<void> {
    if (tupleKeys.length === 0) {
      return;
    }
    await this.request('POST', this.storePath('/write'), {
      deletes: { tuple_keys: tupleKeys },
    });
  }
}
