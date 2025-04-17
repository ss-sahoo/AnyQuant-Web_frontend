"use client"

import { useState } from "react"

export function PropertiesTab() {
  const [param1, setParam1] = useState("20")
  const [param2, setParam2] = useState("50")
  const [param3, setParam3] = useState("0.5")
  const [param4, setParam4] = useState("200")

  return (
    <div className="p-4">
      <h2 className="text-xl font-medium mb-6">Strategy Properties</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">General</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Strategy Name</label>
              <input
                type="text"
                value="xauscalper.py"
                readOnly
                className="w-full bg-[#1E2132] border border-gray-800 rounded-md p-3 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Author</label>
              <input
                type="text"
                value="AnyQuant User"
                readOnly
                className="w-full bg-[#1E2132] border border-gray-800 rounded-md p-3 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Win Rate</label>
              <input
                type="text"
                value="68.5%"
                readOnly
                className="w-full bg-[#1E2132] border border-gray-800 rounded-md p-3 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Profit Factor</label>
              <input
                type="text"
                value="2.34"
                readOnly
                className="w-full bg-[#1E2132] border border-gray-800 rounded-md p-3 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Drawdown</label>
              <input
                type="text"
                value="12.7%"
                readOnly
                className="w-full bg-[#1E2132] border border-gray-800 rounded-md p-3 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sharpe Ratio</label>
              <input
                type="text"
                value="1.85"
                readOnly
                className="w-full bg-[#1E2132] border border-gray-800 rounded-md p-3 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Parameters</h3>
          <div className="bg-[#1E2132] border border-gray-800 rounded-md p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Parameter 1</label>
                <input
                  type="text"
                  defaultValue={param1}
                  className="w-full bg-[#2B2E38] border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                  onChange={(e) => setParam1(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Parameter 2</label>
                <input
                  type="text"
                  defaultValue={param2}
                  className="w-full bg-[#2B2E38] border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                  onChange={(e) => setParam2(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Parameter 3</label>
                <input
                  type="text"
                  defaultValue={param3}
                  className="w-full bg-[#2B2E38] border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                  onChange={(e) => setParam3(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Parameter 4</label>
                <input
                  type="text"
                  defaultValue={param4}
                  className="w-full bg-[#2B2E38] border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                  onChange={(e) => setParam4(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button className="px-8 py-3 bg-[#85e1fe] rounded-full text-black hover:bg-[#6bcae2]">Save Changes</button>
      </div>
    </div>
  )
}
