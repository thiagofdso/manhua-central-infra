export const environment = {
  production: false,
  apiUrl: typeof window !== 'undefined' && window.location.port === '4200' ? 'http://localhost:8080/api' : '/api',
  googleClientId: '865929663261-6comg8ndp529qteqviqh41368kgm4q9k.apps.googleusercontent.com'
};
