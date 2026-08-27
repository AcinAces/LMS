'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';

// JDoodle Language Mappings (Comprehensive list for Free Tier)
const LANGUAGES = [
  { id: 'python3', versionIndex: '3', name: 'Python 3', editorLang: 'python', defaultCode: 'print("Hello from Python!")' },
  { id: 'nodejs', versionIndex: '4', name: 'JavaScript (Node.js)', editorLang: 'javascript', defaultCode: 'console.log("Hello from JavaScript!");' },
  { id: 'java', versionIndex: '4', name: 'Java', editorLang: 'java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}' },
  { id: 'cpp17', versionIndex: '1', name: 'C++ 17', editorLang: 'cpp', defaultCode: '#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++!" << std::endl;\n    return 0;\n}' },
  { id: 'c', versionIndex: '4', name: 'C', editorLang: 'c', defaultCode: '#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}' },
  { id: 'csharp', versionIndex: '3', name: 'C#', editorLang: 'csharp', defaultCode: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello from C#!");\n    }\n}' },
  { id: 'ruby', versionIndex: '3', name: 'Ruby', editorLang: 'ruby', defaultCode: 'puts "Hello from Ruby!"' },
  { id: 'php', versionIndex: '3', name: 'PHP', editorLang: 'php', defaultCode: '<?php\n\necho "Hello from PHP!\\n";\n?>' },
  { id: 'go', versionIndex: '4', name: 'Go', editorLang: 'go', defaultCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go!")\n}' },
  { id: 'rust', versionIndex: '4', name: 'Rust', editorLang: 'rust', defaultCode: 'fn main() {\n    println!("Hello from Rust!");\n}' },
  { id: 'swift', versionIndex: '3', name: 'Swift', editorLang: 'swift', defaultCode: 'print("Hello from Swift!")' },
  { id: 'kotlin', versionIndex: '2', name: 'Kotlin', editorLang: 'kotlin', defaultCode: 'fun main() {\n    println("Hello from Kotlin!")\n}' },
  { id: 'sql', versionIndex: '3', name: 'SQL (SQLite)', editorLang: 'sql', defaultCode: 'CREATE TABLE test (message TEXT);\nINSERT INTO test VALUES (\'Hello from SQL!\');\nSELECT * FROM test;' },
  { id: 'bash', versionIndex: '3', name: 'Bash Script', editorLang: 'shell', defaultCode: 'echo "Hello from Bash!"' }
];

export default function IDEPage() {
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = LANGUAGES.find(l => l.id === e.target.value);
    if (lang) {
      setSelectedLang(lang);
      // Optional: Ask user before overwriting code, or just overwrite if it's default
      setCode(lang.defaultCode);
    }
  };

  const handleRun = async () => {
    if (!code.trim()) return;
    setIsExecuting(true);
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
      setOutput({ error: 'Failed to connect to execution server.' });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pt-20 text-slate-300">
      
      {/* IDE Toolbar */}
      <div className="h-14 border-b border-white/10 bg-slate-900/50 px-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-emerald-400 font-bold text-lg hidden sm:block">Cloud IDE</h1>
          <select 
            value={selectedLang.id} 
            onChange={handleLanguageChange}
            className="bg-slate-800 border border-slate-700 text-sm rounded-md px-3 py-1.5 text-white outline-none focus:border-emerald-500"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleRun}
          disabled={isExecuting}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-1.5 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExecuting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Run Code
            </>
          )}
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        
        {/* Editor Section */}
        <div className="flex-1 border-r border-white/10 flex flex-col min-h-[40vh] lg:min-h-0">
          <div className="h-8 bg-slate-900 border-b border-white/10 flex items-center px-4 text-xs font-medium text-slate-400 tracking-wider">
            source_code.{selectedLang.editorLang}
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={selectedLang.editorLang}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
              }}
            />
          </div>
        </div>

        {/* Input/Output Section */}
        <div className="w-full lg:w-[400px] xl:w-[500px] flex flex-col bg-slate-900/30">
          
          {/* Custom Input (stdin) */}
          <div className="h-1/3 flex flex-col border-b border-white/10">
            <div className="h-8 bg-slate-900 border-b border-white/10 flex items-center px-4 text-xs font-medium text-slate-400 tracking-wider">
              Standard Input (stdin)
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter inputs here..."
              className="flex-1 bg-transparent resize-none outline-none p-4 text-sm text-slate-300 font-mono placeholder:text-slate-600"
            />
          </div>

          {/* Output Terminal */}
          <div className="flex-1 flex flex-col">
            <div className="h-8 bg-slate-900 border-b border-white/10 flex items-center px-4 text-xs font-medium text-slate-400 tracking-wider">
              Output Console
            </div>
            <div className="flex-1 p-4 font-mono text-sm overflow-auto break-words whitespace-pre-wrap">
              {!output ? (
                <span className="text-slate-600">Run your code to see the output here...</span>
              ) : output.error ? (
                <span className="text-red-400">{output.error}</span>
              ) : (
                <>
                  {/* Status Indicator */}
                  <div className="mb-4 text-xs border-b border-white/10 pb-2">
                    <span className={`px-2 py-0.5 rounded ${
                      output.statusCode === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {output.statusCode === 200 ? 'Executed Successfully' : 'Execution Failed'}
                    </span>
                    {output.cpuTime && <span className="ml-3 text-slate-500">Time: {output.cpuTime}s</span>}
                    {output.memory && <span className="ml-3 text-slate-500">Memory: {output.memory}KB</span>}
                  </div>
                  
                  {/* Combined Output / Error Dump */}
                  {output.output && (
                    <div className={output.statusCode === 200 ? "text-slate-300" : "text-yellow-400 mt-2"}>
                      {output.output}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
