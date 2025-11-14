// 비밀번호 해싱 및 검증을 위한 유틸리티 함수
// Cloudflare Workers 환경에서 Web Crypto API 사용

/**
 * 비밀번호를 SHA-256으로 해싱합니다
 * @param password - 원본 비밀번호
 * @returns 해싱된 비밀번호 (hex 문자열)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * 입력된 비밀번호가 해시와 일치하는지 확인합니다
 * @param password - 확인할 비밀번호
 * @param hash - 저장된 해시값
 * @returns 일치 여부
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password)
  return inputHash === hash
}

/**
 * 이메일 형식이 유효한지 검증합니다
 * @param email - 검증할 이메일
 * @returns 유효성 여부
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 비밀번호 강도를 검증합니다
 * @param password - 검증할 비밀번호
 * @returns 검증 결과 { valid: boolean, message: string }
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다' }
  }
  
  if (password.length > 100) {
    return { valid: false, message: '비밀번호는 최대 100자까지 가능합니다' }
  }
  
  // 영문, 숫자, 특수문자 중 2가지 이상 포함
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  const complexityCount = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length
  
  if (complexityCount < 2) {
    return { 
      valid: false, 
      message: '비밀번호는 영문, 숫자, 특수문자 중 2가지 이상을 포함해야 합니다' 
    }
  }
  
  return { valid: true, message: '사용 가능한 비밀번호입니다' }
}

/**
 * 이름 유효성 검증
 * @param name - 검증할 이름
 * @returns 검증 결과
 */
export function validateName(name: string): { valid: boolean; message: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: '이름을 입력해주세요' }
  }
  
  if (name.length < 2) {
    return { valid: false, message: '이름은 최소 2자 이상이어야 합니다' }
  }
  
  if (name.length > 50) {
    return { valid: false, message: '이름은 최대 50자까지 가능합니다' }
  }
  
  return { valid: true, message: '사용 가능한 이름입니다' }
}

/**
 * 전화번호 형식 검증 (선택사항)
 * @param phone - 검증할 전화번호
 * @returns 검증 결과
 */
export function validatePhone(phone: string): { valid: boolean; message: string } {
  if (!phone || phone.trim().length === 0) {
    return { valid: true, message: '전화번호는 선택사항입니다' }
  }
  
  // 숫자와 하이픈만 허용
  const phoneRegex = /^[0-9-]+$/
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: '전화번호는 숫자와 하이픈(-)만 입력 가능합니다' }
  }
  
  // 숫자만 추출하여 길이 확인
  const digitsOnly = phone.replace(/-/g, '')
  if (digitsOnly.length < 10 || digitsOnly.length > 11) {
    return { valid: false, message: '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)' }
  }
  
  return { valid: true, message: '사용 가능한 전화번호입니다' }
}
