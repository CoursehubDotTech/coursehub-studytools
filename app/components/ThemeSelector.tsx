"use client"
import { themes } from "../themes";
import "../themes.css";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeSelector() {
    const { themeId, setThemeId } = useTheme();

    return (
        <select className="bg-zinc-50!  dark:bg-inherit! p-2 rounded-md" value={themeId} onChange={(e) => setThemeId(e.target.value)}>
            {themes.map(theme => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
            ))}
        </select>
    );
}