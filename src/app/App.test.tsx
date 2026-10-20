import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the application title as the main heading', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /math practice/i })).toBeInTheDocument();
  });

  it('renders a welcome message', () => {
    render(<App />);

    expect(screen.getByText(/get ready to practice/i)).toBeInTheDocument();
  });
});
