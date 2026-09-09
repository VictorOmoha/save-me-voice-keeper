import React from "react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {cleanup, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {DashboardIntelligencePanel} from "@/components/dashboard/DashboardIntelligencePanel";

const mocks = vi.hoisted(() => ({getReminders: vi.fn(), orderBy: vi.fn(), user: {uid: "review-user"}}));
vi.mock("@/contexts/AuthContext", () => ({useAuth: () => ({user: mocks.user})}));
vi.mock("@/lib/firebase", () => ({db: {}}));
vi.mock("firebase/firestore", () => ({
  collection: (_db: unknown, name: string) => name,
  query: (name: string) => name, where: vi.fn(), limit: vi.fn(), orderBy: mocks.orderBy,
  getDocs: (name: string) => name === "reminders" ? mocks.getReminders() : Promise.resolve({docs: []}),
}));
const reminder = (text: string) => ({docs: [{id: "reminder-1", data: () => ({text, status: "pending", trigger_at: {toDate: () => new Date("2026-09-10T16:00:00Z")}})}]});
const show = () => render(<MemoryRouter><DashboardIntelligencePanel entries={[]} compact /></MemoryRouter>);
afterEach(cleanup);
beforeEach(() => {vi.clearAllMocks(); mocks.getReminders.mockResolvedValue(reminder("Project catch-up"));});

describe("Dashboard upcoming reminders", () => {
  it("reads the scheduling field used by saved reminders and refreshes after creation", async () => {
    show();
    expect(await screen.findByText("Project catch-up")).toBeTruthy();
    expect(mocks.orderBy).toHaveBeenCalledWith("trigger_at", "asc");
    expect(screen.queryByText("Scheduled")).toBeNull();
    mocks.getReminders.mockResolvedValue(reminder("New reminder"));
    fireEvent(window, new Event("saveme:reminders-changed"));
    expect(await screen.findByText("New reminder")).toBeTruthy();
  });
  it("shows a retryable error instead of claiming the schedule is empty", async () => {
    mocks.getReminders.mockRejectedValueOnce(new Error("network unavailable"));
    show();
    expect(await screen.findByText("Couldn’t load reminders.")).toBeTruthy();
    expect(screen.queryByText(/Nothing scheduled/)).toBeNull();
    fireEvent.click(screen.getByText("Try again"));
    await waitFor(() => expect(screen.getByText("Project catch-up")).toBeTruthy());
  });
});
