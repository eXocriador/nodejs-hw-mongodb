export const SUBSCRIPTIONS = ['starter', 'pro', 'business'] as const;
export type Subscription = typeof SUBSCRIPTIONS[number];

export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
