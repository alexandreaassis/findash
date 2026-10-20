import pb from '@/lib/pocketbase/client'
import { AppConfig } from '@/types/dre'

const AUTH_STORAGE_KEY = 'dre_client_authenticated'
const DEFAULT_PASSWORD = 'cliente2026'

export async function verifyClientPassword(password: string): Promise<boolean> {
  const trimmed = password.trim()
  if (!trimmed) return false

  try {
    const records = await pb.collection('app_config').getFullList<AppConfig>({
      filter: 'config_key = "client_access_password"',
    })

    if (records.length > 0) {
      const stored = records[0].config_value
      return stored.trim() === trimmed
    }
  } catch (error) {
    console.warn('Erro ao consultar senha no PocketBase, usando verificação fallback:', error)
  }

  // Fallback se a coleção não responder
  return trimmed === DEFAULT_PASSWORD
}

export async function updateClientPassword(newPassword: string): Promise<boolean> {
  const trimmed = newPassword.trim()
  if (!trimmed) return false

  try {
    const records = await pb.collection('app_config').getFullList<AppConfig>({
      filter: 'config_key = "client_access_password"',
    })

    if (records.length > 0) {
      await pb.collection('app_config').update(records[0].id, {
        config_value: trimmed,
      })
      return true
    } else {
      await pb.collection('app_config').create({
        config_key: 'client_access_password',
        config_value: trimmed,
        description: 'Senha única para visualização privada da página financeira da cliente',
      })
      return true
    }
  } catch (error) {
    console.error('Falha ao atualizar senha no banco:', error)
    throw error
  }
}

export function isClientAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true'
}

export function setClientAuthenticated(auth: boolean): void {
  if (typeof window === 'undefined') return
  if (auth) {
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'true')
  } else {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
  }
}
