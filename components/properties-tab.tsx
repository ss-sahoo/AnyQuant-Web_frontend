"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

interface Parameter {
  id: string
  optimise: boolean
  name: string
  indicator: string // Used for the 'Variable' column
  default: string // Default value (as string from input)
  start: string // Range start (as string from input)
  step: string // Step value (as string from input)
  stop: string // Range stop (as string from input)
  groupingChecked: boolean
  editable: boolean // Indicates if Start, Step, Stop are editable
  type: "number" | "text" // Added type to Parameter interface for conversion logic
}

interface OptimisationFormParameter {
  id: string
  encoding: string
  name: string
  indicator: string
  default: number | string
  type: "number" | "text"
  range?: [number, number]
  step?: number
  optimise: boolean
}

interface OptimisationForm {
  parameters: OptimisationFormParameter[]
  maximise_options: string[]
  algorithm_options: string[]
  default_algorithm: string
  algorithm_defaults: {
    population_size: number
    generations: number
    mutation_rate: number
    tournament_size: number
  }
  simple_constraints: string[][] // Changed from 'constraints: string[]'
  Constraints: string[] // Added this line
  Parameters?: Record<string, any> // Add Parameters field for API format
}

interface PropertiesTabProps {
  parsedStatement: any // The jsonSt for the API call
  saveOptimisationInput: (jsonSt: any, ui_data: any) => Promise<any> // The API function
}

export function PropertiesTab({ parsedStatement, saveOptimisationInput }: PropertiesTabProps) {
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const optimisationFormString = localStorage.getItem("optimisation_form")
      if (optimisationFormString) {
        try {
          const optimisationForm: OptimisationForm = JSON.parse(optimisationFormString)
          const mappedParameters: Parameter[] = optimisationForm.parameters.map((param) => {
            const isNumberType = param.type === "number"
            const hasRange = Array.isArray(param.range) && param.range.length === 2
            const isOptimisable = param.optimise

            return {
              id: param.id,
              optimise: isOptimisable,
              name: param.name,
              indicator: param.indicator, // Using indicator for the 'Variable' column
              default: param.default !== undefined ? param.default.toString() : "", // Ensure default is converted to string
              start: isNumberType && hasRange && param.range?.[0] !== undefined ? param.range[0].toString() : "",
              step: isNumberType && param.step !== undefined ? param.step.toString() : "",
              stop: isNumberType && hasRange && param.range?.[1] !== undefined ? param.range[1].toString() : "",
              groupingId: isOptimisable ? param.indicator : "", // Group by indicator if optimisable
              groupingChecked: false, // Default to false, user must check
              editable: isOptimisable && isNumberType && hasRange, // Editable if optimisable, number type, and has range
              type: param.type, // Store original type for conversion back
            }
          })
          setParameters(mappedParameters)
        } catch (error) {
          console.error("Error parsing optimisation_form from localStorage in PropertiesTab:", error)
        }
      }
    }
  }, [])

  const handleOptimiseChange = (id: string, checked: boolean) => {
    setParameters((prevParams) =>
      prevParams.map((param) => (param.id === id ? { ...param, optimise: checked } : param)),
    )
  }

  const handleGroupingChange = (id: string, checked: boolean) => {
    setParameters((prevParams) =>
      prevParams.map((param) => (param.id === id ? { ...param, groupingChecked: checked } : param)),
    )
  }

  const handleInputChange = (id: string, field: keyof Parameter, value: string) => {
    setParameters((prevParams) => prevParams.map((param) => (param.id === id ? { ...param, [field]: value } : param)))
  }

  const handleSaveProperties = async () => {
    if (!parsedStatement) {
      alert("Strategy statement is missing. Cannot save properties.")
      return
    }

    setIsSaving(true)
    try {
      // Retrieve the latest optimisation_form from localStorage
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
            simple_constraints: [], // Initialize simple_constraints
            Constraints: [],
          }

      // Update the parameters array in the optimisation_form
      currentOptimisationForm.parameters = parameters
        .filter((param) => param.optimise) // Only include parameters marked for optimisation
        .map((param) => {
          const originalParam =
            currentOptimisationForm.parameters.find((p) => p.id === param.id) || ({} as OptimisationFormParameter) // Ensure it's at least an empty object

          let defaultValue: number | string
          if (param.type === "number") {
            const numValue = Number(param.default)
            // If input is empty or not a valid number, try to use original default, else 0
            if (param.default === "" || isNaN(numValue)) {
              defaultValue =
                originalParam.default !== undefined && !isNaN(Number(originalParam.default)) ? originalParam.default : 0 // Fallback to 0 if original is also bad or missing
            } else {
              defaultValue = numValue
            }
          } else {
            // param.type === "text"
            // If input is empty, try to use original default, else empty string
            defaultValue =
              param.default === "" ? (originalParam.default !== undefined ? originalParam.default : "") : param.default
          }

          let rangeValue: [number, number] | undefined = originalParam.range
          if (param.editable) {
            const startNum = Number(param.start)
            const stopNum = Number(param.stop)
            if (!isNaN(startNum) && !isNaN(stopNum)) {
              rangeValue = [startNum, stopNum]
            } else {
              // If conversion fails, keep original range or set to undefined
              rangeValue = originalParam.range
            }
          }

          let stepValue: number | undefined = originalParam.step
          if (param.editable) {
            const stepNum = Number(param.step)
            if (!isNaN(stepNum)) {
              stepValue = stepNum
            } else {
              // If conversion fails, keep original step or set to undefined
              stepValue = originalParam.step
            }
          }

          return {
            ...originalParam, // Spread original properties first
            id: param.id,
            name: param.name,
            indicator: param.indicator,
            optimise: param.optimise,
            default: defaultValue,
            range: rangeValue,
            step: stepValue,
            type: param.type, // Ensure type is preserved
          } as OptimisationFormParameter
        })

      // Logic to build simple_constraints based on groupingChecked
      const selectedEncodingsForConstraints: string[] = []
      parameters.forEach((param) => {
        if (param.groupingChecked) {
          const matchedEncoding = currentOptimisationForm.parameters.find((p) => p.id === param.id)?.encoding
          if (matchedEncoding) {
            selectedEncodingsForConstraints.push(matchedEncoding)
          }
        }
      })

      const simpleConstraints: string[][] = []
      if (selectedEncodingsForConstraints.length > 1) {
        const firstElement = selectedEncodingsForConstraints[0]
        for (let i = 1; i < selectedEncodingsForConstraints.length; i++) {
          simpleConstraints.push([firstElement, selectedEncodingsForConstraints[i]])
        }
      }
      currentOptimisationForm.simple_constraints = simpleConstraints // Assign to simple_constraints

      // New logic to build the 'Constraints' array
      const formattedConstraints: string[] = simpleConstraints.map(
        ([encoding1, encoding2]) => `${encoding1} == ${encoding2}`,
      )
      currentOptimisationForm.Constraints = formattedConstraints // Assign to Constraints

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
      currentOptimisationForm.Parameters = parametersObject

      console.log("Sending ui_data to API:", currentOptimisationForm) // IMPORTANT: Check this output in your browser's console!
      await saveOptimisationInput(parsedStatement, currentOptimisationForm)

      // Show success message
      const successMessage = document.createElement("div")
      successMessage.className =
        "fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-[#85e1fe] text-black px-6 py-3 rounded-md shadow-lg z-50"
      successMessage.textContent = "Properties saved successfully!"
      document.body.appendChild(successMessage)

      setTimeout(() => {
        document.body.removeChild(successMessage)
      }, 3000)
    } catch (error: any) {
      console.error("Error saving properties:", error)
      alert("Failed to save properties: " + (error.message || "Unknown error"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className=" bg-[#000000] text-[#ffffff] p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1.5fr_1.5fr_1fr_0.8fr_0.8fr_0.8fr_1.2fr] gap-4 py-3 border-b border-[#2b2e38] text-sm font-semibold">
          <div className="pl-2">Optimise</div>
          <div>Parameter Name</div>
          <div>Variable</div>
          <div>Value</div>
          <div>Start</div>
          <div>Step</div>
          <div>Stop</div>
          <div className="pr-2">Grouping ID</div>
        </div>

        {/* Table Rows */}
        {parameters.map((param) => (
          <div
            key={param.id}
            className="grid grid-cols-[auto_1.5fr_1.5fr_1fr_0.8fr_0.8fr_0.8fr_1.2fr] gap-4 py-3 border-b border-[#2b2e38] items-center text-sm"
          >
            <div className="flex items-center justify-center pl-2">
              <Checkbox
                id={`optimise-${param.id}`}
                checked={param.optimise}
                onCheckedChange={(checked: boolean) => handleOptimiseChange(param.id, checked)}
                className="border-[#85e1fe] data-[state=checked]:bg-[#85e1fe] data-[state=checked]:text-black"
              />
            </div>
            <div>{param.name}</div>
            <div>{param.indicator}</div> {/* Displaying indicator as Variable */}
            <div>
              {param.type === "number" ? (
                <input
                  type="number" // Use type="number" for better mobile keyboard and validation
                  value={param.default}
                  onChange={(e) => handleInputChange(param.id, "default", e.target.value)}
                  className="w-full bg-[#2b2e38] border border-transparent rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                />
              ) : (
                <input
                  type="text"
                  value={param.default}
                  onChange={(e) => handleInputChange(param.id, "default", e.target.value)}
                  className="w-full bg-[#2b2e38] border border-transparent rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                />
              )}
            </div>
            <div>
              {param.editable ? (
                <input
                  type="number" // Use type="number"
                  value={param.start}
                  onChange={(e) => handleInputChange(param.id, "start", e.target.value)}
                  className="w-full bg-[#2b2e38] border border-transparent rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                />
              ) : (
                <span className="text-[#c5c5c5]">{param.start || "-"}</span>
              )}
            </div>
            <div>
              {param.editable ? (
                <input
                  type="number" // Use type="number"
                  value={param.step}
                  onChange={(e) => handleInputChange(param.id, "step", e.target.value)}
                  className="w-full bg-[#2b2e38] border border-transparent rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                />
              ) : (
                <span className="text-[#c5c5c5]">{param.step || "-"}</span>
              )}
            </div>
            <div>
              {param.editable ? (
                <input
                  type="number" // Use type="number"
                  value={param.stop}
                  onChange={(e) => handleInputChange(param.id, "stop", e.target.value)}
                  className="w-full bg-[#2b2e38] border border-transparent rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                />
              ) : (
                <span className="text-[#c5c5c5]">{param.stop || "-"}</span>
              )}
            </div>
            <div className="flex items-center gap-2 pr-2">
              <span>{param.id}</span>
              {param.id && (
                <Checkbox
                  id={`grouping-${param.id}`}
                  checked={param.groupingChecked}
                  onCheckedChange={(checked: boolean) => handleGroupingChange(param.id, checked)}
                  className="border-[#85e1fe] data-[state=checked]:bg-[#85e1fe] data-[state=checked]:text-black"
                />
              )}
            </div>
          </div>
        ))}

        {/* Footer Buttons and Collapse */}
        <div className="flex justify-between items-center mt-8">
          <button className="text-[#c5c5c5] hover:underline">Collapse</button>
          <div className="flex space-x-4">
            <Button className="px-6 py-3 bg-[#2b2e38] text-[#ffffff] rounded-full border border-[#c5c5c5] hover:bg-[#3a3e4a]">
              Group
            </Button>
            <Button
              className="px-6 py-3 bg-[#85e1fe] text-black rounded-full hover:bg-[#6bcae2]"
              onClick={handleSaveProperties}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
