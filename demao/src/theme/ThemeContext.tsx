import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { LIGHT_THEME, DARK_THEME, ThemeType } from './index';

type ThemeContextType = {
    theme: ThemeType;
    isDark: boolean;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: LIGHT_THEME,
    isDark: false,
    toggleTheme: () => { },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Default to Light as requested
    const [isDark, setIsDark] = useState(false);

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    const theme = isDark ? DARK_THEME : LIGHT_THEME;

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
