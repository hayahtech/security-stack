export const LIGHT_THEME = {
    dark: false,
    colors: {
        background: '#F0F4F8', // Gelo
        surface: '#FFFFFF',
        primary: '#F6871C',   // Laranja
        secondary: '#0C0F38', // Azul Escuro
        text: '#0C0F38',      // Azul Escuro para texto principal
        textSecondary: '#64748b',
        border: '#e2e8f0',
        danger: '#ef4444',
        success: '#10b981',
        // Specific UI elements
        cardBg: '#FFFFFF',
        inputBg: '#f1f5f9',
        placeholder: '#94a3b8'
    }
};

export const DARK_THEME = {
    dark: true,
    colors: {
        background: '#1e293b', // Slate 900
        surface: '#334155',    // Slate 800
        primary: '#10b981',    // Emerald 500
        secondary: '#3b82f6',  // Blue 500
        text: '#f8fafc',       // White/Slate 50
        textSecondary: '#94a3b8',
        border: 'rgba(255,255,255,0.05)',
        danger: '#ef4444',
        success: '#10b981',
        // Specific UI elements
        cardBg: '#334155',
        inputBg: 'rgba(0,0,0,0.2)',
        placeholder: '#64748b'
    }
};

export type ThemeType = typeof LIGHT_THEME;
