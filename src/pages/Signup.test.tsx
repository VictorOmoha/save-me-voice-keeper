import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Signup from '@/pages/Signup';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/lib/analytics', () => ({
  trackActivationEvent: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signup: vi.fn(async () => ({ error: null })),
    signInWithGoogle: vi.fn(async () => ({ error: null })),
    isLoading: false,
    isAuthenticated: false,
  }),
}));

describe('Signup', () => {
  it('uses human-readable account creation copy instead of protocol labels', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Create account').length).toBeGreaterThan(0);
    expect(screen.getByText('Continue with Google')).toBeTruthy();
    expect(screen.getByText('Or use email')).toBeTruthy();
    expect(screen.getByText('Sign in')).toBeTruthy();
    expect(screen.getByText('Secure connection active')).toBeTruthy();

    expect(screen.queryByText('CREATE_ACCOUNT')).toBeNull();
    expect(screen.queryByText('SIGN_UP_WITH_GOOGLE')).toBeNull();
    expect(screen.queryByText('OR_CONTINUE_WITH')).toBeNull();
    expect(screen.queryByText('AUTHENTICATE')).toBeNull();
    expect(screen.queryByText('SECURE_CONNECTION_ESTABLISHED')).toBeNull();
  });
});
