import {
  DeletionEffects,
  DeletionReceipt,
  DeletionStateStore,
  RecentAuthProof,
  UserDataManifest,
} from "./models";
import {
  assertNonProductionPrivacyEnvironment,
  assertRecentAuth,
  isServerActionable,
  validateManifest,
} from "./safety";

export interface DeleteAccountRequest {
  operationId: string;
  uid: string;
  auth: RecentAuthProof;
}

export class AccountDeletionService {
  constructor(
    private readonly manifest: UserDataManifest,
    private readonly state: DeletionStateStore,
    private readonly effects: DeletionEffects,
    environment: string | undefined,
    private readonly now: () => number = Date.now
  ) {
    assertNonProductionPrivacyEnvironment(environment);
    validateManifest(manifest);
  }

  async run(request: DeleteAccountRequest): Promise<DeletionReceipt> {
    assertRecentAuth(request.uid, request.auth, this.now());
    let receipt = await this.state.load(request.operationId);
    if (receipt && receipt.uid !== request.uid) {
      throw new Error("deletion operation belongs to another user");
    }
    if (!receipt) {
      receipt = {
        operationId: request.operationId,
        uid: request.uid,
        status: "pending",
        completedSteps: [],
        attempts: 0,
        updatedAt: new Date(this.now()).toISOString(),
      };
    }
    return this.execute(receipt);
  }

  async resume(operationId: string, ownerUid: string): Promise<DeletionReceipt> {
    const receipt = await this.state.load(operationId);
    if (!receipt) throw new Error("deletion operation not found");
    if (receipt.uid !== ownerUid) throw new Error("deletion operation belongs to another user");
    return this.execute(receipt);
  }

  private async execute(receipt: DeletionReceipt): Promise<DeletionReceipt> {
    if (receipt.status === "completed") return receipt;

    receipt.attempts += 1;
    receipt.status = "pending";
    delete receipt.lastError;
    await this.state.save(receipt);

    const authEntries = this.manifest.entries.filter((entry) => entry.resourceType === "authIdentity");
    if (authEntries.length !== 1) throw new Error("manifest must contain exactly one Auth identity");
    const purgeEntries = this.manifest.entries
      .filter((entry) => isServerActionable(entry) && entry.resourceType !== "authIdentity")
      .sort((a, b) => a.deleteOrder - b.deleteOrder || a.location.localeCompare(b.location));

    const steps: Array<{id: string; execute: () => Promise<void>}> = [
      {id: "agent-keys:revoke", execute: () => this.effects.revokeAgentKeys(receipt.uid)},
      {id: "scheduled-effects:stop", execute: () => this.effects.stopScheduledEffects(receipt.uid)},
      ...purgeEntries.map((entry) => ({
        id: `purge:${entry.resourceType}:${entry.location}`,
        execute: () => this.effects.purgeResource(receipt.uid, entry),
      })),
      {id: `auth:delete:${authEntries[0].location}`, execute: () => this.effects.deleteAuthIdentity(receipt.uid)},
    ];

    for (const step of steps) {
      if (receipt.completedSteps.includes(step.id)) continue;
      try {
        await step.execute();
        receipt.completedSteps.push(step.id);
        receipt.updatedAt = new Date(this.now()).toISOString();
        await this.state.save(receipt);
      } catch (error) {
        receipt.status = "retryable";
        receipt.lastError = error instanceof Error ? error.message : "unknown deletion error";
        receipt.updatedAt = new Date(this.now()).toISOString();
        await this.state.save(receipt);
        return receipt;
      }
    }

    receipt.status = "completed";
    receipt.updatedAt = new Date(this.now()).toISOString();
    await this.state.save(receipt);
    return receipt;
  }
}
