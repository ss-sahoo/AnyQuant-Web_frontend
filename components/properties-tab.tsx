"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Plus, X, Trash2 } from "lucide-react"

interface Parameter {
  id: string
  encoding: string
  optimise: boolean
  name: string
  indicator: string
  default: string
  start: string
  step: string
  stop: string
  editable: boolean
  type: "number" | "text"
  constraintGroups: number[] // Array of group indices this parameter belongs to
}

interface ConstraintGroup {
  id: number
  name: string
  parameters: string[] // Array of parameter encodings
  enabled: boolean
}

interface EquityConstraint {
  type: "Final_Equity" | "Max_Drawdown_Percent"
  min?: number
  max?: number
  enabled: boolean
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
  simple_constraints: string[][]
  Constraints: string[]
  EquityConstraints?: EquityConstraint[]
  Parameters?: Record<string, any>
}

interface PropertiesTabProps {
  parsedStatement: any
  saveOptimisationInput: (jsonSt: any, ui_data: any) => Promise<any>
}

export function PropertiesTab({ parsedStatement, saveOptimisationInput }: PropertiesTabProps) {
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [constraintGroups, setConstraintGroups] = useState<ConstraintGroup[]>([])
  const [equityConstraints, setEquityConstraints] = useState<EquityConstraint[]>([
    { type: "Final_Equity", min: undefined, max: undefined, enabled: false },
    { type: "Max_Drawdown_Percent", min: undefined, max: undefined, enabled: false }
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [showEquityConstraints, setShowEquityConstraints] = useState(false)

  // Calculate maximum number of constraint groups
  const maxConstraintGroups = Math.floor(parameters.filter(p => p.optimise).length / 2)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const optimisationFormString = localStorage.getItem("optimisation_form")
      if (optimisationFormString) {
        try {
          const optimisationForm: OptimisationForm = JSON.parse(optimisationFormString)
          
          // Map parameters
          const mappedParameters: Parameter[] = optimisationForm.parameters.map((param) => {
            const isNumberType = param.type === "number"
            const hasRange = Array.isArray(param.range) && param.range.length === 2
            const isOptimisable = param.optimise

            return {
              id: param.id,
              encoding: param.encoding,
              optimise: isOptimisable,
              name: param.name,
              indicator: param.indicator,
              default: param.default !== undefined ? param.default.toString() : "",
              start: isNumberType && hasRange && param.range?.[0] !== undefined ? param.range[0].toString() : "",
              step: isNumberType && param.step !== undefined ? param.step.toString() : "",
              stop: isNumberType && hasRange && param.range?.[1] !== undefined ? param.range[1].toString() : "",
              editable: isOptimisable && isNumberType && hasRange,
              type: param.type,
              constraintGroups: []
            }
          })
          setParameters(mappedParameters)

          // Load existing constraint groups from simple_constraints
          if (optimisationForm.simple_constraints && optimisationForm.simple_constraints.length > 0) {
            const groups: ConstraintGroup[] = optimisationForm.simple_constraints.map((group, index) => ({
              id: index,
              name: `Group ${index + 1}`,
              parameters: group,
              enabled: true
            }))
            setConstraintGroups(groups)

            // Update parameter constraint groups
            const updatedParameters = mappedParameters.map(param => ({
              ...param,
              constraintGroups: groups
                .map((group, groupIndex) => group.parameters.includes(param.encoding) ? groupIndex : -1)
                .filter(index => index !== -1)
            }))
            setParameters(updatedParameters)
          }

          // Load equity constraints
          if (optimisationForm.EquityConstraints) {
            setEquityConstraints(optimisationForm.EquityConstraints)
          }
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

  const handleInputChange = (id: string, field: keyof Parameter, value: string) => {
    setParameters((prevParams) => prevParams.map((param) => (param.id === id ? { ...param, [field]: value } : param)))
  }

  const handleParameterGroupToggle = (paramEncoding: string, groupIndex: number, checked: boolean) => {
    // Check if parameter is already in another group
    const isInOtherGroup = constraintGroups.some((group, idx) => 
      idx !== groupIndex && group.parameters.includes(paramEncoding)
    )

    if (isInOtherGroup) {
      alert("Parameter is already used in another constraint group. Remove it from the other group first.")
      return
    }

    // Update constraint groups
    setConstraintGroups(prevGroups => {
      const newGroups = [...prevGroups]
      if (checked) {
        // Add parameter to group
        if (!newGroups[groupIndex].parameters.includes(paramEncoding)) {
          newGroups[groupIndex].parameters.push(paramEncoding)
        }
      } else {
        // Remove parameter from group
        newGroups[groupIndex].parameters = newGroups[groupIndex].parameters.filter(p => p !== paramEncoding)
      }
      return newGroups
    })

    // Update parameter constraint groups
    setParameters(prevParams => 
      prevParams.map(param => {
        if (param.encoding === paramEncoding) {
          const newGroups = checked 
            ? [...param.constraintGroups, groupIndex]
            : param.constraintGroups.filter(g => g !== groupIndex)
          return { ...param, constraintGroups: newGroups }
        }
        return param
      })
    )
  }

  const addConstraintGroup = () => {
    if (constraintGroups.length >= maxConstraintGroups) {
      alert(`Maximum number of constraint groups (${maxConstraintGroups}) reached`)
      return
    }

    const newGroup: ConstraintGroup = {
      id: constraintGroups.length,
      name: `Group ${constraintGroups.length + 1}`,
      parameters: [],
      enabled: true
    }

    setConstraintGroups(prev => [...prev, newGroup])
  }

  const removeConstraintGroup = (groupIndex: number) => {
    // Remove group from all parameters
    setParameters(prevParams => 
      prevParams.map(param => ({
        ...param,
        constraintGroups: param.constraintGroups.filter(g => g !== groupIndex)
      }))
    )

    // Remove the group
    setConstraintGroups(prev => prev.filter((_, index) => index !== groupIndex))

    // Renumber remaining groups
    setConstraintGroups(prev => prev.map((group, index) => ({
      ...group,
      id: index,
      name: `Group ${index + 1}`
    })))
  }

  const toggleConstraintGroup = (groupIndex: number, enabled: boolean) => {
    setConstraintGroups(prev => 
      prev.map((group, index) => 
        index === groupIndex ? { ...group, enabled } : group
      )
    )
  }

  const handleEquityConstraintChange = (index: number, field: keyof EquityConstraint, value: any) => {
    setEquityConstraints(prev => 
      prev.map((constraint, idx) => 
        idx === index ? { ...constraint, [field]: value } : constraint
      )
    )
  }

  const getAvailableParameters = () => {
    const usedParameters = new Set<string>()
    constraintGroups.forEach(group => {
      group.parameters.forEach(param => usedParameters.add(param))
    })

    return parameters.filter(param => 
      param.optimise && !usedParameters.has(param.encoding)
    )
  }

  const canAddMoreGroups = () => {
    const optimisableParams = parameters.filter(p => p.optimise).length
    const usedParams = new Set<string>()
    constraintGroups.forEach(group => {
      group.parameters.forEach(param => usedParams.add(param))
    })
    const availableParams = optimisableParams - usedParams.size
    return constraintGroups.length < maxConstraintGroups && availableParams >= 2
  }

  const shouldShowAddGroupColumn = () => {
    return canAddMoreGroups() && constraintGroups.length < maxConstraintGroups
  }

  const handleSaveProperties = async () => {
    if (!parsedStatement) {
      alert("Strategy statement is missing. Cannot save properties.")
      return
    }

    setIsSaving(true)
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
            simple_constraints: [],
            Constraints: [],
          }

      // Update parameters
      currentOptimisationForm.parameters = parameters
        .filter((param) => param.optimise)
        .map((param) => {
          const originalParam = currentOptimisationForm.parameters.find((p) => p.id === param.id) || ({} as OptimisationFormParameter)

          let defaultValue: number | string
          if (param.type === "number") {
            const numValue = Number(param.default)
            if (param.default === "" || isNaN(numValue)) {
              defaultValue = originalParam.default !== undefined && !isNaN(Number(originalParam.default)) ? originalParam.default : 0
            } else {
              defaultValue = numValue
            }
          } else {
            defaultValue = param.default === "" ? (originalParam.default !== undefined ? originalParam.default : "") : param.default
          }

          let rangeValue: [number, number] | undefined = originalParam.range
          if (param.editable) {
            const startNum = Number(param.start)
            const stopNum = Number(param.stop)
            if (!isNaN(startNum) && !isNaN(stopNum)) {
              rangeValue = [startNum, stopNum]
            } else {
              rangeValue = originalParam.range
            }
          }

          let stepValue: number | undefined = originalParam.step
          if (param.editable) {
            const stepNum = Number(param.step)
            if (!isNaN(stepNum)) {
              stepValue = stepNum
            } else {
              stepValue = originalParam.step
            }
          }

          return {
            ...originalParam,
            id: param.id,
            encoding: param.encoding,
            name: param.name,
            indicator: param.indicator,
            optimise: param.optimise,
            default: defaultValue,
            range: rangeValue,
            step: stepValue,
            type: param.type,
          } as OptimisationFormParameter
        })

      // Build constraint groups
      const enabledGroups = constraintGroups.filter(group => group.enabled && group.parameters.length >= 2)
      currentOptimisationForm.simple_constraints = enabledGroups.map(group => group.parameters)
      currentOptimisationForm.Constraints = enabledGroups.map(group => group.parameters.join(' == '))

      // Add equity constraints
      const enabledEquityConstraints = equityConstraints.filter(constraint => constraint.enabled)
      if (enabledEquityConstraints.length > 0) {
        currentOptimisationForm.EquityConstraints = enabledEquityConstraints
      }

      // Transform parameters to Parameters object
      const parametersObject: Record<string, any> = {}
      if (currentOptimisationForm.parameters && Array.isArray(currentOptimisationForm.parameters)) {
        currentOptimisationForm.parameters.forEach((param: any) => {
          if (param.optimise && param.encoding) {
            parametersObject[param.encoding] = {
              value: param.default,
              ...(param.range && { range: param.range }),
              ...(param.step && { step: param.step }),
              type: param.type,
            }
          }
        })
      }
      currentOptimisationForm.Parameters = parametersObject

      console.log("Sending ui_data to API:", currentOptimisationForm)
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

  const optimisableParameters = parameters.filter(p => p.optimise)

  return (
    <div className="bg-[#000000] text-[#ffffff] p-4">
      <div className="w-full max-w-7xl mx-auto">
        {/* Constraint Groups Info */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              <span className="font-semibold">Constraint Groups:</span> {constraintGroups.length}/{maxConstraintGroups} | 
              <span className="ml-2">Available parameters: {getAvailableParameters().length}</span>
            </div>
            <Button
              onClick={() => setShowEquityConstraints(!showEquityConstraints)}
              className="px-4 py-2 bg-[#2b2e38] text-white rounded-md hover:bg-[#3a3e4a]"
            >
              {showEquityConstraints ? "Hide" : "Show"} Equity Constraints
            </Button>
          </div>
        </div>

        {/* Equity Constraints Section */}
        {showEquityConstraints && (
          <div className="mb-6 p-4 bg-[#1A1D2D] rounded-lg">
            <h4 className="text-md font-semibold mb-4">Equity Constraints</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equityConstraints.map((constraint, index) => (
                <div key={constraint.type} className="flex items-center gap-4 p-3 bg-[#141721] rounded">
                  <Checkbox
                    checked={constraint.enabled}
                    onCheckedChange={(checked: boolean) => 
                      handleEquityConstraintChange(index, 'enabled', checked)
                    }
                    className="border-[#85e1fe] data-[state=checked]:bg-[#85e1fe] data-[state=checked]:text-black"
                  />
                  <span className="min-w-[120px] text-sm">
                    {constraint.type === "Final_Equity" ? "Final Equity [$]" : "Max Drawdown [%]"}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={constraint.min || ""}
                      onChange={(e) => handleEquityConstraintChange(index, 'min', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-20 bg-[#2b2e38] border border-transparent rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={constraint.max || ""}
                      onChange={(e) => handleEquityConstraintChange(index, 'max', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-20 bg-[#2b2e38] border border-transparent rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parameters Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Parameters</h3>
          {constraintGroups.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm mb-4 bg-[#1A1D2D] rounded-lg">
              <p>No constraint groups defined. Click the "+" button to add constraint groups for parameter equality.</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#1A1D2D] text-white">
                  <th className="px-4 py-2 text-left">Optimise</th>
                  <th className="px-4 py-2 text-left">Parameter Name</th>
                  <th className="px-4 py-2 text-left">Variable</th>
                  <th className="px-4 py-2 text-left">Value</th>
                  <th className="px-4 py-2 text-left">Start</th>
                  <th className="px-4 py-2 text-left">Step</th>
                  <th className="px-4 py-2 text-left">Stop</th>
                  {/* Dynamic Constraint Group Columns */}
                  {constraintGroups.map((group, groupIndex) => (
                    <th key={group.id} className="px-4 py-2 text-center text-xs">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="font-semibold">{group.name}</span>
                          <Button
                            onClick={() => removeConstraintGroup(groupIndex)}
                            className="p-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                            title="Remove group"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="text-gray-400">({group.parameters.length} params)</span>
                        <Checkbox
                          checked={group.enabled}
                          onCheckedChange={(checked: boolean) => toggleConstraintGroup(groupIndex, checked)}
                          className="border-[#85e1fe] data-[state=checked]:bg-[#85e1fe] data-[state=checked]:text-black mt-1"
                        />
                      </div>
                    </th>
                  ))}
                  {/* Add Group Column */}
                  {shouldShowAddGroupColumn() && (
                    <th className="px-4 py-2 text-center">
                      <Button
                        onClick={addConstraintGroup}
                        className="p-1 bg-[#85e1fe] text-black rounded hover:bg-[#6bcae2]"
                        title="Add new constraint group"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {parameters.map((param) => (
                  <tr key={param.id} className="border-b border-[#2b2e38]">
                    <td className="px-4 py-2">
                      <Checkbox
                        checked={param.optimise}
                        onCheckedChange={(checked: boolean) => handleOptimiseChange(param.id, checked)}
                        disabled={param.type !== "number"}
                        className="border-[#85e1fe] data-[state=checked]:bg-[#85e1fe] data-[state=checked]:text-black disabled:opacity-30"
                      />
                    </td>
                    <td className="px-4 py-2">{param.name}</td>
                    <td className="px-4 py-2">{param.indicator}</td>
                    <td className="px-4 py-2">
                      {param.type === "number" ? (
                        <input
                          type="number"
                          value={param.default}
                          onChange={(e) => handleInputChange(param.id, "default", e.target.value)}
                          className="w-full bg-[#2b2e38] border border-transparent rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                        />
                      ) : (
                        <input
                          type="text"
                          value={param.default}
                          onChange={(e) => handleInputChange(param.id, "default", e.target.value)}
                          className="w-full bg-[#2b2e38] border border-transparent rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {param.editable ? (
                        <input
                          type="number"
                          value={param.start}
                          onChange={(e) => handleInputChange(param.id, "start", e.target.value)}
                          className="w-full bg-[#2b2e38] border border-transparent rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                        />
                      ) : (
                        <span className="text-[#c5c5c5]">{param.start || "-"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {param.editable ? (
                        <input
                          type="number"
                          value={param.step}
                          onChange={(e) => handleInputChange(param.id, "step", e.target.value)}
                          className="w-full bg-[#2b2e38] border border-transparent rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                        />
                      ) : (
                        <span className="text-[#c5c5c5]">{param.step || "-"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {param.editable ? (
                        <input
                          type="number"
                          value={param.stop}
                          onChange={(e) => handleInputChange(param.id, "stop", e.target.value)}
                          className="w-full bg-[#2b2e38] border border-transparent rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
                        />
                      ) : (
                        <span className="text-[#c5c5c5]">{param.stop || "-"}</span>
                      )}
                    </td>
                    {/* Dynamic Constraint Group Checkboxes */}
                    {constraintGroups.map((group, groupIndex) => (
                      <td key={group.id} className="px-4 py-2 text-center">
                        <Checkbox
                          checked={group.parameters.includes(param.encoding)}
                          onCheckedChange={(checked: boolean) => 
                            handleParameterGroupToggle(param.encoding, groupIndex, checked)
                          }
                          disabled={!param.optimise || param.constraintGroups.some(g => g !== groupIndex)}
                          className="border-[#85e1fe] data-[state=checked]:bg-[#85e1fe] data-[state=checked]:text-black disabled:opacity-30"
                        />
                      </td>
                    ))}
                    {/* Empty cell for Add Group column */}
                    {shouldShowAddGroupColumn() && (
                      <td className="px-4 py-2"></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {constraintGroups.length > 0 && (
              <div>
                <p>Active constraint groups: {constraintGroups.filter(g => g.enabled).length}</p>
                <p>Total parameters in groups: {constraintGroups.reduce((sum, group) => sum + group.parameters.length, 0)}</p>
              </div>
            )}
          </div>
          <Button
            className="px-6 py-3 bg-[#85e1fe] text-black rounded-full hover:bg-[#6bcae2]"
            onClick={handleSaveProperties}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Properties"}
          </Button>
        </div>
      </div>
    </div>
  )
}
