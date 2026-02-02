/**
 * Subscription Page Tests
 * Tests the subscription/payment flow UI
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Subscription from '../Subscription';

// Mock the auth context
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  subscriptionTier: 'free',
  subscriptionActive: true,
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    session: { access_token: 'mock-token' },
  }),
}));

// Mock Firebase auth
vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('mock-firebase-token'),
    },
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const renderSubscriptionPage = () => {
  return render(
    <BrowserRouter>
      <Subscription />
    </BrowserRouter>
  );
};

describe('Subscription Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Rendering', () => {
    it('should render subscription page with all plans', () => {
      renderSubscriptionPage();

      expect(screen.getByText('Subscription Management')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('should display plan prices correctly', () => {
      renderSubscriptionPage();

      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('$9')).toBeInTheDocument();
      expect(screen.getByText('$19')).toBeInTheDocument();
    });

    it('should show current plan badge on free plan', () => {
      renderSubscriptionPage();

      // Look for "Current Plan" text
      const currentPlanBadges = screen.getAllByText('Current Plan');
      expect(currentPlanBadges.length).toBeGreaterThan(0);
    });

    it('should display plan features', () => {
      renderSubscriptionPage();

      // Free plan features
      expect(screen.getByText('Up to 50 entries')).toBeInTheDocument();
      expect(screen.getByText('Basic search')).toBeInTheDocument();

      // Basic plan features
      expect(screen.getByText('Unlimited entries')).toBeInTheDocument();
      expect(screen.getByText('Voice input & commands')).toBeInTheDocument();

      // Premium plan features
      expect(screen.getByText('API access')).toBeInTheDocument();
      expect(screen.getByText('24/7 support')).toBeInTheDocument();
    });
  });

  describe('Upgrade Flow', () => {
    it('should disable upgrade button for current plan', () => {
      renderSubscriptionPage();

      // Find the button that says "Current Plan" (disabled state)
      const currentPlanButtons = screen.getAllByRole('button', { name: /current plan/i });
      currentPlanButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should disable upgrade button for free plan', () => {
      renderSubscriptionPage();

      const freeButton = screen.getByRole('button', { name: /free plan/i });
      expect(freeButton).toBeDisabled();
    });

    it('should show upgrade buttons for paid plans', () => {
      renderSubscriptionPage();

      expect(screen.getByRole('button', { name: /upgrade to basic/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upgrade to premium/i })).toBeInTheDocument();
    });
  });

  describe('Billing Management', () => {
    it('should render manage billing button', () => {
      renderSubscriptionPage();

      expect(screen.getByRole('button', { name: /manage billing/i })).toBeInTheDocument();
    });

    it('should display billing information section', () => {
      renderSubscriptionPage();

      expect(screen.getByText('Billing Information')).toBeInTheDocument();
      expect(screen.getByText(/billing cycle/i)).toBeInTheDocument();
      expect(screen.getByText(/free trial/i)).toBeInTheDocument();
      expect(screen.getByText(/payment methods/i)).toBeInTheDocument();
    });

    it('should display billing history section', () => {
      renderSubscriptionPage();

      expect(screen.getByText('Billing History')).toBeInTheDocument();
      expect(screen.getByText('No billing history available')).toBeInTheDocument();
    });
  });

  describe('User Status Display', () => {
    it('should show current plan status', () => {
      renderSubscriptionPage();

      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('Your subscription details')).toBeInTheDocument();
    });

    it('should show active badge for active subscription', () => {
      renderSubscriptionPage();

      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });
});

describe('Subscription API Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();

    // Set environment variable for cloud functions URL
    vi.stubEnv('VITE_CLOUD_FUNCTIONS_URL', 'https://test-cloud-functions.com');
  });

  it('should handle checkout API response', async () => {
    const checkoutUrl = 'https://checkout.stripe.com/test-session';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: checkoutUrl }),
    });

    // Mock window.location.href
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    renderSubscriptionPage();

    const upgradeButton = screen.getByRole('button', { name: /upgrade to basic/i });
    fireEvent.click(upgradeButton);

    // The button should show loading state
    await waitFor(() => {
      expect(screen.queryByText(/processing/i)).toBeInTheDocument();
    });

    // Restore window.location
    window.location = originalLocation;
  });

  it('should handle checkout API error', async () => {
    const { toast } = await import('sonner');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Payment failed' }),
    });

    renderSubscriptionPage();

    const upgradeButton = screen.getByRole('button', { name: /upgrade to basic/i });
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
