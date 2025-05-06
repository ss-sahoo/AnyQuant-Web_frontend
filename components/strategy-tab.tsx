"use client"

interface StrategyTabProps {
  selectedStrategy: string
  setSelectedStrategy: (strategy: string) => void
  uploadedFiles: string[]
  onFileUpload: (fileName: string) => void
}

export function StrategyTab({ selectedStrategy, setSelectedStrategy, uploadedFiles, onFileUpload }: StrategyTabProps) {
  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Select Strategy</label>
        <div className="relative">
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
            className="w-full bg-[#1E2132] border border-gray-800 rounded-md p-3 pr-10 appearance-none focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
          >
            <option value="xauscalper.py">xauscalper.py</option>
            <option value="strategy2.py">strategy2.py</option>
            <option value="strategy3.py">strategy3.py</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button className="bg-[#85e1fe] text-black px-8 py-2 rounded-full hover:bg-[#6bcae2]">Load</button>
        </div>
      </div>

      {/* <FileUploader onFileUpload={onFileUpload} /> */}

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg mb-2">Uploaded Files</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex justify-between items-center bg-[#1E2132] p-3 rounded-md">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                  <span>{file}</span>
                </div>
                <button className="text-red-500 hover:text-red-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
