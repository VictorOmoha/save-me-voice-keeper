import {describe, expect, it, vi} from "vitest";
import type Stripe from "stripe";
import {lifecycleFromEvent} from "./functions";

const failedInvoiceEvent = (subscription: string | null): Stripe.Event => ({
  id: "evt_invoice_failed",
  created: 123,
  type: "invoice.payment_failed",
  data: {object: {customer: "cus_1", subscription, lines: {data: []}}},
} as unknown as Stripe.Event);

const subscription = (status: Stripe.Subscription.Status = "past_due"): Stripe.Subscription => ({
  id: "sub_1",
  customer: "cus_1",
  status,
  current_period_end: 456,
  items: {data: [{price: {id: "price_basic"}}]},
} as unknown as Stripe.Subscription);

describe("billing webhook event projection", () => {
  it("ignores a failed one-off invoice without retrieving a subscription", async () => {
    const retrieve = vi.fn();
    const result = await lifecycleFromEvent(failedInvoiceEvent(null), {
      subscriptions: {retrieve},
    } as unknown as Pick<Stripe, "subscriptions">);

    expect(result).toBeNull();
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("retrieves the referenced subscription before projecting invoice failure", async () => {
    const retrieve = vi.fn().mockResolvedValue(subscription("unpaid"));
    const result = await lifecycleFromEvent(failedInvoiceEvent("sub_1"), {
      subscriptions: {retrieve},
    } as unknown as Pick<Stripe, "subscriptions">);

    expect(retrieve).toHaveBeenCalledWith("sub_1");
    expect(result).toMatchObject({
      type: "invoice.payment_failed",
      status: "unpaid",
      priceId: "price_basic",
      customerId: "cus_1",
      subscriptionId: "sub_1",
      currentPeriodEnd: 456,
    });
  });
});
