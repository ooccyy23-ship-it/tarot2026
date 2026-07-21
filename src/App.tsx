import { useMemo, useState } from "react";
import weekdayMappings from "./data/weekdayMappings.json";
import { CoinFlipCard } from "./components/CoinFlipCard";
import { DrawSettings } from "./components/DrawSettings";
import { FinalResults } from "./components/FinalResults";
import { SequenceResults } from "./components/SequenceResults";
import { StatusMessage } from "./components/StatusMessage";
import { finalizeCoinFlip } from "./logic/flipCoin";
import { generateSequences } from "./logic/generateSequences";
import { validateSequences } from "./logic/validateSequences";
import { getSystemWeekday, getWeekdayLabel } from "./logic/weekday";
import type {
  DrawCard,
  OrientationResult,
  SequenceKey,
  SequenceResult,
  ValidationIssue,
  WeekdayKey,
  WeekdayMappings,
} from "./types/tarot";

const sequenceOrder: SequenceKey[] = ["s1", "s2", "s3", "s4", "s5"];

function formatTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function parseTimeInput(value: string): { hour: number; minute: number } | null {
  const digits = value.replace(":", "");

  if (digits.length !== 4) {
    return null;
  }

  const hour = Number(digits.slice(0, 2));
  const minute = Number(digits.slice(2, 4));

  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

function buildDrawCards(
  sequenceResult: SequenceResult,
  weekday: WeekdayKey,
  existingCards: DrawCard[] = [],
): DrawCard[] {
  const mappings = (weekdayMappings as WeekdayMappings)[weekday];

  return sequenceOrder.map((sequenceKey, index) => {
    const sequenceValue = sequenceResult.values[sequenceKey];
    const mapping = mappings.find((item) => item.sequence === sequenceValue);

    if (!mapping) {
      throw new Error(`找不到 ${getWeekdayLabel(weekday)} 的序號 ${sequenceValue} 對照資料`);
    }

    const existingCard = existingCards.find((card) => card.sequenceKey === sequenceKey);

    return {
      order: index + 1,
      sequenceKey,
      sequenceValue,
      formattedSequence: sequenceResult.formattedValues[sequenceKey],
      mapping,
      orientationResult: existingCard?.orientationResult ?? null,
    };
  });
}

function buildCopyText(drawTime: string, weekday: WeekdayKey, cards: DrawCard[]): string {
  const lines = cards.map((card) => {
    const orientation = card.orientationResult?.orientation === "upright" ? "正位" : "逆位";
    return `${card.order}. 序號${card.formattedSequence}｜${card.mapping.cardName}｜${orientation}`;
  });

  return [`抽牌時間：${drawTime}`, `對照表：${getWeekdayLabel(weekday)}`, "", ...lines].join("\n");
}

export default function App() {
  const systemWeekday = useMemo(() => getSystemWeekday(), []);
  const [timeInput, setTimeInput] = useState("");
  const [weekday, setWeekday] = useState<WeekdayKey>(systemWeekday);
  const [formError, setFormError] = useState<string | null>(null);
  const [sequenceResult, setSequenceResult] = useState<SequenceResult | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [cards, setCards] = useState<DrawCard[]>([]);
  const [activeFlipIndex, setActiveFlipIndex] = useState<number | null>(null);
  const [flipStarts, setFlipStarts] = useState<Record<number, string>>({});
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const allCoinsCompleted = cards.length > 0 && cards.every((card) => card.orientationResult?.locked);

  const handleTimeInputChange = (value: string) => {
    setTimeInput(formatTimeInput(value));
    setFormError(null);
    setCopyMessage(null);
  };

  const resetDrawState = () => {
    setSequenceResult(null);
    setValidationIssues([]);
    setCards([]);
    setActiveFlipIndex(null);
    setFlipStarts({});
    setCopyMessage(null);
  };

  const confirmResetIfNeeded = (): boolean => {
    if (cards.some((card) => card.orientationResult?.locked) || activeFlipIndex !== null) {
      return window.confirm("重新開始將清除目前五張牌的正逆位結果，是否繼續？");
    }

    return true;
  };

  const handleCalculate = () => {
    if (!confirmResetIfNeeded()) {
      return;
    }

    const parsedTime = parseTimeInput(timeInput);

    if (!parsedTime) {
      setFormError("請輸入有效時間，格式需為 HH:MM，且小時 00～23、分鐘 00～59。");
      resetDrawState();
      return;
    }

    const nextSequenceResult = generateSequences(parsedTime.hour, parsedTime.minute);
    const nextValidationIssues = validateSequences(nextSequenceResult);

    setFormError(null);
    setSequenceResult(nextSequenceResult);
    setValidationIssues(nextValidationIssues);
    setActiveFlipIndex(null);
    setFlipStarts({});
    setCopyMessage(null);

    if (nextValidationIssues.length > 0) {
      setCards([]);
      return;
    }

    setCards(buildDrawCards(nextSequenceResult, weekday));
  };

  const handleWeekdayChange = (value: WeekdayKey) => {
    setWeekday(value);
    setCopyMessage(null);

    if (sequenceResult && validationIssues.length === 0) {
      setCards((currentCards) => buildDrawCards(sequenceResult, value, currentCards));
    }
  };

  const handleStartFlip = (index: number) => {
    setActiveFlipIndex(index);
    setFlipStarts((current) => ({
      ...current,
      [index]: new Date().toISOString(),
    }));
    setCopyMessage(null);
  };

  const handleStopFlip = (index: number) => {
    setCards((currentCards) =>
      currentCards.map((card, currentIndex) => {
        if (currentIndex !== index) {
          return card;
        }

        const startedAt = flipStarts[index];

        if (!startedAt) {
          return card;
        }

        const orientationResult = finalizeCoinFlip(startedAt, card.orientationResult as OrientationResult | null);

        return {
          ...card,
          orientationResult,
        };
      }),
    );

    setActiveFlipIndex(null);
  };

  const handleRestart = () => {
    if (!confirmResetIfNeeded()) {
      return;
    }

    setTimeInput("");
    setWeekday(systemWeekday);
    setFormError(null);
    resetDrawState();
  };

  const handleCopy = async () => {
    if (!allCoinsCompleted) {
      return;
    }

    const text = buildCopyText(timeInput, weekday, cards);

    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("完整結果已複製到剪貼簿。");
    } catch (error) {
      console.error(error);
      setCopyMessage("複製失敗，請手動複製畫面內容。");
    }
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Tarot MVP</p>
        <h1>塔羅五牌抽取系統</h1>
        <p className="hero-copy">
          先計算五個序號，再依序完成五次硬幣翻轉，最後揭示完整牌組與正逆位結果。
        </p>
      </header>

      <DrawSettings
        timeInput={timeInput}
        weekday={weekday}
        systemWeekday={systemWeekday}
        error={formError}
        onTimeInputChange={handleTimeInputChange}
        onWeekdayChange={handleWeekdayChange}
        onSubmit={handleCalculate}
      />

      <SequenceResults sequenceResult={sequenceResult} validationIssues={validationIssues} />

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">步驟 3</p>
          <h2>正逆位硬幣操作</h2>
        </div>

        {validationIssues.length > 0 ? (
          <StatusMessage tone="warning" message="序號無效時，不載入牌卡結果，也不啟用硬幣操作。" />
        ) : null}

        {validationIssues.length === 0 && cards.length === 0 ? (
          <p className="placeholder-text">序號有效後，這裡會依序顯示五張待揭示的牌。</p>
        ) : null}

        {cards.length > 0 ? (
          <div className="coin-grid">
            {cards.map((card, index) => {
              const previousCardLocked = index === 0 || cards[index - 1].orientationResult?.locked;
              const canInteract = Boolean(previousCardLocked) && !card.orientationResult?.locked;

              return (
                <CoinFlipCard
                  key={card.sequenceKey}
                  card={card}
                  canInteract={canInteract}
                  isFlipping={activeFlipIndex === index}
                  onStart={() => handleStartFlip(index)}
                  onStop={() => handleStopFlip(index)}
                />
              );
            })}
          </div>
        ) : null}
      </section>

      {allCoinsCompleted ? (
        <FinalResults
          drawTime={timeInput}
          weekday={weekday}
          cards={cards}
          onCopy={handleCopy}
          onRestart={handleRestart}
        />
      ) : null}

      {copyMessage ? <StatusMessage tone="info" message={copyMessage} /> : null}
    </main>
  );
}
