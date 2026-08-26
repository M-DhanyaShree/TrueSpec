/**
 * Utility functions for Indian Rupee (INR) formatting and plain-English spec descriptions
 */

export function formatINR(amount: number | string | undefined | null): string {
  if (amount == null || isNaN(Number(amount))) return '₹0';
  const num = Math.round(Number(amount));
  return '₹' + num.toLocaleString('en-IN');
}

export function formatPriceLakhs(amount: number): string {
  if (amount >= 100000) {
    const lakhs = (amount / 100000).toFixed(2);
    return `₹${lakhs} Lakh`;
  }
  return formatINR(amount);
}

/**
 * Plain-language guide for non-technical users
 */
export const SPEC_EXPLANATIONS: Record<string, { title: string; simpleDesc: string; recommendation: string }> = {
  cpu: {
    title: 'Processor (CPU)',
    simpleDesc: 'The "brain" of the computer. Dictates how quickly apps open, videos export, and programs run.',
    recommendation: 'Intel Core Ultra / i7 or AMD Ryzen 7/9 for heavy workloads; i5/Ryzen 5 for everyday work.'
  },
  gpu: {
    title: 'Graphics (GPU)',
    simpleDesc: 'Handles 3D visuals, video game rendering, and AI video editing.',
    recommendation: 'Dedicated NVIDIA RTX series for 3D gaming and video editing; Integrated graphics for everyday browsing.'
  },
  ram: {
    title: 'Memory (RAM)',
    simpleDesc: 'How many browser tabs, apps, and documents you can keep open simultaneously without lag.',
    recommendation: '16GB is the sweet spot for almost everyone; 32GB+ for developers and 4K video creators.'
  },
  storage: {
    title: 'Storage (SSD)',
    simpleDesc: 'Permanent room for all your files, photos, movies, and software.',
    recommendation: '512GB minimum for peace of mind; 1TB+ if storing lots of games and video projects.'
  },
  battery: {
    title: 'Battery Size (Wh)',
    simpleDesc: 'Watt-hours measure capacity. Higher Wh means longer cordless freedom away from power plugs.',
    recommendation: '55Wh–75Wh is great; 90Wh+ delivers all-day marathon battery.'
  },
  weight: {
    title: 'Weight & Portability',
    simpleDesc: 'How heavy the laptop feels when carried inside a backpack or bag.',
    recommendation: 'Under 1.4 kg is ultra-lightweight for college and travel; 2.2 kg+ is typical for gaming laptops.'
  },
  confidence: {
    title: 'TrueSpec Confidence Score',
    simpleDesc: 'Our statistical rating based on clean, verified user reviews with spam and bots automatically removed.',
    recommendation: 'Scores 85+ represent models with outstanding verified real-world reliability.'
  }
};
