import { cleanJson } from './json'

const SENSITIVE_FIELDS = [
    'authorization',
    'cookie',
    'vtexidclientautcookie',
    'rawheaders',
    'x-vtex-credential',
    'x-vtex-session',
]

export const cleanLog = (log: any) => {
    return cleanJson(log, SENSITIVE_FIELDS)
}
