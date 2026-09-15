import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {NotificationSettings} from './NotificationSettings';

const mocks = vi.hoisted(() => ({
  user: {uid: 'test', email: 'test@example.com', emailVerified: true},
  preferences: {reminder_notifications: true, email_notifications: false, push_notifications: false, automation_notifications: true},
  delivery: {deviceEnabled: false, emailAvailable: true, deviceHelp: null as string | null, loading: false, refreshDevice: vi.fn()},
  update: vi.fn(), enable: vi.fn(), disable: vi.fn(), create: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({useAuth: () => ({user: mocks.user})}));
vi.mock('@/hooks/useUserPreferences', () => ({useUserPreferences: () => ({preferences: mocks.preferences, updatePreferences: mocks.update, isLoading: false})}));
vi.mock('@/hooks/useReminderDelivery', () => ({useReminderDelivery: () => mocks.delivery}));
vi.mock('@/services/pushNotificationService', () => ({enablePushDevice: mocks.enable, disablePushDevice: mocks.disable}));
vi.mock('@/services/taskReminderService', () => ({taskReminderService: {createTaskReminder: mocks.create}}));
vi.mock('@/lib/firebase', () => ({auth: {currentUser: null}}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.emailVerified = true;
  mocks.delivery.emailAvailable = true;
  mocks.delivery.deviceHelp = null;
  mocks.preferences.reminder_notifications = true;
  mocks.update.mockResolvedValue(true);
  mocks.enable.mockResolvedValue(undefined);
  mocks.create.mockResolvedValue({reminderId: 'test-reminder', error: null});
});
describe('Reminder delivery setup', () => {
  it('registers the device before enabling the preference', async () => {
    render(<NotificationSettings />);
    fireEvent.click(screen.getByRole('button', {name: 'Enable on this device'}));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({push_notifications: true}));
    expect(mocks.enable.mock.invocationCallOrder[0]).toBeLessThan(mocks.update.mock.invocationCallOrder[0]);
  });
  it('does not claim push is enabled if permission or registration fails', async () => {
    mocks.enable.mockRejectedValue(new Error('Permission denied'));
    render(<NotificationSettings />);
    fireEvent.click(screen.getByRole('button', {name: 'Enable on this device'}));
    await waitFor(() => expect(screen.getByRole('button', {name: 'Enable on this device'}).hasAttribute('disabled')).toBe(false));
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('prevents enabling email when verification or delivery setup is missing', () => {
    mocks.user.emailVerified = false;
    mocks.delivery.emailAvailable = false;
    render(<NotificationSettings />);
    expect(screen.getByRole('switch', {name: 'Email reminders'}).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', {name: 'Send verification email'})).toBeTruthy();
  });
  it('shows installation guidance and leaves unsupported push unavailable', () => {
    mocks.delivery.deviceHelp = 'Add SaveMe to your Home Screen.';
    render(<NotificationSettings />);
    expect(screen.getByText('Add SaveMe to your Home Screen.')).toBeTruthy();
    expect(screen.getByRole('button', {name: 'Enable on this device'}).hasAttribute('disabled')).toBe(true);
  });
  it('schedules a real reminder through the existing creation flow', async () => {
    render(<NotificationSettings />);
    const before = Date.now();
    fireEvent.click(screen.getByRole('button', {name: 'Schedule a test reminder'}));
    await screen.findByRole('button', {name: 'Test reminder scheduled'});
    const scheduledAt = new Date(mocks.create.mock.calls[0][0].scheduledAtInput).getTime();
    expect(scheduledAt).toBeGreaterThanOrEqual(before + 60_000);
    expect(mocks.create).toHaveBeenCalledOnce();
  });
});
