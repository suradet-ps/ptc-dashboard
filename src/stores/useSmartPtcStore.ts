import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  type Agenda,
  deleteAgenda as dbDeleteAgenda,
  deleteMeeting as dbDeleteMeeting,
  fetchAgendas,
  fetchMeetings,
  type Meeting,
  upsertAgenda,
  upsertMeeting,
} from '@/services/supabase-smartptc';

function toErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error';
}

export type { Agenda, Meeting };

export const useSmartPtcStore = defineStore('smartPtc', () => {
  const meetings = ref<Meeting[]>([]);
  const agendas = ref<Agenda[]>([]);
  const loading = ref(false);
  const error = ref('');

  async function loadData(): Promise<void> {
    loading.value = true;
    error.value = '';
    try {
      const [m, a] = await Promise.all([fetchMeetings(), fetchAgendas()]);
      meetings.value = m;
      agendas.value = a;
    } catch (e) {
      error.value = toErrorMessage(e);
    } finally {
      loading.value = false;
    }
  }

  function upsertLocal<T extends { id: string }>(list: T[], item: T): void {
    const index = list.findIndex((x) => x.id === item.id);
    if (index > -1) {
      list[index] = item;
    } else {
      list.push(item);
    }
  }

  async function saveMeeting(meeting: Meeting): Promise<Meeting> {
    loading.value = true;
    try {
      const saved = await upsertMeeting(meeting);
      upsertLocal(meetings.value, saved);
      return saved;
    } catch (e) {
      error.value = toErrorMessage(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function saveAgenda(agenda: Agenda): Promise<Agenda> {
    loading.value = true;
    try {
      const saved = await upsertAgenda(agenda);
      upsertLocal(agendas.value, saved);
      return saved;
    } catch (e) {
      error.value = toErrorMessage(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function removeMeeting(id: string): Promise<void> {
    try {
      await dbDeleteMeeting(id);
      meetings.value = meetings.value.filter((m) => m.id !== id);
      agendas.value = agendas.value.filter((a) => a.meetingId !== id);
    } catch (e) {
      error.value = toErrorMessage(e);
      throw e;
    }
  }

  async function removeAgenda(id: string): Promise<void> {
    try {
      await dbDeleteAgenda(id);
      agendas.value = agendas.value.filter((a) => a.id !== id);
    } catch (e) {
      error.value = toErrorMessage(e);
      throw e;
    }
  }

  function getAgendasForMeeting(meetingId: string): Agenda[] {
    return agendas.value.filter((a) => a.meetingId === meetingId);
  }

  return {
    meetings,
    agendas,
    loading,
    error,
    loadData,
    saveMeeting,
    saveAgenda,
    removeMeeting,
    removeAgenda,
    getAgendasForMeeting,
  };
});
