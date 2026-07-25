export default {
  '*.{js,jsx,ts,tsx}': ['prettier --write', () => 'tsc --noEmit'],
  '*.{css,json,md}': ['prettier --write'],
}
