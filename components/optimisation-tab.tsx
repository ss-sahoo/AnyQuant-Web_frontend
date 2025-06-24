"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface OptimisationTabProps {
  isLimitationsCollapsed: boolean
  setIsLimitationsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  setShowAdvancedSettingsModal: React.Dispatch<React.SetStateAction<boolean>>
  populationSize: string
  setPopulationSize: React.Dispatch<React.SetStateAction<string>>
  generations: string
  setGenerations: React.Dispatch<React.SetStateAction<string>>
  mutationRate: string
  setMutationRate: React.Dispatch<React.SetStateAction<string>>
  tournamentSize: string
  setTournamentSize: React.Dispatch<React.SetStateAction<string>>
  selectedMaximiseOption: string // New prop
  setSelectedMaximiseOption: React.Dispatch<React.SetStateAction<string>> // New prop
  selectedAlgorithm: string // New prop
  setSelectedAlgorithm: React.Dispatch<React.SetStateAction<string>> // New prop
}

interface OptimisationForm {
  parameters: any[] // Keeping it any for simplicity, but ideally use the Parameter interface from PropertiesTab
  maximise_options: string[]
  algorithm_options: string[]
  default_algorithm: string
  algorithm_defaults: {
    population_size: number
    generations: number
    mutation_rate: number
    tournament_size: number
  }
}

export function OptimisationTab({
  isLimitationsCollapsed,
  setIsLimitationsCollapsed,
  setShowAdvancedSettingsModal,
  populationSize,
  setPopulationSize,
  generations,
  setGenerations,
  mutationRate,
  setMutationRate,
  tournamentSize,
  setTournamentSize,
  selectedMaximiseOption, // Destructure new prop
  setSelectedMaximiseOption, // Destructure new prop
  selectedAlgorithm, // Destructure new prop
  setSelectedAlgorithm, // Destructure new prop
}: OptimisationTabProps) {
  // Remove local states for selectedMaximiseOption and selectedAlgorithm
  // const [selectedMaximiseOption, setSelectedMaximiseOption] = useState<string>("")
  // const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("")
  const [maximiseOptions, setMaximiseOptions] = useState<string[]>([])
  const [algorithmOptions, setAlgorithmOptions] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const optimisationFormString = localStorage.getItem("optimisation_form")
      if (optimisationFormString) {
        try {
          const optimisationForm: OptimisationForm = JSON.parse(optimisationFormString)
          setMaximiseOptions(optimisationForm.maximise_options)
          setAlgorithmOptions(optimisationForm.algorithm_options)
          setSelectedMaximiseOption(optimisationForm.maximise_options[0] || "") // Use prop setter
          setSelectedAlgorithm(optimisationForm.default_algorithm) // Use prop setter

          // Set advanced settings from loaded data
          setPopulationSize(optimisationForm.algorithm_defaults.population_size.toString())
          setGenerations(optimisationForm.algorithm_defaults.generations.toString())
          setMutationRate(optimisationForm.algorithm_defaults.mutation_rate.toString())
          setTournamentSize(optimisationForm.algorithm_defaults.tournament_size.toString())
        } catch (error) {
          console.error("Error parsing optimisation_form from localStorage in OptimisationTab:", error)
        }
      }
    }
  }, [
    setPopulationSize,
    setGenerations,
    setMutationRate,
    setTournamentSize,
    setSelectedMaximiseOption, // Add to dependency array
    setSelectedAlgorithm, // Add to dependency array
  ])

  const handleSaveOptimisationDefaults = () => {
    if (typeof window !== "undefined") {
      try {
        const currentOptimisationFormString = localStorage.getItem("optimisation_form")
        const currentOptimisationForm: OptimisationForm = currentOptimisationFormString
          ? JSON.parse(currentOptimisationFormString)
          : {
              parameters: [],
              maximise_options: [],
              algorithm_options: [],
              default_algorithm: "",
              algorithm_defaults: {
                population_size: 0,
                generations: 0,
                mutation_rate: 0,
                tournament_size: 0,
              },
            }

        // Update the relevant fields
        currentOptimisationForm.maximise_options = maximiseOptions
        currentOptimisationForm.default_algorithm = selectedAlgorithm
        currentOptimisationForm.algorithm_options = algorithmOptions // Ensure this is updated if options change
        currentOptimisationForm.algorithm_defaults = {
          population_size: Number(populationSize),
          generations: Number(generations),
          mutation_rate: Number(mutationRate),
          tournament_size: Number(tournamentSize),
        }

        localStorage.setItem("optimisation_form", JSON.stringify(currentOptimisationForm))

        // Show success message
        const successMessage = document.createElement("div")
        successMessage.className =
          "fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-[#85e1fe] text-black px-6 py-3 rounded-md shadow-lg z-50"
        successMessage.textContent = "Optimisation defaults saved successfully!"
        document.body.appendChild(successMessage)

        setTimeout(() => {
          document.body.removeChild(successMessage)
        }, 3000)
      } catch (error) {
        console.error("Failed to save optimisation defaults to localStorage:", error)
        alert("Failed to save optimisation defaults.")
      }
    }
  }

  return (
    <div className="p-4 bg-[#000000]">
      <div className="ml-[63px]">
        {/* Defaults Section */}
        <div className="mb-6">
          <h3 className="text-white text-base font-medium mb-4">Defaults</h3>

          <div className="flex justify-between items-center mb-4">
            <div className="text-white">Optimized parameter</div>
            <div className="relative">
              <select
                className="appearance-none bg-transparent text-white pr-8 focus:outline-none"
                value={selectedMaximiseOption}
                onChange={(e) => setSelectedMaximiseOption(e.target.value)}
              >
                {maximiseOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9l6 6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="genetic-algorithm"
                className="mr-2"
                checked={selectedAlgorithm === "Genetic Algorithm"}
                onChange={(e) => setSelectedAlgorithm(e.target.checked ? "Genetic Algorithm" : "Grid Search")}
              />
              <label htmlFor="genetic-algorithm" className="text-white">
                Genetic algorithm
              </label>
            </div>
            <button
              className="bg-transparent border border-[#2b2e38] text-white rounded-full px-4 py-2 text-sm"
              onClick={() => setShowAdvancedSettingsModal(true)}
            >
              Advanced Settings
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <input type="checkbox" id="duration-limit" className="mr-2" />
              <label htmlFor="duration-limit" className="text-white">
                Duration Limit
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="text"
                value="5h 30m"
                className="bg-transparent border border-[#2b2e38] text-white rounded-md px-3 py-2 w-24 text-center"
                readOnly
              />
              <button className="ml-2 bg-transparent border border-[#2b2e38] text-white rounded-md p-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="6" width="18" height="15" rx="2" stroke="white" strokeWidth="2" />
                  <path d="M3 10H21" stroke="white" strokeWidth="2" />
                  <path d="M8 3V7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M16 3V7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Limitations Section - Only show when not collapsed */}
        {!isLimitationsCollapsed && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-base font-medium">Limitations</h3>
              <h3 className="text-white text-base font-medium">Value</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <input type="checkbox" id="balance-minimum" className="mr-2" />
                  <label htmlFor="balance-minimum" className="text-white">
                    Balance minimum
                  </label>
                </div>
                <div className="text-white">200</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <input type="checkbox" id="profit-maximum" className="mr-2" />
                  <label htmlFor="profit-maximum" className="text-white">
                    Profit maximum
                  </label>
                </div>
                <div className="text-white">10000</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <input type="checkbox" id="minimal-margin" className="mr-2" />
                  <label htmlFor="minimal-margin" className="text-white">
                    Minimal margin level %
                  </label>
                </div>
                <div className="text-white">30</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <input type="checkbox" id="maximal-drawdown" className="mr-2" />
                  <label htmlFor="maximal-drawdown" className="text-white">
                    Maximal drawdown
                  </label>
                </div>
                <div className="text-white">70</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <input type="checkbox" id="consecutive-loss" className="mr-2" />
                  <label htmlFor="consecutive-loss" className="text-white">
                    Consecutive loss
                  </label>
                </div>
                <div className="text-white">500</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <input type="checkbox" id="consecutive-loss-trades" className="mr-2" />
                  <label htmlFor="consecutive-loss-trades" className="text-white">
                    Consecutive loss trades
                  </label>
                </div>
                <div className="text-white">10</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <input type="checkbox" id="consecutive-win" className="mr-2" />
                  <label htmlFor="consecutive-win" className="text-white">
                    Consecutive win
                  </label>
                </div>
                <div className="text-white">1000</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <input type="checkbox" id="consecutive-win-trades" className="mr-2" />
                  <label htmlFor="consecutive-win-trades" className="text-white">
                    Consecutive win trades
                  </label>
                </div>
                <div className="text-white">30</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <button
            className="text-white hover:text-gray-300"
            onClick={() => setIsLimitationsCollapsed(!isLimitationsCollapsed)}
          >
            {isLimitationsCollapsed ? "Expand" : "Collapse"}
          </button>
          <div className="flex space-x-2">
            <button className="bg-transparent border border-[#2b2e38] text-white rounded-full px-6 py-2">Reset</button>
            <button className="bg-[#85e1fe] text-black rounded-full px-6 py-2" onClick={handleSaveOptimisationDefaults}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
