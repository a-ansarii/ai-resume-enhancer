import React, { useState, useEffect } from 'react';
import './App.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';

const API_URL = 'http://localhost:8000';

export default function App() {

  //manages the main resume content by sections which is listed below and do the ai mock enhancement
  //summary, experience, education, skills, projects
  const [resume, setResume] = useState({
    summary: '',
    experience: '',
    education: '',
    skills: '',
    projects: ''
  });

  //Track which  tab is currently active(eg: summary, experience, education, skills, projects)
  const [activeTab, setActiveTab] = useState('summary');

  //updates the input field according to the active tab
  const [input, setInput] = useState('');

  //loading state for AI enhancement
  const [loading, setLoading] = useState(false);

  //tooglw between dark and lightmode
  const [isDark, setIsDark] = useState(false);

  // Show toast message (success/failure feedback)
  const [showToast, setShowToast] = useState('');
  const icons = {
    summary: '📝',
    experience: '💼',
    education: '🎓',
    skills: '🧠',
    projects: '📁'
  };

  //function to toggle dark mode by adding/removing 'dark' class on the html element
  useEffect(() => {

    // Apply or remove the 'dark' class from the root HTML element based on theme state
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  //function to load initial resume data from localStorage
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload-resume`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResume(data.content);
      setInput(typeof data.content[activeTab] === 'string' ? data.content[activeTab] : '');
    } catch {
      alert("❌ Upload failed");
    }
  };

  //function to handle mock AI enhanced based on the current/active tab
  const handleEnhance = async () => {
    if (input === resume[activeTab]) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai-enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: activeTab, content: input }),
      });
      const data = await res.json();
      setResume((prev) => ({ ...prev, [activeTab]: data.content }));
      setInput(data.content);
      showTemporaryToast("✅ Enhanced successfully!");
    } catch {
      alert("❌ Enhance failed");
    } finally {
      setLoading(false);
    }
  };


  //function to save the current resume data to the server
  const saveResume = async () => {
    try {
      await fetch(`${API_URL}/save-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resume),
      });
      showTemporaryToast("✅ Resume saved!");
    } catch {
      alert('❌ Save failed');
    }
  };

  const showTemporaryToast = (msg) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(''), 2500);
  };

  //function to download the current resume data as a JSON file to you local storage
  //it filters out any empty or whitespace-only fields before downloading
  const downloadJSON = () => {
    const filtered = Object.entries(resume).reduce((acc, [k, v]) => {
      if (v && v.trim() !== '') acc[k] = v.trim();
      return acc;
    }, {});
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'resume.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  //function to handle tab change and update the input field accordingly
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setInput(resume[tab]);
  };

  const inputChanged = input !== resume[activeTab];

  return (
    // <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 sm:p-10 font-inter transition-colors duration-300">

    //main body conatins the main content of the app , responsive design is used to make it look good on all devices

    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 font-inter transition-colors duration-300">

      {/* central wrapper with white/dark card , shadow, spacing etc */} 

      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 space-y-8 relative">

        {/* show toast message for success or failure feedback (on downloading) */}
        {showToast && (
          <div className="absolute top-3 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-md animate-fadeIn">
            {showToast}
          </div>
        )}

        {/* Header with title, save/download buttons and theme toggle */} 
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500 dark:from-blue-400 dark:to-purple-400">
            AI-Powered Resume Enhancer
          </h1>

          {/* this div contains the buttons to save, download and toggle theme */}
          <div className="flex flex-wrap gap-2">
            <button onClick={saveResume} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded shadow-md" aria-label="Save Resume">
              💾 Save Resume
            </button>
            <button onClick={downloadJSON} className="border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 px-4 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-gray-700" aria-label="Download JSON">
              ⬇️ Download JSON
            </button>
            <button onClick={() => setIsDark(!isDark)} className="px-4 py-1.5 border text-sm border-gray-400 dark:border-white text-gray-800 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Toggle Theme">
              {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </header>



        <section>
          <h2 className="text-xl font-semibold mb-2 pl-3 border-1-4 border-blue-500 dark:text-gray-300">1. Upload Resume</h2>
          <label htmlFor="file-upload" className="block text-center p-8 border-2 border-dashed rounded-lg cursor-pointer bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 shadow-inner" aria-label="Upload resume">
            📎 CLICK TO UPLOAD THE FILE(.pdf or .docx)
            <input type="file" id="file-upload" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
          </label>
        </section>

        {/* Edit and mock ai enhancement section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-300">2. Edit & Enhance</h2>
          <nav className="flex space-x-4 border-b border-gray-200 dark:border-gray-600 pb-2 mb-4 overflow-x-auto">
            {['summary', 'experience', 'education', 'skills', 'projects'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`capitalize text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-md transition ${
                  activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-500 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-gray-700'
                  }`}



                aria-label={`Edit ${tab}`}
              >
                <span>{icons[tab]}</span> {tab}
              </button>
            ))}
          </nav>

          {/* Textarea for editable content with save and enhance buttons */}

          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4 shadow-inner">
            <textarea
              rows={6}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm resize-y"
              placeholder={`Edit your ${activeTab} here...`}
              aria-label={`Text editor for ${activeTab}`}
            ></textarea>

            {/* Word Count */}
            <div className="text-right text-xs text-gray-500 dark:text-gray-400">
              {input.trim().split(/\s+/).filter(Boolean).length} words
            </div>

            {/* Action Buttons: Cancel, Save, Enhance */}
            <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setInput(resume[activeTab])}
                className="px-4 py-1.5 border rounded text-gray-600 dark:text-gray-300 border-gray-400 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Cancel changes"
              >
                Cancel
              </button>
              <button
                onClick={() => setResume((prev) => ({ ...prev, [activeTab]: input }))}
                disabled={!inputChanged}
                title={!inputChanged ? "No changes to save." : ""}
                className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={handleEnhance}
                disabled={loading || !inputChanged}
                title="Uses AI to rewrite your text"
                className="px-4 py-1.5 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                aria-label="Enhance with AI"
              >
                {loading && <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></span>}
                {loading ? 'Enhancing...' : 'Enhance with AI'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
