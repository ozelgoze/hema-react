const STORAGE_KEY = 'hema-onboarding-v1';

export function hasSeenOnboarding() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'done';
  } catch {
    return false;
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, 'done');
  } catch {
    // ignore
  }
}
