import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { LaptopCard } from '../components/LaptopCard';
import { MemoryRouter } from 'react-router-dom';
import { Laptop } from '../types';

describe('Frontend TrueSpec Component Tests', () => {
  const sampleLaptop: Laptop = {
    id: 1,
    brand: 'Apple',
    model_name: 'MacBook Air M3',
    cpu_name: 'Apple M3 8-Core',
    cpu_score: 80,
    gpu_name: 'Apple M3 10-Core GPU',
    gpu_score: 65,
    ram_gb: 16,
    storage_type: 'SSD',
    storage_gb: 512,
    display_size: 13.6,
    refresh_rate: 60,
    battery_wh: 52.6,
    weight_kg: 1.24,
    price: 1099,
    currency: 'USD',
    os: 'macOS',
    category: 'Productivity',
    confidence_score: 88,
    clean_review_count: 42,
    wilson_lower_bound: 0.82
  };

  it('renders ConfidenceBadge with correct score and high confidence label in lg mode', () => {
    render(
      <ConfidenceBadge
        score={88}
        wilsonLowerBound={0.82}
        cleanReviewCount={42}
        size="lg"
      />
    );

    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText('High Confidence')).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('renders LaptopCard with hardware badges and price for non-technical users', () => {
    const handleToggleCompare = vi.fn();

    render(
      <MemoryRouter>
        <LaptopCard
          laptop={sampleLaptop}
          isCompared={false}
          onToggleCompare={handleToggleCompare}
          highlightWhy="Exceptional battery and ultra-portable 1.24kg chassis."
        />
      </MemoryRouter>
    );

    expect(screen.getByText('MacBook Air M3')).toBeInTheDocument();
    expect(screen.getByText('$1,099')).toBeInTheDocument();
    expect(screen.getByText(/Featherlight/)).toBeInTheDocument();
    expect(screen.getByText(/Exceptional battery/)).toBeInTheDocument();

    const compareBtn = screen.getByText('Compare');
    fireEvent.click(compareBtn);
    expect(handleToggleCompare).toHaveBeenCalledWith(sampleLaptop);
  });
});
