// src/services/supabase-smartptc.ts
import { supabase } from './supabase';

export type MeetingStatus = 'scheduled' | 'active' | 'completed';

export type MeetingRow = {
  id: string;
  meeting_date: string;
  title: string;
  status: MeetingStatus;
  report_url: string;
  created_at: string;
  updated_at: string;
};

export type AgendaRow = {
  id: string;
  meeting_id: string;
  title: string;
  proposer: string;
  description: string;
  resolution: string;
  created_at: string;
  updated_at: string;
};

export type Meeting = {
  id: string;
  date: string;
  title: string;
  status: MeetingStatus;
  reportUrl: string;
  lastUpdated?: string;
};

export type Agenda = {
  id: string;
  meetingId: string;
  title: string;
  proposer: string;
  description: string;
  resolution: string;
  lastUpdated?: string;
};

function meetingFromRow(row: MeetingRow): Meeting {
  return {
    id: row.id,
    date: row.meeting_date,
    title: row.title,
    status: row.status,
    reportUrl: row.report_url,
    lastUpdated: row.updated_at,
  };
}

function agendaFromRow(row: AgendaRow): Agenda {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    title: row.title,
    proposer: row.proposer,
    description: row.description,
    resolution: row.resolution,
    lastUpdated: row.updated_at,
  };
}

function meetingToRow(m: Meeting): Omit<MeetingRow, 'created_at' | 'updated_at'> {
  return {
    id: m.id,
    meeting_date: m.date,
    title: m.title,
    status: m.status,
    report_url: m.reportUrl,
  };
}

function agendaToRow(a: Agenda): Omit<AgendaRow, 'created_at' | 'updated_at'> {
  return {
    id: a.id,
    meeting_id: a.meetingId,
    title: a.title,
    proposer: a.proposer,
    description: a.description,
    resolution: a.resolution,
  };
}

export async function fetchMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('ptc_meetings')
    .select('*')
    .order('meeting_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(meetingFromRow);
}

export async function fetchAgendas(): Promise<Agenda[]> {
  const { data, error } = await supabase
    .from('ptc_agendas')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(agendaFromRow);
}

export async function upsertMeeting(meeting: Meeting): Promise<Meeting> {
  const row = meetingToRow(meeting);
  const { data, error } = await supabase
    .from('ptc_meetings')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return meetingFromRow(data);
}

export async function upsertAgenda(agenda: Agenda): Promise<Agenda> {
  const row = agendaToRow(agenda);
  const { data, error } = await supabase
    .from('ptc_agendas')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return agendaFromRow(data);
}

export async function deleteMeeting(id: string): Promise<void> {
  const { error } = await supabase.from('ptc_meetings').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteAgenda(id: string): Promise<void> {
  const { error } = await supabase.from('ptc_agendas').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
