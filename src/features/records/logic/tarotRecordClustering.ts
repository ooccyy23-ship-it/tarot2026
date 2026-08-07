import { calculateTarotCooccurrenceMatrix } from "./tarotRecordCooccurrence";
import type { ParsedTarotRecord } from "../types/tarotRecord";

export type TarotClusterCard = {
  cardName: string;
  groupCount: number;
};

export type TarotClusterStrongestPair = {
  firstCardName: string;
  secondCardName: string;
  count: number;
};

export type TarotCardCluster = {
  id: string;
  cards: TarotClusterCard[];
  internalWeight: number;
  strongestPair?: TarotClusterStrongestPair;
};

export type TarotClusteringResult = {
  clusters: TarotCardCluster[];
  ungroupedCards: TarotClusterCard[];
  totalCards: number;
  totalGroups: number;
  maxPairCount: number;
  minimumCount: number;
};

function communityDegree(community: number[], degrees: number[]): number {
  return community.reduce((total, node) => total + degrees[node], 0);
}

function communityEdgeWeight(first: number[], second: number[], weights: number[][]): number {
  return first.reduce((total, firstNode) => total
    + second.reduce((subtotal, secondNode) => subtotal + weights[firstNode][secondNode], 0), 0);
}

function mergeGain(first: number[], second: number[], weights: number[][], degrees: number[], totalWeight: number): number {
  const betweenWeight = communityEdgeWeight(first, second, weights);
  if (betweenWeight === 0 || totalWeight === 0) return Number.NEGATIVE_INFINITY;
  return betweenWeight / totalWeight
    - (communityDegree(first, degrees) * communityDegree(second, degrees)) / (2 * totalWeight * totalWeight);
}

function clusterId(index: number): string {
  return index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
}

export function calculateTarotCardClusters(
  records: ParsedTarotRecord[],
  minimumCount = 1,
): TarotClusteringResult {
  const matrix = calculateTarotCooccurrenceMatrix(records, 78);
  const weights = matrix.counts.map((row) => row.map((count) => count >= minimumCount ? count : 0));
  const degrees = weights.map((row) => row.reduce((total, count) => total + count, 0));
  const totalWeight = degrees.reduce((total, degree) => total + degree, 0) / 2;
  let communities = matrix.cards.map((_, index) => [index]);

  while (totalWeight > 0) {
    let bestGain = 0;
    let bestFirstIndex = -1;
    let bestSecondIndex = -1;
    for (let firstIndex = 0; firstIndex < communities.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < communities.length; secondIndex += 1) {
        const gain = mergeGain(communities[firstIndex], communities[secondIndex], weights, degrees, totalWeight);
        if (gain > bestGain + Number.EPSILON) {
          bestGain = gain;
          bestFirstIndex = firstIndex;
          bestSecondIndex = secondIndex;
        }
      }
    }
    if (bestFirstIndex < 0 || bestSecondIndex < 0) break;
    const merged = [...communities[bestFirstIndex], ...communities[bestSecondIndex]].sort((left, right) => left - right);
    communities = communities.filter((_, index) => index !== bestFirstIndex && index !== bestSecondIndex);
    communities.push(merged);
    communities.sort((left, right) => left[0] - right[0]);
  }

  const grouped = communities.filter((community) => community.length >= 2 && community.some((node) => degrees[node] > 0));
  const ungrouped = communities.filter((community) => community.length < 2 || community.every((node) => degrees[node] === 0));

  const clusters = grouped.map((community) => {
    let internalWeight = 0;
    let strongestPair: TarotClusterStrongestPair | undefined;
    community.forEach((firstNode, position) => {
      community.slice(position + 1).forEach((secondNode) => {
        const count = weights[firstNode][secondNode];
        internalWeight += count;
        if (count > 0 && (!strongestPair || count > strongestPair.count)) {
          strongestPair = {
            firstCardName: matrix.cards[firstNode].cardName,
            secondCardName: matrix.cards[secondNode].cardName,
            count,
          };
        }
      });
    });
    return {
      id: "",
      cards: community.map((node) => matrix.cards[node]),
      internalWeight,
      strongestPair,
    };
  }).sort((left, right) => {
    const leftFrequency = left.cards.reduce((total, card) => total + card.groupCount, 0);
    const rightFrequency = right.cards.reduce((total, card) => total + card.groupCount, 0);
    return rightFrequency - leftFrequency || right.internalWeight - left.internalWeight;
  }).map((cluster, index) => ({ ...cluster, id: clusterId(index) }));

  return {
    clusters,
    ungroupedCards: ungrouped.flatMap((community) => community.map((node) => matrix.cards[node])),
    totalCards: matrix.cards.length,
    totalGroups: matrix.totalGroups,
    maxPairCount: matrix.maxCount,
    minimumCount,
  };
}
