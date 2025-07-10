// Load environment variables from .env file
import 'dotenv/config'

// Import types for scoring from the autoevals package
import type { Score, Scorer } from 'autoevals'

// Used for colored console logs
import chalk from 'chalk'

// Import a preset from lowdb for working with a JSON file-based database
import { JSONFilePreset } from 'lowdb/node'

/**
 * Represents the result of a single test run.
 */
type Run = {
  input: any // The input data passed to the task
  output: any // The output returned by the task
  expected: any // The expected result for comparison
  scores: {
    name: Score['name'] // Name of the scorer used
    score: Score['score'] // Numerical score returned by the scorer
  }[]
  createdAt?: string // Optional timestamp
}

/**
 * Represents a collection of runs (a set) and the average score.
 */
type Set = {
  runs: Run[]
  score: number // Average score for all runs in this set
  createdAt: string
}

/**
 * Represents an experiment, consisting of multiple sets.
 */
type Experiment = {
  name: string
  sets: Set[]
}

/**
 * Top-level structure of the database.
 */
type Data = {
  experiments: Experiment[]
}

// Default structure to use if results.json doesn't exist
const defaultData: Data = {
  experiments: [],
}

/**
 * Initializes and returns the JSON database using lowdb.
 */
const getDb = async () => {
  const db = await JSONFilePreset<Data>('results.json', defaultData)
  return db
}

/**
 * Calculates the average score across multiple runs.
 */
const calculateAvgScore = (runs: Run[]) => {
  const totalScores = runs.reduce((sum, run) => {
    const runAvg =
      run.scores.reduce((sum, score) => sum + score.score, 0) /
      run.scores.length
    return sum + runAvg
  }, 0)
  return totalScores / runs.length
}

/**
 * Loads an experiment by name from the database.
 */
export const loadExperiment = async (
  experimentName: string
): Promise<Experiment | undefined> => {
  const db = await getDb()
  return db.data.experiments.find((e) => e.name === experimentName)
}

/**
 * Saves a new set of runs to an experiment.
 * If the experiment doesn't exist yet, it creates a new one.
 */
export const saveSet = async (
  experimentName: string,
  runs: Omit<Run, 'createdAt'>[] // Runs without timestamps yet
) => {
  const db = await getDb()

  // Add current timestamp to each run
  const runsWithTimestamp = runs.map((run) => ({
    ...run,
    createdAt: new Date().toISOString(),
  }))

  // Create the new set with average score
  const newSet = {
    runs: runsWithTimestamp,
    score: calculateAvgScore(runsWithTimestamp),
    createdAt: new Date().toISOString(),
  }

  // Either update an existing experiment or create a new one
  const existingExperiment = db.data.experiments.find(
    (e) => e.name === experimentName
  )

  if (existingExperiment) {
    existingExperiment.sets.push(newSet)
  } else {
    db.data.experiments.push({
      name: experimentName,
      sets: [newSet],
    })
  }

  await db.write() // Persist changes to disk
}

/**
 * Main function that runs an evaluation:
 * - Executes a task on a list of inputs
 * - Applies scorers to the results
 * - Calculates and logs score changes
 * - Saves the results to the database
 */
export const runEval = async <T = any>(
  experiment: string,
  {
    task,
    data,
    scorers,
  }: {
    task: (input: any) => Promise<T> // Function that processes the input
    data: { input: any; expected?: T; reference?: string | string[] }[] // List of input/expected pairs
    scorers: Scorer<T, any>[] // List of scoring functions
  }
) => {
  // Run task and scorers for each data item
  const results = await Promise.all(
    data.map(async ({ input, expected, reference }) => {
      const results = await task(input)
      let context: string | string[]
      let output: string

      // If the task returns a context + response (like a LLM), extract both
      if (results.context) {
        context = results.context
        output = results.response
      } else {
        output = results
      }

      // Run all scorers on this result
      const scores = await Promise.all(
        scorers.map(async (scorer) => {
          const score = await scorer({
            input,
            output: results,
            expected,
            reference,
            context,
          })
          return {
            name: score.name,
            score: score.score,
          }
        })
      )

      return {
        input,
        output,
        expected,
        scores,
      }
    })
  )

  // Compare to previous experiment's latest score (if it exists)
  const previousExperiment = await loadExperiment(experiment)
  const previousScore =
    previousExperiment?.sets[previousExperiment.sets.length - 1]?.score || 0
  const currentScore = calculateAvgScore(results)
  const scoreDiff = currentScore - previousScore

  // Choose color based on improvement (green), regression (red), or no change (blue)
  const color = previousExperiment
    ? scoreDiff > 0
      ? chalk.green
      : scoreDiff < 0
        ? chalk.red
        : chalk.blue
    : chalk.blue

  // Log score comparison
  console.log(`Experiment: ${experiment}`)
  console.log(`Previous score: ${color(previousScore.toFixed(2))}`)
  console.log(`Current score: ${color(currentScore.toFixed(2))}`)
  console.log(
    `Difference: ${scoreDiff > 0 ? '+' : ''}${color(scoreDiff.toFixed(2))}`
  )
  console.log()

  // Save the evaluation results to disk
  await saveSet(experiment, results)

  return results
}
