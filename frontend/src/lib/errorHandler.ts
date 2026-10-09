/**
 * errorHandler.ts
 * Translates technical error objects and HTTP error codes into clean,
 * human-readable messages in Khmer and English.
 * Strictly prevents leaking raw database queries, stack traces, or technical jargon.
 */

export function getHumanErrorMessage(error: unknown, locale: 'km' | 'en' = 'km'): string {
  const isKm = locale === 'km';

  if (!error) {
    return isKm
      ? 'មានបញ្ហាមិនបានរំពឹងទុក សូមព្យាយាមម្តងទៀត'
      : 'An unexpected issue occurred. Please try again.';
  }

  // Extract raw message string
  let rawMsg = '';
  if (typeof error === 'string') {
    rawMsg = error;
  } else if (error instanceof Error) {
    rawMsg = error.message;
  } else if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;
    rawMsg = String(errObj.message || errObj.error || '');
  }

  const lower = rawMsg.toLowerCase();

  // 1. Network / Connectivity issues
  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('econnrefused') ||
    lower.includes('timeout')
  ) {
    return isKm
      ? 'មិនអាចភ្ជាប់ទៅកាន់ប្រព័ន្ធបានទេ សូមពិនិត្យមើលបណ្តាញអ៊ីនធឺណិត ឬសាកល្បងឡើងវិញ'
      : 'Unable to connect to the clinic server. Please check your network connection and try again.';
  }

  // 2. Authentication & Authorization
  if (
    lower.includes('unauthorized') ||
    lower.includes('invalid email or password') ||
    lower.includes('jwt') ||
    lower.includes('http error 401')
  ) {
    return isKm
      ? 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ សូមពិនិត្យមើលឡើងវិញ'
      : 'Invalid email or password. Please verify your staff credentials.';
  }

  if (
    lower.includes('forbidden') ||
    lower.includes('permission') ||
    lower.includes('http error 403')
  ) {
    return isKm
      ? 'គណនីលោកអ្នកមិនមានសិទ្ធិអនុវត្តសកម្មភាពនេះទេ'
      : 'You do not have authorized permission to perform this clinical action.';
  }

  if (lower.includes('disabled') || lower.includes('inactive')) {
    return isKm
      ? 'គណនីនេះត្រូវបានផ្អាកដំណើរការ សូមទាក់ទងអ្នកគ្រប់គ្រងប្រព័ន្ធ'
      : 'This staff account has been deactivated. Please contact the clinic administrator.';
  }

  // 3. Duplicate Records
  if (
    lower.includes('duplicate') ||
    lower.includes('already exists') ||
    lower.includes('unique constraint') ||
    lower.includes('p2002')
  ) {
    return isKm
      ? 'ទិន្នន័យនេះ (ដូចជាលេខកូដ ទូរស័ព្ទ ឬអត្តសញ្ញាណប័ណ្ណ) មានរួចហើយក្នុងប្រព័ន្ធ'
      : 'A record with this information (phone, code, or identity) already exists in the system.';
  }

  // 4. Not Found
  if (
    lower.includes('not found') ||
    lower.includes('http error 404') ||
    lower.includes('p2025')
  ) {
    return isKm
      ? 'រកមិនឃើញទិន្នន័យដែលបានស្នើសុំឡើយ'
      : 'The requested medical record could not be found.';
  }

  // 5. Validation Errors
  if (
    lower.includes('validation') ||
    lower.includes('bad request') ||
    lower.includes('http error 400')
  ) {
    return isKm
      ? 'ព័ត៌មានដែលបានបញ្ចូលមិនត្រឹមត្រូវតាមទម្រង់កំណត់ សូមពិនិត្យឡើងវិញ'
      : 'Please verify the entered information. Some required fields may be incomplete or invalid.';
  }

  // 6. Server / Database Errors (500)
  if (
    lower.includes('internal server error') ||
    lower.includes('http error 500') ||
    lower.includes('prisma') ||
    lower.includes('sql')
  ) {
    return isKm
      ? 'ប្រព័ន្ធជួបបញ្ហាបច្ចេកទេសបណ្តោះអាសន្ន។ ទិន្នន័យត្រូវបានការពារ សូមព្យាយាមម្តងទៀត'
      : 'The clinic server encountered a temporary issue. Patient data is safe. Please try again.';
  }

  // 7. Fallback for clean user-provided message without brackets or code traces
  if (rawMsg.length > 0 && !rawMsg.includes('{') && !rawMsg.includes('Prisma') && !rawMsg.includes('Error:')) {
    return rawMsg;
  }

  return isKm
    ? 'ប្រតិបត្តិការមិនជោគជ័យ សូមព្យាយាមម្តងទៀត'
    : 'The operation could not be completed. Please try again.';
}
