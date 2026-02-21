import { useState, useRef, useEffect } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";

import "prismjs/components/prism-clike";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css";

// Judge0 Language IDs mapping
export const LANGUAGES = [
    { id: 52, name: "C++ (GCC)" },
    { id: 48, name: "C (GCC)" },
    { id: 63, name: "JavaScript (Node.js)" },
    { id: 71, name: "Python (3.8.1)" },
    { id: 62, name: "Java (OpenJDK 13)" }
];

// Default code templates
const CODE_TEMPLATES = {
    71: `# Python 3.8.1
def solve():
    # Write your code here
    pass

if __name__ == "__main__":
    solve()`,

    62: `// Java (OpenJDK 13)
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your code here
        sc.close();
    }
}`,

    52: `// C++ (GCC)
#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}`,

    48: `// C (GCC)
#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}`,

    63: `// JavaScript (Node.js)
// Write your code here
`,
};

export default function CodeEditor({ problemId, onRun, running, results }) {

    const [languageId, setLanguageId] = useState(71);
    const [sourceCode, setSourceCode] = useState("");
    const [isUserEditing, setIsUserEditing] = useState(false);

    const textareaRef = useRef(null);

    // Load template on language change (only if user hasn't edited)
    useEffect(() => {
        if (CODE_TEMPLATES[languageId] && !isUserEditing) {
            setSourceCode(CODE_TEMPLATES[languageId]);
        }
    }, [languageId]);

    const handleRun = () => {
        if (!sourceCode.trim()) {
            alert("Please write some code first!");
            return;
        }
        onRun({ sourceCode, languageId });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Language:</label>

                    <select
                        value={languageId}
                        onChange={(e) => {
                            setLanguageId(Number(e.target.value));
                            setIsUserEditing(false);
                        }}
                        className="select select-bordered select-sm bg-white text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                        {LANGUAGES.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleRun}
                    disabled={running}
                    className={`btn btn-sm px-6 ${running
                        ? "btn-ghost text-gray-400"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                        }`}
                >
                    {running ? "Running..." : "Run Code"}
                </button>
            </div>

            {/* Editor */}
            <div className="relative">
                <Editor
                    value={sourceCode}
                    onValueChange={(code) => {
                        setSourceCode(code);
                        setIsUserEditing(true);
                    }}
                    highlight={(code) => {
                        const langMap = {
                            71: Prism.languages.python,
                            62: Prism.languages.java,
                            52: Prism.languages.cpp,
                            48: Prism.languages.c,
                            63: Prism.languages.javascript,
                        };

                        return Prism.highlight(
                            code,
                            langMap[languageId] || Prism.languages.clike,
                            "javascript"
                        );
                    }}
                    padding={16}
                    className="font-mono text-sm bg-gray-900 text-gray-100 min-h-[20rem] rounded-b-xl"
                    style={{ fontFamily: "'Fira Code', monospace", fontSize: 14 }}
                />

                {/* Line Numbers */}
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-gray-800 text-gray-500 text-xs py-4 px-2 text-right select-none border-r border-gray-700">
                    {sourceCode.split("\n").map((_, i) => (
                        <div key={i} className="leading-6">
                            {i + 1}
                        </div>
                    ))}
                </div>
            </div>

            {/* Results */}
            // Replace the entire Results section in CodeEditor.jsx with this:

            {/* Results */}
            {results && results.length > 0 && (
                <div className="border-t border-gray-200">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <h4 className="font-semibold text-gray-800">Test Results</h4>
                        <button
                            onClick={() => setResults(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Hide
                        </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                        {results.map((result, index) => {
                            const isPassed =
                                result.actualOutput === result.expectedOutput &&
                                result.status === "Accepted";

                            return (
                                <div
                                    key={index}
                                    className={`p-4 border-b border-gray-100 transition-colors ${isPassed
                                        ? "bg-emerald-50/60 hover:bg-emerald-50"
                                        : "bg-red-50/40 hover:bg-red-50/60"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${isPassed ? "bg-emerald-500" : "bg-red-500"}`}></span>
                                            <span className="font-medium text-sm text-gray-800">
                                                Test Case #{index + 1}
                                            </span>
                                        </div>
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${isPassed
                                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                : "bg-red-100 text-red-700 border-red-200"
                                                }`}
                                        >
                                            {result.status}
                                        </span>
                                    </div>

                                    {/* Input/Output Grid */}
                                    <div className="grid gap-3">
                                        {/* Input */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Input</span>
                                                <span className="text-xs text-gray-400">stdin</span>
                                            </div>
                                            <pre className="bg-gray-100 border border-gray-200 text-gray-800 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                                                {result.input || <span className="text-gray-400 italic">(empty)</span>}
                                            </pre>
                                        </div>

                                        {/* Expected Output */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expected</span>
                                                <span className="text-xs text-blue-600 font-medium">output</span>
                                            </div>
                                            <pre className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                                                {result.expectedOutput || <span className="text-blue-400 italic">(empty)</span>}
                                            </pre>
                                        </div>

                                        {/* Actual Output (only if failed) */}
                                        {/* Your Output */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Your Output</span>
                                                <span className={`text-xs font-medium ${isPassed ? "text-emerald-600" : "text-red-600"}`}>
                                                    result
                                                </span>
                                            </div>
                                            <pre className={`p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed ${isPassed
                                                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                                                    : "bg-red-50 border border-red-200 text-red-900"
                                                }`}>
                                                {result.actualOutput || <span className={`${isPassed ? "text-emerald-400" : "text-red-400"} italic`}>(empty)</span>}
                                            </pre>
                                        </div>

                                        {/* Error/Status Info */}
                                        {result.status !== "Accepted" && result.status !== "Wrong Answer" && (
                                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                <p className="text-xs text-amber-800">
                                                    <span className="font-medium">Note:</span> {result.status}
                                                    {result.time && ` • Time: ${result.time}s`}
                                                    {result.memory && ` • Memory: ${result.memory} KB`}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}