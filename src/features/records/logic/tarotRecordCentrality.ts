import { calculateTarotCooccurrenceMatrix } from "./tarotRecordCooccurrence";
import type { ParsedTarotRecord } from "../types/tarotRecord";

export type TarotCardCentrality = {
  cardName: string;
  groupCount: number;
  degree: number;
  weightedDegree: number;
  betweenness: number;
  closeness: number;
};

export type TarotCentralityResult = {
  cards: TarotCardCentrality[];
  totalCards: number;
  connectedCards: number;
  totalGroups: number;
  maxPairCount: number;
  minimumCount: number;
};

function buildNeighbors(weights: number[][]): number[][] {
  return weights.map((row) => row.flatMap((weight, index) => weight > 0 ? [index] : []));
}

function calculateBetweenness(neighbors: number[][]): number[] {
  const nodeCount = neighbors.length;
  const scores = Array<number>(nodeCount).fill(0);

  for (let source = 0; source < nodeCount; source += 1) {
    const stack: number[] = [];
    const predecessors = Array.from({ length: nodeCount }, () => [] as number[]);
    const pathCounts = Array<number>(nodeCount).fill(0);
    const distances = Array<number>(nodeCount).fill(-1);
    const queue: number[] = [source];
    let queueIndex = 0;
    pathCounts[source] = 1;
    distances[source] = 0;

    while (queueIndex < queue.length) {
      const node = queue[queueIndex];
      queueIndex += 1;
      stack.push(node);
      neighbors[node].forEach((neighbor) => {
        if (distances[neighbor] < 0) {
          queue.push(neighbor);
          distances[neighbor] = distances[node] + 1;
        }
        if (distances[neighbor] === distances[node] + 1) {
          pathCounts[neighbor] += pathCounts[node];
          predecessors[neighbor].push(node);
        }
      });
    }

    const dependencies = Array<number>(nodeCount).fill(0);
    while (stack.length > 0) {
      const node = stack.pop() as number;
      predecessors[node].forEach((predecessor) => {
        if (pathCounts[node] === 0) return;
        dependencies[predecessor] += (pathCounts[predecessor] / pathCounts[node]) * (1 + dependencies[node]);
      });
      if (node !== source) scores[node] += dependencies[node];
    }
  }

  const normalization = nodeCount > 2 ? (nodeCount - 1) * (nodeCount - 2) : 0;
  return scores.map((score) => normalization > 0 ? score / normalization : 0);
}

function calculateHarmonicCloseness(neighbors: number[][]): number[] {
  const nodeCount = neighbors.length;
  if (nodeCount < 2) return Array<number>(nodeCount).fill(0);

  return neighbors.map((_, source) => {
    const distances = Array<number>(nodeCount).fill(-1);
    const queue: number[] = [source];
    let queueIndex = 0;
    distances[source] = 0;
    while (queueIndex < queue.length) {
      const node = queue[queueIndex];
      queueIndex += 1;
      neighbors[node].forEach((neighbor) => {
        if (distances[neighbor] >= 0) return;
        distances[neighbor] = distances[node] + 1;
        queue.push(neighbor);
      });
    }
    const reciprocalDistance = distances.reduce((total, distance, index) => (
      index === source || distance < 1 ? total : total + 1 / distance
    ), 0);
    return reciprocalDistance / (nodeCount - 1);
  });
}

export function calculateTarotCardCentrality(
  records: ParsedTarotRecord[],
  minimumCount = 1,
): TarotCentralityResult {
  const matrix = calculateTarotCooccurrenceMatrix(records, 78);
  const weights = matrix.counts.map((row) => row.map((count) => count >= minimumCount ? count : 0));
  const neighbors = buildNeighbors(weights);
  const betweenness = calculateBetweenness(neighbors);
  const closeness = calculateHarmonicCloseness(neighbors);

  const cards = matrix.cards.map((card, index) => ({
    ...card,
    degree: neighbors[index].length,
    weightedDegree: weights[index].reduce((total, count) => total + count, 0),
    betweenness: betweenness[index],
    closeness: closeness[index],
  })).sort((left, right) => right.degree - left.degree
    || right.betweenness - left.betweenness
    || right.closeness - left.closeness
    || right.weightedDegree - left.weightedDegree
    || right.groupCount - left.groupCount
    || left.cardName.localeCompare(right.cardName, "zh-Hant"));

  return {
    cards,
    totalCards: cards.length,
    connectedCards: cards.filter((card) => card.degree > 0).length,
    totalGroups: matrix.totalGroups,
    maxPairCount: matrix.maxCount,
    minimumCount,
  };
}
