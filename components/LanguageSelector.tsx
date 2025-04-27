// app/ayuuto/components/LanguageSelector.tsx
"use client";

import { useState } from "react";

export default function LanguageSelector() {
  const [language, setLanguage] = useState("english");
  
  // In a real app, this would update the app's locale/translations
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };
  
  return (
    <div className="relative">
      <select
        value={language}
        onChange={handleLanguageChange}
        className="block appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:border-blue-500"
      >
        <option value="english">English</option>
        <option value="somali">Somali</option>
        <option value="arabic">Arabic</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}