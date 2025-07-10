"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { WalkForwardSettingsModalContent } from "./walk-forward-settings-modal-content"

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
  saveOptimisationInput?: (jsonSt: any, ui_data: any) => Promise<any> // API function for saving
  parsedStatement?: any // Strategy statement for API calls
  onShowWalkForwardResults?: () => void // Callback to show walk forward results
  onRunWalkForwardOptimisation?: () => void // Callback to run walk forward optimisation
  isLoading3?: boolean // Loading state for walk forward optimisation
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
  Parameters?: Record<string, any> // Add Parameters field for API format
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
  saveOptimisationInput, // API function for saving
  parsedStatement, // Strategy statement for API calls
  onShowWalkForwardResults, // Callback to show walk forward results
  onRunWalkForwardOptimisation, // Callback to run walk forward optimisation
  isLoading3, // Loading state for walk forward optimisation
}: OptimisationTabProps) {
  // Remove local states for selectedMaximiseOption and selectedAlgorithm
  // const [selectedMaximiseOption, setSelectedMaximiseOption] = useState<string>("")
  // const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("")
  const [maximiseOptions, setMaximiseOptions] = useState<string[]>([])
  const [algorithmOptions, setAlgorithmOptions] = useState<string[]>([])
  
  // Walk Forward Optimisation Settings states
  const [showWalkForwardSettingsModal, setShowWalkForwardSettingsModal] = useState(false)
  const [warmupBars, setWarmupBars] = useState("15")
  const [lookbackBars, setLookbackBars] = useState("1000")
  const [validationBars, setValidationBars] = useState("200")
  const [anchor, setAnchor] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const optimisationFormString = localStorage.getItem("optimisation_form")
      if (optimisationFormString) {
        try {
          const optimisationForm: OptimisationForm = JSON.parse(optimisationFormString)
          
          // Add null checks for arrays and objects
          const maximiseOptions = optimisationForm.maximise_options || []
          const algorithmOptions = optimisationForm.algorithm_options || []
          const algorithmDefaults = optimisationForm.algorithm_defaults || {
            population_size: 100,
            generations: 50,
            mutation_rate: 0.1,
            tournament_size: 3,
          }
          
          setMaximiseOptions(maximiseOptions)
          setAlgorithmOptions(algorithmOptions)
          setSelectedMaximiseOption(maximiseOptions[0] || "") // Use prop setter
          setSelectedAlgorithm(optimisationForm.default_algorithm || "") // Use prop setter

          // Set advanced settings from loaded data with null checks
          setPopulationSize(algorithmDefaults.population_size?.toString() || "100")
          setGenerations(algorithmDefaults.generations?.toString() || "50")
          setMutationRate(algorithmDefaults.mutation_rate?.toString() || "0.1")
          setTournamentSize(algorithmDefaults.tournament_size?.toString() || "3")
        } catch (error) {
          console.error("Error parsing optimisation_form from localStorage in OptimisationTab:", error)
        }
      }

      // Load walk forward settings from localStorage
      const walkForwardSettingsString = localStorage.getItem("walk_forward_settings")
      if (walkForwardSettingsString) {
        try {
          const walkForwardSettings = JSON.parse(walkForwardSettingsString)
          setWarmupBars(walkForwardSettings.warmup_bars?.toString() || "15")
          setLookbackBars(walkForwardSettings.lookback_bars?.toString() || "1000")
          setValidationBars(walkForwardSettings.validation_bars?.toString() || "200")
          setAnchor(walkForwardSettings.anchor !== undefined ? walkForwardSettings.anchor : true)
        } catch (error) {
          console.error("Error parsing walk_forward_settings from localStorage:", error)
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

  const handleSaveOptimisationDefaults = async () => {
    if (typeof window !== "undefined") {
      try {
        const currentOptimisationFormString = localStorage.getItem("optimisation_form")
        let currentOptimisationForm: OptimisationForm = currentOptimisationFormString
          ? JSON.parse(currentOptimisationFormString)
          : {
              parameters: [],
              maximise_options: [],
              algorithm_options: [],
              default_algorithm: "",
              algorithm_defaults: {
                population_size: 100,
                generations: 50,
                mutation_rate: 0.1,
                tournament_size: 3,
              },
            }

        // Transform parameters array to Parameters object format for the API
        const parametersObject: Record<string, any> = {}
        if (currentOptimisationForm.parameters && Array.isArray(currentOptimisationForm.parameters)) {
          currentOptimisationForm.parameters.forEach((param: any) => {
            if (param.optimise && param.encoding) {
              parametersObject[param.encoding] = {
                value: param.default, // Changed from 'default' to 'value' for backend compatibility
                ...(param.range && { range: param.range }),
                ...(param.step && { step: param.step }),
                type: param.type,
              }
            }
          })
        }

        // Preserve existing parameters and only update the fields that need to be changed
        const updatedOptimisationForm = {
          ...currentOptimisationForm, // Keep all existing data including parameters
          Parameters: parametersObject, // Add the transformed Parameters object
          maximise_options: maximiseOptions,
          default_algorithm: selectedAlgorithm,
          algorithm_options: algorithmOptions,
          algorithm_defaults: {
            population_size: Number(populationSize),
            generations: Number(generations),
            mutation_rate: Number(mutationRate),
            tournament_size: Number(tournamentSize),
          },
        }

        localStorage.setItem("optimisation_form", JSON.stringify(updatedOptimisationForm))

        // If API function and parsed statement are available, also save to backend
        if (saveOptimisationInput && parsedStatement) {
          await saveOptimisationInput(parsedStatement, updatedOptimisationForm)
        }

        // Show success message
        const successMessage = document.createElement("div")
        successMessage.className =
          "fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-[#85e1fe] text-black px-6 py-3 rounded-md shadow-lg z-50"
        successMessage.textContent = "Optimisation defaults saved successfully!"
        document.body.appendChild(successMessage)

        setTimeout(() => {
          document.body.removeChild(successMessage)
        }, 3000)
      } catch (error: any) {
        console.error("Failed to save optimisation defaults:", error)
        alert("Failed to save optimisation defaults: " + (error.message || "Unknown error"))
      }
    }
  }

  const handleSaveWalkForwardSettings = async () => {
    if (typeof window !== "undefined") {
      try {
        const walkForwardSettings = {
          warmup_bars: Number(warmupBars),
          lookback_bars: Number(lookbackBars),
          validation_bars: Number(validationBars),
          anchor: anchor,
        }

        localStorage.setItem("walk_forward_settings", JSON.stringify(walkForwardSettings))

        // If API function and parsed statement are available, also save to backend
        if (saveOptimisationInput && parsedStatement) {
          // Get current optimisation form from localStorage
          const currentOptimisationFormString = localStorage.getItem("optimisation_form")
          let currentOptimisationForm = currentOptimisationFormString
            ? JSON.parse(currentOptimisationFormString)
            : {
                parameters: [],
                maximise_options: [],
                algorithm_options: [],
                default_algorithm: "",
                algorithm_defaults: {
                  population_size: 100,
                  generations: 50,
                  mutation_rate: 0.1,
                  tournament_size: 3,
                },
              }

          // Transform parameters array to Parameters object format for the API
          const parametersObject: Record<string, any> = {}
          if (currentOptimisationForm.parameters && Array.isArray(currentOptimisationForm.parameters)) {
            currentOptimisationForm.parameters.forEach((param: any) => {
              if (param.optimise && param.encoding) {
                parametersObject[param.encoding] = {
                  value: param.default, // Changed from 'default' to 'value' for backend compatibility
                  ...(param.range && { range: param.range }),
                  ...(param.step && { step: param.step }),
                  type: param.type,
                }
              }
            })
          }

          // Add walk forward settings and Parameters object to the optimisation form
          currentOptimisationForm.walk_forward_settings = walkForwardSettings
          currentOptimisationForm.Parameters = parametersObject

          // Call the API to save the updated settings
          await saveOptimisationInput(parsedStatement, currentOptimisationForm)
        }

        // Show success message
        const successMessage = document.createElement("div")
        successMessage.className =
          "fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-[#85e1fe] text-black px-6 py-3 rounded-md shadow-lg z-50"
        successMessage.textContent = "Walk Forward settings saved successfully!"
        document.body.appendChild(successMessage)

        setTimeout(() => {
          document.body.removeChild(successMessage)
        }, 3000)

        setShowWalkForwardSettingsModal(false)
      } catch (error: any) {
        console.error("Failed to save walk forward settings:", error)
        alert("Failed to save walk forward settings: " + (error.message || "Unknown error"))
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
            <div className="flex gap-2">
              <button
                className="bg-transparent border border-[#2b2e38] text-white rounded-full px-4 py-2 text-sm"
                onClick={() => setShowAdvancedSettingsModal(true)}
              >
                Advanced Settings
              </button>
              <button
                className="bg-transparent border border-[#2b2e38] text-white rounded-full px-4 py-2 text-sm"
                onClick={() => setShowWalkForwardSettingsModal(true)}
              >
                Walk Forward Optimisation Settings
              </button>
            </div>
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
            {onShowWalkForwardResults && (
              <button 
                className="bg-transparent border border-[#2b2e38] text-white rounded-full px-6 py-2"
                onClick={onShowWalkForwardResults}
              >
                View Walk Forward Results
              </button>
            )}
          </div>
        </div>

        {/* Walk Forward Optimisation Button */}
        {onRunWalkForwardOptimisation && (
          <div className="mt-6 flex justify-end">
            <button
              className="w-1/3 py-3 bg-[#141721] text-white rounded-full hover:bg-[#6bcae2] font-medium"
              onClick={onRunWalkForwardOptimisation}
              disabled={isLoading3}
            >
              {isLoading3 ? "Running Walk Forward Optimisation..." : "Run Walk Forward Optimisation"}
            </button>
          </div>
        )}
      </div>

      {/* Walk Forward Optimisation Settings Modal */}
      {showWalkForwardSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <WalkForwardSettingsModalContent
            warmupBars={warmupBars}
            setWarmupBars={setWarmupBars}
            lookbackBars={lookbackBars}
            setLookbackBars={setLookbackBars}
            validationBars={validationBars}
            setValidationBars={setValidationBars}
            anchor={anchor}
            setAnchor={setAnchor}
            onClose={() => setShowWalkForwardSettingsModal(false)}
            onSave={handleSaveWalkForwardSettings}
          />
        </div>
      )}
    </div>
  )
}
