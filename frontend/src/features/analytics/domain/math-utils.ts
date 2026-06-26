/**
 * Calculates the mean (average) of an array of numbers.
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculates the standard deviation of an array of numbers.
 */
export function calculateStandardDeviation(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Computes Z-Scores for a series of values.
 * Returns an array of Z-Scores corresponding to each input value.
 */
export function calculateZScores(values: number[]): number[] {
  const mean = calculateMean(values);
  const stdDev = calculateStandardDeviation(values, mean);

  if (stdDev === 0) {
    return new Array(values.length).fill(0);
  }

  return values.map(val => (val - mean) / stdDev);
}

/**
 * Identifies indexes of anomaly points where the absolute Z-Score is greater than a given threshold.
 * Default threshold is 3.0 (standard statistical threshold).
 */
export function detectAnomalies(values: number[], threshold = 3.0): boolean[] {
  const zScores = calculateZScores(values);
  return zScores.map(score => Math.abs(score) > threshold);
}

/**
 * Solves a system of linear equations Ax = b using Gaussian elimination
 * with partial pivoting. Matrix A must be square (n×n), b must be n-length.
 * Returns the solution vector x.
 */
function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
        maxRow = row;
      }
    }
    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];

    const pivot = augmented[col][col];
    if (Math.abs(pivot) < 1e-12) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = augmented[row][col] / pivot;
      for (let j = col; j <= n; j++) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= augmented[i][j] * x[j];
    }
    x[i] = augmented[i][i] !== 0 ? sum / augmented[i][i] : 0;
  }
  return x;
}

/**
 * Performs polynomial regression of the given degree over the input y-values.
 * Treats array indices as x-values. Returns the predicted values for the next
 * `forecastCount` points.
 *
 * Model: y = a₀ + a₁x + a₂x² + ... + aₘxᵐ
 * Solved via ordinary least squares (X^T X)a = X^T y with Gaussian elimination.
 *
 * @param yValues Series of numbers (dependent variable).
 * @param degree Polynomial degree (1=linear, 2=quadratic, 3=cubic, etc.).
 * @param forecastCount Number of future points to predict.
 * @returns Array of predicted numbers.
 */
export function polynomialRegression(
  yValues: number[],
  degree: number,
  forecastCount: number,
): number[] {
  const n = yValues.length;
  if (n === 0) return [];
  const m = Math.min(degree, n - 1);
  if (m < 1) {
    return new Array(forecastCount).fill(yValues[0] ?? 0);
  }

  // Build X^T X matrix (m+1 × m+1) and X^T y vector
  // (X^T X)[j][k] = sum_i i^(j+k)
  // (X^T y)[j]   = sum_i i^j * y_i
  const size = m + 1;
  const sums = new Array(2 * m + 1).fill(0);
  const xySums = new Array(size).fill(0);

  for (let i = 0; i < n; i++) {
    let xi = 1;
    for (let p = 0; p <= 2 * m; p++) {
      sums[p] += xi;
      xi *= i;
    }
    xi = 1;
    for (let p = 0; p <= m; p++) {
      xySums[p] += xi * yValues[i];
      xi *= i;
    }
  }

  const A: number[][] = [];
  for (let j = 0; j < size; j++) {
    A[j] = [];
    for (let k = 0; k < size; k++) {
      A[j][k] = sums[j + k];
    }
  }

  const coefficients = gaussianElimination(A, xySums);

  const projections: number[] = [];
  for (let i = 0; i < forecastCount; i++) {
    const x = n + i;
    let xi = 1;
    let yHat = 0;
    for (let p = 0; p <= m; p++) {
      yHat += coefficients[p] * xi;
      xi *= x;
    }
    projections.push(yHat);
  }
  return projections;
}

/**
 * Calculates a polynomial regression over the input y-values (quadratic by default).
 * Treats indices as x-values. Projects future points.
 *
 * @param yValues Series of numbers (dependent variable).
 * @param forecastCount Number of future points to predict.
 * @param degree Polynomial degree (default 2 = quadratic).
 * @returns Array of predicted numbers.
 */
export function projectFutureValues(
  yValues: number[],
  forecastCount: number,
  degree = 2,
): number[] {
  return polynomialRegression(yValues, degree, forecastCount);
}
