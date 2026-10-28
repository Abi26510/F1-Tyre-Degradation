import { useEffect, useState } from 'react';
import { ConstructorItem, DriverItem, SessionItem } from '../types/telemetry';
import { fetchConstructors, fetchDrivers, fetchSessions } from '../services/api';

export function useSessionData() {
  const [year, setYear] = useState<number>(2024);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | null>(null);
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [constructors, setConstructors] = useState<ConstructorItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load sessions when year changes
  useEffect(() => {
    let mounted = true;
    async function loadSessions() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSessions(year);
        if (mounted) {
          setSessions(data);
          if (data.length > 0) {
            // Default to first race of season (e.g. Bahrain)
            setSelectedSessionKey(data[0].session_key);
          } else {
            setSelectedSessionKey(null);
          }
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load sessions');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSessions();
    return () => { mounted = false; };
  }, [year]);

  // Load drivers and constructors when session changes
  useEffect(() => {
    if (!selectedSessionKey) return;
    let mounted = true;

    async function loadSessionParticipants() {
      try {
        setLoading(true);
        const [drvData, constrData] = await Promise.all([
          fetchDrivers(selectedSessionKey!),
          fetchConstructors(selectedSessionKey!),
        ]);
        if (mounted) {
          setDrivers(drvData);
          setConstructors(constrData);
        }
      } catch (err: any) {
        if (mounted) console.error('Failed to load session drivers/constructors:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSessionParticipants();
    return () => { mounted = false; };
  }, [selectedSessionKey]);

  const selectedSession = sessions.find((s) => s.session_key === selectedSessionKey) || null;

  return {
    year,
    setYear,
    sessions,
    selectedSessionKey,
    setSelectedSessionKey,
    selectedSession,
    drivers,
    constructors,
    loading,
    error,
  };
}
