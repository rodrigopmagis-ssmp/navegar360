import React, { createContext, useContext, useEffect, useState } from 'react';

interface DarkModeContextType {
    isDark: boolean;
    toggle: () => void;
}

const DarkModeContext = createContext<DarkModeContextType>({
    isDark: false,
    toggle: () => { },
});

export const useDarkMode = () => useContext(DarkModeContext);

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        return localStorage.getItem('navegar360-dark') === 'true';
    });

    useEffect(() => {
        const html = document.documentElement;
        if (isDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        localStorage.setItem('navegar360-dark', String(isDark));
    }, [isDark]);

    const toggle = () => setIsDark(prev => !prev);

    return (
        <DarkModeContext.Provider value={{ isDark, toggle }}>
            {children}
        </DarkModeContext.Provider>
    );
};
