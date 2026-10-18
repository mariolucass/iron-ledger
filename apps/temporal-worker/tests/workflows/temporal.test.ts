import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import { ApplicationFailure, heartbeat, sleep } from "@temporalio/activity";
import type { RecordSagaStepInput, ReportTransactionOutcomeInput } from "@iron-ledger/workflow-contracts";
import { createLifecycleActivities } from "../../src/modules/transaction/activities/create-lifecycle-activities";
import { createTransactionActivities } from "../../src/modules/transaction/activities/create-transaction-activities";
import type { InventoryGateway } from "../../src/ports/inventory-gateway";
import type { TransactionLifecycleGateway } from "../../src/ports/transaction-lifecycle-gateway";

let env: TestWorkflowEnvironment;
before(async () => { env = await TestWorkflowEnvironment.createTimeSkipping(); });
after(async () => { await env?.teardown(); });
const input = {transactionId:randomUUID(),stockLevelId:randomUUID(),quantity:1,failConfirmation:false};
const defaults = (): InventoryGateway => ({
  reserve: async () => ({id:"reservation"}), commit:async()=>({id:"movement"}),
  release:async()=>{ throw new Error("unexpected release"); }, findByTransaction:async()=>({status:"NOT_FOUND"}),
});

/** In-memory transaction context: captures what the worker would send to the API. */
const tracking = { steps: [] as RecordSagaStepInput[], outcomes: [] as ReportTransactionOutcomeInput[] };
const lifecycleGateway: TransactionLifecycleGateway = {
  recordStep: async (step) => { tracking.steps.push(step); },
  reportOutcome: async (outcome) => { tracking.outcomes.push(outcome); },
};
const activitiesFor = (gateway: InventoryGateway) => ({
  ...createTransactionActivities(gateway),
  ...createLifecycleActivities(lifecycleGateway),
});

async function run(gateway: InventoryGateway, overrides = {}) {
  const taskQueue = randomUUID();
  tracking.steps.length = 0;
  tracking.outcomes.length = 0;
  const worker = await Worker.create({
    connection: env.nativeConnection, taskQueue,
    workflowsPath: require.resolve("../../src/workflows"), activities:activitiesFor(gateway),
  });
  return worker.runUntil(env.client.workflow.execute("transactionSaga", {
    taskQueue,workflowId:randomUUID(),args:[{...input,...overrides}],
  }));
}

test("Temporal executes the success path with injected activities", async () => {
  assert.deepEqual(await run(defaults()),{status:"COMPLETED",reservationId:"reservation",movementId:"movement"});
});

test("Temporal retries transient reservation failures", async () => {
  const gateway = defaults();let attempts=0;
  gateway.reserve=async()=> { if (++attempts === 1) throw new Error("temporarily unavailable"); return {id:"reservation"}; };
  assert.equal((await run(gateway) as {status:string}).status,"COMPLETED");
  assert.equal(attempts,2);
});

test("demonstration failure reconciles and compensates the active reservation", async () => {
  const gateway=defaults();let released=false;
  gateway.findByTransaction=async()=>({status:"ACTIVE",reservationId:"reservation"});
  gateway.release=async()=>{released=true;};
  assert.equal((await run(gateway,{failConfirmation:true}) as {status:string}).status,"COMPENSATED");
  assert.ok(released);
});

test("a lost commit response reconciles to completion without releasing stock", async () => {
  const gateway=defaults();let attempts=0;
  gateway.commit=async()=>{if (++attempts <= 3) throw new Error("lost response");return {id:"movement"};};
  gateway.findByTransaction=async()=>({status:"COMMITTED",reservationId:"reservation",movementId:"movement"});
  assert.deepEqual(await run(gateway),{status:"COMPLETED",reservationId:"reservation",movementId:"movement"});
  assert.equal(attempts,4);
});

test("recovery failures do not claim successful compensation", async () => {
  const gateway=defaults();
  gateway.findByTransaction=async()=>({status:"ACTIVE",reservationId:"reservation"});
  gateway.release=async()=>{throw ApplicationFailure.nonRetryable("cannot release");};
  await assert.rejects(run(gateway,{failConfirmation:true}),(error:any)=>error.cause?.type==="RECONCILIATION_REQUIRED");
});

test("cancellation waits for the activity and performs non-cancellable cleanup", async () => {
  const taskQueue=randomUUID();let released=false;
  let started!:()=>void;
  const confirmationStarted=new Promise<void>(resolve=>{started=resolve;});
  const gateway=defaults();
  gateway.commit=async()=>{
    const timer=setInterval(()=>heartbeat(),20);
    started();
    try { await sleep("1 hour"); } finally { clearInterval(timer); }
    return {id:"movement"};
  };
  gateway.findByTransaction=async()=>({status:"ACTIVE",reservationId:"reservation"});
  gateway.release=async()=>{released=true;};
  const worker=await Worker.create({connection:env.nativeConnection,taskQueue,workflowsPath:require.resolve("../../src/workflows"),activities:activitiesFor(gateway)});
  await worker.runUntil(async()=>{
    const handle=await env.client.workflow.start("transactionSaga",{taskQueue,workflowId:randomUUID(),args:[input]});
    await confirmationStarted;
    await handle.cancel();
    await assert.rejects(handle.result());
    assert.ok(released);
  });
});

test("replay accepts success and compensation histories from the original workflow", async () => {
  for (const failConfirmation of [false,true]) {
    const taskQueue=randomUUID();
    const worker=await Worker.create({connection:env.nativeConnection,taskQueue,workflowsPath:require.resolve("../replay/legacy-workflows"),activities:{
      reserveStock:async()=>({id:"reservation"}),
      confirmTransaction:async()=>{if(failConfirmation)throw ApplicationFailure.nonRetryable("demo");return {id:"movement"};},
      compensateStock:async()=>{},
    }});
    const handle=await env.client.workflow.start("transactionSaga",{taskQueue,workflowId:randomUUID(),args:[{...input,failConfirmation}]});
    await worker.runUntil(handle.result());
    await Worker.runReplayHistory({workflowsPath:require.resolve("../../src/workflows")},await handle.fetchHistory());
  }
});

test("lifecycle tracking mirrors every step and the outcome to the transaction context", async () => {
  const gateway=defaults();
  gateway.findByTransaction=async()=>({status:"ACTIVE",reservationId:"reservation"});
  gateway.release=async()=>{};
  const result = await run(gateway,{failConfirmation:true}) as {status:string};
  assert.equal(result.status,"COMPENSATED");
  assert.deepEqual(tracking.steps.filter((step)=>step.status!=="RUNNING").map((step)=>`${step.sequence}:${step.name}:${step.status}`),[
    "1:reserveStock:SUCCEEDED","2:confirmTransaction:FAILED","3:reconcileReservation:SUCCEEDED","4:compensateStock:SUCCEEDED",
  ]);
  assert.equal(tracking.outcomes.length,1);
  assert.equal(tracking.outcomes[0]?.outcome.status,"COMPENSATED");
});

test("replay accepts histories recorded by the reconciliation-v1 workflow", async () => {
  for (const failConfirmation of [false,true]) {
    const taskQueue=randomUUID();
    const gateway=defaults();
    gateway.findByTransaction=async()=>({status:"ACTIVE",reservationId:"reservation"});
    gateway.release=async()=>{};
    const worker=await Worker.create({connection:env.nativeConnection,taskQueue,workflowsPath:require.resolve("../replay/reconciliation-v1-workflows"),activities:activitiesFor(gateway)});
    const handle=await env.client.workflow.start("transactionSaga",{taskQueue,workflowId:randomUUID(),args:[{...input,failConfirmation}]});
    await worker.runUntil(handle.result());
    await Worker.runReplayHistory({workflowsPath:require.resolve("../../src/workflows")},await handle.fetchHistory());
  }
});
