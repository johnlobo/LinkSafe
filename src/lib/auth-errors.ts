import { FirebaseError } from 'firebase/app';

const authMessages: Record<string, string> = {
  'auth/email-already-in-use': 'Ya existe una cuenta con este correo electrónico.',
  'auth/invalid-credential': 'El correo electrónico o la contraseña no son correctos.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/network-request-failed': 'No se ha podido conectar. Comprueba tu conexión e inténtalo de nuevo.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
  'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
  'auth/weak-password': 'La contraseña debe tener al menos seis caracteres.',
  'auth/wrong-password': 'El correo electrónico o la contraseña no son correctos.',
};

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FirebaseError) {
    return authMessages[error.code] ?? fallback;
  }
  return fallback;
}
