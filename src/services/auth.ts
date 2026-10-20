import pb from '@/lib/pocketbase/client'
import { AppConfig } from '@/types/dre'

const AUTH_STORAGE_KEY = 'dre_client_authenticated'
const DEFAULT_CLIENT_PASSWORD = 'cliente2026'
export const DEFAULT_CLIENT_NAME = 'Cliente - 3MR Catuaí'
export const DEFAULT_ADMIN_PASSWORD = 'a3one2026'
// Hash SHA-256 de "a3one2026" como fallback quando banco estiver offline
const DEFAULT_ADMIN_HASH = '627f3a26fe58b80bef66d56569dfe81d63f90ffc741625624bd503ae524f1405'

/**
 * Calcula o hash SHA-256 de uma string usando a Web Crypto API (nativa em todos os navegadores modernos).
 */
export async function sha256Hex(plainText: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plainText)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function getClientDisplayName(): Promise<string> {
  try {
    const records = await pb.collection('app_config').getFullList<AppConfig>({
      filter: 'config_key = "client_display_name"',
    })

    if (records.length > 0 && records[0].config_value?.trim()) {
      return records[0].config_value.trim()
    }
  } catch (error) {
    console.warn('Erro ao consultar nome da empresa cliente no PocketBase, usando fallback:', error)
  }
  return DEFAULT_CLIENT_NAME
}

export async function updateClientDisplayName(newName: string): Promise<string> {
  const trimmed = newName.trim() || DEFAULT_CLIENT_NAME

  try {
    const records = await pb.collection('app_config').getFullList<AppConfig>({
      filter: 'config_key = "client_display_name"',
    })

    if (records.length > 0) {
      const updated = await pb.collection('app_config').update<AppConfig>(records[0].id, {
        config_value: trimmed,
      })
      return updated.config_value || trimmed
    } else {
      const created = await pb.collection('app_config').create<AppConfig>({
        config_key: 'client_display_name',
        config_value: trimmed,
        description: 'Nome da empresa cliente exibido nos cabeçalhos e relatórios',
      })
      return created.config_value || trimmed
    }
  } catch (error) {
    console.error('Falha ao atualizar nome da empresa no banco:', error)
    throw error
  }
}

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
  return trimmed === DEFAULT_CLIENT_PASSWORD
}

/**
 * Valida se a senha informada corresponde à senha de administração da A3ONE.
 * Compara o hash SHA-256 da senha digitada com o hash armazenado na coleção `app_config` (chave `admin_password`).
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const trimmed = password.trim()
  if (!trimmed) return false

  const computedHash = await sha256Hex(trimmed)

  try {
    const records = await pb.collection('app_config').getFullList<AppConfig>({
      filter: 'config_key = "admin_password"',
    })

    if (records.length > 0 && records[0].config_value) {
      const stored = records[0].config_value.trim().toLowerCase()
      return stored === computedHash.toLowerCase()
    }
  } catch (error) {
    console.warn('Erro ao consultar senha da A3ONE no PocketBase, usando fallback:', error)
  }

  // Fallback seguro usando hash da senha padrão A3ONE ("a3one2026")
  return computedHash.toLowerCase() === DEFAULT_ADMIN_HASH
}

/**
 * Atualiza a senha de administração da A3ONE, exigindo validação prévia da senha atual.
 */
export async function updateAdminPassword(
  currentAdminPassword: string,
  newAdminPassword: string,
): Promise<boolean> {
  const valid = await verifyAdminPassword(currentAdminPassword)
  if (!valid) {
    throw new Error('Senha de administração da A3ONE atual incorreta.')
  }

  const trimmedNew = newAdminPassword.trim()
  if (!trimmedNew || trimmedNew.length < 6) {
    throw new Error('A nova senha da A3ONE deve ter no mínimo 6 caracteres.')
  }

  const newHash = await sha256Hex(trimmedNew)

  try {
    const records = await pb.collection('app_config').getFullList<AppConfig>({
      filter: 'config_key = "admin_password"',
    })

    if (records.length > 0) {
      await pb.collection('app_config').update(records[0].id, {
        config_value: newHash,
      })
      return true
    } else {
      await pb.collection('app_config').create({
        config_key: 'admin_password',
        config_value: newHash,
        description:
          'Hash SHA-256 da senha de administração exclusiva da A3ONE para alterar configurações',
      })
      return true
    }
  } catch (error) {
    console.error('Falha ao atualizar senha de administração da A3ONE no banco:', error)
    throw error
  }
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
