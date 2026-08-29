'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import Editor from '@monaco-editor/react';

// JDoodle Language Mappings with file extensions and icon themes
const LANGUAGES = [
  { id: 'python3', versionIndex: '3', name: 'Python 3', ext: 'py', editorLang: 'python', defaultCode: `# Python 3.12 Solution\ndef solve():\n    print("Hello from Acin's LMS Cloud IDE!")\n\nif __name__ == "__main__":\n    solve()\n` },
  { id: 'cpp17', versionIndex: '1', name: 'C++ 17', ext: 'cpp', editorLang: 'cpp', defaultCode: `// C++17 Solution\n#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n    cout << "Hello from Acin's LMS Cloud IDE!" << endl;\n    return 0;\n}\n` },
  { id: 'nodejs', versionIndex: '4', name: 'JavaScript (Node.js)', ext: 'js', editorLang: 'javascript', defaultCode: `// JavaScript (Node.js)\nfunction main() {\n  console.log("Hello from Acin's LMS Cloud IDE!");\n}\n\nmain();\n` },
  { id: 'java', versionIndex: '4', name: 'Java', ext: 'java', editorLang: 'java', defaultCode: `// Java Solution\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Acin's LMS Cloud IDE!");\n    }\n}\n` },
  { id: 'c', versionIndex: '4', name: 'C', ext: 'c', editorLang: 'c', defaultCode: `// C Solution\n#include <stdio.h>\n\nint main() {\n    printf("Hello from Acin's LMS Cloud IDE!\\n");\n    return 0;\n}\n` },
  { id: 'csharp', versionIndex: '3', name: 'C#', ext: 'cs', editorLang: 'csharp', defaultCode: `// C# Solution\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello from Acin's LMS Cloud IDE!");\n    }\n}\n` },
  { id: 'rust', versionIndex: '4', name: 'Rust', ext: 'rs', editorLang: 'rust', defaultCode: `// Rust Solution\nfn main() {\n    println!("Hello from Acin's LMS Cloud IDE!");\n}\n` },
  { id: 'go', versionIndex: '4', name: 'Go', ext: 'go', editorLang: 'go', defaultCode: `// Go Solution\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Acin's LMS Cloud IDE!")\n}\n` },
  { id: 'sql', versionIndex: '3', name: 'SQL (SQLite)', ext: 'sql', editorLang: 'sql', defaultCode: `-- SQL Execution\nCREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, score INTEGER);\nINSERT INTO students VALUES (1, 'Alice', 98), (2, 'Bob', 87);\nSELECT * FROM students;\n` },
  { id: 'php', versionIndex: '3', name: 'PHP', ext: 'php', editorLang: 'php', defaultCode: `<?php\n// PHP Solution\necho "Hello from Acin's LMS Cloud IDE!\\n";\n?>\n` },
  { id: 'ruby', versionIndex: '3', name: 'Ruby', ext: 'rb', editorLang: 'ruby', defaultCode: `# Ruby Solution\nputs "Hello from Acin's LMS Cloud IDE!"\n` },
  { id: 'swift', versionIndex: '3', name: 'Swift', ext: 'swift', editorLang: 'swift', defaultCode: `// Swift Solution\nprint("Hello from Acin's LMS Cloud IDE!")\n` },
  { id: 'kotlin', versionIndex: '2', name: 'Kotlin', ext: 'kt', editorLang: 'kotlin', defaultCode: `// Kotlin Solution\nfun main() {\n    println("Hello from Acin's LMS Cloud IDE!")\n}\n` },
  { id: 'bash', versionIndex: '3', name: 'Bash Script', ext: 'sh', editorLang: 'shell', defaultCode: `#!/bin/bash\necho "Hello from Acin's LMS Cloud IDE!"\n` }
];

export default function IDEPage() {
  const { t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('output');
  const [copied, setCopied] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = LANGUAGES.find(l => l.id === e.target.value);
    if (lang) {
      setSelectedLang(lang);
      setCode(lang.defaultCode);
      setOutput(null);
    }
  };

  const handleResetCode = () => {
    setCode(selectedLang.defaultCode);
    setOutput(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyOutput = () => {
    if (output?.output) {
      navigator.clipboard.writeText(output.output);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  };

  const handleRun = async () => {
    if (!code.trim() || isExecuting) return;
    setIsExecuting(true);
    setActiveTab('output');
    setOutput(null);

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: selectedLang.id,
          versionIndex: selectedLang.versionIndex,
          stdin: stdin
        })
      });

      const data = await res.json();
      setOutput(data);
    } catch (err) {
      setOutput({ error: 'Failed to connect to execution server. Please try again.' });
    } finally {
      setIsExecuting(false);
    }
  };

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to Run Code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, selectedLang, stdin, isExecuting]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pt-16 text-slate-300">
      
      {/* IDE Top Command Toolbar */}
      <header className="h-14 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shadow-lg shrink-0 gap-3 z-20">
        
        {/* Left: Brand & Language Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-white/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
              &lt;/&gt;
            </div>
            <div className="hidden md:block">
              <span className="font-extrabold text-white text-sm tracking-tight">{t('ide.cloud_ide')}</span>
            </div>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <select 
              value={selectedLang.id} 
              onChange={handleLanguageChange}
              className="bg-slate-950/80 border border-white/10 hover:border-emerald-500/40 text-xs sm:text-sm font-semibold rounded-xl pl-3 pr-8 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer transition-all shadow-sm"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id} className="bg-slate-900 text-white">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size Selector */}
          <div className="hidden sm:flex items-center bg-black/40 p-1 rounded-xl border border-white/5 text-xs text-slate-400">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              title="Decrease Font Size"
              className="px-2 py-1 hover:text-white rounded-lg hover:bg-white/5 transition-colors font-bold"
            >
              A-
            </button>
            <span className="px-1.5 font-mono text-[11px] text-slate-300">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(22, fontSize + 1))}
              title="Increase Font Size"
              className="px-2 py-1 hover:text-white rounded-lg hover:bg-white/5 transition-colors font-bold"
            >
              A+
            </button>
          </div>
        </div>

        {/* Right: Actions & Run Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Reset Code */}
          <button
            onClick={handleResetCode}
            title="Reset code template"
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all text-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            title="Copy source code"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all text-xs font-medium"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Run Code Button */}
          <button 
            onClick={handleRun}
            disabled={isExecuting}
            className="group relative px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
          >
            {isExecuting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('ide.running')}</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>{t('ide.run_code')}</span>
                <span className="hidden lg:inline text-[10px] opacity-75 font-mono ml-0.5 bg-slate-950/20 px-1.5 py-0.5 rounded">
                  Ctrl+↵
                </span>
              </>
            )}
          </button>

        </div>
      </header>

      {/* Main Split Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* Monaco Editor Section */}
        <div className="flex-1 border-r border-white/10 flex flex-col min-h-[45vh] lg:min-h-0 bg-slate-950 relative">
          
          {/* File Tab Header */}
          <div className="h-9 bg-slate-900/90 border-b border-white/10 flex items-center justify-between px-4 text-xs select-none">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-t-lg border-t-2 border-emerald-400 font-mono text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>solution.{selectedLang.ext}</span>
            </div>
            
            <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
              {selectedLang.name} Runtime
            </div>
          </div>

          {/* Editor Frame */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={selectedLang.editorLang}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: fontSize,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontLigatures: true,
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                bracketPairColorization: { enabled: true },
                wordWrap: 'on'
              }}
            />
          </div>
        </div>

        {/* Input & Output Side Panel */}
        <div className="w-full lg:w-[420px] xl:w-[480px] flex flex-col bg-slate-900/40 backdrop-blur-xl border-t lg:border-t-0 border-white/10 shrink-0">
          
          {/* Panel Header Tabs */}
          <div className="h-9 bg-slate-900 border-b border-white/10 flex items-center justify-between px-3 text-xs select-none">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('output')}
                className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'output'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {t('ide.output_console')}
              </button>

              <button
                onClick={() => setActiveTab('input')}
                className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'input'
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('ide.standard_input')}
                {stdin.trim() && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </button>
            </div>

            {activeTab === 'output' && output && (
              <div className="flex items-center gap-2">
                {output.output && (
                  <button
                    onClick={handleCopyOutput}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedOutput ? 'Copied' : 'Copy'}
                  </button>
                )}
                <button
                  onClick={() => setOutput(null)}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              </div>
            )}

            {activeTab === 'input' && stdin && (
              <button
                onClick={() => setStdin('')}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Panel Content Area */}
          <div className="flex-1 flex flex-col p-4 overflow-auto font-mono text-xs sm:text-sm bg-slate-950/80">
            
            {activeTab === 'input' ? (
              <div className="flex-1 flex flex-col space-y-2">
                <p className="text-[11px] text-slate-400">
                  Provide custom input data passed to <code className="text-cyan-400">stdin</code> during execution:
                </p>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder={t('ide.enter_inputs')}
                  className="flex-1 min-h-[180px] bg-slate-900/60 border border-white/10 rounded-xl p-3 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none font-mono text-xs placeholder:text-slate-600 transition-all"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {isExecuting ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-400">
                    <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold">Compiling & Executing Code...</span>
                  </div>
                ) : !output ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2 text-center">
                    <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs">{t('ide.placeholder_output')}</p>
                    <p className="text-[11px] text-slate-600">Press Run or Ctrl+Enter to execute</p>
                  </div>
                ) : output.error ? (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-400 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Execution Error</span>
                    </div>
                    <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
                      {output.error}
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Execution Metrics Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900 border border-white/10 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 ${
                          output.statusCode === 200 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${output.statusCode === 200 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {output.statusCode === 200 ? t('ide.executed_successfully') : t('ide.execution_failed')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        {output.cpuTime && (
                          <span className="flex items-center gap-1">
                            <span className="text-slate-500">Time:</span>
                            <strong className="text-slate-300 font-mono">{output.cpuTime}s</strong>
                          </span>
                        )}
                        {output.memory && (
                          <span className="flex items-center gap-1">
                            <span className="text-slate-500">Mem:</span>
                            <strong className="text-slate-300 font-mono">{output.memory} KB</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Output Text Stream */}
                    <div className="bg-slate-900/90 border border-white/10 rounded-xl p-4 shadow-inner">
                      <pre className={`text-xs whitespace-pre-wrap leading-relaxed font-mono ${
                        output.statusCode === 200 ? 'text-emerald-300' : 'text-amber-300'
                      }`}>
                        {output.output || '<No standard output produced>'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* IDE Status Bar Footer */}
      <footer className="h-7 bg-slate-900 border-t border-white/10 px-4 flex items-center justify-between text-[11px] font-mono text-slate-500 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>JDoodle Engine Ready</span>
          </span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="hidden md:inline">{selectedLang.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">Shortcut: <strong className="text-slate-400">Ctrl + Enter</strong></span>
        </div>
      </footer>
    </div>
  );
}
