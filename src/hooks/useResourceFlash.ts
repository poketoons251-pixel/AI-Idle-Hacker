import { useRef, useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function useResourceFlash() {
  const prevCredits = useRef(0);
  const prevReputation = useRef(0);
  const prevExperience = useRef(0);

  const [creditFlash, setCreditFlash] = useState(false);
  const [repFlash, setRepFlash] = useState(false);
  const [xpFlash, setXpFlash] = useState(false);

  const [creditPopup, setCreditPopup] = useState<number | null>(null);
  const [repPopup, setRepPopup] = useState<number | null>(null);
  const [xpPopup, setXpPopup] = useState<number | null>(null);

  const credits = useGameStore((s) => s.player?.credits ?? 0);
  const reputation = useGameStore((s) => s.player?.reputation ?? 0);
  const experience = useGameStore((s) => s.player?.experience ?? 0);

  useEffect(() => {
    if (credits > prevCredits.current) {
      const diff = credits - prevCredits.current;
      setCreditFlash(true);
      setCreditPopup(diff);
      setTimeout(() => setCreditFlash(false), 300);
      setTimeout(() => setCreditPopup(null), 1000);
    }
    prevCredits.current = credits;
  }, [credits]);

  useEffect(() => {
    if (reputation > prevReputation.current) {
      const diff = reputation - prevReputation.current;
      setRepFlash(true);
      setRepPopup(diff);
      setTimeout(() => setRepFlash(false), 300);
      setTimeout(() => setRepPopup(null), 1000);
    }
    prevReputation.current = reputation;
  }, [reputation]);

  useEffect(() => {
    if (experience > prevExperience.current) {
      const diff = experience - prevExperience.current;
      setXpFlash(true);
      setXpPopup(diff);
      setTimeout(() => setXpFlash(false), 300);
      setTimeout(() => setXpPopup(null), 1000);
    }
    prevExperience.current = experience;
  }, [experience]);

  return { creditFlash, repFlash, xpFlash, creditPopup, repPopup, xpPopup };
}
