export const THEME_COLORS = {
  light: {
    background: '#FFFFFF',
    surface: '#F3F3F3',
    surfaceAlt: '#EBEBEB',
    border: '#D0D0D0',
    text: '#201F1E',
    textSecondary: '#605E5C',
    primary: '#0078D4',
    success: '#107C10',
    warning: '#FFB900',
    error: '#D83B01',
  },
  dark: {
    background: '#1F1F1F',
    surface: '#2D2D2D',
    surfaceAlt: '#3A3A3A',
    border: '#464646',
    text: '#FFFFFF',
    textSecondary: '#B4B4B4',
    primary: '#60A5FA',
    success: '#6AE68A',
    warning: '#FFD700',
    error: '#F5646C',
  },
};

export const applyTheme = (theme: 'light' | 'dark') => {
  const colors = THEME_COLORS[theme];
  const root = document.documentElement;

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

export const getSystemTheme = (): 'light' | 'dark' => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    applyTheme(getSystemTheme());
  }
};
