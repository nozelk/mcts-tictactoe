import React from 'react';

export type Theme = 'dark' | 'light' | 'blue' | 'forest' | 'sunset' | 'purple' | 'ocean' | 'glass';
export type Language = 'sl' | 'en' | 'de';

interface StartScreenProps {
  theme: Theme;
  language: Language;
  onThemeChange: (theme: Theme) => void;
  onLanguageChange: (language: Language) => void;
  onStart: () => void;
}

const translations = {
  sl: {
    title: 'MCTS Tic-Tac-Toe',
    subtitle: 'Vizualizacija Monte Carlo Tree Search algoritma',
    select_language: 'Izberi jezik',
    select_theme: 'Izberi temo',
    light: '☀️ Svetla',
    dark: '🌙 Temna',
    blue: '💙 Modra',
    forest: '🌲 Gozd',
    sunset: '🌅 Zahod',
    purple: '💜 Vijolična',
    ocean: '🌊 Ocean',
    glass: '💎 Steklo',
    start_game: 'Začni igro',
  },
  en: {
    title: 'MCTS Tic-Tac-Toe',
    subtitle: 'Monte Carlo Tree Search Algorithm Visualization',
    select_language: 'Select Language',
    select_theme: 'Select Theme',
    light: '☀️ Light',
    dark: '🌙 Dark',
    blue: '💙 Blue',
    forest: '🌲 Forest',
    sunset: '🌅 Sunset',
    purple: '💜 Purple',
    ocean: '🌊 Ocean',
    glass: '💎 Glass',
    start_game: 'Start Game',
  },
  de: {
    title: 'MCTS Tic-Tac-Toe',
    subtitle: 'Monte Carlo Tree Search Algorithmus Visualisierung',
    select_language: 'Sprache wählen',
    select_theme: 'Thema wählen',
    light: '☀️ Hell',
    dark: '🌙 Dunkel',
    blue: '💙 Blau',
    forest: '🌲 Wald',
    sunset: '🌅 Abendrot',
    purple: '💜 Lila',
    ocean: '🌊 Ozean',
    glass: '💎 Glas',
    start_game: 'Spiel starten',
  }
};

export const StartScreen: React.FC<StartScreenProps> = ({
  theme,
  language,
  onThemeChange,
  onLanguageChange,
  onStart
}) => {
  const t = translations[language];

  return (
    <div className={`start-screen theme-${theme}`}>
      <div className="start-content">
        <h1 className="start-title">{t.title}</h1>
        <p className="start-subtitle">{t.subtitle}</p>
        
        <div className="start-section">
          <h2>{t.select_language}</h2>
          <div className="button-group">
            <button
              className={`lang-btn ${language === 'sl' ? 'active' : ''}`}
              onClick={() => onLanguageChange('sl')}
            >
              <span className="fi fi-si"></span>
              SI
            </button>
            <button
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => onLanguageChange('en')}
            >
              <span className="fi fi-us"></span>
              EN
            </button>
            <button
              className={`lang-btn ${language === 'de' ? 'active' : ''}`}
              onClick={() => onLanguageChange('de')}
            >
              <span className="fi fi-de"></span>
              DE
            </button>
          </div>
        </div>

        <div className="start-section">
          <h2>{t.select_theme}</h2>
          <div className="theme-pyramid">
            <div className="theme-row">
              <button
                className={`theme-btn theme-light-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => onThemeChange('light')}
              >
                {t.light}
              </button>
              <button
                className={`theme-btn theme-dark-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => onThemeChange('dark')}
              >
                {t.dark}
              </button>
              <button
                className={`theme-btn theme-blue-btn ${theme === 'blue' ? 'active' : ''}`}
                onClick={() => onThemeChange('blue')}
              >
                {t.blue}
              </button>
            </div>
            <div className="theme-row">
              <button
                className={`theme-btn theme-forest-btn ${theme === 'forest' ? 'active' : ''}`}
                onClick={() => onThemeChange('forest')}
              >
                {t.forest}
              </button>
              <button
                className={`theme-btn theme-sunset-btn ${theme === 'sunset' ? 'active' : ''}`}
                onClick={() => onThemeChange('sunset')}
              >
                {t.sunset}
              </button>
              <button
                className={`theme-btn theme-purple-btn ${theme === 'purple' ? 'active' : ''}`}
                onClick={() => onThemeChange('purple')}
              >
                {t.purple}
              </button>
            </div>
            <div className="theme-row">
              <button
                className={`theme-btn theme-ocean-btn ${theme === 'ocean' ? 'active' : ''}`}
                onClick={() => onThemeChange('ocean')}
              >
                {t.ocean}
              </button>
              <button
                className={`theme-btn theme-glass-btn ${theme === 'glass' ? 'active' : ''}`}
                onClick={() => onThemeChange('glass')}
              >
                {t.glass}
              </button>
            </div>
          </div>
        </div>

        <button className="start-btn" onClick={onStart}>
          {t.start_game}
        </button>
      </div>
    </div>
  );
};
