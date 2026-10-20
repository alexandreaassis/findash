import pb from '@/lib/pocketbase/client'
import { DreEntry, DreNote } from '@/types/dre'

export async function getDreEntries(): Promise<DreEntry[]> {
  try {
    const records = await pb.collection('dre_entries').getFullList<DreEntry>({
      sort: 'year,month',
    })
    return records
  } catch (error) {
    console.error('Erro ao buscar dados do DRE:', error)
    return []
  }
}

export async function getDreNotes(): Promise<DreNote[]> {
  try {
    const records = await pb.collection('dre_notes').getFullList<DreNote>({
      sort: 'order_num',
    })
    return records
  } catch (error) {
    console.error('Erro ao buscar notas explicativas:', error)
    return []
  }
}

export async function clearAllDreEntries(): Promise<void> {
  const records = await pb.collection('dre_entries').getFullList<{ id: string }>({
    fields: 'id',
  })
  for (const record of records) {
    await pb.collection('dre_entries').delete(record.id)
  }
}

export async function saveDreEntries(entries: DreEntry[]): Promise<number> {
  // Limpa entradas existentes para manter a planilha sincronizada
  await clearAllDreEntries()

  let count = 0
  for (const entry of entries) {
    await pb.collection('dre_entries').create(entry)
    count++
  }
  return count
}

export async function addDreNote(
  note: Omit<DreNote, 'id' | 'created' | 'updated'>,
): Promise<DreNote> {
  const record = await pb.collection('dre_notes').create<DreNote>(note)
  return record
}
